- 文档首页
![](https://www.volcengine.com/docs/6561/data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGcgY2xpcC1wYXRoPSJ1cmwoI2NsaXAwXzEwNDdfNDY0MTEpIj4KPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0xMC42NjY3IDQuMDAwMTZDMTEuMDM0OSA0LjAwMDE2IDExLjMzMzMgNC4yOTg2NCAxMS4zMzMzIDQuNjY2ODNWMTQuMDc0MkMxMS4zMzMzIDE0LjQwMTUgMTEuMDU0OCAxNC42NjY4IDEwLjcxMTEgMTQuNjY2OEgyLjYyMjIyQzIuMjc4NTggMTQuNjY2OCAyIDE0LjQwMTUgMiAxNC4wNzQyVjQuNTkyNzZDMiA0LjI2NTQ4IDIuMjc4NTggNC4wMDAxNiAyLjYyMjIyIDQuMDAwMTZIMTAuNjY2N1pNMTAgNS4zMzM1SDMuMzMzMzNWMTMuMzMzNUgxMFY1LjMzMzVaTTEzLjMzMzMgMS4zMzM1QzEzLjcwMTUgMS4zMzM1IDE0IDEuNjMxOTcgMTQgMi4wMDAxNlYxMC4zMzM1QzE0IDEwLjUxNzYgMTMuODUwOCAxMC42NjY4IDEzLjY2NjcgMTAuNjY2OEgxM0MxMi44MTU5IDEwLjY2NjggMTIuNjY2NyAxMC41MTc2IDEyLjY2NjcgMTAuMzMzNVYyLjY2NjgzSDYuMzMzMzNDNi4xNDkyNCAyLjY2NjgzIDYgMi41MTc1OSA2IDIuMzMzNVYxLjY2NjgzQzYgMS40ODI3MyA2LjE0OTI0IDEuMzMzNSA2LjMzMzMzIDEuMzMzNUgxMy4zMzMzWiIgZmlsbD0iIzQyNDY0RSIvPgo8L2c+CjxkZWZzPgo8Y2xpcFBhdGggaWQ9ImNsaXAwXzEwNDdfNDY0MTEiPgo8cmVjdCB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIGZpbGw9IndoaXRlIi8+CjwvY2xpcFBhdGg+CjwvZGVmcz4KPC9zdmc+Cg==)复制全文

[我的收藏](https://www.volcengine.com/docs/favorite)

HTTP Chunked/SSE单向流式\-V3
语音合成大模型API列表 
根据具体场景选择合适的语音合成大模型API。
| **接口** | **推荐场景** | **接口功能** | **文档链接** |
| --- | --- | --- | --- |
| `wss://openspeech.bytedance.com/api/v3/tts/bidirection ` | WebSocket协议，实时交互场景，支持文本实时流式输入，流式输出音频。 | 语音合成、声音复刻、混音 | [V3 WebSocket双向流式文档](https://www.volcengine.com/docs/6561/1329505) |
| `wss://openspeech.bytedance.com/api/v3/tts/unidirectional/stream` | WebSocket协议，一次性输入合成文本，流式输出音频。 | 语音合成、声音复刻、混音 | [V3 WebSocket单向流式文档](https://www.volcengine.com/docs/6561/1719100) |
| `https://openspeech.bytedance.com/api/v3/tts/unidirectional ` | HTTP Chunked协议，一次性输入全部合成文本，流式输出音频。 | 语音合成、声音复刻、混音 | [V3 HTTP Chunked单向流式文档](https://www.volcengine.com/docs/6561/1598757?lang=zh#_2-http-chunked%E6%A0%BC%E5%BC%8F%E6%8E%A5%E5%8F%A3%E8%AF%B4%E6%98%8E) |
| `https://openspeech.bytedance.com/api/v3/tts/unidirectional/sse` | HTTP SSE协议，一次性输入全部合成文本，流式输出音频。 | 语音合成、声音复刻、混音 | [V3 Server Sent Events（SSE）单向流式文档](https://www.volcengine.com/docs/6561/1598757?lang=zh#_3-sse%E6%A0%BC%E5%BC%8F%E6%8E%A5%E5%8F%A3%E8%AF%B4%E6%98%8E) |
1 接口功能 
单向流式API为用户提供文本转语音的能力，支持多语种、多方言，同时支持http协议流式输出。  


## 1\.1最佳实践 
- 客户端读取服务端流式返回的json数据，从中取出对应的音频数据；
- 音频数据返回的是base64格式，需要解析后拼接到字节数组即可组装音频进行播放；
- 可以使用对应编程语言的连接复用组件，避免重复建立tcp连接（火山服务端keep\-alive时间为1分钟），例如python的session组件：
```JSON
session = requests.Session()
response = session.post(url, headers=headers, json=payload, stream=True)

```
2 HTTP Chunked格式接口说明 

## 2\.1 请求Request 

### 请求路径 
- 服务对应的请求路径：`https://openspeech.bytedance.com/api/v3/tts/unidirectional`

### Request Headers 

| Key | 说明 | 是否必须 | Value示例 |
| --- | --- | --- | --- |
| X\-Api\-App\-Id | 使用火山引擎控制台获取的APP ID，可参考 [控制台使用FAQ\-Q1](https://www.volcengine.com/docs/6561/196768#q1%EF%BC%9A%E5%93%AA%E9%87%8C%E5%8F%AF%E4%BB%A5%E8%8E%B7%E5%8F%96%E5%88%B0%E4%BB%A5%E4%B8%8B%E5%8F%82%E6%95%B0appid%EF%BC%8Ccluster%EF%BC%8Ctoken%EF%BC%8Cauthorization-type%EF%BC%8Csecret-key-%EF%BC%9F) | 是 | 123456789 |
| X\-Api\-Access\-Key | 使用火山引擎控制台获取的Access Token，可参考 [控制台使用FAQ\-Q1](https://www.volcengine.com/docs/6561/196768#q1%EF%BC%9A%E5%93%AA%E9%87%8C%E5%8F%AF%E4%BB%A5%E8%8E%B7%E5%8F%96%E5%88%B0%E4%BB%A5%E4%B8%8B%E5%8F%82%E6%95%B0appid%EF%BC%8Ccluster%EF%BC%8Ctoken%EF%BC%8Cauthorization-type%EF%BC%8Csecret-key-%EF%BC%9F) | 是 | your\-access\-key |
| X\-Api\-Resource\-Id | 表示调用服务的资源信息 ID
- 豆包语音合成模型1\.0：  - seed\-tts\-1\.0 或者 volc\.service\_type\.10029（字符版）
  - seed\-tts\-1\.0\-concurr 或者 volc\.service\_type\.10048（并发版）
- 豆包语音合成模型2\.0:  - seed\-tts\-2\.0 \(字符版\)
- 声音复刻：  - seed\-icl\-1\.0（声音复刻1\.0字符版）
  - seed\-icl\-1\.0\-concurr（声音复刻1\.0并发版）
  - seed\-icl\-2\.0 \(声音复刻2\.0字符版\)
**注意：**
- "豆包语音合成模型1\.0"的资源信息ID仅适用于["豆包语音合成模型1\.0"的音色](https://www.volcengine.com/docs/6561/1257544)
- "豆包语音合成模型2\.0"的资源信息ID仅适用于["豆包语音合成模型2\.0"的音色](https://www.volcengine.com/docs/6561/1257544) | 是 | - 豆包语音合成模型1\.0：  - seed\-tts\-1\.0
  - seed\-tts\-1\.0\-concurr
- 豆包语音合成模型2\.0:  - seed\-tts\-2\.0
- 声音复刻：  - seed\-icl\-1\.0（声音复刻1\.0字符版）
  - seed\-icl\-1\.0\-concurr（声音复刻1\.0并发版）
  - seed\-icl\-2\.0 \(声音复刻2\.0字符版\) |
| X\-Api\-Request\-Id | 标识客户端请求ID，uuid随机字符串 | 否 | 67ee89ba\-7050\-4c04\-a3d7\-ac61a63499b3 |
| X\-Control\-Require\-Usage\-Tokens\-Return | 请求消耗的用量返回控制标记。当携带此字段，在合成音频结束时的返回数据中会多一个usage的JSON Object字段，其中包含了所需的用量数据。 | 否 | - 设置为\*，表示返回已支持的用量数据。
- 也设置为具体的用量数据标记，如text\_words；多个用逗号分隔
- 当前已支持的用量数据  - text\_words，表示计费字符数 |

### Response Headers 

| Key | 说明 | Value示例 |
| --- | --- | --- |
| Transfer\-Encoding | 返回的传输编码，一般为chunked | chunked |
| X\-Tt\-Logid | 服务端返回的 logid，建议用户获取和打印方便定位问题 | 2025041513355271DF5CF1A0AE0508E78C |

## 2\.2 请求Body 

| 字段 | 描述 | 是否必须 | 类型 | 默认值 |
| --- | --- | --- | --- | --- |
| user | 用户信息 |  |  |  |
| user\.uid | 用户uid |  |  |  |
| namespace | 请求方法 |  | string | BidirectionalTTS |
| req\_params\.text | 输入文本 |  | string |  |
| req\_params\.model | 模型版本，传`seed-tts-1.1`较默认版本音质有提升，并且延时更优，不传为默认效果。  
 注：若使用1\.1模型效果，在复刻场景中会放大训练音频prompt特质，因此对prompt的要求更高，使用高质量的训练音频，可以获得更优的音质效果。
以下参数仅针对声音复刻2\.0的音色生效，即音色ID的前缀为`saturn_`的音色。音色的取值为以下两种：
- `seed-tts-2.0-expressive`：表现力较强，支持QA和Cot能力，不过可能存在抽卡的情况。
- `seed-tts-2.0-standard`：表现力上更加稳定，但是不支持QA和Cot能力。如果此时使用QA或Cot能力，则拒绝请求。
- 如果不传model参数，默认使用`seed-tts-2.0-expressive`模型。 |  | string |  |
| req\_params\.ssml | - 当文本格式是ssml时，需要将文本赋值为ssml，此时文本处理的优先级高于text。ssml和text字段，至少有一个不为空
- ["豆包语音合成模型2\.0"的音色](https://www.volcengine.com/docs/6561/1257544) 暂不支持
- 豆包声音复刻模型2\.0（icl 2\.0）的音色暂不支持 |  | string |  |
| req\_params\.speaker | 发音人，具体见[发音人列表](https://www.volcengine.com/docs/6561/1257544) | √ | string |  |
| req\_params\.audio\_params | 音频参数，便于服务节省音频解码耗时 | √ | object |  |
| req\_params\.audio\_params\.format | 音频编码格式，mp3/ogg\_opus/pcm。接口传入wav并不会报错，在流式场景下传入wav会多次返回wav header，这种场景建议使用pcm。 |  | string | mp3 |
| req\_params\.audio\_params\.sample\_rate | 音频采样率，可选值 \[8000,16000,22050,24000,32000,44100,48000\] |  | number | 24000 |
| req\_params\.audio\_params\.bit\_rate | 音频比特率，可传16000、32000等。  
 bit\_rate默认设置范围为64k～160k，传了disable\_default\_bit\_rate为true后可以设置到64k以下  
 GoLang示例：`additions = fmt.Sprintf("{"disable_default_bit_rate":true}")`  
**注：​**bit\_rate只针对MP3格式，wav计算比特率跟pcm一样是 比特率 \(bps\) = 采样率 × 位深度 × 声道数  
 目前大模型TTS只能改采样率，所以对于wav格式来说只能通过改采样率来变更音频的比特率 |  | number |  |
| req\_params\.audio\_params\.emotion | 设置音色的情感。示例："emotion": "angry"  
 注：当前仅部分音色支持设置情感，且不同音色支持的情感范围存在不同。  
 详见：[大模型语音合成API\-音色列表\-多情感音色](https://www.volcengine.com/docs/6561/1257544) |  | string |  |
| req\_params\.audio\_params\.emotion\_scale | 调用emotion设置情感参数后可使用emotion\_scale进一步设置情绪值，范围1~5，不设置时默认值为4。  
 注：理论上情绪值越大，情感越明显。但情绪值1~5实际为非线性增长，可能存在超过某个值后，情绪增加不明显，例如设置3和5时情绪值可能接近。 |  | number | 4 |
| req\_params\.audio\_params\.speech\_rate | 语速，取值范围\[\-50,100\]，100代表2\.0倍速，\-50代表0\.5倍数 |  | number | 0 |
| req\_params\.audio\_params\.loudness\_rate | 音量，取值范围\[\-50,100\]，100代表2\.0倍音量，\-50代表0\.5倍音量（mix音色暂不支持） |  | number | 0 |
| req\_params\.audio\_params\.enable\_timestamp  
 \([仅TTS1\.0支持](https://www.volcengine.com/docs/6561/1257544)\) | 设置 "enable\_timestamp": true 返回句级别字的时间戳（默认为 false，参数传入 true 即表示启用）  
 开启后，在原有返回的事件`event=TTSSentenceEnd`中，新增该子句的时间戳信息。
- 一个子句的时间戳返回之后才会开始返回下一句音频。
- 合成有多个子句会多次返回`TTSSentenceStart`和`TTSSentenceEnd`。开启字幕后字幕跟随`TTSSentenceEnd`返回。
- 字/词粒度的时间戳，其中字/词是tn。具体可以看下面的例子。
- 支持中、英，其他语种、方言暂时不支持。
注：该字段仅适用于["豆包语音合成模型1\.0"的音色](https://www.volcengine.com/docs/6561/1257544) |  | bool | false |
| req\_params\.audio\_params\.enable\_subtitle | 设置 "enable\_subtitle": true 返回句级别字的时间戳（默认为 false，参数传入 true 即表示启用）  
 开启后，新增返回事件`event=TTSSubtitle`，包含字幕信息。
- 在一句音频合成之后，不会立即返回该句的字幕。合成进度不会被字幕识别阻塞，当一句的字幕识别完成后立即返回。可能一个子句的字幕返回的时候，已经返回下一句的音频帧给调用方了。
- 合成有多个子句，仅返回一次`TTSSentenceStart`和`TTSSentenceEnd`。开启字幕后会多次返回`TTSSubtitle`。
- 字/词粒度的时间戳，其中字/词是原文。具体可以看下面的例子。
- 支持中、英，其他语种、方言暂时不支持；
- latex公式不支持  - req\_params\.additions\.enable\_latex\_tn为true时，不开启字幕识别功能，即不返回字幕；
- ssml不支持  - req\_params\.ssml 不传时，不开启字幕识别功能，即不返回字幕；
注：该参数只在TTS2\.0、ICL2\.0生效。 |  | bool | false |
| req\_params\.additions | 用户自定义参数 |  | jsonstring |  |
| req\_params\.additions\.silence\_duration | 设置该参数可在句尾增加静音时长，范围0~30000ms。（注：增加的句尾静音主要针对传入文本最后的句尾，而非每句话的句尾） |  | number | 0 |
| req\_params\.additions\.enable\_language\_detector | 自动识别语种 |  | bool | false |
| req\_params\.additions\.disable\_markdown\_filter | 是否开启markdown解析过滤，  
 为true时，解析并过滤markdown语法，例如，`**你好**`，会读为“你好”，  
 为false时，不解析不过滤，例如，`**你好**`，会读为“星星‘你好’星星” |  | bool | false |
| req\_params\.additions\.disable\_emoji\_filter | 开启emoji表情在文本中不过滤显示，默认为false，建议搭配时间戳参数一起使用。  
 GoLang示例：`additions = fmt.Sprintf("{"disable_emoji_filter":true}")` |  | bool | false |
| req\_params\.additions\.mute\_cut\_remain\_ms | 该参数需配合mute\_cut\_threshold参数一起使用，其中：  
 "mute\_cut\_threshold": "400", // 静音判断的阈值（音量小于该值时判定为静音）  
 "mute\_cut\_remain\_ms": "50", // 需要保留的静音长度  
 注：参数和value都为string格式  
 Golang示例：`additions = fmt.Sprintf("{"mute_cut_threshold":"400", "mute_cut_remain_ms": "1"}")`  
**特别提醒：**
- 因MP3格式的特殊性，句首始终会存在100ms内的静音无法消除，WAV格式的音频句首静音可全部消除，建议依照自身业务需求综合判断选择
- ["豆包语音合成模型2\.0"的音色](https://www.volcengine.com/docs/6561/1257544) 暂不支持
- 豆包声音复刻模型2\.0（icl 2\.0）的音色暂不支持 |  | string |  |
| req\_params\.additions\.enable\_latex\_tn | 是否可以播报latex公式，需将disable\_markdown\_filter设为true |  | bool | false |
| req\_params\.additions\.latex\_parser | 是否使用lid 能力播报latex公式，相较于latex\_tn 效果更好；  
 值为“v2”时支持lid能力解析公式，值为“”时不支持lid；  
 需同时将disable\_markdown\_filter设为true； |  | string |  |
| req\_params\.additions\.max\_length\_to\_filter\_parenthesis | 是否过滤括号内的部分，0为不过滤，100为过滤 |  | int | 100 |
| req\_params\.additions\.explicit\_language（明确语种） | 仅读指定语种的文本  
**精品音色和 声音复刻ICL1\.0场景：**
- 不给定参数，正常中英混
- `crosslingual` 启用多语种前端（包含`zh/en/ja/es-ms/id/pt-br`）
- `zh-cn` 中文为主，支持中英混
- `en` 仅英文
- `ja` 仅日文
- `es-mx` 仅墨西
- `id` 仅印尼
- `pt-br` 仅巴葡
**DIT 声音复刻场景：**  
 当音色是使用model\_type=2训练的，即采用dit标准版效果时，建议指定明确语种，目前支持：
- 不给定参数，启用多语种前端`zh,en,ja,es-mx,id,pt-br,de,fr`
- `zh,en,ja,es-mx,id,pt-br,de,fr` 启用多语种前端
- `zh-cn` 中文为主，支持中英混
- `en` 仅英文
- `ja` 仅日文
- `es-mx` 仅墨西
- `id` 仅印尼
- `pt-br` 仅巴葡
- `de` 仅德语
- `fr` 仅法语
当音色是使用model\_type=3训练的，即采用dit还原版效果时，必须指定明确语种，目前支持：
- 不给定参数，正常中英混
- `zh-cn` 中文为主，支持中英混
- `en` 仅英文
**声音复刻 ICL2\.0场景：**  
 当音色是使用model\_type=4训练的
- 不给定参数，正常中英混
- `zh-cn` 中文为主，支持中英混
- `en` 仅英文
GoLang示例：`additions = fmt.Sprintf("{"explicit_language": "zh"}")` |  | string |  |
| req\_params\.additions\.context\_language（参考语种） | 给模型提供参考的语种
- 不给定 西欧语种采用英语
- id 西欧语种采用印尼
- es 西欧语种采用墨西
- pt 西欧语种采用巴葡 |  | string |  |
| req\_params\.additions\.explicit\_dialect  
 （明确方言） | 明确方言，目前仅`zh_female_vv_uranus_bigtts`音色支持以下三种方言：
- dongbei（东北话）
- shaanxi（陕西话）
- sichuan（四川话）
参数情况举例说明：
1. speaker\_id = `zh_female_xiaohe_uranus_bigtts`，explicit\_language不传，explicit\_dialect=dongbei，则报参数错误，即语种和方言不对应
1. speaker\_id =`zh_female_vv_uranus_bigtts`，explicit\_language不传，explicit\_dialect=dongbei，则正常完成东北方言的合成
1. speaker\_id = `zh_female_vv_uranus_bigtts`，explicit\_language=ja，explicit\_dialect=dongbei，则报参数错误，即语种和方言不对应
1. speaker\_id = `zh_female_vv_uranus_bigtts`，explicit\_language=ja，explicit\_dialect不传，则按照语种正常合成 |  | string |  |
| req\_params\.additions\.unsupported\_char\_ratio\_thresh | 默认: 0\.3，最大值: 1\.0  
 检测出不支持合成的文本超过设置的比例，则会返回错误。 |  | float | 0\.3 |
| req\_params\.additions\.aigc\_watermark | 默认：false  
 是否在合成结尾增加音频节奏标识 |  | bool | false |
| req\_params\.additions\.aigc\_metadata （meta 水印） | 在合成音频 header加入元数据隐式表示，支持 mp3/wav/ogg\_opus |  | object |  |
| req\_params\.additions\.aigc\_metadata\.enable | 是否启用隐式水印 |  | bool | false |
| req\_params\.additions\.aigc\_metadata\.content\_producer | 合成服务提供者的名称或编码 |  | string | "" |
| req\_params\.additions\.aigc\_metadata\.produce\_id | 内容制作编号 |  | string | "" |
| req\_params\.additions\.aigc\_metadata\.content\_propagator | 内容传播服务提供者的名称或编码 |  | string | "" |
| req\_params\.additions\.aigc\_metadata\.propagate\_id | 内容传播编号 |  | string | "" |
| req\_params\.additions\.cache\_config（缓存相关参数） | 开启缓存，开启后合成**相同文本**时，服务会直接读取缓存返回上一次合成该文本的音频，可明显加快相同文本的合成速率，缓存数据保留时间1小时。  
 （通过缓存返回的数据不会附带时间戳）  
 Golang示例：`additions = fmt.Sprintf("{"disable_default_bit_rate":true, "cache_config": {"text_type": 1,"use_cache": true}}")` |  | object |  |
| req\_params\.additions\.cache\_config\.text\_type（缓存相关参数） | 和use\_cache参数一起使用，需要开启缓存时传1 |  | int | 1 |
| req\_params\.additions\.cache\_config\.use\_cache（缓存相关参数） | 和text\_type参数一起使用，需要开启缓存时传true |  | bool | true |
| req\_params\.additions\.post\_process | 后处理配置  
 Golang示例：`additions = fmt.Sprintf("{"post_process":{"pitch":12}}")` |  | object |  |
| req\_params\.additions\.post\_process\.pitch | 音调取值范围是\[\-12,12\] |  | int | 0 |
| req\_params\.additions\.context\_texts  
 \([仅TTS2\.0支持](https://www.volcengine.com/docs/6561/1257544)\) | 语音合成的辅助信息，用于模型对话式合成，能更好的体现语音情感；  
 可以探索，比如常见示例有以下几种：
1. 语速调整  1. 比如：context\_texts: \["你可以说慢一点吗？"\]
1. 情绪/语气调整  1. 比如：context\_texts=\["你可以用特别特别痛心的语气说话吗?"\]
  1. 比如：context\_texts=\["嗯，你的语气再欢乐一点"\]
1. 音量调整  1. 比如：context\_texts=\["你嗓门再小点。"\]
1. 音感调整  1. 比如：context\_texts=\["你能用骄傲的语气来说话吗？"\]
注意：
1. 该字段仅适用于["豆包语音合成模型2\.0"的音色](https://www.volcengine.com/docs/6561/1257544)
1. 当前字符串列表只第一个值有效
1. 该字段文本不参与计费 |  | string list | null |
| \[\]req\_params\.mix\_speaker | 混音参数结构  
 注意：
1. 该字段仅适用于["豆包语音合成模型1\.0"的音色](https://www.volcengine.com/docs/6561/1257544) |  | object |  |
| req\_params\.mix\_speaker\.speakers | 混音音色名以及影响因子列表  
 注意：
1. 最多支持3个音色混音
1. 音色风格差异较大的两个音色（如男女混），以0\.5\-0\.5同等比例混合时，可能出现偶发跳变，建议尽量避免
1. 使用Mix能力时，req\_params\.speaker = custom\_mix\_bigtts |  | list | null |
| req\_params\.mix\_speaker\.speakers\[i\]\.source\_speaker | 混音源音色名  
 注意：
1. 支持["豆包语音合成模型1\.0"的音色](https://www.volcengine.com/docs/6561/1257544)、["语音合成（小模型）"的音色](https://www.volcengine.com/docs/6561/97465?lang=zh)、声音复刻大模型的音色
1. 使用声音复刻大模型音色时，使用`S_`开头的`speakerid`，或者使用查询接口获取的`icl_`的`speakerid`，不支持`DiT_`或者 `saturn_`开头的`speakerid` |  | string | "" |
| req\_params\.mix\_speaker\.speakers\[i\]\.mix\_factor | 混音源音色名影响因子  
 注意：
1. 混音影响因子和必须=1 |  | float | 0 |
单音色请求参数示例：
```JSON
{
    "user": {
        "uid": "12345"
    },
    "req_params": {
        "text": "明朝开国皇帝朱元璋也称这本书为,万物之根",
        "speaker": "zh_female_shuangkuaisisi_moon_bigtts",
        "audio_params": {
            "format": "mp3",
            "sample_rate": 24000
        },
      }
    }
}

```
mix请求参数示例：
```JSON
{
    "user": {
        "uid": "12345"
    },
    "req_params": {
        "text": "明朝开国皇帝朱元璋也称这本书为万物之根",
        "speaker": "custom_mix_bigtts",
        "audio_params": {
            "format": "mp3",
            "sample_rate": 24000
        },
        "mix_speaker": {
            "speakers": [{
                "source_speaker": "zh_male_bvlazysheep",
                "mix_factor": 0.3
            }, {
                "source_speaker": "BV120_streaming",
                "mix_factor": 0.3
            }, {
                "source_speaker": "zh_male_ahu_conversation_wvae_bigtts",
                "mix_factor": 0.4
            }]
        }
    }
}

```

## 2\.3 响应Response 
- 音频响应数据，其中data对应合成音频base64音频数据：
```JSON
{
    "code": 0,
    "message": "",
    "data": {{STRING}}
}

```
- 文本响应数据，其中sentence对应合成文本数据（包含时间戳）：
```JSON
{
    "code": 0,
    "message": "",
    "data": null,
    "sentence": <object>
}

```
示例json：
```JSON
{
    "code": 0,
    "message": "",
    "data": null,
    "sentence": {
        "text": "其他人。",
        "words": [
            {
                "confidence": 0.8531248,
                "endTime": 0.315,
                "startTime": 0.205,
                "word": "其"
            },
            {
                "confidence": 0.9710379,
                "endTime": 0.515,
                "startTime": 0.315,
                "word": "他"
            },
            {
                "confidence": 0.9189944,
                "endTime": 0.815,
                "startTime": 0.515,
                "word": "人。"
            }
        ]
    }
}

```
- 合成音频结束对应的成功响应：  - 其中usage字段默认不存在，仅在header中插入需要返回用量的标记后会新增。
```JSON
{
    "code": 20000000,
    "message": "ok",
    "data": null,
    "usage": {"text_words":10}
}

```

## 2\.4 时间戳相关说明 

|  | **TTS1\.0**  
**ICL1\.0** | **TTS2\.0**  
**ICL2\.0** |
| --- | --- | --- |
| 事件交互区别 | 合成有多个子句会多次返回`TTSSentenceStart`和`TTSSentenceEnd`。开启字幕后字幕跟随`TTSSentenceEnd`返回。 | 合成有多个子句，仅返回一次`TTSSentenceStart`和`TTSSentenceEnd`。  
 开启字幕后会多次返回`TTSSubtitle`。 |
| 返回时机 | 一个子句的时间戳返回之后才会开始返回下一句音频。 | 在一句音频合成之后，不会立即返回该句的字幕。  
 合成进度不会被字幕识别阻塞，当一句的字幕识别完成后立即返回。  
 可能一个子句的字幕返回的时候，已经返回下一句的音频帧给调用方了。 |
| 句子返回格式 | 字幕信息是基于tn打轴
说明
1. text字段对应于：原文
1. words内文本字段对应于：tn

第一句：
```JSON
{
    "phonemes": [
    ],
    "text": "2019年1月8日，软件2.0版本于格萨拉彝族乡应时而生。发布会当日，一场瑞雪将天地映衬得纯净无瑕。",
    "words": [
        {
            "confidence": 0.8766515,
            "endTime": 0.295,
            "startTime": 0.155,
            "word": "二"
        },
        {
            "confidence": 0.95224416,
            "endTime": 0.425,
            "startTime": 0.295,
            "word": "零"
        },
        {
            "confidence": 0.9108828,
            "endTime": 0.575,
            "startTime": 0.425,
            "word": "一"
        },
        {
            "confidence": 0.9609025,
            "endTime": 0.755,
            "startTime": 0.575,
            "word": "九"
        },
        {
            "confidence": 0.96244556,
            "endTime": 1.005,
            "startTime": 0.755,
            "word": "年"
        },
        {
            "confidence": 0.85796577,
            "endTime": 1.155,
            "startTime": 1.005,
            "word": "一"
        },
        {
            "confidence": 0.8460129,
            "endTime": 1.275,
            "startTime": 1.155,
            "word": "月"
        },
        {
            "confidence": 0.90833753,
            "endTime": 1.505,
            "startTime": 1.275,
            "word": "八"
        },
        {
            "confidence": 0.9403977,
            "endTime": 1.935,
            "startTime": 1.505,
            "word": "日，"
        },

...

        {
            "confidence": 0.9415791,
            "endTime": 10.505,
            "startTime": 10.355,
            "word": "无"
        },
        {
            "confidence": 0.903162,
            "endTime": 10.895, // 第一句结束时间
            "startTime": 10.505,
            "word": "瑕。"
        }
    ]
}

```
第二句：
```JSON
{
    "phonemes": [

    ],
    "text": "这仿佛一则自然寓言：我们致力于在不断的版本迭代中，为您带来如雪后初霁般清晰、焕然一新的体验。",
    "words": [
        {
            "confidence": 0.8970245,
            "endTime": 11.6953745,
            "startTime": 11.535375, // 第二句开始时间，是相对整个session的位置
            "word": "这"
        },
        {
            "confidence": 0.86508185,
            "endTime": 11.875375,
            "startTime": 11.6953745,
            "word": "仿"
        },
        {
            "confidence": 0.73354065,
            "endTime": 12.095375,
            "startTime": 11.875375,
            "word": "佛"
        },
        {
            "confidence": 0.8525295,
            "endTime": 12.275374,
            "startTime": 12.095375,
            "word": "一"
        }...
    ]
}

``` | 字幕信息是基于原文打轴
说明
1. text字段对应于：原文
1. words内文本字段对应于：原文

第一句：
```JSON
{
    "phonemes": [
    ],
    "text": "2019年1月8日，软件2.0版本于格萨拉彝族乡应时而生。",
    "words": [
        {
            "confidence": 0.11120544,
            "endTime": 0.615,
            "startTime": 0.585,
            "word": "2019"
        },
        {
            "confidence": 0.8413397,
            "endTime": 0.845,
            "startTime": 0.615,
            "word": "年"
        },
        {
            "confidence": 0.2413961,
            "endTime": 0.875,
            "startTime": 0.845,
            "word": "1"
        },
        {
            "confidence": 0.8487973,
            "endTime": 1.055,
            "startTime": 0.875,
            "word": "月"
        },
        {
            "confidence": 0.509697,
            "endTime": 1.225,
            "startTime": 1.165,
            "word": "8"
        },
        {
            "confidence": 0.9516253,
            "endTime": 1.485,
            "startTime": 1.225,
            "word": "日，"
        },

...

        {
            "confidence": 0.6933777,
            "endTime": 5.435,
            "startTime": 5.325,
            "word": "而"
        },
        {
            "confidence": 0.921702,
            "endTime": 5.695, // 第一句结束时间
            "startTime": 5.435,
            "word": "生。"
        }
    ]
}

```
第二句：
```JSON
{
    "phonemes": [

    ],
    "text": "发布会当日，一场瑞雪将天地映衬得纯净无瑕。",
    "words": [
        {
            "confidence": 0.7016578,
            "endTime": 6.3550415,
            "startTime": 6.2150416, // 第二句开始时间，是相对整个session的位置
            "word": "发"
        },
        {
            "confidence": 0.6800497,
            "endTime": 6.4450417,
            "startTime": 6.3550415,
            "word": "布"
        },

...

        {
            "confidence": 0.8818264,
            "endTime": 10.145041,
            "startTime": 9.945042,
            "word": "净"
        },
        {
            "confidence": 0.87248623,
            "endTime": 10.285042,
            "startTime": 10.145041,
            "word": "无"
        },
        {
            "confidence": 0.8069703,
            "endTime": 10.505041,
            "startTime": 10.285042,
            "word": "瑕。"
        }
    ]
}

``` |
| 语种 | 中、英，不支持小语种、方言 | 中、英，不支持小语种、方言 |
| latex | enable\_latex\_tn=true，有字幕返回 | enable\_latex\_tn=true，无字幕返回，接口不报错 |
| ssml | req\_params\.ssml不为空，有字幕返回 | req\_params\.ssml不为空，无字幕返回，接口不报错 |

## 2\.5 实例samples 

![](https://www.volcengine.com/docs/6561/data:image/png;base64,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)tts\_http\_demo\.py
未知大小

![](https://www.volcengine.com/docs/6561/data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAYCAYAAADzoH0MAAAABGdBTUEAALGPC/xhBQAAAHxJREFUOBHtUlsOgCAMAy8uPk7tj7YETFwGOBPDhzYZbKMrC8y7MnZx5EUcw0FLWnL9BSzdvsNVXzZd9ZVf6D8HfwfO8Q1G2KZYGshz0zisjVixcnQtxpoLFkR3BchVMSPbEiGnippIszgrT3BkJ8yZEMDOIvQfIaCKVsQBup49zbP0w5sAAAAASUVORK5CYII=)

3 SSE格式接口说明 

## 3\.1 请求Request 

### 请求路径 
- 服务对应的请求路径：`https://openspeech.bytedance.com/api/v3/tts/unidirectional/sse`

### Request Headers 
- 同2\.1节中的HTTP Chunked格式接口的Request Headers中内容一样

## 3\.2 请求Body 
- 同2\.2节中的HTTP Chunked格式接口的Request Body的内容一样， 示例也同2\.2节中的HTTP Chunked格式接口所示。

## 3\.3 响应Response 

### Response Headers 

| Key | 说明 | Value示例 |
| --- | --- | --- |
| Content\-Type | 返回的数据类型，一般为event\-stream | text/event\-stream |
| X\-Tt\-Logid | 服务端返回的 logid，建议用户获取和打印方便定位问题 | 2025041513355271DF5CF1A0AE0508E78C |

## 3\.4 Response Body 
- 单个返回内容同2\.2节中HTTP Chunked格式接口的Response内容， 包含由code、message、data等字段组成的对象。
- 整体返回示例如下
```JSON
event: 352
data: {"code":0,"message":"","data":"二进制音频流xxxx"}

event: 351
data: {"code":0,"message":"","data":null,"sentence":{"phonemes":[],"text":"音频文件能够正常播放。","words":[]}}

event: 152
data: {"code":20000000,"message":"OK","data":null,"usage":{"text_words":11}}

```
- event 表示云端响应的事件ID。以下为常见的事件，仅供参考使用。  - 351 \- TTSSentenceEnd （TTS 语句处理结束）
  - 352 \- TTSResponse \(TTS的合成内容，一般多包含二进制字符串流）
  - 151 \- SessionCancel （会话被取消）
  - 152 \- SessionFinish （会话结束）
  - 153 \- SessionFailed （会话失败）

## 3\.5 使用限制 
- 目前本接口仅支持以SSE的格式返回数据，对其常规能力，如重连、断点续传等能力暂不支持。

## 3\.6 示例Samples 

![](https://www.volcengine.com/docs/6561/data:image/png;base64,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)tts\_http\_sse\_demo\.py
未知大小

![](https://www.volcengine.com/docs/6561/data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAYCAYAAADzoH0MAAAABGdBTUEAALGPC/xhBQAAAHxJREFUOBHtUlsOgCAMAy8uPk7tj7YETFwGOBPDhzYZbKMrC8y7MnZx5EUcw0FLWnL9BSzdvsNVXzZd9ZVf6D8HfwfO8Q1G2KZYGshz0zisjVixcnQtxpoLFkR3BchVMSPbEiGnippIszgrT3BkJ8yZEMDOIvQfIaCKVsQBup49zbP0w5sAAAAASUVORK5CYII=)

4 错误码 
| Code | Message | 说明 |
| --- | --- | --- |
| 20000000 | ok | 音频合成结束的成功状态码 |
| 40402003 | TTSExceededTextLimit:exceed max limit | 提交文本长度超过限制 |
| 45000000 | speaker permission denied: get resource id: access denied | 音色鉴权失败，一般是speaker指定音色未授权或者错误导致 |
| quota exceeded for types: concurrency | 并发限流，一般是请求并发数超过限制 |  |
| 55000000 | 服务端一些error | 服务端通用错误 |

最近更新时间：2026\.03\.13 14:56:22
这个页面对您有帮助吗？有用

无用

[上一篇：
音色列表

](https://www.volcengine.com/docs/6561/1257544)[WebSocket 单向流式\-V3

下一篇
](https://www.volcengine.com/docs/6561/1719100)