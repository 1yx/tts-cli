import { intro, outro, text, password, isCancel, note, confirm, log } from '@clack/prompts'
import { Config, DEFAULTS, saveConfig, CONFIG_PATH } from './config.js'
import { hasFfmpeg, getInstallGuide } from './env.js'

export async function runSetup(): Promise<void> {
  intro('Welcome to tts-cli 🎙️')

  // Phase 1: Environment check
  log.step('[1/2] Checking environment dependencies...')

  if (hasFfmpeg()) {
    log.success('ffmpeg is installed')
  } else {
    log.warn('ffmpeg not detected')
    log.message('tts-cli requires ffmpeg for audio playback (ffplay) and transcoding.')
    log.message('Please install:')

    note(getInstallGuide(), 'Installation Guide')

    const shouldContinue = await confirm({
      message: 'Press Enter to continue after installation (or skip)...',
      initialValue: true,
    })

    if (isCancel(shouldContinue)) {
      process.exit(0)
    }

    // User can skip and continue, will error at runtime when using --play
  }

  log.step('[2/2] Basic configuration...')

  // Get app_id
  const app_id = await text({
    message: 'Enter your Doubao app_id:',
    placeholder: 'your_app_id',
  })
  if (isCancel(app_id)) {
    process.exit(0)
  }

  // Get token
  const token = await password({
    message: 'Enter your Doubao token:',
  })
  if (isCancel(token)) {
    process.exit(0)
  }

  // Create minimal config (only api credentials)
  const config: Config = {
    ...DEFAULTS,
    api: {
      app_id: app_id as string,
      token: token as string,
    },
  }

  // Save config
  await saveConfig(config)

  log.info(`Config saved to: ${CONFIG_PATH}`)
  outro('✓ Setup complete')
}
