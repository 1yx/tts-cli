## Why

Currently tts-cli is tightly coupled to VolcEngine (Doubao) TTS API. All provider-specific logic (authentication headers, payload format, response parsing) is mixed into `src/tts.ts`, making it difficult to add support for other TTS providers like OpenAI, Azure, or ElevenLabs without duplicating code or creating a maintenance nightmare.

## What Changes

**Core Abstraction Layer:**

- Create `src/core/types.ts` defining the `TTSProvider` interface contract that all providers must implement
- Create `src/core/errors.ts` defining unified provider error types (auth, quota, rate_limit)
- Create `src/core/constants.ts` defining domain constants (supported formats, default values)
- Create `src/core/base.ts` (optional) with abstract base class for common provider logic
- Define `TTSStream` interface with `AsyncIterable<Uint8Array>` for audio chunks to normalize different protocols (HTTP Chunked JSON, WebSocket, raw binary)

**Provider Structure (Facade Pattern):**

- Create `src/providers/` directory for provider implementations
- Create `src/providers/volcengine/` subdirectory with Facade pattern:
  - `index.ts` - Main entry point implementing `TTSProvider`, routes to HTTP/WebSocket strategies
  - `http.ts` - HTTP Chunked streaming implementation
  - `websocket.ts` - WebSocket implementation (future)
  - `auth.ts` - Shared authentication and signature logic
  - `types.ts` - VolcEngine-specific type definitions
- Create `src/providers/index.ts` as provider factory

**Refactor Existing Code:**

- Move VolcEngine-specific code from `src/tts.ts` into `providers/volcengine/`
- Refactor `src/tts.ts` to be provider-agnostic: handles UI (progress bar), data flow pipeline, and ffplay/ffmpeg scheduling only
- Refactor `src/config.ts` for multi-provider configuration with backward compatibility

**Configuration Changes:**

- Add `provider` field to config (defaults to 'volcengine' for compatibility)
- Namespace provider configs under `providers.volcengine`, `providers.openai`, etc.
- Implement auto-migration probe for legacy config format (flat `api.app_id` structure)

## Capabilities

### New Capabilities

- **`tts-provider`**: Provider abstraction layer enabling multiple TTS platforms with unified interface
- **`provider-config`**: Multi-provider configuration with namespaced provider settings and auto-migration
- **`provider-factory`**: Dynamic provider instantiation based on configuration

### Modified Capabilities

- **`tts-convert`**: Implementation changes to use provider abstraction instead of direct API calls (no requirement changes)
- **`tts-play`**: Implementation changes to use provider abstraction (no requirement changes)

## Impact

- **Code changes**: `src/tts.ts` (refactor to provider-agnostic), `src/config.ts` (multi-provider support), new `src/core/` and `src/providers/` directories
- **Configuration**: Config file structure changes (auto-migration provided for backward compatibility)
- **CLI arguments**: No changes to existing CLI arguments; internal routing through provider layer
- **Audio format negotiation**: Providers must declare output format (PCM/MP3/OPUS) so ffplay can use correct parameters
- **Testing**: Each provider/protocol can be tested independently
