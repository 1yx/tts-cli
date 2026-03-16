# Tasks: Environment Variables Runtime Support

## 1. Implementation

- [x] 1.1 Update `src/index.ts` to read environment variables after loading config
- [x] 1.2 Apply environment variable overrides for `app_id` and `token` (with empty string checks)
- [x] 1.3 Ensure environment variable layer comes before CLI parameter overrides
- [x] 1.4 Update CLI parameter override logic to work with the new layer structure

## 2. Documentation

- [x] 2.1 Update CLAUDE.md config priority section to reflect four-layer hierarchy
- [x] 2.2 Update CLAUDE.md to document `TTS_CLI_APP_ID` and `TTS_CLI_TOKEN` environment variables

## 3. Testing

- [x] 3.1 Add test for environment variable override of config file values
- [x] 3.2 Add test for CLI parameter override of environment variable values
- [x] 3.3 Add test for empty environment variable fallback to config file
- [x] 3.4 Add test for partial override (app_id from env, token from config)
- [x] 3.5 Run `bun test` - all tests should pass
- [x] 3.6 Manual test: Verify environment variables work at runtime
