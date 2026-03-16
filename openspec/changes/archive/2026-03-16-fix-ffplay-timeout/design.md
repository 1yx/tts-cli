## Context

The current `--play` mode implementation in `src/tts.ts` uses ffplay to stream PCM audio in real-time. Users are experiencing timeout errors when ffplay doesn't close within 10 seconds.

**Current implementation:**
- `setupFfplayClosePromise`: Sets up 10-second timeout for ffplay close
- `finalizeFfplayPlayback`: Waits for drain once, then closes stdin
- `writeToFfplay`: Writes chunks and tracks drain state

**Problem:**
- 10-second timeout is too short for longer audio files
- Single drain check doesn't account for pending writes
- No verification that buffer is empty before closing

## Goals / Non-Goals

**Goals:**
- Eliminate "ffplay close timeout" errors in normal operation
- Ensure all audio data is fully written to ffplay before closing
- Provide sufficient time for graceful shutdown

**Non-Goals:**
- Changing the CLI interface
- Modifying audio quality or format
- Adding new features

## Decisions

### 1. Increase timeout to 30 seconds

**Rationale:** 30 seconds provides ample time for:
- Remaining audio buffer to play
- Graceful shutdown of ffplay process
- Handling longer audio files

**Alternative considered:** Make timeout configurable
**Rejected:** Adds complexity without clear benefit; 30 seconds should cover all cases

### 2. Double-check drain before closing

**Rationale:** The current single check at `needDrainRef.value` may miss pending writes. Adding a `writableLength` check ensures the buffer is truly empty.

**Alternative considered:** Poll `writableLength` until zero
**Rejected:** Event-driven approach (drain event) is more efficient

### 3. Add timeout constant

**Rationale:** Using a named constant (`FFPLAY_CLOSE_TIMEOUT_MS`) makes the timeout value discoverable and easier to adjust.

## Risks / Trade-offs

**Risk:** 30-second timeout may be too long if ffplay truly hangs
**Mitigation:** Timeout is still enforced; users can Ctrl+C to interrupt

**Trade-off:** Longer timeout means slower failure detection, but reduces false-positive timeouts

## Migration Plan

No migration needed. This is a bug fix with no API changes.

## Open Questions

None
