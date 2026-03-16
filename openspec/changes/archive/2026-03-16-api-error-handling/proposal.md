## Why

当前 TTS API 错误（如配额超限 `45000292`）通过普通 `Error` 抛出，在 CLI 中显示为堆栈信息，用户体验不佳。需要统一的错误类来处理 API 错误，并提供友好的错误信息。

## What Changes

- 创建 `APIError` 自定义错误类，包含错误码、消息、类型等信息
- 修改 `tts.ts` 中的 `checkAPIErrorResponse` 函数，抛出 `APIError` 而不是普通 `Error`
- 在 CLI 入口点（`index.ts` 或命令处理函数）中捕获 `APIError` 并使用 `@clack/prompts` 友好显示
- 保持向后兼容：其他类型的错误仍然正常显示堆栈信息

## Capabilities

### New Capabilities
- `api-error-handling`: 统一的 API 错误处理和用户友好的错误显示

### Modified Capabilities
- `tts-convert`: 下载模式需要处理 `APIError`
- `tts-play`: 播放模式需要处理 `APIError`

## Impact

- **src/errors.ts** (新文件): 定义 `APIError` 类
- **src/tts.ts**: 修改 `checkAPIErrorResponse` 函数抛出 `APIError`
- **src/index.ts** 或 **src/commands/convert.ts**: 添加 `APIError` 捕获和格式化显示
- **src/utils.ts**: 可能导出 `APIError` 供其他模块使用
