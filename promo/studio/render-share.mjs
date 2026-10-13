import path from 'node:path';import fs from 'node:fs';
import {bundle} from '@remotion/bundler';import {getCompositions,renderStill,renderMedia,openBrowser} from '@remotion/renderer';
const timeline=JSON.parse(fs.readFileSync('src/share-timeline.json','utf8').replace(/^\uFEFF/,''));
const downloadedBrowser=path.join(process.env.LOCALAPPDATA??'.','DayCompanionTools/chrome-headless-shell/chrome-headless-shell-win64/chrome-headless-shell.exe');
const browser=await openBrowser('chrome',{browserExecutable:process.env.REMOTION_BROWSER_EXECUTABLE??(fs.existsSync(downloadedBrowser)?downloadedBrowser:undefined)});
try{
 const serveUrl=await bundle({entryPoint:path.resolve('src/index.jsx'),outDir:path.resolve('build')});const compositions=await getCompositions(serveUrl,{puppeteerInstance:browser});const composition=compositions.find(c=>c.id==='ShareVideo');
 fs.mkdirSync('../deliverables/share-stills',{recursive:true});
 for(const part of timeline){for(const [kind,fraction] of [['entry',.15],['peak',.6]])await renderStill({serveUrl,composition,puppeteerInstance:browser,frame:part.startFrame+Math.floor(part.frames*fraction),output:path.resolve(`../deliverables/share-stills/${part.id}-${kind}.png`)});console.log('Stills: '+part.id);}
 if(!process.argv.includes('--stills')){let last=-1;await renderMedia({serveUrl,composition,puppeteerInstance:browser,codec:'h264',audioCodec:'aac',crf:19,x264Preset:'fast',concurrency:3,outputLocation:path.resolve('../deliverables/日有回声-社区分享-旁白版.mp4'),onProgress:({progress})=>{const percent=Math.floor(progress*10);if(percent>last){last=percent;console.log('Share render '+percent*10+'%');}}});console.log('Share video complete');}
}finally{await browser.close({silent:true});}
