import fs from 'node:fs';import path from 'node:path';
const root=path.resolve('promo'),parts=JSON.parse(fs.readFileSync(path.join(root,'narration-v2.json'),'utf8'));
const mature=process.argv.includes('--v3'),version=mature?'v3':'v2';
const profile=mature?JSON.parse(fs.readFileSync(path.join(root,'voice-profiles-v3.json'),'utf8')).find(p=>p.id===(process.env.NARRATION_PROFILE||'mature-magnetic')):null;
const names=mature?{srt:'日有回声-音乐成熟声版.srt',text:'日有回声-成熟旁白.txt',voice:'日有回声-成熟旁白.wav'}:{srt:'日有回声-新版分享.srt',text:'日有回声-新版旁白.txt',voice:'日有回声-新版旁白.wav'};
const fps=30,sampleRate=24000,samplesPerFrame=sampleRate/fps;
function readPcm(file){const b=fs.readFileSync(file);let pcm;for(let at=12;at+8<=b.length;){const size=b.readUInt32LE(at+4),id=b.toString('ascii',at,at+4);if(id==='fmt '&&(b.readUInt16LE(at+8)!==1||b.readUInt16LE(at+10)!==1||b.readUInt32LE(at+12)!==sampleRate||b.readUInt16LE(at+22)!==16))throw Error('Expected mono 24kHz PCM16: '+file);if(id==='data')pcm=b.subarray(at+8,at+8+size);at+=8+size+(size%2);}if(!pcm)throw Error('Missing PCM');return pcm;}
function writePcm(file,data){const h=Buffer.alloc(44);h.write('RIFF');h.writeUInt32LE(data.length+36,4);h.write('WAVEfmt ',8);h.writeUInt32LE(16,16);h.writeUInt16LE(1,20);h.writeUInt16LE(1,22);h.writeUInt32LE(sampleRate,24);h.writeUInt32LE(sampleRate*2,28);h.writeUInt16LE(2,32);h.writeUInt16LE(16,34);h.write('data',36);h.writeUInt32LE(data.length,40);fs.writeFileSync(file,Buffer.concat([h,data]));}
const timeline=[],allPcm=[],subtitles=[];let startFrame=0,cueNumber=1;
const stamp=frame=>{const ms=Math.round(frame/fps*1000);return [Math.floor(ms/3600000),Math.floor(ms/60000)%60,Math.floor(ms/1000)%60].map(n=>String(n).padStart(2,'0')).join(':')+','+String(ms%1000).padStart(3,'0');};
for(const part of parts){
 const clauses=part.text.split(/(?<=[。！？])/u).filter(Boolean),buffers=[],cues=[];let frame=0;
 clauses.forEach((text,index)=>{
  let pcm=readPcm(path.join(root,mature?'capture/raw/qwen-clauses-v3':'capture/raw/qwen-clauses',part.id+'-'+index+'.wav'));
  if(mature){const receipt=JSON.parse(fs.readFileSync(path.join(root,'capture/raw/qwen-clauses-v3',part.id+'-'+index+'.json'),'utf8'));if(receipt.speaker!==profile.speaker||receipt.instruct!==profile.instruct||receipt.text!==text)throw Error('Voice profile/text mismatch');}
  // Remove only near-silent edges, retain 80ms around the voice, no change to pitch or speed.
  let first=0,last=pcm.length/2-1;while(first<last&&Math.abs(pcm.readInt16LE(first*2))<130)first++;while(last>first&&Math.abs(pcm.readInt16LE(last*2))<130)last--;
  first=Math.max(0,first-1920);last=Math.min(pcm.length/2-1,last+1920);pcm=pcm.subarray(first*2,(last+1)*2);
  const audioFrames=Math.ceil(pcm.length/2/samplesPerFrame),frames=audioFrames+4;
  buffers.push(Buffer.concat([pcm,Buffer.alloc(frames*samplesPerFrame*2-pcm.length)]));
  cues.push({text,from:frame,to:frame+audioFrames});
  subtitles.push(`${cueNumber++}\n${stamp(startFrame+frame)} --> ${stamp(startFrame+frame+audioFrames)}\n${text}\n`);frame+=frames;
 });
 const hold=part.id==='Community'?45:6;buffers.push(Buffer.alloc(hold*samplesPerFrame*2));frame+=hold;
 const pcm=Buffer.concat(buffers);fs.mkdirSync(path.join(root,'studio/public/narration-'+version),{recursive:true});writePcm(path.join(root,'studio/public/narration-'+version,part.id+'.wav'),pcm);allPcm.push(pcm);timeline.push({...part,audio:'narration-'+version+'/'+part.id+'.wav',startFrame,frames:frame,cues});startFrame+=frame;
}
fs.writeFileSync(path.join(root,'studio/src/'+(mature?'mature-timeline.json':'launch-timeline.json')),JSON.stringify(timeline,null,2));
fs.writeFileSync(path.join(root,'deliverables',names.srt),subtitles.join('\n'));
fs.writeFileSync(path.join(root,'deliverables',names.text),parts.map(p=>p.text).join('\n\n')+'\n');
writePcm(path.join(root,'deliverables',names.voice),Buffer.concat(allPcm));
fs.writeFileSync(path.join(root,'deliverables','voice-'+version+'-metadata.json'),JSON.stringify({provider:'Qwen3-TTS local CUDA synthesis',model:'Qwen/Qwen3-TTS-12Hz-1.7B-CustomVoice',revision:'0c0e3051f131929182e2c023b9537f8b1c68adfe',speaker:profile?.speaker||process.env.NARRATION_SPEAKER||'Serena',profile:profile?.id,instruct:profile?.instruct,license:'Apache-2.0',synthetic:true,voiceCloning:false,referenceAudioUsed:false,sampleRate,fps,frames:startFrame,seconds:startFrame/fps,parts:parts.length,subtitleCues:subtitles.length,timing:'Measured per-sentence PCM duration, silence edges trimmed; no pitch/speed change; subtitles and edits use the same 30fps timeline'},null,2));
console.log(JSON.stringify({seconds:startFrame/fps,frames:startFrame,cues:subtitles.length}));
