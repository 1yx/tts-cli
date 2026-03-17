## Why

Users need better visibility into the CLI tool's state and validation capabilities before committing to a full conversion. Currently missing common CLI conventions like `--version`, and there's no way to validate API credentials without performing a full conversion.

## What Changes

| Option | Type | Behavior |
|--------|------|----------|
| `--version` | Offline | Print version number and exit immediately |
| `--dry-run` | Offline | Validate all parameters, input file, config, and output path without making API calls |
| `--quiet` | Online | Download mode with minimal output (single-line "Saved to xxx.mp3"). Still makes full API call and conversion. |
| `--validate` | Online | Test API credentials by sending an empty string to the TTS API |
| `--help` | - | Already provided by citty (no changes needed) |

**Compatibility notes:**
- `--quiet` conflicts with `--play` (playback mode requires progress feedback)
- `--verbose` explicitly excluded from this change (deferred)

## Capabilities

### New Capabilities

- **`cli-options`**: Additional CLI options for better user experience (`--version`, `--dry-run`, `--quiet`)
- **`credential-validation`**: Online API credential testing via `--validate` flag

### Modified Capabilities

None - existing specs remain unchanged. These are additive features only.

## Impact

- **Code changes**: `src/cli.ts` (add new CLI options), `src/index.ts` (handle --version early exit)
- **New validation logic**: `--dry-run` requires parameter validation, file existence checks, path writability checks
- **API usage**: `--quiet` makes full TTS API call (download mode), `--validate` makes one minimal API call
- **Output behavior**: `--quiet` suppresses `@clack/prompts` output except final success message
- **Usage constraints**: `--quiet` conflicts with `--play` (playback requires progress feedback)
