## 1. Core Type Definitions

- [x] 1.1 Create `src/core/types.ts` with `AudioFormat` type
- [x] 1.2 Create `TTSStream` interface with `getAudioChunks()`, `getSubtitleChunks()`, `close()`, `getAudioFormat()` methods
- [x] 1.3 Create `TTSProvider` interface with `name`, `format`, `validateCredentials()`, `synthesize()` members
- [x] 1.4 Create `SubtitleChunk` type with optional `words` array
- [x] 1.5 Create `SubtitleChunk` type with optional `words` array
- [x] 1.6 Export all types from `src/core/index.ts`

## 2. Core Error Types

- [x] 2.1 Create `src/core/errors.ts` with domain-specific error classes
- [x] 2.2 Implement `ProviderAuthError` class
- [x] 2.3 Implement `ProviderQuotaError` class
- [x] 2.4 Implement `ProviderRateLimitError` class
- [x] 2.5 Implement `ProviderValidationError` class
- [ ] 2.6 Export all error types from `src/core/index.ts`

## 3. Core Constants

- [x] 3.1 Create `src/core/constants.ts` with domain constants
- [x] 3.2 Define `SUPPORTED_FORMATS` constant array
- [x] 3.3 Define `DEFAULT_SAMPLE_RATE`, `DEFAULT_CHANNELS`, `DEFAULT_BIT_DEPTH`
- [x] 3.4 Define `MIN_SPEED`, `MAX_SPEED`, `MIN_VOLUME`, `MAX_VOLUME`
- [ ] 3.5 Export all constants from `src/core/index.ts`

## 4. Optional Base Provider

- [x] 4.1 Create `src/core/base.ts` with abstract `BaseProvider` class
- [x] 4.2 Implement `validateSpeed()` protected method
- [x] 4.3 Implement `validateVolume()` protected method
- [ ] 4.4 Export `BaseProvider` from `src/core/index.ts`

## 5. VolcEngine Provider Structure

- [x] 5.1 Create `src/providers/volcengine/` directory
- [x] 5.2 Create `src/providers/volcengine/types.ts` with VolcEngine-specific types (config, chunk, error codes)
- [x] 5.3 Create `src/providers/volcengine/auth.ts` with `buildAuthHeaders()` function
- [x] 5.4 Create `src/providers/volcengine/http.ts` with `VolcEngineHTTP` class
- [x] 5.5 Create `src/providers/volcengine/index.ts` with `VolcEngineProvider` Facade class
- [x] 5.6 Export `VolcEngineProvider` from `src/providers/index.ts`

## 6. VolcEngineHTTP Implementation

- [x] 6.1 Implement `synthesize()` method in `VolcEngineHTTP` class
- [x] 6.2 Create `VolcEngineStream` class implementing `TTSStream` interface
- [x] 6.3 Implement `getAudioChunks()` as async generator parsing HTTP Chunked JSON
- [x] 6.4 Implement `getSubtitleChunks()` extracting sentence data from chunks
- [x] 6.5 Implement `getAudioFormat()` returning PCM format declaration
- [x] 6.6 Implement `validateCredentials()` sending empty string to API
- [x] 6.7 Add error handling mapping VolcEngine error codes to core error types

## 7. Provider Factory

- [x] 7.1 Create `createProvider(name, config)` function in `src/providers/index.ts`
- [x] 7.2 Implement provider name lookup and instantiation logic
- [x] 7.3 Add error handling for unknown provider names
- [x] 7.4 Export factory function and `TTSProvider` type

## 8. Configuration Refactoring

- [x] 8.1 Update `Config` type in `src/config.ts` with `provider` and `providers` fields
- [x] 8.2 Create `isLegacyConfig()` type guard function
- [x] 8.3 Create `migrateLegacyConfig()` function
- [x] 8.4 Update `loadConfig()` to detect and migrate legacy configs
- [x] 8.5 Update `DEFAULTS` with default `provider: 'volcengine'`
- [x] 8.6 Update `saveConfig()` to handle new structure

## 9. TTS Logic Refactoring

- [x] 9.1 Update `src/tts.ts` to import `createProvider` from providers
- [x] 9.2 Refactor `runDownloadMode()` to use `provider.synthesize()`
- [x] 9.3 Refactor `runPlayMode()` to use `provider.synthesize()`
- [x] 9.4 Replace direct API calls with `for await` iteration over `stream.getAudioChunks()`
- [x] 9.5 Update `spawnFfplay()` to use `provider.format` for argument construction
- [x] 9.6 Remove VolcEngine-specific code (headers, payload parsing, etc.)

## 10. Progress and Subtitle Handling

- [x] 10.1 Adapt progress bar logic to work with provider-agnostic stream
- [x] 10.2 Update subtitle extraction to use `stream.getSubtitleChunks()`
- [x] 10.3 Handle providers that don't support subtitles (empty iterable)
- [x] 10.4 Ensure character-based progress works with different provider responses

## 11. Testing and Verification

- [x] 11.1 Test download mode with legacy config format (auto-migration)
- [ ] 11.2 Test download mode with new config format
- [x] 11.3 Test play mode with local file playback
- [x] 11.4 Test play mode with generation and streaming
- [ ] 11.5 Test `--validate` flag with provider abstraction
- [x] 11.6 Test CLI credential overrides work correctly
- [x] 11.7 Test error handling for invalid credentials
- [x] 11.8 Test subtitle generation and output

## 12. Cleanup and Documentation

- [x] 12.1 Remove unused VolcEngine constants and types from `src/tts.ts`
- [x] 12.2 Update CLAUDE.md with new provider architecture documentation
- [x] 12.3 Update README with multi-provider configuration examples
- [x] 12.4 Add inline documentation to provider interfaces
- [x] 12.5 Run typecheck and fix any TypeScript errors
