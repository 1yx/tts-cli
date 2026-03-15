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

  // If no subcommand provided, default to convert
  // Inject 'convert' as first argument if not a subcommand
  if (args.length > 0 && !args[0].startsWith('-') && args[0] !== 'config') {
    // First arg is input file, not a command - prepend 'convert'
    process.argv.splice(2, 0, 'convert')
  } else if (args.length === 0 || args[0].startsWith('-')) {
    // No args or starts with option - need to add 'convert'
    process.argv.splice(2, 0, 'convert')
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
