# 日有回声

一款中文 Windows 桌面成长陪伴体验版。把今天发生的事说出来，继续交流，并自主选择自己的下一步。

![日有回声](promo/studio/public/screens/days-renamed.png)

## 功能

- 每日开口、复盘后的持续交流，支持倾听与行动偏好。
- 温柔长者、知心姐姐、成年妹妹三种虚构成人表达风格。
- 自定目标、最小行动、修改与当天完成/撤销。
- 按天回望，AI生成标题，也可手动编辑或重新起名。
- 32张原创资料卡，其中8张方法卡，保留来源和适用边界。
- 用户确认的事实记忆与聊天偏好；较早历史默认不发送。

截图与宣传视频使用示例数据。AI表达有不确定性；本产品是一般成长支持，不提供诊断或保证效果。

## 开发与构建

当前版本0.7.0，仅在Windows x64本机验过。Node.js至少22.12。

```powershell
npm ci
npm test
npm start
npm run package:win
```

便携程序位于 `dist/releases/0.7.0/DayCompanion-win32-x64/`。保留整个目录，不能只复制exe。桌面快捷方式可通过 `desktop/create-shortcut.ps1` 创建。

## AI连接与数据

默认通过随包官方Codex CLI使用用户自身ChatGPT订阅认证，使用Codex额度；不会把Plus视为API余额。也可以填自己的兼容Chat Completions服务、模型与密钥，供应商费用另计。首次新账号、其他电脑和真实外部API尚未全面验收。

日记、标题和事实记忆保存在当前设备，仍未加密。API密钥用Windows DPAPI单独保护，不导出、不回显。聊天提交会发送必要上下文；直接选旧日生成标题会发送该日有限用户文字，界面会说明。可导出记录，清空前确认；暂不支持导入恢复。官方临时会话不代表供应商零保留。

## 宣传片工程

45秒、1920×1080、30fps，中文字幕与原创轻音乐。可修改的Remotion工程位于 `promo/studio`，独立于桌面程序：

```powershell
cd promo/studio
npm ci
npm run studio
npm run render
```

字幕文件位于 `promo/deliverables/日有回声-宣传片.srt`。MP4通过渲染生成，未作为源代码大文件提交。详见 [制作说明](promo/README.md)。

## 项目状态

桌面体验版，未签名、无安装更新器；生产数据保护、长期模型质量、专业内容审阅、目标用户内测仍需完善。精选资料和研究记录位于 `design/`；没有复制论文/书籍全文或训练对话数据集。

本仓库暂未授予统一软件开源许可证。第三方依赖沿用各自条款，见 [第三方说明](THIRD_PARTY_NOTICES.md)。
