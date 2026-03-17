/**
 * Domain-specific error types for TTS providers.
 *
 * All providers must throw these error types for known error conditions,
 * enabling centralized error handling and user-friendly messages.
 */

/**
 * Authentication/authorization failure.
 * Thrown when credentials are invalid, expired, or missing.
 */
export class ProviderAuthError extends Error {
  constructor(
    public provider: string,
    message: string,
  ) {
    super(`[${provider}] Authentication failed: ${message}`);
    this.name = 'ProviderAuthError';
  }
}

/**
 * Quota/limit exceeded.
 * Thrown when API quota is exhausted (character count, request count, etc.).
 */
export class ProviderQuotaError extends Error {
  constructor(
    public provider: string,
    message: string,
  ) {
    super(`[${provider}] Quota exceeded: ${message}`);
    this.name = 'ProviderQuotaError';
  }
}

/**
 * Rate limit exceeded.
 * Thrown when API rate limit is hit.
 */
export class ProviderRateLimitError extends Error {
  constructor(
    public provider: string,
    public retryAfter?: number,
  ) {
    const retryMsg = retryAfter ? `, retry after ${retryAfter}s` : '';
    super(`[${provider}] Rate limited${retryMsg}`);
    this.name = 'ProviderRateLimitError';
  }
}

/**
 * Parameter validation failure.
 * Thrown when provided parameters are invalid (out of range, wrong type, etc.).
 */
export class ProviderValidationError extends Error {
  constructor(
    public provider: string,
    message: string,
  ) {
    super(`[${provider}] Validation failed: ${message}`);
    this.name = 'ProviderValidationError';
  }
}

/**
 * Network/communication error.
 * Thrown when network request fails (timeout, connection refused, etc.).
 */
export class ProviderNetworkError extends Error {
  constructor(
    public provider: string,
    message: string,
  ) {
    super(`[${provider}] Network error: ${message}`);
    this.name = 'ProviderNetworkError';
  }
}

/**
 * API response error.
 * Thrown when API returns an error response (parsing error, unexpected format, etc.).
 */
export class ProviderAPIError extends Error {
  constructor(
    public provider: string,
    public code: number,
    message: string,
  ) {
    super(`[${provider}] API error ${code}: ${message}`);
    this.name = 'ProviderAPIError';
  }
}
