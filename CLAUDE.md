# tts-cli — Markdown to MP3 CLI Tool

## 项目概述

一款将 Markdown（或纯文本）文档转换为 MP3 音频的命令行工具，基于火山引擎豆包语音合成大模型，使用 TypeScript + Bun 开发，编译为单一可执行二进制文件分发。

---

## 技术栈

| 层级 | 选型 |
|---|---|
| 语言 | TypeScript |
| 运行时 / 包管理 / 编译 | Bun |
| CLI 框架 | citty |
| 配置文件格式 | TOML（smol-toml） |
| 交互式引导 | @clack/prompts |
| 进度条 | cli-progress |
| TTS API | 火山引擎豆包语音合成大模型 |
| 音频播放 | ffplay（ffmpeg 附带，跨平台） |
| PCM → MP3 转码 | ffmpeg（唯一外部依赖） |

---

## 目录结构

```
src/
├── index.ts
├── cli.ts
├── config.ts
├── setup.ts
├── env.ts
├── tts.ts
├── markdown.ts
├── utils.ts
└── commands/
    ├── config.ts
    └── convert.ts
```

### `index.ts` — 程序入口

**职责：** 启动检测与流程引导，不包含任何业务逻辑。

**执行顺序：**
1. 检测配置文件是否存在
2. 不存在 → 调用 `runSetup()` 完成首次引导
3. 存在 → 直接进入 CLI 路由

---

### `cli.ts` — CLI 参数定义与路由

**职责：** 使用 `citty` 声明所有命令和参数，校验参数合法性，路由到对应的业务函数。不包含任何业务逻辑，不直接操作文件或网络。

**包含：**
- 主命令定义（`<input>`、`--play`、`--no-save`、`--output` 及所有 TTS 参数）
- `config` 子命令定义（`--edit`、`--reset`）
- 参数校验：`--no-save` 单独使用时报错退出

**日志：** 仅在参数校验失败时使用 `@clack/prompts` 的 `log.error`

---

### `config.ts` — 配置读写与合并

**职责：** 管理 `~/.config/tts-cli/config.toml` 的完整生命周期，提供三层合并后的配置对象供其他模块使用。

**包含：**
- `Config` interface — 配置文件的完整类型定义
- `DEFAULTS` — 所有字段的默认值
- `CONFIG_PATH` — 配置文件路径常量（跨平台）
- `getConfigDir()` — 平台适配路径（macOS/Linux: `~/.config/tts-cli`，Windows: `%APPDATA%\tts-cli`）
- `readConfigFile()` — 读取并解析 TOML，文件不存在时返回 `null`
- `saveConfig(config)` — 序列化为 TOML 写入，目录不存在时自动创建
- `loadConfig(cliOverrides?)` — 三层合并：`DEFAULTS` < 配置文件 < CLI 参数
- `deepMerge()` — 工具函数，`undefined` 值不覆盖已有值

---

### `setup.ts` — 首次运行交互式引导

**职责：** 在配置文件不存在时，引导用户完成环境检测和初始配置，写入配置文件后返回。

**执行流程：**
1. `intro` 欢迎信息
2. 调用 `env.ts` 检测 ffmpeg，展示检测结果
3. ffmpeg 未安装时展示安装指引，等待用户确认
4. 引导用户依次输入 `app_id`、`token`、默认音色、默认语速
5. 调用 `saveConfig()` 写入配置文件
6. `outro` 完成提示

**日志：** 全部使用 `@clack/prompts`（`intro`、`log`、`note`、`text`、`outro`）

---

### `env.ts` — 环境依赖检测

**职责：** 检测系统中是否安装了 ffmpeg / ffplay，提供跨平台安装指引和运行时断言。

**包含：**
- `hasFfmpeg()` — 使用 `Bun.which('ffmpeg')` 检测，返回 `boolean`
- `hasFfplay()` — 使用 `Bun.which('ffplay')` 检测，返回 `boolean`
- `getInstallGuide()` — 根据 `process.platform` 返回当前平台的安装命令
- `formatFfmpegError()` — 生成完整的报错提示字符串（含安装命令和降级建议）
- `assertFfmpeg()` — 检测不通过时打印错误并 `process.exit(1)`

**调用时机：**
- `setup.ts`：首次引导时主动展示检测结果
- `tts.ts`：`runPlayMode()` 入口处断言

---

### `tts.ts` — TTS API 调用与运行模式

**职责：** 封装豆包 TTS API 的所有交互，实现下载模式和播放模式的完整业务流程。

**包含：**

