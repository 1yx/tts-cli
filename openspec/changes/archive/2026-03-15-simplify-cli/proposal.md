# Proposal: Simplify CLI Structure

## Why

当前 tts-cli 使用了 citty 子命令系统，但这是一个简单的单一职责工具。子命令增加了不必要的复杂度：

- 用户需要记住 `tts-cli convert` 而不是直接 `tts-cli input.md`
- `config` 子命令提供了编辑/重置配置的功能，但这些可以通过直接编辑配置文件实现
- 对于单一用途工具，直接的主命令更符合 Unix 哲学

简化后的体验更直观、更易用。

## What Changes

### 移除的功能

- **BREAKING**: 移除 `convert` 子命令，改为直接主命令
- **BREAKING**: 移除 `config` 子命令及其所有功能（`--edit`, `--reset`, 打印配置）
- **BREAKING**: 移除 `--format` 参数，格式固定为：play 模式用 PCM，保存模式用 MP3

### 简化的首次运行体验

- Setup 只询问必需的 `app_id` 和 `token`
- 其他配置（音色、语速等）使用硬编码默认值
- 用户需要时可以手动编辑配置文件

### 极简配置文件

- 配置文件只保存与默认值不同的配置项
- 默认配置（`speed: 0`, `volume: 0`, `sample_rate: 24000` 等）不写入文件
- 配置文件路径：`~/.config/tts-cli/config.toml`（遵循 XDG Config 规范）

## Capabilities

### Modified Capabilities

- **cli-interface**: CLI 参数结构和子命令组织

## Impact

### 代码结构

- 删除 `src/cli.ts`（citty 子命令定义）
- 删除 `src/commands/config.ts`
- 删除 `src/commands/convert.ts`
- 简化 `src/index.ts`（移除子命令注入逻辑）
- 简化 `src/setup.ts`（只问 app_id 和 token）
- 修改 `src/config.ts`（实现极简配置保存）

### 用户体验

- **更直观的命令**: `tts-cli input.md` 而非 `tts-cli convert input.md`
- **更快的首次运行**: 只问两个问题
- **更清晰的配置文件**: 只包含用户改过的值

### 向后兼容

- **BREAKING**: 旧的 `tts-cli convert` 语法不再支持
- **BREAKING**: `tts-cli config` 命令不再支持
- **BREAKING**: `--format` 参数不再支持
- 用户需要删除旧配置或重新运行 setup（会自动覆盖）

### 配置格式

- 旧配置文件仍然有效（loadConfig 会合并默认值）
- 新配置文件只包含 api 部分
