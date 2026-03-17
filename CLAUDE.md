# tts-cli — Markdown to MP3 CLI Tool

## 项目概述

一款将 Markdown（或纯文本）文档转换为 MP3 音频的命令行工具，基于火山引擎豆包语音合成大模型，使用 TypeScript + Bun 开发，编译为单一可执行二进制文件分发。

---

## 技术栈

| 层级                   | 选型                          |
| ---------------------- | ----------------------------- |
| 语言                   | TypeScript                    |
| 运行时 / 包管理 / 编译 | Bun                           |
| CLI 框架               | citty                         |
| 配置文件格式           | TOML（smol-toml）             |
| 交互式引导             | @clack/prompts                |
| 进度条                 | cli-progress                  |
| TTS API                | 火山引擎豆包语音合成大模型    |
| 音频播放               | ffplay（ffmpeg 附带，跨平台） |
| PCM → MP3 转码         | ffmpeg（唯一外部依赖）        |

---

## 目录结构

```
src/
├── index.ts                 # 程序入口：citty 命令定义、启动检测与流程引导
├── config.ts                # 配置读写与三层合并 (依赖 core/constants 和 core/errors)
├── setup.ts                 # 首次运行交互式引导
├── env.ts                   # 环境依赖检测 (ffmpeg)
├── markdown.ts              # 输入文件处理 (Markdown 自动检测)
├── utils.ts                 # 音频工具函数 (ffplay/ffmpeg 进程调度)
├── errors.ts                # 错误处理 (APIError, 错误类型映射)
├── tts.ts                   # 核心业务：Provider-agnostic 的通用流式处理、UI进度、播放控制
│
├── core/                    # 🌟 系统核心契约与规则 (绝对禁止引入 providers/ 下的任何东西)
│   ├── types.ts             # 接口与类型 (TTSProvider, TTSStream, AudioFormat)
│   ├── errors.ts            # 统一异常定义 (ProviderAuthError, ProviderQuotaError, ProviderRateLimitError)
│   ├── constants.ts         # 领域常量 (SUPPORTED_FORMATS, DEFAULT_SAMPLE_RATE 等)
│   └── base.ts              # (可选) 抽象基类 BaseProvider，提供通用逻辑实现
│
└── providers/               # 🔌 具体厂商实现 (必须遵守 core/ 的契约)
    ├── index.ts             # TTSFactory 工厂类，根据配置实例化具体厂商
    └── volcengine/          # 火山引擎实现模块
        ├── index.ts         # 🌟 门面 (Facade)：实现 TTSProvider，对外的唯一出口
        ├── http.ts          # 内部实现：HTTP Chunked 协议处理
        ├── websocket.ts     # 内部实现：WebSocket 协议处理
        ├── auth.ts          # 内部共享：鉴权与 HMAC-SHA256 签名算法
        └── types.ts         # 内部共享：火山引擎私有 Request/Response 类型
```

## 架构设计模式

本项目采用 **整洁架构 (Clean Architecture)** 和 **领域驱动设计 (DDD)** 原则，结合 **Facade（门面模式）** 实现多厂商 TTS 适配。设计目标是将核心业务逻辑与具体厂商实现完全解耦，实现高内聚、低耦合的代码结构。

---

### 一、整洁架构 (Clean Architecture)

#### 1.1 依赖倒置原则 (Dependency Inversion Principle)

```
                ┌─────────────────────────────────────┐
                │           应用层 (Application)       │
                │   ┌─────────────────────────────┐   │
                │   │    index.ts, tts.ts, etc.   │   │
                │   │  (业务编排、UI、进度、播放)   │   │
                │   └─────────────────────────────┘   │
                │                 │                  │
                │                 ▼                  │
                │   ┌─────────────────────────────┐   │
                │   │       core/ (核心契约)       │   │
                │   │  ┌───────────────────────┐  │   │
                │   │  │ types.ts             │  │   │
                │   │  │ errors.ts            │  │   │
                │   │  │ constants.ts         │  │   │
                │   │  │ base.ts              │  │   │
                │   │  └───────────────────────┘  │   │
                │   │                               │   │
                │   │  TTSProvider, TTSStream        │   │
                │   │  ProviderError, Constants       │   │
                │   └─────────────────────────────┘   │
                │                 ▲                  │
                │                 │                  │
                │   ┌─────────────────────────────┐   │
                │   │   providers/ (厂商实现)       │   │
                │   │  ┌───────────────────────┐  │   │
                │   │  │ volcengine/           │  │   │
                │   │  │   ├── index.ts (Facade)│  │   │
                │   │  │   ├── http.ts          │  │   │
                │   │  │   ├── websocket.ts     │  │   │
                │   │  │   ├── auth.ts          │  │   │
                │   │  │   └── types.ts         │  │   │
                │   │  └───────────────────────┘  │   │
                │   │                               │   │
                │   │  实现 TTSProvider 接口         │   │
                │   │  遵守 core/ 定义的契约         │   │
                │   └─────────────────────────────┘   │
                │                                     │
                └─────────────────────────────────────┘

                      ⬆ 依赖方向 (Dependency Direction)
                      │
                      └─── outer ───> inner ───> core
```

