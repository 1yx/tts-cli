## 1. CLI 参数添加

- [x] 1.1 在 `src/index.ts` 的 `mainCommand` args 中添加 `subtitle` 参数（boolean 类型）
- [x] 1.2 在 `TTSOptions` 类型中添加 `subtitle?: boolean` 字段
- [x] 1.3 验证 TypeScript 编译无错误

## 2. 字幕流式写入工具函数

- [x] 2.1 在 `src/tts.ts` 中创建 `openSubtitleWriter(outputPath: string)` 函数，打开文件写入器并写入 `[`
- [x] 2.2 创建 `writeSubtitleSentence(writer, sentence)` 函数，处理逗号分隔符并写入句子
- [x] 2.3 创建 `closeSubtitleWriter(writer)` 函数，写入 `\n]` 并关闭文件
- [x] 2.4 确认生成的 JSON 格式正确（括号、逗号、换行）

## 3. 下载模式集成

- [x] 3.1 在 `runDownloadMode()` 中添加字幕文件路径推导逻辑（`outputPath.replace('.mp3', '.subtitle.json')`）
- [x] 3.2 添加文件存在检查（`!checkFileExists(subtitlePath) || args.force`）
- [x] 3.3 在 `processStreamLines()` 的 handler 中添加句子累积逻辑
- [x] 3.4 在流结束后调用字幕写入函数
- [x] 3.5 添加成功日志输出（`log.success(\`Subtitles saved to ${path}\`)`）

## 4. 播放模式集成

- [x] 4.1 在 `runPlayMode()` 中添加与下载模式相同的字幕文件路径推导和检查逻辑
- [x] 4.2 在 `streamWithFfplay()` 的 `processStreamLines()` handler 中添加句子累积
- [x] 4.3 在播放结束后保存字幕文件
- [x] 4.4 确认播放模式不会因字幕生成失败而中断（字幕写入失败不会中断播放）

## 5. 测试验证

- [x] 5.1 创建包含多个句子的测试文本文件
- [x] 5.2 运行 `tts-cli <test-file> --subtitle` 验证字幕文件生成
- [x] 5.3 运行 `tts-cli <test-file> --play --subtitle` 验证播放模式下字幕生成
- [x] 5.4 验证生成的 JSON 文件格式正确（可被 `JSON.parse()` 解析）
- [x] 5.5 验证 `--force` 行为：文件存在时无 `--force` 跳过，有 `--force` 覆盖
- [x] 5.6 验证本地 MP3 播放时不生成字幕（跟随现有逻辑）
- [x] 5.7 使用长文本测试内存占用（确保流式写入有效，流式写入实现）

## 6. 类型定义和文档

- [x] 6.1 在 `src/tts.ts` 中添加字幕写入相关的类型定义（SubtitleWriter 类型已添加）
- [x] 6.2 更新 CLI 帮助文档（`--subtitle` 参数的 description 已在 index.ts 中定义）
