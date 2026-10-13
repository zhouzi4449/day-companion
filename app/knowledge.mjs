import { methodSources, methods } from './methods.mjs';
import {growthSources,growthCards} from './growth.mjs';
export const sources = {
  ...methodSources,
  ...growthSources,
  care: { name: 'NIMH：照顾心理健康', url: 'https://www.nimh.nih.gov/health/topics/caring-for-your-mental-health', evidence: '官方健康教育' },
  sdt: { name: '自我决定理论：理论概述', url: 'https://selfdeterminationtheory.org/theory/', evidence: '理论与研究概述' },
  cbt: { name: 'NHS：重新看待无益想法', url: 'https://www.nhs.uk/every-mind-matters/mental-wellbeing-tips/self-help-cbt-techniques/reframing-unhelpful-thoughts/', evidence: '官方自助教育' },
  plan: { name: 'WOOP：研究导航', url: 'https://woopmylife.org/en/science', evidence: '作者团队研究导航' },
  stress: { name: 'WHO：应对压力指南', url: 'https://www.who.int/publications/i/item/9789240003927', evidence: '官方压力管理指南' },
  help: { name: 'NIMH：支持有自杀想法的人', url: 'https://www.nimh.nih.gov/health/publications/5-action-steps-to-help-someone-having-thoughts-of-suicide', evidence: '官方安全支持教育' },
  problem: { name: 'NHS：问题解决', url: 'https://www.nhs.uk/every-mind-matters/mental-wellbeing-tips/self-help-cbt-techniques/problem-solving/', evidence: '官方自助教育，非本应用疗效证据' },
  compassion: { name: 'Kristin Neff：自我关怀', url: 'https://self-compassion.org/what-is-self-compassion/', evidence: '研究者概念说明，非临床指南' },
  dialogue: { name: 'ACL 2021：情绪支持对话研究', url: 'https://aclanthology.org/2021.acl-long.269/', evidence: '对话系统研究，非临床有效性证据' }
};

