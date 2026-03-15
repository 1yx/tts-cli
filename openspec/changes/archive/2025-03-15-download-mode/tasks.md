# Tasks: download-mode

## Phase 1: 输入文件处理

- [x] 1.1 创建 `src/markdown.ts`
- [x] 1.2 实现 `readInputFile(filePath)`：读取文件内容，返回 `{ text, disableMarkdownFilter }`
- [x] 1.3 实现 `resolveOutputPath(inputPath, outputOption?)`：推导输出路径（同目录同名 `.mp3`）
- [x] 1.4 文件不存在时给出友好错误提示并退出

## Phase 2: API 请求构造

- [x] 2.1 创建 `src/tts.ts`，定义 `TTSOptions` interface
- [x] 2.2 实现 `buildHeaders(config)`：构造鉴权 Header
- [x] 2.3 实现 `buildPayload(text, config, options)`：构造完整请求 Body，所有可选参数有无均正确处理
- [x] 2.4 实现 `fetchTTS(text, config, options)`：发起 fetch 请求，返回 `Response`，非 200 时抛出错误

## Phase 3: 流式响应解析

- [x] 3.1 实现 `parseChunks(value: Uint8Array)`：含缓冲拼接逻辑，按换行分割后逐行 JSON.parse
- [x] 3.2 处理三种 chunk 类型：音频数据块（`json.data`）、文本进度块（`json.sentence`）、结束标志（`code === 20000000`）
- [x] 3.3 API 返回错误码（非 0 非 20000000）时抛出带 message 的错误

## Phase 4: 进度条

- [x] 4.1 实现 `createProgressBar(totalChars)`：初始化 `cli-progress` SingleBar，格式含字符进度和已接收 KB
- [x] 4.2 实现 `updateProgress(bar, json, ctx)`：根据 chunk 类型更新进度条状态
- [x] 4.3 收到结束标志时将进度条推至 100% 并 stop

## Phase 5: 下载模式主流程

- [x] 5.1 实现 `runDownloadMode(inputPath, config, args)`
- [x] 5.2 调用 `readInputFile()` 读取文本和 markdown 标志
- [x] 5.3 启动进度条，循环读取流式响应，累积音频 buffer
- [x] 5.4 流结束后将所有 chunk 拼接并写入输出文件（`Bun.write()`）
- [x] 5.5 打印完成提示：`✓ 已保存到 <outputPath>`

## Phase 6: CLI 定义

- [x] 6.1 创建 `src/cli.ts`，使用 `citty` 定义主命令
- [x] 6.2 声明所有参数：`input`（positional）、`--output`、`--voice`、`--resource-id`、`--speed`、`--volume`、`--emotion`、`--emotion-scale`、`--format`、`--sample-rate`、`--bit-rate`、`--lang`、`--silence`
- [x] 6.3 修改 `src/index.ts`：加载配置，合并 CLI 参数，调用 `runDownloadMode()`

## Phase 7: 验证

- [x] 7.1 使用真实 API 凭证，转换一个 `.md` 文件，验证 MP3 正常生成
- [x] 7.2 验证进度条字符数和百分比随合成推进正确更新（通过集成测试验证）
- [x] 7.3 验证 `--output` 自定义路径正确写入（通过单元测试验证）
- [x] 7.4 验证 API 返回错误时有清晰的错误信息（通过集成测试验证）
- [x] 7.5 验证所有 CLI 参数均能正确覆盖配置文件值（通过单元测试验证）

## Phase 8: 测试

- [x] 8.1 通过 tests.md 创建测试
- [x] 8.2 完成测试

## Phase 9: CLI 参数扩展 - resource-id

- [x] 9.1 在 src/cli.ts 添加 --resource-id 参数定义
- [x] 9.2 更新 src/tts.ts 的 TTSOptions 接口包含 resourceId?: string
- [x] 9.3 修改 buildHeaders() 支持 CLI override 的 resource_id
- [x] 9.4 更新 src/commands/convert.ts 传递 resourceId 到 TTS 函数
- [x] 9.5 验证 --resource-id 参数正确覆盖配置文件值

## Phase 10: 移除 model 参数

- [x] 10.1 从 src/cli.ts 移除 --model 参数
- [x] 10.2 从 src/tts.ts 的 TTSOptions 接口移除 model 字段
- [x] 10.3 从 buildPayload() 移除 model 处理逻辑
- [x] 10.4 从 src/commands/convert.ts 移除 model 字段
- [x] 10.5 从 src/config.ts 的 Config 接口移除 model 字段

## Phase 11: 手动调试 - seed-tts-1.0

- [x] 11.1 创建测试文本 test/fixtures/test-seed-tts-1.0.md
- [x] 11.2 使用 resource_id=seed-tts-1.0 测试中文 TTS
- [x] 11.3 使用 resource_id=seed-tts-1.0 测试英文 TTS
- [x] 11.4 验证 API 响应正常，MP3 文件正确生成
- [x] 11.5 记录 seed-tts-1.0 与音色的兼容性

**记录：**
- 兼容音色格式：*_mars_bigtts, *_moon_bigtts
- 中文测试：zh_female_vv_mars_bigtts (Vivi) ✓
- 英文测试：en_female_lauren_moon_bigtts (Lauren) ✓
- 音色名称不匹配时会返回空文件（无错误提示）

## Phase 12: 手动调试 - seed-tts-2.0

- [x] 12.1 使用默认 resource_id=seed-tts-2.0 测试中文 TTS
- [x] 12.2 使用 resource_id=seed-tts-2.0 测试英文 TTS
- [x] 12.3 验证 API 响应正常，MP3 文件正确生成
- [x] 12.4 记录 seed-tts-2.0 与音色的兼容性

**记录：**
- 兼容音色格式：*_uranus_bigtts, *_saturn_bigtts, *_jupiter_bigtts
- 中文测试：zh_female_vv_uranus_bigtts (Vivi 2.0) ✓
- 英文测试：en_male_tim_uranus_bigtts (Tim) ✓
- 默认 resource_id，支持大多数现代音色

## Phase 13: 文档更新

- [x] 12.1 更新 CLAUDE.md 说明不同 resource_id 的用途
- [x] 12.2 移除 model 参数相关说明
- [x] 12.3 更新 README.md 的 CLI 参数列表
- [x] 12.4 更新配置文件示例移除 model 字段
