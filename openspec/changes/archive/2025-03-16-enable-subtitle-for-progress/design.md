## Context

当前 tts-cli 的进度条显示功能存在缺陷：用户在运行 TTS 转换时，进度条直接从 0% 跳到 100%，无法看到转换进度的平滑变化。

通过测试和 API 文档分析发现，豆包 TTS API 在默认情况下（未启用 `enable_subtitle`）只返回 1 个 sentence 事件，该事件包含完整输入文本。因此进度条只能在整个转换完成时更新一次。

启用 `enable_subtitle: true` 后，API 会返回多个 sentence 事件（每个子句一个），每个事件包含 `words` 数组（时间戳信息）。但测试发现 API 也会返回一些"重复"的 sentence（包含完整文本但没有 `words` 数组），需要过滤处理。

## Goals / Non-Goals

**Goals:**
- 实现平滑的进度条显示，能够反映每个子句的转换进度
- 默认启用 `enable_subtitle` 以支持进度条功能
- 正确处理 API 返回的重复 sentence 事件

**Non-Goals:**
- 不涉及字幕文件下载功能（未来可能有独立功能）
- 不涉及 CLI 参数配置（默认行为）
- 不涉及其他进度显示方式（如详细模式）

## Decisions

### 1. 启用 `enable_subtitle` 参数

**决策**: 在 `buildAudioParams()` 函数中默认添加 `enable_subtitle: true`

**理由**:
- 这是实现平滑进度条的前提条件
- API 文档显示 TTS 2.0+ 支持此参数
- 未来可能有独立的字幕下载功能，但进度条需求是独立的

**代码位置**: `src/tts.ts:buildAudioParams()`

### 2. 过滤无 `words` 的 sentence 事件

**决策**: 在 `updateSentenceProgress()` 中只处理包含 `words` 数组的 sentence

**理由**:
- 测试发现 API 会返回一些"重复"的 sentence（完整文本但无 `words`）
- 有 `words` 的 sentence 代表实际完成的一个子句
- 简单且可靠的过滤方法

**代码位置**: `src/tts.ts:updateSentenceProgress()`

**伪代码**:
```typescript
function updateSentenceProgress(json, ctx, bar) {
  if (!json.sentence?.text) return;

  // 只处理有 words 数组的 sentence
  if (!json.sentence.words || json.sentence.words.length === 0) {
    return;
  }

  ctx.processedChars += json.sentence.text.length;
  // ... update progress bar
}
```

## Risks / Trade-offs

### Risk: API 行为变化

**风险**: 豆包 TTS API 可能改变 `enable_subtitle` 的行为或 sentence 返回格式

**缓解**:
- 过滤逻辑基于 `words` 数组存在性，相对稳定
- 如果 API 变化导致无 `words`，进度条会退化为当前行为（0% → 100%），不会破坏功能

### Trade-off: 额外的 API 处理开销

**权衡**: 启用 `enable_subtitle` 可能增加 API 端的处理时间和返回数据量

**评估**:
- 根据文档，字幕识别是异步的，不会阻塞音频合成
- `words` 数组的数据量相对较小（主要是时间戳）
- 用户价值（平滑进度）远大于微小开销

## Open Questions

无
