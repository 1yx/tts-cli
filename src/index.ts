#!/usr/bin/env bun
import { existsSync } from 'fs';
import { defineCommand, runMain } from 'citty';
import { log, outro } from '@clack/prompts';
import { CONFIG_PATH, loadConfig, saveConfig, DEFAULTS } from './config.js';
import { collectCredentials, type Credentials } from './setup.js';
import { runPlayMode, runDownloadMode, type TTSOptions } from './tts.js';
import { assertFfmpeg } from './env.js';
import { APIError, getAPIErrorSuggestion } from './errors.js';
import { resolveOutputPath, checkFileExists } from './markdown.js';

// Module-level variable to store first-run credentials (in-memory only, not saved yet)
let firstRunCredentials: Credentials | null = null;

// Parse CLI args for first-run setup
/**
 *
 */
function parseArgsForSetup(args: string[]): { appId?: string; token?: string } {
  const result: { appId?: string; token?: string } = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    // Support both --appId value and --appId=value formats
    if (arg === '--app-id' || arg === '--appId') {
      result.appId = args[i + 1];
      i++;
    } else if (arg.startsWith('--app-id=')) {
      result.appId = arg.split('=')[1];
    } else if (arg.startsWith('--appId=')) {
      result.appId = arg.split('=')[1];
    } else if (arg === '--token') {
      result.token = args[i + 1];
      i++;
    } else if (arg.startsWith('--token=')) {
      result.token = arg.split('=')[1];
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
      description:
        'Play audio (local file if exists, otherwise generate and play)',
      default: false,
    },
    output: {
      type: 'string',
      description:
        'Output file path (or folder path to save as input-filename.mp3)',
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
    force: {
      type: 'boolean',
      description: 'Force overwrite existing output file',
      default: false,
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

    let config = await loadConfig({}, firstRunCredentials ?? undefined);

    // Apply environment variable overrides (layer 2 of 4)
    const envAppId = process.env.TTS_CLI_APP_ID || '';
    const envToken = process.env.TTS_CLI_TOKEN || '';
    if (envAppId || envToken) {
      config = {
        ...config,
        api: {
          ...config.api,
          ...(envAppId && { app_id: envAppId }),
          ...(envToken && { token: envToken }),
        },
      };
    }

    // Allow runtime credential override via --appId and --token (layer 3 of 4)
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

    // Check output file existence (before API call)
    const outputPath = resolveOutputPath(input, args.output);

    if (!args.force && checkFileExists(outputPath)) {
      // File exists and not using --force
      if (args.play) {
        // Play local MP3 instead of regenerating
        log.info(`Playing existing file: ${outputPath}`);
        await playLocalMP3(outputPath);
        return;
      } else {
        // No --play, show error and exit
        log.error(`Output file already exists: ${outputPath}`);
        log.info(
          'Use --play to play the existing file, or --force to regenerate'
        );
        process.exit(1);
      }
    }

    try {
      if (args.play) {
        await runPlayMode(input, config, options);
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

        // If first run failed, credentials were not saved
        if (firstRunCredentials) {
          log.info('Please correct your credentials and try again.');
        }

        process.exit(1);
      }
      throw err;
    }
  },
});

/**
 * Play local MP3 file using ffplay
 */
// eslint-disable-next-line @typescript-eslint/require-await
async function playLocalMP3(filePath: string): Promise<void> {
  const { spawn } = await import('child_process');
  const ffplay = spawn('ffplay', ['-nodisp', '-autoexit', filePath], {
    stdio: ['ignore', 'ignore', 'ignore'],
  });

  return new Promise<void>((resolve, reject) => {
    ffplay.on('close', (code: number | null) => {
      if (code && code !== 0) {
        reject(new Error(`ffplay exited with code ${code}`));
      } else {
        resolve();
      }
    });

    ffplay.on('error', (err: Error) => {
      reject(new Error(`ffplay error: ${err.message}`));
    });
  });
}

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
      // CLI/env path: store credentials in memory for later validation
      firstRunCredentials = { app_id: appId, token };
    } else {
      // Interactive path: collect credentials via prompts (stored in memory)
      firstRunCredentials = await collectCredentials();
    }
  }

  // Run main command (will use firstRunCredentials if set)
  await runMain(mainCommand);

  // If we reach here, the command succeeded - save credentials if first run
  if (firstRunCredentials) {
    const config = {
      ...DEFAULTS,
      api: firstRunCredentials,
    };
    await saveConfig(config);
    outro(
      `Credentials saved to ${CONFIG_PATH}\n  Next time, just run: tts-cli <input>`
    );
  }
}

main().catch((err) => {
  if (err instanceof Error) {
    log.error(err.message);
  } else {
    log.error(String(err));
  }

  // If first run failed, credentials were not saved
  if (firstRunCredentials) {
    log.info(
      'Config not saved. Please correct your credentials and try again.'
    );
  }

  process.exit(1);
});
