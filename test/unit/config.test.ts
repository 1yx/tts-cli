import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import { join } from 'path'
import { homedir } from 'os'
import {
  Config,
  DEFAULTS,
  getConfigDir,
  CONFIG_PATH,
  readConfigFile,
  saveConfig,
  deepMerge,
  loadConfig,
} from '../../src/config.js'

describe('getConfigDir()', () => {
  const originalPlatform = process.platform
  const originalEnv = process.env

  afterEach(() => {
    Object.defineProperty(process, 'platform', {
      value: originalPlatform,
    })
    process.env = originalEnv
  })

  it('returns ~/.config/tts-cli on macOS', () => {
    Object.defineProperty(process, 'platform', {
      value: 'darwin',
    })
    expect(getConfigDir()).toBe(join(homedir(), '.config', 'tts-cli'))
  })

  it('returns ~/.config/tts-cli on Linux', () => {
    Object.defineProperty(process, 'platform', {
      value: 'linux',
    })
    expect(getConfigDir()).toBe(join(homedir(), '.config', 'tts-cli'))
  })

  it('returns %APPDATA%\\tts-cli on Windows', () => {
    Object.defineProperty(process, 'platform', {
      value: 'win32',
    })
    process.env.APPDATA = 'C:\\Users\\Test\\AppData\\Roaming'
    expect(getConfigDir()).toBe(join('C:\\Users\\Test\\AppData\\Roaming', 'tts-cli'))
  })
})

describe('deepMerge()', () => {
  it('CLI params override file config values', () => {
    const defaults = { voice: 'default-voice', speed: 0 }
    const fileConfig = { voice: 'file-voice', speed: 10 }
    const cliOverrides = { voice: 'cli-voice' }
    
    const result = deepMerge(defaults, fileConfig, cliOverrides)
    
    expect(result.voice).toBe('cli-voice')
    expect(result.speed).toBe(10)
  })

  it('undefined CLI params preserve file config values', () => {
    const defaults = { voice: 'default-voice', speed: 0 }
    const fileConfig = { voice: 'file-voice', speed: 10 }
    const cliOverrides = { voice: 'cli-voice', speed: undefined }
    
    const result = deepMerge(defaults, fileConfig, cliOverrides)
    
    expect(result.voice).toBe('cli-voice')
    expect(result.speed).toBe(10)
  })

  it('missing file config fields fall back to defaults', () => {
    const defaults = { voice: 'default-voice', speed: 0, volume: 50 }
    const fileConfig = { voice: 'file-voice' }
    const cliOverrides = {}
    
    const result = deepMerge(defaults, fileConfig, cliOverrides)
    
    expect(result.voice).toBe('file-voice')
    expect(result.speed).toBe(0)
    expect(result.volume).toBe(50)
  })

  it('correct priority: CLI > file > defaults', () => {
    const defaults = { api: { app_id: 'default-id', token: 'default-token' } }
    const fileConfig = { api: { app_id: 'file-id', token: 'file-token' } }
    const cliOverrides = { api: { app_id: 'cli-id' } }
    
    const result = deepMerge(defaults, fileConfig, cliOverrides)
    
    expect(result.api.app_id).toBe('cli-id')
    expect(result.api.token).toBe('file-token')
  })
})

describe('loadConfig()', () => {
  const testConfigPath = '/tmp/test-tts-cli-config.toml'

  it('returns pure defaults when config file does not exist', () => {
    const config = loadConfig()
    
    expect(config.tts.voice).toBe(DEFAULTS.tts.voice)
    expect(config.tts.speed).toBe(DEFAULTS.tts.speed)
    expect(config.api.app_id).toBe(DEFAULTS.api.app_id)
  })

  it('CLI overrides correctly override corresponding fields', () => {
    const cliOverrides: Partial<Config> = {
      tts: { voice: 'cli-voice' },
    }
    
    const config = loadConfig(cliOverrides)
    
    expect(config.tts.voice).toBe('cli-voice')
    expect(config.tts.speed).toBe(DEFAULTS.tts.speed)
  })
})
