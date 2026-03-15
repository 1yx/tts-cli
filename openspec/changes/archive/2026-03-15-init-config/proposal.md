# Proposal: init-config

## Why

tts-cli 需要存储 API 凭证和用户偏好（音色、语速、音量等）。这些配置应该持久化在用户目录中，避免每次运行都重复传入参数。

首次运行时用户可能完全不了解配置结构，需要一个交互式引导流程帮助用户完成初始化，而不是直接报错退出。

## What Changes

- 新增 `~/.config/tts-cli/config.toml` 配置文件，结构分为三个 section：`[api]`、`[tts]`、`[output]`
- 实现三层配置合并优先级：默认值 < 配置文件 < CLI 参数
- 首次运行（配置文件不存在）时，自动触发 `@clack/prompts` 交互式引导：
  - 第一步：检测 ffmpeg 是否安装，未安装则展示各平台安装命令并等待用户确认
  - 第二步：引导填写 `app_id`、`token`、默认音色、默认语速
  - 完成后写入配置文件
- `tts-cli config` 子命令：查看当前配置
- `tts-cli config --edit`：用系统默认编辑器打开配置文件
- `tts-cli config --reset`：重新触发交互式引导

## Impact

- 新增 `src/config.ts`：配置读写、三层合并逻辑
- 新增 `src/setup.ts`：首次引导流程
- 新增 `src/cli.ts` 中的 `config` 子命令定义
- 依赖：`smol-toml`（TOML 解析）、`@clack/prompts`（交互式 UI）
