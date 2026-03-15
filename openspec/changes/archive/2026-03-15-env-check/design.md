# Design: env-check

## 技术决策

### 1. 使用 Bun.which() 检测命令是否存在

Bun 内置 `Bun.which()` 可以在 PATH 中查找可执行文件，返回完整路径或 `null`，无需引入额外依赖，跨平台一致。

```typescript
export function hasFfmpeg(): boolean {
  return Bun.which('ffmpeg') !== null
}

export function hasFfplay(): boolean {
  return Bun.which('ffplay') !== null
}
```

### 2. 检测时机分为两个阶段

**阶段一：首次引导时**（`src/setup.ts`）

在引导第一步主动检测，若未安装则展示安装指引，等待用户确认后继续配置。用户可以先跳过安装，后续使用 `--play` 时再报错。

**阶段二：运行时按需检测**（`src/tts.ts`）

仅在需要 ffmpeg 的模式下检测：

```typescript
export function assertFfmpeg(mode: 'play-save' | 'play-only'): void {
  if (!hasFfmpeg()) {
    console.error(formatFfmpegError())
    process.exit(1)
  }
}
```

只下载模式（默认）完全不检测，不阻塞不依赖 ffmpeg 的用户。

### 3. 安装指引按平台动态生成

```typescript
export function getInstallGuide(): string {
  const guides: Record<string, string> = {
    darwin:  '  macOS:    brew install ffmpeg',
    linux:   '  Ubuntu:   sudo apt install ffmpeg',
    win32:   '  Windows:  winget install ffmpeg\n' +
             '            或访问 https://ffmpeg.org/download.html',
  }
  return guides[process.platform] ?? guides['linux']
}
```

### 4. 运行时报错格式统一

```typescript
export function formatFfmpegError(): string {
  return `
✗ 未检测到 ffmpeg，--play 模式需要 ffmpeg。

  安装方法：
${getInstallGuide()}

  如果只想下载不播放，直接运行：
    tts-cli input.md
`.trim()
}
```

### 5. 各场景依赖需求

| 场景 | 检测内容 |
|---|---|
| 默认下载模式 | 不检测 |
| `--play --no-save` | 检测 ffmpeg（需要 ffplay）|
| `--play`（保存）| 检测 ffmpeg（需要 ffplay + ffmpeg 转码）|

ffplay 和 ffmpeg 同属一个安装包，检测 ffmpeg 即可覆盖两者。

## 文件结构

```
src/
└── env.ts   # hasFfmpeg(), hasFfplay(), getInstallGuide(), formatFfmpegError(), assertFfmpeg()
```
