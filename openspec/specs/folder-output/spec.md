# folder-output Specification

## Purpose

`--output` 参数支持文件夹路径，当检测到路径是文件夹时，使用输入文件名作为输出文件名。

## Requirements

### Requirement: 文件夹路径支持

系统 SHALL 支持 `--output` 参数指定文件夹路径。

#### Scenario: --output 指定已存在的文件夹

- GIVEN 文件夹 `/tmp/podcasts/` 已存在
- AND 用户运行 `tts-cli input.md --output /tmp/podcasts/`
- WHEN 系统检测到路径是文件夹
- THEN 使用 `fs.stat()` 确认路径类型
- AND 从输入文件推导输出文件名：`input.md` → `input.mp3`
- AND 最终保存路径为：`/tmp/podcasts/input.mp3`

#### Scenario: --output 指定文件路径

- GIVEN 用户运行 `tts-cli input.md --output /tmp/podcast.mp3`
- WHEN 系统检测到路径不是文件夹
- THEN 使用路径作为完整输出路径：`/tmp/podcast.mp3`

#### Scenario: --output 指向不存在的路径

- GIVEN 路径 `/tmp/new-folder/output.mp3` 不存在
- AND 用户运行 `tts-cli input.md --output /tmp/new-folder/output.mp3`
- WHEN 系统处理输出路径
- THEN 尝试创建父目录 `/tmp/new-folder/`
- AND 保存文件到 `/tmp/new-folder/output.mp3`

#### Scenario: 路径检测优先级

- GIVEN 用户传入路径（可能不存在）
- WHEN 系统处理 --output 参数
- THEN 首先尝试 `fs.stat()` 检测路径
- AND 如果路径存在且是目录 → 使用文件夹模式
- AND 如果路径存在且是文件 → 使用文件模式
- AND 如果路径不存在 → 根据路径特征判断（结尾有 `/` 视为文件夹）
