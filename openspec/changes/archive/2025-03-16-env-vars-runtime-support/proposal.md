## Why

Currently, environment variables (`TTS_CLI_APP_ID`, `TTS_CLI_TOKEN`) are only checked during first-run setup, not at runtime. This creates inconsistency: users can use environment variables for initial configuration but must rely on config files or CLI parameters for daily use. Additionally, this doesn't match the standard configuration priority used by most CLI tools (CLI flags > Environment variables > Config file > Defaults), making the tool less flexible for CI/CD workflows and session-based configuration.

## What Changes

- Add environment variable support at runtime for `TTS_CLI_APP_ID` and `TTS_CLI_TOKEN`
- Establish and document the configuration priority: CLI args > Environment variables > Config file > Defaults
- Allow partial overrides (e.g., override only `app_id` via CLI while `token` comes from environment variables or config file)
- Ensure consistency between first-run setup and runtime config loading

## Capabilities

### New Capabilities
None

### Modified Capabilities

- `config`: Extend configuration loading to include environment variables at runtime, updating the documented priority layer

## Impact

- **src/index.ts**: Update runtime config loading to check environment variables after loading from config file but before applying CLI parameter overrides
- **src/config.ts**: Potentially update `loadConfig()` to support an optional environment variables override layer
- **CLAUDE.md**: Update configuration priority documentation to reflect the four-layer hierarchy
