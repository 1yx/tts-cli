# tts-play Specification Delta

## ADDED Requirements

### Requirement: API 错误处理

系统 SHALL 在 `--play` 模式下处理 API 错误，使用 `APIError` 类封装错误信息并友好显示。

#### Scenario: 播放模式 API 错误

- **GIVEN** 用户运行 `tts-cli input.md --play`
- **AND** API 返回错误响应
- **WHEN** 系统检测到错误
- **THEN** 创建 `APIError`，包含错误码和消息
- **AND** 不启动 ffplay 进程
- **AND** 使用 `log.error` 显示格式化错误：`API 错误 <code>: <message>`
- **AND** 进程以退出码 1 退出

#### Scenario: 配额超限错误

- **GIVEN** 用户运行 `--play` 模式
- **AND** API 返回错误码 45000292
- **WHEN** 系统接收到该错误
- **THEN** `APIError.type` 为 `"quota"`
- **AND** 显示错误：`API 错误 45000292: quota exceeded for types: text_words_lifetime`
- **AND** 显示额外提示：`配额已用完，请检查火山引擎控制台的配额使用情况`
- **AND** 不启动 ffplay 播放

#### Scenario: 鉴权失败

- **GIVEN** API 凭证错误
- **WHEN** 用户运行 `--play` 模式
- **THEN** `APIError.type` 为 `"auth"`
- **AND** 显示错误：`API 错误 45000000: <具体消息>`
- **AND** 显示建议：`请检查配置文件中的 app_id 和 token`
