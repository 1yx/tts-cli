# Design: Simplify CLI Structure

## Context

当前 tts-cli 使用 citty 子命令系统，虽然功能完整但对于一个单一用途的转换工具来说过于复杂。用户需要记住 `convert` 这个抽象概念，而实际上他们只是想把一个 Markdown 文件转换成 MP3。

**当前结构：**
```
tts-cli (main)
├── convert (subcommand, auto-injected)
└── config (subcommand)
    ├── --edit
    ├── --reset
    └── (default: print config)
```

**目标：**
```
tts-cli <input> [options]
```

直接、简单、符合 Unix 单一职责工具哲学。

---

## Goals / Non-Goals

**Goals:**
- 移除子命令系统，使用直接的主命令
- 移除 `config` 管理命令，让用户直接编辑配置文件
- 简化首次运行体验，只问必需信息
- 配置文件只保存非默认值
- 固定输出格式（play=PCM, save=MP3）

**Non-Goals:**
- 不添加新的配置管理方式（用户直接编辑文件）
- 不保留 `--format` 参数（格式由使用场景固定）
- 不保留 `convert` 子命令别名

---

## Decisions

### 1. 主命令结构

**决策：** 移除 citty 子命令，使用单一主命令

**实现：**
- 删除 `src/cli.ts`
- 在 `src/index.ts` 中直接定义 citty 主命令
- 移除子命令注入逻辑

**理由：** 对于单一用途工具，直接主命令更简单直观。

**替代方案：** 保留 citty 但只定义一个主命令（也可以，但当前设计已经使用了子命令）

### 2. 配置文件管理

**决策：** 完全移除 config 子命令

**实现：**
- 删除 `src/commands/config.ts`
- 用户通过文本编辑器直接修改 `~/.config/tts-cli/config.toml`
- README 中说明配置文件路径和格式

**理由：**
- 减少代码维护负担
- 用户已有编辑器，不需要额外的命令
- 配置文件是 TOML 格式，易于编辑

**替代方案：** 添加 `--config` 参数打开编辑器（被拒绝，因为仍需要代码）

### 3. 首次运行简化

**决策：** Setup 只询问 app_id 和 token

**实现：**
- 修改 `src/setup.ts`，只调用两个 text prompt
- 移除 voice 和 speed 的询问

**理由：**
- 加快首次运行流程
- 这些配置有合理的默认值
- 用户后续可以手动添加

**替代方案：** 保留所有问题但标记为可选（被拒绝，仍然增加了复杂度）

### 4. 极简配置文件

**决策：** 只保存与默认值不同的配置

**实现：**
- 修改 `src/config.ts` 中的 `saveConfig` 函数
- 只保存 api.app_id 和 api.token（非空/非默认）
- 如果用户后来手动添加了其他配置，也能正常工作

**理由：**
- 配置文件更清晰
- 避免存储冗余的默认值
- 更容易看出用户改了什么

**示例：**
```toml
# 简化后的配置文件
[api]
app_id = "xxx"
token = "xxx"
```

### 5. 固定输出格式

**决策：** 移除 `--format` 参数

**实现：**
- 从 CLI 参数定义中移除 `format`
- 从 TTSOptions 接口中移除 `format`
- `runPlayMode` 硬编码使用 `pcm`
- `runDownloadMode` 硬编码使用 `mp3`

**理由：**
- Play 模式必须用 PCM 才能流式播放
- MP3 是最通用的音频格式
- 减少用户选择负担

**替代方案：** 保留 `--format` 但文档推荐使用默认值（被拒绝，仍然增加复杂度）

---

## Risks / Trade-offs

### 风险：用户不知道如何修改配置

**缓解：**
- README 中清晰说明配置文件路径和格式
- 首次运行时提示配置文件位置
- 错误信息中包含配置文件路径

### 风险：移除子命令是破坏性变更

**缓解：**
- 在 README 中更新所有使用示例
- 用户需要适应新的命令语法
- 旧版本可能有缓存的问题（通过版本号管理解决）

### 风险：Setup 过于简化可能导致用户不知道如何修改其他配置

**缓解：**
- 在 README 中添加 "高级配置" 章节
- 示例配置文件展示所有可配置项
- 用户有需求时可以手动添加

### 权衡：代码简化 vs 功能便利性

**选择：** 优先代码简化和用户体验直觉性，牺牲部分高级功能的便利性。

---

## Migration Plan

### 部署步骤

1. 修改 `src/index.ts` - 移除子命令注入，定义主命令
2. 删除 `src/cli.ts`
3. 删除 `src/commands/config.ts` 和 `src/commands/convert.ts`
4. 修改 `src/setup.ts` - 简化为只问两个问题
5. 修改 `src/config.ts` - 实现极简配置保存
6. 修改 `src/tts.ts` - 移除 format 参数，硬编码格式
7. 更新 README.md - 新的命令语法和配置说明

### 回滚策略

通过 git 可以随时回滚到使用子命令的版本。如果用户反馈强烈，可以考虑：
- 添加 `convert` 作为 `tts-cli convert` 的别名
- 添加 `tts-cli --config` 作为打开配置文件的快捷方式

---

## Open Questions

1. **是否需要添加 `tts-cli --version` 参数？**
   - 建议：有则更好，符合 CLI 工具惯例

2. **配置文件路径在错误信息中如何提示？**
   - 建议：在所有涉及配置的错误信息中包含完整路径

3. **是否需要保留环境变量支持？**
   - 建议：暂时不支持，用户可以后续提出需求
