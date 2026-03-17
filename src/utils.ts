import { spawn, type ChildProcess } from 'child_process';
import type { Writable } from 'stream';
import cliProgress from 'cli-progress';

/**
 * Options for spawning ffplay.
 */
export type SpawnFfplayOptions = {
  sampleRate?: number;
};

/**
 * Spawn ffplay process for PCM audio playback.
 */
export function spawnFfplay(sampleRate: number = 24000): ChildProcess {
  const player = spawn(
    'ffplay',
    ['-f', 's16le', '-ar', String(sampleRate), '-nodisp', '-autoexit', '-'],
    {
      stdio: ['pipe', 'ignore', 'ignore'],
    },
  );

  player.on('error', (err) => {
    console.error('ffplay spawn error:', err);
  });

  return player;
}

/**
 * Check if an error is a pipe error (EPIPE).
 * EPIPE is expected when ffplay exits before we finish writing.
 */
export function isPipeError(err: unknown): boolean {
  if (!(err instanceof Error)) {
    return false;
  }
  if ('code' in err && err.code === 'EPIPE') {
    return true;
  }
  return false;
}

/**
 * Merge audio chunks into single buffer.
 */
export function mergeAudioChunks(chunks: Uint8Array[]): Uint8Array {
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const merged = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }
  return merged;
}

/**
 * Parse JSON line safely, returning null if invalid.
 */
export function parseJSONLine<T = unknown>(line: string): T | null {
  if (!line.trim()) {
    return null;
  }
  try {
    return JSON.parse(line) as T;
  } catch {
    return null;
  }
}

/**
 * Write PCM data to ffmpeg stdin.
 */
function writePCMToStdin(pcmData: Buffer, stdin: Writable | null): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    if (!stdin) {
      reject(new Error('ffmpeg stdin is not available'));
      return;
    }

    stdin.on('error', (err: Error) => {
      reject(new Error(`ffmpeg stdin error: ${err.message}`));
    });

    if (!stdin.write(pcmData)) {
      stdin.once('drain', () => {
        stdin.end();
        resolve();
      });
    } else {
      stdin.end();
      resolve();
    }
  });
}

/**
 * Create ffmpeg process for PCM to MP3 conversion.
 */
function spawnFFmpegProcess(outputPath: string, sampleRate: number): ReturnType<typeof spawn> {
  return spawn(
    'ffmpeg',
    ['-f', 's16le', '-ar', String(sampleRate), '-ac', '1', '-y', '-i', 'pipe:0', outputPath],
    {
      stdio: ['pipe', 'pipe', 'pipe'],
    },
  );
}

/**
 * Set up ffmpeg process event handlers.
 */
function setupFFmpegHandlers(
  ffmpeg: ReturnType<typeof spawn>,
  resolve: () => void,
  reject: (err: Error) => void,
): void {
  let stderr = '';

  ffmpeg.stderr?.on('data', (data) => {
    stderr += data.toString();
  });

  ffmpeg.on('close', (code) => {
    if (code === 0) {
      resolve();
    } else {
      reject(new Error(`ffmpeg failed (code ${code}): ${stderr}`));
    }
  });

  ffmpeg.on('error', (err) => {
    reject(new Error(`ffmpeg spawn error: ${err.message}`));
  });
}

/**
 * Convert PCM buffer to MP3 file using ffmpeg.
 */
export async function convertPCMtoMP3(
  pcm: Buffer,
  outputPath: string,
  sampleRate: number,
): Promise<void> {
  const ffmpeg = spawnFFmpegProcess(outputPath, sampleRate);

  return new Promise<void>((resolve, reject) => {
    setupFFmpegHandlers(ffmpeg, resolve, reject);

    writePCMToStdin(pcm, ffmpeg.stdin).catch((err: Error) => {
      ffmpeg.kill();
      reject(err);
    });
  });
}

/**
 * Safely write to a Writable stream, handling EPIPE errors gracefully.
 * EPIPE is expected when ffplay exits before we finish writing.
 *
 * @param stream - The writable stream (typically ffplay stdin)
 * @param chunk - The data chunk to write
 * @returns Promise that resolves when write is complete
 */
export function safeWrite(stream: Writable, chunk: Uint8Array): Promise<void> {
  return new Promise((resolve) => {
    // Check if stream can still be written to
    if (!stream.writable || stream.destroyed) {
      return resolve();
    }

    // Set up error handler for EPIPE
    const onError = (err: Error) => {
      if ('code' in err && err.code === 'EPIPE') {
        // Silently handle EPIPE - player has closed, but playback is complete
        resolve();
      } else {
        // For other errors, also resolve to avoid crashing
        // The error will be handled elsewhere in the stream
        resolve();
      }
    };

    stream.once('error', onError);

    // Write the chunk
    const canWrite = stream.write(chunk, (err) => {
      stream.off('error', onError);
      if (err) {
        if ('code' in err && err.code === 'EPIPE') {
          // Silently handle EPIPE
          resolve();
        } else {
          // For other errors, resolve to avoid crashing
          resolve();
        }
        return;
      }
    });

    // Handle backpressure
    if (!canWrite) {
      stream.once('drain', () => {
        stream.off('error', onError);
        resolve();
      });
    } else {
      stream.off('error', onError);
      process.nextTick(resolve);
    }
  });
}
