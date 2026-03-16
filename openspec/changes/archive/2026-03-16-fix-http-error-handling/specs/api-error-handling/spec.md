# api-error-handling Specification Delta

## MODIFIED Requirements

### Requirement: APIError 包含错误分类

系统 SHALL 根据不同的 API 错误码对错误进行分类。

#### Scenario: 创建 APIError 实例

- **WHEN** 创建 `APIError` 实例
- **THEN** 包含 `type` 字段，值为以下之一：
  - `"auth"`: 鉴权失败（错误码 45000000 或 45000010）
  - `"quota"`: 配额超限（错误码 45000292）
  - `"rate_limit"`: 请求过于频繁（错误码 429）
  - `"unknown"`: 未知错误

---

## ADDED Requirements

### Requirement: HTTP 级别错误处理

系统 SHALL 在 HTTP 请求返回错误状态码时，解析响应体并创建 `APIError`。

#### Scenario: HTTP 401/403 错误解析为 APIError

- **GIVEN** API 返回 HTTP 401 或 403 状态码
- **AND** 响应体包含 JSON: `{"header":{"code":45000010,"message":"load grant: requested grant not found in SaaS storage"}}`
- **WHEN** 系统检测到 `response.ok === false`
- **THEN** 解析响应体 JSON
- **AND** 提取错误码和消息
- **AND** 创建 `APIError`，type 为 `"auth"`
- **AND** 不抛出 generic Error

#### Scenario: HTTP 错误响应体不是 JSON 时回退

- **GIVEN** API 返回 HTTP 4xx 或 5xx 状态码
- **AND** 响应体不是有效的 JSON
- **WHEN** 系统尝试解析错误响应
- **THEN** 抛出包含原始响应文本的 generic Error
- **AND** 不创建 `APIError`

#### Scenario: HTTP 错误响应体缺少 code 字段时回退

- **GIVEN** API 返回 HTTP 4xx 或 5xx 状态码
- **AND** 响应体是 JSON 但不包含 `header.code` 字段
- **WHEN** 系统尝试解析错误响应
- **THEN** 抛出包含原始响应文本的 generic Error
- **AND** 不创建 `APIError`

### Requirement: 错误码 45000010 映射为鉴权错误

系统 SHALL 将错误码 45000010 映射到鉴权错误类型。

#### Scenario: 45000010 错误显示鉴权提示

- **GIVEN** API 返回错误码 45000010
- **WHEN** 系统显示错误
- **THEN** `APIError.type` 为 `"auth"`
- **AND** 显示建议：`请检查配置文件中的 app_id 和 token`
