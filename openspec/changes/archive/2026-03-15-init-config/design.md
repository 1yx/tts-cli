# Design: init-config

## 技术决策

### 1. 配置文件格式选用 TOML

TOML 相比 JSON 支持注释，相比 YAML 语法更简单不易出错，适合作为用户手动编辑的配置文件格式。使用 `smol-toml` 库，体积小、零依赖、Bun 兼容良好。

### 2. 配置文件路径遵循 XDG 规范

路径固定为 `~/.config/tts-cli/config.toml`，符合 Linux/macOS 的 XDG Base Directory 规范，Windows 下使用 `%APPDATA%\tts-cli\config.toml`。

```typescript
import { homedir } from 'os';
import { join } from 'path';

function getConfigDir(): string {
  if (process.platform === 'win32') {
    return join(process.env.APPDATA ?? homedir(), 'tts-cli');
  }
  return join(homedir(), '.config', 'tts-cli');
}

const CONFIG_PATH = join(getConfigDir(), 'config.toml');
```

### 3. 三层配置合并采用深度合并策略

```typescript
export interface Config {
  api: {
    app_id: string;
    token: string;
  };
  tts: {
    voice: string;
    model: string;
    speed: number;
    volume: number;
    sample_rate: number;
    bit_rate: number;
    format: 'mp3' | 'pcm' | 'ogg_opus';
    lang: string;
  };
  output: {
    dir: string;
  };
}

const DEFAULTS: Config = {
  api: { app_id: '', token: '' },
  tts: {
    voice: 'zh_female_tianmei',
    model: 'seed-tts-1.1',
    speed: 0,
    volume: 0,
    sample_rate: 24000,
    bit_rate: 128000,
    format: 'mp3',
    lang: 'zh-cn',
  },
  output: { dir: '~/Downloads' },
};

export function loadConfig(cliOverrides: Partial<Config> = {}): Config {
  const fileConfig = readConfigFile() ?? {};
  return deepMerge(DEFAULTS, fileConfig, cliOverrides);
}
```

CLI 参数为 `undefined` 时不覆盖配置文件值，配置文件缺失字段时回退到默认值。

### 4. 交互式引导使用 @clack/prompts

`@clack/prompts` 提供美观的终端 UI，支持 `intro`、`text`、`outro` 等原语，Token 输入使用 `mask: true` 遮蔽显示。

```typescript
import { intro, text, outro, isCancel } from '@clack/prompts';

export async function runSetup(): Promise<void> {
  intro('Welcome to tts-cli 🎙️');

  const app_id = await text({ message: 'Doubao app_id:' });
  if (isCancel(app_id)) process.exit(0);

  const token = await text({ message: 'Doubao token:', mask: true });
  if (isCancel(token)) process.exit(0);

  const voice = await text({
    message: 'Default voice:',
    placeholder: DEFAULTS.tts.voice,
    defaultValue: DEFAULTS.tts.voice,
  });

  saveConfig({
    ...DEFAULTS,
    api: { app_id, token },
    tts: { ...DEFAULTS.tts, voice },
  });
  outro('✓ Config saved to ' + CONFIG_PATH);
}
```

用户按 Ctrl+C 取消时优雅退出，不产生残留配置文件。

### 5. config 子命令的 --edit 使用系统默认编辑器

```typescript
import { execSync } from 'child_process';

const editor = process.env.EDITOR ?? process.env.VISUAL ?? 'vi';
execSync(`${editor} ${CONFIG_PATH}`, { stdio: 'inherit' });
```

## 文件结构

```
src/
├── config.ts   # loadConfig(), saveConfig(), CONFIG_PATH, DEFAULTS, Config 类型
└── setup.ts    # runSetup()，首次引导流程
```
