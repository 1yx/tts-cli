# Spec: CLI Interface

## Overview

定义 tts-cli 的命令行接口规范，包括主命令结构、参数定义、首次运行体验和配置管理方式。

## MODIFIED Requirements

### Requirement: 直接主命令

CLI 工具使用直接的主命令结构，不接受子命令。

#### Scenario: 用户运行基本转换命令

- **GIVEN** 用户安装了 tts-cli
- **WHEN** 用户执行 `tts-cli input.md`
- **THEN** 系统开始转换 process
- **AND** 输出文件生成

#### Scenario: 用户使用带选项的命令

- **GIVEN** 用户安装了 tts-cli
- **WHEN** 用户执行 `tts-cli input.md --play --voice zh_female_tianmei`
- **THEN** 系统使用指定音色播放音频
- **AND** 转换成功完成

#### Scenario: 用户尝试使用旧命令语法

- **GIVEN** 用户安装了新版本 tts-cli
- **WHEN** 用户执行 `tts-cli convert input.md`
- **THEN** 系统返回错误提示
- **AND** 错误信息提示使用新的命令语法

---

### Requirement: 无 config 子命令

CLI 工具不提供配置管理的子命令（如 `--edit`、`--reset`）。

#### Scenario: 用户需要查看配置

- **GIVEN** 用户想知道当前配置
- **WHEN** 用户查看 README 或使用文本编辑器
- **THEN** 用户可以打开 `~/.config/tts-cli/config.toml` 查看或编辑

#### Scenario: 用户需要重置配置

- **GIVEN** 用户想重新配置
- **WHEN** 用户删除配置文件或运行文本编辑器
- **THEN** 下次运行时系统自动触发 setup

---

### Requirement: 首次运行简化

首次运行时，系统只询问必需的认证信息（app_id 和 token），其他配置使用默认值。

#### Scenario: 用户首次运行 tts-cli

- **GIVEN** 用户首次运行 tts-cli
- **WHEN** 配置文件不存在
- **THEN** 系统显示欢迎信息和环境检查
- **AND** 系统提示输入 app_id
- **AND** 系统提示输入 token（masked）
- **AND** 系统保存配置到 `~/.config/tts-cli/config.toml`

#### Scenario: 用户选择默认音色

- **GIVEN** 用户首次运行 tts-cli
- **WHEN** setup 完成时
- **THEN** 系统使用默认音色（`en_male_tim_uranus_bigtts`）
- **AND** 用户后续使用 `tts-cli input.md` 时应用该默认值

---

### Requirement: 极简配置文件

配置文件只保存与默认值不同的配置项，默认值不写入文件。

#### Scenario: 保存极简配置

- **GIVEN** 用户完成首次运行 setup
- **WHEN** 系统保存配置
- **THEN** 配置文件只包含 `[api]` 部分的 `app_id` 和 `token`
- **AND** 不包含默认的 tts 配置（voice, speed, volume 等）

#### Scenario: 读取配置时合并默认值

- **GIVEN** 配置文件只包含 `[api]` 部分
- **WHEN** 系统读取配置
- **THEN** 系统将配置文件值与硬编码默认值合并
- **AND** 系统使用合并后的完整配置

#### Scenario: 用户手动添加配置

- **GIVEN** 用户想要设置默认音色
- **WHEN** 用户手动编辑配置文件添加 `[tts]` 部分
- **THEN** 系统在读取时合并用户配置和默认值
- **AND** 用户设置的音色优先于默认值

---

### Requirement: 固定输出格式

系统不提供 `--format` 参数，输出格式由使用场景固定。

#### Scenario: 下载模式固定使用 MP3

- **GIVEN** 用户运行 `tts-cli input.md`
- **WHEN** 系统请求 TTS API
- **THEN** 系统使用 `format: mp3` 参数
- **AND** 输出文件为 MP3 格式

#### Scenario: 播放模式固定使用 PCM

- **GIVEN** 用户运行 `tts-cli input.md --play`
- **WHEN** 系统请求 TTS API
- **THEN** 系统使用 `format: pcm` 参数
- **AND** 音频流式传输到 ffplay

#### Scenario: 播放后保存固定使用 MP3

- **GIVEN** 用户运行 `tts-cli input.md --play --output out.mp3`
- **WHEN** 系统请求 TTS API（使用 PCM）
- **AND** 播放完成后
- **THEN** 系统将 PCM 转码为 MP3 保存

---

### Requirement: 配置文件路径遵循 XDG Config 规范

配置文件路径为 `~/.config/tts-cli/config.toml`（macOS/Linux）或 `%APPDATA%\tts-cli\config.toml`（Windows）。

#### Scenario: 读取配置文件

- **GIVEN** 系统需要读取用户配置
- **WHEN** 系统调用 `CONFIG_PATH`
- **THEN** 系统返回 XDG Config 标准路径

#### Scenario: 错误信息包含配置路径

- **GIVEN** 系统遇到配置相关错误
- **WHEN** 系统显示错误信息
- **THEN** 错误信息包含完整配置文件路径
- **AND** 错误信息建议用户如何修改

---

## Implementation Notes

- 主命令使用 citty 的单一命令定义（而非子命令）
- `src/index.ts` 不再需要子命令注入逻辑
- 配置保存时只保存非空的 api.app_id 和 api.token
- `loadConfig` 继续使用三层合并（DEFAULTS < fileConfig < cliOverrides）
