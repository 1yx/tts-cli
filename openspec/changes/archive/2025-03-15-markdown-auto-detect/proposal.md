# Proposal: markdown-auto-detect

## Why

tts-cli 的主要使用场景是处理 Markdown 文档，但也应该支持纯文本输入。豆包 TTS API 提供了 `disable_markdown_filter` 参数，开启后会自动过滤 Markdown 语法（如 `**bold**` 读作"bold"而非"星星bold星星"）。

这个行为应该根据输入文件的格式自动决定，对用户完全透明，无需手动传参。

## What Changes

- 读取输入文件的扩展名，自动决定是否开启 Markdown 过滤：
  - `.md` / `.markdown` → `disable_markdown_filter: true`（过滤 Markdown 语法）
  - `.txt` 及其他扩展名 → `disable_markdown_filter: false`（当纯文本处理）
- 该逻辑写死在 `src/markdown.ts` 中，不暴露为 CLI 参数

```typescript
const ext = path.extname(inputFile).toLowerCase();
const isMarkdown = ext === '.md' || ext === '.markdown';
const disableMarkdownFilter = isMarkdown;
```

## Impact

- 修改 `src/markdown.ts`：新增 `detectInputFormat(filePath)` 函数，返回 `{ isMarkdown: boolean }`
- 修改 `src/tts.ts`：构造 API 请求时，从 `detectInputFormat()` 读取结果并设置 `disable_markdown_filter`
