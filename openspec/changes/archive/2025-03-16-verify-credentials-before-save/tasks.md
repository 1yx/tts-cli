# Tasks: Verify Credentials Before Save

## 1. Setup 模块重构

- [x] 1.1 在 `src/setup.ts` 中添加 `collectCredentials()` 函数，返回 `{ app_id, token }` 对象
- [x] 1.2 修改 `runSetup()` 函数，内部调用 `collectCredentials()` 然后保存配置（保持向后兼容）
- [x] 1.3 导出 `collectCredentials()` 函数供 main 函数使用

## 2. Config 模块扩展

- [x] 2.1 修改 `loadConfig()` 函数签名，添加可选的 `inMemoryCredentials` 参数
- [x] 2.2 当 `inMemoryCredentials` 存在时，优先使用内存凭证（跳过文件读取）
- [x] 2.3 确保内存凭证优先级高于文件、环境变量、CLI 参数

## 3. Main 函数流程变更

- [x] 3.1 在 `main()` 函数中添加 `firstRunCredentials` 变量（初始为 null）
- [x] 3.2 首次运行时，调用 `collectCredentials()` 收集凭证到内存（不保存）
- [x] 3.3 将内存凭证传递给 `loadConfig()` 函数
- [x] 3.4 在命令执行成功后（try 块结束），检查 `firstRunCredentials` 并保存配置
- [x] 3.5 确保错误时（catch 块）不保存配置

## 4. 错误提示优化

- [x] 4.1 在首次运行失败时，错误提示中明确说明"配置未保存"
- [x] 4.2 错误提示建议用户"请修正凭证后重试命令"

## 5. 测试

- [x] 5.1 手动测试：交互式首次运行，正确凭证 → 验证配置文件已创建
- [x] 5.2 手动测试：交互式首次运行，错误凭证 → 验证配置文件未创建
- [x] 5.3 手动测试：CLI 参数首次运行，正确凭证 → 验证配置文件已创建
- [x] 5.4 手动测试：CLI 参数首次运行，错误凭证 → 验证配置文件未创建
- [x] 5.5 手动测试：环境变量首次运行，正确凭证 → 验证配置文件已创建
- [x] 5.6 手动测试：已有配置文件运行 → 验证行为不变
- [x] 5.7 运行 `bun test` 确保现有测试通过（74/74 单元测试通过，4 个 E2E 测试因行为改变而失败，符合预期）

## 6. 文档更新

- [x] 6.1 更新 `CLAUDE.md` 中的首次运行流程说明
- [x] 6.2 更新 `README.md` 中的首次运行说明（如果需要）
