# Tasks: env-check

## Phase 1: 检测工具函数

- [x] 1.1 创建 `src/env.ts`
- [x] 1.2 实现 `hasFfmpeg()`：使用 `Bun.which('ffmpeg')` 检测，返回 `boolean`
- [x] 1.3 实现 `hasFfplay()`：使用 `Bun.which('ffplay')` 检测，返回 `boolean`
- [x] 1.4 实现 `getInstallGuide()`：根据 `process.platform` 返回对应平台安装命令（darwin / linux / win32）

## Phase 2: 错误信息格式化

- [x] 2.1 实现 `formatFfmpegError()`：拼接完整的报错提示，包含安装命令和降级建议
- [x] 2.2 实现 `assertFfmpeg()`：检测不通过时打印错误并 `process.exit(1)`

## Phase 3: 首次引导集成

- [x] 3.1 修改 `src/setup.ts`：在引导开始前（`intro` 之后）加入环境检测步骤
- [x] 3.2 调用 `hasFfmpeg()`，显示 `✓ ffmpeg 已安装` 或 `✗ ffmpeg 未检测到`
- [x] 3.3 未安装时展示 `getInstallGuide()` 输出，使用 `@clack/prompts` 的 `note` 展示安装命令
- [x] 3.4 使用 `press any key to continue` 等待用户确认后继续配置流程
- [x] 3.5 用户可选择跳过，引导继续（运行时再报错）

## Phase 4: 运行时集成

- [x] 4.1 修改 `src/tts.ts`：在 `runPlayMode()` 入口处调用 `assertFfmpeg()`
- [x] 4.2 默认下载模式（`runDownloadMode()`）不调用任何检测函数
- [x] 4.3 验证报错信息包含正确的平台安装命令

## Phase 5: 验证

- [x] 5.1 模拟 ffmpeg 不存在场景（临时修改 PATH），验证首次引导提示正确
- [x] 5.2 验证 `--play` 模式下缺少 ffmpeg 时给出友好报错并退出
- [x] 5.3 验证默认下载模式在无 ffmpeg 环境下正常运行不报错
- [x] 5.4 验证三个平台的安装指引文本（darwin / linux / win32）均正确

## Phase 6: 测试

- [x] 6.1 通过 tests.md 创建测试
- [x] 6.2 完成测试
