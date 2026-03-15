import { describe, it, expect } from 'bun:test'
import type { Config } from '../../src/config.js'
import { buildHeaders, buildPayload } from '../../src/tts.js'

const mockConfig: Config = {
  api: {
    app_id: 'test-app-id',
    token: 'test-token',
  },
  tts: {
    voice: 'zh_female_tianmei',
    resource_id: 'seed-tts-2.0',
    model: 'seed-tts-1.1',
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
}

describe('buildHeaders()', () => {
  it('returns object with X-Api-App-Id, X-Api-Access-Key, and X-Api-Resource-Id', () => {
    const headers = buildHeaders(mockConfig)

    expect(headers).toHaveProperty('X-Api-App-Id')
    expect(headers).toHaveProperty('X-Api-Access-Key')
    expect(headers).toHaveProperty('X-Api-Resource-Id')
    expect(headers).toHaveProperty('Content-Type')
  })

  it('values come from config, not hardcoded', () => {
    const headers = buildHeaders(mockConfig)

    expect(headers['X-Api-App-Id']).toBe(mockConfig.api.app_id)
    expect(headers['X-Api-Access-Key']).toBe(mockConfig.api.token)
    expect(headers['X-Api-Resource-Id']).toBe(mockConfig.tts.resource_id)
  })
})

describe('buildPayload()', () => {
  it('text maps to req_params.text correctly', () => {
    const payload = buildPayload('Hello world', mockConfig)

    expect(payload.req_params.text).toBe('Hello world')
  })

  it('speaker uses CLI override when provided, otherwise config value', () => {
    const withOverride = buildPayload('test', mockConfig, { voice: 'custom-voice' })
    expect(withOverride.req_params.speaker).toBe('custom-voice')

    const withoutOverride = buildPayload('test', mockConfig)
    expect(withoutOverride.req_params.speaker).toBe(mockConfig.tts.voice)
  })

  it('disable_markdown_filter is set according to传入值', () => {
    const enabled = buildPayload('test', mockConfig, { disableMarkdownFilter: true })
    expect((enabled.req_params.additions as any).disable_markdown_filter).toBe(true)

    const disabled = buildPayload('test', mockConfig, { disableMarkdownFilter: false })
    expect((disabled.req_params.additions as any).disable_markdown_filter).toBe(false)
  })

  it('emotion field exists when provided, absent when undefined', () => {
    const withEmotion = buildPayload('test', mockConfig, { emotion: 'happy' })
    expect((withEmotion.req_params.audio_params as any).emotion).toBe('happy')

    const withoutEmotion = buildPayload('test', mockConfig)
    expect((withoutEmotion.req_params.audio_params as any).emotion).toBeUndefined()
  })

  it('silence_duration defaults to 0', () => {
    const payload = buildPayload('test', mockConfig)
    expect((payload.req_params.additions as any).silence_duration).toBe(0)
  })

  it('explicit_language is passed correctly', () => {
    const payload = buildPayload('test', mockConfig, { lang: 'en' })
    expect((payload.req_params.additions as any).explicit_language).toBe('en')
  })
})
