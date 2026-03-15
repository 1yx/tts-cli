# Tests: markdown-auto-detect

## 单元测试 `test/unit/markdown.test.ts`

### detectMarkdown()

- [ ] `.md` → `true`
- [ ] `.markdown` → `true`
- [ ] `.MD`（大写）→ `true`
- [ ] `.MARKDOWN`（大写）→ `true`
- [ ] `.txt` → `false`
- [ ] `.text` → `false`
- [ ] 无扩展名（`Makefile`）→ `false`
- [ ] 路径包含目录（`docs/readme.md`）→ `true`，路径中的目录名不影响结果

### readInputFile()

- [ ] `.md` 文件返回 `{ text: <内容>, disableMarkdownFilter: true }`
- [ ] `.txt` 文件返回 `{ text: <内容>, disableMarkdownFilter: false }`
- [ ] 文件不存在时抛出友好错误，不崩溃

---

## 集成测试 `test/integration/markdown-auto-detect.test.ts`

### buildPayload() 中的 disable_markdown_filter

- [ ] 传入 `disableMarkdownFilter: true` 时，payload 中 `additions.disable_markdown_filter` 为 `true`
- [ ] 传入 `disableMarkdownFilter: false` 时，payload 中 `additions.disable_markdown_filter` 为 `false`
- [ ] `disable_markdown_filter` 不作为 CLI 参数存在（验证 `cli.ts` 中无此参数定义）
