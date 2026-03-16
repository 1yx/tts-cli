## Why

Users want to access the raw sentence data returned by the TTS API, which contains word-level timing information. This enables downstream features like:
- Detailed audio analysis and synchronization
- Custom subtitle format generation (SRT, VTT, LRC, etc.)
- Karaoke-style display applications
- Debugging and verification of TTS output

The TTS API already returns this data when `enable_subtitle: true` is set (currently enabled for progress tracking), so capturing it has no additional API cost.

## What Changes

- Add `--subtitle` CLI flag to enable subtitle file output
- Save raw sentence data (text + words array) to `.subtitle.json` file alongside MP3 output
- Support both download mode and play mode
- Use streaming JSON array write to minimize memory usage for long texts
- Follow existing `--force` behavior: overwrite only when specified, otherwise silent skip if file exists

## Capabilities

### New Capabilities
- `subtitle-output`: Saving raw TTS sentence data to JSON file

### Modified Capabilities
- None (this is a new capability, not a change to existing behavior)

## Impact

**Affected Code:**
- `src/index.ts`: Add `--subtitle` argument definition
- `src/tts.ts`:
  - `runDownloadMode()`: Accumulate sentences and write to file
  - `runPlayMode()`: Accumulate sentences and write to file
  - New helper functions for streaming JSON array write

**No New Dependencies:** Uses existing APIs and file system operations

**User-Facing Changes:**
- New flag: `--subtitle`
- New output file: `input.subtitle.json` (alongside `input.mp3`)