**核心规则：**

- `core/` 定义契约和领域规则，**绝不依赖**任何外部实现
- `providers/` 实现契约，**只依赖** `core/`
- 应用层使用契约，同时依赖 `core/` 和 `providers/`

**依赖倒置的好处：**

1. **可替换性**：可以随时替换 `volcengine` 为 `openai`，核心逻辑无需改动
2. **可测试性**：可以用 Mock Provider 测试核心业务逻辑
3. **可维护性**：厂商升级 API 只需修改对应 provider 目录

#### 1.2 分层职责

| 层级                     | 目录                       | 职责                                   | 依赖                        |
| ------------------------ | -------------------------- | -------------------------------------- | --------------------------- |
| **核心层 (Core)**        | `core/`                    | 定义领域契约、业务规则、错误类型、常量 | 无依赖（最内层）            |
| **适配层 (Adapter)**     | `providers/`               | 实现核心契约，封装具体厂商 API         | 依赖 `core/`                |
| **应用层 (Application)** | `index.ts`, `tts.ts`, etc. | 业务编排、UI 控制、进度显示            | 依赖 `core/` + `providers/` |

---

### 二、门面模式 (Facade Pattern)

#### 2.1 问题背景

一个 TTS 厂商可能支持多种协议（HTTP Chunked、WebSocket、gRPC 等）。如果将所有协议实现混在一个文件中，会导致：

- 文件臃肿（单文件 500+ 行）
- 难以测试（协议逻辑耦合）
- 难以扩展（新增协议需要修改现有代码）

#### 2.2 Facade 模式解决方案

```
┌─────────────────────────────────────────────────────────────┐
│                     providers/volcengine/                    │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐   │
│   │  index.ts (Facade) ──── 实现 TTSProvider 接口       │   │
│   │                                                             │
│   │  对外：统一的接口实现                                   │   │
│   │  对内：根据配置路由到具体协议实现                       │   │
│   └─────────────────────────────────────────────────────┘   │
│           │                      │                          │
│           ▼                      ▼                          │
│   ┌──────────────┐      ┌──────────────┐                      │
│   │  http.ts     │      │ websocket.ts │                      │
│   │              │      │              │                      │
│   │ HTTP Chunked │      │ WebSocket    │                      │
│   │ 实现         │      │ 实现         │                      │
│   └──────────────┘      └──────────────┘                      │
│           │                      │                          │
│           └──────────┬───────────┘                          │
│                      ▼                                     │
│              ┌──────────────┐                                │
│              │  auth.ts     │                                │
│              │              │                                │
│              │ 共享鉴权逻辑 │                                │
│              │  签名算法等  │                                │
│              └──────────────┘                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**代码示例：**

```typescript
// providers/volcengine/index.ts - Facade
import { TTSProvider, AudioFormat } from '../../core/types.js';
import { VolcEngineHTTP } from './http.js';
import { VolcEngineWS } from './websocket.js'; // 未来

export class VolcEngineProvider implements TTSProvider {
  name = 'volcengine';
  format: AudioFormat = { type: 'pcm', sampleRate: 24000, channels: 1, bitDepth: 16 };

  private implementation: TTSProvider;

  constructor(config: VolcEngineConfig) {
    // 策略路由：根据配置决定用 HTTP 还是 WebSocket
    if (config.protocol === 'websocket') {
      this.implementation = new VolcEngineWS(config);
    } else {
      this.implementation = new VolcEngineHTTP(config);
    }
  }

  // 代理给具体实现
  async validateCredentials(config: any): Promise<boolean> {
    return this.implementation.validateCredentials(config);
  }

