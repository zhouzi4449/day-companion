# 第三方组件

桌面源码依赖Electron、electron/packager和官方OpenAI Codex CLI；各自许可证请查对应锁定版本的包与项目。Codex Apache-2.0副本保留于assets/licenses。

视频工程使用Remotion 4.0.535及React。Remotion源码公开，使用其自身许可证，不属于OSI定义的开源许可证；个人和符合条件的小团队可免费使用，其他情形遵循其[许可证](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md)。Chrome/FFmpeg等渲染工具不提交到源码仓库。

音乐由本项目程序生成，没有引入外部音乐样本。界面截图为本项目示例数据，图标为项目原创资产。系统字体仅用于本机渲染，没有打包分发字体文件。知识卡是原创短摘要与出处链接，不复制第三方文章全文。

0.8.0社区分享片旁白由本机Windows SAPI/Microsoft Huihui中文语音合成；不分发语音引擎。Edge TTS工具曾在本机安装但请求失败，没有使用其音频或分发其组件。第三方许可不能通过本项目的商业授权绕过。项目自身源码、文档和原创素材采用根目录LICENSE/NOTICE的非商业条款；保留外部贡献者版权。

新版项目分享片使用Qwen3-TTS-12Hz-1.7B-CustomVoice官方预设音色，模型和qwen-tts代码按官方标注为Apache-2.0，许可证副本保留在 `promo/licenses/Qwen3-TTS-Apache-2.0.txt`。该旁白是本机生成的合成语音，没有克隆个人声音；只分发生成音频及剪辑工程，不分发模型、CUDA/PyTorch或语音工具。OpenAI Whisper（MIT）仅在本机用于辅助转写核对，没有进入软件或视频工程运行依赖。第三方声音或音乐权利不能由本项目商业授权替代；参考视频只用于分析，没有复用片段或原声。
