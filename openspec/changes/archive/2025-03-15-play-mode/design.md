# Design: play-mode

## 技术决策

### 1. 强制使用 PCM 格式请求

`--play` 模式下忽略用户的 `--format` 参数，强制请求 PCM 格式。PCM 是原始音频字节流，无文件头，每个 chunk 可以直接送入播放器，实现真正的边收边播。

```typescript
const format = args.play ? 'pcm' : (args.format ?? config.tts.format);
```

### 2. ffplay 作为 PCM 播放器

通过 `spawn` 启动 ffplay 子进程，将 PCM 数据通过 stdin 管道实时喂入：

```typescript
import { spawn } from 'child_process';

const player = spawn(
  'ffplay',
  [
    '-f',
    's16le', // 16bit 小端 PCM
    '-ar',
    '24000', // 采样率，与 API 请求一致
    '-ac',
    '1', // 单声道
    '-nodisp', // 不显示视频窗口
    '-autoexit', // 播放完自动退出
    '-', // 从 stdin 读取
  ],
  { stdio: ['pipe', 'ignore', 'ignore'] }
);
```

### 3. 流式 chunk 同时写入 ffplay 和 buffer

```typescript
export async function runPlayMode(
  text: string,
  config: Config,
  opts: { save: boolean }
): Promise<void> {
  assertFfmpeg('play-save');

  const player = spawnFfplay(config.tts.sample_rate);
  const pcmChunks: Buffer[] = [];

  const response = await fetchTTS(text, config, { format: 'pcm' });
  const reader = response.body!.getReader();

  // 进度条
  const bar = createProgressBar(text.length);

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    for (const json of parseChunks(value)) {
      if (json.data) {
        const chunk = Buffer.from(json.data, 'base64');
        player.stdin.write(chunk); // 实时播放
        if (opts.save) pcmChunks.push(chunk); // 同时累积
      }
      updateProgress(bar, json, text.length);
    }
  }

  player.stdin.end();

  // 等待 ffplay 真正播放完毕，再转码
  await new Promise<void>((resolve) => player.on('close', resolve));

  if (opts.save) {
    const outputPath = resolveOutputPath(/* ... */);
    await convertPCMtoMP3(
      Buffer.concat(pcmChunks),
      outputPath,
      config.tts.sample_rate
    );
    console.log(`\n✓ 已保存到 ${outputPath}`);
  }
}
```

### 4. 等待 ffplay 进程退出后再转码

关键：`player.stdin.end()` 只是关闭了写入端，ffplay 还在消耗缓冲区里的剩余数据。必须等待 `close` 事件才代表播放真正结束，此时才开始 ffmpeg 转码，避免用户看到"已保存"但还没播完的体验割裂。

### 5. PCM → MP3 转码

```typescript
// src/utils.ts
import { spawnSync } from 'child_process';

export async function convertPCMtoMP3(
  pcm: Buffer,
  outputPath: string,
  sampleRate: number = 24000
): Promise<void> {
  const result = spawnSync(
    'ffmpeg',
    [
      '-f',
      's16le',
      '-ar',
      String(sampleRate),
      '-ac',
      '1',
      '-i',
      'pipe:0',
      '-y', // 覆盖已存在的文件
      outputPath,
    ],
    { input: pcm }
  );

  if (result.status !== 0) {
    throw new Error('ffmpeg 转码失败：' + result.stderr?.toString());
  }
}
```

### 6. --no-save 参数校验

在 CLI 入口处做参数合法性校验，不在 `runPlayMode` 内部处理：

```typescript
if (args.noSave && !args.play) {
  console.error('✗ --no-save 必须配合 --play 使用');
  process.exit(1);
}
```

### 7. 采样率一致性

ffplay 启动参数中的 `-ar` 值必须与 API 请求中的 `sample_rate` 保持一致，两者均从 `config.tts.sample_rate` 读取，不允许各自独立设置。

## 文件结构

```
src/
├── tts.ts     # runPlayMode()，复用 fetchTTS()、parseChunks()、updateProgress()
└── utils.ts   # convertPCMtoMP3()，spawnFfplay()
```
