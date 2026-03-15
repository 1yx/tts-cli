import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import {
  hasFfmpeg,
  hasFfplay,
  getInstallGuide,
  formatFfmpegError,
  assertFfmpeg,
} from '../../src/env.js';

describe('getInstallGuide()', () => {
  const originalPlatform = process.platform;

  afterEach(() => {
    Object.defineProperty(process, 'platform', {
      value: originalPlatform,
    });
  });

  it("returns 'brew install ffmpeg' for darwin", () => {
    Object.defineProperty(process, 'platform', {
      value: 'darwin',
    });
    expect(getInstallGuide()).toContain('brew install ffmpeg');
  });

  it("returns 'sudo apt install ffmpeg' for linux", () => {
    Object.defineProperty(process, 'platform', {
      value: 'linux',
    });
    expect(getInstallGuide()).toContain('sudo apt install ffmpeg');
  });

  it("returns 'winget install ffmpeg' for win32", () => {
    Object.defineProperty(process, 'platform', {
      value: 'win32',
    });
    expect(getInstallGuide()).toContain('winget install ffmpeg');
    expect(getInstallGuide()).toContain('ffmpeg.org/download');
  });

  it('falls back to linux guide for unknown platform', () => {
    Object.defineProperty(process, 'platform', {
      value: 'unknown',
    });
    expect(getInstallGuide()).toContain('sudo apt install ffmpeg');
  });
});

describe('formatFfmpegError()', () => {
  it('contains installation command', () => {
    const error = formatFfmpegError();
    expect(error).toContain('ffmpeg not found');
    expect(error).toContain('--play mode requires ffmpeg');
  });

  it('contains fallback suggestion (without --play)', () => {
    const error = formatFfmpegError();
    expect(error).toContain('without playing');
    expect(error).toContain('tts-cli input.md');
  });
});

describe('hasFfmpeg() / hasFfplay()', () => {
  const originalWhich = Bun.which;

  afterEach(() => {
    Bun.which = originalWhich;
  });

  it('returns true when Bun.which returns path', () => {
    Bun.which = () => '/usr/bin/ffmpeg';
    expect(hasFfmpeg()).toBe(true);
  });

  it('returns false when Bun.which returns null', () => {
    Bun.which = () => null;
    expect(hasFfmpeg()).toBe(false);
  });

  it('returns true for hasFfplay when Bun.which returns path', () => {
    Bun.which = () => '/usr/bin/ffplay';
    expect(hasFfplay()).toBe(true);
  });

  it('returns false for hasFfplay when Bun.which returns null', () => {
    Bun.which = () => null;
    expect(hasFfplay()).toBe(false);
  });
});

describe('assertFfmpeg()', () => {
  const originalWhich = Bun.which;
  const originalExit = process.exit;
  let exitCode: number | null = null;

  beforeEach(() => {
    exitCode = null;
    process.exit = (code?: number) => {
      exitCode = code ?? 0;
      throw new Error(`Process exited with code ${code}`);
    };
  });

  afterEach(() => {
    Bun.which = originalWhich;
    process.exit = originalExit;
  });

  it('passes when ffmpeg exists', () => {
    Bun.which = () => '/usr/bin/ffmpeg';
    expect(() => assertFfmpeg()).not.toThrow();
    expect(exitCode).toBeNull();
  });

  it('exits with code 1 when ffmpeg not found', () => {
    Bun.which = () => null;
    expect(() => assertFfmpeg()).toThrow('Process exited with code 1');
    expect(exitCode).toBe(1);
  });
});
