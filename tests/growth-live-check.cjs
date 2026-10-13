const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const {_electron}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright');
const root=path.resolve(__dirname,'..'),env={...process.env,DAY_COMPANION_TEST_DATA:fs.mkdtempSync(path.join(os.tmpdir(),'day-growth-live-'))};delete env.ELECTRON_RUN_AS_NODE;let app;
(async()=>{
 app=await _electron.launch({executablePath:path.resolve(process.argv[2]),args:[],env,timeout:60000});const page=await app.firstWindow();await page.locator('#daily-text').waitFor();
 const firstText='合成测试：我总不敢拒绝室友。周末我要复习，他又让我帮忙做一个任务。我担心拒绝就被讨厌，能陪我试一句清楚又尊重人的拒绝吗？';
 const context={persona:'sister',profile:{nickname:'',length:'简短',tone:'温和',questions:'少问问题'},currentInput:{text:firstText,mood:'焦虑',energy:'中',preference:'帮我行动'},sameDay:[],historyConsent:false,history:[]};
 const first=await page.evaluate(input=>window.dayAi.reply(input),context);assert.equal(first.engine,'chatgpt-codex');assert.ok(first.reply.length>30);assert.ok(first.sourceIds.every(id=>['K-017','K-035','K-036','K-019','K-007','K-008'].includes(id)));
 const secondText='这个说法比较贴近，但我今天不想练习或做任务。我只是想说，害怕被讨厌让我很累。先听我说，不要继续安排下一步。';
 const second=await page.evaluate(input=>window.dayAi.reply(input),{...context,currentInput:{text:secondText,mood:'疲惫',energy:'低',preference:'先听我说'},sameDay:[{text:firstText,mood:'焦虑',previousReply:first.reply,previousStep:first.nextStep,previousSources:first.sourceIds}]});assert.equal(second.engine,'chatgpt-codex');assert.equal(second.nextStep,null);assert.notEqual(first.reply,second.reply);
 fs.writeFileSync(path.join(root,'tests/evidence/growth-live-output.json'),JSON.stringify({date:'2026-10-13',syntheticInputs:true,firstText,first,secondText,second},null,2));console.log(JSON.stringify({status:'passed',calls:2,engine:first.engine,sourceIds:first.sourceIds,strategies:[first.strategy,second.strategy],scope:'Two synthetic cases, manual content review still required'},null,2));
 await app.close();app=null;
})().catch(async error=>{console.error(error);if(app)await app.close().catch(()=>{});process.exitCode=1;});
