## ADDED Requirements

### Requirement: Version display
The system SHALL provide a `--version` option that displays the current version number and exits immediately.

#### Scenario: Display version
- **WHEN** user runs `tts-cli --version`
- **THEN** system prints version number (e.g., "0.1.0")
- **AND** system exits with code 0
- **AND** no other processing occurs

#### Scenario: Version takes precedence
- **WHEN** user runs `tts-cli --version input.md`
- **THEN** system only displays version
- **AND** input file is not processed

### Requirement: Dry run mode
The system SHALL provide a `--dry-run` option that validates all parameters and conditions without making any API calls or writing files.

#### Scenario: Successful dry run
- **WHEN** user runs `tts-cli input.md --dry-run`
- **THEN** system validates all CLI parameters are legal
- **AND** system verifies input file exists and is readable
- **AND** system verifies config file exists or CLI credentials are provided
- **AND** system verifies output path is writable
- **AND** system checks for parameter conflicts (e.g., --quiet with --play)
- **AND** system reports "Dry run: All checks passed"
- **AND** no API call is made
- **AND** no files are written

#### Scenario: Dry run with missing input file
- **WHEN** user runs `tts-cli missing.md --dry-run`
- **THEN** system reports error "Input file not found: missing.md"
- **AND** system exits with error code

#### Scenario: Dry run with invalid parameter
- **WHEN** user runs `tts-cli input.md --speed 999 --dry-run`
- **THEN** system reports error about invalid speed value
- **AND** system exits with error code

#### Scenario: Dry run with quiet conflict
- **WHEN** user runs `tts-cli input.md --play --quiet --dry-run`
- **THEN** system reports error "--quiet cannot be used with --play"
- **AND** system exits with error code

### Requirement: Quiet mode
The system SHALL provide a `--quiet` option that suppresses all output except a single-line success message.

#### Scenario: Quiet mode success
- **WHEN** user runs `tts-cli input.md --quiet`
- **THEN** system suppresses all progress output
- **AND** system suppresses @clack/prompts messages
- **AND** system outputs only "Saved to /path/to/output.mp3"
- **AND** system exits with code 0

#### Scenario: Quiet mode error
- **WHEN** user runs `tts-cli input.md --quiet` and an error occurs
- **THEN** system outputs error message
- **AND** system exits with error code

#### Scenario: Quiet mode conflicts with play
- **WHEN** user runs `tts-cli input.md --play --quiet`
- **THEN** system reports error "--quiet cannot be used with --play"
- **AND** system exits with error code
