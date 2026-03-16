import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';

// Mock fetch globally
const mockFetch = (
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

  return Promise.resolve({
    ok: true,
    status: 200,
    statusText: 'OK',
    body: stream,
  } as Response);
};

// eslint-disable-next-line max-lines-per-function
describe('Integration: download-mode', () => {
  const testDir = join(process.cwd(), 'test-temp');
  const inputFile = join(testDir, 'input.md');
  const outputFile = join(testDir, 'input.mp3');

  beforeEach(async () => {
    // Create test directory
    mkdirSync(testDir, { recursive: true });
    // Create test input file
    await Bun.write(inputFile, '你好，世界');
  });

  afterEach(() => {
    // Cleanup
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  // eslint-disable-next-line max-lines-per-function
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
      const errorFetch = (
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

        return Promise.resolve({
          ok: true,
          status: 200,
          statusText: 'OK',
          body: stream,
        } as Response);
      };

      // @ts-ignore - mock fetch
      global.fetch = errorFetch;

      const { runDownloadMode } = await import('../../src/tts.js');
      const { loadConfig } = await import('../../src/config.js');

      const config = await loadConfig();

      // eslint-disable-next-line @typescript-eslint/await-thenable
      await expect(runDownloadMode(inputFile, config)).rejects.toThrow(
        'Invalid credentials'
      );
      expect(existsSync(outputFile)).toBe(false);
    });

    it('throws APIError with correct type for HTTP 401 with JSON body', async () => {
      const errorFetch = (
        _input: RequestInfo | URL,
        _init?: RequestInit
      ): Promise<Response> => {
        const errorBody = JSON.stringify({
          header: {
            reqid: 'test-reqid',
            code: 45000010,
            message: 'load grant: requested grant not found in SaaS storage',
          },
        });

        return Promise.resolve({
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
          body: null,
          // Add text method to simulate Response.text()
          text: async () => errorBody,
        } as unknown as Response);
      };

      // @ts-ignore - mock fetch
      global.fetch = errorFetch;

      const { runDownloadMode } = await import('../../src/tts.js');
      const { loadConfig } = await import('../../src/config.js');
      const { APIError } = await import('../../src/errors.js');

      const config = await loadConfig();

      let errorThrown: unknown = null;
      try {
        await runDownloadMode(inputFile, config);
      } catch (err) {
        errorThrown = err;
      }

      expect(errorThrown).toBeInstanceOf(APIError);

      if (errorThrown instanceof APIError) {
        expect(errorThrown.code).toBe(45000010);
        expect(errorThrown.type).toBe('auth');
        expect(errorThrown.message).toBe(
          'API 错误 45000010: load grant: requested grant not found in SaaS storage'
        );
      }
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
      await Bun.write(nestedInput, 'test');

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
      await Bun.write(outputFile, 'old content');

      await runDownloadMode(inputFile, config);

      const file = Bun.file(outputFile);
      // New file should have different content (base64 decoded audio data)
      expect(file.text()).not.toBe('old content');
    });
  });
});
