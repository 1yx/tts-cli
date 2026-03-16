## 1. 信号处理和进程清理

- [x] 1.1 在 `src/tts.ts` 中添加 `ffplayProcess` 变量，保存当前 ffplay 进程引用
- [x] 1.2 添加 `tempFile` 变量跟踪临时文件路径（单一文件）
- [x] 1.3 添加 `isInterrupted` 标志区分正常退出和中断
- [x] 1.4 实现 `cleanup()` 函数：终止 ffplay + 删除临时文件
  - 先尝试 SIGTERM，等待最多 5 秒
  - 超时后使用 SIGKILL 强制终止
  - 删除临时文件（异步）
- [x] 1.5 注册 SIGINT 信号处理器：调用 cleanup() + process.exit(130)
- [x] 1.6 注册 SIGTERM 信号处理器：调用 cleanup() + process.exit(143)
- [x] 1.7 注册 exit 钩子：Windows 兼容 + 异常退出清理
  - 检查 ffplayProcess 是否存活，强制终止（SIGKILL）
  - 使用同步删除（`unlinkSync`）清理临时文件
- [x] 1.8 修改 `spawnFfplay()` 返回进程引用（而不仅仅是 stdin）
- [x] 1.9 验证 TypeScript 编译无错误

## 2. pipe + WriteStream 写入临时文件

- [x] 2.1 在 `src/tts.ts` 中导入 `createWriteStream` from 'node:fs'
- [x] 2.2 在 `runPlayMode()` 开始时创建 `writeStream = createWriteStream(tempFile)`
- [x] 2.3 在 `processStreamLines` handler 中并行写入 ffplay stdin 和 writeStream
- [x] 2.4 处理 writeStream 的背压（drain 事件）
- [x] 2.5 流结束后调用 `writeStream.end()` 并等待 'finish' 事件
- [x] 2.6 验证内存占用保持在 ~64KB

## 3. 临时文件转码和清理

- [x] 3.0 在 `src/utils.ts` 中实现 `safeWrite()` 函数：防御性处理 EPIPE 错误
  - 检查 stream.writable 和 stream.destroyed
  - 捕获 EPIPE 错误并静默处理（播放器已关闭）
  - 处理背压（drain 事件）
  - 返回 Promise<void>
- [x] 3.1 使用现有的 `convertPCMtoMP3()` 函数转码临时文件
- [x] 3.2 转码完成后删除临时文件
- [x] 3.3 验证输出 MP3 文件音频连续性

## 4. 临时文件命名和管理

- [x] 4.1 临时文件命名为 `outputPath.temp.raw`（与目标 MP3 同目录）
- [x] 4.2 确保文件路径跨平台兼容（使用 path.join）
- [x] 4.3 在正常完成时删除临时文件
- [x] 4.4 在中断时删除临时文件
- [x] 4.5 在 API 错误时删除临时文件

## 5. runPlayMode 集成

- [x] 5.0 替换 `stdin.write()` 为 `safeWrite(stdin, chunk)` 防止 EPIPE 错误
- [x] 5.1 在 `runPlayMode()` 开始时创建 writeStream
- [x] 5.2 在 `processStreamLines` handler 中集成并行写入（ffplay + writeStream）
- [x] 5.3 在流结束后等待 writeStream.finish 事件
- [x] 5.4 调用 `convertPCMtoMP3()` 转码临时文件
- [x] 5.5 在正常完成时清理临时文件
- [x] 5.6 在错误时清理临时文件
- [x] 5.7 在中断时通过信号处理器清理临时文件

## 6. 测试验证

- [x] 6.1 创建长文本测试文件（超过 10 分钟音频）
- [x] 6.2 运行 `tts-cli long-text.md --play` 验证内存占用保持在 ~64KB
- [x] 6.3 验证临时文件被正确创建和删除（单一 .temp.raw 文件）
- [x] 6.4 验证最终 MP3 文件音频连续性（无爆音或静音）
- [x] 6.5 测试 Ctrl+C 中断：验证 ffplay 进程被终止
- [x] 6.6 测试 Ctrl+C 中断：验证临时文件被删除
- [x] 6.7 测试 Ctrl+C 中断：验证 MP3 文件不被保存
- [x] 6.8 测试 API 错误时：验证临时文件被正确清理
- [x] 6.9 测试正常完成：验证 MP3 被保存
- [x] 6.10 使用内存监控工具验证内存占用恒定且较低

## 7. 类型定义和文档

- [x] 7.1 在 `src/utils.ts` 中添加 `safeWrite()` 函数的类型定义
- [x] 7.2 更新 README 或文档说明内存优化行为
- [x] 7.3 添加 Ctrl+C 行为说明（中断 = 放弃保存）
- [x] 7.4 更新设计文档说明 pipe + WriteStream 方案
