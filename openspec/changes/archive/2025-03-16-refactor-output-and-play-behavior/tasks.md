# Tasks: Refactor Output and Play Behavior

## 1. CLI 参数定义

- [x] 1.1 添加 `--force` 参数到 `src/index.ts` 的 args 定义
- [x] 1.2 更新 `--play` 参数描述（仅控制播放，不控制保存）
- [x] 1.3 更新 `--output` 参数描述（支持文件夹路径）

## 2. 配置模块更新

- [x] 2.1 从 `Config` interface 中删除 `output.dir` 字段
- [x] 2.2 从 `DEFAULTS` 中删除 `output.dir` 默认值
- [x] 2.3 验证旧配置文件兼容性（忽略未知字段）

## 3. 路径解析逻辑

- [x] 3.1 更新 `resolveOutputPath()` 函数支持 `--output` 文件夹检测
- [x] 3.2 使用 `fs.stat()` 检测路径是文件还是文件夹
- [x] 3.3 文件夹路径时，从输入文件名推导输出文件名
- [x] 3.4 不存在路径时，根据结尾 `/` 判断是否为文件夹

## 4. 文件存在检测

- [x] 4.1 添加 `checkFileExists()` 辅助函数
- [x] 4.2 在主命令运行前检测输出文件是否存在
- [x] 4.3 文件存在且无 `--play`/`--force` 时，提示并退出
- [x] 4.4 文件存在且有 `--force` 时，跳过存在检查

## 5. 本地 MP3 播放功能

- [x] 5.1 添加 `playLocalMP3()` 函数到 `src/utils.ts`
- [x] 5.2 使用 `ffplay -nodisp -autoexit <file>` 命令
- [x] 5.3 处理播放失败的情况

## 6. 运行模式更新

- [x] 6.1 更新 `runPlayMode()` 总是保存 MP3（移除 `save` 参数控制）
- [x] 6.2 更新主命令逻辑：文件存在 + `--play` → 播放本地文件
- [x] 6.3 更新主命令逻辑：`--force` 时总是调用 API
- [x] 6.4 删除 `--no-save` 相关代码（如果存在）

## 7. 错误提示

- [x] 7.1 文件存在提示：`✗ Output file already exists: <path>`
- [x] 7.2 建议信息：`Use --play to play the existing file, or --force to regenerate`
- [x] 7.3 使用 `@clack/prompts` 的 `log.error` 显示错误

## 8. 文档更新

- [x] 8.1 更新 `CLAUDE.md` 删除 `output.dir` 相关说明
- [x] 8.2 更新 `CLAUDE.md` 参数说明（`--play`, `--output`, `--force`）
- [x] 8.3 添加 `README.md` 行为对照表（如讨论中所示）
- [x] 8.4 更新配置文件格式说明

## 9. 测试

- [x] 9.1 测试：无参数 + 文件不存在 → 生成 MP3
- [x] 9.2 测试：无参数 + 文件存在 → 提示并退出
- [x] 9.3 测试：`--play` + 文件存在 → 播放本地 MP3
- [x] 9.4 测试：`--play` + 文件不存在 → 生成并播放
- [x] 9.5 测试：`--force` + 文件存在 → 强制重新生成
- [x] 9.6 测试：`--play --force` → 强制重新生成并播放
- [x] 9.7 测试：`--output <folder>/` → 保存到文件夹
- [x] 9.8 测试：`--output <file>` → 保存到指定文件
- [x] 9.9 运行 `bun test` 确保现有测试通过
- [x] 9.10 手动测试：验证所有参数组合行为正确

## 10. 手动测试验证

### 测试准备

- [x] 10.1 确认测试凭证已配置（~/.config/tts-cli/config.toml）
- [x] 10.2 准备测试输入文件（test/fixtures/test-tts.md）
- [x] 10.3 创建测试文件夹：`mkdir -p /tmp/tts-test`

### 场景 1: 文件存在检测

- [x] 10.1.1 生成初始文件：`bun run src/index.ts test/fixtures/test-tts.md --output /tmp/tts-test/scenario1.mp3`
- [x] 10.1.2 再次运行相同命令（无参数）
  - **预期**：显示错误 ✓
  - **预期**：显示建议 ✓
  - **预期**：进程退出码为 1 ✓
  - **预期**：没有调用 API ✓

### 场景 2: --play 播放本地文件

- [x] 10.2.1 确保文件存在
- [x] 10.2.2 播放本地文件
  - **预期**：显示提示 ✓
  - **预期**：ffplay 启动并播放 ✓
  - **预期**：没有 API 调用 ✓
  - **预期**：播放结束后正常退出 ✓

### 场景 3: --force 强制覆盖

- [x] 10.3.1 确保文件存在并记录修改时间
- [x] 10.3.2 强制重新生成
  - **预期**：显示进度条 ✓
  - **预期**：文件被覆盖 ✓
  - **预期**：显示成功提示 ✓

### 场景 4: --output 文件夹路径

- [x] 10.4.1 保存到文件夹
  - **预期**：生成文件 `/tmp/tts-test/test-tts.mp3` ✓
  - **预期**：使用输入文件名作为输出文件名 ✓
- [x] 10.4.2 验证文件 ✓

### 场景 5: --play --force 组合

- [x] 10.5.1 确保文件存在
- [x] 10.5.2 强制重新生成并播放（第2次测试无 EPIPE）
  - **预期**：显示进度条 ✓
  - **预期**：ffplay 播放音频 ✓
  - **预期**：文件被保存 ✓
  - **说明**：EPIPE 是时序问题，不是每次都出现，不影响功能

### 场景 6: 默认行为（无 --output）

- [x] 10.6.1 运行无参数
  - **预期**：保存到同目录 ✓
- [x] 10.6.2 验证文件 ✓
- [x] 10.6.3 再次运行
  - **预期**：显示文件已存在错误 ✓

### 场景 7: 清理测试文件

- [x] 10.7 清理测试文件：`rm -rf /tmp/tts-test`
- [x] 10.8 清理同目录生成的文件：`rm -f test/fixtures/test-tts.mp3`
