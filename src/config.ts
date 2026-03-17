import { existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { parse, stringify } from 'smol-toml';

/**
 * Legacy config format (for migration detection)
 */
export type LegacyConfig = {
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
};

/**
 * Provider-specific configuration (supports partial values for merging)
 */
export type ProviderConfigs = {
  volcengine?: {
    app_id?: string;
    token?: string;
    resource_id?: string;
  };
  // Future providers: openai, elevenlabs, etc.
};

/**
 * Unified config supporting both legacy and multi-provider formats.
 * - Legacy format: { api: {...}, tts: {...} }
 * - New format: { provider: 'volcengine', providers: { volcengine: {...} } }
 */
export type Config = {
  /** Default provider name */
  provider?: string;
  /** Per-provider configurations */
  providers?: ProviderConfigs;
  /** Legacy fields (auto-migrated on load) */
  api?: {
    app_id: string;
    token: string;
  };
  tts?: {
    voice: string;
    resource_id: string;
    speed: number;
    volume: number;
    sample_rate: number;
    bit_rate: number;
    format: 'mp3' | 'pcm' | 'ogg_opus';
    lang: string;
  };
};

// Default configuration
export const DEFAULTS: Config = {
  provider: 'volcengine',
  providers: {
    volcengine: {
      app_id: '',
      token: '',
      resource_id: 'seed-tts-2.0',
    },
  },
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
};

/**
 * Type guard to detect legacy config format.
 * Legacy configs have `api.app_id` and `api.token` at top level.
 */
export function isLegacyConfig(config: Partial<Config>): config is LegacyConfig {
  return 'api' in config && typeof config.api === 'object' && config.api !== null;
}

/**
 * Migrate legacy config to new multi-provider format.
 * Converts { api: { app_id, token }, tts: {...} }
 * to { provider: 'volcengine', providers: { volcengine: { app_id, token, resource_id } } }
 */
export function migrateLegacyConfig(legacy: LegacyConfig): Config {
  return {
    provider: 'volcengine',
    providers: {
      volcengine: {
        app_id: legacy.api.app_id,
        token: legacy.api.token,
        resource_id: legacy.tts?.resource_id || 'seed-tts-2.0',
      },
    },
    // Preserve tts settings for backward compatibility
    tts: legacy.tts,
  };
}

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
    if (!(await file.exists())) {
      return null;
    }
    const content = await file.text();
    const parsed: unknown = parse(content);
    // eslint-disable-next-line no-restricted-syntax
    return parsed as Partial<Config>;
  } catch (err) {
    // Only throw error if file exists (parse error), not if it doesn't exist
    if (existsSync(CONFIG_PATH)) {
      throw new Error(`Failed to parse config file: ${CONFIG_PATH}\nError: ${err}`);
    }
    return null;
  }
}

// Save config to file (minimal: only non-default provider credentials)
/**
 *
 * Saves in new multi-provider format:
 * ```toml
 * provider = "volcengine"
 *
 * [providers.volcengine]
 * app_id = "..."
 * token = "..."
 * resource_id = "seed-tts-2.0"
 * ```
 */
export async function saveConfig(config: Config): Promise<void> {
  // Create directory if not exists
  await Bun.write(CONFIG_PATH, '');

  // Save in new multi-provider format
  const minimalConfig: {
    provider?: string;
    providers?: Record<string, Record<string, unknown>>;
  } = {};

  // Save provider name if not default
  if (config.provider && config.provider !== DEFAULTS.provider) {
    minimalConfig.provider = config.provider;
  }

  // Save provider credentials if non-empty and non-default
  const volcConfig = config.providers?.volcengine;
  if (volcConfig) {
    const providerConfig: Record<string, unknown> = {};
    if (volcConfig.app_id && volcConfig.app_id !== DEFAULTS.providers?.volcengine?.app_id) {
      providerConfig.app_id = volcConfig.app_id;
    }
    if (volcConfig.token && volcConfig.token !== DEFAULTS.providers?.volcengine?.token) {
      providerConfig.token = volcConfig.token;
    }
    if (
      volcConfig.resource_id &&
      volcConfig.resource_id !== DEFAULTS.providers?.volcengine?.resource_id
    ) {
      providerConfig.resource_id = volcConfig.resource_id;
    }

    if (Object.keys(providerConfig).length > 0) {
      minimalConfig.providers = {
        volcengine: providerConfig,
      };
    }
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
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        const existingValue = result[key];
        const baseValue =
          typeof existingValue === 'object' && existingValue !== null
            ? // eslint-disable-next-line no-restricted-syntax
              (existingValue as Record<string, unknown>)
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

// Load config with multi-layer merge: defaults < file < cliOverrides < inMemoryCredentials
/**
 * Optional inMemoryCredentials parameter for first-run scenario where
 * credentials are collected but not yet saved to disk.
 * inMemoryCredentials has the highest priority, overriding all other sources.
 *
 * Auto-migrates legacy config format to new multi-provider format.
 */
export async function loadConfig(
  cliOverrides: Partial<Config> = {},
  inMemoryCredentials?: { app_id: string; token: string },
): Promise<Config> {
  // Read from file
  let fileConfig = (await readConfigFile()) ?? {};

  // Auto-migrate legacy format
  if (isLegacyConfig(fileConfig)) {
    // Migrate and immediately save to update config file
    fileConfig = migrateLegacyConfig(fileConfig);
    // Note: We don't auto-save here to avoid side effects during read
    // The migrated config will be saved on next saveConfig() call
  }

  // Merge in order: DEFAULTS < fileConfig < cliOverrides < inMemoryCredentials (if provided)
  if (inMemoryCredentials) {
    return deepMerge(DEFAULTS, fileConfig, cliOverrides, {
      providers: {
        volcengine: inMemoryCredentials,
      },
    });
  }

  return deepMerge(DEFAULTS, fileConfig, cliOverrides);
}
