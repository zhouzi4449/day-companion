# 成熟磁性声音与配乐版（v3）

2026-10-13：用户听过两段带音乐样音，明确选择第二种“成熟磁性版”。采用Qwen3-TTS官方Serena预设，指令见 `voice-profiles-v3.json` 的 `mature-magnetic`；没有克隆真人声音、变调旧音频或调用付费服务。音色年龄、魅力与自然程度属于主观听感，不能由频率统计证明。

## 演示视频参考

- [Notion官方 Meet Notion Calendar](https://www.youtube.com/watch?v=C4Q2ezioTUM)：本次原站元数据观测137,400次播放、80秒；不是百万播放的证明。实际分析前35秒音频，参考器乐脉冲与简洁操作演示衔接的方式。节拍检测约134BPM只是算法估计，可能存在倍拍误差，不当作官方参数。
- [Fireship聊天项目分享](https://www.youtube.com/watch?v=gUYBFDPZ5qk)：此前原站观测459,552次播放并分析开头35秒，沿用痛点开头、迅速展示功能与结尾参与邀请。详见 [v2研究](references-v2.md)。

参考文件仅在本机分析，未使用其原声、视频片段、肖像或旁白；没有把X无法核实的互动数写成爆款证据。采用独立许可的配乐，不能凭某段音乐用于热门视频就认定能自由复制。

## 配乐来源与署名

“Chill Wave” — Kevin MacLeod (incompetech.com)

- [作者曲目页](https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1600048)，ISRC USUAN1600048，官方元数据100BPM、4分钟。
- [作者提供的MP3](https://incompetech.com/music/royalty-free/mp3-royaltyfree/Chill%20Wave.mp3)。原文件哈希见 `deliverables/music-v3-mix-metadata.json`。
- [Creative Commons Attribution 4.0](https://creativecommons.org/licenses/by/4.0/)；完整文本在 `licenses/CC-BY-4.0.txt`。
- 处理：截取、均衡、淡入淡出、按旁白自动降低音量；旋律与速度保留。片尾、公开说明和第三方说明均署名。

这首音乐保留CC BY4.0许可，不受项目PolyForm Noncommercial条款额外限制。使用时保留作者、曲名、来源、许可链接与改动说明；项目自己的素材、源码与外部贡献仍分别遵守自身条款。

## 台词优先的混音

旧版程序音乐经0.065倍音量后RMS约0.00254，比旁白约低30dB，听感可能过弱。新音乐保留节奏，但在中频让出空间，并以80ms前瞻在说话前压低，停顿550ms缓慢回升，避免骤然抽吸。200ms有声窗口第10百分位旁白/音乐差至少12dB作为交付检查，不代表所有设备、听力或播放场景均绝对不受影响。

`mix-v3.py`保存纯旁白、音乐处理轨与完整混音，视频只播放完整混音一次，避免旁白或BGM叠加。完整混音数据、成片解码与辅助转写证据在deliverables；ASR不替代逐字人工听写。用户试听选择确认了短样音，整片仍可按实际反馈微调。
