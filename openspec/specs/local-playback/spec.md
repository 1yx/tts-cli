# local-playback Specification

## Purpose

当目标 MP3 文件已存在且用户指定 `--play` 时，直接播放本地文件而不是重新生成。

## Requirements

### Requirement: 本地 MP3 播放

系统 SHALL 在 `--play` 模式下检测输出文件是否存在，若存在则直接播放。

#### Scenario: --play 播放已存在的本地 MP3

- GIVEN 输出文件 `input.mp3` 已存在
- AND 用户运行 `tts-cli input.md --play`
- WHEN 系统检测到文件存在
- THEN 不调用 API
- AND 使用 ffplay 直接播放 `input.mp3`
- AND 播放命令为：`ffplay -nodisp -autoexit input.mp3`
- AND 不显示进度条
- AND 播放结束后正常退出

#### Scenario: --play --output 播放指定路径的已存在文件

- GIVEN 目标文件 `/tmp/podcast.mp3` 已存在
- AND 用户运行 `tts-cli input.md --play --output /tmp/podcast.mp3`
- WHEN 系统检测到文件存在
- THEN 使用 ffplay 直接播放 `/tmp/podcast.mp3`

#### Scenario: --play --force 不播放本地文件

- GIVEN 输出文件 `input.mp3` 已存在
- AND 用户运行 `tts-cli input.md --play --force`
- WHEN 系统检测到 --force 参数
- THEN 不播放本地文件
- AND 调用 API 重新生成音频

#### Scenario: 本地播放失败时友好提示

- GIVEN 输出文件 `input.mp3` 已存在
- AND 用户运行 `tts-cli input.md --play`
- WHEN ffplay 播放失败
- THEN 显示错误提示
- AND 建议检查文件是否损坏