  async synthesize(text: string, options: any): Promise<TTSStream> {
    return this.implementation.synthesize(text, options);
  }
}
```

**优势：**

1. **单一职责**：每个文件只负责一种协议或一个关注点
2. **开闭原则**：新增协议无需修改现有代码，只需新增文件
3. **易于测试**：可以独立测试 HTTP、WebSocket 实现

---

### 三、领域驱动设计 (DDD)

#### 3.1 领域契约 (Domain Contract)

`core/types.ts` 定义了 TTS 领域的核心概念：

```typescript
// TTS 提供者契约 - 所有厂商必须实现
export interface TTSProvider {
  name: string; // 厂商标识
  format: AudioFormat; // 输出格式声明
  validateCredentials(config: ProviderConfig): Promise<boolean>;
  synthesize(text: string, options: SynthesizeOptions): Promise<TTSStream>;
}

// TTS 流契约 - 统一的异步流接口
export interface TTSStream {
  getAudioChunks(): AsyncIterable<Uint8Array>; // 音频数据流
  getSubtitleChunks(): AsyncIterable<SubtitleChunk>; // 字幕数据流
  getAudioFormat(): AudioFormat; // 格式查询
  close(): void; // 资源清理
}

// 音频格式 - 领域值对象
export interface AudioFormat {
  type: 'pcm' | 'mp3' | 'opus';
  sampleRate?: number; // PCM 必需
  channels?: number; // PCM 必需
  bitDepth?: number; // PCM 必需
}
```

#### 3.2 领域错误 (Domain Errors)

`core/errors.ts` 定义了 TTS 领域的错误类型：

```typescript
// 认证失败 - 凭证无效或过期
export class ProviderAuthError extends Error { ... }

// 配额超限 - API 调用次数或字符数超限
export class ProviderQuotaError extends Error { ... }

// 速率限制 - 触发 API 限流
export class ProviderRateLimitError extends Error { ... }

// 参数验证失败 - 非法参数值
export class ProviderValidationError extends Error { ... }
```

**调用方可以精确捕获特定错误：**

```typescript
try {
  await provider.synthesize(text, options);
} catch (error) {
  if (error instanceof ProviderAuthError) {
    log.error('认证失败，请检查配置文件中的凭证');
  } else if (error instanceof ProviderQuotaError) {
    log.error('配额已用完，请充值');
  } else if (error instanceof ProviderRateLimitError) {
    log.error('调用过于频繁，请稍后再试');
  }
}
```

#### 3.3 领域常量 (Domain Constants)

`core/constants.ts` 定义了领域中的不变量：

```typescript
// 支持的音频格式
export const SUPPORTED_FORMATS = ['mp3', 'pcm', 'opus'] as const;

// 默认音频参数
export const DEFAULT_SAMPLE_RATE = 24000;
export const DEFAULT_CHANNELS = 1;
export const DEFAULT_BIT_DEPTH = 16;

// 参数范围
export const MIN_SPEED = -50;
export const MAX_SPEED = 100;
export const MIN_VOLUME = -50;
export const MAX_VOLUME = 100;
```

**常量的好处：**

- 单一真实来源 (Single Source of Truth)
- 避免魔法数字 (Magic Numbers)
- 便于修改和维护

---

### 四、工厂模式 (Factory Pattern)

#### 4.1 Provider 工厂

`providers/index.ts` 提供工厂函数，根据配置动态创建 Provider 实例：

```typescript
import { VolcEngineProvider } from './volcengine/index.js';
// import { OpenAIProvider } from './openai/index.js';  // 未来

export function createProvider(name: string, config: ProviderConfig): TTSProvider {
  switch (name) {
    case 'volcengine':
      return new VolcEngineProvider(config.providers.volcengine);
    case 'openai':
      return new OpenAIProvider(config.providers.openai);
    default:
      throw new Error(`Unknown provider: ${name}. Available: volcengine, openai`);
  }
}
```

**使用示例：**

```typescript
// 应用层代码
import { createProvider } from './providers/index.js';

