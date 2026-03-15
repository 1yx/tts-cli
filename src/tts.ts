import { log } from '@clack/prompts'
import cliProgress from 'cli-progress'
import type { Config } from './config.js'
import { readInputFile, resolveOutputPath } from './markdown.js'

import { spawnFfplay, convertPCMtoMP3 } from './utils.js'
import { assertFfmpeg } from './env.js'

const TTS_ENDPOINT = 'https://openspeech.bytedance.com/api/v3/tts/unidirectional'

export interface TTSOptions {
  output?: string
  voice?: string
  model?: string
  speed?: number
  volume?: number
  emotion?: string
  emotionScale?: number
  format?: 'mp3' | 'pcm' | 'ogg_opus'
  sampleRate?: number
  bitRate?: number
  lang?: string
  silence?: number
  disableMarkdownFilter?: boolean
}

interface TTSChunk {
  code: number
  message?: string
  data?: string | null
  sentence?: {
    text: string
    words: unknown[]
  }
}

interface ProgressCtx {
  totalChars: number
  processedChars: number
  receivedBytes: number
  percent: number
}

export function buildHeaders(config: Config): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Api-App-Id': config.api.app_id,
    'X-Api-Access-Key': config.api.token,
  }
  if (config.tts.resource_id) {
    headers['X-Api-Resource-Id'] = config.tts.resource_id
  }
  return headers
}

export function buildPayload(text: string, config: Config, overrides: TTSOptions = {}) {
  const audioParams: Record<string, unknown> = {
    format: overrides.format ?? config.tts.format,
    sample_rate: overrides.sampleRate ?? config.tts.sample_rate,
    speech_rate: overrides.speed ?? config.tts.speed,
    loudness_rate: overrides.volume ?? config.tts.volume,
  }

  if (overrides.bitRate !== undefined) {
    audioParams.bit_rate = overrides.bitRate
  }

  if (overrides.emotion) {
    audioParams.emotion = overrides.emotion
  }

  if (overrides.emotionScale !== undefined) {
    audioParams.emotion_scale = overrides.emotionScale
  }

  const reqParams: Record<string, unknown> = {
    text,
    speaker: overrides.voice ?? config.tts.voice,
    audio_params: audioParams,
  }

  // Build additions as a JSON string (required by API)
  const additions: Record<string, unknown> = {}
  if (overrides.disableMarkdownFilter) {
    additions.disable_markdown_filter = overrides.disableMarkdownFilter
  }
  if (overrides.silence !== undefined) {
    additions.silence_duration = overrides.silence
  }
  if (overrides.lang) {
    additions.explicit_language = overrides.lang
  }
  if (Object.keys(additions).length > 0) {
    reqParams.additions = JSON.stringify(additions)
  }

  const model = overrides.model ?? config.tts.model
  if (model) {
    reqParams.model = model
  }

  return {
    user: { uid: 'tts-cli' },
    req_params: reqParams,
  }
}

async function fetchTTS(text: string, config: Config, options: TTSOptions = {}): Promise<Response> {
  const headers = buildHeaders(config)
  const payload = buildPayload(text, config, options)

  const response = await fetch(TTS_ENDPOINT, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`API request failed: ${response.status} ${response.statusText}\n${errorText}`)
  }

  if (!response.body) {
    throw new Error('API request failed: no response body')
  }

  return response
}

function createProgressBar(totalChars: number): cliProgress.SingleBar {
  const bar = new cliProgress.SingleBar({
    format: '🎙  [{bar}] {percentage}% | {processedChars}/{totalChars} chars | {receivedKB}KB received',
    hideCursor: true,
  }, cliProgress.Presets.shades_classic)

  bar.start(100, 0, {
    processedChars: 0,
    totalChars,
    receivedKB: '0.0'
  })

  return bar
}

