import { log } from '@clack/prompts';
import cliProgress from 'cli-progress';
import type { Config } from './config.js';
import { readInputFile, resolveOutputPath } from './markdown.js';
import type { Writable } from 'stream';

import { spawnFfplay, convertPCMtoMP3 } from './utils.js';
import { assertFfmpeg } from './env.js';

const TTS_ENDPOINT =
  'https://openspeech.bytedance.com/api/v3/tts/unidirectional';

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
};

/**
 * TTS API response chunk.
 */
type TTSChunk = {
  code: number;
  message?: string;
  data?: string | null;
  sentence?: {
    text: string;
    words: unknown[];
  };
};

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
 * Options for building TTS API payload.
 */
type BuildPayloadOptions = {
  text: string;
  config: Config;
  overrides?: TTSOptions;
  format?: 'mp3' | 'pcm';
};

/**
 * Options for fetching TTS API.
 */
type FetchTTSOptions = {
  text: string;
  config: Config;
  options?: TTSOptions;
  format?: 'mp3' | 'pcm';
};

/**
 * Options for handling audio chunks.
 */
type HandleChunkOptions = {
  json: TTSChunk;
  audioChunks: Uint8Array[];
  bar: cliProgress.SingleBar;
  ctx: ProgressCtx;
};

/**
 * Build HTTP headers for TTS API request.
 */
export function buildHeaders(
  config: Config,
  overrides: TTSOptions = {}
): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Api-App-Id': config.api.app_id,
    'X-Api-Access-Key': config.api.token,
  };
  const resourceId = overrides.resourceId ?? config.tts.resource_id;
  if (resourceId) {
    headers['X-Api-Resource-Id'] = resourceId;
  }
  return headers;
}

/**
 * Build audio parameters for TTS API request.
 */
function buildAudioParams(
  overrides: TTSOptions,
  config: Config,
  format: 'mp3' | 'pcm'
): Record<string, unknown> {
  const audioParams: Record<string, unknown> = {
    format,
    sample_rate: overrides.sampleRate ?? config.tts.sample_rate,
    speech_rate: overrides.speed ?? config.tts.speed,
    loudness_rate: overrides.volume ?? config.tts.volume,
  };

  if (overrides.bitRate !== undefined) {
    audioParams.bit_rate = overrides.bitRate;
  }
  if (overrides.emotion) {
    audioParams.emotion = overrides.emotion;
  }
  if (overrides.emotionScale !== undefined) {
    audioParams.emotion_scale = overrides.emotionScale;
  }

  return audioParams;
}

/**
 * Build additions object for TTS API request.
 */
function buildAdditions(
  overrides: TTSOptions
): Record<string, unknown> | undefined {
  const additions: Record<string, unknown> = {};

  if (overrides.disableMarkdownFilter) {
    additions.disable_markdown_filter = overrides.disableMarkdownFilter;
  }
  if (overrides.silence !== undefined) {
    additions.silence_duration = overrides.silence;
  }
  if (overrides.lang) {
    additions.explicit_language = overrides.lang;
  }

  return Object.keys(additions).length > 0 ? additions : undefined;
}

/**
 * Build request payload for TTS API.
 */
export function buildPayload(options: BuildPayloadOptions) {
  const { text, config, overrides = {}, format = 'mp3' } = options;
  const audioParams = buildAudioParams(overrides, config, format);

  const reqParams: Record<string, unknown> = {
    text,
    speaker: overrides.voice ?? config.tts.voice,
    audio_params: audioParams,
  };

  const additions = buildAdditions(overrides);
  if (additions) {
    reqParams.additions = JSON.stringify(additions);
  }

  return {
    user: { uid: 'tts-cli' },
    req_params: reqParams,
  };
}

/**
 * Fetch TTS API with error handling.
 */
async function fetchTTS(opts: FetchTTSOptions): Promise<Response> {
  const { text, config, options = {}, format = 'mp3' } = opts;
  const headers = buildHeaders(config, options);
  const payload = buildPayload({ text, config, overrides: options, format });

  const response = await fetch(TTS_ENDPOINT, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `API request failed: ${response.status} ${response.statusText}\n${errorText}`
    );
  }

  if (!response.body) {
    throw new Error('API request failed: no response body');
  }

  return response;
}

/**
 * Create and initialize progress bar.
 */
