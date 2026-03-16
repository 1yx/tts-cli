# config Specification Delta

## MODIFIED Requirements

### Requirement: 三层配置优先级

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

## ADDED Requirements

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
