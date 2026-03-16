# tts-play Specification

## Purpose

在文本转语音的同时实时播放音频，提升长文档转换的使用体验。支持边播边存模式，所有 `--play` 模式都会保存文件。通过 ffplay 实现跨平台播放。

## Requirements

### Requirement: 边播边存模式

系统 SHALL 支持在合成音频的同时实时播放，播放完成后将音频保存为 MP3。所有 `--play` 模式都会保存文件。

#### Scenario: --play 模式完整流程（文件不存在）

- GIVEN 用户运行 `tts-cli input.md --play`
- AND 输出文件不存在
- WHEN 系统请求 API（强制 PCM 格式）
- THEN 每个音频 chunk 实时写入 ffplay stdin（立即播放）
- AND 同时将 chunk 累积到内存 buffer
- WHEN 流接收完毕
- THEN 等待 ffplay 进程真正退出（播放完全结束）
- THEN 将 buffer 通过 ffmpeg 转码为 MP3
- AND 保存到本地
- AND 打印 `✓ 已保存到 <outputPath>`

#### Scenario: --play 模式（文件已存在）

- GIVEN 用户运行 `tts-cli input.md --play`
- AND 输出文件 `input.mp3` 已存在
- WHEN 系统检测到文件存在
- THEN 不调用 API
- AND 使用 ffplay 直接播放 `input.mp3`
- AND 播放命令为：`ffplay -nodisp -autoexit input.mp3`

#### Scenario: --play --force 强制重新生成

- GIVEN 用户运行 `tts-cli input.md --play --force`
- AND 输出文件 `input.mp3` 已存在
- WHEN 系统检测到 --force 参数
- THEN 忽略文件存在检查
- AND 调用 API 重新生成（PCM 边播边存）
- AND 覆盖已存在的 `input.mp3`

#### Scenario: --play --output 指定路径

- GIVEN 用户运行 `tts-cli input.md --play --output /tmp/podcast.mp3`
- WHEN 转换完成
- THEN 边播放边生成
- AND 最终保存到 `/tmp/podcast.mp3`

#### Scenario: 转码在播放结束后才执行

- GIVEN `--play` 模式转换进行中
- WHEN 流数据接收完毕但 ffplay 仍在播放缓冲区内容
- THEN 系统等待 ffplay 进程退出
- AND 不提前触发转码或打印保存提示

---

### Requirement: 运行时凭证覆盖

系统 SHALL 支持在 `--play` 模式下通过 CLI 参数临时覆盖 API 凭证。

#### Scenario: 播放模式覆盖凭证

- GIVEN 配置文件中 `app_id = "old_app_id"`
- AND 配置文件中 `token = "old_token"`
- WHEN 用户运行 `tts-cli input.md --play --appId new_app_id --token new_token`
- THEN 本次播放请求使用 `new_app_id` 和 `new_token`
- AND 配置文件保持不变

#### Scenario: 调试不同账户的配额

- GIVEN 用户账户 A 的配额用完
- WHEN 用户运行 `tts-cli input.md --play --appId account_B_app_id --token account_B_token`
- THEN 使用账户 B 的凭证发起 API 请求
- AND 可以继续播放音频

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

---

### Requirement: API 错误处理

系统 SHALL 在 `--play` 模式下处理 API 错误，使用 `APIError` 类封装错误信息并友好显示。

#### Scenario: 播放模式 API 错误

- GIVEN 用户运行 `tts-cli input.md --play`
- AND API 返回错误响应
- WHEN 系统检测到错误
- THEN 创建 `APIError`，包含错误码和消息
- AND 不启动 ffplay 进程
- AND 使用 `log.error` 显示格式化错误：`API 错误 <code>: <message>`
- AND 进程以退出码 1 退出

#### Scenario: 配额超限错误

- GIVEN 用户运行 `--play` 模式
- AND API 返回错误码 45000292
- WHEN 系统接收到该错误
- THEN `APIError.type` 为 `"quota"`
- AND 显示错误：`API 错误 45000292: quota exceeded for types: text_words_lifetime`
- AND 显示额外提示：`配额已用完，请检查火山引擎控制台的配额使用情况`
- AND 不启动 ffplay 播放

#### Scenario: 鉴权失败

- GIVEN API 凭证错误
- WHEN 用户运行 `--play` 模式
- THEN `APIError.type` 为 `"auth"`
- AND 显示错误：`API 错误 45000000: <具体消息>`
- AND 显示建议：`请检查配置文件中的 app_id 和 token`
