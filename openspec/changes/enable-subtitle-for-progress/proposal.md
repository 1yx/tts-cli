## Why

当前 TTS 转换的进度条直接从 0% 跳到 100%，没有中间进度显示。这是因为 API 默认只返回 1 个包含完整文本的 sentence 事件。需要启用 `enable_subtitle` 参数来获取多个 sentence 事件（每个子句一个），从而实现平滑的进度更新。

## What Changes

- **API 请求参数**：在 `buildAudioParams()` 中添加 `enable_subtitle: true`，默认启用字幕/时间戳返回
- **进度更新逻辑**：修改 `updateSentenceProgress()` 只处理包含 `words` 数组的 sentence 事件，跳过没有 words 的重复 sentence
- **无向后兼容考虑**：这是实现细节的改进，不影响用户可见的功能

## Capabilities

### New Capabilities
- 无新增功能

### Modified Capabilities

此变更不涉及 spec 层面的需求变更，仅修复进度条的实现细节。进度条作为 `tts-convert` 和 `tts-play` 功能的一部分，其行为已在现有 specs 中隐含定义。

## Impact

- **src/tts.ts**: 修改 `buildAudioParams()` 添加 `enable_subtitle: true`；修改 `updateSentenceProgress()` 过滤没有 words 的 sentence
- **依赖**: 豆包 TTS API 的 `enable_subtitle` 功能（TTS 2.0+ 默认支持）
- **用户体验**: 进度条将平滑显示转换进度（如 0% → 42% → 100%），而不是直接跳到 100%
