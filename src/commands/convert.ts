import { log } from '@clack/prompts'
import { loadConfig, type Config } from '../config.js'
import { runPlayMode, runDownloadMode, type TTSOptions } from '../tts.js'

export interface ConvertArgs {
  input?: string
  output?: string
  play?: boolean
  noSave?: boolean
  voice?: string
  speed?: number
  volume?: number
  emotion?: string
  emotionScale?: number
  format?: string
  sampleRate?: number
  bitRate?: number
  lang?: string
  silence?: number
  resourceId?: string
}

function parseNumber(value: string | undefined): number | undefined {
  if (value === undefined) return undefined
  const num = parseInt(value, 10)
  return isNaN(num) ? undefined : num
}

export async function runConvert(input: string, args: ConvertArgs): Promise<void> {
  const config = loadConfig()

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
    await runPlayMode(input, config, {
      ...options,
      save: !args.noSave,
    })
  } else {
    await runDownloadMode(input, config, options)
  }
}
