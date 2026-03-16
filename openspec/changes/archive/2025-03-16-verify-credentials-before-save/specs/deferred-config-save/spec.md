# deferred-config-save Specification

## Purpose

首次运行时，系统 SHALL 将凭证保存延迟到 API 验证成功之后，确保只有有效的凭证才会被持久化到配置文件。

## Requirements

### Requirement: 延迟保存配置

系统 SHALL 在首次运行时将凭证暂存于内存，只有命令执行成功后才将凭证写入配置文件。

#### Scenario: 首次运行成功后保存配置

- GIVEN 配置文件不存在
- AND 用户运行 `tts-cli input.md`
- AND 系统收集凭证（交互式 / CLI 参数 / 环境变量）
- AND API 调用成功
- WHEN 命令执行完成
- THEN 系统将凭证保存到配置文件
- AND 显示成功提示：`✓ Credentials saved to <config_path>`

#### Scenario: 首次运行 API 失败不保存配置

- GIVEN 配置文件不存在
- AND 用户运行 `tts-cli input.md`
- AND 系统收集凭证（交互式 / CLI 参数 / 环境变量）
- AND API 调用失败（凭证无效）
- WHEN 命令执行抛出错误
- THEN 系统不创建配置文件
- AND 显示 API 错误信息
- AND 提示用户配置未保存，请重试

#### Scenario: CLI 参数路径的延迟保存

- GIVEN 配置文件不存在
- AND 用户运行 `tts-cli input.md --app-id xxx --token yyy`
- AND API 调用成功
- WHEN 命令执行完成
- THEN 系统将 CLI 参数中的凭证保存到配置文件

#### Scenario: 环境变量路径的延迟保存

- GIVEN 配置文件不存在
- AND 环境变量 `TTS_CLI_APP_ID` 和 `TTS_CLI_TOKEN` 已设置
- AND 用户运行 `tts-cli input.md`
- AND API 调用成功
- WHEN 命令执行完成
- THEN 系统将环境变量中的凭证保存到配置文件

#### Scenario: 已有配置文件时不触发延迟保存

- GIVEN 配置文件已存在
- WHEN 用户运行任意命令
- THEN 系统使用现有配置文件
- AND 不执行延迟保存逻辑

---

### Requirement: 内存凭证优先级

系统 SHALL 在首次运行时将内存凭证的优先级设置为最高，覆盖其他所有来源。

#### Scenario: 内存凭证覆盖默认值

- GIVEN 配置文件不存在
- AND 用户在首次运行时提供凭证
- WHEN 系统加载配置
- THEN 使用用户提供的凭证（而非默认值）

---

### Requirement: 错误提示清晰性

系统 SHALL 在首次运行失败时提供清晰的错误提示，帮助用户理解问题和解决方法。

#### Scenario: API 凭证无效的错误提示

- GIVEN 首次运行，凭证无效
- WHEN API 返回认证错误
- THEN 显示错误：`API 错误 <code>: <message>`
- AND 显示当前使用的凭证（脱敏 token）
- AND 明确提示：配置未保存，请修正后重试

#### Scenario: 非 API 错误不阻止保存

- GIVEN 首次运行，凭证有效
- WHEN 命令因其他原因失败（如文件权限）
- THEN 配置文件已保存
- AND 显示具体错误信息
