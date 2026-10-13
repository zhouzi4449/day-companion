import {STORE_KEY,initialState,validState,normalizeProfile,saveState} from './core.mjs';

export const BACKUP_LIMIT = 8 * 1024 * 1024;
export const BEFORE_IMPORT_KEY = STORE_KEY + '.before-import';
const pick=(value,keys)=>Object.fromEntries(keys.filter(key=>value[key]!==undefined).map(key=>[key,value[key]]));
const realDay=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value;

export function parseBackup(raw){
  if(typeof raw!=='string'||new TextEncoder().encode(raw).length>BACKUP_LIMIT)throw new Error('请选择8MB以内的JSON备份。');
  let value;try{value=JSON.parse(raw.replace(/^\uFEFF/,''));}catch{throw new Error('文件不是有效JSON，当前记录未改动。');}
  if(!validState(value)||value.entries.length>10000||value.goals.length>2000)throw new Error('备份格式、版本或数量不受支持，当前记录未改动。');
  if(value.entries.some(e=>['nextStep','emotionHypothesis','engine','promptVersion','dayTitle'].some(key=>e.feedback[key]!==undefined&&e.feedback[key]!==null&&typeof e.feedback[key]!=='string')||(e.goalSnapshot!=null&&(typeof e.goalSnapshot.title!=='string'||typeof e.goalSnapshot.step!=='string'||e.goalSnapshot.title.length>80||e.goalSnapshot.step.length>200))))throw new Error('备份字段类型不正确。');
  if(value.entries.some(e=>!realDay(e.day)||e.id.length>200||!e.id.trim()||e.feedback.reply.length>20000||e.feedback.strategy.length>100)||(value.dayTitles??[]).some(t=>!realDay(t.day))||(value.memories??[]).some(m=>!realDay(m.updatedAt))||value.goals.some(g=>!g.id.trim()||g.id.length>200||g.why.length>300||g.step.length>200||g.when.length>120||!g.doneDates.every(realDay)))throw new Error('备份含无效日期或过长字段，当前记录未改动。');
  const state={version:1,persona:value.persona,remember:false,profile:normalizeProfile(value.profile),memories:(value.memories??[]).map(m=>pick(m,['id','text','updatedAt'])),dayTitles:(value.dayTitles??[]).map(t=>pick(t,['day','title','origin'])),goals:value.goals.map(g=>pick(g,['id','title','why','step','when','doneDates'])),entries:value.entries.map(e=>({...pick(e,['id','day','createdAt','text','mood','energy','preference','persona','goalId','mode','reaction']),goalSnapshot:e.goalSnapshot&&typeof e.goalSnapshot.title==='string'&&typeof e.goalSnapshot.step==='string'?pick(e.goalSnapshot,['title','step']):null,feedback:pick(e.feedback,['reply','strategy','sourceIds','nextStep','emotionHypothesis','evidenceQuotes','engine','promptVersion','dayTitle'])})),draft:pick(value.draft,['text','mood','energy','preference','goalId','mode'])};
  if(!validState(state))throw new Error('备份无法安全恢复。');
  return {state,summary:{entries:state.entries.length,days:new Set(state.entries.map(e=>e.day)).size,goals:state.goals.length,memories:state.memories.length}};
}

// localStorage writes are atomic per key. A failed backup write prevents replacement.
export function saveImportedState(storage,next,expectedRaw){
  if(!validState(next))throw new Error('备份校验失败。');
  const current=storage.getItem(STORE_KEY);
  if(current!==expectedRaw)throw new Error('当前记录已经变化，请重新选择备份。');
  storage.setItem(BEFORE_IMPORT_KEY,current??JSON.stringify(initialState()));
  saveState(storage,next);
}
