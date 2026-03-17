## 1. Core Type Definitions

- [ ] 1.1 Create `src/core/types.ts` with `AudioFormat` type
- [ ] 1.2 Create `TTSStream` interface with `getAudioChunks()`, `getSubtitleChunks()`, `close()`, `getAudioFormat()` methods
- [ ] 1.3 Create `TTSProvider` interface with `name`, `format`, `validateCredentials()`, `synthesize()` members
- [ ] 1.4 Create `SubtitleChunk` type with optional `words` array
- [ ] 1.5 Create `SubtitleChunk` type with optional `words` array
- [ ] 1.6 Export all types from `src/core/index.ts`

## 2. Core Error Types

- [ ] 2.1 Create `src/core/errors.ts` with domain-specific error classes
- [ ] 2.2 Implement `ProviderAuthError` class
- [ ] 2.3 Implement `ProviderQuotaError` class
- [ ] 2.4 Implement `ProviderRateLimitError` class
- [ ] 2.5 Implement `ProviderValidationError` class
- [ ] 2.6 Export all error types from `src/core/index.ts`

## 3. Core Constants

- [ ] 3.1 Create `src/core/constants.ts` with domain constants
- [ ] 3.2 Define `SUPPORTED_FORMATS` constant array
- [ ] 3.3 Define `DEFAULT_SAMPLE_RATE`, `DEFAULT_CHANNELS`, `DEFAULT_BIT_DEPTH`
- [ ] 3.4 Define `MIN_SPEED`, `MAX_SPEED`, `MIN_VOLUME`, `MAX_VOLUME`
- [ ] 3.5 Export all constants from `src/core/index.ts`

## 4. Optional Base Provider

- [ ] 4.1 Create `src/core/base.ts` with abstract `BaseProvider` class
- [ ] 4.2 Implement `validateSpeed()` protected method
- [ ] 4.3 Implement `validateVolume()` protected method
- [ ] 4.4 Export `BaseProvider` from `src/core/index.ts`

## 5. VolcEngine Provider Structure

- [ ] 5.1 Create `src/providers/volcengine/` directory
- [ ] 5.2 Create `src/providers/volcengine/types.ts` with VolcEngine-specific types (config, chunk, error codes)
- [ ] 5.3 Create `src/providers/volcengine/auth.ts` with `buildAuthHeaders()` function
- [ ] 5.4 Create `src/providers/volcengine/http.ts` with `VolcEngineHTTP` class
- [ ] 5.5 Create `src/providers/volcengine/index.ts` with `VolcEngineProvider` Facade class
- [ ] 5.6 Export `VolcEngineProvider` from `src/providers/index.ts`

## 6. VolcEngineHTTP Implementation

- [ ] 6.1 Implement `synthesize()` method in `VolcEngineHTTP` class
- [ ] 6.2 Create `VolcEngineStream` class implementing `TTSStream` interface
- [ ] 6.3 Implement `getAudioChunks()` as async generator parsing HTTP Chunked JSON
- [ ] 6.4 Implement `getSubtitleChunks()` extracting sentence data from chunks
- [ ] 6.5 Implement `getAudioFormat()` returning PCM format declaration
- [ ] 6.6 Implement `validateCredentials()` sending empty string to API
- [ ] 6.7 Add error handling mapping VolcEngine error codes to core error types

## 7. Provider Factory

- [ ] 7.1 Create `createProvider(name, config)` function in `src/providers/index.ts`
- [ ] 7.2 Implement provider name lookup and instantiation logic
- [ ] 7.3 Add error handling for unknown provider names
- [ ] 7.4 Export factory function and `TTSProvider` type

## 8. Configuration Refactoring

- [ ] 8.1 Update `Config` type in `src/config.ts` with `provider` and `providers` fields
- [ ] 8.2 Create `isLegacyConfig()` type guard function
- [ ] 8.3 Create `migrateLegacyConfig()` function
- [ ] 8.4 Update `loadConfig()` to detect and migrate legacy configs
- [ ] 8.5 Update `DEFAULTS` with default `provider: 'volcengine'`
- [ ] 8.6 Update `saveConfig()` to handle new structure

## 9. TTS Logic Refactoring

- [ ] 9.1 Update `src/tts.ts` to import `createProvider` from providers
- [ ] 9.2 Refactor `runDownloadMode()` to use `provider.synthesize()`
- [ ] 9.3 Refactor `runPlayMode()` to use `provider.synthesize()`
- [ ] 9.4 Replace direct API calls with `for await` iteration over `stream.getAudioChunks()`
- [ ] 9.5 Update `spawnFfplay()` to use `provider.format` for argument construction
- [ ] 9.6 Remove VolcEngine-specific code (headers, payload parsing, etc.)

## 10. Progress and Subtitle Handling

- [ ] 10.1 Adapt progress bar logic to work with provider-agnostic stream
- [ ] 10.2 Update subtitle extraction to use `stream.getSubtitleChunks()`
- [ ] 10.3 Handle providers that don't support subtitles (empty iterable)
- [ ] 10.4 Ensure character-based progress works with different provider responses

## 11. Testing and Verification

- [ ] 11.1 Test download mode with legacy config format (auto-migration)
- [ ] 11.2 Test download mode with new config format
- [ ] 11.3 Test play mode with local file playback
- [ ] 11.4 Test play mode with generation and streaming
- [ ] 11.5 Test `--validate` flag with provider abstraction
- [ ] 11.6 Test CLI credential overrides work correctly
- [ ] 11.7 Test error handling for invalid credentials
- [ ] 11.8 Test subtitle generation and output

## 12. Cleanup and Documentation

- [ ] 12.1 Remove unused VolcEngine constants and types from `src/tts.ts`
- [ ] 12.2 Update CLAUDE.md with new provider architecture documentation
- [ ] 12.3 Update README with multi-provider configuration examples
- [ ] 12.4 Add inline documentation to provider interfaces
- [ ] 12.5 Run typecheck and fix any TypeScript errors
