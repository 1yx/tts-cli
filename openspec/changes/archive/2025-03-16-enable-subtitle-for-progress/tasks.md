## 1. API 参数修改

- [x] 1.1 在 `src/tts.ts:buildAudioParams()` 中添加 `enable_subtitle: true` 到 audioParams 对象
- [x] 1.2 确认修改后的 audioParams 类型兼容（TypeScript 编译无错误）

## 2. 进度更新逻辑修改

- [x] 2.1 在 `src/tts.ts:updateSentenceProgress()` 开头添加 `words` 数组检查
- [x] 2.2 当 sentence 没有 `words` 或 `words.length === 0` 时提前返回
- [x] 2.3 确认现有的进度计算逻辑保持不变（`processedChars += sentence.text.length`）

## 3. 测试验证

- [x] 3.1 创建包含多个句子的测试文本文件（至少 3 句）
- [x] 3.2 运行 `tts-cli <test-file>` 观察进度条是否显示中间值
- [x] 3.3 验证进度条最终正确达到 100%
- [x] 3.4 确认 MP3 文件正常生成且音频完整
- [x] 3.5 用户手动测试验证通过（观察到进度条平滑更新，而非直接跳到 100%）

## 4. 边界情况验证

- [x] 4.1 测试单句子输入（验证不会退化）
- [x] 4.2 测试超长文本（验证内存和性能无异常）
- [x] 4.3 测试中英文混合文本
- [x] 4.4 运行现有测试套件确保无回归
