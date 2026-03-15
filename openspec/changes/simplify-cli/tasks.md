# Tasks: Simplify CLI Structure

## 1. 主命令重构

- [x] 1.1 在 `src/index.ts` 中定义 citty 主命令（移除子命令注入逻辑）
- [x] 1.2 修改主命令接受 `<input>` 作为位置参数
- [x] 1.3 将所有 CLI 参数（--play, --no-save, --output, --voice 等）移到主命令定义
- [x] 1.4 移除 `--format` 参数（格式固定：play=PCM, save=MP3）
- [x] 1.5 验证主命令路由正确到 `runDownloadMode` 或 `runPlayMode`

## 2. 清理子命令文件

- [x] 2.1 删除 `src/cli.ts`（citty 子命令定义）
- [x] 2.2 删除 `src/commands/config.ts`（config 子命令业务逻辑）
- [x] 2.3 删除 `src/commands/convert.ts`（convert 子命令业务逻辑）
- [x] 2.4 删除 `src/commands/` 目录（如果为空）

## 3. 首次运行简化

- [x] 3.1 修改 `src/setup.ts`，移除 voice 询问
- [x] 3.2 修改 `src/setup.ts`，移除 speed 询问
- [x] 3.3 保留 app_id 和 token 的 text prompt（masked input for token）
- [x] 3.4 更新 setup 完成提示信息，说明配置文件位置
- [ ] 3.5 验证首次运行只询问两个问题

## 4. 极简配置文件

- [x] 4.1 修改 `src/config.ts` 中的 `saveConfig` 函数，只保存非空的 api.app_id 和 api.token
- [x] 4.2 确保 `loadConfig` 继续正确合并默认值（DEFAULTS < fileConfig < cliOverrides）
- [ ] 4.3 验证保存的配置文件只包含 `[api]` 部分
- [ ] 4.4 验证用户手动添加其他配置后能正常读取

## 5. 固定输出格式

- [x] 5.1 从 `src/tts.ts` 的 `TTSOptions` 接口移除 `format` 字段
- [x] 5.2 修改 `runPlayMode` 硬编码使用 `format: 'pcm'`
- [x] 5.3 修改 `runDownloadMode` 硬编码使用 `format: 'mp3'`
- [x] 5.4 更新 `buildPayload` 函数，从 CLI overrides 中移除 format 处理
- [ ] 5.5 验证播放和下载模式使用正确格式

## 6. 错误提示与配置路径

- [x] 6.1 确保配置相关错误信息包含完整配置文件路径（~/.config/tts-cli/config.toml）
- [x] 6.2 更新 `env.ts` 的 `formatFfmpegError` 不依赖 config 命令引用
- [x] 6.3 验证首次运行提示包含配置文件位置

## 7. 文档更新

- [x] 7.1 更新 README.md 的 CLI 参数列表（移除 `--format`）
- [x] 7.2 更新 README.md 使用示例（tts-cli <input> 替代 tts-cli convert <input>）
- [x] 7.3 添加 README.md 配置文件章节（说明路径和编辑方式）
- [x] 7.4 添加 README.md 高级配置章节（展示所有可配置项示例）
- [x] 7.5 移除 README.md 中关于 `tts-cli config` 的说明

## 8. 测试与验证

- [x] 8.1 运行单元测试确保修改后功能正常 (60 tests passed)
- [x] 8.6 验证旧命令语法（tts-cli convert）返回错误提示 ("File not found: convert")
- [ ] 8.2 手动测试首次运行流程（只问两个问题）- 需运行时验证
- [ ] 8.3 手动测试基本转换命令（tts-cli input.md）- 需运行时验证
- [ ] 8.4 手动测试播放模式（tts-cli input.md --play）- 需运行时验证
- [ ] 8.5 手动测试配置文件读写（编辑配置文件验证生效）- 需运行时验证
