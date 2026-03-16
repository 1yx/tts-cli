## Context

当前 tts-cli 的 API 错误处理通过普通 `Error` 对象抛出，在 CLI 中显示为完整的堆栈信息。例如当配额超限时，用户看到的是：

```
error: TTS API error 45000292: quota exceeded for types: text_words_lifetime
    at checkAPIErrorResponse (/$bunfs/root/tts-cli:3562:13)
    at async runPlayMode (/$bunfs/root/tts-cli:3597:45)
    ...
```

这种技术细节对普通用户没有价值，而且堆栈信息会干扰阅读。`@clack/prompts` 提供了更好的日志 API（`log.error`, `log.warn`），应该用于用户可见的错误。

## Goals / Non-Goals

**Goals:**
- 创建统一的 `APIError` 类来封装 API 错误信息
- 在 CLI 层面识别 `APIError` 并使用友好的格式显示
- 保持其他错误的堆栈信息（便于调试）
- 使错误信息本地化友好（为将来的 i18n 打基础）

**Non-Goals:**
- 不修改 API 请求逻辑
- 不改变错误处理流程，只改进显示方式
- 不实现完整的 i18n（现在只支持中文错误信息）

## Decisions

### 1. APIError 类设计

使用 TypeScript 自定义错误类，继承 `Error` 并添加 API 特定字段：

```typescript
class APIError extends Error {
  constructor(
    public code: number,
    public message: string,
    public type: 'quota' | 'auth' | 'rate_limit' | 'unknown'
  ) {
    super(`API error ${code}: ${message}`);
    this.name = 'APIError';
  }
}
```

**决策依据：**
- `code` 和 `message` 直接来自 API 响应
- `type` 用于分类错误，便于提供针对性的建议
- 继承 `Error` 保证 `instanceof Error` 检查仍然有效

### 2. 错误类型映射

基于常见 API 错误码进行分类：

| 错误码范围 | Type | 中文说明 |
|-----------|------|---------|
| 45000000 | auth | 鉴权失败 |
| 45000292 | quota | 配额超限 |
| 429 | rate_limit | 请求过于频繁 |
| 其他 | unknown | 未知错误 |

**决策依据：**
- 有限的分类覆盖大部分场景
- 便于后续扩展针对性的用户指导
- 类型名称使用英文，便于代码维护

### 3. CLI 层错误捕获

在 `runConvert` 和 `runPlayMode` 函数中使用 try-catch 捕获 `APIError`：

```typescript
try {
  await runDownloadMode(...);
} catch (err) {
  if (err instanceof APIError) {
    log.error(err.message);
    log.info(getSuggestion(err.type));
    process.exit(1);
  }
  throw err; // 其他错误继续抛出
}
```

**决策依据：**
- 在命令处理函数中捕获，不在 index.ts 中集中处理
- 保持现有的错误处理流程不变
- 其他类型的错误仍然正常抛出堆栈

### 4. 错误文件位置

创建新文件 `src/errors.ts` 存放 `APIError` 类和相关工具函数。

**决策依据：**
- 集中管理错误类型
- 避免 tts.ts 文件过长
- 便于其他模块复用

## Risks / Trade-offs

### Risk 1: API 错误码更新

**风险：** 豆包 API 可能增加新的错误码，导致分类不准确。

**缓解措施：** 使用 `unknown` 作为兜底类型，未知错误码不会导致崩溃。

### Risk 2: 错误信息重复

**风险：** `APIError` 的 `message` 和 `Error` 的 `message` 可能重复。

**缓解措施：** 只在 CLI 显示时格式化，构造函数中保持简单。

### Trade-off: 类型映射复杂度

**选择：** 简单的 if-else 映射 vs 完整的错误码注册表。

**决策：** 使用 if-else，当前错误码数量有限，过度设计增加维护成本。

## Migration Plan

1. **创建 `src/errors.ts`**：定义 `APIError` 类和错误分类函数
2. **修改 `src/tts.ts`**：`checkAPIErrorResponse` 抛出 `APIError`
3. **修改 `src/commands/convert.ts`**：添加 `APIError` 捕获和友好显示
4. **测试验证**：确认配额超限等错误正确显示

**回滚策略：** 保留原有的 `Error` 抛出逻辑作为注释，可快速回滚。

## Open Questions

1. 是否需要为不同类型的错误提供可操作的建议？（如"配额超限，请联系客服"）
   - **倾向：** 先实现基础分类，后续迭代添加建议

2. 是否需要支持错误信息本地化？
   - **倾向：** 暂不支持，等有英文用户需求后再实现