export const knowledge = [
  { id: 'K-001', source: 'care', title: '先决定今天最重要的事', tags: ['目标', '行动', '优先', '压力', '规划'], body: '把必须现在做的事与可以等待的事分开。安排下一步前，先看看时间和精力是否足够。', practice: '从你的目标中选一件今天值得做的小事。', limit: '重要事情未完成时，仍需要处理现实后果；排优先级不能消除所有压力。' },
  { id: 'K-002', source: 'care', title: '疲惫时，照顾基础需要', tags: ['疲惫', '睡眠', '累', '减负', '休息'], body: '睡眠、饮食、活动和休息会影响日常状态。精力不足时，可以先照顾身体，再调整任务量。', practice: '问自己：现在最缺的是休息、食物，还是一点活动？', limit: '持续明显不适需要专业评估，不能只用作息解释。' },
  { id: 'K-003', source: 'care', title: '把支持带回现实生活', tags: ['孤独', '关系', '朋友', '倾听', '家人'], body: '现实中的朋友、家人或其他可信任者可以提供情感与实际支持。需要帮助时，可以直接说明想要什么。', practice: '给可信任的人发一句：我今天有点难，方便听我说几分钟吗？', limit: '若某段关系不安全，选择其他可靠支持，不要求向对方倾诉。' },
  { id: 'K-004', source: 'sdt', title: '目标应该有你的理由', tags: ['目标', '自主', '意义', '被迫', '选择'], body: '自主感是自我决定理论关注的基本需要之一。目标更适合与个人在意的价值相连，而不只来自他人的要求。', practice: '把“我应该”改写为“我选择，因为……”，也允许发现这不是你的目标。', limit: '现实约束仍然存在；有自主理由不保证每次都有动力。' },
  { id: 'K-005', source: 'sdt', title: '看见具体进展', tags: ['进步', '完成', '巩固', '能力', '成长'], body: '能力感来自与挑战的有效互动。反馈应指出做了什么、哪里产生变化，避免只评价人好不好。', practice: '记下一个有效做法，下次保留它。', limit: '不能把完成数量当成人的价值，也不能编造进步。' },
  { id: 'K-006', source: 'sdt', title: '期待也可以保留选择', tags: ['关系', '陪伴', '支持', '自主', '妹妹'], body: '关系支持可以表达关心，同时尊重自主。鼓励不需要以失望或疏远为代价。', practice: '提出一个选择：你想继续、缩小这一步，还是先休息？', limit: '这是支持原则，不是用角色替代现实关系。' },
  { id: 'K-007', source: 'cbt', title: '把发生的事和解释分开', tags: ['难过', '自责', '失败', '梳理', '事实'], body: '“今天没有完成”是一件事，“我永远不行”是一种解释。可以先检查证据，再考虑其他解释。', practice: '分别写下一句事实和一句当时的想法。', limit: '不否认真实困难，也不强迫积极思考；本卡不是心理治疗。' },
  { id: 'K-008', source: 'cbt', title: '焦虑时，检查预测', tags: ['焦虑', '担心', '害怕', '梳理', '预测'], body: '担心的结果不等于已经发生。查看支持与反对预测的证据，可以帮助保留更多可能。', practice: '问自己：还有哪一种解释？我现在能处理哪部分？', limit: '不保证消除焦虑；严重或持续困扰应寻求专业支持。' },
  { id: 'K-009', source: 'plan', title: '看见下一步的障碍', tags: ['行动', '目标', '拖延', '障碍', '规划'], body: '想象想要的结果之后，再考虑现实障碍，有助于把愿望转成可以讨论的行动计划。', practice: '找出最可能卡住你的一个具体环节。', limit: '经济、疾病与环境障碍不能都归因于个人意志。' },
  { id: 'K-010', source: 'plan', title: '给行动一个触发时机', tags: ['行动', '习惯', '开始', '时机', '规划'], body: '把情境和行动相连：如果某个时机到来，就执行一个具体步骤。计划要符合当前条件。', practice: '例如：晚饭收拾好后，我先打开资料读一页。', limit: '计划不是承诺惩罚；条件变化时可以修改。' },
  { id: 'K-011', source: 'stress', title: '压力大时，回到眼前', tags: ['压力', '焦虑', '减负', '当下', '平静'], body: '注意眼前能感受到的环境和正在做的动作，可以成为压力中短暂暂停的方法。之后再选择与个人价值相符的一步。', practice: '暂时停下任务，看看周围，感受脚下的支撑。', limit: '如感到更不适可以停止；这是原创一般提示，没有复制 WHO 练习，不代替治疗。' },
  { id: 'K-012', source: 'help', title: '安全优先于完成目标', tags: ['安全', '求助', '危机', '支持'], body: '当出现伤害自己的想法或紧急危险时，优先连接现实支持和专业帮助。目标讨论可以暂停。', practice: '联系可信任者说明现在需要陪伴，紧急危险联系所在地急救。', limit: 'AI 不能确认你已安全或代替救援。热线按所在地选择。' },
  { id: 'K-013', source: 'dialogue', title: '先理解，再讨论办法', tags: ['倾听','委屈','理解','说教','建议'], body: '支持对话可以先厘清经历和感受，再共同决定是否谈行动。收到建议之前，也可以只想被听见。', practice: '告诉对方：现在先听我说，暂时不用找办法。', limit: '支持策略的研究不等于本应用具备咨询能力。' },
  { id: 'K-014', source: 'dialogue', title: '理解偏了，可以重新来', tags: ['误解','纠正','理解错','不是','梳理'], body: '对话里的解释不是定论。发现理解偏差时，应以你的新说明修正，而不是坚持旧标签。', practice: '指出一句：我更在意的是……，不是你刚才说的那部分。', limit: 'AI可能继续理解错误；你可以停止对话或换现实支持。' },
  { id: 'K-015', source: 'dialogue', title: '问题不必一口气回答', tags: ['追问','沉默','倾听','不想说','问题'], body: '支持可以通过回应、澄清和共同选择来进行，不需要连续盘问。你可以决定说多少。', practice: '选择“少问问题”，或告诉对方先陪你把话说完。', limit: '紧急安全情况可能需要直接确认当前危险。' },
  { id: 'K-016', source: 'compassion', title: '承认难受，不急着责备', tags: ['自责','羞耻','失败','没用','难过'], body: '面对失误时，可以承认痛苦并保留善意，不必把困难扩大成人格判决。', practice: '先写“这件事让我难受”，再说发生了什么。', limit: '善待自己不免除现实责任，也不保证困扰消失。' },
  { id: 'K-017', source: 'compassion', title: '关怀可以包含边界', tags: ['边界','拒绝','关系','委屈','保护'], body: '关怀有时是安慰，有时是保护需要、表达拒绝或寻求帮助。温柔不要求无限迁就。', practice: '确认一件你目前无法答应的事。', limit: '关系不安全时，优先考虑现实保护与可靠支持。' },
  { id: 'K-018', source: 'compassion', title: '不必靠羞辱自己改变', tags: ['成长','责骂','自责','动力','完美'], body: '改变可以出于照顾自己的需要，而非证明自己够格。允许有不足，同时认真处理下一步。', practice: '试着用一句既诚实又不辱骂自己的话描述现状。', limit: '这不是放任后果或要求你立即接纳所有感受。' },
  { id: 'K-019', source: 'problem', title: '先分清能处理的部分', tags: ['担心','焦虑','控制','障碍','梳理'], body: '当前可以行动的问题，与尚未发生的预测，可以分别对待。先找出现在能处理的一部分。', practice: '列一件可行动的事，再留下一件暂时无法控制的事。', limit: '无法控制不代表不重要；必要时需要外部帮助。' },
  { id: 'K-020', source: 'problem', title: '一次先试一个办法', tags: ['行动','计划','拖延','尝试','规划'], body: '为一个具体问题考虑可行办法，比较时间、资源与后果，再挑一个尝试。', practice: '明确做什么、什么时候做，以及是否需要别人协助。', limit: '资源不足时应调整方案，不把失败都归因于意志。' },
  { id: 'K-021', source: 'problem', title: '回看做法，而不是给自己评分', tags: ['复盘','效果','进步','巩固','回望'], body: '尝试后观察什么有帮助、什么没有，再修改办法。结果可以成为信息，而不是价值评判。', practice: '留下一条下次保留的做法和一条想调整的地方。', limit: '一次结果不能证明因果，也不能承诺下次必然成功。' },
  { id: 'K-022', source: 'problem', title: '先照顾你在意的领域', tags: ['选择','优先','学习','工作','关系'], body: '问题很多时，可以先明确近期重视的领域，再选择一个可处理的问题。', practice: '从学习、关系或生活中挑一件目前最值得投入的事。', limit: '紧急后果需要优先处理，不能仅按喜好排序。' },
  { id: 'K-023', source: 'sdt', title: '别人的期待，也能商量', tags: ['被迫','父母','考试','期待','自主'], body: '外部要求和自己的理由可能同时存在。可以辨认愿意承担的部分与想协商的部分。', practice: '分别写下：这是对方的期待，这是我自己的理由。', limit: '自主选择不等于摆脱现实约束，也不要求立即放弃目标。' },
  { id: 'K-024', source: 'sdt', title: '支持不需要交换承诺', tags: ['陪伴','压力','讨好','妹妹','关系'], body: '关心与自主可以同时存在。获得支持，不需要先承诺永远进步或取悦陪伴者。', practice: '练习说：我需要支持，但今天不想做决定。', limit: '虚构AI角色不能替代现实关系，也不应要求排他依赖。' }
].concat(methods,growthCards).map((card,index) => ({ ...card, reviewedAt: card.reviewedAt??(index < 12 ? '2026-10-11' : '2026-10-12'), version: 1, sourceInfo: sources[card.source], authorship: card.kind==='method'?'本项目原创方法卡':'本项目原创概念卡' }));
