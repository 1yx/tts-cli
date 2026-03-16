## 1. 创建 APIError 类

- [x] 1.1 创建 `src/errors.ts` 文件
- [x] 1.2 定义 `APIError` 类，继承 `Error`
- [x] 1.3 添加 `code`、`message`、`type` 属性
- [x] 1.4 实现错误类型映射函数（根据错误码返回类型）

## 2. 修改 tts.ts 错误处理

- [x] 2.1 导入 `APIError` 类
- [x] 2.2 修改 `checkAPIErrorResponse` 函数，抛出 `APIError` 而不是普通 `Error`
- [x] 2.3 添加错误类型检测逻辑

## 3. 添加 CLI 层错误捕获

- [x] 3.1 在 `runConvert` 函数中添加 try-catch 块
- [x] 3.2 在 `runPlayMode` 相关调用处添加 try-catch 块
- [x] 3.3 实现 `APIError` 识别和友好显示逻辑
- [x] 3.4 添加针对不同错误类型的建议消息

## 4. 测试验证

- [x] 4.1 测试配额超限错误（45000292）的显示
- [x] 4.2 测试鉴权失败错误（45000000）的显示
- [x] 4.3 测试其他类型错误的堆栈显示
- [x] 4.4 验证下载模式和播放模式的错误处理
