/**
 * VolcEngine Provider Facade.
 *
 * Implements TTSProvider interface and routes to appropriate protocol implementation.
 * This is the main entry point for the VolcEngine provider.
 */

import type { TTSProvider, AudioFormat, SynthesizeOptions, ProviderConfig } from '../../core/types.js';
import { VolcEngineHTTP } from './http.js';
// import { VolcEngineWS } from './websocket.js'; // Future
import type { VolcEngineConfig } from './types.js';

/**
 * VolcEngine TTS Provider.
 *
 * Supports Doubao (豆包) TTS API from Volcano Engine.
 * Default format: PCM 24kHz mono 16-bit.
 */
export class VolcEngineProvider implements TTSProvider {
  name = 'volcengine';

  format: AudioFormat = {
    type: 'pcm',
    sampleRate: 24000,
    channels: 1,
    bitDepth: 16,
  };

  private implementation: TTSProvider;

  /**
   * Create a new VolcEngine provider instance.
   * @param config Provider configuration
   */
  constructor(config: VolcEngineConfig) {
    // Strategy routing: HTTP vs WebSocket
    // Currently only HTTP is implemented
    if (config.protocol === 'websocket') {
      // TODO: Implement WebSocket support
      throw new Error('WebSocket protocol not yet implemented for VolcEngine');
    } else {
      this.implementation = new VolcEngineHTTP(config);
    }
  }

  /**
   * Validate credentials with VolcEngine API.
   */
  async validateCredentials(): Promise<boolean> {
    return this.implementation.validateCredentials();
  }

  /**
   * Synthesize speech from text.
   */
  async synthesize(
    text: string,
    options: SynthesizeOptions & ProviderConfig
  ): Promise<import('../../core/types.js').TTSStream> {
    return this.implementation.synthesize(text, options);
  }
}
