## 1. Add Timeout Constant

- [x] 1.1 Add `FFPLAY_CLOSE_TIMEOUT_MS` constant at top of `src/tts.ts` (value: 30000)
- [x] 1.2 Verify constant is defined before `setupFfplayClosePromise` function

## 2. Update setupFfplayClosePromise Function

- [x] 2.1 Replace hardcoded `10000` with `FFPLAY_CLOSE_TIMEOUT_MS` in setTimeout call
- [x] 2.2 Verify timeout error message remains the same

## 3. Improve finalizeFfplayPlayback Function

- [x] 3.1 Add `needDrainRef.value = false` after drain wait completes
- [x] 3.2 Add `writableLength` check to ensure buffer is empty before closing stdin
- [x] 3.3 Verify order: drain wait → reset flag → writableLength check → stdin.end

## 4. Verification

- [x] 4.1 Run `bun run typecheck` - should pass with no errors
- [x] 4.2 Run `bun test` - all tests should pass (65 pass, 3 skip)
- [x] 4.3 Test `--play` mode with short audio file (requires TTS credentials)
- [x] 4.4 Test `--play` mode with longer audio file to verify timeout no longer occurs (requires TTS credentials)
- [x] 4.5 Verify error message (if timeout still occurs): "ffplay close timeout - process killed" (requires TTS credentials)
