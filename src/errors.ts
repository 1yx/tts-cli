/**
 * API error types for categorizing TTS API errors.
 */
export type APIErrorType = 'auth' | 'quota' | 'rate_limit' | 'unknown';

/**
 * Get the error type from an API error code.
 * @param code - The API error code
 * @returns The corresponding error type
 */
export function getAPIErrorType(code: number): APIErrorType {
  // TTS API 专用错误码
  if (code === 45000000 || code === 45000010) {
    return 'auth';
  }
  if (code === 45000292) {
    return 'quota';
  }

  // 公共错误码 - 明确列出，避免范围误判
  if ([100009, 100010, 100013, 100024, 100025, 100026].includes(code)) {
    return 'auth';
  }
  if (code === 100018 || code === 429) {
    return 'rate_limit';
  }

  return 'unknown';
}

/**
 * Get a user-friendly suggestion message for an API error type.
 * @param type - The API error type
 * @returns A suggestion message in Chinese
 */
export function getAPIErrorSuggestion(type: APIErrorType): string {
  switch (type) {
    case 'auth':
      return '请检查配置文件中的 app_id 和 token';
    case 'quota':
      return '配额已用完，请检查火山引擎控制台的配额使用情况';
    case 'rate_limit':
      return '请求过于频繁，请稍后再试';
    case 'unknown':
      return '如果是持续问题，请联系技术支持';
  }
}

/**
 * Custom error class for TTS API errors.
 * Extends Error to include API-specific fields.
 */
export class APIError extends Error {
  /**
   * The raw API error message (without formatting).
   */
  public readonly apiMessage: string;

  /**
   * Creates a new APIError instance.
   * @param code - The API error code
   * @param message - The error message from the API
   * @param type - The error type category
   */
  constructor(
    public readonly code: number,
    message: string,
    public readonly type: APIErrorType
  ) {
    super(`API 错误 ${code}: ${message}`);
    this.apiMessage = message;
    this.name = 'APIError';
  }
}
