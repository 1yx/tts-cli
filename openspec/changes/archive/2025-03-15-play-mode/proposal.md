# Proposal: play-mode

## Why

用户在转换长文档时，需要等待完整下载才能听到内容。通过流式播放，用户可以在合成开始后立即听到音频，显著改善等待体验。

同时部分场景用户只想快速试听，不需要保存文件，应该支持只播放不保存的模式。

## What Changes

新增 `--play` 参数，触发播放模式，衍生出两种子模式：

**模式二：播放 + 保存（`--play`）**
- 请求 API 时使用 PCM 格式（`format: pcm`），而非 MP3
- 流式接收 chunk，同时做两件事：
  1. 实时写入 `ffplay` stdin（边收边播）
  2. 累积到 buffer
- 等待 `ffplay` 进程退出（播放真正结束，而非流接收完毕）
- buffer 通过 `ffmpeg` 转码为 MP3，写入文件

**模式三：只播放（`--play --no-save`）**
- 同样请求 PCM 格式
- 实时写入 `ffplay` stdin
- 播放结束后直接退出，不做任何文件写入

ffplay 播放 PCM 的命令：
```bash
ffplay -f s16le -ar 24000 -ac 1 -nodisp -autoexit -
```

PCM → MP3 转码命令：
```bash
ffmpeg -f s16le -ar 24000 -ac 1 -i pipe:0 output.mp3
```

## Impact

- 修改 `src/tts.ts`：新增 `runPlayMode()` 函数，处理 PCM 流 + ffplay + ffmpeg 转码
- 修改 `src/cli.ts`：新增 `--play`、`--no-save` 参数；`--no-save` 单独使用时报错提示
- 新增 `src/utils.ts`：`convertPCMtoMP3()` 封装 ffmpeg 转码逻辑
- 系统依赖：`ffmpeg`（提供 `ffplay` 和转码能力），需在 env-check change 中处理检测逻辑
