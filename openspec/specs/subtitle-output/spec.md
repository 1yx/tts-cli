# Subtitle Output

Export raw TTS sentence data to JSON file for downstream processing.

## ADDED Requirements

### Requirement: CLI provides --subtitle flag

The system SHALL provide a `--subtitle` CLI flag that enables subtitle file output.

#### Scenario: Flag is present

- **WHEN** user invokes `tts-cli input.md --subtitle`
- **THEN** system generates both MP3 and subtitle files
- **AND** subtitle file is saved alongside MP3 output

#### Scenario: Flag is absent

- **WHEN** user invokes `tts-cli input.md` (without --subtitle)
- **THEN** system generates only MP3 file
- **AND** no subtitle file is created

### Requirement: Subtitle file naming convention

The system SHALL save subtitle files using the naming convention `<input>.subtitle.json` in the same directory as the MP3 output.

#### Scenario: Standard input file

- **WHEN** input is `document.md`
- **THEN** subtitle file is `document.subtitle.json`
- **AND** file is in same directory as `document.mp3`

#### Scenario: Custom output path (file)

- **WHEN** user specifies `--output /path/to/output.mp3`
- **THEN** subtitle file is `/path/to/output.subtitle.json`

#### Scenario: Custom output path (directory)

- **WHEN** user specifies `--output /path/to/output/`
- **THEN** subtitle file is `/path/to/output/<input>.subtitle.json`

### Requirement: Subtitle file content format

The system SHALL write subtitle data as a standard JSON array containing raw sentence objects from the TTS API.

#### Scenario: JSON array structure

- **WHEN** subtitle file is generated
- **THEN** output is a valid JSON array
- **AND** each element contains raw sentence data (`text` and `words` fields)
- **AND** all raw data is preserved (no filtering or transformation)

#### Scenario: Sentence data structure

- **WHEN** TTS API returns sentence with text and words
- **THEN** subtitle file includes exact sentence object
- **AND** `text` field contains sentence text string
- **AND** `words` field contains array of word-level timing data

### Requirement: Streaming write for memory efficiency

The system SHALL write subtitle data using streaming JSON array format to minimize memory usage for long texts.

#### Scenario: Progressive write

- **WHEN** TTS API streams sentence chunks
- **THEN** system writes each sentence to file immediately
- **AND** sentences are not accumulated in memory
- **AND** output remains valid JSON array format

### Requirement: Force flag behavior

The system SHALL follow existing `--force` flag behavior for subtitle file overwriting.

#### Scenario: File exists without --force

- **WHEN** subtitle file already exists
- **AND** `--force` flag is NOT present
- **THEN** system silently skips subtitle generation
- **AND** continues with MP3 generation/playback as normal

#### Scenario: File exists with --force

- **WHEN** subtitle file already exists
- **AND** `--force` flag IS present
- **THEN** system overwrites existing subtitle file
- **AND** regenerates with new sentence data

### Requirement: Support for both runtime modes

The system SHALL support subtitle generation in both download mode and play mode.

#### Scenario: Download mode with subtitle

- **WHEN** user invokes `tts-cli input.md --subtitle`
- **THEN** system generates MP3 file
- **AND** system generates subtitle file
- **AND** does not play audio

#### Scenario: Play mode with subtitle

- **WHEN** user invokes `tts-cli input.md --play --subtitle`
- **THEN** system plays audio via ffplay
- **AND** system generates MP3 file
- **AND** system generates subtitle file

### Requirement: Silent skip when MP3 exists

The system SHALL skip subtitle generation when local MP3 is played (following existing file existence logic).

#### Scenario: Local MP3 playback

- **WHEN** MP3 file exists
- **AND** user invokes `tts-cli input.md --play`
- **AND** `--force` flag is NOT present
- **THEN** system plays local MP3
- **AND** does not regenerate MP3 or subtitle files

#### Scenario: Missing subtitle with existing MP3

- **WHEN** MP3 file exists
- **AND** subtitle file is missing
- **AND** user invokes `tts-cli input.md --play`
- **THEN** system plays local MP3
- **AND** does not generate missing subtitle file (follows MP3 logic)
