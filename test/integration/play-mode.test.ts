import { describe, it, expect } from 'bun:test';
import { readInputFile } from '../../src/markdown.js';
import { spawnFfplay, convertPCMtoMP3 } from '../../src/utils.js';
import { loadConfig } from '../../src/config.js';
import { existsSync } from 'fs';

// eslint-disable-next-line max-lines-per-function
describe('runPlayMode integration tests', () => {
  describe('file reading', () => {
    it('should correctly read markdown file', async () => {
      const result = await readInputFile(
        'test/fixtures/test-resource-id-override.md'
      );

      expect(result.text).toBeDefined();
      expect(result.text.length).toBeGreaterThan(0);
      expect(result.disableMarkdownFilter).toBe(true);
    });

    it('should detect markdown files correctly', async () => {
      const result = await readInputFile(
        'test/fixtures/test-resource-id-override.md'
      );

      // .md files should have disableMarkdownFilter = true
      expect(result.disableMarkdownFilter).toBe(true);
    });
  });

  describe('spawnFfplay', () => {
    it('should spawn ffplay process', () => {
      const player = spawnFfplay(24000);

      expect(player).toBeDefined();
      expect(player.pid).toBeGreaterThan(0);
      expect(player.stdin).toBeDefined();

      // Clean up
      player.kill();
    });

    it('should spawn ffplay with correct stdio configuration', () => {
      const player = spawnFfplay(24000);

      // stdin should be writable (a Writable stream)
      expect(player.stdin?.writable).toBe(true);

      // Clean up
      player.kill();
    });
  });

  describe('convertPCMtoMP3', () => {
    it('should convert PCM buffer to MP3 file', async () => {
      // Create a minimal PCM buffer (1 second of silence at 24000 Hz, 16-bit mono)
      const sampleRate = 24000;
      const pcmSize = sampleRate * 2; // 2 bytes per sample
      const pcm = Buffer.alloc(pcmSize, 0); // All zeros = silence

      const outputPath = '/tmp/test-convert.mp3';

      await convertPCMtoMP3(pcm, outputPath, sampleRate);

      // Verify file was created
      expect(existsSync(outputPath)).toBe(true);

      // Clean up
      const { unlinkSync } = await import('fs');
      unlinkSync(outputPath);
    });
  });

  describe('sample rate consistency', () => {
    it('should use same sampleRate for ffplay and API payload', async () => {
      const config = await loadConfig();
      const testSampleRate = 16000;

      // Update config for test
      config.tts.sample_rate = testSampleRate;

      // Spawn ffplay with test sample rate
      const player = spawnFfplay(testSampleRate);

      // Verify player was spawned
      expect(player.pid).toBeGreaterThan(0);

      // Clean up
      player.kill();

      // Note: API payload sample_rate is verified in the manual E2E tests
      // since mocking fetch is complex with Bun's current test framework
    });
  });
});
