import { describe, it, expect } from 'bun:test'
import { resolveOutputPath } from '../../src/markdown.js'

describe('resolveOutputPath()', () => {
  it('returns input/foo.mp3 for input/foo.md without --output', () => {
    const result = resolveOutputPath('input/foo.md')
    expect(result).toBe('input/foo.mp3')
  })

  it('returns custom path when --output is provided', () => {
    const result = resolveOutputPath('input/foo.md', './bar.mp3')
    expect(result).toBe('./bar.mp3')
  })

  it('handles absolute paths, output is in same directory', () => {
    const result = resolveOutputPath('/absolute/path/to/file.md')
    expect(result).toBe('/absolute/path/to/file.mp3')
  })

  it('handles files without extension correctly', () => {
    const result = resolveOutputPath('input/file')
    expect(result).toBe('input/file.mp3')
  })

  it('handles files with custom extensions', () => {
    const result = resolveOutputPath('input/document.txt')
    expect(result).toBe('input/document.mp3')
  })
})
