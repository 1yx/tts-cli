/**
 * Audio format declaration for format negotiation
 * Providers must declare their output format so the calling code can
 * construct correct ffplay/ffmpeg arguments.
 */
export type AudioFormat =
  | { type: 'pcm'; sampleRate: number; channels: number; bitDepth: number }
  | { type: 'mp3'; bitRate?: number }
  | { type: 'opus' };

/**
 * Subtitle chunk with optional word-level timestamps
 */
export interface SubtitleChunk {
  text: string;
  words?: Array<{
    word: string;
    startTimeMs: number;
    endTimeMs: number;
  }>;
}

/**
 * TTS stream interface - unifies different protocol responses
 * (HTTP Chunked JSON, WebSocket, raw binary) into a standard async iterable interface.
 */
export interface TTSStream {
  /**
   * Get audio chunks as async iterable.
   * Provider handles protocol translation internally.
   */
  getAudioChunks(): AsyncIterable<Uint8Array>;

  /**
   * Get subtitle chunks if supported.
   * Returns empty iterable if provider doesn't support subtitles.
   */
  getSubtitleChunks(): AsyncIterable<SubtitleChunk>;

  /**
   * Declare audio format for ffplay/ffmpeg compatibility.
   */
  getAudioFormat(): AudioFormat;

  /**
   * Close stream and cleanup resources.
   */
  close(): void;
}

/**
 * Synthesis options - provider-agnostic subset
 */
export interface SynthesizeOptions {
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
  format?: 'mp3' | 'pcm' | 'opus';
}

/**
 * TTS Provider interface - the contract all providers must implement.
 *
 * Based on dependency inversion principle: core defines the contract,
 * providers implement the contract. Application code depends only on this interface.
 */
export interface TTSProvider {
  /** Provider identifier (e.g., 'volcengine', 'openai') */
  name: string;

  /** Audio output format declaration */
  format: AudioFormat;

  /**
   * Validate credentials by making a minimal API call.
   * @returns true if credentials are valid, false otherwise
   */
  validateCredentials(): Promise<boolean>;

  /**
   * Synthesize speech from text.
   * @param text Text to synthesize
   * @param options Synthesis options
   * @returns Stream implementing TTSStream interface
   */
  synthesize(text: string, options: SynthesizeOptions & ProviderConfig): Promise<TTSStream>;
}

/**
 * Provider configuration - provider-specific auth and options.
 * Each provider defines its own config structure.
 */
export type ProviderConfig = Record<string, unknown>;
