/**
 * VolcEngine authentication and signature logic.
 *
 * This module contains shared authentication logic for HTTP and WebSocket protocols.
 */

import type { VolcEngineConfig } from './types.js';

/**
 * Build HTTP headers for VolcEngine TTS API request.
 */
export function buildAuthHeaders(config: VolcEngineConfig): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Api-App-Id': config.app_id,
    'X-Api-Access-Key': config.token,
  };

  if (config.resource_id) {
    headers['X-Api-Resource-Id'] = config.resource_id;
  }

  return headers;
}

/**
 * Check if response indicates authentication failure.
 */
export function isAuthError(code: number): boolean {
  return code === 45000010; // VolcEngine error code for auth failure
}

/**
 * Check if response indicates resource mismatch.
 */
export function isResourceMismatchError(code: number): boolean {
  return code === 55000000;
}
