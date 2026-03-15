import { homedir } from 'os'
import { join } from 'path'
import { parse, stringify } from 'smol-toml'

// Config interface
export interface Config {
  api: {
    app_id: string
    token: string
  }
  tts: {
    voice: string
    resource_id: string
    model?: string
    speed: number
    volume: number
    sample_rate: number
    bit_rate: number
    format: 'mp3' | 'pcm' | 'ogg_opus'
    lang: string
  }
  output: {
    dir: string
  }
}

// Default configuration
export const DEFAULTS: Config = {
  api: {
    app_id: '',
    token: '',
  },
  tts: {
    voice: 'en_male_tim_uranus_bigtts',
    resource_id: 'seed-tts-2.0',
    speed: 0,
    volume: 0,
    sample_rate: 24000,
    bit_rate: 128000,
    format: 'mp3',
    lang: 'en',
  },
  output: {
    dir: '~/Downloads',
  },
}

// Get config directory (cross-platform)
export function getConfigDir(): string {
  if (process.platform === 'win32') {
    return join(process.env.APPDATA ?? homedir(), 'tts-cli')
  }
  return join(homedir(), '.config', 'tts-cli')
}

// Config file path
export const CONFIG_PATH = join(getConfigDir(), 'config.toml')

// Read config file, return null if not exists
export async function readConfigFile(): Promise<Partial<Config> | null> {
  try {
    const file = Bun.file(CONFIG_PATH)
    if (!file.exists()) {
      return null
    }
    const content = await file.text()
    return parse(content) as Partial<Config>
  } catch {
    return null
  }
}

// Save config to file
export async function saveConfig(config: Config): Promise<void> {
  const configDir = getConfigDir()
  
  // Create directory if not exists
  await Bun.write(CONFIG_PATH, '')
  
  const toml = stringify(config)
  await Bun.write(CONFIG_PATH, toml)
}

// Deep merge multiple objects
export function deepMerge<T>(...objects: Partial<T>[]): T {
  const result = {} as T
  
  for (const obj of objects) {
    for (const key in obj) {
      const value = obj[key]
      if (value === undefined) {
        continue
      }
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        result[key] = deepMerge(result[key] ?? {}, value)
      } else {
        result[key] = value
      }
    }
  }
  
  return result
}

// Load config with three-layer merge: defaults < file < cliOverrides
export async function loadConfig(cliOverrides: Partial<Config> = {}): Promise<Config> {
  const fileConfig = (await readConfigFile()) ?? {}
  return deepMerge(DEFAULTS, fileConfig, cliOverrides)
}
