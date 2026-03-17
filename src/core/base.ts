/**
 * Abstract base class for TTS providers.
 *
 * Provides common validation and error handling logic that can be shared
 * across provider implementations. Providers can extend this class or
 * implement TTSProvider interface directly.
 */

import type { TTSProvider, AudioFormat, SynthesizeOptions, ProviderConfig } from './types.js';
import { ProviderValidationError } from './errors.js';
import { MIN_SPEED, MAX_SPEED, MIN_VOLUME, MAX_VOLUME } from './constants.js';

/**
 * Abstract base class implementing TTSProvider interface.
 * Providers can extend this class to inherit common validation logic.
 */
export abstract class BaseProvider implements TTSProvider {
  abstract name: string;
  abstract format: AudioFormat;

  /**
   * Validate speed parameter is within acceptable range.
   * @throws {ProviderValidationError} if speed is out of range
   */
  protected validateSpeed(speed: number): void {
    if (speed < MIN_SPEED || speed > MAX_SPEED) {
      throw new ProviderValidationError(
        this.name,
        `Speed must be between ${MIN_SPEED} and ${MAX_SPEED}, got ${speed}`,
      );
    }
  }

  /**
   * Validate volume parameter is within acceptable range.
   * @throws {ProviderValidationError} if volume is out of range
   */
  protected validateVolume(volume: number): void {
    if (volume < MIN_VOLUME || volume > MAX_VOLUME) {
      throw new ProviderValidationError(
        this.name,
        `Volume must be between ${MIN_VOLUME} and ${MAX_VOLUME}, got ${volume}`,
      );
    }
  }

  /**
   * Validate sample rate is a supported value.
   */
  protected validateSampleRate(sampleRate: number): void {
    const validRates = [8000, 16000, 22050, 24000, 32000, 44100, 48000];
    if (!validRates.includes(sampleRate)) {
      throw new ProviderValidationError(
        this.name,
        `Sample rate must be one of ${validRates.join(', ')}, got ${sampleRate}`,
      );
    }
  }

  // Subclasses must implement these methods
  abstract validateCredentials(): Promise<boolean>;
  abstract synthesize(
    text: string,
    options: SynthesizeOptions & ProviderConfig,
  ): Promise<import('./types.js').TTSStream>;
}
