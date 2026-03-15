# tts-cli

A CLI tool that converts Markdown documents to MP3 audio using Volcano Engine Doubao TTS API.

Built with TypeScript and Bun.

## Features

- **Download mode**: Convert markdown/text to MP3 files
- **Play mode**: Stream audio while converting with ffplay
- **Auto-detect markdown filter** based on file extension
- **Interactive setup wizard** for first-time users
- **Progress bar** with character count and received KB
- **Config file support** with TOML format

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/tts-cli.git
cd tts-cli

# Install dependencies
bun install

# Build binary
bun build src/index.ts --compile --outfile tts-cli
```

## Quick Start

```bash
# First run - interactive setup
./tts-cli input.md

# Convert with default settings
./tts-cli input.md

# Convert and play while downloading
./tts-cli input.md --play

# Play only, don't save
./tts-cli input.md --play --no-save

# Custom output path
./tts-cli input.md --output /path/to/output.mp3
```

## Voice Options

### Chinese Voices (豆包语音合成模型2.0)

| Voice Name | voice_type | Description |
|------------|-----------|-------------|
| Vivi 2.0 | `zh_female_vv_uranus_bigtts` | Multi-language (Chinese, Japanese, Indonesian, Mexican Spanish), emotional variation, ASMR |
| 小何 2.0 | `zh_female_xiaohe_uranus_bigtts` | Chinese, emotional variation, ASMR |
| 云舟 2.0 | `zh_male_m191_uranus_bigtts` | Chinese, emotional variation, ASMR |

### English Voices (豆包语音合成模型2.0)

| Voice Name | voice_type | Description |
|------------|-----------|-------------|
| Tim | `en_male_tim_uranus_bigtts` | American English, emotional variation, ASMR |
| Dacey | `en_female_dacey_uranus_bigtts` | American English, emotional variation, ASMR |
| Stokie | `en_female_stokie_uranus_bigtts` | American English, emotional variation, ASMR |

**More voices available:** See [Volcano Engine Voice List](https://www.volcengine.com/docs/6561/1257544?lang=zh#%E8%B1%86%E5%8C%85%E8%AF%AD%E9%9F%B3%E5%90%88%E6%88%90%E6%A8%A1%E5%9E%8B2-0-%E9%9F%B3%E8%89%B2%E5%88%97%E8%A1%A8)

## Configuration

Configuration file: `~/.config/tts-cli/config.toml`

```toml
[api]
app_id = "your_app_id"
token  = "your_access_token"

[tts]
voice       = "en_male_tim_uranus_bigtts"
resource_id = "seed-tts-2.0"
speed       = 0
volume      = 0
sample_rate = 24000
bit_rate    = 128000
format      = "mp3"
lang        = "en"

[output]
dir = "~/Downloads"
```

## CLI Parameters

```bash
tts-cli <input> [options]

Options:
  --play                    Play audio while converting (requires ffplay)
  --no-save                 Don't save file (requires --play)
  --output <path>           Output file path
  --voice <name>            Voice name
  --resource-id <id>        Resource ID: seed-tts-1.0, seed-tts-2.0, etc.
  --speed <n>               Speech speed [-50, 100]
  --volume <n>              Volume [-50, 100]
  --emotion <type>          Emotion type (happy, sad, angry, etc.)
  --emotion-scale <n>       Emotion scale [1-5]
  --format <fmt>            Audio format: mp3, pcm, ogg_opus
  --sample-rate <n>         Sample rate (default: 24000)
  --bit-rate <n>            Bit rate for MP3
  --lang <code>             Language: zh-cn, en, ja, es-mx, id, pt-br
  --silence <ms>            Sentence end silence duration [0-30000]

Config commands:
  tts-cli config              View current config
  tts-cli config --edit       Open config in editor
  tts-cli config --reset      Reset configuration
```

## Examples

```bash
# Chinese text with Chinese voice
./tts-cli article.md --lang zh-cn --voice zh_female_vv_uranus_bigtts

# English text with English voice (default)
./tts-cli article.md

# Custom speed and volume
./tts-cli article.md --speed 20 --volume 10

# With emotion (supported voices only)
./tts-cli article.md --emotion happy --emotion-scale 5

# Japanese text
./tts-cli article.md --lang ja --voice multi_female_sophie_conversation_wvae_bigtts
```

## Requirements

- **Bun** - JavaScript runtime and package manager
- **ffmpeg** - Required for `--play` mode (ffplay for playback, ffmpeg for transcoding)

### Installing ffmpeg

```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt install ffmpeg

# Windows
winget install ffmpeg
```

## Development

```bash
# Install dependencies
bun install

# Run in development mode
bun run src/index.ts input.md

# Type check
bun run typecheck

# Run tests
bun test

# Build binary
bun run build
```

## API Documentation

- [Volcano Engine TTS API](https://www.volcengine.com/docs/6561/1598757?lang=zh)
- [Voice List](https://www.volcengine.com/docs/6561/1257544?lang=zh)
- [API Signature Guide](https://www.volcengine.com/docs/6369/67269)

## License

MIT
