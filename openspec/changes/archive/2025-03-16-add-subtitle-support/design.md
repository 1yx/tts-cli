## Context

The TTS API already returns sentence-level data with word timing information when `enable_subtitle: true` is set. This feature is currently enabled for progress tracking (to filter duplicate sentences). The data is captured during chunk processing but discarded after use.

Current sentence data structure:
```typescript
{
  text: string;      // Sentence text
  words: unknown[];  // Word-level timing data
}
```

Users want to persist this data for downstream applications (subtitle format conversion, audio analysis, karaoke display, etc.). Since the data is already being received, capturing it has no additional API cost.

## Goals / Non-Goals

**Goals:**
- Enable raw sentence data export to JSON file
- Support both download and play modes
- Minimize memory usage via streaming writes
- Maintain consistency with existing `--force` behavior

**Non-Goals:**
- Converting to standard subtitle formats (SRT, VTT, etc.) - this is left to downstream tools
- Validating or transforming the `words` array content - export raw data as-is
- Subtitle file validation or error recovery

## Decisions

### 1. Streaming JSON Array Write

**Choice:** Write JSON array incrementally rather than accumulate in memory.

**Rationale:**
- Long texts can generate hundreds of sentences
- Accumulating all sentences in memory defeats streaming architecture
- Standard JSON array format is tool-friendly and easy to parse

**Implementation:**
```typescript
// Open file writer, write opening bracket
file.write('[\n');

// For each sentence (except first):
if (!first) file.write(',\n');
file.write(JSON.stringify(sentence));

// Close array
file.write('\n]');
```

**Alternatives Considered:**
- **NDJSON (one JSON per line)**: Simpler but not standard JSON array
- **Memory accumulation**: Simpler code but defeats streaming for long texts

### 2. File Naming Convention

**Choice:** `input.subtitle.json` (same directory and base name as MP3)

**Rationale:**
- Consistent with existing MP3 output naming
- Clear association between audio and subtitle files
- `.subtitle.json` extension avoids confusion with other JSON files

**Alternatives Considered:**
- **input.srt**: Implies SRT format, but we're exporting raw JSON
- **input.json**: Too generic, could conflict with other uses
- **subtitles/input.json**: Creates extra directory layer

### 3. File Existence Behavior

**Choice:** Silent skip when file exists (unless `--force` is specified)

**Rationale:**
- Follows existing MP3 file behavior
- Subtitle file existence implies MP3 existence (generated together)
- Silent skip avoids unnecessary error messages for sidecar file

**Logic:**
```typescript
if (subtitleFileExists && !force) {
  // Skip silently - MP3 logic already handles user flow
}
```

### 4. Scope: Both Download and Play Modes

**Choice:** Support subtitle generation in both modes

**Rationale:**
- Users may want subtitles without playing audio (download mode)
- Play mode users also benefit from subtitle export
- Code reuse via shared helper functions

**Implementation:**
- Shared streaming write functions
- Sentence accumulation in `handleChunk()` path
- Mode-specific integration points

## Risks / Trade-offs

### Risk: JSON Write Interruption

**Risk:** If process is interrupted (Ctrl+C, crash), subtitle file may be incomplete or malformed.

**Mitigation:**
- Write to temporary file, rename on completion (atomic operation)
- Or accept trade-off: incomplete JSON is detectable by parser

### Risk: Disk Space

**Risk:** Subtitle files add disk usage alongside MP3 files.

**Mitigation:**
- Subtitle files are text-based, typically much smaller than MP3
- Users control via `--subtitle` flag (opt-in)

### Trade-off: Raw Data Format

**Decision:** Export raw API data without transformation.

**Trade-off:**
- Pro: No data loss, maximum flexibility for downstream use
- Con: Users must parse/transform for their specific needs

**Rationale:** Transformation logic belongs in specialized tools, not in this CLI.

## Open Questions

None. All technical decisions are clear and implementation is straightforward.