*API 层：*
- `buildHeaders(config)` — 构造鉴权 Header
- `buildPayload(text, config, options)` — 构造完整请求 Body
- `fetchTTS(text, config, options)` — 发起 HTTP Chunked 请求，返回 `Response`
- `parseChunks(value)` — 含缓冲拼接的流式 JSON 解析，处理跨 chunk 边界

*进度层：*
- `createProgressBar(totalChars)` — 初始化 `cli-progress` SingleBar
- `updateProgress(bar, json, ctx)` — 根据 chunk 类型更新进度条

*模式层：*
- `runDownloadMode(inputPath, config, args)` — 流式接收 → 累积 → 写入 MP3
- `runPlayMode(inputPath, config, args)` — 流式接收 → ffplay stdin + 累积 → 等待播放结束 → 转码保存

---

### `markdown.ts` — 输入文件处理

**职责：** 读取输入文件，根据文件扩展名自动判断是否为 Markdown，提供给 TTS 模块使用。

**包含：**
- `detectMarkdown(filePath)` — 根据扩展名（`.md` / `.markdown`，大小写不敏感）返回 `boolean`
- `readInputFile(filePath)` — 读取文件内容，返回 `{ text, disableMarkdownFilter }`
- `resolveOutputPath(inputPath, outputOption?)` — 推导输出路径：有 `--output` 用指定值，否则同目录同名 `.mp3`

**扩展名映射：**

| 扩展名 | disableMarkdownFilter |
|---|---|
| `.md` / `.markdown` | `true` |
| 其他 | `false` |

---

### `utils.ts` — 音频工具函数

**职责：** 封装 ffplay 和 ffmpeg 的进程调用，提供播放器启动和格式转码能力。

**包含：**
- `spawnFfplay(sampleRate)` — 启动 ffplay 子进程（stdin: pipe，stdout/stderr: ignore，`-f s16le -ar <rate> -nodisp -autoexit`），返回子进程实例
- `convertPCMtoMP3(pcm, outputPath, sampleRate)` — 调用 ffmpeg 将 PCM buffer 转码为 MP3 文件，失败时抛出带 stderr 的错误

**注意：** `sampleRate` 参数必须与 API 请求中的 `sample_rate` 保持一致，两者均来自 `config.tts.sample_rate`。

---

### `commands/config.ts` — config 子命令业务逻辑

**职责：** 处理 `tts-cli config` 相关的所有业务逻辑和日志输出。

**包含：**
- `runConfigCommand(args)` — 处理 `--edit`、`--reset`、默认打印配置

---

### `commands/convert.ts` — convert 业务逻辑

**职责：** 处理文件转换的业务逻辑入口。

**包含：**
- `runConvert(input, args)` — 根据参数调用 `runDownloadMode` 或 `runPlayMode`

---

## 模块依赖关系

```
index.ts
  ├── setup.ts
  │     ├── config.ts
  │     └── env.ts
  └── cli.ts
        ├── commands/config.ts
        │     ├── config.ts
        │     └── setup.ts
        └── commands/convert.ts
              ├── tts.ts
              │     ├── config.ts
              │     ├── markdown.ts
              │     ├── env.ts
              │     └── utils.ts
              └── env.ts
```

## 日志输出规范

所有模块统一使用 `@clack/prompts` 输出人类可读信息（走 stderr），禁止直接使用 `console.log`。

| 场景 | 使用方法 |
|---|---|
| 普通信息 | `log.info()` |
| 成功提示 | `log.success()` |
| 步骤提示 | `log.step()` |
| 警告 | `log.warn()` |
| 错误 | `log.error()` |
| 带框块提示 | `note()` |
| 参数错误退出 | `log.error()` + `process.exit(1)` |
| 进度条 | `cli-progress` SingleBar |

## 架构约定

- `cli.ts` 只负责参数解析、校验和路由，不直接调用 log
- 真正的 log 输出（进度、成功、错误）在 `commands/`、`setup.ts`、`env.ts` 等业务模块中完成
- `cli.ts` 只在参数校验失败时使用 `log.error`
- **所有用户提示信息使用英文**

---

## 配置文件

路径：`~/.config/tts-cli/config.toml`

```toml
[api]
app_id = "your_app_id"
token  = "your_token"

[tts]
voice       = "zh_female_tianmei"
resource_id = "seed-tts-2.0"
speed       = 0        # [-50, 100]
volume      = 0        # [-50, 100]
sample_rate = 24000    # 8000/16000/22050/24000/32000/44100/48000
bit_rate    = 128000   # 仅 MP3 格式有效
format      = "mp3"    # mp3 / pcm / ogg_opus
lang        = "zh-cn"  # zh-cn / en / ja / es-mx / id / pt-br

[output]
dir = "~/Downloads"
```

**配置优先级（低 → 高）：**
```
默认值 < ~/.config/tts-cli/config.toml < CLI 参数
```

