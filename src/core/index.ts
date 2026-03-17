/**
 * Core types and contracts for TTS providers.
 *
 * This module defines the domain contracts that all TTS providers must implement.
 * Following Clean Architecture principles, this module has NO dependencies on
 * provider implementations - it only defines the "language" of the domain.
 */

export type {
  AudioFormat,
  SubtitleChunk,
  TTSStream,
  SynthesizeOptions,
  TTSProvider,
  ProviderConfig,
} from './types.js';

export {
  ProviderAuthError,
  ProviderQuotaError,
  ProviderRateLimitError,
  ProviderValidationError,
  ProviderNetworkError,
  ProviderAPIError,
} from './errors.js';

export * from './constants.js';

export { BaseProvider } from './base.js';