const provider = createProvider(config.provider, config);
const stream = await provider.synthesize(text, options);
```

---

### `index.ts` — 程序入口与 CLI 定义

**职责：** 使用 `citty` 定义所有命令和参数，处理配置检测与首次引导，路由到对应的业务函数。

**包含：**

- 主命令定义（`<input>`、`--play`、`--output` 及所有 TTS 参数）
- 参数解析与校验
- 配置文件存在性检测
- 首次运行凭证收集（通过 `--appId` / `--token` 参数）
- 路由到 `runDownloadMode()` 或 `runPlayMode()`

**执行流程：**

1. 检测配置文件是否存在
2. 不存在 + 无凭证参数 → 引导用户提供凭证（但先验证后才保存）
3. 存在或提供凭证 → 加载配置，执行 TTS 操作

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

_API 层：_

- `buildHeaders(config)` — 构造鉴权 Header
- `buildPayload(text, config, options)` — 构造完整请求 Body
- `fetchTTS(text, config, options)` — 发起 HTTP Chunked 请求，返回 `Response`
- `parseChunks(value)` — 含缓冲拼接的流式 JSON 解析，处理跨 chunk 边界

_进度层：_

- `createProgressBar(totalChars)` — 初始化 `cli-progress` SingleBar
- `updateProgress(bar, json, ctx)` — 根据 chunk 类型更新进度条

_模式层：_

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

| 扩展名              | disableMarkdownFilter |
| ------------------- | --------------------- |
| `.md` / `.markdown` | `true`                |
| 其他                | `false`               |

---

### `errors.ts` — 错误处理

**职责：** 定义 API 错误类型和错误处理工具函数。

**包含：**

- `APIError` class — 自定义错误类，包含错误码、消息和类型
- `getAPIErrorType(code)` — 根据错误码返回错误类型（auth/quota/rate_limit/unknown）
- `getAPIErrorSuggestion(error)` — 返回用户友好的错误提示和建议

---

### `utils.ts` — 音频工具函数

**职责：** 封装 ffplay 和 ffmpeg 的进程调用，提供播放器启动和格式转码能力。

**包含：**

- `spawnFfplay(sampleRate)` — 启动 ffplay 子进程（stdin: pipe，stdout/stderr: ignore，`-f s16le -ar <rate> -nodisp -autoexit`），返回子进程实例
- `convertPCMtoMP3(pcm, outputPath, sampleRate)` — 调用 ffmpeg 将 PCM buffer 转码为 MP3 文件，失败时抛出带 stderr 的错误

**注意：** `sampleRate` 参数必须与 API 请求中的 `sample_rate` 保持一致，两者均来自 `config.tts.sample_rate`。

---

## 模块依赖关系

```
index.ts
  ├── setup.ts
  │     ├── config.ts
  │     └── env.ts
  ├── config.ts
  ├── tts.ts
  │     ├── config.ts
  │     ├── markdown.ts
  │     ├── env.ts
  │     └── utils.ts
  ├── markdown.ts
  └── errors.ts
```

## 日志输出规范

所有模块统一使用 `@clack/prompts` 输出人类可读信息（走 stderr），禁止直接使用 `console.log`。

| 场景         | 使用方法                          |
| ------------ | --------------------------------- |
| 普通信息     | `log.info()`                      |
| 成功提示     | `log.success()`                   |
| 步骤提示     | `log.step()`                      |
| 警告         | `log.warn()`                      |
| 错误         | `log.error()`                     |
| 带框块提示   | `note()`                          |
| 参数错误退出 | `log.error()` + `process.exit(1)` |
| 进度条       | `cli-progress` SingleBar          |

## 架构约定

- `index.ts` 负责参数解析、校验和路由，包含 citty 命令定义
- 真正的 log 输出（进度、成功、错误）在 `tts.ts`、`setup.ts`、`env.ts` 等业务模块中完成
- `index.ts` 只在参数校验失败时使用 `log.error`
- **所有用户提示信息使用英文**

---

## 配置文件

路径：`~/.config/tts-cli/config.toml`

```toml
[api]
# 默认生效的 provider
provider = "volcengine"

[providers.volcengine]
app_id      = "your_app_id"
token       = "your_token"
resource_id = "seed-tts-2.0"

[providers.openai]
# 预留给未来的 OpenAI 配置
# api_key = "..."

