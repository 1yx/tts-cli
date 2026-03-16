## Why

当前 `--play` 和 `--output` 参数的行为不一致且容易让用户困惑：

1. **语义不清**：`--play` 既控制是否播放，又控制是否保存（当无 `--output` 时不保存）
2. **默认行为模糊**：无参数时默认下载，但配置文件中有个 `output.dir` 选项可能导致混淆
3. **重复生成问题**：每次运行都会重新调用 API，即使目标文件已存在
4. **路径支持不完整**：`--output` 不支持指定文件夹，必须指定完整文件路径

这导致用户体验不佳，需要重新设计参数语义和行为逻辑。

## What Changes

### 新增参数

- `--force`: 强制覆盖已存在的输出文件，忽略文件存在检查

### 修改行为

- **默认行为（无参数）**：总是保存 MP3，无 `--play` 时只生成不播放
- **`--play` 参数**：仅控制是否播放，不再控制是否保存（总是保存）
- **`--output` 参数**：支持文件路径或文件夹路径（使用 `fs.stat()` 检测）
  - 文件路径：保存到指定文件
  - 文件夹路径：保存到 `文件夹/输入文件名.mp3`
- **文件存在检测**：
  - 无 `--play` 且文件存在：提示已存在并退出
  - 有 `--play` 且文件存在：直接播放本地 MP3（不重新生成）
  - 有 `--force`：忽略文件存在检测，强制重新生成

### 配置文件变更

- **删除** `[output]` section 中的 `dir` 字段
- **更新** `Config` interface 移除 `output.dir`
- **更新** `DEFAULTS` 移除 `output.dir` 默认值

### 播放模式变更

- **删除**"只播放不保存"模式
- **新增**直接播放本地 MP3 功能（当 `--play` 且文件已存在时）

## Capabilities

### New Capabilities

- `force-overwrite`: 强制覆盖已存在文件的机制
- `local-playback`: 直接播放本地已生成的 MP3 文件
- `folder-output`: `--output` 支持文件夹路径

### Modified Capabilities

- `cli-args`: CLI 参数语义重新定义（`--play` 行为变更）
- `config`: 配置文件结构变更（删除 `output.dir`）
- `output-resolution`: 输出路径解析逻辑变更（支持文件夹检测）

## Impact

- **CLI 参数定义** (`src/index.ts`): 添加 `--force` 参数，更新 `--play` 和 `--output` 描述
- **配置模块** (`src/config.ts`): 删除 `output.dir` 相关代码
- **路径解析** (`src/markdown.ts`): 更新 `resolveOutputPath()` 支持文件夹检测
- **运行模式** (`src/tts.ts`):
  - `runPlayMode()`: 总是保存，移除 `save` 参数控制
  - 添加文件存在检测逻辑
  - 添加直接播放本地 MP3 功能
- **文档** (`CLAUDE.md`, `README.md`): 更新参数说明和行为表格
