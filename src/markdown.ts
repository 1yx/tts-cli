import { extname, dirname, basename, join } from 'path';
import { existsSync, statSync } from 'fs';
import { log } from '@clack/prompts';

/**
 *
 */
export function detectMarkdown(filePath: string): boolean {
  const ext = extname(filePath).toLowerCase();
  return ext === '.md' || ext === '.markdown';
}

/**
 *
 */
export async function readInputFile(
  filePath: string
): Promise<{ text: string; disableMarkdownFilter: boolean }> {
  if (!existsSync(filePath)) {
    log.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  const file = Bun.file(filePath);
  const text = await file.text();
  const disableMarkdownFilter = detectMarkdown(filePath);

  return { text, disableMarkdownFilter };
}

/**
 *
 */
export function resolveOutputPath(
  inputPath: string,
  outputOption?: string
): string {
  if (outputOption) {
    // Check if outputOption is a directory (using sync version for simplicity)
    try {
      const stat = statSync(outputOption);
      if (stat.isDirectory()) {
        // It's a directory, use input filename
        const name = basename(inputPath, extname(inputPath));
        return join(outputOption, `${name}.mp3`);
      }
    } catch {
      // Path doesn't exist, check if it ends with / to infer it's a directory
      if (outputOption.endsWith('/') || outputOption.endsWith('\\')) {
        const name = basename(inputPath, extname(inputPath));
        return join(outputOption, `${name}.mp3`);
      }
    }
    return outputOption;
  }
  const dir = dirname(inputPath);
  const name = basename(inputPath, extname(inputPath));
  return join(dir, `${name}.mp3`);
}

/**
 * Check if output file already exists
 */
export function checkFileExists(filePath: string): boolean {
  return existsSync(filePath);
}
