import { STORE_KEY, initialState, readState, saveState, localDate, personas, moods, preferences, upsertGoal, toggleGoal, demoFeedback, aiContext, normalizeProfile, upsertMemory, openingPrompt, conversationMode, recordDays, setDayTitle, removeRecord } from './core.mjs';
import { knowledge, sources } from './knowledge.mjs';
import {BACKUP_LIMIT,BEFORE_IMPORT_KEY,parseBackup,saveImportedState} from './backup.mjs';

let browserStore;
try { browserStore = window.localStorage; }
catch { browserStore = { getItem() { throw new Error('浏览器禁用了本地存储'); }, setItem() { throw new Error('浏览器禁用了本地存储'); }, removeItem() { throw new Error('浏览器禁用了本地存储'); } }; }
if (navigator.userAgent.includes('Electron/')) document.body.classList.add('desktop-app');
const loaded = readState(browserStore);
let state = loaded.state;
let storageBlocked = !!loaded.error;
let lastStoredRaw = loaded.raw;
let view = 'today';
let editingGoal = '';
let toastTimer;
let draftTimer;
let aiPending=false;
let promptOffset=0;
let editingMemory='';
let proposedGoal=null;
let historyDay='';
let titlePending='';
const titleAttempted=new Set(),titleNotices=new Map();
let aiSettings={provider:window.dayAi?'chatgpt':'demo',baseUrl:'https://api.openai.com/v1',model:'gpt-4.1-mini',hasKey:false,chatgpt:false};
if(window.dayAi){try{aiSettings=await window.dayAi.settings();}catch{aiSettings.error='AI设置读取失败，请查看连接设置。';}}
function updateAiNote(){document.querySelector('#ai-connection-note').textContent=aiSettings.provider==='demo'?'当前为本地规则演示，不会调用AI。记录保存在当前设备。':aiSettings.provider==='chatgpt'?`ChatGPT订阅（Codex通道）${aiSettings.chatgpt?'已登录':'需要登录'}。聊天或AI起名时会把相关内容发给OpenAI；本地日记未加密。`:'API模式：聊天或AI起名的相关内容会发送给你配置的服务，API费用由该服务另行计费。';}
updateAiNote();
const main = document.querySelector('#main');
const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const id = () => crypto.randomUUID();
const icon = name => `<svg viewBox="0 0 24 24" aria-hidden="true">${({today:'<path d="M5 4h14v16H5zM8 8h8M8 12h8M8 16h5"/>',goals:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><path d="m12 12 8-8"/>',history:'<path d="M4 8a8 8 0 1 1 0 8M4 3v5h5M12 7v5l3 2"/>',companion:'<path d="M4 4h16v12H9l-5 4zM8 8h8M8 12h5"/>',check:'<path d="m5 12 4 4L19 6"/>',empty:'<path d="M6 12h12"/>'})[name]}</svg>`;
const routes = [['today','今天'],['goals','目标'],['history','回望'],['companion','陪伴']];

