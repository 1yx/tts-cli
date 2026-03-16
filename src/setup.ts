import {
  intro,
  outro,
  text,
  password,
  isCancel,
  note,
  confirm,
  log,
} from '@clack/prompts';
import { type Config, DEFAULTS, saveConfig, CONFIG_PATH } from './config.js';
import { hasFfmpeg, getInstallGuide } from './env.js';

export type Credentials = {
  app_id: string;
  token: string;
};

/**
 * Collect credentials from user via interactive prompts.
 * Returns credentials object without saving to disk.
 */
export async function collectCredentials(): Promise<Credentials> {
  intro('Welcome to tts-cli 🎙️');

  // Phase 1: Environment check
  log.step('[1/2] Checking environment dependencies...');

  if (hasFfmpeg()) {
    log.success('ffmpeg is installed');
  } else {
    log.warn('ffmpeg not detected');
    log.message(
      'tts-cli requires ffmpeg for audio playback (ffplay) and transcoding.'
    );
    log.message('Please install:');

    note(getInstallGuide(), 'Installation Guide');

    const shouldContinue = await confirm({
      message: 'Press Enter to continue after installation (or skip)...',
      initialValue: true,
    });

    if (isCancel(shouldContinue)) {
      process.exit(0);
    }

    // User can skip and continue, will error at runtime when using --play
  }

  log.step('[2/2] Basic configuration...');

  // Get app_id
  const app_id = await text({
    message: 'Enter your Doubao app_id:',
    placeholder: 'your_app_id',
  });
  if (isCancel(app_id)) {
    process.exit(0);
  }

  // Get token
  const token = await password({
    message: 'Enter your Doubao token:',
  });
  if (isCancel(token)) {
    process.exit(0);
  }

  // isCancel was checked above, so we know these are strings
  const appIdValue = String(app_id);
  const tokenValue = String(token);

  return {
    app_id: appIdValue,
    token: tokenValue,
  };
}

/**
 *
 */
export async function runSetup(): Promise<void> {
  const creds = await collectCredentials();
  const config: Config = {
    ...DEFAULTS,
    api: creds,
  };

  // Save config
  await saveConfig(config);

  log.info(`Config saved to: ${CONFIG_PATH}`);
  outro('✓ Setup complete');
}
