## ADDED Requirements

### Requirement: Provider interface contract

The system SHALL define a `TTSProvider` interface that all TTS providers MUST implement. This interface specifies the contract for provider capabilities, credential validation, and speech synthesis.

#### Scenario: Provider implements required interface

- **WHEN** a new provider is added
- **THEN** it MUST implement the `TTSProvider` interface
- **AND** MUST declare its name, audio format, and capabilities
- **AND** MUST provide `validateCredentials()` method
- **AND** MUST provide `synthesize()` method returning a `TTSStream`

### Requirement: Stream abstraction for audio data

The system SHALL define a `TTSStream` interface that normalizes different protocol responses (HTTP Chunked JSON, WebSocket, raw binary) into a unified async iterable interface.

#### Scenario: HTTP Chunked JSON provider

- **WHEN** a provider uses HTTP Chunked JSON with base64-encoded audio
- **THEN** `getAudioChunks()` SHALL return `AsyncIterable<Uint8Array>` with decoded PCM data
- **AND** the calling code MUST NOT need to know about JSON parsing or base64 decoding

#### Scenario: Raw binary provider

- **WHEN** a provider returns raw binary audio data
- **THEN** `getAudioChunks()` SHALL return `AsyncIterable<Uint8Array>` directly from the stream
- **AND** the calling code uses the same iteration pattern

#### Scenario: WebSocket provider

- **WHEN** a provider uses WebSocket protocol
- **THEN** `getAudioChunks()` SHALL return `AsyncIterable<Uint8Array>` from WebSocket messages
- **AND** the calling code uses the same iteration pattern

### Requirement: Audio format declaration

The system SHALL require each provider to declare its output audio format via the `AudioFormat` type, enabling proper ffplay parameter construction.

#### Scenario: PCM format declaration

- **WHEN** a provider outputs raw PCM audio
- **THEN** it MUST declare format as `{ type: 'pcm', sampleRate, channels, bitDepth }`
- **AND** the calling code uses these values to construct ffplay `-f`, `-ar`, `-ac` parameters

#### Scenario: Compressed format declaration

- **WHEN** a provider outputs compressed audio (MP3, OPUS)
- **THEN** it MUST declare format as `{ type: 'mp3' }` or `{ type: 'opus' }`
- **AND** the calling code passes format type to ffplay for auto-detection

### Requirement: Subtitle support with graceful degradation

The system SHALL support subtitle extraction via `getSubtitleChunks()` method. Providers that don't support subtitles MUST return an empty async iterable.

#### Scenario: Provider supports subtitles

- **WHEN** a provider supports word-level timestamps
- **THEN** `getSubtitleChunks()` SHALL return `AsyncIterable<SubtitleChunk>` with text and optional words array

#### Scenario: Provider does not support subtitles

- **WHEN** a provider does not support subtitle extraction
- **THEN** `getSubtitleChunks()` SHALL return an empty async iterable
- **AND** the calling code MUST handle this gracefully without errors

### Requirement: Provider-specific protocol encapsulation

Providers using multiple protocols (HTTP, WebSocket) SHALL use the Facade pattern with a main entry point that routes to appropriate protocol implementations.

#### Scenario: Single protocol provider

- **WHEN** a provider supports only one protocol
- **THEN** the provider MAY implement `TTSProvider` interface directly in a single file

#### Scenario: Multi-protocol provider

- **WHEN** a provider supports multiple protocols (HTTP and WebSocket)
- **THEN** it SHALL use a directory structure with `index.ts` as Facade
- **AND** SHALL separate protocol implementations into `http.ts` and `websocket.ts`
- **AND** SHALL extract shared logic (auth, types) into separate files
