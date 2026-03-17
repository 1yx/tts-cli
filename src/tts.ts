import { log } from '@clack/prompts';
import cliProgress from 'cli-progress';
import type { Config } from './config.js';
import { readInputFile, resolveOutputPath, checkFileExists } from './markdown.js';
import { unlinkSync } from 'node:fs';
import { createWriteStream } from 'node:fs';

import {
  spawnFfplay,
  convertPCMtoMP3,
  isPipeError,
  mergeAudioChunks,
} from './utils.js';
import { assertFfmpeg } from './env.js';
import { createProvider } from './providers/index.js';
import type { TTSProvider } from './core/types.js';
import type { ChildProcess } from 'child_process';

// Signal handling state
let ffplayProcess: ChildProcess | null = null;
let tempFile: string | null = null;
let isInterrupted = false;

/**
 * Cleanup function: terminate ffplay and delete temp file.
 * Called by signal handlers and exit hook.
 */
async function cleanup(): Promise<void> {
  // 1. Terminate ffplay process
  if (ffplayProcess && !ffplayProcess.killed) {
    ffplayProcess.kill('SIGTERM');
    // Wait for process to exit (max 5 seconds)
    await Promise.race([
      new Promise<void>((resolve) => {
        ffplayProcess!.on('exit', () => resolve());
      }),
      new Promise<void>((resolve) => setTimeout(() => resolve(), 5000)),
    ]);
    // Force kill if still running
    if (!ffplayProcess.killed) {
      ffplayProcess.kill('SIGKILL');
    }
  }

  // 2. Delete temp file
  if (tempFile) {
    try {
      await Bun.file(tempFile).delete(); // Use async delete in signal handlers
    } catch {
      // Ignore errors
    }
  }
}

// Register signal handlers
process.on('SIGINT', async () => {
  isInterrupted = true;
  log.warn('Interrupted by user');
  await cleanup();
  process.exit(130); // 128 + 2 (SIGINT)
});

process.on('SIGTERM', async () => {
  isInterrupted = true;
  await cleanup();
  process.exit(143); // 128 + 15 (SIGTERM)
});

// Exit hook for Windows compatibility + abnormal exit cleanup
process.on('exit', (code) => {
  // Windows: forcefully terminate ffplay in exit hook
  if (ffplayProcess && !ffplayProcess.killed) {
    ffplayProcess.kill('SIGKILL');
  }

  // Abnormal exit: sync delete temp file
  if (code !== 0 && tempFile) {
    try {
      unlinkSync(tempFile);
    } catch {
      // Ignore errors
    }
  }
});

/**
 * Get provider instance from config.
 * Uses the provider name and configuration from the Config object.
 */
function getProviderFromConfig(config: Config): TTSProvider {
  const providerName = config.provider || 'volcengine';
  return createProvider(providerName, { providers: config.providers || {} });
}

/**
 * Options for TTS processing.
 */
export type TTSOptions = {
  output?: string;
  voice?: string;
  speed?: number;
  volume?: number;
  emotion?: string;
  emotionScale?: number;
  sampleRate?: number;
  bitRate?: number;
  lang?: string;
  silence?: number;
  disableMarkdownFilter?: boolean;
  resourceId?: string;
  subtitle?: boolean;
  force?: boolean;
};

/**
 * Subtitle writer state for streaming JSON array write.
 */
type SubtitleWriter = {
  file: { write: (data: string) => void; end: () => void };
  first: boolean;
  path: string;
};

/**
 * Open subtitle writer for streaming JSON array write.
 */
function openSubtitleWriter(outputPath: string): SubtitleWriter {
  const path = outputPath.replace('.mp3', '.subtitle.json');
  const file = Bun.file(path).writer();
  file.write('[\n');
  return { file, first: true, path };
}

/**
 * Write a subtitle chunk to file.
 */
function writeSubtitleChunk(
  writer: SubtitleWriter,
  chunk: import('./core/types.js').SubtitleChunk
): void {
  if (!writer.first) {
    writer.file.write(',\n');
  }
  writer.file.write(JSON.stringify(chunk, null, 2));
  writer.first = false;
}

/**
 * Close subtitle writer and finalize JSON array.
 */
