import path from 'node:path';import fs from 'node:fs';
import {bundle} from '@remotion/bundler';
import {getCompositions,renderStill,renderMedia,openBrowser} from '@remotion/renderer';
import {SCENES,FPS} from './src/config.js';
const serveUrl=await bundle({entryPoint:path.resolve('src/index.jsx'),outDir:path.resolve('build')});
// Isolated headless render profile; never attaches to a user's browsing session.
const downloadedBrowser=path.join(process.env.LOCALAPPDATA??'.','DayCompanionTools/chrome-headless-shell/chrome-headless-shell-win64/chrome-headless-shell.exe');
const existingBrowser=process.env.REMOTION_BROWSER_EXECUTABLE??(fs.existsSync(downloadedBrowser)?downloadedBrowser:undefined);
const browser=await openBrowser('chrome',{logLevel:'info',browserExecutable:existingBrowser});
try{const compositions=await getCompositions(serveUrl,{puppeteerInstance:browser});fs.mkdirSync('../deliverables/stills',{recursive:true});
 for(const s of SCENES){const composition=compositions.find(c=>c.id===s.id);for(const [kind,fraction] of [['entry',.15],['peak',.6]]){await renderStill({serveUrl,composition,puppeteerInstance:browser,frame:Math.floor(s.seconds*FPS*fraction),output:path.resolve('../deliverables/stills/'+s.id+'-'+kind+'.png'),imageFormat:'png'});}console.log('Stills: '+s.id);}
 if(!process.argv.includes('--stills')){const composition=compositions.find(c=>c.id==='MainVideo');let last=-1;await renderMedia({serveUrl,composition,puppeteerInstance:browser,codec:'h264',audioCodec:'aac',crf:19,x264Preset:'fast',concurrency:3,outputLocation:path.resolve('../deliverables/日有回声-宣传片-1080p.mp4'),onProgress:({progress})=>{const p=Math.floor(progress*10);if(p>last){last=p;console.log('Render '+p*10+'%');}}});console.log('Video complete');}
}finally{await browser.close({silent:true});}
