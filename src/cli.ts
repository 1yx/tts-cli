import { defineCommand } from 'citty'
import { runConfigCommand } from './commands/config.js'
import { runConvert } from './commands/convert.js'

// Convert command (default)
const convertCommand = defineCommand({
  meta: {
    name: 'convert',
    description: 'Convert markdown to MP3',
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
    noSave: {
      type: 'boolean',
      description: 'Do not save file (requires --play)',
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
    format: {
      type: 'string',
      description: 'Audio format: mp3, pcm, ogg_opus',
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
  run({ args }) {
    if (args.noSave && !args.play) {
      throw new Error('--no-save requires --play')
    }
    return runConvert(args.input, args)
  },
})

// Config command
const configCommand = defineCommand({
  meta: {
    name: 'config',
    description: 'Manage configuration',
  },
  args: {
    edit: {
      type: 'boolean',
      description: 'Open config in editor',
      default: false,
    },
    reset: {
      type: 'boolean',
      description: 'Reset configuration',
      default: false,
    },
  },
  async run({ args }) {
    await runConfigCommand(args)
  },
})

// Main CLI with subcommands
const cli = defineCommand({
  meta: {
    name: 'tts-cli',
    description: 'Markdown to MP3 CLI Tool',
  },
  subCommands: {
    convert: convertCommand,
    config: configCommand,
  },
})

export default cli
