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
