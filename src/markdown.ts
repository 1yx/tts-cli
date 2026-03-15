import { extname, dirname, basename, join } from 'path'
import { existsSync } from 'fs'
import { log } from '@clack/prompts'

export function detectMarkdown(filePath: string): boolean {
  const ext = extname(filePath).toLowerCase()
  return ext === '.md' || ext === '.markdown'
}

export async function readInputFile(filePath: string): Promise<{ text: string; disableMarkdownFilter: boolean }> {
  if (!existsSync(filePath)) {
    log.error(`File not found: ${filePath}`)
    process.exit(1)
  }

  const file = Bun.file(filePath)
  const text = await file.text()
  const disableMarkdownFilter = detectMarkdown(filePath)

  return { text, disableMarkdownFilter }
}

export function resolveOutputPath(inputPath: string, outputOption?: string): string {
  if (outputOption) {
    return outputOption
  }
  const dir = dirname(inputPath)
  const name = basename(inputPath, extname(inputPath))
  return join(dir, `${name}.mp3`)
}
