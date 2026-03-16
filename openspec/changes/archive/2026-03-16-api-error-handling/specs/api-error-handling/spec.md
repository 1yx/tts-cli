# api-error-handling Specification

## Purpose

统一处理豆包 TTS API 的错误响应，通过自定义 `APIError` 类封装错误信息，并在 CLI 中以用户友好的方式显示。

## ADDED Requirements

### Requirement: APIError 类定义

系统 SHALL 提供自定义 `APIError` 类来封装 API 错误信息。

#### Scenario: 创建 APIError 实例

- **WHEN** 系统检测到 API 返回错误响应
- **THEN** 创建 `APIError` 实例，包含错误码、消息和类型
- **AND** `APIError.name` 为 `"APIError"`
- **AND** `APIError` 继承自 `Error`

#### Scenario: APIError 包含错误分类

- **WHEN** 创建 `APIError` 实例
- **THEN** 包含 `type` 字段，值为以下之一：
  - `"auth"`: 鉴权失败（错误码 45000000）
  - `"quota"`: 配额超限（错误码 45000292）
  - `"rate_limit"`: 请求过于频繁（错误码 429）
  - `"unknown"`: 未知错误

---

### Requirement: API 错误响应检测

系统 SHALL 在接收 TTS API 响应时检测错误响应。

#### Scenario: 检测错误响应

- **GIVEN** API 响应体包含 `"code"` 字段
- **AND** `"code"` 不为 0 且不为 20000000
- **WHEN** 系统解析响应
- **THEN** 识别为错误响应
- **AND** 提取错误码和消息

#### Scenario: 正常响应不触发错误

- **GIVEN** API 响应体包含 `"code": 0` 或 `"code": 20000000`
- **WHEN** 系统解析响应
- **THEN** 不创建 `APIError`
- **AND** 继续处理音频流

---

### Requirement: CLI 层错误捕获

系统 SHALL 在 CLI 入口点捕获 `APIError` 并友好显示。

#### Scenario: APIError 友好显示

- **GIVEN** 运行过程中抛出 `APIError`
- **WHEN** 错误传播到 CLI 处理函数
- **THEN** 使用 `@clack/prompts` 的 `log.error` 显示错误消息
- **AND** 不显示堆栈信息
- **AND** 进程以退出码 1 退出

#### Scenario: 非 APIError 正常显示堆栈

- **GIVEN** 运行过程中抛出非 `APIError` 的错误
- **WHEN** 错误传播到 CLI 处理函数
- **THEN** 显示完整的堆栈信息
- **AND** 不特殊处理

---

### Requirement: 错误消息格式

系统 SHALL 以统一的格式显示 API 错误消息。

#### Scenario: 错误消息包含错误码和说明

- **GIVEN** `APIError` 包含错误码 45000292 和消息 "quota exceeded"
- **WHEN** 显示错误
- **THEN** 格式为：`API 错误 45000292: quota exceeded`

#### Scenario: 配额错误显示额外信息

- **GIVEN** `APIError.type` 为 `"quota"`
- **WHEN** 显示错误
- **THEN** 在错误消息后显示建议：`配额已用完，请检查火山引擎控制台`