---

## 首次运行引导

当 `~/.config/tts-cli/config.toml` 不存在时，自动触发交互式引导，分两步：

**Step 1: Environment Check**

```
Welcome to tts-cli 🎙️

[1/2] Checking environment dependencies...

  ✓ ffmpeg is installed

  -- If not installed --
  ✗ ffmpeg not detected

  tts-cli requires ffmpeg for audio playback (ffplay) and transcoding.
  Please install:

    macOS:    brew install ffmpeg
    Ubuntu:   sudo apt install ffmpeg
    Windows:  winget install ffmpeg

  ? Press Enter to continue after installation (or skip)...
```

**Step 2: Basic Configuration**

```
[2/2] Basic configuration...

? Enter your Doubao app_id: xxxxxxxx
? Enter your Doubao token: xxxxxxxx
? Default voice (zh_female_tianmei):
? Default speed (0):

✓ Config saved
```

---

## CLI 参数

### 基础用法

```bash
tts-cli <input>                    # 转换文件，保存 MP3
tts-cli <input> --play             # 边合成边播放，不保存
tts-cli <input> --play --output <path>   # 播放完成后保存到指定路径
```

### 完整参数列表

```bash
tts-cli <input> [options]

参数：
  --play                    边合成边播放（使用 PCM 流 + ffplay）
  --output <path>           输出文件路径（指定时才保存）

  --voice <name>            音色（覆盖配置文件）
  --resource-id <id>        资源ID：seed-tts-1.0, seed-tts-2.0 等（覆盖配置文件）
  --speed <n>               语速，范围 [-50, 100]，默认 0
  --volume <n>              音量，范围 [-50, 100]，默认 0
  --emotion <type>          情感，如 happy / angry / sad（部分音色支持）
  --emotion-scale <n>       情感强度，范围 [1-5]，默认 4
  --format <fmt>            输出格式：mp3 / pcm / ogg_opus
  --sample-rate <n>         采样率，默认 24000
  --bit-rate <n>            比特率（仅 MP3），默认 128000
  --lang <code>             语种：zh-cn / en / ja / es-mx / id / pt-br
  --silence <ms>            句尾静音时长，范围 [0, 30000]ms

配置管理：
  tts-cli config              查看当前配置
  tts-cli config --edit       用默认编辑器打开配置文件
  tts-cli config --reset      重新触发交互式引导
```

---

## Markdown 自动检测

根据输入文件扩展名自动决定是否开启 Markdown 过滤，对用户完全透明：

```typescript
const ext = path.extname(inputFile).toLowerCase()
const isMarkdown = ext === '.md' || ext === '.markdown'
const disableMarkdownFilter = isMarkdown
// .md / .markdown → 过滤 Markdown 语法（**bold** 读作"bold"）
// .txt 等         → 当纯文本处理
```

---

## 三种运行模式

### 模式一：下载模式（默认）

```
输入文本
  → 请求 API（MP3 格式）
  → 流式接收，累积所有 chunk
  → 写入 .mp3 文件
```

### 模式二：播放模式（--play，无 --output）

```
输入文本
  → 请求 API（PCM 格式，sample_rate=24000）
  → 流式接收 chunk → 实时写入 ffplay stdin（边播边听）
  → 播放结束，退出
```

### 模式三：播放后保存模式（--play --output <path>）

```
输入文本
  → 请求 API（PCM 格式，sample_rate=24000）
  → 流式接收 chunk
    ├── 实时写入 ffplay stdin（边播边听）
    └── 同时累积到 buffer
  → 等待 ffplay 进程退出（播放真正结束）
  → buffer → ffmpeg → 保存 MP3
```

---

## Progress Display

Uses text character count as progress (from `sentence.text` field in API response):

```
🎙  [████████████░░░░░░░░] 60% | 180/300 chars | 64KB received
```

- Percentage: synthesized chars / total chars
- Received: accumulated bytes (KB)

---

## TTS API 说明

- **接口**：`POST https://openspeech.bytedance.com/api/v3/tts/unidirectional`
- **协议**：HTTP Chunked（单向流式）
- **鉴权 Header**：`X-Api-App-Id` / `X-Api-Access-Key` / `X-Api-Resource-Id`
- **响应格式**：
  - 音频数据块：`{ "code": 0, "data": "<base64>" }`
  - 文本进度块：`{ "code": 0, "data": null, "sentence": { "text": "...", "words": [...] } }`
  - 结束标志：`{ "code": 20000000, "message": "ok", "data": null }`
- **--play 模式用 PCM**，其余模式用 MP3
- `disable_markdown_filter` 根据文件扩展名自动设置，不暴露为 CLI 参数

