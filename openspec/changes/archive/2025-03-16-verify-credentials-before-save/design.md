## Context

**当前状态：** 首次运行时，`runSetup()` 函数在收集用户凭证后立即调用 `saveConfig()`，然后返回。主流程继续执行命令，如果 API 凭证无效，用户会收到错误提示，但无效凭证已经被持久化到配置文件。

**问题根源：** 配置保存和 API 验证发生在同一调用链的不同阶段，没有反馈机制告知保存是否应该执行。

**约束条件：**
- 不能在 `setup.ts` 中直接调用 TTS API（模块职责分离）
- `runSetup()` 函数在 `main()` 函数中被调用，需要返回凭证而非直接保存
- 首次运行后，配置文件仍按原逻辑工作（不影响已有用户）

## Goals / Non-Goals

**Goals:**
- 首次运行时，凭证只存在于内存中
- 只有 API 调用成功后才将凭证写入配置文件
- API 失败时显示清晰的错误，不保存任何配置
- 保持向后兼容——已有配置文件的用户行为不变

**Non-Goals:**
- 不实现 `tts-cli config` 子命令（--edit、--reset）
- 不改变已有配置文件用户的流程
- 不在 setup 模块中调用 TTS API

## Decisions

### 1. setup 模块拆分：分离收集和保存

**决策：** 将 `runSetup()` 拆分为两个函数

```typescript
// 新增：收集凭证，返回对象
export async function collectCredentials(): Promise<{
  app_id: string;
  token: string;
}> {
  // ... 交互式逻辑 ...
}

// 保留向后兼容：内部调用 collectCredentials + 保存
export async function runSetup(): Promise<void> {
  const creds = await collectCredentials();
  await saveConfig({ ...DEFAULTS, api: creds });
}
```

**理由：**
- `runSetup()` 保留向后兼容性（虽然当前无外部调用）
- `collectCredentials()` 职责单一，便于测试和复用
- 清晰的函数命名区分行为

### 2. main 函数持有内存凭证

**决策：** 首次运行时，main 函数收集凭证但暂不保存，在命令执行成功后才保存

```typescript
async function main() {
  let firstRunCredentials: { app_id: string; token: string } | null = null;

  if (!existsSync(CONFIG_PATH)) {
    // 收集凭证到内存（不保存）
    firstRunCredentials = await collectCredentials();
  }

  // 执行命令（使用内存凭证）
  await runMain(mainCommand);

  // 命令执行到这里 = 成功，保存凭证
  if (firstRunCredentials) {
    await saveConfig({ ...DEFAULTS, api: firstRunCredentials });
    outro(`✓ Credentials saved to ${CONFIG_PATH}`);
  }
}
```

**理由：**
- main 函数控制完整流程，最清楚何时应该保存
- 错误处理：`runMain()` 内部的 catch 会阻止保存
- 简单直接，无需额外的状态管理

### 3. loadConfig 支持内存凭证

**决策：** 扩展 `loadConfig()` 函数签名，支持传入内存凭证

```typescript
export async function loadConfig(
  cliOverrides?: ConfigOverrides,
  inMemoryCredentials?: { app_id: string; token: string }
): Promise<Config> {
  // 如果有内存凭证，优先使用
  if (inMemoryCredentials) {
    return {
      ...DEFAULTS,
      api: inMemoryCredentials,
      tts: DEFAULTS.tts,
    };
  }

  // 原有逻辑：从文件读取...
}
```

**理由：**
- 最小侵入性：不改变核心合并逻辑
- 内存凭证优先级最高（覆盖文件、环境变量、CLI 参数）
- 向后兼容：第二个参数可选

### 4. 命令执行成功检测

**决策：** 依赖现有的错误处理机制——如果 `runMain()` 抛出异常，`main()` 的 catch 块会阻止保存

```typescript
try {
  await runMain(mainCommand);
  // 执行到这里 = 成功
  if (firstRunCredentials) {
    await saveConfig(...);
  }
} catch (err) {
  // 错误处理：不保存配置
  log.error(err.message);
  process.exit(1);
}
```

**理由：**
- 利用现有的 try/catch 结构
- 无需额外的成功标志传递
- 简单可靠

## Risks / Trade-offs

### Risk 1: API 错误但凭证有效

**场景：** API 返回错误但凭证本身是正确的（如配额超限、网络问题）

**影响：** 用户需要重新输入凭证

**缓解措施：** 错误信息中明确显示当前凭证，用户可以快速复制粘贴重试

### Risk 2: 命令执行到一半失败

**场景：** API 调用成功，但后续步骤（如文件写入）失败

**影响：** 配置已保存，但命令未完成

**缓解措施：** 这是合理行为——凭证验证成功就应该保存。后续失败属于其他问题。

### Risk 3: 用户多次失败

**场景：** 用户反复输入错误凭证

**影响：** 每次都需要重新运行命令

**缓解措施：** 错误提示中清晰显示问题，用户修正后一次成功即可

## Migration Plan

**部署步骤：**
1. 更新 `src/setup.ts`：添加 `collectCredentials()` 函数
2. 更新 `src/index.ts`：修改 main 函数首次运行流程
3. 更新 `src/config.ts`：扩展 `loadConfig()` 函数签名
4. 测试首次运行流程（交互式、CLI 参数、环境变量）

**回滚策略：**
- Git revert 即可完全回滚
- 无数据迁移（配置文件格式不变）

## Open Questions

1. **是否需要"跳过验证"选项？** 如果用户希望先保存配置再验证？
   - **倾向：** 不需要。首次运行验证是合理的默认行为。

2. **环境变量路径是否也需要验证？**
   - **当前决策：** 是的，统一处理。首次运行时环境变量也视为"内存凭证"。
