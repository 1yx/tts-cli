## Why

当前 `--play` 模式采用 PCM 边播边存的实现方式：所有 PCM 音频数据在播放过程中累积在内存中，播放结束后才通过 ffmpeg 转码为 MP3 保存。

**问题场景：**
- 长音频（如 1 小时的播客）会产生大量内存占用
- 估算：PCM 格式（16bit + 单声道 + 24000Hz）≈ 48 KB/秒 ≈ 172 MB/小时
- 用户中断播放（Ctrl+C）时，内存中的 PCM 数据全部丢失
- 低内存设备可能遇到内存压力

**用户反馈：**
在讨论 `refactor-output-and-play-behavior` 变更时，用户关注到了这个实现细节的问题，希望进一步探讨优化方案。

## What Changes

本变更旨在探讨和优化 PCM 边播边存的内存占用问题。可能的优化方向包括：

- **临时文件方案**：将 PCM 数据写入临时文件，而不是累积在内存
- **分段转码方案**：在播放过程中分段进行 PCM → MP3 转码
- **流式转码方案**：使用 ffmpeg 管道实现实时转码（如果可行）
- **保持现状**：评估内存占用是否真的构成问题

## 当前实现分析

### 数据流

```
API 返回 PCM chunk (Uint8Array)
        ↓
    ┌─────┴─────┐
    ↓           ↓
ffplay stdin  audioChunks[] (内存累积)
    ↓           ↓
  播放中     累积中...
                ↓
        播放结束后
                ↓
        合并所有 chunks
                ↓
    PCM buffer → ffmpeg → MP3 文件
```

### 内存占用估算

| 音频时长 | PCM 数据大小 | 说明 |
|---------|-------------|------|
| 10 分钟 | ~28 MB | 短文章，可接受 |
| 30 分钟 | ~84 MB | 中等长度 |
| 1 小时 | ~172 MB | 长播客，现代电脑可接受 |
| 2 小时 | ~344 MB | 超长内容，可能有压力 |

### 技术约束

1. **API 流式特性**：豆包 TTS API 返回的是流式 PCM 数据，无法预知总大小
2. **ffplay 播放**：需要持续写入 stdin 才能连续播放
3. **转码时机**：ffmpeg 需要完整的 PCM 数据才能转码为 MP3（带正确头部）

## 需要探讨的问题

### 1. 内存占用是否真的构成问题？

**支持保持现状的理由：**
- 现代电脑内存充足（通常 8GB+），170MB 占比很小
- `--play` 模式主要用于短到中等长度内容
- 临时文件方案会增加磁盘 I/O 和清理复杂度
- 当前实现简单，bug 更少

**支持优化方案的理由：**
- 低端设备或容器环境可能内存有限
- 超长音频（如 2 小时+）确实会有压力
- Ctrl+C 中断时数据丢失，用户体验不佳

### 2. 如果优化，选择哪种方案？

| 方案 | 优点 | 缺点 | 复杂度 |
|------|------|------|--------|
| **临时文件** | 减少内存占用；中断可恢复 | 需要文件管理；需要清理 | 中 |
| **分段转码** | 内存占用恒定；实时保存 MP3 | MP3 不能流式写入（需要重新生成头部）；可能产生多个文件 | 高 |
| **流式管道** | 理想方案，内存占用最小 | ffmpeg 可能不支持 PCM→MP3 的流式转码；技术风险高 | 高 |

### 3. 临时文件方案的具体实现

如果选择临时文件方案：

#### 3.1 方案 A：每 chunk 写入（原方案）

```typescript
// 创建临时 .pcm 文件
const tmpFile = `/tmp/tts-cli-${Date.now()}.pcm`;
const tmpHandle = await open(tmpFile, 'w');

// 每个 chunk 写入临时文件（而非累积在内存）
for (const chunk of audioChunks) {
  await tmpHandle.write(chunk);
}

// 播放结束后，从文件转码
await convertPCMtoMP3(tmpFile, outputPath);

// 清理临时文件
await remove(tmpFile);
```

#### 3.2 方案 B：pipe + WriteStream（推荐方案）

**核心思路：** 利用 Node.js 原生 `fs.createWriteStream` 自动处理缓冲和背压，无需手动管理批次。临时文件与目标 MP3 同目录。

```typescript
import { createWriteStream } from 'node:fs';

// 临时文件与目标 MP3 同目录
const tempFile = `${outputPath}.temp.raw`;
const writeStream = createWriteStream(tempFile);

// 处理流式数据
await processStreamLines(reader, async (json) => {
  if (json.data) {
    const chunk = decodeBase64(json.data);

    // 并行写入：ffplay + temp file
    await Promise.all([
      safeWrite(ffplay.stdin, chunk),      // 播放
      new Promise((resolve) => {
        if (!writeStream.write(chunk)) {
          writeStream.once('drain', resolve);  // 背压处理
        } else {
          resolve(undefined);
        }
      })                                    // 写入文件
    ]);
  }
});

// 流结束后
writeStream.end();
await new Promise(resolve => writeStream.on('finish', resolve));

// 转码（单个文件，无需 concat）
await convertPCMtoMP3(tempFile, outputPath);
await unlink(tempFile);
```

