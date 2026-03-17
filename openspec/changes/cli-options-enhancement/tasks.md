## 1. CLI Argument Definitions

- [ ] 1.1 Add `--version` boolean argument to src/cli.ts
- [ ] 1.2 Add `--dry-run` boolean argument to src/cli.ts
- [ ] 1.3 Add `--quiet` boolean argument to src/cli.ts
- [ ] 1.4 Add `--validate` boolean argument to src/cli.ts
- [ ] 1.5 Add conflict check for `--quiet` with `--play` in src/cli.ts

## 2. Version Display

- [ ] 2.1 Add early exit for `--version` in src/index.ts
- [ ] 2.2 Read version from package.json at runtime
- [ ] 2.3 Handle missing/malformed package.json with fallback

## 3. Dry Run Validation

- [ ] 3.1 Create `validateDryRun()` function in src/utils.ts
- [ ] 3.2 Implement parameter legality validation (speed, volume ranges)
- [ ] 3.3 Implement input file existence check
- [ ] 3.4 Implement config file availability check
- [ ] 3.5 Implement output path writability check
- [ ] 3.6 Implement parameter conflict detection
- [ ] 3.7 Add "Dry run: All checks passed" success message

## 4. Quiet Mode

- [ ] 4.1 Pass `quiet` flag through convert command call chain
- [ ] 4.2 Conditionally skip progress bar creation in src/tts.ts
- [ ] 4.3 Conditionally suppress @clack/prompts log messages
- [ ] 4.4 Keep error output even in quiet mode
- [ ] 4.5 Output single "Saved to xxx.mp3" message on success

## 5. Credential Validation

- [ ] 5.1 Create `validateCredentials()` function in src/tts.ts
- [ ] 5.2 Send empty string payload to TTS API
- [ ] 5.3 Handle authentication success response
- [ ] 5.4 Handle authentication failure with detailed error
- [ ] 5.5 Handle network/timeout errors gracefully
- [ ] 5.6 Add --validate CLI credential override support

## 6. Testing

- [ ] 6.1 Test `--version` displays correct version
- [ ] 6.2 Test `--dry-run` with valid parameters
- [ ] 6.3 Test `--dry-run` with invalid parameters
- [ ] 6.4 Test `--dry-run` with missing input file
- [ ] 6.5 Test `--quiet` mode output suppression
- [ ] 6.6 Test `--quiet` conflict with `--play`
- [ ] 6.7 Test `--validate` with valid credentials
- [ ] 6.8 Test `--validate` with invalid credentials
- [ ] 6.9 Test `--validate` with CLI credential override
