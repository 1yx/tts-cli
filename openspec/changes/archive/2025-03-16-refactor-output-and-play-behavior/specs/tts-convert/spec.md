# tts-convert Specification Delta

## MODIFIED Requirements

### Requirement: 基本转换

系统 SHALL 将输入文本文件转换为 MP3 音频文件并保存到本地。

#### Scenario: 默认转换

- GIVEN 用户已完成配置
- AND 输入文件存在
- AND 输出文件不存在
- WHEN 用户运行 `tts-cli input.md`
- THEN 系统调用豆包 TTS API（HTTP Chunked 流式）
- AND 流式接收音频数据
- AND 将完整 MP3 保存至与输入文件同目录的同名 `.mp3` 文件
- AND 打印 `✓ 已保存到 <outputPath>`

#### Scenario: 文件已存在时提示退出

- GIVEN 用户已完成配置
- AND 输入文件存在
- AND 输出文件 `input.mp3` 已存在
- WHEN 用户运行 `tts-cli input.md`
- THEN 系统不调用 API
- AND 显示提示：`✗ Output file already exists: input.mp3`
- AND 显示建议：`Use --play to play the existing file, or --force to regenerate`
- AND 进程以退出码 1 退出

#### Scenario: 自定义输出路径（文件）

- GIVEN 用户运行 `tts-cli input.md --output ./podcast.mp3`
- AND 路径 `./podcast.mp3` 不存在
- WHEN 转换完成
- THEN MP3 文件保存至 `./podcast.mp3`

#### Scenario: 自定义输出路径（文件夹）

- GIVEN 文件夹 `/tmp/podcasts/` 已存在
- AND 用户运行 `tts-cli input.md --output /tmp/podcasts/`
- WHEN 转换完成
- THEN MP3 文件保存至 `/tmp/podcasts/input.mp3`

#### Scenario: 输入文件不存在

- GIVEN 指定的输入文件不存在
- WHEN 用户运行 tts-cli
- THEN 系统打印友好错误提示
- AND 进程退出，不发起 API 请求
