# markdown-filter Specification

## Purpose

根据输入文件的扩展名自动决定是否启用豆包 TTS API 的 Markdown 语法过滤功能，使 Markdown 文档被自然朗读，对用户完全透明。

## Requirements

### Requirement: 根据扩展名自动检测

系统 SHALL 根据输入文件扩展名自动决定是否启用 Markdown 过滤，不需要用户手动传入任何参数。

#### Scenario: .md 文件启用过滤

- GIVEN 输入文件扩展名为 `.md`
- WHEN 系统处理输入文件
- THEN API 请求中 `disable_markdown_filter` 设为 `true`
- AND `**bold**` 被朗读为"bold"而非"星星bold星星"

#### Scenario: .markdown 文件启用过滤

- GIVEN 输入文件扩展名为 `.markdown`
- WHEN 系统处理输入文件
- THEN API 请求中 `disable_markdown_filter` 设为 `true`

#### Scenario: 大写扩展名同样识别

- GIVEN 输入文件扩展名为 `.MD` 或 `.MARKDOWN`
- WHEN 系统处理输入文件
- THEN 与小写扩展名行为一致，启用过滤

#### Scenario: 非 Markdown 文件不启用过滤

- GIVEN 输入文件扩展名为 `.txt` 或其他非 Markdown 格式
- WHEN 系统处理输入文件
- THEN API 请求中 `disable_markdown_filter` 设为 `false`
- AND 文件内容原样传入 TTS，不做 Markdown 解析

---

### Requirement: 对用户透明，不暴露为参数

系统 SHALL NOT 将 Markdown 过滤开关暴露为 CLI 参数。

#### Scenario: 无 --markdown 参数

- GIVEN 用户运行任意 tts-cli 命令
- WHEN 查看帮助信息
- THEN 不存在 `--markdown` 或 `--no-markdown` 参数
- AND Markdown 过滤完全由文件扩展名自动决定
