# tts-convert Specification Delta

## MODIFIED Requirements

### Requirement: API 错误处理

系统 SHALL 在 API 返回错误时给出清晰提示，使用 `APIError` 类封装错误信息。

#### Scenario: 鉴权失败

- **GIVEN** API 凭证错误
- **WHEN** 系统发起请求
- **THEN** 创建 `APIError`，类型为 `"auth"`
- **AND** 使用 `log.error` 显示错误信息，包含错误码
- **AND** 显示建议：`请检查配置文件中的 app_id 和 token`
- **AND** 不写入任何文件

#### Scenario: API 返回业务错误码

- **GIVEN** API 返回非 0 且非 20000000 的错误码
- **WHEN** 系统接收到该 chunk
- **THEN** 创建 `APIError`，包含错误码和消息
- **AND** 根据错误码确定错误类型
- **AND** 使用 `log.error` 显示格式化错误：`API 错误 <code>: <message>`
- **AND** 进程以退出码 1 退出

#### Scenario: 配额超限错误

- **GIVEN** API 返回错误码 45000292
- **WHEN** 系统接收到该错误
- **THEN** `APIError.type` 为 `"quota"`
- **AND** 显示错误：`API 错误 45000292: quota exceeded for types: text_words_lifetime`
- **AND** 显示额外提示：`配额已用完，请检查火山引擎控制台的配额使用情况`
