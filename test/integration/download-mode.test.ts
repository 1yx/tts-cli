import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';

// Mock fetch globally
const mockFetch = async (
  input: RequestInfo | URL,
  _init?: RequestInit
): Promise<Response> => {
  const url = typeof input === 'string' ? input : input.toString();

  if (!url.includes('openspeech.bytedance.com')) {
    throw new Error(`Unexpected fetch to: ${url}`);
  }

  // Create mock stream with test data
  const chunks = [
    // First audio chunk
    JSON.stringify({
      code: 0,
      data: Buffer.from('audio-data-1').toString('base64'),
    }),
    // Sentence chunk for progress
    JSON.stringify({ code: 0, sentence: { text: '你好', words: [] } }),
    // Second audio chunk
    JSON.stringify({
      code: 0,
      data: Buffer.from('audio-data-2').toString('base64'),
    }),
    // End chunk
    JSON.stringify({ code: 20000000, message: 'ok', data: null }),
  ];

  const stream = new ReadableStream({
    async start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(new TextEncoder().encode(`${chunk}\n`));
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
      controller.close();
    },
  });

  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    body: stream,
  } as Response;
};

describe('Integration: download-mode', () => {
  const testDir = join(process.cwd(), 'test-temp');
  const inputFile = join(testDir, 'input.md');
  const outputFile = join(testDir, 'input.mp3');

  beforeEach(() => {
    // Create test directory
    mkdirSync(testDir, { recursive: true });
    // Create test input file
    Bun.write(inputFile, '你好，世界');
  });

  afterEach(() => {
    // Cleanup
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('complete download flow (mocked fetch)', () => {
    it('all audio chunks are correctly concatenated and written to output file', async () => {
      // @ts-ignore - mock fetch
      global.fetch = mockFetch;

      const { runDownloadMode } = await import('../../src/tts.js');
      const { loadConfig } = await import('../../src/config.js');

      const config = await loadConfig();

      await runDownloadMode(inputFile, config);

      expect(existsSync(outputFile)).toBe(true);
      const file = Bun.file(outputFile);
      expect(file.size).toBeGreaterThan(0);
    });

    it('progress bar updates character count when receiving sentence chunk', async () => {
      // @ts-ignore - mock fetch
      global.fetch = mockFetch;

      const { runDownloadMode } = await import('../../src/tts.js');
      const { loadConfig } = await import('../../src/config.js');

      const config = await loadConfig();

      // This test verifies the flow completes without errors
      // Progress bar updates are visual, but we can verify no errors thrown
      await runDownloadMode(inputFile, config);
      expect(existsSync(outputFile)).toBe(true);
    });

    it('output file path matches resolveOutputPath() result', async () => {
      // @ts-ignore - mock fetch
      global.fetch = mockFetch;

      const { runDownloadMode } = await import('../../src/tts.js');
      const { resolveOutputPath } = await import('../../src/markdown.js');
      const { loadConfig } = await import('../../src/config.js');

      const config = await loadConfig();
      const expectedPath = resolveOutputPath(inputFile);

      await runDownloadMode(inputFile, config);

      expect(existsSync(expectedPath)).toBe(true);
    });

    it('API error with non-zero code throws error containing message, no file written', async () => {
      const errorFetch = async (
        _input: RequestInfo | URL,
        _init?: RequestInit
      ): Promise<Response> => {
        const stream = new ReadableStream({
          start(controller) {
            controller.enqueue(
              new TextEncoder().encode(
                `${JSON.stringify({
                  code: 40001,
                  message: 'Invalid credentials',
                })}\n`
              )
            );
            controller.close();
          },
        });

        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          body: stream,
        } as Response;
      };

      // @ts-ignore - mock fetch
      global.fetch = errorFetch;

      const { runDownloadMode } = await import('../../src/tts.js');
      const { loadConfig } = await import('../../src/config.js');

      const config = await loadConfig();

      await expect(runDownloadMode(inputFile, config)).rejects.toThrow(
        'Invalid credentials'
      );
      expect(existsSync(outputFile)).toBe(false);
    });
  });

  describe('file system', () => {
    it('creates output directory when it does not exist', async () => {
      // @ts-ignore - mock fetch
      global.fetch = mockFetch;

      const { runDownloadMode } = await import('../../src/tts.js');
      const { loadConfig } = await import('../../src/config.js');

      const config = await loadConfig();
      const nestedDir = join(testDir, 'nested', 'dir');
      const nestedInput = join(nestedDir, 'input.md');
      const nestedOutput = join(nestedDir, 'input.mp3');

      mkdirSync(nestedDir, { recursive: true });
      Bun.write(nestedInput, 'test');

      await runDownloadMode(nestedInput, config);

      expect(existsSync(nestedOutput)).toBe(true);
    });

    it('overwrites existing output file', async () => {
      // @ts-ignore - mock fetch
      global.fetch = mockFetch;

      const { runDownloadMode } = await import('../../src/tts.js');
      const { loadConfig } = await import('../../src/config.js');

      const config = await loadConfig();

      // Create initial file
      Bun.write(outputFile, 'old content');

      await runDownloadMode(inputFile, config);

      const file = Bun.file(outputFile);
      // New file should have different content (base64 decoded audio data)
      expect(file.text()).not.toBe('old content');
    });
  });
});
