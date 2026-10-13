import { knowledge } from './knowledge.mjs';

export const STORE_KEY = 'day-companion.v1';
export const moods = ['还说不清', '疲惫', '难过', '焦虑', '平静', '有动力'];
export const preferences = ['一起分析', '先听我说', '帮我行动'];
export const defaultProfile = { nickname: '', length: '自然', tone: '温和', questions: '适时追问' };
export function normalizeProfile(value = {}) {
  return { nickname: String(value.nickname ?? '').trim().slice(0,20), length: ['简短','自然','展开聊'].includes(value.length) ? value.length : '自然', tone: ['温和','坦诚直接'].includes(value.tone) ? value.tone : '温和', questions: ['适时追问','少问问题'].includes(value.questions) ? value.questions : '适时追问' };
}
export function upsertMemory(state, value, id, day = localDate()) {
  const content = value.trim();
  if (!content || content.length > 140 || !date(day)) throw new Error('请用140字以内写下一件你确认的事。');
  const memories = state.memories ?? [];
  if (!memories.some(m => m.id === id) && memories.length >= 12) throw new Error('最多保留12条，请先整理或删除旧记忆。');
  if (memories.some(m => m.id !== id && m.text === content)) throw new Error('这件事已经记下了。');
  return { ...state, memories: [...memories.filter(m => m.id !== id), { id, text: content, updatedAt: day }] };
}
export function openingPrompt(state, now = new Date(), offset = 0) {
  const day = localDate(now);
  const today = state.entries.filter(e => e.day === day);
  if (today.length && offset === 0) return '刚才聊到的事，可以接着说。现在有什么新的想法，或哪里需要我重新理解？';
  const prompts = ['今天哪件小事，在你心里停留得最久？','今天有什么比预想中顺利一点？又有什么让你费劲？','今天有没有一刻，你想对自己说声辛苦了？','如果只说一件事，你最想让我听到什么？','今天有没有一个选择，是你自己真正在意的？','从今天最普通的一件事聊起，也很好。'];
  const index = (Math.floor(Date.UTC(now.getFullYear(),now.getMonth(),now.getDate())/86400000) + offset) % prompts.length;
  const lead = { elder: '慢慢说。', sister: '今天想聊什么都可以。', younger: '来，说给我听听。' }[state.persona];
  const nickname = normalizeProfile(state.profile).nickname;
  return (nickname ? nickname + '，' : '') + lead + prompts[index];
}
export const personas = [
  { id: 'elder', name: '温柔长者', short: '长者', mark: '和', description: '沉稳、耐心，陪你慢慢理清。', greeting: '慢慢说，我听着。今天做了什么，有什么想一起回看的？', opener: '我们慢慢看。', accent: '稳稳地陪你' },
  { id: 'sister', name: '知心姐姐', short: '姐姐', mark: '知', description: '亲近、坦诚，认真对待你的感受。', greeting: '今天过得怎么样？开心的、卡住的，都可以跟我说。', opener: '我想先认真听你说。', accent: '把话说开一点' },
  { id: 'younger', name: '期待成长的妹妹', short: '妹妹', mark: '晴', description: '轻快、有期待，支持你按自己的步子走。', greeting: '今天有什么新鲜事？也想听听，哪件事让你有一点进展，或有点难。', opener: '我在听，也想知道你的真实感受。', accent: '陪你往前一点' }
];