function createProgressBar(totalChars: number): cliProgress.SingleBar {
  const bar = new cliProgress.SingleBar(
    {
      format:
        '🎙  [{bar}] {percentage}% | {processedChars}/{totalChars} chars | {receivedKB}KB received',
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
 * Validate TTS chunk code.
 */
function validateChunkCode(json: TTSChunk): void {
  if (json.code !== 0 && json.code !== 20000000) {
    throw new Error(
      `TTS error ${json.code}: ${json.message ?? 'Unknown error'}`
    );
  }
}

/**
 * Process audio data from chunk.
 */
function processChunkAudio(opts: HandleChunkOptions): void {
  const { json, audioChunks, ctx, bar } = opts;
  if (!json.data) {
    return;
  }

  const chunk = Uint8Array.from(atob(json.data), (c) => c.charCodeAt(0));
  audioChunks.push(chunk);
  ctx.receivedBytes += chunk.length;
  bar.update(ctx.percent, {
    receivedKB: (ctx.receivedBytes / 1024).toFixed(1),
  });
}

/**
 * Update progress from sentence text.
 */
function updateSentenceProgress(
  json: TTSChunk,
  ctx: ProgressCtx,
  bar: cliProgress.SingleBar
): void {
  if (!json.sentence?.text) {
    return;
  }

  ctx.processedChars += json.sentence.text.length;
  ctx.percent = Math.min(
    99,
    Math.round((ctx.processedChars / ctx.totalChars) * 100)
  );
  bar.update(ctx.percent, { processedChars: ctx.processedChars });
}

/**
 * Handle a TTS chunk, updating progress and accumulating audio.
 */
function handleChunk(opts: HandleChunkOptions): boolean {
  const { json, audioChunks, bar, ctx } = opts;
  validateChunkCode(json);
  processChunkAudio({ json, audioChunks, ctx, bar });
  updateSentenceProgress(json, ctx, bar);

  if (json.code === 20000000) {
    bar.update(100);
    bar.stop();
    return true;
  }

  return false;
}

/**
 * Parse JSON line safely, returning null if invalid.
 */

/**
 *
 */
function parseJSONLine(line: string): TTSChunk | null {
  if (!line.trim()) {
    return null;
  }

  try {
    return JSON.parse(line) as TTSChunk;
  } catch {
    return null;
  }
}

/**
 * Process streaming response line by line.
 */
async function processStreamLines(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  handler: (json: TTSChunk) => boolean | void | Promise<boolean | void>
): Promise<void> {
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const json = parseJSONLine(line);
      if (!json) continue;

      const shouldStop = await handler(json);
      if (shouldStop) return;
    }
  }
}

/**
 * Merge audio chunks into single buffer.
 */
function mergeAudioChunks(chunks: Uint8Array[]): Uint8Array {
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
 * Download mode: Stream TTS audio directly to MP3 file.
 */
export async function runDownloadMode(
  inputPath: string,
  config: Config,
  options: TTSOptions = {}
): Promise<void> {
  const { text, disableMarkdownFilter } = await readInputFile(inputPath);
  const outputPath = resolveOutputPath(inputPath, options.output);

  const response = await fetchTTS({
    text,
    config,
    options: { ...options, disableMarkdownFilter },
    format: 'mp3',
  });

  const body = response.body;
  if (!body) {
    throw new Error('API request failed: no response body');
  }

  const reader = body.getReader();
  const audioChunks: Uint8Array[] = [];
  const bar = createProgressBar(text.length);
  const ctx: ProgressCtx = {
    totalChars: text.length,
    processedChars: 0,
    receivedBytes: 0,
    percent: 0,
  };

  try {
    await processStreamLines(reader, (json) => {
      return handleChunk({ json, audioChunks, bar, ctx });
    });
  } catch (err) {
    bar.stop();
    throw err;
  }

  const merged = mergeAudioChunks(audioChunks);
  await Bun.write(outputPath, merged);
  log.success(`Saved to ${outputPath}`);
}

/**
 * Set up ffplay close/error handlers with timeout.
 */
function setupFfplayClosePromise(ffplay: ReturnType<typeof spawnFfplay>): {
  closePromise: Promise<void>;
  cleanup: () => void;
} {
  const cleanupFns: Array<() => void> = [];

  const closePromise = new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      ffplay.kill();
      reject(new Error('ffplay close timeout - process killed'));
    }, 10000);
    cleanupFns.push(() => clearTimeout(timeout));

    ffplay.on('close', (code: number | null) => {
      clearTimeout(timeout);
      if (code && code !== 0) {
        reject(new Error(`ffplay exited with code ${code}`));
      } else {
        resolve();
      }
    });

    ffplay.on('error', (err: Error) => {
      clearTimeout(timeout);
      reject(new Error(`ffplay error: ${err.message}`));
    });
  });

  return {
    closePromise,
    cleanup: () => {
      for (const fn of cleanupFns) {
        fn();
      }
    },
  };
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

  if (!stdin.write(chunk)) {
    needDrainRef.value = true;
  }
}

