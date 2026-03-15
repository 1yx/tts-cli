import { log } from '@clack/prompts'
import { execSync } from 'child_process'
import { existsSync, unlinkSync } from 'fs'
import { loadConfig, CONFIG_PATH } from '../config.js'
import { runSetup } from '../setup.js'

export interface ConfigArgs {
  edit?: boolean
  reset?: boolean
}

export async function runConfigCommand(args: ConfigArgs): Promise<void> {
  if (args.reset) {
    if (existsSync(CONFIG_PATH)) {
      unlinkSync(CONFIG_PATH)
      log.success('Config deleted')
    }
    await runSetup()
    return
  }

  if (args.edit) {
    const editor = process.env.EDITOR ?? process.env.VISUAL ?? 'vi'
    execSync(`${editor} "${CONFIG_PATH}"`, { stdio: 'inherit' })
    return
  }

  // Print current config
  const config = loadConfig()
  log.info('Current Configuration')
  log.message(`Config path: ${CONFIG_PATH}`)
  log.message('')
  log.info('[api]')
  log.message(`  app_id: ${config.api.app_id || '(empty)'}`)
  log.message(`  token: ${config.api.token ? '***' : '(empty)'}`)
  log.message('')
  log.info('[tts]')
  log.message(`  voice: ${config.tts.voice}`)
  log.message(`  model: ${config.tts.model}`)
  log.message(`  speed: ${config.tts.speed}`)
  log.message(`  volume: ${config.tts.volume}`)
  log.message(`  sample_rate: ${config.tts.sample_rate}`)
  log.message(`  bit_rate: ${config.tts.bit_rate}`)
  log.message(`  format: ${config.tts.format}`)
  log.message(`  lang: ${config.tts.lang}`)
  log.message('')
  log.info('[output]')
  log.message(`  dir: ${config.output.dir}`)
  log.message('')
  log.message('Use --edit to open in editor, --reset to reconfigure')
}
