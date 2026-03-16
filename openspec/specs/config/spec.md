# config Specification

## Purpose

管理 tts-cli 的配置文件生命周期，包括初始化、读取、写入和运行时覆盖。为所有功能模块提供统一的配置入口。

## Requirements

### Requirement: 配置文件路径

系统 SHALL 将配置文件存储于用户本地标准配置目录。

#### Scenario: macOS / Linux 路径

- GIVEN 系统平台为 macOS 或 Linux
- WHEN 系统读取或写入配置
- THEN 使用路径 `~/.config/tts-cli/config.toml`

#### Scenario: Windows 路径

- GIVEN 系统平台为 Windows
- WHEN 系统读取或写入配置
- THEN 使用路径 `%APPDATA%\tts-cli\config.toml`

---

### Requirement: 配置文件格式

系统 SHALL 使用 TOML 格式存储配置文件。

#### Scenario: 配置文件结构

- GIVEN 配置文件存在
- WHEN 系统读取配置
- THEN 文件包含 `[api]`、`[tts]` 两个 section
- AND 文件支持注释，人类可读可编辑

---

### Requirement: 四层配置优先级

系统 SHALL 按照固定优先级合并配置，高优先级覆盖低优先级。

优先级从低到高：默认值 < 配置文件 < 环境变量 < CLI 参数

#### Scenario: CLI 参数覆盖环境变量

- GIVEN 配置文件中 `app_id = "app1"`
- AND 环境变量 `TTS_CLI_APP_ID = "app2"`
- WHEN 用户运行 `tts-cli input.md --appId app3`
- THEN 本次请求使用 `app_id = "app3"`
- AND 配置文件和环境变量不被修改

#### Scenario: 环境变量覆盖配置文件

- GIVEN 配置文件中 `app_id = "app1"`
- AND 环境变量 `TTS_CLI_APP_ID = "app2"`
- WHEN 用户运行 `tts-cli input.md`（不传 `--appId`）
- THEN 本次请求使用 `app_id = "app2"`
- AND 配置文件不被修改

#### Scenario: CLI 参数未传时保留环境变量或配置文件值

- GIVEN 环境变量 `TTS_CLI_APP_ID = "app2"`
- AND 配置文件中 `speed = 50`
- WHEN 用户运行 `tts-cli input.md`（不传 `--appId` 或 `--speed`）
- THEN 本次请求使用 `app_id = "app2"` 和 `speed = 50`

#### Scenario: 配置文件缺失字段时使用默认值

- GIVEN 配置文件中未包含 `model` 字段
- AND 环境变量中未设置 `TTS_CLI_MODEL`
- WHEN 系统加载配置
- THEN `model` 使用默认值 `seed-tts-1.1`

#### Scenario: 空环境变量被视为未设置

- GIVEN 配置文件中 `app_id = "app1"`
- AND 环境变量 `TTS_CLI_APP_ID = ""` (空字符串)
- WHEN 系统加载配置
- THEN `app_id` 使用配置文件值 `"app1"`
- AND 不使用空环境变量值

#### Scenario: 部分覆盖凭证

- GIVEN 配置文件中 `app_id = "app1"`, `token = "token1"`
- AND 环境变量 `TTS_CLI_APP_ID = "app2"` (未设置 TTS_CLI_TOKEN)
- WHEN 用户运行 `tts-cli input.md`
- THEN 本次请求使用 `app_id = "app2"`, `token = "token1"`

---

### Requirement: 环境变量配置

系统 SHALL 支持通过环境变量配置 API 凭证。

#### Scenario: 环境变量设置 app_id

- GIVEN 环境变量 `TTS_CLI_APP_ID` 已设置
- WHEN 系统加载配置
- THEN `config.api.app_id` 使用环境变量值
- AND 优先级低于 CLI 参数，高于配置文件

#### Scenario: 环境变量设置 token

- GIVEN 环境变量 `TTS_CLI_TOKEN` 已设置
- WHEN 系统加载配置
- THEN `config.api.token` 使用环境变量值
- AND 优先级低于 CLI 参数，高于配置文件

#### Scenario: 环境变量和 CLI 参数同时存在

- GIVEN 环境变量 `TTS_CLI_APP_ID = "env_app"`
- AND 用户运行 `tts-cli input.md --appId cli_app`
- WHEN 系统加载配置
- THEN `config.api.app_id` 使用 CLI 参数值 `"cli_app"`
- AND 环境变量被忽略

#### Scenario: 空环境变量不影响配置

- GIVEN 环境变量 `TTS_CLI_APP_ID = ""` 或未设置
- AND 配置文件中 `app_id = "config_app"`
- WHEN 系统加载配置
- THEN `config.api.app_id` 使用配置文件值 `"config_app"`

---

### Requirement: 首次运行交互式引导

系统 SHALL 在配置文件不存在时自动触发交互式引导，收集凭证后暂存于内存，只有命令执行成功后才保存配置。

#### Scenario: 首次运行

- GIVEN 配置文件不存在
- WHEN 用户运行任意 tts-cli 命令
- THEN 系统先检测环境依赖（见 env-check spec）
- AND 引导用户填写 `app_id`、`token`
- AND 引导完成后将凭证暂存于内存（不写入配置文件）
- AND 使用内存凭证执行原始命令
- AND 命令执行成功后将凭证保存到配置文件

#### Scenario: 首次运行 API 失败

- GIVEN 配置文件不存在
- WHEN 用户运行任意 tts-cli 命令
- AND 引导完成后执行命令失败（如 API 凭证无效）
- THEN 系统不创建配置文件
- AND 显示错误提示，建议用户重试

#### Scenario: 用户中途取消引导

- GIVEN 引导正在进行
- WHEN 用户按 Ctrl+C
- THEN 进程优雅退出
- AND 不写入任何残留配置文件

---

### Requirement: 配置管理子命令

系统 SHALL 提供配置管理子命令，允许用户查看、编辑和重置配置。

#### Scenario: 查看配置

- GIVEN 配置文件存在
- WHEN 用户运行 `tts-cli config`
- THEN 终端打印当前生效的完整配置内容

#### Scenario: 编辑配置

- GIVEN 系统存在可用编辑器（`$EDITOR` / `$VISUAL` / `vi`）
- WHEN 用户运行 `tts-cli config --edit`
- THEN 使用系统默认编辑器打开配置文件

#### Scenario: 重置配置

- GIVEN 配置文件存在
- WHEN 用户运行 `tts-cli config --reset`
- THEN 删除当前配置文件
- AND 重新触发交互式引导流程
