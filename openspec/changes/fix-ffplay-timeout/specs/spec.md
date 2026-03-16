# fix-ffplay-timeout Specifications

This change is an implementation fix only. No new or modified capabilities are introduced.

## Summary

This change fixes the ffplay timeout issue in `--play` mode by:
1. Increasing the close timeout from 10 seconds to 30 seconds
2. Improving the drain logic to ensure all data is written before closing

## Behavior Changes

None. This is purely an implementation improvement that fixes timeout errors without changing the user-facing behavior defined in the existing `openspec/specs/tts-play/spec.md`.
