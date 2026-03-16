## Context

**当前实现：**
播放模式下，PCM 音频数据在播放过程中累积在 `audioChunks[]` 数组中，播放结束后一次性通过 ffmpeg 转码为 MP3。

**问题：**
- 长音频（1 小时+）产生大量内存占用（~172 MB/小时）
- `audioChunks[]` 无限制增长
- Ctrl+C 中断时，内存数据全部丢失
- 没有信号处理，ffplay 可能残留

**约束：**
- API 返回流式 PCM，无法预知总大小
- ffplay 需要持续写入 stdin 才能连续播放
- ffmpeg 需要完整 PCM 数据才能转码 MP3
- HTTP 流由 `reader.read()` 主动拉取，数据流入速度不受应用内存影响

## Goals / Non-Goals

**Goals:**
- 限制播放模式的内存占用到恒定低值（~64KB）
- 正确处理 Ctrl+C 中断，清理 ffplay 和临时文件
- 保持音频播放的连续性和质量

**Non-Goals:**
- 优化下载模式的内存占用（MP3 已压缩，问题不严重）
- 断点续传（AI TTS 非确定性，无法保证一致性）
- 实时转码播放（技术风险高）

## Decisions

### 1. 选择 pipe + WriteStream 方案

**选择：** 使用 Node.js 原生 `fs.createWriteStream` 写入临时文件。

**理由：**
- 内存占用更小（O(64KB) vs O(10MB)）
- 代码更简洁（无需手动管理 batchIndex、accumulatedBytes）
- 背压由 Node.js 原生处理（64KB highWaterMark）
- 单文件输出，无需 ffmpeg concat
- 更少的磁盘 I/O 操作（Node.js 自动优化）

**实现：**
```typescript
import { createWriteStream } from 'node:fs';

// 临时文件与目标 MP3 同目录
const tempFile = `${outputPath}.temp.raw`;
const writeStream = createWriteStream(tempFile);

await processStreamLines(reader, async (json) => {
  if (json.data) {
    const chunk = decodeBase64(json.data);
    await Promise.all([
      safeWrite(ffplay.stdin, chunk),
      new Promise((resolve) => {
        if (!writeStream.write(chunk)) {
          writeStream.once('drain', resolve);
        } else {
          resolve(undefined);
        }
      })
    ]);
  }
});

writeStream.end();
await new Promise(resolve => writeStream.on('finish', resolve));

await convertPCMtoMP3(tempFile, outputPath);
```

**替代方案考虑：**
- *分批写入（10MB）*：代码复杂，内存占用更大，需要 concat
- *保持现状*：长音频内存压力大

### 2. SIGINT 信号处理策略

**选择：** 监听 SIGINT/SIGTERM，使用 exit 钩子确保跨平台清理。

**清理优先级：**
1. 停止 HTTP 流读取（通过标志位）
2. 终止 ffplay 进程（SIGTERM 优雅终止，超时后 SIGKILL）
3. 清理临时文件
4. 不保存 MP3（中断 = 放弃）

**Windows 兼容性：**
- Windows 不支持 SIGTERM，必须在 exit 钩子中强制终止
- exit 钩子中使用同步操作（`unlinkSync`）
- 退出码：130 (SIGINT), 143 (SIGTERM)

**理由：**
- 用户主动中断 = 放弃本次生成
- 避免残留进程占用声卡
- 避免残留临时文件占用磁盘
- exit 钩子确保异常退出也能清理

### 3. 不保存中断的音频

**选择：** Ctrl+C 中断时不保存 MP3。

**理由：**
- 临时文件可能不完整
- 用户主动中断 = 放弃结果
- 避免保存损坏的音频文件

**替代方案考虑：**
- *保存部分音频*：可能损坏或不完整，用户困惑
- *提示用户保存*：增加交互复杂度

## Risks / Trade-offs

### 风险 1：临时文件残留

**风险：** 进程崩溃时临时文件未清理。

**缓解：**
- 临时文件与目标 MP3 同目录（`outputPath.temp.raw`）
- SIGINT/SIGTERM/exit 处理中清理
- 可添加启动时清理残留的 `.temp.raw` 文件（可选）

### 风险 3：跨平台信号处理

**风险：** 不同平台的信号行为差异，Windows 不支持 SIGTERM。

**缓解：**
- 使用 Node.js 标准 `process.on('SIGINT')`（跨平台）
- exit 钩子中强制终止 ffplay（Windows 兼容）
- Unix 平台先尝试 SIGTERM，超时后 SIGKILL
- 测试主流平台（macOS, Linux, Windows）

## Migration Plan

**部署步骤：**

1. **Phase 1：信号处理**
   - 添加 SIGINT/SIGTERM 监听
   - 实现 ffplay 清理逻辑
   - 测试 Ctrl+C 行为

2. **Phase 2：pipe + WriteStream**
   - 实现 `safeWrite()` 函数（处理 EPIPE）
   - 使用 `fs.createWriteStream` 写入临时文件
   - 实现临时文件清理

3. **Phase 3：清理优化**
   - 添加启动时清理旧临时文件（可选）
   - 添加内存占用监控（可选）

**回滚策略：**
- Git revert 即可回滚到优化前版本
- 无数据格式变化，无迁移成本

## Open Questions

无。所有技术决策已明确。
