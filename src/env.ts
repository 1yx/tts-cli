import { log } from '@clack/prompts'

// Environment checking utilities

/**
 * Check if ffmpeg is available in PATH
 */
export function hasFfmpeg(): boolean {
  return Bun.which('ffmpeg') !== null
}

/**
 * Check if ffplay is available in PATH
 */
export function hasFfplay(): boolean {
  return Bun.which('ffplay') !== null
}

/**
 * Get platform-specific ffmpeg installation guide
 */
export function getInstallGuide(): string {
  const guides: Record<string, string> = {
    darwin: '  macOS:    brew install ffmpeg',
    linux: '  Ubuntu:   sudo apt install ffmpeg',
    win32:
      '  Windows:  winget install ffmpeg\n' +
      '            Or visit https://ffmpeg.org/download.html',
  }
  return guides[process.platform] ?? guides['linux']
}

/**
 * Format error message for missing ffmpeg
 */
export function formatFfmpegError(): string {
  return `
✗ ffmpeg not found. --play mode requires ffmpeg.

  Install:
${getInstallGuide()}

  To download without playing, run:
    tts-cli input.md
`.trim()
}

/**
 * Assert ffmpeg is available, exit if not
 */
export function assertFfmpeg(): void {
  if (!hasFfmpeg()) {
    log.error(formatFfmpegError())
    process.exit(1)
  }
}
