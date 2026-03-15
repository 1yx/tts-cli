import { intro, outro, text, isCancel, note, confirm, log } from '@clack/prompts'
import { Config, DEFAULTS, saveConfig } from './config.js'
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
  const token = await text({
    message: 'Enter your Doubao token:',
    mask: true,
    placeholder: 'your_token',
  })
  if (isCancel(token)) {
    process.exit(0)
  }

  // Get voice
  const voice = await text({
    message: 'Default voice:',
    placeholder: DEFAULTS.tts.voice,
    defaultValue: DEFAULTS.tts.voice,
  })
  if (isCancel(voice)) {
    process.exit(0)
  }

  // Get speed
  const speedStr = await text({
    message: 'Default speed:',
    placeholder: String(DEFAULTS.tts.speed),
    defaultValue: String(DEFAULTS.tts.speed),
  })
  if (isCancel(speedStr)) {
    process.exit(0)
  }
  const speed = speedStr ? parseInt(speedStr, 10) : DEFAULTS.tts.speed

  // Create config
  const config: Config = {
    ...DEFAULTS,
    api: {
      app_id: app_id as string,
      token: token as string,
    },
    tts: {
      ...DEFAULTS.tts,
      voice: voice as string,
      speed,
    },
  }

  // Save config
  await saveConfig(config)

  outro('✓ Config saved')
}