**方案对比：**

| 方案 | 磁盘 I/O | 内存占用 | 实现复杂度 | 文件管理 |
|------|---------|---------|-----------|----------|
| 每 chunk 写入 | 频繁 | O(单 chunk) | 低 | 单文件 |
| 分批写入 | 较少（每 10MB） | O(10MB) | 高 | 多文件 + concat |
| **pipe 方案** | **Node.js 自动优化** | **O(64KB)** | **低** | **单文件** |

**推荐 pipe 方案**，因为：
- `fs.createWriteStream` 默认 64KB 缓冲区，Node.js 自动优化 I/O
- 内存占用更小（64KB vs 10MB）
- 无需手动管理 batchIndex、accumulatedBytes 等状态
- 无需 ffmpeg concat 合并多个文件
- 背压由 Node.js 原生处理，更可靠
- 代码更简洁，bug 更少

#### 3.3 音频连续性保证

使用 `createWriteStream` 写入单个临时文件：

```
output.temp.raw: [完整的连续 PCM 数据流]
```

无需文件合并，直接转码：
```bash
ffmpeg -f s16le -ar 24000 -i output.temp.raw \
  -c:a mp3 -b:a 128k output.mp3
```

**单文件写入保证音频连续性，不会有拼接问题。**

#### 3.4 需要注意的问题

- 临时文件路径（与目标 MP3 同目录：`outputPath.temp.raw`）
- 进程异常退出时的清理
- 磁盘空间占用（与目标 MP3 相同目录，共享可用空间）
- **无需配置阈值**，Node.js 自动优化缓冲

### 4. 内存占用分析

**pipe 方案内存布局：**

```typescript
const chunk = decodeBase64(json.data);  // 临时 chunk (~50KB)

safeWrite(ffplay.stdin, chunk);         // 复制到 stdin 缓冲区
writeStream.write(chunk);               // 复制到 WriteStream 缓冲区
// chunk 可被垃圾回收
```

**实际内存占用：**

```
临时 chunk (50KB)
    ↓
┌────────────┴────────────┐
│                         │
ffplay stdin     WriteStream 内部缓冲区
(复制)           (64KB 默认缓冲)
    ↓                   ↓
用于播放            用于磁盘写入
```

**为什么 pipe 方案内存占用小：**
- chunk 写入后立即可被垃圾回收
- `writeStream` 内部缓冲区默认 64KB（highWaterMark）
- 不需要累积所有 chunks
- Node.js 自动管理缓冲和背压

### 5. 是否需要用户可配置的缓冲区？

**不需要。** Node.js `fs.createWriteStream` 默认缓冲区（64KB highWaterMark）已经足够高效。

如果确实需要调优（极少场景），可以通过 `highWaterMark` 选项调整：

```typescript
const writeStream = createWriteStream(tempFile, { highWaterMark: 128 * 1024 });
```

但这增加了配置复杂度，且收益很小，不推荐暴露为用户配置。

### 5. SIGINT/Ctrl+C 信号处理

#### 5.1 当前状态

**❌ 当前代码没有 SIGINT 监听**

```bash
$ tts-cli long-text.md --play
[播放中...] ^C
```

**问题：**
- 主进程立即退出
- ffplay 子进程可能继续运行（占用声卡）
- HTTP 流没有正确关闭
- 临时文件（如果有）没有清理

#### 5.2 需要的清理逻辑

```typescript
let ffplayProcess: ReturnType<typeof spawnFfplay> | null = null;
let tempFile: string | null = null;
let isInterrupted = false;

// 清理函数
async function cleanup() {
  // 1. 清理 ffplay 进程
  if (ffplayProcess && !ffplayProcess.killed) {
    ffplayProcess.kill('SIGTERM');
    // 等待进程退出（最多 5 秒）
    await Promise.race([
      new Promise(resolve => ffplayProcess.on('exit', resolve)),
      new Promise(resolve => setTimeout(resolve, 5000)),
    ]);
    // 如果仍未退出，强制终止
    if (!ffplayProcess.killed) {
      ffplayProcess.kill('SIGKILL');
    }
  }

  // 2. 清理临时文件
  if (tempFile) {
    try {
      await unlink(tempFile);
    } catch {}
  }
}

// 注册信号处理
process.on('SIGINT', async () => {
  isInterrupted = true;
  log.warn('Interrupted by user');
  await cleanup();
  process.exit(130); // 128 + 2 (SIGINT)
});

process.on('SIGTERM', async () => {
  isInterrupted = true;
  await cleanup();
  process.exit(143); // 128 + 15 (SIGTERM)
});

// exit 钩子：Windows 兼容 + 异常退出清理
process.on('exit', (code) => {
  // Windows 不支持 SIGTERM，需要在 exit 钩子里强制终止
  if (ffplayProcess && !ffplayProcess.killed) {
    ffplayProcess.kill('SIGKILL'); // Windows 强制终止
  }

  // 异常退出时清理临时文件
  if (code !== 0 && tempFile) {
    try {
      unlinkSync(tempFile);
    } catch {}
  }
});
```