function closeSubtitleWriter(writer: SubtitleWriter): void {
  writer.file.write('\n]');
  writer.file.end();
}

/**
 * Progress tracking context.
 */
type ProgressCtx = {
  totalChars: number;
  processedChars: number;
  receivedBytes: number;
  percent: number;
};

/**
 * Create and initialize progress bar.
 */
function createProgressBar(totalChars: number): cliProgress.SingleBar {
  const bar = new cliProgress.SingleBar(
    {
      format: '│  [{bar}] {percentage}%  | {receivedKB}KB received',
      hideCursor: true,
    },
    cliProgress.Presets.shades_classic
  );

  bar.start(100, 0, {
    processedChars: 0,
    totalChars,
    receivedKB: '0.0',
  });

  return bar;
}

/**
 * Download mode: Stream TTS audio directly to MP3 file.
 */
export async function runDownloadMode(
  inputPath: string,
  config: Config,
  options: TTSOptions = {}
): Promise<void> {
  const { text, disableMarkdownFilter } = await readInputFile(inputPath);
  const outputPath = resolveOutputPath(inputPath, options.output);

  // Subtitle setup
  const subtitlePath = outputPath.replace('.mp3', '.subtitle.json');
  const subtitleEnabled =
    options.subtitle &&
    (!checkFileExists(subtitlePath) || (options.force ?? false));
  let subtitleWriter: SubtitleWriter | null = null;
  if (subtitleEnabled) {
    subtitleWriter = openSubtitleWriter(outputPath);
  }

  // Get provider and synthesize
  const provider = getProviderFromConfig(config);
  const stream = await provider.synthesize(text, {
    ...options,
    disableMarkdownFilter,
    format: 'mp3',
  });

  const audioChunks: Uint8Array[] = [];
  const bar = createProgressBar(text.length);
  const ctx: ProgressCtx = {
    totalChars: text.length,
    processedChars: 0,
    receivedBytes: 0,
    percent: 0,
  };

  // Collect audio chunks
  for await (const chunk of stream.getAudioChunks()) {
    audioChunks.push(chunk);
    ctx.receivedBytes += chunk.length;
    bar.update(ctx.percent, {
      receivedKB: (ctx.receivedBytes / 1024).toFixed(1),
    });
  }

  // Collect subtitles if enabled
  if (subtitleWriter) {
    for await (const subChunk of stream.getSubtitleChunks()) {
      writeSubtitleChunk(subtitleWriter, subChunk);
    }
    closeSubtitleWriter(subtitleWriter);
    log.success(`Subtitles saved to ${subtitlePath}`);
  }

  bar.update(100);
  bar.stop();

  const merged = mergeAudioChunks(audioChunks);
  await Bun.write(outputPath, merged);
  log.success(`Saved to ${outputPath}`);

  stream.close();
}

/**
 * Set up ffplay close/error handlers.
 */
function setupFfplayClosePromise(ffplay: ReturnType<typeof spawnFfplay>): {
  closePromise: Promise<void>;
} {
  const closePromise = new Promise<void>((resolve, reject) => {
    ffplay.on('close', (code: number | null) => {
      if (code && code !== 0 && code !== 141 && !isInterrupted) {
        reject(new Error(`ffplay exited with code ${code}`));
      } else {
        resolve();
      }
    });

    ffplay.on('error', (err: Error) => {
      reject(new Error(`ffplay error: ${err.message}`));
    });
  });

  return { closePromise };
}

/**
 * Write audio chunk to ffplay stdin with drain handling.
 */
async function writeToFfplay(
  ffplay: ReturnType<typeof spawnFfplay>,
  chunk: Uint8Array,
  needDrainRef: { value: boolean }
): Promise<void> {
  const stdin = ffplay.stdin;
  if (!stdin) {
    throw new Error('ffplay stdin is not available');
  }

  if (needDrainRef.value) {
    await new Promise<void>((resolve) => {
      stdin.once('drain', () => resolve());
    });
    needDrainRef.value = false;
  }

  if (stdin.destroyed) {
    return;
  }

  try {
    if (!stdin.write(chunk)) {
      needDrainRef.value = true;
    }
  } catch (err) {
    if (!isPipeError(err)) {
      throw err;
    }
  }
}

