## Why

Users are experiencing "ffplay close timeout - process killed" errors when using `--play` mode, especially with longer audio files. The current 10-second timeout is too short, and the drain logic doesn't ensure all audio data is fully written to ffplay stdin before closing.

## What Changes

- Increase ffplay close timeout from 10 seconds to 30 seconds
- Improve drain logic in `finalizeFfplayPlayback` to ensure all buffered data is written before closing stdin
- Add `writableLength` check to verify stream buffer is empty
- Reset `needDrainRef.value` after drain completes

## Capabilities

### New Capabilities

### Modified Capabilities

## Impact

- **Affected code**: `src/tts.ts` - `setupFfplayClosePromise` and `finalizeFfplayPlayback` functions
- **Behavior change**: ffplay will wait up to 30 seconds for graceful close (previously 10 seconds)
- **No API changes**: CLI interface remains the same
- **No breaking changes**