[tts]
voice       = "zh_female_tianmei"
speed       = 0        # [-50, 100]
volume      = 0        # [-50, 100]
sample_rate = 24000    # 8000/16000/22050/24000/32000/44100/48000
bit_rate    = 128000   # 仅 MP3 格式有效
format      = "mp3"    # mp3 / pcm / ogg_opus
lang        = "zh-cn"  # zh-cn / en / ja / es-mx / id / pt-br
```

**配置优先级（低 → 高）：**

```
默认值 < ~/.config/tts-cli/config.toml < 环境变量 < CLI 参数
```

**环境变量：**

- `TTS_CLI_APP_ID` - 覆盖配置文件中的 `app_id`
- `TTS_CLI_TOKEN` - 覆盖配置文件中的 `token`

空环境变量被视为未设置（会回退到下一层）。

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
```

**注意：** 收集凭证后系统不会立即保存配置，而是先执行命令验证凭证。只有 API 调用成功后才会将凭证保存到配置文件。如果凭证无效，系统会显示错误提示且不会创建配置文件，用户需要修正后重试。

---

## CLI 参数

### 基础用法

```bash
tts-cli <input>                    # 转换文件，保存 MP3
tts-cli <input> --play             # 播放（本地文件或生成后播放）
tts-cli <input> --output <path>    # 保存到指定路径
tts-cli <input> --force            # 强制覆盖已存在文件
```

### 完整参数列表

````bash
tts-cli <input> [options]

参数：
  --play                    播放音频（本地文件或生成后播放）
  --output <path>           输出文件路径（支持文件或文件夹）
  --force                   强制覆盖已存在文件

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

### 凭证覆盖

支持运行时覆盖 API 凭证，优先级从高到低：CLI 参数 > 环境变量 > 配置文件

```bash
# CLI 参数覆盖（最高优先级）
tts-cli input.md --appId <app_id> --token <token>

# 环境变量覆盖
TTS_CLI_APP_ID=<app_id> TTS_CLI_TOKEN=<token> tts-cli input.md

# 配置文件（默认）
tts-cli input.md  # 使用 ~/.config/tts-cli/config.toml 中的凭证
````

**支持部分覆盖：**

- 只覆盖 `app_id`：`tts-cli input.md --appId <app_id>`
- 只覆盖 `token`：`tts-cli input.md --token <token>`

---

## Markdown 自动检测

根据输入文件扩展名自动决定是否开启 Markdown 过滤，对用户完全透明：

```typescript
const ext = path.extname(inputFile).toLowerCase();
const isMarkdown = ext === '.md' || ext === '.markdown';
const disableMarkdownFilter = isMarkdown;
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

### 模式二：播放模式（--play）

**文件已存在：** 直接播放本地 MP3

```
输入文本
  → 检测到输出文件已存在
  → ffplay 播放本地 MP3
```

**文件不存在：** 生成并播放

```
输入文本
  → 请求 API（PCM 格式，sample_rate=24000）
  → 流式接收 chunk
    ├── 实时写入 ffplay stdin（边播边听）
    └── 同时累积到 buffer
  → 等待 ffplay 进程退出（播放真正结束）
  → buffer → ffmpeg → 保存 MP3
```

### 模式三：强制覆盖模式（--force）

```
输入文本
  → 忽略文件存在检查
  → 请求 API 重新生成
  → 保存 MP3（如有 --play 则同时播放）
```

---

### 文件存在时的行为

| 参数组合                  | 文件存在 | 行为               |
| ------------------------- | -------- | ------------------ |
| 无                        | ✓        | 提示已存在，退出   |
| `--play`                  | ✓        | 直接播放本地 MP3   |
| `--force`                 | ✓        | 强制重新生成       |
| `--play --force`          | ✓        | 强制重新生成并播放 |
| `--output <path>`         | ✓        | 提示已存在，退出   |
| `--play --output <path>`  | ✓        | 直接播放本地 MP3   |
| `--force --output <path>` | ✓        | 强制重新生成       |

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

| Resource ID    | 说明                                        |
| -------------- | ------------------------------------------- |
| `seed-tts-1.0` | 豆包语音合成模型1.0（字符版）               |
| `seed-tts-2.0` | 豆包语音合成模型2.0（默认，支持大多数音色） |

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

| 功能           | 工具   | 来源        |
| -------------- | ------ | ----------- |
| 音频播放       | ffplay | ffmpeg 附带 |
| PCM → MP3 转码 | ffmpeg | ffmpeg      |

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

| 场景                     | 需要 ffmpeg                     |
| ------------------------ | ------------------------------- |
| 只下载 MP3（默认）       | ❌                              |
| `--play`                 | ✅（ffplay 播放）               |
| `--play --output <path>` | ✅（ffplay 播放 + ffmpeg 转码） |

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
