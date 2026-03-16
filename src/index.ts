#!/usr/bin/env bun
import { existsSync } from 'fs';
import { defineCommand, runMain } from 'citty';
import { log, outro } from '@clack/prompts';
import { CONFIG_PATH, loadConfig, saveConfig, DEFAULTS } from './config.js';
import { runSetup } from './setup.js';
import { runPlayMode, runDownloadMode, type TTSOptions } from './tts.js';
import { assertFfmpeg } from './env.js';
import { APIError, getAPIErrorSuggestion } from './errors.js';

// Parse CLI args for first-run setup
/**
 *
 */
function parseArgsForSetup(args: string[]): { appId?: string; token?: string } {
  const result: { appId?: string; token?: string } = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--app-id' || arg === '--appId') {
      result.appId = args[i + 1];
      i++;
    } else if (arg === '--token') {
      result.token = args[i + 1];
      i++;
    }
  }

  return result;
}

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
    appId: {
      type: 'string',
      description:
        'Override Doubao app_id (for debugging or using different account)',
    },
    token: {
      type: 'string',
      description:
        'Override Doubao token (for debugging or using different account)',
    },
  },
  /**
   *
   */
  // eslint-disable-next-line complexity
  async run({ args }) {
    const input = String(args.input);

    if (args.play) {
      assertFfmpeg();
    }

    let config = await loadConfig();

    // Allow runtime credential override via --appId and --token
    if (args.appId || args.token) {
      // Validate that provided values are not empty strings
      if (args.appId === '') {
        log.error('--appId requires a value');
        process.exit(1);
      }
      if (args.token === '') {
        log.error('--token requires a value');
        process.exit(1);
      }

      config = {
        ...config,
        api: {
          ...config.api,
          ...(args.appId && { app_id: args.appId }),
          ...(args.token && { token: args.token }),
        },
      };
    }

    const options: TTSOptions = {
      output: args.output,
      voice: args.voice,
      speed: args.speed ? parseInt(args.speed, 10) : undefined,
      volume: args.volume ? parseInt(args.volume, 10) : undefined,
      emotion: args.emotion,
      emotionScale: args.emotionScale
        ? parseInt(args.emotionScale, 10)
        : undefined,
      sampleRate: args.sampleRate ? parseInt(args.sampleRate, 10) : undefined,
      bitRate: args.bitRate ? parseInt(args.bitRate, 10) : undefined,
      lang: args.lang,
      silence: args.silence ? parseInt(args.silence, 10) : undefined,
      resourceId: args.resourceId,
    };

    try {
      if (args.play) {
        await runPlayMode(input, config, {
          ...options,
          save: args.output !== undefined,
        });
      } else {
        await runDownloadMode(input, config, options);
      }
    } catch (err) {
      if (err instanceof APIError) {
        log.error(err.message);
        // Show current credentials for debugging
        log.info(
          `当前配置: app_id = ${config.api.app_id}, token = ${config.api.token.slice(0, 10)}...`
        );
        const suggestion = getAPIErrorSuggestion(err.type);
        if (suggestion) {
          log.info(suggestion);
        }
        process.exit(1);
      }
      throw err;
    }
  },
});

/**
 *
 */
async function main() {
  // Check if config exists
  if (!existsSync(CONFIG_PATH)) {
    // First run - check if credentials provided via CLI args or environment variables
    const cliArgs = parseArgsForSetup(process.argv.slice(2));

    // Also check environment variables
    const envAppId = process.env.TTS_CLI_APP_ID || '';
    const envToken = process.env.TTS_CLI_TOKEN || '';
    const appId = cliArgs.appId || envAppId;
    const token = cliArgs.token || envToken;

    if (appId && token) {
      // Save credentials directly
      const config = {
        ...DEFAULTS,
        api: {
          app_id: appId,
          token,
        },
      };
      await saveConfig(config);
      outro(
        `✓ Credentials saved to ${CONFIG_PATH}\n  Next time, just run: tts-cli <input>`
      );
    } else {
      // Run interactive setup
      await runSetup();
    }
  }

  // Run main command
  await runMain(mainCommand);
}

main().catch((err) => {
  if (err instanceof Error) {
    log.error(err.message);
  } else {
    log.error(String(err));
  }
  process.exit(1);
});
