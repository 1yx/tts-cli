import { existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { parse, stringify } from 'smol-toml';

// Config interface
/**
 *
 */
export type Config = {
  api: {
    app_id: string;
    token: string;
  };
  tts: {
    voice: string;
    resource_id: string;
    speed: number;
    volume: number;
    sample_rate: number;
    bit_rate: number;
    format: 'mp3' | 'pcm' | 'ogg_opus';
    lang: string;
  };
  output: {
    dir: string;
  };
};

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
};

// Get config directory (cross-platform)
/**
 *
 */
export function getConfigDir(): string {
  if (process.platform === 'win32') {
    return join(process.env.APPDATA ?? homedir(), 'tts-cli');
  }
  return join(homedir(), '.config', 'tts-cli');
}

// Config file path
export const CONFIG_PATH = join(getConfigDir(), 'config.toml');

// Read config file, return null if not exists
/**
 *
 */
export async function readConfigFile(): Promise<Partial<Config> | null> {
  try {
    const file = Bun.file(CONFIG_PATH);
    if (!file.exists()) {
      return null;
    }
    const content = await file.text();
    const parsed: unknown = parse(content);
    return parsed as Partial<Config>;
  } catch (err) {
    // Only throw error if file exists (parse error), not if it doesn't exist
    if (existsSync(CONFIG_PATH)) {
      throw new Error(
        `Failed to parse config file: ${CONFIG_PATH}\nError: ${err}`
      );
    }
    return null;
  }
}

// Save config to file (minimal: only non-default api credentials)
/**
 *
 */
export async function saveConfig(config: Config): Promise<void> {
  // Create directory if not exists
  await Bun.write(CONFIG_PATH, '');

  // Only save api.app_id and api.token if they are non-empty
  const minimalConfig: { api?: { app_id?: string; token?: string } } = {};
  if (config.api.app_id && config.api.app_id !== DEFAULTS.api.app_id) {
    minimalConfig.api = {
      app_id: config.api.app_id,
    };
  }
  if (config.api.token && config.api.token !== DEFAULTS.api.token) {
    if (!minimalConfig.api) {
      minimalConfig.api = {};
    }
    minimalConfig.api.token = config.api.token;
  }

  const toml = stringify(minimalConfig);
  await Bun.write(CONFIG_PATH, toml);
}

// Deep merge multiple objects
/**
 *
 */
export function deepMerge<T>(...objects: Partial<T>[]): T {
  const result: Record<string, unknown> = {};

  for (const obj of objects) {
    for (const key in obj) {
      const value = obj[key];
      if (value === undefined) {
        continue;
      }
      if (
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value)
      ) {
        const existingValue = result[key];
        const baseValue =
          typeof existingValue === 'object' && existingValue !== null
            ? (existingValue as Record<string, unknown>)
            : {};
        // eslint-disable-next-line no-restricted-syntax
        result[key] = deepMerge(baseValue, value as Record<string, unknown>);
      } else {
        result[key] = value;
      }
    }
  }

  // eslint-disable-next-line no-restricted-syntax
  return result as T;
}

// Load config with three-layer merge: defaults < file < cliOverrides
/**
 *
 */
export async function loadConfig(
  cliOverrides: Partial<Config> = {}
): Promise<Config> {
  const fileConfig = (await readConfigFile()) ?? {};
  return deepMerge(DEFAULTS, fileConfig, cliOverrides);
}
