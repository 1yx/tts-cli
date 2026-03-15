# Tests: env-check

## 单元测试 `test/unit/env.test.ts`

### getInstallGuide()

- [x] `process.platform = 'darwin'` 时返回 `brew install ffmpeg`
- [x] `process.platform = 'linux'` 时返回 `sudo apt install ffmpeg`
- [x] `process.platform = 'win32'` 时返回 `winget install ffmpeg` 及链接
- [x] 未知平台时回退到 linux 指引

### formatFfmpegError()

- [x] 返回字符串包含安装命令
- [x] 返回字符串包含降级建议（不带 `--play` 的用法）

### hasFfmpeg() / hasFfplay()

- [x] mock `Bun.which` 返回路径时，`hasFfmpeg()` 返回 `true`
- [x] mock `Bun.which` 返回 `null` 时，`hasFfmpeg()` 返回 `false`

---

## 集成测试 `test/integration/env-check.test.ts`

### assertFfmpeg()

- [x] ffmpeg 存在时正常通过，不退出
- [x] ffmpeg 不存在时（mock `Bun.which` 返回 `null`），打印错误信息并调用 `process.exit(1)`
- [x] 报错信息包含当前平台对应的安装命令

### 首次引导中的环境检测

- [x] ffmpeg 已安装时，引导第一步显示 `✓ ffmpeg 已安装`，继续进入配置步骤
- [x] ffmpeg 未安装时，显示 `✗ ffmpeg 未检测到` 及安装指引，等待确认后继续
- [x] 用户选择跳过安装检测时，引导继续，不阻塞

### 下载模式不触发检测

- [x] mock `hasFfmpeg()` 返回 `false`，执行默认下载模式，`assertFfmpeg` 不被调用
