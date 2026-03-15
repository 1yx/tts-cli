# Proposal: download-mode

## Why

tts-cli 的核心功能是将 Markdown 或文本文件转换为 MP3 音频文件。用户需要一个简单的默认行为：运行命令后直接得到 MP3 文件，无需任何额外参数。

## What Changes

- 实现默认下载模式：`tts-cli input.md` → 输出 `input.mp3`（与输入同目录同名）
- 调用豆包 TTS API（HTTP Chunked 单向流式），请求格式为 `mp3`
- 流式接收所有 chunk，base64 解码后累积到 buffer，全部收完后写入 MP3 文件
- 进度显示：通过响应中的 `sentence.text` 字段计算字符进度百分比，同时显示已接收字节数
  ```
  🎙  [████████████░░░░░░░░] 60% | 180/300字 | 已接收 64KB
  ```
- `--output <path>` 参数支持自定义输出路径
- 支持完整 CLI 参数覆盖配置文件：`--voice`、`--model`、`--speed`、`--volume`、`--emotion`、`--emotion-scale`、`--format`、`--sample-rate`、`--bit-rate`、`--lang`、`--silence`

## Impact

- 新增 `src/tts.ts`：豆包 TTS API 调用封装、下载模式实现
- 新增 `src/markdown.ts`：输入文件读取（Markdown 过滤逻辑由 markdown-auto-detect change 负责）
- 修改 `src/cli.ts`：注册主命令及所有 CLI 参数
- 依赖：`citty`（CLI 框架）、`cli-progress`（进度条）
