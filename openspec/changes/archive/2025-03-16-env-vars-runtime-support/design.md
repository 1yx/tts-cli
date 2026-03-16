## Context

Currently, tts-cli supports three configuration layers: defaults, config file, and CLI parameters. Environment variables (`TTS_CLI_APP_ID`, `TTS_CLI_TOKEN`) are only checked during first-run setup, not during normal operation. This creates inconsistency and limits flexibility for CI/CD workflows where environment variables are the standard way to inject credentials.

## Goals / Non-Goals

**Goals:**
- Add environment variable support at runtime for `TTS_CLI_APP_ID` and `TTS_CLI_TOKEN`
- Establish four-layer configuration priority: Defaults < Config file < Environment variables < CLI parameters
- Allow partial overrides (e.g., `app_id` from CLI, `token` from environment variables)
- Maintain backward compatibility with existing configuration methods

**Non-Goals:**
- Changing the configuration file format or location
- Adding environment variable support for all configuration options (only `app_id` and `token`)
- Modifying the first-run setup behavior (already supports environment variables)

## Decisions

### Where to apply environment variable overrides

Environment variable overrides should be applied in the main command (src/index.ts) after loading the config but before applying CLI parameter overrides. This keeps the logic consistent with the current structure and maintains separation of concerns.

**Rationale:** The `loadConfig()` function handles file I/O and defaults. Environment variables are runtime context, not stored configuration. Applying them in the command layer keeps concerns separated.

**Alternative considered:** Extend `loadConfig()` to accept an optional `envOverrides` parameter.
**Rejected:** Adds unnecessary complexity. The current structure where CLI overrides happen in the command layer works well.

### Environment variable names

Use the existing names `TTS_CLI_APP_ID` and `TTS_CLI_TOKEN` to maintain consistency with first-run setup.

**Rationale:** Reusing existing environment variable names avoids confusion and leverages what users may already have configured.

### Partial override behavior

Allow users to override only `app_id` or only `token` from any layer. This means:
- If config file has both `app_id` and `token`
- And environment variables only set `TTS_CLI_APP_ID`
- Then `app_id` comes from environment variables, `token` from config file

**Rationale:** This provides maximum flexibility. Users might want to use a shared token (from config) but different app_id (for testing).

### Empty string handling

Treat empty environment variables as unset (fallback to next layer).

**Rationale:** An empty string is never a valid credential value. Treating it as unset prevents errors and allows graceful fallback.

## Risks / Trade-offs

**Risk:** Users might expect all configuration options to be available as environment variables.

**Mitigation:** Document that only `app_id` and `token` are supported via environment variables. This can be extended later if there's demand.

**Trade-off:** Adding another configuration layer increases complexity.

**Mitigation:** The four-layer model is standard practice and well-understood by developers. Clear documentation helps.

## Migration Plan

No migration needed. This is a pure addition:
- Existing configurations continue to work unchanged
- Users can opt-in to using environment variables
- No breaking changes
