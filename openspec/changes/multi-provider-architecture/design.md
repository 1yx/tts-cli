## Context

Current tts-cli has 934 lines in `src/tts.ts` with VolcEngine-specific logic tightly coupled:

- Authentication headers (`X-Api-App-Id`, `X-Api-Access-Key`)
- Payload structure (`req_params`, `audio_params`, `additions`)
- Response parsing (newline-delimited JSON with base64-encoded audio)
- Progress tracking via `sentence.text` character count

Adding a new provider requires duplicating this logic or creating unmaintainable conditional branches.

## Goals / Non-Goals

**Goals:**

- Enable multiple TTS providers (VolcEngine, OpenAI, Azure, ElevenLabs, etc.) with unified interface
- Separate provider-specific logic from core TTS orchestration (UI, progress, ffplay, ffmpeg)
- Support different protocols (HTTP Chunked, WebSocket, raw binary) via AsyncIterable abstraction
- Maintain backward compatibility with existing config files
- Enable future protocol additions without major refactoring
- Follow Clean Architecture / DDD principles with dependency inversion

**Non-Goals:**

- Implementing additional providers beyond VolcEngine in this change
- Changing CLI argument structure
- Modifying existing TTS behavior or capabilities

## Decisions

### 0. Clean Architecture Dependency Rule

**Decision:** Enforce strict dependency rule where `core/` defines contracts and `providers/` implements them. Core must never import from providers.

**Rationale:**

- Dependency Inversion Principle (DIP): high-level policies (core) should not depend on low-level details (providers)
- Core defines the "language" of the domain; providers "speak" that language
- Enables swapping providers without touching core logic
- Testability: core can be tested with mock providers

**Dependency flow:**

```
providers/ ──────> core/
    │                  │
    │                  │
    ▼                  ▼
Implementation    Contract
```

### 1. Core Type Contract (src/core/types.ts)

**Decision:** Define `TTSProvider` interface with `format` property as static declaration, not a method.

**Rationale:** Provider output format is intrinsic to the provider (VolcEngine always outputs PCM 24000Hz). Making it a method adds unnecessary indirection. Static property allows compile-time validation and simpler factory logic.

```typescript
export interface AudioFormat {
  type: 'pcm' | 'mp3' | 'opus';
  sampleRate?: number; // Required for PCM
  channels?: number; // Required for PCM
  bitDepth?: number; // Required for PCM
}

export interface TTSProvider {
  name: string;
  format: AudioFormat;
  validateCredentials(config: any): Promise<boolean>;
  synthesize(text: string, options: any): Promise<TTSStream>;
}
```

### 2. AsyncIterable for Stream Abstraction

**Decision:** Use `AsyncIterable<Uint8Array>` for audio chunks, not EventEmitter or custom stream class.

**Rationale:**

- Native JavaScript async iteration syntax (`for await...of`)
- No additional dependencies (unlike RxJS or EventEmitter)
- Easy to implement with `async *` generator functions
- Composable with standard stream transformations

**Alternative considered:** EventEmitter - rejected due to additional complexity and non-standard pattern for data streams.

### 3. Facade Pattern for Multi-Protocol Providers

**Decision:** When a provider supports multiple protocols (HTTP + WebSocket), use directory structure with `index.ts` as Facade routing to protocol-specific implementations.

**Rationale:**

- Prevents "mini-monolith" within a single provider file
- Separates concerns: auth logic shared, protocol logic isolated
- Enables independent testing of each protocol
- Matches industry patterns (AWS SDK v3, ORMs)

**Directory structure:**

```
src/providers/volcengine/
├── index.ts       # Facade implementing TTSProvider, routes to HTTP/WS
├── http.ts        # HTTP Chunked implementation
├── websocket.ts   # WebSocket implementation (future)
├── auth.ts        # Shared signature logic
└── types.ts       # VolcEngine private types
```

### 4. Configuration Migration Strategy

