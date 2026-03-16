# force-overwrite Specification

## Purpose

提供 `--force` 参数，允许用户强制覆盖已存在的输出文件。

## Requirements

### Requirement: 强制覆盖参数

系统 SHALL 提供 `--force` 参数，当指定时忽略文件存在检查并强制重新生成。

#### Scenario: --force 覆盖已存在文件

- GIVEN 输出文件 `input.mp3` 已存在
- AND 用户运行 `tts-cli input.md --force`
- WHEN 系统执行
- THEN 忽略文件存在检查
- AND 调用 API 重新生成音频
- AND 覆盖已存在的 `input.mp3`
- AND 不显示任何确认提示

#### Scenario: --play --force 重新生成并播放

- GIVEN 输出文件 `input.mp3` 已存在
- AND 用户运行 `tts-cli input.md --play --force`
- WHEN 系统执行
- THEN 忽略文件存在检查
- AND 调用 API 重新生成音频（PCM 边播边存）
- AND 覆盖已存在的 `input.mp3`

#### Scenario: --force --output 指定路径覆盖

- GIVEN 目标路径 `/tmp/output.mp3` 已存在
- AND 用户运行 `tts-cli input.md --force --output /tmp/output.mp3`
- WHEN 系统执行
- THEN 覆盖 `/tmp/output.mp3`

#### Scenario: 无 --force 时文件存在提示退出

- GIVEN 输出文件 `input.mp3` 已存在
- AND 用户运行 `tts-cli input.md`（无 --force）
- WHEN 系统检测到文件存在
- THEN 不调用 API
- AND 显示提示：`✗ Output file already exists: input.mp3`
- AND 显示建议：`Use --play to play the existing file, or --force to regenerate`
- AND 进程退出
