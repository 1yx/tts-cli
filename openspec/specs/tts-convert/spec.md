# tts-convert Specification

## Purpose

将 Markdown 或纯文本文件通过豆包语音合成大模型转换为 MP3 音频文件，支持流式进度显示。这是 tts-cli 的默认核心功能。

## Requirements

### Requirement: 基本转换

系统 SHALL 将输入文本文件转换为 MP3 音频文件并保存到本地。

#### Scenario: 默认转换

- GIVEN 用户已完成配置
- AND 输入文件存在
- WHEN 用户运行 `tts-cli input.md`
- THEN 系统调用豆包 TTS API（HTTP Chunked 流式）
- AND 流式接收音频数据
- AND 将完整 MP3 保存至与输入文件同目录的同名 `.mp3` 文件
- AND 打印 `✓ 已保存到 <outputPath>`

#### Scenario: 自定义输出路径

- GIVEN 用户运行 `tts-cli input.md --output ./podcast.mp3`
- WHEN 转换完成
- THEN MP3 文件保存至 `./podcast.mp3`

#### Scenario: 输入文件不存在

- GIVEN 指定的输入文件不存在
- WHEN 用户运行 tts-cli
- THEN 系统打印友好错误提示
- AND 进程退出，不发起 API 请求

---

### Requirement: 流式进度显示

系统 SHALL 在转换过程中实时显示合成进度。

#### Scenario: 进度条更新

- GIVEN 转换正在进行
- WHEN API 返回文本进度数据（sentence chunk）
- THEN 进度条百分比根据已合成字符数 / 总字符数实时更新
- AND 同时显示已接收字节数（KB）

#### Scenario: 转换完成

- GIVEN 收到 API 结束标志（code = 20000000）
- WHEN 转换完成
- THEN 进度条推至 100% 并停止

---

### Requirement: CLI 参数覆盖

系统 SHALL 支持通过 CLI 参数临时覆盖配置文件中的 TTS 设置。

#### Scenario: 覆盖音色

- GIVEN 配置文件中 `voice = "zh_female_tianmei"`
- WHEN 用户运行 `tts-cli input.md --voice zh_male_xiaoming`
- THEN 本次请求使用 `zh_male_xiaoming`

支持覆盖的参数：

| 参数              | 说明             | 范围                   |
| ----------------- | ---------------- | ---------------------- |
| `--voice`         | 音色             | 见豆包音色列表         |
| `--model`         | 模型版本         | 如 `seed-tts-1.1`      |
| `--speed`         | 语速             | [-50, 100]             |
| `--volume`        | 音量             | [-50, 100]             |
| `--emotion`       | 情感             | happy / angry / sad 等 |
| `--emotion-scale` | 情感强度         | [1, 5]                 |
| `--format`        | 输出格式         | mp3 / pcm / ogg_opus   |
| `--sample-rate`   | 采样率           | 8000 ~ 48000           |
| `--bit-rate`      | 比特率（仅 MP3） | 如 128000              |
| `--lang`          | 语种             | zh-cn / en / ja 等     |
| `--silence`       | 句尾静音（ms）   | [0, 30000]             |

---

### Requirement: API 错误处理

系统 SHALL 在 API 返回错误时给出清晰提示，使用 `APIError` 类封装错误信息。

#### Scenario: 鉴权失败

- GIVEN API 凭证错误
- WHEN 系统发起请求
- THEN 创建 `APIError`，类型为 `"auth"`
- AND 使用 `log.error` 显示错误信息，包含错误码
- AND 显示建议：`请检查配置文件中的 app_id 和 token`
- AND 不写入任何文件

#### Scenario: API 返回业务错误码

- GIVEN API 返回非 0 且非 20000000 的错误码
- WHEN 系统接收到该 chunk
- THEN 创建 `APIError`，包含错误码和消息
- AND 根据错误码确定错误类型
- AND 使用 `log.error` 显示格式化错误：`API 错误 <code>: <message>`
- AND 进程以退出码 1 退出

#### Scenario: 配额超限错误

- GIVEN API 返回错误码 45000292
- WHEN 系统接收到该错误
- THEN `APIError.type` 为 `"quota"`
- AND 显示错误：`API 错误 45000292: quota exceeded for types: text_words_lifetime`
- AND 显示额外提示：`配额已用完，请检查火山引擎控制台的配额使用情况`
