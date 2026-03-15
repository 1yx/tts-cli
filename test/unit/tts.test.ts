import { describe, it, expect } from 'bun:test';
import type { Config } from '../../src/config.js';
import { buildHeaders, buildPayload } from '../../src/tts.js';

const mockConfig: Config = {
  api: {
    app_id: 'test-app-id',
    token: 'test-token',
  },
  tts: {
    voice: 'zh_female_tianmei',
    resource_id: 'seed-tts-2.0',
    speed: 0,
    volume: 0,
    sample_rate: 24000,
    bit_rate: 128000,
    format: 'mp3',
    lang: 'zh-cn',
  },
  output: {
    dir: '~/Downloads',
  },
};

describe('buildHeaders()', () => {
  it('returns object with X-Api-App-Id, X-Api-Access-Key, and X-Api-Resource-Id', () => {
    const headers = buildHeaders(mockConfig);

    expect(headers).toHaveProperty('X-Api-App-Id');
    expect(headers).toHaveProperty('X-Api-Access-Key');
    expect(headers).toHaveProperty('X-Api-Resource-Id');
    expect(headers).toHaveProperty('Content-Type');
  });

  it('values come from config, not hardcoded', () => {
    const headers = buildHeaders(mockConfig);

    expect(headers['X-Api-App-Id']).toBe(mockConfig.api.app_id);
    expect(headers['X-Api-Access-Key']).toBe(mockConfig.api.token);
    expect(headers['X-Api-Resource-Id']).toBe(mockConfig.tts.resource_id);
  });

  it('allows override of resource_id via options', () => {
    const headers = buildHeaders(mockConfig, { resourceId: 'seed-tts-1.0' });

    expect(headers['X-Api-Resource-Id']).toBe('seed-tts-1.0');
  });
});

describe('buildPayload()', () => {
  it('text maps to req_params.text correctly', () => {
    const payload = buildPayload({ text: 'Hello world', config: mockConfig });

    expect(payload.req_params.text).toBe('Hello world');
  });

  it('speaker uses CLI override when provided, otherwise config value', () => {
    const withOverride = buildPayload({
      text: 'test',
      config: mockConfig,
      overrides: { voice: 'custom-voice' },
    });
    expect(withOverride.req_params.speaker).toBe('custom-voice');

    const withoutOverride = buildPayload({
      text: 'test',
      config: mockConfig,
    });
    expect(withoutOverride.req_params.speaker).toBe(mockConfig.tts.voice);
  });

  it('disable_markdown_filter is only set when true (truthy)', () => {
    // When true, addition should be set
    const enabled = buildPayload({
      text: 'test',
      config: mockConfig,
      overrides: { disableMarkdownFilter: true },
    });
    expect(enabled.req_params.additions).toBeDefined();
    expect(
      JSON.parse(enabled.req_params.additions as string).disable_markdown_filter
    ).toBe(true);

    // When false (falsy), the addition is not added at all (it's optional)
    const disabled = buildPayload({
      text: 'test',
      config: mockConfig,
      overrides: { disableMarkdownFilter: false },
    });
    expect(disabled.req_params.additions).toBeUndefined();
  });

  it('additions is not present when no addition options are provided', () => {
    const payload = buildPayload({ text: 'test', config: mockConfig });
    expect(payload.req_params.additions).toBeUndefined();
  });

  it('emotion field exists when provided, absent when undefined', () => {
    const withEmotion = buildPayload({
      text: 'test',
      config: mockConfig,
      overrides: { emotion: 'happy' },
    });
    expect((withEmotion.req_params.audio_params as any).emotion).toBe('happy');

    const withoutEmotion = buildPayload({
      text: 'test',
      config: mockConfig,
    });
    expect(
      (withoutEmotion.req_params.audio_params as any).emotion
    ).toBeUndefined();
  });

  it('silence_duration is set when provided', () => {
    const payload = buildPayload({
      text: 'test',
      config: mockConfig,
      overrides: { silence: 500 },
    });
    expect(
      JSON.parse(payload.req_params.additions as string).silence_duration
    ).toBe(500);
  });

  it('explicit_language is passed correctly', () => {
    const payload = buildPayload({
      text: 'test',
      config: mockConfig,
      overrides: { lang: 'en' },
    });
    expect(
      JSON.parse(payload.req_params.additions as string).explicit_language
    ).toBe('en');
  });

  it('can combine multiple additions', () => {
    const payload = buildPayload({
      text: 'test',
      config: mockConfig,
      overrides: {
        disableMarkdownFilter: true,
        lang: 'ja',
        silence: 1000,
      },
    });
    const additions = JSON.parse(payload.req_params.additions as string);

    expect(additions.disable_markdown_filter).toBe(true);
    expect(additions.explicit_language).toBe('ja');
    expect(additions.silence_duration).toBe(1000);
  });
});
