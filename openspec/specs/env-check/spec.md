# env-check Specification

## Purpose

检测 tts-cli 运行所需的外部依赖（ffmpeg），在首次引导和运行时提供清晰的安装指引，避免用户遇到难以理解的底层错误。

## Requirements

### Requirement: ffmpeg 为唯一外部依赖

系统 SHALL 仅依赖 ffmpeg 作为外部工具，通过 ffmpeg 附带的 ffplay 实现播放，通过 ffmpeg 实现转码。

#### Scenario: ffmpeg 覆盖所有功能

- GIVEN 系统已安装 ffmpeg
- WHEN 用户使用任意功能（下载、播放、转码）
- THEN 所有功能均可正常运行，无需安装其他工具

---

### Requirement: 按需检测，不阻塞无关功能

系统 SHALL 仅在需要 ffmpeg 的模式下进行检测，不影响不依赖 ffmpeg 的默认下载模式。

#### Scenario: 默认下载模式不检测

- GIVEN 系统未安装 ffmpeg
- WHEN 用户运行 `tts-cli input.md`（默认下载模式）
- THEN 系统正常运行，不报告 ffmpeg 缺失

#### Scenario: play 模式检测 ffmpeg

- GIVEN 系统未安装 ffmpeg
- WHEN 用户运行 `tts-cli input.md --play`
- THEN 系统检测到 ffmpeg 缺失
- AND 打印友好错误提示及安装命令
- AND 进程退出，不发起 API 请求

---

### Requirement: 分平台安装指引

系统 SHALL 根据当前操作系统提供对应的 ffmpeg 安装命令。

#### Scenario: macOS 安装指引

- GIVEN 系统平台为 macOS
- WHEN 显示安装指引
- THEN 展示 `brew install ffmpeg`

#### Scenario: Linux 安装指引

- GIVEN 系统平台为 Linux
- WHEN 显示安装指引
- THEN 展示 `sudo apt install ffmpeg`

#### Scenario: Windows 安装指引

- GIVEN 系统平台为 Windows
- WHEN 显示安装指引
- THEN 展示 `winget install ffmpeg` 及官网下载链接

---

### Requirement: 首次引导中的环境检测

系统 SHALL 在首次引导的第一步检测 ffmpeg，并展示检测结果。

#### Scenario: ffmpeg 已安装

- GIVEN 首次运行引导
- AND ffmpeg 已安装
- WHEN 执行环境检测步骤
- THEN 显示 `✓ ffmpeg 已安装`
- AND 自动进入下一步配置

#### Scenario: ffmpeg 未安装

- GIVEN 首次运行引导
- AND ffmpeg 未安装
- WHEN 执行环境检测步骤
- THEN 显示 `✗ ffmpeg 未检测到`
- AND 展示分平台安装命令
- AND 等待用户确认后继续
- AND 用户可选择跳过，引导继续（运行时再检测）
