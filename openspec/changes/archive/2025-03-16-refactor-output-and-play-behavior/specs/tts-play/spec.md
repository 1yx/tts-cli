# tts-play Specification Delta

## REMOVED Requirements

### Requirement: 只播不存模式

**Reason**: 简化参数语义，`--play` 仅控制是否播放，所有模式都会保存 MP3

**Migration**: 用户若需要"只播放不保存"，可以使用播放本地文件的音频播放器

---

## MODIFIED Requirements

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
