# Tasks: init-config

## Phase 1: 类型定义与默认值

- [x] 1.1 创建 `src/config.ts`，定义 `Config` interface
- [x] 1.2 定义 `DEFAULTS: Config` 常量，填入所有默认值
- [x] 1.3 实现 `getConfigDir()`，跨平台路径处理（macOS/Linux 用 `~/.config/tts-cli`，Windows 用 `%APPDATA%\tts-cli`）
- [x] 1.4 导出 `CONFIG_PATH` 常量

## Phase 2: 配置读写

- [x] 2.1 实现 `readConfigFile()`：读取并解析 TOML，文件不存在时返回 `null`
- [x] 2.2 实现 `saveConfig(config: Config)`：将配置序列化为 TOML 并写入，目录不存在时自动创建
- [x] 2.3 实现 `deepMerge()`：三层合并，CLI 参数为 `undefined` 时不覆盖配置文件值
- [x] 2.4 实现 `loadConfig(cliOverrides?)`：组合 `DEFAULTS` + `readConfigFile()` + `cliOverrides`

## Phase 3: 首次运行引导

- [x] 3.1 创建 `src/setup.ts`，实现 `runSetup()`
- [x] 3.2 接入 `@clack/prompts`：`intro` → `text(app_id)` → `text(token, mask)` → `text(voice)` → `text(speed)` → `outro`
- [x] 3.3 每个 `text` 步骤加入 `isCancel()` 检测，Ctrl+C 时优雅退出
- [x] 3.4 引导完成后调用 `saveConfig()` 写入配置文件

## Phase 4: 入口集成

- [x] 4.1 修改 `src/index.ts`：启动时检测 `CONFIG_PATH` 是否存在
- [x] 4.2 不存在时调用 `runSetup()`，完成后继续正常流程

## Phase 5: config 子命令

- [x] 5.1 在 `src/cli.ts` 中注册 `config` 子命令
- [x] 5.2 实现 `tts-cli config`：格式化打印当前配置内容
- [x] 5.3 实现 `tts-cli config --edit`：读取 `$EDITOR` / `$VISUAL` / 回退 `vi`，`execSync` 打开配置文件
- [x] 5.4 实现 `tts-cli config --reset`：删除配置文件后调用 `runSetup()`

## Phase 6: 验证

- [x] 6.1 首次运行完整走通引导流程，确认配置文件正确生成
- [x] 6.2 验证三层合并优先级：CLI 参数 > 配置文件 > 默认值
- [x] 6.3 验证 `tts-cli config` 三个子命令均正常工作
- [x] 6.4 验证 Windows 路径（`%APPDATA%\tts-cli\config.toml`）正确

## Phase 7: 测试

- [x] 7.1 通过 tests.md 创建测试
- [x] 7.2 完成测试