### Resource ID 说明

`resource_id` 通过 `X-Api-Resource-Id` Header 指定使用的 TTS 资源版本。

| Resource ID | 说明 |
|---|---|
| `seed-tts-1.0` | 豆包语音合成模型1.0（字符版）|
| `seed-tts-2.0` | 豆包语音合成模型2.0（默认，支持大多数音色）|

**重要说明：**
- 不同 `resource_id` 对应不同的音色列表和 API 能力
- `seed-tts-1.0` 仅支持"豆包语音合成模型1.0"的音色，使用不兼容音色会导致认证错误（code 45000000）
- 默认 `resource_id` 为 `seed-tts-2.0`

---

## 编译与分发

```bash
# 开发运行
bun run src/index.ts input.md

# 编译为单一二进制（无需用户安装 Bun 或 Node）
bun build src/index.ts --compile --outfile tts-cli

# 运行二进制
./tts-cli input.md --play
```

---

## 系统依赖

唯一外部依赖：**ffmpeg**（同时提供 `ffplay` 播放器和转码能力）

| 功能 | 工具 | 来源 |
|---|---|---|
| 音频播放 | ffplay | ffmpeg 附带 |
| PCM → MP3 转码 | ffmpeg | ffmpeg |

**ffplay 播放 PCM 的命令：**

```bash
ffplay -f s16le -ar 24000 -nodisp -autoexit -
# -f s16le   : 16bit 小端 PCM
# -ar 24000  : 采样率
# -nodisp    : 不显示视频窗口
# -autoexit  : 播放完自动退出
# -          : 从 stdin 读取
```

**各平台安装方式：**

```bash
macOS:    brew install ffmpeg
Ubuntu:   sudo apt install ffmpeg
Windows:  winget install ffmpeg
```

**各场景依赖需求：**

| 场景 | 需要 ffmpeg |
|---|---|
| 只下载 MP3（默认） | ❌ |
| `--play` | ✅（ffplay 播放）|
| `--play --output <path>` | ✅（ffplay 播放 + ffmpeg 转码）|

**运行时报错提示：**

```
✗ ffmpeg not found. --play mode requires ffmpeg.

  Install:
    macOS:    brew install ffmpeg
    Ubuntu:   sudo apt install ffmpeg
    Windows:  winget install ffmpeg

  To download without playing, run:
    tts-cli input.md
```

---

## npm 依赖

```toml
[dependencies]
citty = "*"
smol-toml = "*"
"@clack/prompts" = "*"
cli-progress = "*"

[devDependencies]
"@types/cli-progress" = "*"
"bun-types" = "*"
```

---

## 开发规范：OpenSpec 规范驱动开发

本项目使用 [OpenSpec](https://openspec.dev/) 作为规范驱动开发框架。**所有功能开发必须先写 spec，再写代码。**

### 安装

```bash
npm install -g @fission-ai/openspec@latest
```

### 目录结构

```
openspec/
├── specs/                  # 功能模块规范（活文档，随代码一起提交）
│   ├── config/
│   │   └── spec.md         # 配置文件读写、首次引导、三层优先级
│   ├── tts-convert/
│   │   └── spec.md         # 下载模式：文本 → MP3
│   ├── tts-play/
│   │   └── spec.md         # 播放模式：--play / --no-save
│   ├── markdown-filter/
│   │   └── spec.md         # 根据文件扩展名自动开启 Markdown 过滤
│   └── env-check/
│       └── spec.md         # ffmpeg 检测与安装引导
└── changes/                # 每次功能变更的 proposal（可提交或忽略）
    ├── init-config/
    ├── download-mode/
    ├── play-mode/
    ├── markdown-auto-detect/
    └── env-check/
```

### 开发工作流

```bash
# 1. 发起一个 change proposal（在 Claude Code 中）
/openspec:proposal 实现下载模式，将 Markdown 文件转换为 MP3

# 2. 审查生成的文件
openspec/changes/download-mode/
├── proposal.md   # 这个 change 要做什么
├── design.md     # 技术决策
├── tasks.md      # 拆解的实现任务
└── specs/
    └── tts-convert/
        └── spec.md   # spec delta（需求变化）

# 3. 确认 proposal 无误后，按 tasks.md 逐步实现
# 4. 功能完成，spec 作为活文档留在仓库
```

### 规范

- `openspec/specs/` 下的文件是**功能的事实来源**，描述系统"应该做什么"
- 每次新增或修改功能，先通过 `/openspec:proposal` 生成 change，审查后再动代码
- specs 必须提交到 git，与代码保持同步
- `CLAUDE.md` 是整体架构概览，`openspec/specs/` 是各模块的详细需求和场景描述，两者互补
