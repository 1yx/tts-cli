import { log } from '@clack/prompts'
import { loadConfig, type Config } from '../config.js'
import { runPlayMode, runDownloadMode, type TTSOptions } from '../tts.js'

export interface ConvertArgs {
  input?: string
  output?: string
  play?: boolean
  voice?: string
  speed?: string
  volume?: string
  emotion?: string
  emotionScale?: string
  format?: string
  sampleRate?: string
  bitRate?: string
  lang?: string
  silence?: string
  resourceId?: string
}

function parseNumber(value: string | undefined): number | undefined {
  if (value === undefined) return undefined
  const num = parseInt(value, 10)
  return isNaN(num) ? undefined : num
}

export async function runConvert(input: string, args: ConvertArgs): Promise<void> {
  const config = await loadConfig()

  const options: TTSOptions = {
    output: args.output,
    voice: args.voice,
    speed: parseNumber(args.speed),
    volume: parseNumber(args.volume),
    emotion: args.emotion,
    emotionScale: parseNumber(args.emotionScale),
    format: args.format as TTSOptions['format'],
    sampleRate: parseNumber(args.sampleRate),
    bitRate: parseNumber(args.bitRate),
    lang: args.lang,
    silence: parseNumber(args.silence),
    resourceId: args.resourceId,
  }

  if (args.play) {
    // Save only if output is explicitly provided
    await runPlayMode(input, config, {
      ...options,
      save: args.output !== undefined,
    })
  } else {
    await runDownloadMode(input, config, options)
  }
}