/**
 * Save accumulated audio chunks to MP3 file.
 */
async function saveAudioToFile(
  audioChunks: Uint8Array[],
  outputPath: string,
  sampleRate: number
): Promise<void> {
  const totalLength = audioChunks.reduce((sum, chunk) => sum + chunk.length, 0);

  if (totalLength === 0) {
    throw new Error('No audio data received from TTS API');
  }

  const merged = mergeAudioChunks(audioChunks);
  await convertPCMtoMP3(Buffer.from(merged), outputPath, sampleRate);
  log.success(`Saved to ${outputPath}`);
}

/**
 * Options for finalizing ffplay playback.
 */
type FinalizeFfplayOptions = {
  stdin: Writable | null;
  needDrainRef: { value: boolean };
  closePromise: Promise<void>;
  cleanup: () => void;
};

/**
 * Options for streaming with ffplay.
 */
type StreamWithFfplayOptions = {
  reader: ReadableStreamDefaultReader<Uint8Array>;
  ffplay: ReturnType<typeof spawnFfplay>;
  audioChunks: Uint8Array[];
  bar: cliProgress.SingleBar;
  ctx: ProgressCtx;
  needDrainRef: { value: boolean };
};

/**
 * Initialize audio streaming state.
 */
function initAudioState(totalChars: number): {
  audioChunks: Uint8Array[];
  bar: cliProgress.SingleBar;
  ctx: ProgressCtx;
} {
  return {
    audioChunks: [],
    bar: createProgressBar(totalChars),
    ctx: {
      totalChars,
      processedChars: 0,
      receivedBytes: 0,
      percent: 0,
    },
  };
}

/**
 * Process audio chunk for ffplay streaming.
 */
async function processAudioChunkForFfplay(
  json: TTSChunk,
  ffplay: ReturnType<typeof spawnFfplay>,
  needDrainRef: { value: boolean }
): Promise<void> {
  if (!json.data) {
    return;
  }

  const chunk = Uint8Array.from(atob(json.data), (c) => c.charCodeAt(0));
  await writeToFfplay(ffplay, chunk, needDrainRef);
}

/**
 * Finalize ffplay playback.
 */
async function finalizeFfplayPlayback(
  opts: FinalizeFfplayOptions
): Promise<void> {
  const { stdin, needDrainRef, closePromise, cleanup } = opts;
  if (!stdin) {
    throw new Error('ffplay stdin is not available');
  }

  if (needDrainRef.value) {
    await new Promise<void>((resolve) => {
      stdin.once('drain', () => resolve());
    });
  }

  stdin.end();
  await closePromise;
  cleanup();
}

/**
 * Stream TTS audio with ffplay playback.
 */
async function streamWithFfplay(opts: StreamWithFfplayOptions): Promise<void> {
  const { reader, ffplay, audioChunks, bar, ctx, needDrainRef } = opts;
  const stdin = ffplay.stdin;
  if (!stdin) {
    throw new Error('ffplay stdin is not available');
  }

  const { closePromise, cleanup } = setupFfplayClosePromise(ffplay);

  try {
    await processStreamLines(reader, async (json) => {
      const finished = handleChunk({ json, audioChunks, bar, ctx });
      await processAudioChunkForFfplay(json, ffplay, needDrainRef);
      return finished || json.code === 20000000;
    });
  } catch (err) {
    bar.stop();
    ffplay.kill();
    cleanup();
    throw err;
  }

  await finalizeFfplayPlayback({ stdin, needDrainRef, closePromise, cleanup });
}

/**
 * Play mode: Stream TTS audio to ffplay while accumulating for save.
 */
export async function runPlayMode(
  inputPath: string,
  config: Config,
  args: TTSOptions & { save?: boolean }
): Promise<void> {
  assertFfmpeg();

  const { text, disableMarkdownFilter } = await readInputFile(inputPath);
  const outputPath = resolveOutputPath(inputPath, args.output);
  const sampleRate = args.sampleRate ?? config.tts.sample_rate;

  const response = await fetchTTS({
    text,
    config,
    options: { ...args, sampleRate, disableMarkdownFilter },
    format: 'pcm',
  });

  const body = response.body;
  if (!body) {
    throw new Error('API request failed: no response body');
  }

  const reader = body.getReader();
  const ffplay = spawnFfplay(sampleRate);
  const { audioChunks, bar, ctx } = initAudioState(text.length);
  const needDrainRef = { value: false };

  await streamWithFfplay({
    reader,
    ffplay,
    audioChunks,
    bar,
    ctx,
    needDrainRef,
  });

  if (args.save !== false) {
    await saveAudioToFile(audioChunks, outputPath, sampleRate);
  }
}
