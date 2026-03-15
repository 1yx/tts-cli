#!/usr/bin/env bun
import { existsSync } from 'fs'
import { defineCommand, runMain } from 'citty'
import { log } from '@clack/prompts'
import { CONFIG_PATH, loadConfig } from './config.js'
import { runSetup } from './setup.js'
import { runPlayMode, runDownloadMode, type TTSOptions } from './tts.js'
import { assertFfmpeg } from './env.js'

// Main CLI command (no subcommands)
const mainCommand = defineCommand({
  meta: {
    name: 'tts-cli',
    description: 'Markdown to MP3 CLI Tool',
  },
  args: {
    input: {
      type: 'positional',
      description: 'Input file path',
      required: true,
    },
    play: {
      type: 'boolean',
      description: 'Play audio while converting',
      default: false,
    },
    output: {
      type: 'string',
      description: 'Output file path',
    },
    voice: {
      type: 'string',
      description: 'Voice name',
    },
    speed: {
      type: 'string',
      description: 'Speech speed [-50, 100]',
    },
    volume: {
      type: 'string',
      description: 'Volume [-50, 100]',
    },
    emotion: {
      type: 'string',
      description: 'Emotion type (e.g. happy, sad)',
    },
    emotionScale: {
      type: 'string',
      description: 'Emotion scale [1-5]',
    },
    sampleRate: {
      type: 'string',
      description: 'Sample rate (default: 24000)',
    },
    bitRate: {
      type: 'string',
      description: 'Bit rate for MP3 (default: 128000)',
    },
    lang: {
      type: 'string',
      description: 'Language: zh-cn, en, ja, es-mx, id, pt-br',
    },
    silence: {
      type: 'string',
      description: 'Silence duration at end of sentence (ms)',
    },
    resourceId: {
      type: 'string',
      description: 'Resource ID (seed-tts-1.0, seed-tts-2.0, etc.)',
    },
  },
  async run({ args }) {
    const input = args.input as string

    if (args.play) {
      assertFfmpeg()
    }

    const config = await loadConfig()

    const options: TTSOptions = {
      output: args.output,
      voice: args.voice,
      speed: args.speed ? parseInt(args.speed, 10) : undefined,
      volume: args.volume ? parseInt(args.volume, 10) : undefined,
      emotion: args.emotion,
      emotionScale: args.emotionScale ? parseInt(args.emotionScale, 10) : undefined,
      sampleRate: args.sampleRate ? parseInt(args.sampleRate, 10) : undefined,
      bitRate: args.bitRate ? parseInt(args.bitRate, 10) : undefined,
      lang: args.lang,
      silence: args.silence ? parseInt(args.silence, 10) : undefined,
      resourceId: args.resourceId,
    }

    if (args.play) {
      await runPlayMode(input, config, {
        ...options,
        save: args.output !== undefined,
      })
    } else {
      await runDownloadMode(input, config, options)
    }
  },
})

async function main() {
  // Check if config exists
  if (!existsSync(CONFIG_PATH)) {
    // First run - run setup
    await runSetup()
  }

  // Run main command
  await runMain(mainCommand)
}

main().catch((err) => {
  if (err instanceof Error) {
    log.error(err.message)
  } else {
    log.error(String(err))
  }
  process.exit(1)
})
