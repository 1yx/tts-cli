/**
 * VolcEngine HTTP Chunked streaming implementation.
 *
 * Handles the HTTP Chunked JSON protocol used by the Doubao TTS API.
 */

import type { TTSStream, AudioFormat, SynthesizeOptions, TTSProvider, ProviderConfig } from '../../core/types.js';
import {
  ProviderAuthError,
  ProviderAPIError,
  ProviderNetworkError,
} from '../../core/errors.js';
import type {
  VolcEngineConfig,
  VolcEngineChunk,
  VolcEngineRequestPayload,
} from './types.js';
import { buildAuthHeaders, isAuthError } from './auth.js';

const TTS_ENDPOINT = 'https://openspeech.bytedance.com/api/v3/tts/unidirectional';

/**
 * VolcEngine HTTP streaming implementation.
 */
export class VolcEngineHTTP implements TTSProvider {
  name = 'volcengine';

  format: AudioFormat = {
    type: 'pcm',
    sampleRate: 24000,
    channels: 1,
    bitDepth: 16,
  };

  constructor(private config: VolcEngineConfig) {
    // Config is stored via constructor parameter shorthand
  }

  /**
   * Validate credentials by sending empty string to API.
   */
  async validateCredentials(): Promise<boolean> {
    try {
      const headers = buildAuthHeaders(this.config);
      const payload = this.buildPayload('', {});

      const response = await fetch(TTS_ENDPOINT, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      // HTTP 401 means invalid credentials
      if (response.status === 401 || response.status === 403) {
        return false;
      }

      // If we get HTTP 200, credentials are valid (even if there are app-level errors)
      return response.status === 200;
    } catch (error) {
      // Network errors count as invalid
      return false;
    }
  }

  /**
   * Synthesize speech from text.
   * @returns Stream implementing TTSStream interface
   */
  async synthesize(
    text: string,
    options: SynthesizeOptions & Partial<VolcEngineConfig>
  ): Promise<TTSStream> {
    const headers = buildAuthHeaders({
      ...this.config,
      ...options,
    });
    const payload = this.buildPayload(text, options);

    const response = await fetch(TTS_ENDPOINT, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let apiError: { code: number; message: string } | null = null;

      try {
        const errorJson = JSON.parse(errorText);
        const code = Number(errorJson.header?.code || errorJson.code);
        const message = String(errorJson.header?.message || errorJson.message || errorText);

        if (code) {
          if (isAuthError(code)) {
            throw new ProviderAuthError('volcengine', message);
          }
          apiError = { code, message };
        }
      } catch {
        // JSON parse failed
      }

      if (apiError) {
        throw new ProviderAPIError('volcengine', apiError.code, apiError.message);
      }

      throw new ProviderNetworkError('volcengine', `HTTP ${response.status}: ${response.statusText}`);
    }

    if (!response.body) {
      throw new ProviderNetworkError('volcengine', 'No response body');
    }

    return new VolcEngineStream(response.body);
  }

  /**
   * Build request payload for TTS API.
   */
  private buildPayload(
    text: string,
    options: SynthesizeOptions & Partial<VolcEngineConfig>
  ): VolcEngineRequestPayload {
    const audioParams = {
      format: options.format || 'mp3',
      sample_rate: options.sampleRate || 24000,
      speech_rate: options.speed || 0,
      loudness_rate: options.volume || 0,
      enable_subtitle: true,
    };

    if (options.bitRate) {
      (audioParams as unknown as { bit_rate: number }).bit_rate = options.bitRate;
    }
    if (options.emotion) {
      (audioParams as unknown as { emotion: string }).emotion = options.emotion;
    }
    if (options.emotionScale) {
      (audioParams as unknown as { emotion_scale: number }).emotion_scale = options.emotionScale;
    }

    const additions: Record<string, unknown> = {};
    if (options.disableMarkdownFilter) {
      additions.disable_markdown_filter = true;
    }
    if (options.silence !== undefined) {
      additions.silence_duration = options.silence;
    }
    if (options.lang) {
      additions.explicit_language = options.lang;
    }

    return {
      user: { uid: 'tts-cli' },
      req_params: {
        text,
        speaker: options.voice || 'en_male_tim_uranus_bigtts',
        audio_params: audioParams,
        ...(Object.keys(additions).length > 0 ? { additions: JSON.stringify(additions) } : {}),
      },
    };
  }
}

/**
 * VolcEngine HTTP Chunked stream wrapper.
 * Converts HTTP Chunked JSON responses to standard TTSStream interface.
 */
class VolcEngineStream implements TTSStream {
  readonly format: AudioFormat = {
    type: 'pcm',
    sampleRate: 24000,
    channels: 1,
    bitDepth: 16,
  };

  private audioChunks: Uint8Array[] = [];
  private subtitleChunks: import('../../core/types.js').SubtitleChunk[] = [];
  private parsed = false;

  constructor(private body: ReadableStream<Uint8Array>) {}

  /**
   * Parse the entire stream and cache audio/subtitle chunks.
   * This allows both getAudioChunks() and getSubtitleChunks() to work
   * since the underlying ReadableStream can only be consumed once.
   */
  private async parseStream(): Promise<void> {
    if (this.parsed) return;

    const reader = this.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;

          const chunk: VolcEngineChunk = JSON.parse(line);

          // Check for success codes
          if (chunk.code === 0 || chunk.code === 20000000) {
            // Audio data chunk
            if (chunk.data) {
              const audioData = Uint8Array.from(atob(chunk.data), (c) => c.charCodeAt(0));
              this.audioChunks.push(audioData);
            }

            // Subtitle data chunk
            if (chunk.sentence && chunk.sentence.words && chunk.sentence.words.length > 0) {
              this.subtitleChunks.push({
                text: chunk.sentence.text,
                words: chunk.sentence.words as Array<{
                  word: string;
                  startTimeMs: number;
                  endTimeMs: number;
                }>,
              });
            }

            // Stream end
            if (chunk.code === 20000000) {
              return;
            }
          } else {
            // Error chunk
            throw new ProviderAPIError('volcengine', chunk.code, chunk.message || 'Unknown error');
          }
        }
      }
    } finally {
      reader.releaseLock();
      this.parsed = true;
    }
  }

  async *getAudioChunks(): AsyncIterable<Uint8Array> {
    await this.parseStream();
    yield* this.audioChunks;
  }

  async *getSubtitleChunks(): AsyncIterable<import('../../core/types.js').SubtitleChunk> {
    await this.parseStream();
    yield* this.subtitleChunks;
  }

  getAudioFormat(): AudioFormat {
    return this.format;
  }

  close(): void {
    // HTTP stream auto-closes when response completes
    // No manual cleanup needed
  }
}
