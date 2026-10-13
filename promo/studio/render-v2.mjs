import path from 'node:path';import fs from 'node:fs';
import {bundle} from '@remotion/bundler';import {getCompositions,renderStill,renderMedia,openBrowser} from '@remotion/renderer';
const timeline=JSON.parse(fs.readFileSync('src/launch-timeline.json','utf8'));
const downloadedBrowser=path.join(process.env.LOCALAPPDATA??'.','DayCompanionTools/chrome-headless-shell/chrome-headless-shell-win64/chrome-headless-shell.exe');
const browser=await openBrowser('chrome',{browserExecutable:process.env.REMOTION_BROWSER_EXECUTABLE??(fs.existsSync(downloadedBrowser)?downloadedBrowser:undefined)});
try{
 const serveUrl=await bundle({entryPoint:path.resolve('src/index.jsx'),outDir:path.resolve('build-v2')});const composition=(await getCompositions(serveUrl,{puppeteerInstance:browser})).find(c=>c.id==='LaunchVideo');
 fs.mkdirSync('../deliverables/v2-stills',{recursive:true});
 for(const part of timeline){for(const [kind,fraction] of [['entry',.15],['peak',.6]])await renderStill({serveUrl,composition,puppeteerInstance:browser,frame:part.startFrame+Math.floor(part.frames*fraction),output:path.resolve(`../deliverables/v2-stills/${part.id}-${kind}.png`)});console.log('Stills: '+part.id);}
 if(!process.argv.includes('--stills')){
  if(timeline.some(p=>!p.audio))throw Error('Narration missing; preview timeline cannot be delivered');
  let last=-1;await renderMedia({serveUrl,composition,puppeteerInstance:browser,codec:'h264',audioCodec:'aac',crf:18,x264Preset:'fast',concurrency:3,outputLocation:path.resolve('../deliverables/日有回声-新版项目分享.mp4'),onProgress:({progress})=>{const percent=Math.floor(progress*10);if(percent>last){last=percent;console.log('Launch render '+percent*10+'%')}}});console.log('New video complete');
 }
}finally{await browser.close({silent:true});}
