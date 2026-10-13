import test from 'node:test';import assert from 'node:assert/strict';
import {initialState,STORE_KEY} from '../app/core.mjs';
import {parseBackup,saveImportedState,BEFORE_IMPORT_KEY,BACKUP_LIMIT} from '../app/backup.mjs';
import {knowledge} from '../app/knowledge.mjs';
test('备份往返保留记录、标题、目标、草稿；历史授权关闭且丢弃额外设置',()=>{
 const value=initialState();value.remember=true;value.apiKey='not-a-real-key';value.entries=[{id:'e',day:'2026-10-13',text:'合成记录',mood:'平静',persona:'sister',feedback:{reply:'合成反馈',strategy:'探索',sourceIds:['K-052'],nextStep:null}}];value.dayTitles=[{day:'2026-10-13',title:'自己起的名字',origin:'manual'}];value.draft.text='保留草稿';
 const parsed=parseBackup('\uFEFF'+JSON.stringify(value));assert.deepEqual(parsed.summary,{entries:1,days:1,goals:0,memories:0});assert.equal(parsed.state.remember,false);assert.equal(parsed.state.apiKey,undefined);assert.deepEqual(parsed.state.entries[0].feedback,value.entries[0].feedback);assert.equal(parsed.state.dayTitles[0].title,'自己起的名字');assert.equal(parsed.state.draft.text,'保留草稿');
});
test('拒绝损坏、未来版本、重复ID、未知来源和无效日期',()=>{
 assert.throws(()=>parseBackup('{'));assert.throws(()=>parseBackup(JSON.stringify({...initialState(),version:99})));
 const e={id:'e',day:'2026-02-30',text:'测试',mood:'平静',feedback:{reply:'测试',strategy:'探索',sourceIds:[]}};assert.throws(()=>parseBackup(JSON.stringify({...initialState(),entries:[e]})));
 e.day='2026-10-13';assert.throws(()=>parseBackup(JSON.stringify({...initialState(),entries:[e,e]})));e.feedback.sourceIds=['K-999'];assert.throws(()=>parseBackup(JSON.stringify({...initialState(),entries:[e]})));
 assert.throws(()=>parseBackup(' '.repeat(BACKUP_LIMIT+1)));
});
test('导入保留之前原始记录；备份空间失败及外部变化不覆盖',()=>{
 const values=new Map([[STORE_KEY,JSON.stringify(initialState())]]);const store={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)};const old=store.getItem(STORE_KEY);const next={...initialState(),persona:'elder'};saveImportedState(store,next,old);assert.equal(store.getItem(BEFORE_IMPORT_KEY),old);assert.equal(JSON.parse(store.getItem(STORE_KEY)).persona,'elder');
 assert.throws(()=>saveImportedState(store,initialState(),old));const current=store.getItem(STORE_KEY);assert.throws(()=>saveImportedState({...store,setItem:()=>{throw Error('quota')}},next,current));assert.equal(store.getItem(STORE_KEY),current);
});
test('新版52张知识卡具有完整来源与方法边界，保留旧ID',()=>{
 assert.equal(knowledge.length,52);assert.equal(new Set(knowledge.map(k=>k.id)).size,52);for(const k of knowledge){assert.ok(k.sourceInfo.url.startsWith('https://'));assert.ok(k.limit&&k.reviewedAt&&k.sourceInfo.evidence);if(k.kind==='method')assert.ok(k.steps.length>=2&&k.followUp&&k.stopWhen);}
 for(let i=1;i<=32;i++)assert.ok(knowledge.some(k=>k.id==='K-'+String(i).padStart(3,'0')));
});
