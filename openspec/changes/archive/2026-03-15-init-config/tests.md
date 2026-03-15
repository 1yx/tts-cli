# Tests: init-config

## 单元测试 `test/unit/config.test.ts`

### getConfigDir()
- [x] macOS / Linux 返回 `~/.config/tts-cli`
- [x] Windows（mock `process.platform = 'win32'`）返回 `%APPDATA%\tts-cli`

### deepMerge()
- [x] CLI 参数有值时覆盖配置文件值
- [x] CLI 参数为 `undefined` 时不覆盖配置文件值，保留配置文件值
- [x] 配置文件缺失字段时回退到默认值
- [x] 三层同时存在时优先级正确：CLI > 文件 > 默认值

### resolveOutputPath()
- [ ] 未传 `--output` 时，输出路径为同目录同名 `.mp3`
- [ ] 传入 `--output ./out.mp3` 时，直接使用该路径
- [ ] 输入文件扩展名为 `.markdown` 时，输出扩展名正确替换为 `.mp3`

### loadConfig()
- [x] 配置文件不存在时返回纯默认值
- [x] 配置文件存在时正确合并
- [x] CLI overrides 正确覆盖对应字段

---

## 集成测试 `test/integration/load-config.test.ts`

### 配置文件读写
- [ ] `saveConfig()` 写入后，`readConfigFile()` 能正确读回，字段无丢失
- [ ] 目录不存在时 `saveConfig()` 自动创建目录
- [ ] TOML 文件内容格式正确，人类可读

### 首次引导流程
- [ ] mock `@clack/prompts` 的各 prompt，模拟用户输入完整引导流程
- [ ] 引导结束后配置文件正确生成
- [ ] 用户在任意步骤 Ctrl+C（`isCancel` 返回 true）时进程优雅退出，不写入残留文件

### config 子命令
- [ ] `tts-cli config` 打印当前配置，格式包含所有字段
- [ ] `tts-cli config --reset` 删除旧配置文件后重新触发引导
- [ ] `tts-cli config --edit` 调用 `$EDITOR`（mock `execSync`，验证参数正确）
