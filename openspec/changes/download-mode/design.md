# Design: download-mode

## 技术决策

### 1. HTTP Chunked 流式接收

使用原生 `fetch` + `ReadableStream` 接收流式响应，不引入额外 HTTP 客户端库。

```typescript
const response = await fetch(TTS_ENDPOINT, {
  method: 'POST',
  headers: buildHeaders(config),
  body: JSON.stringify(buildPayload(text, config)),
})

if (!response.ok || !response.body) {
  throw new Error(`API 请求失败: ${response.status}`)
}

const reader = response.body.getReader()
const decoder = new TextDecoder()
```

### 2. 响应 chunk 解析策略

API 每个 chunk 是一个完整的 JSON 对象，但网络层面的 chunk 边界不一定和 JSON 边界对齐，需要做缓冲拼接处理。

```typescript
let buffer = ''

while (true) {
  const { done, value } = await reader.read()
  if (done) break

  buffer += decoder.decode(value, { stream: true })

  // 按换行分割，尝试解析每一行
  const lines = buffer.split('\n')
  buffer = lines.pop() ?? ''  // 最后一行可能不完整，留到下次

  for (const line of lines) {
    if (!line.trim()) continue
    const json = JSON.parse(line)
    handleChunk(json)
  }
}
```

### 3. Chunk 类型处理

```typescript
function handleChunk(json: TTSChunk, audioChunks: Buffer[], bar: SingleBar, ctx: ProgressCtx) {
  if (json.code !== 0 && json.code !== 20000000) {
    throw new Error(`TTS 错误 ${json.code}: ${json.message}`)
  }

  // 音频数据块
  if (json.data) {
    const chunk = Buffer.from(json.data, 'base64')
    audioChunks.push(chunk)
    ctx.receivedBytes += chunk.length
    bar.update(ctx.percent, { receivedKB: (ctx.receivedBytes / 1024).toFixed(1) })
  }

  // 文本进度块
  if (json.sentence?.text) {
    ctx.processedChars += json.sentence.text.length
    ctx.percent = Math.min(99, Math.round(ctx.processedChars / ctx.totalChars * 100))
    bar.update(ctx.percent, { processedChars: ctx.processedChars })
  }

  // 结束标志 code=20000000
  if (json.code === 20000000) {
    bar.update(100)
    bar.stop()
  }
}
```

### 4. 进度条使用 cli-progress

```typescript
import { SingleBar, Presets } from 'cli-progress'

const bar = new SingleBar({
  format: '合成中... [{bar}] {percentage}% | {processedChars}/{totalChars}字 | 已接收 {receivedKB}KB',
  hideCursor: true,
}, Presets.shades_classic)

bar.start(100, 0, { processedChars: 0, totalChars: text.length, receivedKB: '0.0' })
```

### 5. 输出文件路径推导

```typescript
export function resolveOutputPath(inputPath: string, outputOption?: string): string {
  if (outputOption) return outputOption

  const dir  = path.dirname(inputPath)
  const base = path.basename(inputPath, path.extname(inputPath))
  return path.join(dir, `${base}.mp3`)
}
```

### 6. 请求 Header 与 Payload 构造

```typescript
function buildHeaders(config: Config): Record<string, string> {
  return {
    'Content-Type':       'application/json',
    'X-Api-App-Id':       config.api.app_id,
    'X-Api-Access-Key':   config.api.token,
    'X-Api-Resource-Id':  'seed-tts-1.0',
  }
}

function buildPayload(text: string, config: Config, overrides: Partial<TTSOptions> = {}) {
  return {
    user: { uid: 'tts-cli' },
    req_params: {
      text,
      speaker: overrides.voice ?? config.tts.voice,
      model:   overrides.model ?? config.tts.model,
      audio_params: {
        format:      overrides.format ?? config.tts.format,
        sample_rate: overrides.sampleRate ?? config.tts.sample_rate,
        bit_rate:    overrides.bitRate ?? config.tts.bit_rate,
        speech_rate: overrides.speed ?? config.tts.speed,
        loudness_rate: overrides.volume ?? config.tts.volume,
        ...(overrides.emotion ? { emotion: overrides.emotion } : {}),
        ...(overrides.emotionScale ? { emotion_scale: overrides.emotionScale } : {}),
      },
      additions: {
        disable_markdown_filter: overrides.disableMarkdownFilter ?? false,
        silence_duration: overrides.silence ?? 0,
        explicit_language: overrides.lang ?? config.tts.lang,
      },
    },
  }
}
```

## 文件结构

```
src/
├── tts.ts       # runDownloadMode(), fetchTTS(), handleChunk(), buildHeaders(), buildPayload()
├── markdown.ts  # readInputFile(), detectMarkdown()
└── cli.ts       # defineCommand()，参数声明
```
