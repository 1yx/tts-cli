import { describe, it, expect } from 'bun:test';
import { detectMarkdown, resolveOutputPath } from '../../src/markdown.js';

describe('detectMarkdown()', () => {
  it('returns true for .md files', () => {
    expect(detectMarkdown('test.md')).toBe(true);
    expect(detectMarkdown('/path/to/file.md')).toBe(true);
  });

  it('returns true for .markdown files', () => {
    expect(detectMarkdown('test.markdown')).toBe(true);
    expect(detectMarkdown('/path/to/file.markdown')).toBe(true);
  });

  it('returns true for uppercase extensions (.MD, .MARKDOWN, .Markdown)', () => {
    expect(detectMarkdown('test.MD')).toBe(true);
    expect(detectMarkdown('test.MARKDOWN')).toBe(true);
    expect(detectMarkdown('test.Markdown')).toBe(true);
  });

  it('returns false for non-markdown files', () => {
    expect(detectMarkdown('test.txt')).toBe(false);
    expect(detectMarkdown('test.log')).toBe(false);
    expect(detectMarkdown('test')).toBe(false);
  });
});

describe('resolveOutputPath()', () => {
  it('returns input/foo.mp3 for input/foo.md without --output', () => {
    const result = resolveOutputPath('input/foo.md');
    expect(result).toBe('input/foo.mp3');
  });

  it('returns custom path when --output is provided', () => {
    const result = resolveOutputPath('input/foo.md', './bar.mp3');
    expect(result).toBe('./bar.mp3');
  });

  it('handles absolute paths, output is in same directory', () => {
    const result = resolveOutputPath('/absolute/path/to/file.md');
    expect(result).toBe('/absolute/path/to/file.mp3');
  });

  it('handles files without extension correctly', () => {
    const result = resolveOutputPath('input/file');
    expect(result).toBe('input/file.mp3');
  });

  it('handles files with custom extensions', () => {
    const result = resolveOutputPath('input/document.txt');
    expect(result).toBe('input/document.mp3');
  });
});
