/**
 * Domain constants for TTS providers.
 *
 * Defines supported formats, default values, and parameter ranges.
 * Single source of truth for configuration validation.
 */

/**
 * Supported audio output formats.
 */
export const SUPPORTED_FORMATS = ['mp3', 'pcm', 'opus'] as const;
export type SupportedFormat = (typeof SUPPORTED_FORMATS)[number];

/**
 * Default audio parameters.
 */
export const DEFAULT_SAMPLE_RATE = 24000;
export const DEFAULT_CHANNELS = 1;
export const DEFAULT_BIT_DEPTH = 16;

/**
 * Speed parameter range [-50, 100].
 * Negative values slow down speech, positive values speed up.
 */
export const MIN_SPEED = -50;
export const MAX_SPEED = 100;

/**
 * Volume parameter range [-50, 100].
 * Negative values decrease volume, positive values increase volume.
 */
export const MIN_VOLUME = -50;
export const MAX_VOLUME = 100;

/**
 * Emotion scale range [1, 5].
 */
export const MIN_EMOTION_SCALE = 1;
export const MAX_EMOTION_SCALE = 5;

/**
 * Silence duration range [0, 30000] milliseconds.
 */
export const MIN_SILENCE_MS = 0;
export const MAX_SILENCE_MS = 30000;