function handleChunk(
  json: TTSChunk,
  audioChunks: Uint8Array[],
  bar: cliProgress.SingleBar,
  ctx: ProgressCtx
): boolean {
  if (json.code !== 0 && json.code !== 20000000) {
    throw new Error(`TTS error ${json.code}: ${json.message ?? 'Unknown error'}`)
  }

  if (json.data) {
    const chunk = Uint8Array.from(atob(json.data), c => c.charCodeAt(0))
    audioChunks.push(chunk)
    ctx.receivedBytes += chunk.length
    bar.update(ctx.percent, { receivedKB: (ctx.receivedBytes / 1024).toFixed(1) })
  }

  if (json.sentence?.text) {
    ctx.processedChars += json.sentence.text.length
    ctx.percent = Math.min(99, Math.round(ctx.processedChars / ctx.totalChars * 100))
    bar.update(ctx.percent, { processedChars: ctx.processedChars })
  }

  if (json.code === 20000000) {
    bar.update(100)
    bar.stop()
    return true
  }

  return false
}

export async function runDownloadMode(
  inputPath: string,
  config: Config,
  options: TTSOptions = {}
): Promise<void> {
  const { text, disableMarkdownFilter } = await readInputFile(inputPath)
  const outputPath = resolveOutputPath(inputPath, options.output)

  const response = await fetchTTS(text, config, { ...options, disableMarkdownFilter })

  const reader = response.body!.getReader()
  const decoder = new TextDecoder()

  const audioChunks: Uint8Array[] = []
  const bar = createProgressBar(text.length)
  const ctx: ProgressCtx = {
    totalChars: text.length,
    processedChars: 0,
    receivedBytes: 0,
    percent: 0,
  }

  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })

      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        if (!line.trim()) continue
        try {
          const json = JSON.parse(line) as TTSChunk
          const finished = handleChunk(json, audioChunks, bar, ctx)
          if (finished) break
        } catch (e) {
          if (e instanceof SyntaxError) {
            continue
          }
          throw e
        }
      }
    }
  } catch (err) {
    bar.stop()
    throw err
  }

  const totalLength = audioChunks.reduce((sum, chunk) => sum + chunk.length, 0)
  const merged = new Uint8Array(totalLength)
  let offset = 0
  for (const chunk of audioChunks) {
    merged.set(chunk, offset)
    offset += chunk.length
  }

  await Bun.write(outputPath, merged)
  log.success(`Saved to ${outputPath}`)
}

export async function runPlayMode(
  inputPath: string,
  config: Config,
  args: TTSOptions & { save?: boolean }
): Promise<void> {
  assertFfmpeg()

  const { text, disableMarkdownFilter } = await readInputFile(inputPath)
  const outputPath = resolveOutputPath(inputPath, args.output)

  const sampleRate = args.sampleRate ?? config.tts.sample_rate

  const response = await fetchTTS(text, config, {
    ...args,
    format: 'pcm',
    sampleRate,
    disableMarkdownFilter,
  })

  const reader = response.body!.getReader()
  const decoder = new TextDecoder()

  const ffplay = spawnFfplay(sampleRate)
  const audioChunks: Uint8Array[] = []
  const bar = createProgressBar(text.length)
  const ctx: ProgressCtx = {
    totalChars: text.length,
    processedChars: 0,
    receivedBytes: 0,
    percent: 0,
  }

  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })

      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        if (!line.trim()) continue
        try {
          const json = JSON.parse(line) as TTSChunk
          const finished = handleChunk(json, audioChunks, bar, ctx)

          if (json.data) {
            const chunk = Uint8Array.from(atob(json.data), c => c.charCodeAt(0))
            ffplay.stdin?.write(chunk)
          }

          if (finished) break
        } catch (e) {
          if (e instanceof SyntaxError) {
            continue
          }
          throw e
        }
      }
    }
  } catch (err) {
    bar.stop()
    ffplay.kill()
    throw err
  }

  await new Promise<void>((resolve) => {
    ffplay.on('close', () => resolve())
  })

  if (args.save !== false) {
    const totalLength = audioChunks.reduce((sum, chunk) => sum + chunk.length, 0)
    const merged = new Uint8Array(totalLength)
    let offset = 0
    for (const chunk of audioChunks) {
      merged.set(chunk, offset)
      offset += chunk.length
    }

    await convertPCMtoMP3(Buffer.from(merged), outputPath, sampleRate)
    log.success(`Saved to ${outputPath}`)
  }
}
