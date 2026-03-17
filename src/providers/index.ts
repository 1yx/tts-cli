/**
 * Provider factory and exports.
 *
 * Dynamically instantiates providers based on configuration.
 */

import type { TTSProvider, ProviderConfig } from '../core/types.js';
import { VolcEngineProvider } from './volcengine/index.js';
// import { OpenAIProvider } from './openai/index.js'; // Future

/**
 * Create a provider instance by name.
 * @param name Provider name (e.g., 'volcengine', 'openai')
 * @param config Configuration object with provider-specific settings
 * @returns Provider instance implementing TTSProvider
 * @throws Error if provider name is unknown
 */
export function createProvider(
  name: string,
  config: { providers: Record<string, ProviderConfig> },
): TTSProvider {
  const providerConfig = config.providers[name];

  switch (name) {
    case 'volcengine':
      return new VolcEngineProvider(providerConfig as any);
    // case 'openai':
    //   return new OpenAIProvider(providerConfig as any);
    default:
      throw new Error(`Unknown provider: ${name}. Available: volcengine`);
  }
}

export { VolcEngineProvider } from './volcengine/index.js';
export type { TTSProvider, ProviderConfig } from '../core/types.js';
