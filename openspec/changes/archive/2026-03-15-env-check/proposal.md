# Proposal: env-check

## Why

tts-cli 依赖 `ffmpeg`（提供 `ffplay` 播放和转码能力）作为唯一外部系统依赖。不同用户的系统环境不同，ffmpeg 未必预装。

需要在两个时机进行检测并给出友好提示，避免用户在运行到一半时才遇到晦涩的系统错误：
1. **首次引导时**：在配置向导的第一步检测，若未安装则引导用户安装后再继续
2. **运行时**：执行 `--play` 相关功能前检测，若未安装则给出明确提示和安装命令后退出

## What Changes

**首次引导检测（配合 init-config）**

在 `setup.ts` 引导流程的第一步加入环境检测：

```
[1/2] 检测环境依赖...

  ✓ ffmpeg    已安装（v6.1）

  -- 若未安装 --
  ✗ ffmpeg    未检测到

  tts-cli 依赖 ffmpeg 实现音频播放（ffplay）和格式转码。
  请先安装：

    macOS:    brew install ffmpeg
    Ubuntu:   sudo apt install ffmpeg
    Windows:  winget install ffmpeg

  ? 安装完成后按 Enter 继续...
```

**运行时检测**

执行 `--play` 或 `--play --no-save` 前，检测 ffmpeg 是否可用，不可用时输出提示并以非零状态码退出：

```
✗ 未检测到 ffmpeg，--play 模式需要 ffmpeg。

  安装方法：
    macOS:    brew install ffmpeg
    Ubuntu:   sudo apt install ffmpeg
    Windows:  winget install ffmpeg

  如果只想下载不播放，直接运行：
    tts-cli input.md
```

**各场景依赖需求**

| 场景 | 需要 ffmpeg |
|---|---|
| 只下载 MP3（默认） | 否 |
| `--play --no-save` | 是（ffplay 播放）|
| `--play` 播放+保存 | 是（ffplay 播放 + ffmpeg 转码）|

## Impact

- 新增 `src/utils.ts` 中的 `checkDependencies()` 函数：使用 `which`/`where` 检测 ffmpeg 是否在 PATH 中
- 修改 `src/setup.ts`：在引导第一步调用 `checkDependencies()`
- 修改 `src/tts.ts`：在 `runPlayMode()` 入口调用 `checkDependencies()`，未满足则 `process.exit(1)`
