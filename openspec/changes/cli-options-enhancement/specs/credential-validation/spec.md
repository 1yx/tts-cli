## ADDED Requirements

### Requirement: Credential validation

The system SHALL provide a `--validate` option that tests API credentials by sending an empty string to the TTS API.

#### Scenario: Valid credentials

- **WHEN** user runs `tts-cli --validate`
- **THEN** system sends empty string payload to TTS API
- **AND** system reports "Credentials are valid"
- **AND** system exits with code 0

#### Scenario: Invalid credentials

- **WHEN** user runs `tts-cli --validate` with invalid app_id or token
- **THEN** system reports "Credentials are invalid: <error message>"
- **AND** system exits with error code

#### Scenario: Validate with CLI override

- **WHEN** user runs `tts-cli --validate --appId <id> --token <token>`
- **THEN** system uses the provided credentials instead of config file
- **AND** system validates the provided credentials

#### Scenario: Validate without config

- **WHEN** user runs `tts-cli --validate` and no config file exists
- **THEN** system reports error "No credentials found. Please provide --appId and --token, or run setup"
- **AND** system exits with error code

#### Scenario: Validate combined with other options

- **WHEN** user runs `tts-cli input.md --validate`
- **THEN** system only validates credentials
- **AND** input file is not processed
- **AND** no audio conversion occurs
