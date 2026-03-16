# config Specification Delta

## REMOVED Requirements

### Requirement: 配置文件格式

**Reason**: `output.dir` 配置项未被使用，为简化配置而删除

**Migration**: 无需迁移，`loadConfig()` 会安全忽略未知字段。旧配置文件中的 `[output]` section 会被保留但 `dir` 字段不再被读取。

---

## MODIFIED Requirements

### Requirement: 配置文件格式

系统 SHALL 使用 TOML 格式存储配置文件。

#### Scenario: 配置文件结构

- GIVEN 配置文件存在
- WHEN 系统读取配置
- THEN 文件包含 `[api]`、`[tts]` 两个 section
- AND 不再包含 `[output]` section
- AND 文件支持注释，人类可读可编辑
