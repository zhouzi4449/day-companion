# 成熟产品与对话资料研究 · 2026-10-12

本次实际打开以下官方资料与开源源码。产品功能是设计参考，不是心理疗效证据；不复制品牌素材、竞品代码或真实用户聊天数据，不声称经过竞品逐屏视觉审查。

| 参考 | 已读来源 | 提炼与落地 |
|---|---|---|
| Day One | [Prompt Packs](https://dayoneapp.com/guides/tips-and-tutorials/prompt-packs/) | 用切口降低开口负担；本项目原创每日问题，切换不覆盖草稿 |
| Finch | [Creating and Completing Goals](https://help.finchcare.com/hc/en-us/articles/37779940291213-Creating-and-Completing-Goals) | 小行动可以编辑；将AI建议送入目标编辑，用户确认才写入 |
| Replika | [可查看和移除的记忆](https://help.replika.com/hc/en-us/articles/360000874712-What-does-my-Replika-remember-about-me) | 记忆应看得见；提供手动事实增改删和发送开关，不作隐藏人格画像 |
| Mem0 | [官方仓库](https://github.com/mem0ai/mem0)、[记忆更新源码](https://github.com/mem0ai/mem0/blob/main/mem0/configs/prompts.py) | 区分新增/修改/删除/不变；本地12条事实足够，独立实现，不引入向量库或外部记忆服务。源码Apache-2.0；本次未复制代码/提示词 |
| ESConv / ACL 2021 | [论文](https://aclanthology.org/2021.acl-long.269/)、[全文](https://aclanthology.org/2021.acl-long.269.pdf) | 关注支持策略与对话阶段，先理解后共同选择；原创反例/正例和多轮评测，不复制数据集或进行训练 |
| NHS | [Problem solving](https://www.nhs.uk/every-mind-matters/mental-wellbeing-tips/self-help-cbt-techniques/problem-solving/)、[Reframing](https://www.nhs.uk/every-mind-matters/mental-wellbeing-tips/self-help-cbt-techniques/reframing-unhelpful-thoughts/) | 区分实际问题与预测；计划后回看效果；只做简短原创教育卡，不提供CBT治疗 |
| Kristin Neff | [What is Self-Compassion](https://self-compassion.org/what-is-self-compassion/) | 自责时保留善意与现实责任；不复制量表、练习、音频或书籍 |
| 自我决定理论 | [理论作者机构](https://selfdeterminationtheory.org/theory/) | 自主、能力感、关系支持；目标可以协商、休息和更改 |
| OpenAI Docs | [Prompt engineering](https://developers.openai.com/api/docs/guides/prompt-engineering) | 明确指令/上下文边界、原创示例与评测；输出非确定性，有限合成案例不等于稳定保证 |

SAMHSA PDF与NCBI托管章节本次正文访问失败/验证码，不能将搜索摘要称为已完整审阅。本次新增卡片依据上表成功读取的资料，不内置这两份全文。

## 现有界面审查与设计决定

产品场景：一天结束时，在电脑前轻松说几句，需要能接着上一句话聊下去。沿用原有绿色、设备中文字体和四页导航；采用同一种克制柔和风格，不更换框架。既有截图和源码表明：长表单压住对话、重复问候、反馈建议缺少行动出口、陪伴页技术连接占据首屏。改成对话在前、输入在后、附加选择折叠；来源放在回复的展开项；陪伴偏好和透明记忆先于连接设置。

界面自审（0–4，主观记录）：层级2、字体3、颜色3、间距3、动态2、可访问3、响应3、模板痕迹3、信息结构2，共24/36。优先修层级和信息结构；不为了动画或头像增加依赖，不声称未连接的designer MCP门禁通过。

## 拟人标准

回应具体细节而不是夸标签；短句与长句自然交替；无须每轮总结/提问/讲知识。保留上下文中的修正，区分“用户说过”“AI建议过”“用户确认过”；称呼克制。三角色有不同节奏，但不编造真人经历或排他关系。只想倾听时不塞任务。用用户反馈调节下一轮，不把喜好评价当心理诊断或科学评分。

先采用本地可控事实记忆和有限上下文。自动画像、训练模型、爬取大量私密对话、复杂向量服务没有当前必要性，也不属于本次交付。