export function localDate(now = new Date()) {
  return [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');
}
export function initialState() {
  return { version: 1, persona: 'sister', remember: false, profile: { ...defaultProfile }, memories: [], dayTitles: [], goals: [], entries: [], draft: { text: '', mood: moods[0], energy: '未选择', preference: preferences[0], goalId: '' } };
}
const text = v => typeof v === 'string';
const date = v => text(v) && /^\d{4}-\d{2}-\d{2}$/.test(v) && Number.isFinite(Date.parse(v));
export function conversationMode(state, now = new Date()) {
  return state.entries.some(e => e.day === localDate(now)) && state.draft.mode !== 'reflection' ? 'chat' : 'reflection';
}
export function boundedConversation(entries) {
  if (!Array.isArray(entries) || !entries.length) return [];
  const selected = [entries[0], ...entries.slice(Math.max(1,entries.length-10))];
  const trim = (e,opening) => ({day:typeof e?.day==='string'?e.day.slice(0,10):undefined,text:String(e?.text??'').slice(0,opening?3000:1200),mood:moods.includes(e?.mood)?e.mood:'还说不清',previousReply:String(e?.previousReply??'').slice(0,opening?2500:1600),previousStep:String(e?.previousStep??'').slice(0,200),previousSources:Array.isArray(e?.previousSources)?e.previousSources.filter(id=>knowledge.some(k=>k.id===id)).slice(0,3):[],userReaction:['贴近','像说教','理解偏了'].includes(e?.userReaction)?e.userReaction:'',goalTitle:String(e?.goalTitle??'').slice(0,80),isOpening:opening});
  const opening=trim(selected[0],true), tail=[];let remaining=20000-opening.text.length-opening.previousReply.length;
  for(let i=selected.length-1;i>0;i--){const item=trim(selected[i],false),size=item.text.length+item.previousReply.length;if(size>remaining)break;tail.unshift(item);remaining-=size;}
  return [opening,...tail];
}
export function validState(value) {
  if (!value || value.version !== 1 || !personas.some(p => p.id === value.persona) || typeof value.remember !== 'boolean' || !Array.isArray(value.goals) || !Array.isArray(value.entries)) return false;
  if(value.dayTitles!==undefined&&(!Array.isArray(value.dayTitles)||value.dayTitles.some(t=>!t||!date(t.day)||!validDayTitle(t.title)||!['ai','manual'].includes(t.origin)||!value.entries.some(e=>e.day===t.day))||new Set(value.dayTitles.map(t=>t.day)).size!==value.dayTitles.length))return false;
  if (value.profile !== undefined && (!value.profile || typeof value.profile.nickname !== 'string' || value.profile.nickname.length > 20 || !['简短','自然','展开聊'].includes(value.profile.length) || !['温和','坦诚直接'].includes(value.profile.tone) || !['适时追问','少问问题'].includes(value.profile.questions))) return false;
  if (value.memories !== undefined && (!Array.isArray(value.memories) || value.memories.length > 12 || value.memories.some(m => !m || !text(m.id) || !text(m.text) || !m.text.trim() || m.text.length > 140 || !date(m.updatedAt)) || new Set(value.memories.map(m => m.id)).size !== value.memories.length)) return false;
  const d = value.draft;
  if (d?.mode !== undefined && !['reflection','chat'].includes(d.mode)) return false;
  if (!d || !text(d.text) || d.text.length > 3000 || !moods.includes(d.mood) || !['未选择', '低', '中', '高'].includes(d.energy) || !preferences.includes(d.preference) || !text(d.goalId)) return false;
  return value.goals.every(g => g && text(g.id) && text(g.title) && g.title.length > 0 && g.title.length <= 80 && [g.why, g.step, g.when].every(text) && Array.isArray(g.doneDates) && g.doneDates.every(date)) &&
    new Set(value.goals.map(g => g.id)).size === value.goals.length &&
    value.entries.every(e => e && text(e.id) && date(e.day) && text(e.text) && e.text.length <= 3000 && moods.includes(e.mood) && text(e.feedback?.reply) && text(e.feedback?.strategy) && Array.isArray(e.feedback?.sourceIds) && e.feedback.sourceIds.every(id => knowledge.some(k => k.id === id))) &&
    new Set(value.entries.map(e => e.id)).size === value.entries.length;
}
export function readState(storage) {
  try {
    const raw = storage.getItem(STORE_KEY);
    if (raw === null) return { state: initialState(), error: null, raw: null };
    const value = JSON.parse(raw);
    if (!validState(value)) throw new Error('记录格式或版本暂不受支持');
    return { state: { ...value, profile: normalizeProfile(value.profile), memories: value.memories ?? [], dayTitles:value.dayTitles??[] }, error: null, raw };
  } catch (error) {
    let raw = null;
    try { raw = storage.getItem(STORE_KEY); } catch { /* 浏览器存储可能被禁用。 */ }
    return { state: initialState(), error: error.message, raw };
  }
}
export function saveState(storage, state) {
  if (!validState(state)) throw new Error('记录校验失败，未覆盖已有内容');
  storage.setItem(STORE_KEY, JSON.stringify(state));
}
export function validDayTitle(value){return typeof value==='string'&&!!value.trim()&&value.length<=40&&!/[\r\n\x00-\x1f\x7f]/.test(value);}
export function setDayTitle(state,day,title,origin='manual'){
  if(!date(day)||!state.entries.some(e=>e.day===day)||!validDayTitle(title)||!['ai','manual'].includes(origin))throw new Error('请用40字以内为这一天起名。');
  if(origin==='ai'&&(state.dayTitles??[]).some(t=>t.day===day&&t.origin==='manual'))return state;
  return {...state,dayTitles:[...(state.dayTitles??[]).filter(t=>t.day!==day),{day,title:title.trim(),origin}]};
}
export function recordDays(state){
  const groups=new Map();for(const entry of state.entries){if(!groups.has(entry.day))groups.set(entry.day,[]);groups.get(entry.day).push(entry);}
  return [...groups].sort(([a],[b])=>b.localeCompare(a)).map(([day,entries])=>({day,entries,title:(state.dayTitles??[]).find(t=>t.day===day)??null}));
}
export function removeRecord(state,id){
  const removed=state.entries.find(e=>e.id===id);if(!removed)return state;
  const entries=state.entries.filter(e=>e.id!==id);
  return {...state,entries,dayTitles:(state.dayTitles??[]).filter(t=>t.day!==removed.day||(t.origin==='manual'&&entries.some(e=>e.day===t.day)))};
}
export function upsertGoal(state, input, id) {
  const goal = { id, title: input.title.trim(), why: input.why.trim(), step: input.step.trim(), when: input.when.trim(), doneDates: state.goals.find(g => g.id === id)?.doneDates ?? [] };
  if (!goal.title || goal.title.length > 80 || goal.why.length > 300 || goal.step.length > 200 || goal.when.length > 120) throw new Error('请填写目标标题，并缩短超出长度的内容。');
  return { ...state, goals: [...state.goals.filter(g => g.id !== id), goal] };
}
export function toggleGoal(state, id, day) {
  if (!date(day) || !state.goals.some(g => g.id === id)) throw new Error('目标或日期无效');
  return { ...state, goals: state.goals.map(g => g.id !== id ? g : { ...g, doneDates: g.doneDates.includes(day) ? g.doneDates.filter(d => d !== day) : [...g.doneDates, day] }) };
}
export function retrieveKnowledge(query, limit = 2, related = '') {
  return knowledge.map((card, index) => {
    const current=card.tags.reduce((n,tag)=>n+(query.includes(tag)?1:0),0),prior=card.tags.reduce((n,tag)=>n+(related.includes(tag)?1:0),0);
    return {card,index,score:current*4+prior+(card.kind==='method'&&(current||prior)?2:0)};
  })
    .filter(item => item.score > 0).sort((a, b) => b.score - a.score || a.index - b.index).slice(0, limit).map(item => item.card);
}
export function chooseStrategy({ text: input, mood, energy, preference }) {
  // 仅用于可标识的演示，不是情绪分析或完整风险检测。
  if (/(自杀|自残|不想活|想死|伤害自己|结束生命)/.test(input)) return '安全支持';
  if (preference === '先听我说') return '倾听';
  if (mood === '疲惫' || energy === '低') return '减负';
  if (mood === '难过' || mood === '焦虑') return '梳理';
  if (preference === '帮我行动') return '规划';
  if (mood === '有动力') return '巩固';
  return '探索';
}
export function demoFeedback(input, personaId, goal) {
  const persona = personas.find(p => p.id === personaId) ?? personas[1];
  const strategy = chooseStrategy(input);
  const excerpt = input.text.length > 90 ? input.text.slice(0, 90) + '…' : input.text;
  let reply = `${persona.opener}\n\n你提到：“${excerpt}”`;
  let nextStep = null;
  const step = goal?.step || '选一件能在几分钟内开始的事';
  if (strategy === '安全支持') {
    reply = '你写到的内容可能涉及安全，我想先暂停目标讨论。你现在是否有立即伤害自己的危险？如果有，请立刻联系所在地急救或到附近急诊，并尽可能让可信任的人陪在身边。\n\n如果没有立即危险，也可以联系当地心理支持。这里的演示不能判断你是否安全，也不能代替现实帮助。';
  } else if (strategy === '倾听') {
    reply += '\n\n你选择了先听你说，我们先不急着找方案。今天这件事里，哪一部分最想被理解？';
  } else if (strategy === '减负') {
    reply += '\n\n你主动告诉我现在有些疲惫或精力偏低。先看看付出了什么、又消耗了什么，今天未完成的部分也可以调整。你现在更需要休息，还是把下一步缩小？';
  } else if (strategy === '梳理') {
    reply += `\n\n你选的是“${input.mood}”。我们可以把发生的事和对自己的评价分开，再看看：这件事给你留下了什么，也带来了什么困难？你想先谈哪一部分？`;
  } else if (strategy === '规划') {
    reply += `\n\n你希望讨论行动${goal ? `，现在选定的目标是“${goal.title}”` : ''}。先确认今天已经尝试了什么、卡在哪里，再决定下一步。这个小行动合适吗：${step}？`;
    nextStep = step;
  } else if (strategy === '巩固') {
    reply += '\n\n你报告现在有动力。可以一起找出今天有效的做法，也留意它付出了什么成本。哪一个做法是你想继续保留的？';
  } else {
    reply += '\n\n我还不能仅凭这段话判断你的心情，也不想替你评价这一天。哪件事让你觉得有所收获，或者有所消耗？';
  }
  const cards = retrieveKnowledge(`${strategy} ${input.mood} ${input.text}`, 2);
  return { reply, strategy, nextStep, sourceIds: cards.map(k => k.id), engine: 'local-demo', emotionHypothesis: null };
}
export function aiContext(state, input, selectedGoal, now = new Date()) {
  // 接入契约的本地构建演示；生产权限仍由服务端执行。
  return {
    persona: state.persona, profile: normalizeProfile(state.profile), currentInput: input, selectedGoal: selectedGoal ?? null, currentDay: localDate(now), conversationMode: input.mode === 'chat' ? 'chat' : 'reflection',
    historyConsent: state.remember,
    memories: state.remember ? (state.memories ?? []).map(m => ({ text: m.text, updatedAt: m.updatedAt })) : [],
    sameDay: boundedConversation(state.entries.filter(e => e.day === localDate(now)).map(e => ({day:e.day,text:e.text,mood:e.mood,previousReply:e.feedback?.reply??'',previousStep:e.feedback?.nextStep??'',previousSources:e.feedback?.sourceIds??[],userReaction:e.reaction??'',goalTitle:e.goalSnapshot?.title??''}))),
    history: state.remember ? state.entries.filter(e => e.day !== localDate(now)).slice(-7).map(e => ({ day: e.day, text: e.text, mood: e.mood })) : [],
    knowledge: retrieveKnowledge(`${input.mood} ${input.text} ${selectedGoal?.title ?? ''}`, 3)
  };
}
