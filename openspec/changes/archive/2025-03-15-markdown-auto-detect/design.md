# Design: markdown-auto-detect

## 技术决策

### 1. 基于文件扩展名判断，不读取文件内容

判断逻辑仅依赖扩展名，不做文件内容嗅探。简单、快速、无副作用。

```typescript
import { extname } from 'path';

export function detectMarkdown(filePath: string): boolean {
  const ext = extname(filePath).toLowerCase();
  return ext === '.md' || ext === '.markdown';
}
```

### 2. 结果直接映射到 API 参数

`detectMarkdown()` 的返回值直接作为 `disable_markdown_filter` 传入 payload：

```typescript
// src/markdown.ts
export function readInputFile(filePath: string): {
  text: string;
  disableMarkdownFilter: boolean;
} {
  const text = readFileSync(filePath, 'utf-8');
  const disableMarkdownFilter = detectMarkdown(filePath);
  return { text, disableMarkdownFilter };
}
```

在 `buildPayload()` 中消费：

```typescript
additions: {
  disable_markdown_filter: disableMarkdownFilter,
  // ...
}
```

### 3. 不暴露为 CLI 参数

此行为对用户完全透明，不添加 `--markdown` 或 `--no-markdown` 参数。文件类型即意图，无需用户干预。

若未来需要支持强制覆盖（如 `.txt` 文件里含有 Markdown 语法），可以在后续 change 中以 `--force-markdown` 参数扩展，但当前版本不实现。

### 4. 支持的扩展名

| 扩展名      | isMarkdown | disable_markdown_filter |
| ----------- | ---------- | ----------------------- |
| `.md`       | `true`     | `true`                  |
| `.markdown` | `true`     | `true`                  |
| `.txt`      | `false`    | `false`                 |
| 其他        | `false`    | `false`                 |

## 文件结构

```
src/
└── markdown.ts   # detectMarkdown(), readInputFile()
```
