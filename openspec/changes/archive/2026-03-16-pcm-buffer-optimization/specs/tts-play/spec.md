# tts-play Specification Delta

优化 `--play` 模式的内存占用和进程管理。

## ADDED Requirements

### Requirement: 内存占用限制

系统 SHALL 限制 `--play` 模式的内存占用，防止长音频导致内存溢出。

#### Scenario: 长音频内存控制

- GIVEN 用户运行 `tts-cli long-text.md --play`
- AND 音频时长超过 10 分钟
- WHEN 系统接收 PCM chunk 并写入临时文件
- THEN 内存占用保持在 ~64KB (Node.js WriteStream 缓冲区)
- AND chunk 立即写入临时文件，不累积在内存

#### Scenario: 内存占用恒定

- GIVEN `--play` 模式正在处理 1 小时音频
- WHEN 系统持续写入临时文件
- THEN 内存占用保持恒定（~64KB）
- AND 不会随着音频长度线性增长

### Requirement: Ctrl+C 信号处理

系统 SHALL 监听 SIGINT (Ctrl+C) 和 SIGTERM 信号，正确清理资源后退出。

#### Scenario: 用户中断播放

- GIVEN 用户运行 `tts-cli input.md --play`
- AND 音频正在播放中
- WHEN 用户按下 Ctrl+C (SIGINT 信号)
- THEN 系统停止 HTTP 流接收
- AND 终止 ffplay 进程（使用 SIGTERM 优雅终止）
- AND 删除所有临时文件
- AND 不保存 MP3 文件（中断 = 放弃）
- AND 进程以退出码 130 退出

#### Scenario: 正常完成播放

- GIVEN `--play` 模式正在播放音频
- AND 音频播放完成，API 流结束
- WHEN 系统完成 MP3 转码
- THEN 保存 MP3 文件
- AND 删除所有临时文件
- AND 打印成功消息

#### Scenario: 信号处理残留进程清理

- GIVEN ffplay 进程正在运行
- WHEN 主进程收到 SIGTERM 信号
- THEN 向 ffplay 发送 SIGTERM 信号
- AND 等待 ffplay 进程退出（最多 5 秒）
- AND 如果 ffplay 未退出，发送 SIGKILL 强制终止

### Requirement: 临时文件管理

系统 SHALL 正确管理临时 PCM 文件，包括创建、命名、转码和清理。

#### Scenario: 临时文件命名

- GIVEN 系统使用 WriteStream 写入模式
- WHEN 创建临时文件
- THEN 文件命名为 `output.temp.raw`（单一文件）

#### Scenario: 临时文件转码

- GIVEN `--play` 模式创建了临时 PCM 文件
- WHEN 音频播放完成
- THEN 使用 ffmpeg 直接转码临时文件
- AND 输入格式为 s16le PCM (16-bit little-endian)
- AND 采样率为 24000 Hz
- AND 输出为 MP3 格式

#### Scenario: 临时文件清理

- GIVEN MP3 文件转码完成
- WHEN 系统保存 MP3 文件
- THEN 删除临时 `.temp.raw` 文件

#### Scenario: 中断时清理临时文件

- GIVEN 系统创建了临时文件
- WHEN 用户按下 Ctrl+C 或进程异常退出
- THEN 删除临时文件
- AND 不残留垃圾文件

## MODIFIED Requirements

### Requirement: 边播边存模式

修改：系统 SHALL 支持在合成音频的同时实时播放，播放完成后将音频保存为 MP3。所有 `--play` 模式都会保存文件。**内存占用通过 WriteStream 临时文件写入进行优化。**

#### Scenario: --play 模式完整流程（文件不存在）- MODIFIED

- GIVEN 用户运行 `tts-cli input.md --play`
- AND 输出文件不存在
- WHEN 系统请求 API（强制 PCM 格式）
- THEN 每个音频 chunk 实时写入 ffplay stdin（立即播放）
- AND 同时并行写入临时文件 (`output.temp.raw`)
- WHEN 流接收完毕
- THEN 等待 ffplay 进程真正退出（播放完全结束）
- AND 等待 WriteStream 完成写入
- AND 将临时 PCM 文件通过 ffmpeg 转码为 MP3
- AND 保存到本地
- AND 删除临时文件
- AND 打印 `◆ 已保存到 <outputPath>`

#### Scenario: 转码在播放结束后才执行 - MODIFIED

修改：添加临时文件写入步骤。

- GIVEN `--play` 模式转换进行中
- WHEN 流数据接收完毕但 ffplay 仍在播放缓冲区内容
- THEN 系统等待 ffplay 进程退出
- AND 等待 WriteStream.finish 事件
- AND 不提前触发转码或打印保存提示
- **WHEN ffplay 进程退出且 WriteStream 完成**
- **THEN 系统执行临时文件转码**

---

### Requirement: 运行时凭证覆盖 - MODIFIED

修改：添加信号处理上下文。

#### Scenario: 播放模式覆盖凭证 - MODIFIED

修改：添加信号处理不影响凭证覆盖逻辑。

- GIVEN 配置文件中 `app_id = "old_app_id"`
- AND 配置文件中 `token = "old_token"`
- **AND 系统注册了信号处理**
- WHEN 用户运行 `tts-cli input.md --play --appId new_app_id --token new_token`
- THEN 本次播放请求使用 `new_app_id` 和 `new_token`
- AND 配置文件保持不变
- **AND 信号处理不影响凭证覆盖功能**

---

### Requirement: 跨平台播放 - MODIFIED

修改：添加信号处理的跨平台兼容性。

#### Scenario: 播放时不弹出窗口 - MODIFIED

修改：添加信号处理不影响播放行为。

- GIVEN 用户运行 `--play` 模式
- WHEN ffplay 启动
- THEN 不弹出任何 GUI 窗口（`-nodisp` 参数生效）
- AND 播放完成后 ffplay 自动退出（`-autoexit` 参数生效）
- **AND 信号处理能正确终止 ffplay 进程**

---

### Requirement: API 错误处理 - MODIFIED

修改：添加错误时的临时文件清理。

#### Scenario: 播放模式 API 错误 - MODIFIED

修改：添加清理步骤。

- GIVEN 用户运行 `tts-cli input.md --play`
- AND API 返回错误响应
- WHEN 系统检测到错误
- THEN 创建 `APIError`，包含错误码和消息
- AND 不启动 ffplay 进程
- AND 使用 `log.error` 显示格式化错误
- **AND 清理已创建的临时文件（如果有）**
- AND 进程以退出码 1 退出
