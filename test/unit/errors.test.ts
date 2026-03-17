import { describe, it, expect } from 'bun:test';
import { APIError, getAPIErrorType, getAPIErrorSuggestion } from '../../src/errors.js';

// eslint-disable-next-line max-lines-per-function
describe('getAPIErrorType()', () => {
  describe('TTS API 专用错误码 (45xxxx)', () => {
    it('returns "auth" for 45000000 (音色鉴权失败)', () => {
      expect(getAPIErrorType(45000000)).toBe('auth');
    });

    it('returns "auth" for 45000010 (授权未找到)', () => {
      expect(getAPIErrorType(45000010)).toBe('auth');
    });

    it('returns "quota" for 45000292 (配额超限)', () => {
      expect(getAPIErrorType(45000292)).toBe('quota');
    });
  });

  describe('公共错误码 (10xxxx)', () => {
    it('returns "auth" for 100009 (InvalidAccessKey)', () => {
      expect(getAPIErrorType(100009)).toBe('auth');
    });

    it('returns "auth" for 100010 (SignatureDoesNotMatch)', () => {
      expect(getAPIErrorType(100010)).toBe('auth');
    });

    it('returns "auth" for 100013 (AccessDenied)', () => {
      expect(getAPIErrorType(100013)).toBe('auth');
    });

    it('returns "auth" for 100024 (InvalidAuthorization)', () => {
      expect(getAPIErrorType(100024)).toBe('auth');
    });

    it('returns "auth" for 100025 (InvalidCredential)', () => {
      expect(getAPIErrorType(100025)).toBe('auth');
    });

    it('returns "auth" for 100026 (InvalidSecretToken)', () => {
      expect(getAPIErrorType(100026)).toBe('auth');
    });

    it('returns "rate_limit" for 100018 (FlowLimitExceeded)', () => {
      expect(getAPIErrorType(100018)).toBe('rate_limit');
    });
  });

  describe('其他错误码', () => {
    it('returns "rate_limit" for 429', () => {
      expect(getAPIErrorType(429)).toBe('rate_limit');
    });

    it('returns "unknown" for 40402003 (TTSExceededTextLimit)', () => {
      expect(getAPIErrorType(40402003)).toBe('unknown');
    });

    it('returns "unknown" for 55000000 (服务端通用错误)', () => {
      expect(getAPIErrorType(55000000)).toBe('unknown');
    });

    it('returns "unknown" for unrecognized error codes', () => {
      expect(getAPIErrorType(99999999)).toBe('unknown');
    });
  });

  describe('边界情况', () => {
    it('100018 (rate_limit) 不会被误判为 auth', () => {
      // 确保范围判断不会把 100018 误判为 auth
      expect(getAPIErrorType(100018)).not.toBe('auth');
      expect(getAPIErrorType(100018)).toBe('rate_limit');
    });
  });
});

describe('getAPIErrorSuggestion()', () => {
  it('returns correct suggestion for "auth" type', () => {
    expect(getAPIErrorSuggestion('auth')).toBe('请检查配置文件中的 app_id 和 token');
  });

  it('returns correct suggestion for "quota" type', () => {
    expect(getAPIErrorSuggestion('quota')).toBe('配额已用完，请检查火山引擎控制台的配额使用情况');
  });

  it('returns correct suggestion for "rate_limit" type', () => {
    expect(getAPIErrorSuggestion('rate_limit')).toBe('请求过于频繁，请稍后再试');
  });

  it('returns correct suggestion for "unknown" type', () => {
    expect(getAPIErrorSuggestion('unknown')).toBe('如果是持续问题，请联系技术支持');
  });
});

describe('APIError', () => {
  it('creates error with formatted message containing code and message', () => {
    const error = new APIError(45000010, 'load grant: requested grant not found', 'auth');

    expect(error.message).toBe('API 错误 45000010: load grant: requested grant not found');
    expect(error.name).toBe('APIError');
  });

  it('stores code, message, and type as readonly properties', () => {
    const error = new APIError(45000292, 'quota exceeded', 'quota');

    expect(error.code).toBe(45000292);
    expect(error.apiMessage).toBe('quota exceeded');
    expect(error.type).toBe('quota');
  });

  it('is instance of Error and APIError', () => {
    const error = new APIError(45000010, 'test message', 'auth');

    expect(error instanceof Error).toBe(true);
    expect(error instanceof APIError).toBe(true);
  });
});
