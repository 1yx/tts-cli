# Tasks: markdown-auto-detect

## Phase 1: 检测逻辑

- [ ] 1.1 在 `src/markdown.ts` 中实现 `detectMarkdown(filePath)`：提取扩展名并与 `.md` / `.markdown` 比对，返回 `boolean`
- [ ] 1.2 扩展名比对使用 `toLowerCase()` 确保大小写不敏感（`.MD`、`.Markdown` 均识别）

## Phase 2: 集成到 readInputFile

- [ ] 2.1 修改 `readInputFile(filePath)`：调用 `detectMarkdown()`，将结果作为 `disableMarkdownFilter` 一并返回
- [ ] 2.2 确认返回值类型：`{ text: string; disableMarkdownFilter: boolean }`

## Phase 3: 集成到 API payload

- [ ] 3.1 确认 `buildPayload()` 中 `additions.disable_markdown_filter` 正确使用 `disableMarkdownFilter` 值
- [ ] 3.2 确认 `disable_markdown_filter` 未作为 CLI 参数暴露（`cli.ts` 中无此参数）

## Phase 4: 验证

- [ ] 4.1 `.md` 文件：确认请求 payload 中 `disable_markdown_filter: true`，`**bold**` 被读作"bold"
- [ ] 4.2 `.txt` 文件：确认 `disable_markdown_filter: false`，`**bold**` 原样朗读
- [ ] 4.3 `.MD`（大写扩展名）：确认与 `.md` 行为一致
- [ ] 4.4 `.markdown` 扩展名：确认识别为 Markdown

## Phase 5: 测试

- [ ] 5.1 通过 tests.md 创建测试
- [ ] 5.2 完成测试
