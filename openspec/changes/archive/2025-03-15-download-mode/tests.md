# Tests: download-mode

## 单元测试 `test/unit/tts.test.ts`

### buildHeaders()
- [ ] 返回包含 `X-Api-App-Id`、`X-Api-Access-Key`、`X-Api-Resource-Id` 的对象
- [ ] 值来自 config，不硬编码

### buildPayload()
- [ ] `text` 正确映射到 `req_params.text`
- [ ] `speaker` 使用 CLI override，无 override 时使用 config 值
- [ ] `disable_markdown_filter` 根据传入值正确设置
- [ ] `emotion` 字段：有值时存在于 payload，无值时不出现（不传 `undefined`）
- [ ] `silence_duration` 默认为 0
- [ ] `explicit_language` 正确传入

### parseChunks()
- [ ] 单个完整 JSON 行正确解析为对象数组
- [ ] 跨 chunk 的不完整 JSON 行正确缓冲拼接后解析
- [ ] 空行被跳过，不抛出错误
- [ ] 非 JSON 内容抛出可识别的错误

---

## 单元测试 `test/unit/markdown.test.ts`

### resolveOutputPath()
- [ ] 无 `--output` 时，`input/foo.md` → `input/foo.mp3`
- [ ] 有 `--output ./bar.mp3` 时，直接返回 `./bar.mp3`
- [ ] 输入为绝对路径时，输出也为绝对路径同目录

---

## 集成测试 `test/integration/download-mode.test.ts`

### 完整下载流程（mock fetch）

构造模拟的流式响应，包含：
- 两个音频 chunk（base64 编码的随机字节）
- 一个 sentence chunk（`{ sentence: { text: '你好' } }`）
- 结束 chunk（`{ code: 20000000 }`）

测试用例：
- [ ] 所有音频 chunk 正确拼接并写入输出文件
- [ ] 进度条在收到 sentence chunk 后更新字符数
- [ ] 收到结束 chunk 后进度条推至 100% 并停止
- [ ] 输出文件路径与 `resolveOutputPath()` 结果一致
- [ ] API 返回非 0 错误码时抛出包含 message 的错误，不写入文件

### 文件系统
- [ ] 输出目录不存在时自动创建
- [ ] 输出文件已存在时正确覆盖

---

## E2E 测试 `test/e2e/download.test.ts`

> 需要环境变量 `MYTTS_APP_ID` 和 `MYTTS_TOKEN`，CI 通过 secret 注入，本地手动运行。

- [ ] 转换短文本（`你好，世界`），验证生成的 `.mp3` 文件存在且大小 > 0
- [ ] 转换一个真实 `.md` 文件，验证 MP3 可被 ffplay 识别为有效音频
- [ ] `--voice` 参数切换音色，验证请求 payload 中 speaker 字段正确
- [ ] API 凭证错误时，CLI 输出清晰的鉴权失败提示