**Decision:** Detect legacy config format in `loadConfig()` and auto-migrate in-memory without overwriting user's config file.

**Rationale:**

- Zero friction upgrade for existing users
- Avoids config file corruption risk
- Users can opt to save migrated config later if desired

**Migration logic:**

```typescript
function isLegacyConfig(config: any): boolean {
  return config.api?.app_id !== undefined && config.providers === undefined;
}

function migrateLegacyConfig(config: any): Config {
  return {
    provider: 'volcengine',
    providers: {
      volcengine: {
        app_id: config.api.app_id,
        token: config.api.token,
        // ... migrate tts fields
      },
    },
  };
}
```

### 5. Provider Factory Pattern

**Decision:** Simple factory function `createProvider(name, config)` that imports and instantiates providers directly.

**Rationale:**

- No need for complex registration system (built-in providers are known)
- TypeScript will catch typos in provider names at compile time
- Can evolve to dynamic registration if external plugins are needed

**Alternative considered:** Registry pattern with `registerProvider()` - rejected as over-engineering for current needs.

### 6. Audio Format Declaration

**Decision:** Provider declares format via `format` property; calling code uses this to construct ffplay arguments.

**Rationale:**

- ffplay requires format-specific arguments (`-f s16le -ar 24000` for PCM vs `-f mp3` for MP3)
- Moving format knowledge into provider eliminates conditional logic in `tts.ts`

**ffplay construction:**

```typescript
function spawnFfplayForProvider(provider: TTSProvider): ChildProcess {
  const { type, sampleRate, channels, bitDepth } = provider.format;
  let args: string[];
  if (type === 'pcm') {
    args = ['-f', bitDepth === 16 ? 's16le' : ..., '-ar', String(sampleRate!), ...];
  } else {
    args = ['-f', type, ...];  // ffplay auto-detects
  }
  return spawn('ffplay', args, { stdin: 'pipe' });
}
```

### 7. Core Error Types (src/core/errors.ts)

**Decision:** Define domain-specific error types in core that all providers must throw for known error conditions.

**Rationale:**

- Enables centralized error handling and user-friendly messages
- Calling code can catch specific error types (auth vs quota vs rate_limit)
- Separates error classification from provider implementation

**Error types:**

```typescript
export class ProviderAuthError extends Error {
  constructor(
    public provider: string,
    message: string,
  ) {
    super(`[${provider}] Authentication failed: ${message}`);
    this.name = 'ProviderAuthError';
  }
}

export class ProviderQuotaError extends Error {
  constructor(
    public provider: string,
    message: string,
  ) {
    super(`[${provider}] Quota exceeded: ${message}`);
    this.name = 'ProviderQuotaError';
  }
}

export class ProviderRateLimitError extends Error {
  constructor(
    public provider: string,
    retryAfter?: number,
  ) {
    super(`[${provider}] Rate limited${retryAfter ? `, retry after ${retryAfter}s` : ''}`);
    this.name = 'ProviderRateLimitError';
  }
}

export class ProviderValidationError extends Error {
  constructor(
    public provider: string,
    message: string,
  ) {
    super(`[${provider}] Validation failed: ${message}`);
    this.name = 'ProviderValidationError';
  }
}
```

### 8. Core Constants (src/core/constants.ts)

**Decision:** Define domain constants in core to avoid magic numbers and ensure consistency across providers.

**Rationale:**

- Single source of truth for supported formats, default values
- Enables validation and type safety
- Easier to maintain and update

**Constants:**

```typescript
export const SUPPORTED_FORMATS = ['mp3', 'pcm', 'opus'] as const;
export type SupportedFormat = (typeof SUPPORTED_FORMATS)[number];

export const DEFAULT_SAMPLE_RATE = 24000;
export const DEFAULT_CHANNELS = 1;
export const DEFAULT_BIT_DEPTH = 16;

export const MIN_SPEED = -50;
export const MAX_SPEED = 100;
export const MIN_VOLUME = -50;
export const MAX_VOLUME = 100;
```