/**
 * Play mode: Stream TTS audio to ffplay while accumulating for save.
 */
export async function runPlayMode(
  inputPath: string,
  config: Config,
  args: TTSOptions
): Promise<void> {
  assertFfmpeg();

  const { text, disableMarkdownFilter } = await readInputFile(inputPath);
  const outputPath = resolveOutputPath(inputPath, args.output);

  // Subtitle setup
  const subtitlePath = outputPath.replace('.mp3', '.subtitle.json');
  const subtitleEnabled =
    args.subtitle &&
    (!checkFileExists(subtitlePath) || (args.force ?? false));
  let subtitleWriter: SubtitleWriter | null = null;
  if (subtitleEnabled) {
    subtitleWriter = openSubtitleWriter(outputPath);
  }

  // Get provider and synthesize with PCM format for streaming
  const provider = getProviderFromConfig(config);
  const stream = await provider.synthesize(text, {
    ...args,
    disableMarkdownFilter,
    format: 'pcm',
  });

  const format = stream.getAudioFormat();
  if (format.type !== 'pcm') {
    throw new Error('Play mode requires PCM format from provider');
  }

  // Initialize ffplay with provider format
  const ffplay = spawnFfplay(format.sampleRate);
  const { closePromise } = setupFfplayClosePromise(ffplay);

  const audioChunks: Uint8Array[] = [];
  const bar = createProgressBar(text.length);
  const ctx: ProgressCtx = {
    totalChars: text.length,
    processedChars: 0,
    receivedBytes: 0,
    percent: 0,
  };
  const needDrainRef = { value: false };

  // Create temp file
  const tempFilePath = `${outputPath}.temp.raw`;
  const writeStream = createWriteStream(tempFilePath);

  ffplayProcess = ffplay;
  tempFile = tempFilePath;

  try {
    // Stream audio chunks to ffplay and temp file
    for await (const chunk of stream.getAudioChunks()) {
      audioChunks.push(chunk);
      ctx.receivedBytes += chunk.length;

      bar.update(ctx.percent, {
        receivedKB: (ctx.receivedBytes / 1024).toFixed(1),
      });

      // Write to ffplay
      await writeToFfplay(ffplay, chunk, needDrainRef);

      // Write to temp file
      await new Promise<void>((resolve) => {
        if (!writeStream.write(chunk)) {
          writeStream.once('drain', () => resolve());
        } else {
          resolve();
        }
      });
    }

    // Collect subtitles if enabled
    if (subtitleWriter) {
      for await (const subChunk of stream.getSubtitleChunks()) {
        writeSubtitleChunk(subtitleWriter, subChunk);
      }
      closeSubtitleWriter(subtitleWriter);
      log.success(`Subtitles saved to ${subtitlePath}`);
    }

    bar.update(100);
    bar.stop();

    // Close ffplay stdin
    const stdin = ffplay.stdin;
    if (!stdin) {
      throw new Error('ffplay stdin is not available');
    }

    if (needDrainRef.value) {
      await new Promise<void>((resolve) => {
        stdin.once('drain', () => resolve());
      });
    }

    if (stdin.writableLength > 0) {
      await new Promise<void>((resolve) => {
        stdin.once('drain', () => resolve());
      });
    }

    stdin.end();
    await new Promise((resolve) => setTimeout(resolve, 100));
    await closePromise;

  } catch (err) {
    bar.stop();
    ffplay.kill();
    try {
      await Bun.file(tempFilePath).delete();
    } catch {
      // Ignore errors
    }
    tempFile = null;
    throw err;
  }

  // Close writeStream
  writeStream.end();
  await new Promise<void>((resolve) => {
    writeStream.on('finish', () => resolve());
  });

  // Convert temp file to MP3
  await convertPCMtoMP3(
    Buffer.from(await Bun.file(tempFilePath).arrayBuffer()),
    outputPath,
    format.sampleRate
  );
  log.success(`Saved to ${outputPath}`);

  // Delete temp file
  try {
    await Bun.file(tempFilePath).delete();
  } catch {
    // Ignore errors
  }
  tempFile = null;

  stream.close();
}
