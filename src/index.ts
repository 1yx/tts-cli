#!/usr/bin/env bun
import { existsSync } from 'fs'
import { runMain } from 'citty'
import { log } from '@clack/prompts'
import { CONFIG_PATH } from './config.js'
import { runSetup } from './setup.js'
import cli from './cli.js'

async function main() {
  // Check if config exists (skip for config command)
  const args = process.argv.slice(2)
  const isConfigCommand = args[0] === 'config'

  if (!isConfigCommand && !existsSync(CONFIG_PATH)) {
    // First run - run setup
    await runSetup()
  }

  // Run CLI
  await runMain(cli)
}

main().catch((err) => {
  if (err instanceof Error) {
    log.error(err.message)
  } else {
    log.error(String(err))
  }
  process.exit(1)
})
