# Tests: play-mode

## 单元测试 `test/unit/utils.test.ts`

### convertPCMtoMP3()
- [ ] mock `spawnSync`，验证 ffmpeg 被以正确参数调用（`-f s16le`、`-ar <sampleRate>`、`-ac 1`、`-y`）
- [ ] `sampleRate` 参数正确传入 `-ar`
- [ ] `spawnSync` 返回非 0 status 时抛出包含 stderr 的错误

### spawnFfplay()
- [ ] mock `spawn`，验证 ffplay 以正确参数启动（`-f s16le`、`-ar`、`-ac 1`、`-nodisp`、`-autoexit`、`-`）
- [ ] stdin 为 `pipe`，stdout / stderr 为 `ignore`
- [ ] `-ar` 值与传入的 `sampleRate` 一致

---

## 集成测试 `test/integration/play-mode.test.ts`

### play + save 模式（mock fetch + mock spawn）

构造与 download-mode 相同的模拟流式响应：

- [ ] 每个音频 chunk 在被写入 ffplay stdin 的同时，也被累积到 pcmChunks buffer
- [ ] 流结束后 `player.stdin.end()` 被调用
- [ ] `convertPCMtoMP3` 在 ffplay `close` 事件触发**之后**才被调用（验证时序）
- [ ] 转码传入的 PCM 数据与累积的 buffer 一致
- [ ] 转码完成后打印保存路径提示

### play-only 模式（`--no-save`）
- [ ] 音频 chunk 写入 ffplay stdin
- [ ] `pcmChunks` 不累积（save 为 false）
- [ ] `convertPCMtoMP3` 不被调用
- [ ] ffplay 退出后进程正常结束，无文件写入

### 参数校验
- [ ] 单独使用 `--no-save`（不带 `--play`）时，打印错误提示并退出，不发起 API 请求
- [ ] `--play` 模式下 `--format` 参数被忽略，API 请求格式强制为 `pcm`

### 采样率一致性
- [ ] `config.tts.sample_rate = 16000` 时，ffplay `-ar` 和 API payload `sample_rate` 均为 `16000`

---

## E2E 测试 `test/e2e/play.test.ts`

> 需要环境变量 `MYTTS_APP_ID` 和 `MYTTS_TOKEN`，需要系统已安装 ffmpeg。

- [ ] `--play --no-save`：ffplay 进程正常启动并退出，无文件生成
- [ ] `--play`：播放结束后 MP3 文件正确生成，文件大小 > 0
- [ ] 验证 MP3 文件是在 ffplay 进程退出后才写入（通过文件 mtime 和进程退出时间对比）
