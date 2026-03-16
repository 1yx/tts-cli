# config Specification Delta

## MODIFIED Requirements

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
