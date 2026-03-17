## ADDED Requirements

### Requirement: Multi-provider configuration structure

The system SHALL support a namespaced configuration structure where each provider's settings are grouped under a `providers` object with a top-level `provider` field indicating the active provider.

#### Scenario: New config format

- **WHEN** user creates a new configuration file
- **THEN** config MUST include `provider` field (e.g., 'volcengine', 'openai')
- **AND** MUST include `providers` object with provider-specific settings
- **AND** each provider's settings are namespaced under `providers.<provider-name>`

#### Scenario: VolcEngine configuration

- **WHEN** provider is set to 'volcengine'
- **THEN** `providers.volcengine` MUST contain `app_id` and `token` fields
- **AND** MAY contain optional fields like `resource_id`, `voice`, `speed`, `volume`

### Requirement: Backward compatibility via auto-migration

The system SHALL detect legacy configuration format (flat `api.app_id` structure) and automatically migrate it to the new multi-provider format in memory.

#### Scenario: Legacy config detected

- **WHEN** system loads a config file with flat `api.app_id` structure
- **THEN** system MUST detect this as legacy format
- **AND** MUST auto-migrate to `providers.volcengine` structure
- **AND** MUST set default `provider: 'volcengine'`
- **AND** MUST function correctly without user intervention

#### Scenario: Config file preservation

- **WHEN** legacy config is auto-migrated in memory
- **THEN** system MAY optionally save migrated config to disk
- **AND** MUST NOT break existing functionality if save is skipped

### Requirement: Default provider fallback

The system SHALL default to 'volcengine' provider when no provider is specified, maintaining backward compatibility with existing installations.

#### Scenario: Provider field missing

- **WHEN** config file does not specify `provider` field
- **THEN** system MUST default to 'volcengine'
- **AND** MUST attempt to load `providers.volcengine` configuration

#### Scenario: New installation

- **WHEN** user runs tts-cli for the first time
- **THEN** setup wizard MUST configure `provider: 'volcengine'` by default

### Requirement: Provider-specific credentials isolation

The system SHALL isolate provider credentials to prevent cross-provider credential leakage. Each provider MUST only access its own credential namespace.

#### Scenario: Credential isolation

- **WHEN** active provider is 'volcengine'
- **THEN** system MUST only use `providers.volcengine.app_id` and `token`
- **AND** MUST NOT attempt to read `providers.openai.api_key`

#### Scenario: Missing active provider config

- **WHEN** active provider is specified but its config section is missing
- **THEN** system MUST report error indicating missing configuration for that provider
- **AND** MUST NOT fall back to other provider credentials
