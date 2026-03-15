# Tasks: play-mode

## Phase 1: 工具函数

- [x] 1.1 创建 `src/utils.ts`
- [x] 1.2 实现 `spawnFfplay(sampleRate)`：启动 ffplay 子进程，stdin 为 pipe，stdout/stderr 忽略，返回子进程实例
- [x] 1.3 实现 `convertPCMtoMP3(pcm, outputPath, sampleRate)`：调用 ffmpeg spawn，失败时抛出带 stderr 的错误
- [x] 1.4 验证 `convertPCMtoMP3` 在输出路径已存在时正确覆盖（ffmpeg `-y` 参数）

## Phase 2: CLI 参数扩展

- [x] 2.1 修改 `src/cli.ts`：新增 `--play` boolean 参数
- [x] 2.2 ~~新增 `--no-save` boolean 参数~~ → 改为基于 `--output` 决定是否保存
- [x] 2.3 更新产品逻辑：有 `--output` 则保存，无则不保存

## Phase 3: play 模式主流程

- [x] 3.1 在 `src/tts.ts` 中实现 `runPlayMode(inputPath, config, args)`
- [x] 3.2 入口处调用 `assertFfmpeg()`，检测 ffmpeg 是否可用
- [x] 3.3 强制将请求格式设为 `pcm`，忽略 `--format` 参数
- [x] 3.4 确认 payload 中 `sample_rate` 与 `spawnFfplay` 的 `-ar` 参数来源相同（均为 `config.tts.sample_rate`）
- [x] 3.5 启动 ffplay 子进程（修复参数：移除 `-ac`，ffplay 默认处理声道）
- [x] 3.6 启动进度条（复用 `createProgressBar` 和 `handleChunk`）
- [x] 3.7 循环读取流式响应：
  - 音频 chunk → `player.stdin.write(chunk)`（带 backpressure 处理）
  - 若 `opts.save` → 同时 `pcmChunks.push(chunk)`
  - 文本 chunk → 更新进度条
- [x] 3.8 流结束后调用 `player.stdin.end()`
- [x] 3.9 `await` ffplay `close` 事件，确保播放真正结束

## Phase 4: 转码与保存

- [x] 4.1 播放结束后，若 `opts.save === true`，调用 `convertPCMtoMP3()`
- [x] 4.2 输出路径使用 `resolveOutputPath()`（复用 download-mode 中的实现）
- [x] 4.3 转码完成后打印：`✓ Saved to <outputPath>`
- [x] 4.4 `opts.save === false` 时跳过转码，直接退出

## Phase 5: index.ts 路由

- [x] 5.1 修改 `src/index.ts`：修复子命令注入逻辑，支持显式 `convert` 子命令
- [x] 5.2 修改 `src/commands/convert.ts`：`save = args.output !== undefined`

## Phase 6: 验证

- [x] 6.1 `tts-cli input.md --play --output file.mp3`：验证音频实时播放，播放结束后 MP3 正确保存
- [x] 6.2 `tts-cli input.md --play`：验证只播放，本地无文件生成
- [x] 6.3 验证转码在播放**完全结束后**才开始（不提前出现"已保存"提示）
- [x] 6.4 验证 ffplay 窗口不弹出（`-nodisp` 生效）
- [x] 6.5 验证无 ffmpeg 时 `--play` 给出友好报错并退出
- [x] 6.6 ~~验证单独使用 `--no-save` 时给出参数错误提示~~ → 该参数已移除

## Phase 7: 测试

- [ ] 7.1 通过 tests.md 创建测试
- [ ] 7.2 完成测试
