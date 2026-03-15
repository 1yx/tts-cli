# tts-play Specification

## Purpose

在文本转语音的同时实时播放音频，提升长文档转换的使用体验。支持边播边存和只播不存两种子模式。通过 ffplay 实现跨平台播放。

## Requirements

### Requirement: 边播边存模式

系统 SHALL 支持在合成音频的同时实时播放，播放完成后将音频保存为 MP3。

#### Scenario: --play 模式完整流程

- GIVEN 用户运行 `tts-cli input.md --play`
- WHEN 系统请求 API（强制 PCM 格式）
- THEN 每个音频 chunk 实时写入 ffplay stdin（立即播放）
- AND 同时将 chunk 累积到内存 buffer
- WHEN 流接收完毕
- THEN 等待 ffplay 进程真正退出（播放完全结束）
- THEN 将 buffer 通过 ffmpeg 转码为 MP3
- AND 保存到本地
- AND 打印 `✓ 已保存到 <outputPath>`

#### Scenario: 转码在播放结束后才执行

- GIVEN `--play` 模式转换进行中
- WHEN 流数据接收完毕但 ffplay 仍在播放缓冲区内容
- THEN 系统等待 ffplay 进程退出
- AND 不提前触发转码或打印保存提示

---

### Requirement: 只播不存模式

系统 SHALL 支持只播放不保存文件的模式。

#### Scenario: --play --no-save 模式

- GIVEN 用户运行 `tts-cli input.md --play --no-save`
- WHEN 系统请求 API（PCM 格式）
- THEN 每个音频 chunk 实时写入 ffplay stdin
- AND 不累积 buffer
- WHEN 播放结束
- THEN 进程正常退出
- AND 本地无任何文件生成

#### Scenario: --no-save 必须配合 --play

- GIVEN 用户运行 `tts-cli input.md --no-save`（不带 --play）
- WHEN 系统解析参数
- THEN 打印参数错误提示
- AND 进程退出，不发起 API 请求

---

### Requirement: 强制使用 PCM 格式

系统 SHALL 在 `--play` 模式下强制使用 PCM 格式请求 API，忽略 `--format` 参数。

#### Scenario: --format 参数被忽略

- GIVEN 用户运行 `tts-cli input.md --play --format ogg_opus`
- WHEN 系统构造 API 请求
- THEN 请求格式为 `pcm`，`--format` 参数被忽略
- AND 最终保存的文件仍为 `.mp3`（通过 ffmpeg 转码）

---

### Requirement: 采样率一致性

系统 SHALL 确保 ffplay 播放采样率与 API 请求采样率始终一致。

#### Scenario: 采样率同源

- GIVEN `config.tts.sample_rate = 16000`
- WHEN 系统启动 ffplay 并构造 API 请求
- THEN ffplay `-ar` 参数为 `16000`
- AND API payload 中 `sample_rate` 为 `16000`

---

### Requirement: 跨平台播放

系统 SHALL 通过 ffplay 在 macOS、Linux、Windows 上提供一致的播放体验。

#### Scenario: 播放时不弹出窗口

- GIVEN 用户运行 `--play` 模式
- WHEN ffplay 启动
- THEN 不弹出任何 GUI 窗口（`-nodisp` 参数生效）
- AND 播放完成后 ffplay 自动退出（`-autoexit` 参数生效）

---

### Requirement: play 模式的进度显示

系统 SHALL 在 `--play` 模式下提供与下载模式相同的进度条。

#### Scenario: 进度条实时更新

- GIVEN `--play` 模式转换进行中
- WHEN 收到 sentence chunk
- THEN 进度条字符数和百分比正常更新
- AND 已接收字节数同步更新
