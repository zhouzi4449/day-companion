# 日有回声宣传片

45秒、1920×1080、30fps、H.264/AAC MP4，12段内嵌中文字幕，另附UTF-8 SRT。七镜：开场、每日开口、深入交流、小目标、角色与方法、按天回望、收尾。

采用[Remotion](https://github.com/remotion-dev/remotion) 4.0.535制作。它支持程序控制截图、动画、字幕和导出，工程可在Studio预览修改。比较过Shotcut，其[官方命令行导出](https://forum.shotcut.org/t/export-at-the-command-line/44067/1)也可操控；本次选择Remotion以便精确控制中文布局和镜头。Remotion源码公开，但不是OSI开源许可证，使用遵循其[许可证](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md)。本次个人制作，没有购买服务或新增订阅。

## 文件

- `deliverables/日有回声-宣传片-1080p.mp4`：成片（大文件不进入Git）。
- `deliverables/日有回声-宣传片.srt`：可编辑字幕。
- `studio/src/config.js`：镜头时长、标题、字幕。
- `studio/src/Composition.jsx`：画面与动画。
- `studio/public/screens/`：独立示例数据的实际0.7.0桌面界面截图。
- `studio/generate-assets.mjs`：原创程序音乐与SRT生成。

没有拍摄真实用户桌面或私人日记。AI答复画面使用项目真实合成测试的既有模型结果，宣传片标注“示例数据·界面实录”，不代表真实用户反馈、模型延迟或效果保证。音乐为原创程序生成的轻拨弦，没有外部音乐样本；系统字体仅渲染，没有分发字体文件。

## 修改与导出

```powershell
cd promo/studio
npm ci
npm run studio
node generate-assets.mjs
npm run render
```

Studio默认本机3333端口。可用`REMOTION_BROWSER_EXECUTABLE`指向兼容Chrome Headless Shell；否则Remotion下载专用浏览器。此工作机的官方Chrome 157下载至本机工具目录，渲染使用独立临时浏览器，不接入个人浏览会话。需要当前工作机重新截图时可运行`node promo/capture/capture.cjs`；发布快照只保留剪辑所需截图，不包含本机捕获脚本或测试日志。

成片验证与镜头开发自审见`deliverables/verification.json`及`deliverables/scene-review.md`。这些只验证素材/渲染，不是软件效果或临床证明。

## 0.8.0社区分享旁白版
另有约95秒的社区分享片：deliverables/日有回声-社区分享-旁白版.mp4、日有回声-分享旁白.wav/txt、日有回声-社区分享.srt。10镜介绍0.8.0功能、52张资料、备份恢复、非商业授权，结尾邀请一起改进。原45秒无旁白版本保留。
旁白为本机Windows SAPI的Microsoft Huihui中文合成语音；没有克隆个人声音。每句分别合成、按实际PCM时长生成20条字幕，音轨与字幕采用同一帧时间表。make-narration.ps1/assemble-narration.mjs可在具备该语音的Windows重做；字幕和音频不读取日记。
在studio运行npm run render:share重渲染；timeline与分句音频已包含在源码。新版截图取自0.8.0独立合成数据；旧45秒成片及其旧核验仍为历史。Remotion/Windows组件沿用各自条款，不能把本项目非商业许可视为第三方商业授权。

## 新版项目分享（v2）

`deliverables/日有回声-新版项目分享.mp4`、`日有回声-新版旁白.wav/txt`、`日有回声-新版分享.srt`。这一版63.233秒、16句字幕，重做口语化讲解与剪辑，使用用户试听后选择的官方Qwen3-TTS Serena预设女声；仍为合成旁白，不是真人录音。没有克隆博主声音。完整参数见 `deliverables/voice-v2-metadata.json`，来源比较和参考视频见 [references-v2.md](references-v2.md)。

剪辑包括0.8.0独立示例数据的28张实际操作截图、局部缩放、操作前后切换、资料卡与逐句字幕；它是截图剪辑，不是连续录屏。参考视频仅在本机用于分析，没有进入本片或公开源码。旧片保留。

工程已经包含新旁白，重新剪辑无需安装语音模型：

```powershell
cd promo/studio
node render-v2.mjs --stills
node render-v2.mjs
```

如需重新生成旁白，用单独的Python 3.12虚拟环境安装 `promo/requirements-voice.txt`。本次GPU环境先从PyTorch官方cu128索引安装torch/torchaudio 2.8.0，再安装qwen-tts 0.1.1；不要覆盖应用或系统Python依赖。将Qwen官方模型固定到metadata记录的revision，下载至工作目录之外，通过文件SHA256核对；模型权重不随源码或桌面程序分发。只有合成新音频才需要模型与相应显存。

```powershell
python promo/synthesize-qwen.py --model <本机模型目录> --samples
python promo/synthesize-qwen.py --model <本机模型目录> --speaker Serena
node promo/assemble-v2.mjs
node promo/verify-v2.mjs
```

音色更换时同时设置 `NARRATION_SPEAKER`，使metadata与实际音色一致；重新配音前把旧的 `promo/capture/raw/qwen-clauses` 改名保留，因为脚本会保留已有分句。24kHz单声道PCM16按句实测时长编排，没有通过加速/变调把系统语音伪装成真人。ASR反向转写仅辅助检查漏读与重复，不能证明真人感；实际核验见 `deliverables/v2-verification.json` 和 `v2-scene-review.md`。

本机ASR核对用 `openai-whisper==20250625` 的多语言base模型，独立工具环境安装后运行 `python promo/transcribe-v2.py`；没有调用收费转写API。原始转写保留同音字识别错误，字幕使用原稿与实测音频时间表，不直接拿ASR结果发布。

## 成熟磁性声音与音乐版（v3）

用户选定第二种 `mature-magnetic` Serena风格。成片 `deliverables/日有回声-音乐成熟声版.mp4`，纯旁白 `日有回声-成熟旁白.wav/txt`，完整声音 `日有回声-成熟声音乐混音.wav`，字幕 `日有回声-音乐成熟声版.srt`。旁白仍为合成语音。音乐采用Kevin MacLeod的Chill Wave，CC BY4.0，署名和独立许可详见 [references-v3.md](references-v3.md)；不能将其改为项目非商业条款。

工程已含混音与时间表，重渲染不需要语音模型：

```powershell
cd promo/studio
node render-v2.mjs --v3 --stills
node render-v2.mjs --v3
```

重新配音时使用独立工具环境和固定模型；`python promo/synthesize-qwen.py --model <本机模型目录> --profile mature-magnetic`，再运行 `node promo/assemble-v2.mjs --v3`。更换风格前保留并改名旧的raw/qwen-clauses-v3，脚本会拒绝混用不同指令。`mix-v3.py`从 `capture/raw/chill-wave.wav` 混音；需要重混时将公开工程内原MP3用FFmpeg转成24kHz双声道PCM16该文件，再运行脚本。编排、配乐与字幕随实际新声音时长同步生成；未用音高或语速变换。

`node promo/verify-v2.mjs --v3`核验成片；`python promo/transcribe-v2.py --v3`和`--mixed`辅助检查漏句。音量检查是电平证据，不是所有设备听感或真人录音认证。
