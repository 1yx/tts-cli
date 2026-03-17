/**
 * VolcEngine-specific type definitions.
 *
 * This module contains private types used only within the volcengine provider,
 * including request/response formats from the Doubao TTS API.
 */

/**
 * VolcEngine provider configuration.
 */
export interface VolcEngineConfig {
  /** Doubao app_id */
  app_id: string;
  /** Doubao access token */
  token: string;
  /** Resource ID (e.g., 'seed-tts-1.0', 'seed-tts-2.0') */
  resource_id?: string;
  /** Protocol to use: 'http' or 'websocket' */
  protocol?: 'http' | 'websocket';
}

/**
 * VolcEngine TTS API request payload.
 */
export interface VolcEngineRequestPayload {
  user: {
    uid: string;
  };
  req_params: {
    text: string;
    speaker: string;
    audio_params: VolcEngineAudioParams;
    additions?: string; // JSON string
  };
}

/**
 * VolcEngine audio parameters.
 */
export interface VolcEngineAudioParams {
  format: 'mp3' | 'pcm' | 'opus';
  sample_rate: number;
  speech_rate: number;
  loudness_rate: number;
  bit_rate?: number; // Only for MP3
  enable_subtitle?: boolean;
  emotion?: string;
  emotion_scale?: number;
}

/**
 * VolcEngine additions (encoded as JSON string).
 */
export interface VolcEngineAdditions {
  disable_markdown_filter?: boolean;
  silence_duration?: number;
  explicit_language?: string;
}

/**
 * VolcEngine TTS API response chunk.
 */
export interface VolcEngineChunk {
  reqid?: string;
  code: number;
  message?: string;
  data?: string; // Base64-encoded audio data
  sentence?: {
    text: string;
    words: unknown[];
  };
}

/**
 * VolcEngine API error codes.
 */
export const VolcEngineErrorCodes = {
  /** Authentication failed - invalid credentials */
  AUTH_FAILED: 45000010,
  /** Resource ID mismatched with speaker */
  RESOURCE_MISMATCH: 55000000,
  /** Success */
  SUCCESS: 0,
  /** Stream end */
  STREAM_END: 20000000,
} as const;