function toast(message) {
  const el = document.querySelector('#toast');
  el.textContent = message;
  el.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('visible'), 4500);
}
function commit(next,{importing=false}={}) {
  if (storageBlocked) { toast('存储暂时不可用，请先导出或处理顶部提示。输入仍在页面中。'); return false; }
  try {
    const raw = browserStore.getItem(STORE_KEY);
    if (raw !== lastStoredRaw) {
      storageBlocked = true;
      showStorageError('记录已在其他窗口变化，已停止覆盖。请先备份，重新打开后再继续。', raw);
      toast('本地内容发生变化，未覆盖；当前输入仍保留。');
      return false;
    }
    if(importing)saveImportedState(browserStore,next,lastStoredRaw);else saveState(browserStore, next);
    lastStoredRaw = JSON.stringify(next); state = next; return true;
  }
  catch { toast('没有保存成功，输入仍保留。请导出备份，并检查浏览器存储空间或设置。'); return false; }
}
function persistDraft() {
  clearTimeout(draftTimer);
  if (!storageBlocked) commit(state);
}
function nav() {
  const html = routes.map(([key,label]) => `<a class="nav-item" href="#${key}" ${view === key ? 'aria-current="page"' : ''}>${icon(key)}<span>${label}</span></a>`).join('');
  document.querySelector('#desktop-nav').innerHTML = html;
  document.querySelector('#mobile-nav').innerHTML = html;
}
function heading(title, subtitle) { return `<div class="page-heading"><div><h1>${title}</h1><p class="muted">${subtitle}</p></div></div>`; }
function goalRows(goals, editable = false) {
  const day = localDate();
  if (!goals.length) return `<div class="quiet-empty"><p>还没有目标。从一件你在意的小事开始。</p><button class="secondary" data-route="goals">定下一个目标</button></div>`;
  return goals.map(g => `<div class="goal-row"><button class="check-button" data-toggle-goal="${escape(g.id)}" aria-pressed="${g.doneDates.includes(day)}" aria-label="${g.doneDates.includes(day) ? '撤销今天完成' : '标记今天完成'}：${escape(g.title)}">${icon(g.doneDates.includes(day) ? 'check' : 'empty')}</button><div class="goal-copy"><h3>${escape(g.title)}</h3><p class="small muted">${escape(g.step || '可以补充一个足够小的行动')}</p>${editable ? `<p class="small muted">${escape(g.why || '还没有写下自己的理由')}<br>${escape(g.when || '行动时机待你决定')}</p>` : ''}<p class="goal-meter">${g.doneDates.includes(day) ? '今天已完成，可撤销' : '今天还没标记完成'}${editable ? `，累计记录 ${g.doneDates.length} 天` : ''}</p></div>${editable ? `<button class="text-button" data-edit-goal="${escape(g.id)}">修改</button>` : ''}</div>`).join('');
}
function feedbackHtml(entry, withUser = true) {
  const persona = personas.find(p => p.id === entry.persona) ?? personas[1];
  const cards = entry.feedback.sourceIds.map(i => knowledge.find(k => k.id === i)).filter(Boolean);
  const engine = entry.feedback.engine==="chatgpt-codex"?"ChatGPT订阅（Codex）":entry.feedback.engine==="api"?"API生成":"本地规则演示";
  return `<article class="message" data-message="${escape(entry.id)}">
    ${withUser ? `<div class="message-user"><span class="small muted">你</span><p>${escape(entry.text)}</p></div>` : ''}
    <div class="message-header"><span class="avatar" aria-hidden="true">${persona.mark}</span><div><h3>${persona.name}</h3><p class="small muted">${escape(entry.feedback.strategy)} / ${engine}</p></div></div>
    <p class="feedback-copy">${escape(entry.feedback.reply)}</p>
    ${entry.feedback.nextStep && entry.feedback.strategy!=='安全支持' ? `<div class="suggested-step"><p class="small muted">如果你愿意，下一步</p><p>${escape(entry.feedback.nextStep)}</p><button class="text-button" data-use-step="${escape(entry.id)}">放入目标，先看看</button><p class="small muted">打开编辑后，由你确认保存。</p></div>` : ''}
    ${cards.length ? `<details class="reply-sources"><summary>这段回应参考的资料 · ${cards.length}</summary><div class="sources">${cards.map(card=>`<a href="${card.sourceInfo.url}" target="_blank" rel="noopener noreferrer">${card.title} ↗</a>`).join('')}</div></details>` : ''}
    <div class="response-reactions" role="group" aria-label="这段回应对你怎样">${['贴近','像说教','理解偏了'].map(reaction=>`<button class="text-button" data-reaction="${reaction}" data-entry-id="${escape(entry.id)}" aria-pressed="${entry.reaction===reaction}">${reaction}</button>`).join('')}</div>
    <div class="feedback-actions"><button class="text-button" data-correct-mood="true">纠正我的心情</button><button class="text-button" data-listen="true">接下来先听我说</button>${withUser&&entry.feedback.strategy!=='安全支持'?'<button class="text-button" data-request-method="true">一起试个办法</button>':''}${entry.feedback.strategy==='安全支持'?'<button class="secondary help-open">查看现实支持</button>':''}</div>
  </article>`;
}
function arrangeConversation(entries) {
  const chatting=conversationMode(state)==='chat';
  main.classList.toggle('chat-view',chatting);
  const area=main.querySelector('.question-area');
  const form=main.querySelector('#reflection-form');
  const transcript=main.querySelector('.feedback-section');
  area.insertBefore(transcript,form);
  transcript.classList.add('conversation-thread');
  transcript.hidden=!entries.length&&!aiPending;
  transcript.querySelector('.conversation').setAttribute('aria-label','今天的连续对话');
  if(entries.length>12){const more=document.createElement('button');more.className='text-button';more.dataset.route='history';more.textContent='到回望查看更早的对话';transcript.append(more);}
  const greeting=area.querySelector('.greeting');greeting.textContent=openingPrompt(state,new Date(),promptOffset);
  if(entries.length)greeting.classList.add('return-greeting');
  const starters=document.createElement('div');starters.className='prompt-starters';
  starters.innerHTML='<button class="text-button" type="button" id="change-prompt">换个切口</button>';
  if(!entries.length)for(const seed of ['今天有件小事让我开心：','今天最卡住我的地方是：','今天我只想说说：']){
    const button=document.createElement('button');button.type='button';button.className='choice';button.textContent=seed.slice(0,-1);
    button.addEventListener('click',()=>{const text=main.querySelector('#daily-text');if(text.value.trim()){toast('草稿已保留，你可以接着写。');text.focus();return;}text.value=seed;text.dispatchEvent(new Event('input',{bubbles:true}));text.focus();});starters.append(button);
  }
  greeting.after(starters);
  starters.querySelector('#change-prompt').addEventListener('click',()=>{promptOffset++;greeting.textContent=openingPrompt(state,new Date(),promptOffset);});
  const options=document.createElement('details');options.className='conversation-options';
  const summary=document.createElement('summary');summary.textContent='这次怎样陪你 · 精力、倾听方式和目标';options.append(summary);
  const dual=form.querySelector('.dual-fields');const goal=form.querySelector('#reflection-goal').closest('.field');
  form.insertBefore(options,dual);options.append(dual,goal);
  options.open=!chatting&&(state.draft.energy!=='未选择'||state.draft.preference!=='一起分析'||!!state.draft.goalId);
  if(entries.length){
    const toggle=document.createElement('button');toggle.type='button';toggle.className='secondary';toggle.id='conversation-mode-toggle';toggle.textContent=chatting?'返回今日复盘':'继续交流';
    main.querySelector('.page-heading').append(toggle);
    toggle.addEventListener('click',()=>{state.draft.text=form.querySelector('#daily-text').value;if(commit({...state,draft:{...state.draft,mode:chatting?'reflection':'chat'}})){today();main.querySelector('#daily-text').focus({preventScroll:true});}});
  }
  if(chatting){
    main.querySelector('.page-heading h1').textContent='继续聊一会儿';
    main.querySelector('.page-heading .muted').hidden=true;
    main.querySelector('.page-heading div>p:last-child').textContent='接着刚才的话聊，也可以说新的想法。';
    form.querySelector('label[for="daily-text"]').textContent='继续说说';
    form.querySelector('#daily-text').placeholder='回应刚才的问题，或说说你真正想聊的……';
    const mood=form.querySelector('#mood-choices').closest('.field');options.insertBefore(mood,dual);
    summary.textContent='调整心情、陪伴方式和关联目标';
    form.querySelector('.draft-note').textContent='Ctrl+Enter发送。前面的复盘和近期交流会用于承接本次对话。';
    transcript.querySelector('.section-line h2').textContent='这次的交流';
    requestAnimationFrame(()=>{const latest=transcript.querySelector('.message:last-child');if(latest)latest.scrollIntoView({block:'end'});});
  }
  const submit=form.querySelector('button[type="submit"]');submit.disabled=aiPending;submit.textContent=aiPending?'正在回应，请稍等':chatting?'发送':aiSettings.provider==='demo'?'听听反馈':'发送并获得AI反馈';
  if(aiPending){const pending=document.createElement('p');pending.id='reply-pending';pending.className='small muted';pending.setAttribute('role','status');pending.textContent='正在整理回应，完成后会保存在这里。';transcript.querySelector('.conversation').append(pending);}
}
function today() {
  const day = localDate();
  const entries = state.entries.filter(e => e.day === day);
  const persona = personas.find(p => p.id === state.persona);
  const draft = state.draft;
  const feature = knowledge[3];
  main.innerHTML = `<div class="page-heading"><div><p class="small muted">${new Intl.DateTimeFormat('zh-CN',{month:'long',day:'numeric',weekday:'long'}).format(new Date())}</p><h1>今天，过得怎么样？</h1><p class="muted">${entries.length ? '欢迎回来。今天还有什么想补充的？' : '从一件小事说起，就够了。'}</p></div></div><div class="today-grid"><div><section class="question-area" aria-label="今天的对话"><div class="companion-line"><span class="avatar" aria-hidden="true">${persona.mark}</span><div><h2>${persona.name}</h2><p class="small muted">${persona.accent}</p></div><button class="text-button" data-route="companion">换个角色</button></div><p class="greeting">${persona.greeting}</p><form id="reflection-form"><div class="field"><label for="daily-text">今天发生了什么</label><textarea id="daily-text" maxlength="3000" placeholder="做了什么、遇到了谁，或者有什么事一直留在心里……">${escape(draft.text)}</textarea><div class="field-help"><span id="draft-status">${draft.text ? '上次的草稿在这里' : 'Ctrl+Enter发送 · 想说多少，由你决定'}</span><span id="text-count">${draft.text.length}/3000</span></div></div><div class="field"><span class="field-label" id="mood-label">此刻更接近哪种心情</span><div class="choices" id="mood-choices" role="group" aria-labelledby="mood-label">${moods.map(m => `<button type="button" class="choice" data-mood="${m}" aria-pressed="${m === draft.mood}">${m}</button>`).join('')}</div></div><div class="dual-fields"><div class="field"><label for="energy">现在的精力</label><select id="energy">${['未选择','低','中','高'].map(v => `<option ${v === draft.energy ? 'selected' : ''}>${v}</option>`).join('')}</select></div><div class="field"><label for="preference">希望怎样陪你</label><select id="preference">${preferences.map(v => `<option ${v === draft.preference ? 'selected' : ''}>${v}</option>`).join('')}</select></div></div><div class="field"><label for="reflection-goal">想关联的目标</label><select id="reflection-goal"><option value="">今天先不关联</option>${state.goals.map(g => `<option value="${escape(g.id)}" ${g.id === draft.goalId ? 'selected' : ''}>${escape(g.title)}</option>`).join('')}</select></div><p id="reflection-error" class="error-inline" role="alert"></p><div class="form-bottom"><p class="draft-note">提交后会发送至所选AI服务；记录可在“回望”删除。不能代替心理评估。</p><button class="primary" type="submit">${aiSettings.provider==="demo"?"听听反馈":"发送并获得AI反馈"}</button></div></form></section><section class="feedback-section" aria-labelledby="feedback-heading"><div class="section-line"><h2 id="feedback-heading">今天的回声</h2><span class="small muted">${entries.length} 段记录</span></div><div class="conversation">${entries.length ? entries.slice(-12).map(e => feedbackHtml(e)).join('') : '<p class="quiet-empty">写下今天的经历，回应会留在这里。</p>'}</div></section></div><aside class="today-side"><section class="side-section"><div class="section-line"><h2>往目标靠近一点</h2><button class="text-button" data-route="goals">管理目标</button></div>${goalRows(state.goals.slice(0,3))}</section><section class="knowledge-feature"><h3>${feature.title}</h3><p class="muted">${feature.body}</p><button class="text-button" data-route="companion">看看成长资料 →</button></section><section class="onboarding-tip"><h2>在这里，你可以</h2><p class="muted">说开心，也说难处。让建议更轻一点，或者暂时只被听见。</p><p class="muted">目标可以改。休息也可以成为今天的决定。</p></section></aside></div>`;
  arrangeConversation(entries);
  bindCommon();
  const area = document.querySelector('#daily-text');
  area.addEventListener('keydown',event=>{if(event.key==='Enter'&&event.ctrlKey&&!event.isComposing){event.preventDefault();const submit=document.querySelector('#reflection-form button[type="submit"]');if(!submit.disabled)document.querySelector('#reflection-form').requestSubmit(submit);}});
  const syncDraft = () => {
    state.draft = { ...state.draft, text: area.value, energy: document.querySelector('#energy').value, preference: document.querySelector('#preference').value, goalId: document.querySelector('#reflection-goal').value };
    document.querySelector('#text-count').textContent = `${area.value.length}/3000`;
    document.querySelector('#draft-status').textContent = '正在保留草稿';
    clearTimeout(draftTimer);
    draftTimer = setTimeout(() => {
      if (commit(state)) document.querySelector('#draft-status')?.replaceChildren('草稿已保存在当前设备');
    }, 350);
  };
  area.addEventListener('input', syncDraft);
  for (const select of document.querySelectorAll('#reflection-form select')) select.addEventListener('change', syncDraft);
  for (const button of document.querySelectorAll('[data-mood]')) button.addEventListener('click', () => {
    state.draft.mood = button.dataset.mood;
    document.querySelectorAll('[data-mood]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    syncDraft();
  });
  document.querySelector('#reflection-form').addEventListener('submit', async event => {
    event.preventDefault();
    clearTimeout(draftTimer);
    const input = { ...state.draft, text: area.value.trim(), mode: conversationMode(state) };
    if (!input.text) { document.querySelector('#reflection-error').textContent = input.mode==='chat'?'写下你想继续说的话。':'先写下今天的一件事。'; area.focus(); return; }
    if(aiPending)return;
    if(storageBlocked){toast('存储不可用，未发送对话。请先备份并恢复本地记录。');return;}
    if(!commit(state))return;
    const submittedDay=localDate();
    const goal = state.goals.find(g => g.id === input.goalId);
    const selectedPersona=state.persona;
    const button=event.submitter;aiPending=true;button.disabled=true;button.textContent='正在回应，请稍等';
    const pending=document.createElement('p');pending.id='reply-pending';pending.className='pending-reply small muted';pending.setAttribute('role','status');pending.textContent='正在整理回应，你可以继续写。';document.querySelector('.conversation').append(pending);
    document.querySelector('.conversation-thread').hidden=false;pending.scrollIntoView({block:'end'});
    try{
      const feedback=aiSettings.provider==='demo'?demoFeedback(input,selectedPersona,goal):await window.dayAi.reply(aiContext(state,input,goal));
      const entry = { id: id(), day: submittedDay, createdAt: new Date().toISOString(), ...input, persona:selectedPersona, goalSnapshot: goal ? { title: goal.title, step: goal.step } : null, feedback };
      let next = { ...state, entries:[...state.entries,entry], draft:{...state.draft,mode:'chat',text:state.draft.text.trim()===input.text?'':state.draft.text} };
      if(feedback.dayTitle)next=setDayTitle(next,entry.day,feedback.dayTitle,'ai');
      if(commit(next)){promptOffset=0;if(view==='today'){today();document.querySelector('#daily-text').focus({preventScroll:true});}toast(feedback.engine==='local-demo'?'记录和演示反馈已保存':'AI反馈和记录已保存');}
    }catch(error){const message=String(error.message).replace(/^Error invoking remote method '[^']+': Error: /,'');if(view==='today')document.querySelector('#reflection-error').textContent=message;else toast(message);}
    finally{aiPending=false;document.querySelector('#reply-pending')?.remove();const current=document.querySelector('#reflection-form button[type="submit"]');if(current){current.disabled=false;current.textContent=conversationMode(state)==='chat'?'发送':aiSettings.provider==='demo'?'听听反馈':'发送并获得AI反馈';}if(view==='history')historyPage();}
  });
}
function goalsPage() {
  const editing = state.goals.find(g => g.id === editingGoal);
  main.innerHTML = `${heading('把在意的事，变成一小步','你来决定方向，也可以随时调整。')}<div class="page-columns"><section><div class="section-line"><h2>我的目标</h2><span class="small muted">${state.goals.length} 个</span></div>${goalRows(state.goals,true)}<p class="privacy-note">完成标记按当天记录，不是给你评分。</p></section><section class="panel" aria-labelledby="goal-form-title"><h2 id="goal-form-title">${editing ? '修改这个目标' : '定下一个目标'}</h2><form id="goal-form"><div class="field"><label for="goal-title">想做的事</label><input id="goal-title" maxlength="80" required value="${escape(editing?.title)}" placeholder="例如：把英语重新捡起来"></div><div class="field"><label for="goal-why">为什么对你重要（可选）</label><textarea id="goal-why" maxlength="300" placeholder="用自己的理由，而不是应该……">${escape(editing?.why)}</textarea></div><div class="field"><label for="goal-step">最小的一步（可选）</label><input id="goal-step" maxlength="200" value="${escape(editing?.step)}" placeholder="例如：读一页喜欢的文章"></div><div class="field"><label for="goal-when">什么时候开始（可选）</label><input id="goal-when" maxlength="120" value="${escape(editing?.when)}" placeholder="例如：晚饭后，坐回书桌时"></div><p id="goal-error" class="error-inline" role="alert"></p><div class="form-actions"><button class="primary" type="submit">${editing ? '保存修改' : '保存目标'}</button>${editing ? '<button class="text-button" type="button" id="cancel-edit">取消修改</button>' : ''}</div></form></section></div>`;
  bindCommon();
  if(proposedGoal){document.querySelector('#goal-step').value=proposedGoal.step;if(!editing)document.querySelector('#goal-title').value=proposedGoal.title;proposedGoal=null;}
  document.querySelector('#cancel-edit')?.addEventListener('click', () => {editingGoal='';goalsPage();});
  document.querySelector('#goal-form').addEventListener('submit', event => {
    event.preventDefault();
    const input = Object.fromEntries(['title','why','step','when'].map(k => [k,document.querySelector(`#goal-${k}`).value]));
    try { const next = upsertGoal(state,input,editingGoal || id()); if (commit(next)) {editingGoal='';goalsPage();toast('目标已保存，你可以从最小的一步开始');} }
    catch(error) {document.querySelector('#goal-error').textContent=error.message;}
  });
}
function historyPage() {
  const days=recordDays(state),selected=days.find(d=>d.day===historyDay);
  if(!selected){historyDay='';main.innerHTML=`${heading('回望，走过的日子','按天收好，点开再看那一天。')}<section><div class="section-line"><h2>我的记录</h2><span class="small muted">${days.length} 天 · ${state.entries.length} 段对话</span></div>${days.length?`<p class="small muted day-list-note">${aiSettings.provider==='demo'?'本地演示不生成AI标题，可点开后自己起名。':'还没有标题的旧记录，首次点开会发送这一天的内容给AI起名。'}</p><div class="day-list">${days.map(d=>`<button class="day-row" data-open-day="${d.day}" aria-label="查看${d.day}：${escape(d.title?.title??'这一天的记录')}"><time datetime="${d.day}">${d.day}</time><span class="day-row-copy"><strong>${escape(d.title?.title??'这一天的记录')}</strong><span class="small muted">${d.entries.length} 段对话${d.title?.origin==='manual'?' · 自己起的标题':''}</span></span><span aria-hidden="true">→</span></button>`).join('')}</div>`:'<div class="quiet-empty"><p>这里会留下你写过的日子。先从今天开始。</p><button class="secondary" data-route="today">聊聊今天</button></div>'}</section>`;bindCommon();main.querySelectorAll('[data-open-day]').forEach(b=>b.addEventListener('click',()=>{historyDay=b.dataset.openDay;historyPage();main.scrollTop=0;main.querySelector('#day-heading').focus({preventScroll:true});}));return;}
  main.innerHTML=`<div class="page-heading"><div><p class="small muted"><time datetime="${selected.day}">${selected.day}</time> · ${selected.entries.length} 段对话</p><h1 id="day-heading" tabindex="-1">${escape(selected.title?.title??'这一天的记录')}</h1><p id="day-title-origin" class="small muted">${selected.title?.origin==='manual'?'你为这一天起的名字':selected.title?'AI整理的标题，随时可以修改':aiSettings.provider==='demo'?'可以为这一天起个名字':'AI会为这一天整理一个标题'}</p></div><button class="secondary" id="back-to-days">返回日期列表</button></div><section class="day-title-tools"><button class="text-button" id="edit-day-title">修改标题</button><p id="day-title-status" class="small muted" role="status">${escape(titlePending===selected.day?'正在整理这一天的标题…':titleNotices.get(selected.day)??(aiSettings.provider==='demo'?'本地演示不生成AI标题，你可以自己起名。':'标题由这一天的记录总结；旧记录首次打开时发送这一天给AI；较长记录只参考部分内容。'))}</p><form id="day-title-form" hidden><div class="field"><label for="day-title-input">这一天的标题</label><input id="day-title-input" maxlength="40" required value="${escape(selected.title?.title??'')}" placeholder="给这一天起个名字"></div><div class="form-actions"><button class="primary" type="submit">保存标题</button><button class="secondary" type="button" id="generate-title" ${aiPending||aiSettings.provider==='demo'?'disabled':''}>${titlePending===selected.day?'正在生成…':'AI重新起名'}</button><button class="text-button" type="button" id="cancel-day-title">取消修改</button></div><p class="small muted">AI重新起名会先填入这里，保存后才替换。</p><p id="day-title-error" class="error-inline" role="alert"></p></form></section><section aria-label="这一天的具体记录">${selected.entries.map(e=>`<article class="entry" data-entry="${escape(e.id)}"><div class="entry-title"><div><h2 class="record-turn">第${selected.entries.indexOf(e)+1}段 · ${e.mode==='chat'?'交流':'记录'}</h2><p class="small muted">${escape(e.mood)}${e.goalSnapshot?` / ${escape(e.goalSnapshot.title)}`:''}</p></div><button class="text-button" data-delete-entry="${escape(e.id)}">删除记录</button></div><p class="entry-text">${escape(e.text)}</p><details><summary>查看当时的反馈</summary>${feedbackHtml(e,false)}</details><div class="delete-confirm" hidden></div></article>`).join('')}</section>`;
  bindCommon();
  main.querySelector('#back-to-days').addEventListener('click',()=>{const day=historyDay;historyDay='';historyPage();main.querySelector(`[data-open-day="${day}"]`)?.focus();});
  main.querySelector('#edit-day-title').addEventListener('click',()=>{main.querySelector('#day-title-form').hidden=false;main.querySelector('#day-title-input').focus();});
  main.querySelector('#cancel-day-title').addEventListener('click',()=>{historyPage();main.querySelector('#edit-day-title').focus();});
  main.querySelector('#day-title-form').addEventListener('submit',e=>{e.preventDefault();try{if(commit(setDayTitle(state,selected.day,main.querySelector('#day-title-input').value))){historyPage();toast('标题已保存，后续聊天会保留你的名字');}}catch(error){main.querySelector('#day-title-error').textContent=error.message;}});
  main.querySelector('#generate-title').addEventListener('click',()=>generateDayTitle(selected.day,false));
  document.querySelectorAll('[data-delete-entry]').forEach(button => button.addEventListener('click', () => {
    const box = button.closest('article').querySelector('.delete-confirm');
    box.hidden=false;
    box.innerHTML='<div class="confirm-inline"><p>删除这段记录及其反馈？此操作不能撤销。</p><div class="form-actions"><button class="danger confirm-delete">删除这一段</button><button class="secondary cancel-delete">保留记录</button></div></div>';
    box.querySelector('.confirm-delete').addEventListener('click', () => {if(commit(removeRecord(state,button.dataset.deleteEntry))){historyPage();toast('这段记录已删除');}});
    box.querySelector('.cancel-delete').addEventListener('click',()=>{box.hidden=true;button.focus();});
    box.querySelector('.cancel-delete').focus();
  }));
  if(!selected.title&&!titleAttempted.has(selected.day)&&!aiPending&&aiSettings.provider!=='demo'&&!storageBlocked)generateDayTitle(selected.day,true);
}
async function generateDayTitle(day,automatic){
  if(aiPending){toast('AI正在回应，请稍等再生成标题');return;}
  if(storageBlocked||!window.dayAi)return;
  titleAttempted.add(day);titlePending=day;aiPending=true;
  const entries=state.entries.filter(e=>e.day===day),snapshot=JSON.stringify(entries.map(e=>[e.id,e.text])),oldTitle=JSON.stringify((state.dayTitles??[]).find(t=>t.day===day)),field=main.querySelector('#day-title-input'),oldDraft=field?.value;
  const status=main.querySelector('#day-title-status');if(status)status.textContent='正在整理这一天的标题…';const button=main.querySelector('#generate-title');if(button){button.disabled=true;button.textContent='正在生成…';}
  try{
    const result=await window.dayAi.summarize({day,entries:entries.map(e=>({day:e.day,text:e.text}))});
    if(snapshot!==JSON.stringify(state.entries.filter(e=>e.day===day).map(e=>[e.id,e.text]))||oldTitle!==JSON.stringify((state.dayTitles??[]).find(t=>t.day===day))){titleNotices.set(day,'记录或标题已变化，保留你的修改；需要时可以重新生成。');return;}
    if(automatic){if(commit(setDayTitle(state,day,result.title,'ai')))titleNotices.set(day,'AI标题已保存，你可以随时修改。');}
    else titleNotices.set(day,'新标题已填入编辑框，保存后才替换。');
    if(view==='history'&&historyDay===day){const current=main.querySelector('#day-title-input');if(current&&current.value===oldDraft)current.value=result.title;if(automatic){main.querySelector('#day-heading').textContent=(state.dayTitles??[]).find(t=>t.day===day)?.title??'这一天的记录';main.querySelector('#day-title-origin').textContent='AI整理的标题，随时可以修改';}}
  }catch(error){titleNotices.set(day,String(error.message).replace(/^Error invoking remote method '[^']+': Error: /,'')+' 原记录和标题保留；可以重试或手动修改。');}
  finally{aiPending=false;titlePending='';if(view==='history'){if(!historyDay)historyPage();else{const status=main.querySelector('#day-title-status');if(status)status.textContent=titleNotices.get(historyDay)??'你可以修改标题。';const button=main.querySelector('#generate-title');if(button){button.disabled=aiSettings.provider==='demo';button.textContent='AI重新起名';}}}else if(view==='today')today();}
}
function libraryHtml(query = '', kind = 'all') {
  const cards=knowledge.filter(k=>(kind==='all'||(kind==='method'?k.kind==='method':k.kind!=='method'))&&`${k.title}${k.body}${k.practice}${k.tags.join('')}${(k.steps??[]).join('')}`.includes(query));
  return cards.length?cards.map(k=>`<article class="knowledge-card" data-kind="${k.kind??'concept'}"><h3>${escape(k.title)}</h3><p>${escape(k.body)}</p><p class="muted">可以试试：${escape(k.practice)}</p>
    ${k.kind==='method'?`<details class="method-detail"><summary>展开做法与适用条件</summary><ol>${k.steps.map(step=>`<li>${escape(step)}</li>`).join('')}</ol><p class="small muted">试过后回看：${escape(k.followUp)}</p><p class="small muted">什么时候停或调整：${escape(k.stopWhen)}</p></details>`:''}
    <p class="small muted">适用边界：${escape(k.limit)}</p><a class="source-link" href="${k.sourceInfo.url}" target="_blank" rel="noopener noreferrer">${k.sourceInfo.name} ↗</a><p class="small muted">${k.sourceInfo.evidence} / ${k.authorship} / 核验 ${k.reviewedAt}</p>
    ${k.validation?.length?`<div class="method-refs"><p class="small muted">交叉核验</p>${k.validation.map(key=>sources[key]).filter(Boolean).map(s=>`<a href="${s.url}" target="_blank" rel="noopener noreferrer">${s.name} ↗</a>`).join('')}</div>`:''}
    ${k.social?.length?`<details class="method-refs"><summary>社交发现线索 · 不作为疗效证明</summary>${k.social.map(key=>sources[key]).filter(Boolean).map(s=>`<p><a href="${s.url}" target="_blank" rel="noopener noreferrer">${s.name} ↗</a><br><span class="small muted">${s.evidence}</span></p>`).join('')}</details>`:''}
  </article>`).join(''):'<p class="quiet-empty">没有匹配的资料，试试“串不起来”“自责”或“目标”。</p>';
}
function download(content,name,type='application/json') {
  const blob=new Blob([content],{type});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function insertBackupTools(){
  const tools=document.querySelector('#export-data').parentElement;
  const button=document.createElement('button');button.className='secondary';button.id='import-data';button.textContent='从备份恢复';tools.append(button);
  const section=document.createElement('div');section.id='import-panel';section.hidden=true;tools.after(section);
  const showCandidate=(candidate,label)=>{
    const before=lastStoredRaw;const s=candidate.summary;
    section.innerHTML=`<div class="confirm-inline"><h3>${escape(label)}</h3><p>${s.days}天 · ${s.entries}段记录 · ${s.goals}个目标 · ${s.memories}条确认事实</p><p class="privacy-note">恢复会替换当前记录和偏好。导入前内容会留在本机供恢复；AI连接不改动，历史授权重新关闭。文件不会发送给AI。</p><div class="form-actions"><button class="primary" id="confirm-import">确认恢复这些记录</button><button class="secondary" id="cancel-import">取消</button></div><p id="import-error" class="error-inline" role="alert"></p></div>`;
    section.querySelector('#cancel-import').onclick=()=>{section.hidden=true;button.focus();};
    section.querySelector('#confirm-import').onclick=()=>{
      if(aiPending){section.querySelector('#import-error').textContent='回复正在生成，请等完成后再恢复。';return;}
      if(lastStoredRaw!==before){section.querySelector('#import-error').textContent='当前记录已经变化，请重新选择备份。';return;}
      clearTimeout(draftTimer);
      if(commit(candidate.state,{importing:true})){titleAttempted.clear();titleNotices.clear();historyDay='';editingGoal='';proposedGoal=null;render();toast('记录已恢复；可以在陪伴页导出导入前的备份。');}
    };
    section.querySelector('#cancel-import').focus();
  };
  button.onclick=()=>{
    if(aiPending){toast('回复正在生成，请等完成后再恢复。');return;}
    section.hidden=false;section.innerHTML='<div class="field"><label for="backup-file">选择日有回声JSON备份（最多8MB）</label><input id="backup-file" type="file" accept=".json,application/json"><p id="import-error" class="error-inline" role="alert"></p><button class="text-button" id="close-import">取消</button></div>';
    section.querySelector('#close-import').onclick=()=>{section.hidden=true;button.focus();};
    section.querySelector('#backup-file').onchange=async event=>{const file=event.target.files[0];if(!file)return;const readFrom=lastStoredRaw;try{if(file.size>BACKUP_LIMIT)throw new Error('请选择8MB以内的JSON备份。');const candidate=parseBackup(await file.text());if(lastStoredRaw!==readFrom)throw new Error('当前记录已经变化，请重新选择备份。');if(!section.isConnected)return;showCandidate(candidate,file.name);}catch(error){section.querySelector('#import-error').textContent=error.message;}};
    section.querySelector('#backup-file').focus();
  };
  let previousRaw=null;try{previousRaw=browserStore.getItem(BEFORE_IMPORT_KEY);}catch{/* Unavailable storage is already reported by the existing storage panel. */}
  if(previousRaw!==null){
    const previous=document.createElement('button');previous.id='export-before-import';previous.className='text-button';previous.textContent='导出导入前的备份';previous.onclick=()=>download(browserStore.getItem(BEFORE_IMPORT_KEY),`日有回声-导入前-${localDate()}.json`);tools.append(previous);
    const note=document.createElement('p');note.className='small muted';note.textContent='每次恢复保留一份导入前备份；新的恢复会替换它。需要回退时，先导出这份备份，再选择它恢复。';tools.after(note);
  }
}
function insertAiSettings(){
  const section=document.createElement('details');section.className='ai-settings';section.open=!!aiSettings.error||(!aiSettings.chatgpt&&aiSettings.provider==='chatgpt');
  section.innerHTML=`<h2>AI连接</h2><p class="small muted">默认使用ChatGPT订阅所含的Codex能力。它使用Codex额度，和网页ChatGPT的对话及API余额分开。</p><form id="ai-settings-form"><div class="field"><label for="ai-provider">对话通道</label><select id="ai-provider"><option value="chatgpt" ${aiSettings.provider==='chatgpt'?'selected':''}>ChatGPT订阅（Codex通道）</option><option value="api" ${aiSettings.provider==='api'?'selected':''}>自选兼容OpenAI格式的API</option><option value="demo" ${aiSettings.provider==='demo'?'selected':''}>本地规则演示</option></select></div><div id="api-fields" ${aiSettings.provider==='api'?'':'hidden'}><div class="field"><label for="api-base">API基础地址</label><input id="api-base" value="${escape(aiSettings.baseUrl)}" maxlength="500" placeholder="https://api.openai.com/v1"></div><div class="field"><label for="api-model">模型名称</label><input id="api-model" value="${escape(aiSettings.model)}" maxlength="120"></div><div class="field"><label for="api-key">你的API密钥</label><input id="api-key" type="password" autocomplete="off" maxlength="2000" placeholder="${aiSettings.hasKey?'已安全保存，留空保持':'仅保存在Windows安全存储，不回显'}"></div><p class="small muted">API按服务商规则另行计费，Plus订阅不会转换成API余额。更换API地址后需要重新填写密钥。</p></div><p id="ai-settings-error" class="error-inline" role="alert">${escape(aiSettings.error??'')}</p><button class="primary" type="submit" ${window.dayAi?'':'disabled'}>保存AI设置</button></form><div class="data-tools"><button class="secondary" id="chatgpt-login" ${window.dayAi?'':'disabled'}>用ChatGPT账号登录</button><button class="text-button" id="check-login" ${window.dayAi?'':'disabled'}>检查登录状态</button></div><p id="login-status" class="small muted">${aiSettings.chatgpt?'已检测到ChatGPT登录。能否使用以账户的Codex额度为准。':'尚未检测到ChatGPT登录。需要你在官方浏览器页面完成登录。'}</p><div id="login-instructions" hidden></div><p class="privacy-note">仅提交你写下的内容、选定目标与必要的当日对话。较早记录需开启下方历史授权。Codex采用临时会话，不把本次对话写入它的本地会话文件。API密钥不进入网页或日记导出。</p><hr>`;
  const summary=document.createElement('summary');summary.textContent='AI连接 · '+(aiSettings.provider==='chatgpt'?'ChatGPT订阅':aiSettings.provider==='api'?'自选API':'本地演示');section.prepend(summary);main.querySelector('.page-columns').firstElementChild.append(section);
  const provider=section.querySelector('#ai-provider');provider.addEventListener('change',()=>{section.querySelector('#api-fields').hidden=provider.value!=='api';});
  section.querySelector('#ai-settings-form').addEventListener('submit',async event=>{event.preventDefault();const button=event.submitter;button.disabled=true;try{aiSettings=await window.dayAi.save({provider:provider.value,baseUrl:section.querySelector('#api-base').value,model:section.querySelector('#api-model').value,apiKey:section.querySelector('#api-key').value});section.querySelector('#api-key').value='';updateAiNote();companionPage();toast('AI设置已保存');}catch(error){section.querySelector('#ai-settings-error').textContent=error.message;}finally{button.disabled=false;}});
  section.querySelector('#check-login').addEventListener('click',async()=>{try{aiSettings=await window.dayAi.settings();updateAiNote();section.querySelector('#login-status').textContent=aiSettings.chatgpt?'已检测到ChatGPT登录，可以回到今天发送对话。':'还没有ChatGPT登录，请先完成官方登录。';}catch(error){section.querySelector('#ai-settings-error').textContent=error.message;}});
  section.querySelector('#chatgpt-login').addEventListener('click',async event=>{const button=event.currentTarget;button.disabled=true;try{const info=await window.dayAi.login();const box=section.querySelector('#login-instructions');box.hidden=false;box.replaceChildren();const p=document.createElement('p');p.textContent='在官方登录页面输入一次性代码：'+info.code;const open=document.createElement('button');open.className='secondary';open.textContent='打开官方登录页';open.addEventListener('click',()=>window.dayAi.openLogin(info.url).catch(error=>toast(error.message)));box.append(p,open);toast('请自行完成官方登录，再检查登录状态');}catch(error){section.querySelector('#ai-settings-error').textContent=error.message;}finally{button.disabled=false;}});
}
function insertCompanionPreferences() {
  const section=document.createElement('section');section.className='companion-preferences';
  const profile=normalizeProfile(state.profile);
  section.innerHTML=`<h2>怎样聊，你更舒服</h2><p class="small muted">回应可以更短、更坦诚，也可以少一点追问。偏好会在你发送时交给AI。</p>
  <form id="profile-form"><div class="field"><label for="profile-nickname">希望怎么称呼你（可选）</label><input id="profile-nickname" maxlength="20" value="${escape(profile.nickname)}" placeholder="留空也可以"></div>
  <div class="dual-fields"><div class="field"><label for="profile-length">回复的长度</label><select id="profile-length">${['简短','自然','展开聊'].map(v=>`<option ${v===profile.length?'selected':''}>${v}</option>`).join('')}</select></div>
  <div class="field"><label for="profile-tone">说话的方式</label><select id="profile-tone">${['温和','坦诚直接'].map(v=>`<option ${v===profile.tone?'selected':''}>${v}</option>`).join('')}</select></div></div>
  <div class="field"><label for="profile-questions">追问的节奏</label><select id="profile-questions">${['适时追问','少问问题'].map(v=>`<option ${v===profile.questions?'selected':''}>${v}</option>`).join('')}</select></div><button class="secondary" type="submit">保存聊天偏好</button></form><hr>
  <h2>你愿意让我记住的事</h2><p class="small muted">只记你亲自确认的事实，不自动保存AI的推测。最多12条，可修改和忘记；需开启“允许AI参考近期历史”才会发送。</p>
  <div class="memory-list">${(state.memories??[]).length?(state.memories??[]).map(m=>`<div class="memory-row"><div><p>${escape(m.text)}</p><span class="small muted">你确认于 ${escape(m.updatedAt)}</span></div><button class="text-button" type="button" data-edit-memory="${escape(m.id)}">修改</button><button class="text-button" type="button" data-forget-memory="${escape(m.id)}">忘记</button></div>`).join(''):'<p class="quiet-empty">还没有记忆。可以写下你的习惯、在意的事，或不喜欢的陪伴方式。</p>'}</div>
  <form id="memory-form"><div class="field"><label for="memory-text">一件你确认的事</label><textarea id="memory-text" maxlength="140" placeholder="例如：晚上精力较低，希望别催我加任务。"></textarea></div><p id="memory-error" class="error-inline" role="alert"></p><div class="form-actions"><button class="secondary" id="save-memory" type="submit">记住这件事</button><button class="text-button" id="cancel-memory" type="button" hidden>取消修改</button></div></form><p class="privacy-note">关闭历史授权会停止后续发送，不删除本地记忆，也无法撤回已发给供应商的内容。日记和记忆仍未加密。</p><hr>`;
  const column=main.querySelector('.page-columns').firstElementChild;
  column.insertBefore(section,column.querySelector('.setting-row'));
  section.querySelector('#profile-form').addEventListener('submit',event=>{event.preventDefault();const profile=normalizeProfile({nickname:section.querySelector('#profile-nickname').value,length:section.querySelector('#profile-length').value,tone:section.querySelector('#profile-tone').value,questions:section.querySelector('#profile-questions').value});if(commit({...state,profile}))toast('聊天偏好已保存，下次发送时生效。');});
  const cancel=()=>{editingMemory='';section.querySelector('#memory-text').value='';section.querySelector('#save-memory').textContent='记住这件事';section.querySelector('#cancel-memory').hidden=true;};
  section.querySelector('#cancel-memory').addEventListener('click',cancel);
  section.querySelector('#memory-form').addEventListener('submit',event=>{event.preventDefault();try{if(commit(upsertMemory(state,section.querySelector('#memory-text').value,editingMemory||id()))){editingMemory='';companionPage();toast(state.remember?'记忆已保存，下次发送时可参考。':'记忆已保存；历史授权关闭，暂不发送。');}}catch(error){section.querySelector('#memory-error').textContent=error.message;}});
  section.querySelectorAll('[data-edit-memory]').forEach(button=>button.addEventListener('click',()=>{const memory=state.memories.find(m=>m.id===button.dataset.editMemory);editingMemory=memory.id;section.querySelector('#memory-text').value=memory.text;section.querySelector('#save-memory').textContent='保存这条记忆';section.querySelector('#cancel-memory').hidden=false;section.querySelector('#memory-text').focus();}));
  section.querySelectorAll('[data-forget-memory]').forEach(button=>button.addEventListener('click',()=>{if(commit({...state,memories:state.memories.filter(m=>m.id!==button.dataset.forgetMemory)})){editingMemory='';companionPage();toast('这条记忆已忘记，后续不再发送。');}}));
}
function companionPage() {
  editingMemory='';
  main.innerHTML=`${heading('选择，舒服的陪伴方式','亲近的语气，也尊重你的决定。')}<div class="page-columns"><section><h2>谁陪你聊一会儿</h2>${personas.map(p=>`<button class="persona-option" data-persona="${p.id}" aria-pressed="${p.id===state.persona}"><span class="avatar" aria-hidden="true">${p.mark}</span><span class="role-copy"><strong>${p.name}</strong><span class="small muted"><br>${p.description}</span></span><span class="selection">${p.id===state.persona?'已选择':'选择'}</span></button>`).join('')}<p class="privacy-note">角色是虚构的成人表达风格。关心可以有期待，也应给你拒绝、休息和改变目标的自由。</p><div class="setting-row"><input type="checkbox" id="remember" ${state.remember?'checked':''}><label for="remember"><strong>允许 AI 参考近期历史</strong><p class="small muted">默认关闭。开启后可参考你确认的事实记忆及最多七段较早记录；当日对话用于延续交流。只在提交时发送。</p></label></div><hr><h2>你的记录，由你掌握</h2><p class="privacy-note">日记和记忆保存在当前设备，未加密；发送时必要内容会交给所选AI服务。清理应用数据会丢失记录，请先导出备份。桌面体验版的正式数据保护仍需完善。</p><div class="data-tools"><button class="secondary" id="export-data">导出我的记录</button><button class="text-button" id="clear-data">清空本地内容</button></div><div id="clear-confirm" hidden></div></section><section><div class="library-heading"><h2>成长资料</h2><p class="small muted">${knowledge.length} 张精选原创卡，来源可查。用于理解与尝试，不提供诊断或保证效果。</p></div><div class="field"><label for="knowledge-search">查找一个话题</label><input type="search" id="knowledge-search" placeholder="目标、休息、自责、关系……"></div><div class="library-list" id="library-list">${libraryHtml()}</div></section></div>`;
  bindCommon();
  insertAiSettings();
  insertCompanionPreferences();
  insertBackupTools();
  const licenseInfo=document.createElement('details');licenseInfo.className='privacy-note';licenseInfo.innerHTML='<summary>项目与许可</summary><p>日有回声0.8.0 · 源码公开协作，采用PolyForm Noncommercial 1.0.0。非商业使用、修改和分发遵循许可；商业使用需联系作者zhouzi4449另行授权。</p><p><a href="https://github.com/zhouzi4449/day-companion" target="_blank" rel="noopener noreferrer">查看项目与参与改进 ↗</a> · <a href="https://github.com/zhouzi4449/day-companion/blob/main/COMMERCIAL.md" target="_blank" rel="noopener noreferrer">商业授权说明 ↗</a></p>';document.querySelector('#export-data').closest('section').append(licenseInfo);
  const libraryFilters=document.createElement('div');libraryFilters.className='field';libraryFilters.innerHTML=`<label for="knowledge-kind">资料类型</label><select id="knowledge-kind"><option value="all">全部资料</option><option value="method">可试的方法（${knowledge.filter(k=>k.kind==='method').length}）</option><option value="concept">理解与支持（${knowledge.filter(k=>k.kind!=='method').length}）</option></select>`;document.querySelector('#knowledge-search').closest('.field').before(libraryFilters);
  const filterLibrary=()=>{document.querySelector('#library-list').innerHTML=libraryHtml(document.querySelector('#knowledge-search').value.trim(),document.querySelector('#knowledge-kind').value);};
  document.querySelector('#knowledge-kind').addEventListener('change',filterLibrary);
  document.querySelectorAll('[data-persona]').forEach(b=>b.addEventListener('click',()=>{if(commit({...state,persona:b.dataset.persona})){companionPage();toast('陪伴角色已切换，已有记录保留原来的语气');}}));
  document.querySelector('#remember').addEventListener('change',event=>{if(!commit({...state,remember:event.target.checked}))event.target.checked=state.remember;});
  document.querySelector('#knowledge-search').addEventListener('input',filterLibrary);
  document.querySelector('#export-data').addEventListener('click',()=>download(JSON.stringify(state,null,2),`日有回声-${localDate()}.json`));
  document.querySelector('#clear-data').addEventListener('click',()=>{
    const box=document.querySelector('#clear-confirm');box.hidden=false;box.innerHTML='<div class="confirm-inline"><p>所有目标、记录、记忆、草稿、聊天偏好及导入前备份都会删除，不能撤销。AI连接设置保留。可以先导出。</p><div class="form-actions"><button class="danger" id="confirm-clear">删除全部本地内容</button><button class="secondary" id="cancel-clear">保留内容</button></div></div>';
    document.querySelector('#cancel-clear').addEventListener('click',()=>{box.hidden=true;document.querySelector('#clear-data').focus();});
    document.querySelector('#confirm-clear').addEventListener('click',resetStorage);document.querySelector('#cancel-clear').focus();
  });
}
function resetStorage() {
  if(aiPending){toast('回复正在生成，请等完成后再清空，避免新回复重新写入记录。');return;}
  clearTimeout(draftTimer);
  try {browserStore.removeItem(BEFORE_IMPORT_KEY);browserStore.removeItem(STORE_KEY);lastStoredRaw=null;state=initialState();storageBlocked=false;editingGoal='';document.querySelector('#storage-error').hidden=true;render();toast('本地内容及导入前备份已清空');}
  catch{toast('浏览器拒绝清空，请检查存储设置。');}
}
function bindCommon() {
  main.querySelectorAll('[data-request-method]').forEach(button=>button.addEventListener('click',()=>{
    if(view!=='today')return;
    const field=main.querySelector('#daily-text'),preference=main.querySelector('#preference');
    preference.value='帮我行动';preference.dispatchEvent(new Event('change',{bubbles:true}));
    if(!field.value.trim()){field.value='带我试一个适合现在困境的具体方法，先走一小步。';field.dispatchEvent(new Event('input',{bubbles:true}));}
    field.focus();toast('已切到行动支持；可以改写这句话，再发送。');
  }));
  main.querySelectorAll('[data-reaction]').forEach(button=>button.addEventListener('click',()=>{
    const reaction=button.getAttribute('aria-pressed')==='true'?'':button.dataset.reaction;
    if(commit({...state,entries:state.entries.map(e=>e.id===button.dataset.entryId?{...e,reaction}:e)})){
      button.closest('.response-reactions').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.reaction===reaction)));
      toast(reaction ? '已记下反馈，下一轮会参考你的修正。' : '已撤销这次反馈。');
    }
  }));
  main.querySelectorAll('[data-use-step]').forEach(button=>button.addEventListener('click',()=>{
    const entry=state.entries.find(e=>e.id===button.dataset.useStep);
    if(!entry?.feedback.nextStep||entry.feedback.strategy==='安全支持')return;
    editingGoal=state.goals.some(g=>g.id===entry.goalId)?entry.goalId:'';
    proposedGoal={step:entry.feedback.nextStep.slice(0,200),title:entry.goalSnapshot?.title??'我选择的下一小步'};
    if(view==='goals')goalsPage();else location.hash='goals';
  }));
  main.querySelectorAll('[data-route]').forEach(b=>b.addEventListener('click',()=>{location.hash=b.dataset.route;}));
  main.querySelectorAll('[data-toggle-goal]').forEach(b=>b.addEventListener('click',()=>{if(commit(toggleGoal(state,b.dataset.toggleGoal,localDate())))render();}));
  main.querySelectorAll('[data-edit-goal]').forEach(b=>b.addEventListener('click',()=>{editingGoal=b.dataset.editGoal;goalsPage();document.querySelector('#goal-title').focus();}));
  main.querySelectorAll('.help-open').forEach(b=>b.addEventListener('click',()=>document.querySelector('#support-dialog').showModal()));
  main.querySelectorAll('[data-correct-mood]').forEach(b=>b.addEventListener('click',()=>{if(view!=='today'){location.hash='today';}setTimeout(()=>{document.querySelector('#mood-choices button')?.focus();document.querySelector('#mood-choices')?.scrollIntoView({block:'center'});toast('请选择当前心情，再告诉我哪里理解错了。');},0);}));
  main.querySelectorAll('[data-listen]').forEach(b=>b.addEventListener('click',()=>{state.draft.preference='先听我说';persistDraft();if(view==='today'){today();document.querySelector('#daily-text').focus();}else{location.hash='today';}toast('下一轮先听你说');}));
}
function render(){main.classList.remove('chat-view');nav();({today,goals:goalsPage,history:historyPage,companion:companionPage})[view]();}
function route(){persistDraft();view=routes.some(([k])=>k===location.hash.slice(1))?location.hash.slice(1):'today';if(view!=='history')historyDay='';render();window.scrollTo(0,0);main.scrollTop=0;main.focus({preventScroll:true});}
document.querySelector('.topbar .help-open').addEventListener('click',()=>document.querySelector('#support-dialog').showModal());
window.addEventListener('hashchange',route);
window.addEventListener('day-companion-open',()=>{persistDraft();view='today';if(location.hash!=='#today')location.hash='today';else render();main.scrollTop=0;});
document.addEventListener('visibilitychange',()=>{if(document.hidden){persistDraft();}else{view='today';if(location.hash!=='#today'){location.hash='today';}else{render();}}});
window.addEventListener('pagehide',persistDraft);
function showStorageError(message,raw){
  const box=document.querySelector('#storage-error');box.hidden=false;box.innerHTML=`<h2>已有记录暂时无法读取</h2><p>${escape(message)} 已停止覆盖内容。请先导出原始内容备份，再决定是否清空。浏览器也可能禁用了存储。</p><div class="data-tools"><button class="secondary" id="export-raw">导出原始内容</button><button class="text-button" id="reset-raw">处理存储</button></div><div id="raw-confirm" hidden></div>`;
  document.querySelector('#export-raw').addEventListener('click',()=>download(raw??'存储不可读取，未取得原始内容',`日有回声-原始备份-${localDate()}.txt`,'text/plain'));
  document.querySelector('#reset-raw').addEventListener('click',()=>{const c=document.querySelector('#raw-confirm');c.hidden=false;c.innerHTML='<div class="confirm-inline"><p>确认清空暂时无法读取的内容？先导出，删除不能撤销。</p><button class="danger" id="reset-raw-confirm">清空并重新开始</button></div>';document.querySelector('#reset-raw-confirm').addEventListener('click',resetStorage);});
}
if(storageBlocked) showStorageError(loaded.error,loaded.raw);
view=routes.some(([k])=>k===location.hash.slice(1))?location.hash.slice(1):'today';render();
