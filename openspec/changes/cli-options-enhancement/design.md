## Context

tts-cli currently lacks common CLI conventions like `--version` and has no way to validate API credentials without performing a full conversion. Users need visibility into the tool's state and validation capabilities before committing resources.

The tool uses citty as the CLI framework, which auto-generates `--help`. Output is handled via `@clack/prompts` for user-facing messages.

## Goals / Non-Goals

**Goals:**
- Add `--version` option that prints version and exits
- Add `--dry-run` option for offline validation without API calls
- Add `--quiet` option for minimal output
- Add `--validate` option for credential testing

**Non-Goals:**
- `--verbose` option is explicitly out of scope (deferred)
- No changes to existing TTS conversion behavior
- No changes to existing specs

## Decisions

### `--version`: Early exit pattern

**Decision**: Handle `--version` in `src/index.ts` before main command routing by checking `process.argv` directly.

**Rationale**: citty doesn't provide built-in version handling. Checking argv before `mainCommand.run()` ensures version is displayed regardless of other arguments. This is a common pattern in CLI tools.

**Code location**: `src/index.ts`, after config check, before `mainCommand.run()`

```typescript
if (process.argv.includes('--version')) {
  console.log('0.1.0');
  process.exit(0);
}
```

### `--dry-run`: Validation phase separation

**Decision**: Create a new `validateDryRun()` function that runs all validations without side effects.

**Rationale**: Dry-run checks are:
1. Parameter legality (range checks, type validation)
2. Input file existence/readability
3. Config file or credential availability
4. Output path writability
5. Parameter conflicts (e.g., --quiet with --play)

These checks already exist scattered across the codebase. Centralizing them into a dedicated function allows reuse for both dry-run and normal execution.

**Code location**: New function in `src/commands/convert.ts` or `src/utils.ts`

### `--quiet`: Output suppression via flag

**Decision**: Pass a `quiet` boolean through the call chain. When true, suppress `@clack/prompts` calls and progress bars.

**Rationale**: `@clack/prompts` doesn't have built-in quiet mode. A simple boolean flag passed to output functions is the most straightforward approach. Progress bar creation is skipped when quiet is true.

**Code locations**:
- `src/cli.ts`: Add `quiet` argument definition
- `src/tts.ts`: Conditionally skip `createProgressBar()` and log calls
- `src/commands/convert.ts`: Pass quiet flag to TTS functions

### `--validate`: Minimal API call

**Decision**: Send empty string `""` to TTS API with expected error response indicating authentication failure, or success if credentials are valid.

**Rationale**: The TTS API processes any text input. An empty string is the minimal payload that still exercises the authentication layer. A valid response (even if no audio is returned) confirms credentials work.

**Code location**: New function in `src/tts.ts` or `src/commands/convert.ts`

**Flow**:
```
--validate detected → skip input file requirement → send "" to API → check response → report result
```

### Version source: package.json

**Decision**: Read version from `package.json` at runtime, not hardcoded.

**Rationale**: Version should be single source of truth. Reading from `package.json` ensures CLI output matches npm package version.

**Implementation**:
```typescript
const pkg = JSON.parse(await Bun.file('package.json').text());
console.log(pkg.version);
```

## Risks / Trade-offs

### `--quiet` loses all feedback
**Risk**: Users won't see progress or errors in quiet mode if something goes wrong.
**Mitigation**: Always output errors, even in quiet mode. Only suppress informational messages.

### `--validate` may have false negatives
**Risk**: API rate limiting or network issues could be interpreted as invalid credentials.
**Mitigation**: Include error context in output ("Credentials are invalid: <error>") so users can distinguish auth failures from network issues.

### Version parsing could fail
**Risk**: `package.json` might not exist or be malformed in some installation scenarios.
**Mitigation**: Use try-catch, fallback to hardcoded version if reading fails.

## Migration Plan

No migration needed. These are additive changes with no breaking changes to existing behavior.

## Open Questions

1. Should `--validate` accept an input file argument for testing?
   - **Decision**: No. `--validate` is specifically for credential testing. If input is provided, it's ignored (same as `--version` behavior).

2. Should `--dry-run` check ffmpeg availability?
   - **Decision**: No. ffmpeg is only needed for `--play` mode. Dry-run with `--play` flag should still validate, but shouldn't check ffmpeg unless explicitly testing playback capability.