#### 5.3 清理时机

| 场景 | 临时文件处理 | MP3 保存 |
|------|-------------|---------|
| 正常完成 | 用于转码，然后删除 | ✅ 保存 |
| Ctrl+C 中断 | 立即删除 | ❌ 不保存 |
| API 错误 | 删除（不完整） | ❌ 不保存 |
| ffplay 崩溃 | 删除（不完整） | ❌ 不保存 |

#### 5.4 跨平台信号处理

注意不同平台的信号差异：

| 平台 | 中断信号 | SIGTERM 支持 | 退出码 |
|------|---------|-------------|--------|
| Linux/macOS | SIGINT | ✅ 支持 | 130 (128+2) |
| Linux/macOS | SIGTERM | ✅ 支持 | 143 (128+15) |
| Windows | SIGINT | ⚠️ 不支持 SIGTERM | 130 |
| Windows | SIGTERM | ⚠️ 不支持 | - |

**Windows 特殊处理：**
- Windows 不支持 SIGTERM 信号
- 必须在 `exit` 钩子中调用 `ffplayProcess.kill('SIGKILL')` 强制终止
- exit 钩子中只能使用同步操作（`unlinkSync`）

**推荐策略：**
- SIGINT/SIGTERM 处理器中先尝试 SIGTERM（Unix）
- exit 钩子作为兜底，确保 ffplay 被终止（Windows + 异常退出）
- 超时后使用 SIGKILL 强制终止（Unix）

## Impact

- **src/tts.ts** - `runPlayMode()` 和相关函数的实现
- **src/utils.ts** - 可能需要添加临时文件管理函数
- **用户体验** - 长音频播放的内存占用和中断恢复
- **测试** - 需要测试不同长度音频的内存表现
- **文档** - 需要说明选择的方案及其权衡

## 下一步

本 proposal 旨在汇总问题和方案，**暂不决定实现方向**。建议：

1. 先完成 `refactor-output-and-play-behavior` 的实现 ✓ (已完成)
2. 收集更多用户反馈，了解实际使用场景
3. 如果确实存在问题，再选择合适的优化方案
4. 如果优化，创建新的 design.md 详细设计实现细节

---

## 附录：EPIPE 错误问题

### 问题描述

在 `--play --force` 模式下（以及某些 `--play` 场景），系统会抛出 EPIPE (broken pipe) 错误：

```
EPIPE: broken pipe
syscall: "write"
errno: -32
code: "EPIPE"
```

### EPIPE 的成因

**当前实现的数据流：**

```
API → PCM chunk → 写入 ffplay stdin (播放)
                ↓
           同时累积到内存 audioChunks[]
                ↓
        播放结束后调用 stdin.end()
                ↓
    ┌─────────────────────────────────────┐
    │  如果此时 ffplay 已关闭 stdin:      │
    │  → stdin.end() 收到 EPIPE 错误      │
    │  → 或者关闭管道时仍有数据在传输    │
    └─────────────────────────────────────┘
```

**时序问题：**
1. API 发送完最后一个 chunk
2. 我们调用 `stdin.end()` 来关闭写入端
3. 如果 ffplay 已经播放完音频并退出了
4. 或者 ffplay 在我们写入数据时提前关闭了 stdin
5. → 管道破裂，产生 EPIPE 错误

### 为什么不影响功能？

- ✓ 音频生成正常（API 调用成功）
- ✓ 音频播放正常（ffplay 播放了所有数据）
- ✓ 文件保存正常（输出文件有内容）
- ⚠️ 只是在清理时产生错误信号

代码已经处理了退出码 141 (SIGPIPE)，将其视为正常退出。

### 临时文件方案能否改善 EPIPE？

**分析：**

| 方面 | 内存方案 | 临时文件方案 |
|------|---------|-------------|
| **EPIPE 根源** | stdin.end() 调用 | 同样的 stdin.end() 调用 |
| **ffplay 行为** | 可能提前关闭 stdin | 同样的行为 |
| **管道时序** | 同样的时序问题 | 同样的时序问题 |
| **内存压力** | 高（影响时序） | 低（可能改善时序） |

**结论：**
- ❌ 临时文件**不能**根本解决 EPIPE 问题
- ✓ 可能**减少 EPIPE 发生频率**（减少内存压力，进程更稳定）
- ✓ 提供**中断恢复**能力（临时文件可以重新转码）

### 真正的解决方案

**分层策略（推荐）：**

```
1. 文件已存在 + --play → 直接播放 MP3
   └─ 无管道，无 EPIPE ✓

2. 文件不存在 + --play → 临时文件方案
   └─ 减少 EPIPE 频率 ✓
   └─ 支持中断恢复 ✓

3. 无 --play → 直接生成 MP3
   └─ 无播放，无 EPIPE ✓
```

**根本修复 EPIPE：**
- 改进 stdin 关闭时机
- 在关闭前检测 ffplay 进程状态
- 使用 `process.kill(0, pid)` 检查进程是否存活
- 添加更安全的管道关闭逻辑
