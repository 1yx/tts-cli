## ADDED Requirements

### Requirement: Dynamic provider instantiation
The system SHALL provide a provider factory function that instantiates the appropriate provider based on configuration, enabling runtime provider switching without code changes.

#### Scenario: Factory creates configured provider
- **WHEN** caller invokes `createProvider(config)`
- **THEN** factory MUST read `config.provider` to determine which provider to instantiate
- **AND** MUST pass `providers[config.provider]` subsection to provider constructor
- **AND** MUST return a provider instance implementing `TTSProvider` interface

#### Scenario: Unknown provider requested
- **WHEN** config specifies a provider that is not implemented
- **THEN** factory MUST throw descriptive error listing available providers
- **AND** MUST NOT return null or undefined

### Requirement: Provider registration
Providers MUST register themselves with the factory to be discoverable and instantiable.

#### Scenario: Built-in provider registration
- **WHEN** system initializes
- **THEN** all built-in providers (volcengine) MUST be automatically registered
- **AND** factory MUST be able to instantiate them by name

#### Scenario: Future extensibility
- **WHEN** a new provider is added to `src/providers/`
- **THEN** it MAY register itself with the factory
- **AND** factory MUST be able to instantiate it without core factory changes

### Requirement: Provider cache invalidation
The factory MUST support provider re-instantiation when configuration changes, preventing stale provider instances.

#### Scenario: Configuration reload
- **WHEN** user changes active provider via CLI argument or config file reload
- **THEN** factory MUST create new provider instance with updated configuration
- **AND** MUST NOT cache provider instances across configuration changes

#### Scenario: Runtime provider override
- **WHEN** user specifies `--provider openai` CLI argument
- **THEN** factory MUST instantiate OpenAI provider
- **AND** MUST ignore config file's default provider setting for this invocation