### 9. Optional Base Provider (src/core/base.ts)

**Decision:** Create optional abstract base class that providers can extend for common functionality.

**Rationale:**

- Reduces boilerplate in provider implementations
- Provides common validation and error handling logic
- Still optional - providers can implement interface directly if preferred

**Base class:**

```typescript
export abstract class BaseProvider implements TTSProvider {
  abstract name: string;
  abstract format: AudioFormat;

  // Common validation logic
  protected validateSpeed(speed: number): void {
    if (speed < MIN_SPEED || speed > MAX_SPEED) {
      throw new ProviderValidationError(
        this.name,
        `Speed must be between ${MIN_SPEED} and ${MAX_SPEED}`,
      );
    }
  }

  protected validateVolume(volume: number): void {
    if (volume < MIN_VOLUME || volume > MAX_VOLUME) {
      throw new ProviderValidationError(
        this.name,
        `Volume must be between ${MIN_VOLUME} and ${MAX_VOLUME}`,
      );
    }
  }

  // Subclasses must implement these
  abstract validateCredentials(config: any): Promise<boolean>;
  abstract synthesize(text: string, options: any): Promise<TTSStream>;
}
```

## Risks / Trade-offs

### Risk: AsyncIterable compatibility across Node versions

**Mitigation:** AsyncIterable is ES2018 feature, supported in Node 10+. Bun has full support. This is not a practical concern.

### Risk: Config migration edge cases

**Risk:** Malformed legacy config could cause migration errors.
**Mitigation:** Wrap migration in try-catch, fall back to treating as new format with clear error message.

### Risk: Breaking existing workflows

**Risk:** Refactor could introduce subtle bugs in existing VolcEngine integration.
**Mitigation:** Comprehensive testing of download and play modes before/after refactor. Keep error handling logic intact.

### Trade-off: Additional abstraction layer

**Trade-off:** More files, more indirection, slightly more complex code navigation.
**Benefit:** Each file has single responsibility, easier to test, enables future providers.

## Migration Plan

### Phase 1: Core Abstraction (no user-facing changes)

1. Create `src/core/types.ts` with `TTSProvider` and `TTSStream` interfaces
2. Create `src/providers/volcengine/` directory structure
3. Implement `VolcEngineHTTP` class with current API logic
4. Create `VolcEngineProvider` Facade in `index.ts`

### Phase 2: Config Migration

1. Update `Config` type in `src/config.ts` for multi-provider structure
2. Implement `migrateConfig()` function with legacy detection
3. Update `loadConfig()` to call migration
4. Test with existing config files

### Phase 3: Refactor TTS Logic

1. Update `src/tts.ts` to use `createProvider()` factory
2. Replace direct API calls with `provider.synthesize()`
3. Update ffplay spawning to use `provider.format`
4. Verify all modes work (download, play, force, local file)

### Phase 4: Verification

1. Test with legacy config format
2. Test with new config format
3. Test CLI credential overrides
4. Test error handling paths

### Rollback Strategy

- Keep refactor on separate branch
- Tag pre-refactor commit
- If critical bug found, revert and iterate

## Open Questions

1. **Should config file be updated after migration?**
   - Current: In-memory only, no disk write
   - Alternative: Save migrated config automatically
   - **Decision:** Defer to user preference, add `--migrate-config` flag if needed

2. **Should subtitle support be mandatory in interface?**
   - Current: Optional via empty iterable return
   - Alternative: Separate `SubtitleProvider` interface
   - **Decision:** Keep optional in main interface for simplicity

3. **How to handle provider-specific CLI arguments (like `--resource-id`)?**
   - Current: Keep existing arguments, map to provider options
   - Future: Consider `--provider-opt key=value` pattern for generic options
   - **Decision:** Keep current approach, add generic provider options if complexity grows
