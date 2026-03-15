# Tasks: play-mode

## Phase 1: 工具函数

- [ ] 1.1 创建 `src/utils.ts`
- [ ] 1.2 实现 `spawnFfplay(sampleRate)`：启动 ffplay 子进程，stdin 为 pipe，stdout/stderr 忽略，返回子进程实例
- [ ] 1.3 实现 `convertPCMtoMP3(pcm, outputPath, sampleRate)`：调用 ffmpeg spawnSync，失败时抛出带 stderr 的错误
- [ ] 1.4 验证 `convertPCMtoMP3` 在输出路径已存在时正确覆盖（ffmpeg `-y` 参数）

## Phase 2: CLI 参数扩展

- [ ] 2.1 修改 `src/cli.ts`：新增 `--play` boolean 参数
- [ ] 2.2 新增 `--no-save` boolean 参数
- [ ] 2.3 在入口处校验：`--no-save` 单独使用时报错提示并退出

## Phase 3: play 模式主流程

- [ ] 3.1 在 `src/tts.ts` 中实现 `runPlayMode(inputPath, config, args)`
- [ ] 3.2 入口处调用 `assertFfmpeg()`，检测 ffmpeg 是否可用
- [ ] 3.3 强制将请求格式设为 `pcm`，忽略 `--format` 参数
- [ ] 3.4 确认 payload 中 `sample_rate` 与 `spawnFfplay` 的 `-ar` 参数来源相同（均为 `config.tts.sample_rate`）
- [ ] 3.5 启动 ffplay 子进程
- [ ] 3.6 启动进度条（复用 `createProgressBar` 和 `updateProgress`）
- [ ] 3.7 循环读取流式响应：
  - 音频 chunk → `player.stdin.write(chunk)`
  - 若 `opts.save` → 同时 `pcmChunks.push(chunk)`
  - 文本 chunk → 更新进度条
- [ ] 3.8 流结束后调用 `player.stdin.end()`
- [ ] 3.9 `await` ffplay `close` 事件，确保播放真正结束

## Phase 4: 转码与保存

- [ ] 4.1 播放结束后，若 `opts.save === true`，调用 `convertPCMtoMP3()`
- [ ] 4.2 输出路径使用 `resolveOutputPath()`（复用 download-mode 中的实现）
- [ ] 4.3 转码完成后打印：`✓ 已保存到 <outputPath>`
- [ ] 4.4 `opts.save === false` 时跳过转码，直接退出

## Phase 5: index.ts 路由

- [ ] 5.1 修改 `src/index.ts`：根据 `args.play` 决定调用 `runPlayMode` 还是 `runDownloadMode`
- [ ] 5.2 将 `opts.save = !args.noSave` 传入 `runPlayMode`

## Phase 6: 验证

- [ ] 6.1 `tts-cli input.md --play`：验证音频实时播放，播放结束后 MP3 正确保存
- [ ] 6.2 `tts-cli input.md --play --no-save`：验证只播放，本地无文件生成
- [ ] 6.3 验证转码在播放**完全结束后**才开始（不提前出现"已保存"提示）
- [ ] 6.4 验证 ffplay 窗口不弹出（`-nodisp` 生效）
- [ ] 6.5 验证无 ffmpeg 时 `--play` 给出友好报错并退出
- [ ] 6.6 验证单独使用 `--no-save` 时给出参数错误提示

## Phase 7: 测试

- [ ] 7.1 通过 tests.md 创建测试
- [ ] 7.2 完成测试
