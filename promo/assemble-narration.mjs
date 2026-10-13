import fs from 'node:fs';import path from 'node:path';
const root=path.resolve('promo'),parts=JSON.parse(fs.readFileSync(path.join(root,'narration.json'),'utf8'));
const readPcm=file=>{const b=fs.readFileSync(file);let pcm;for(let at=12;at+8<=b.length;){const size=b.readUInt32LE(at+4),id=b.toString('ascii',at,at+4);if(id==='fmt '&&(b.readUInt16LE(at+8)!==1||b.readUInt16LE(at+10)!==1||b.readUInt32LE(at+12)!==22050||b.readUInt16LE(at+22)!==16))throw Error('Unexpected voice format');if(id==='data')pcm=b.subarray(at+8,at+8+size);at+=8+size+(size%2);}if(!pcm)throw Error('Missing voice data');return pcm;};
const writePcm=(file,data)=>{const h=Buffer.alloc(44);h.write('RIFF');h.writeUInt32LE(data.length+36,4);h.write('WAVEfmt ',8);h.writeUInt32LE(16,16);h.writeUInt16LE(1,20);h.writeUInt16LE(1,22);h.writeUInt32LE(22050,24);h.writeUInt32LE(44100,28);h.writeUInt16LE(2,32);h.writeUInt16LE(16,34);h.write('data',36);h.writeUInt32LE(data.length,40);fs.writeFileSync(file,Buffer.concat([h,data]));};
const timeline=[],allPcm=[];let startFrame=0;
const stamp=frame=>{const ms=Math.round(frame/30*1000);return [Math.floor(ms/3600000),Math.floor(ms/60000)%60,Math.floor(ms/1000)%60].map(n=>String(n).padStart(2,'0')).join(':')+','+String(ms%1000).padStart(3,'0');};
const subtitles=[];let cueNumber=1;
for(const part of parts){
 const clauses=part.text.split(/(?<=[。！？：])/u).filter(Boolean),buffers=[],cues=[];let frame=0;
 clauses.forEach((text,index)=>{const pcm=readPcm(path.join(root,'capture/raw/voice-clauses',part.id+'-'+index+'.wav'));const audioFrames=Math.ceil(pcm.length/2/735),frames=audioFrames+6;const padded=Buffer.concat([pcm,Buffer.alloc(frames*735*2-pcm.length)]);buffers.push(padded);cues.push({text,from:frame,to:frame+audioFrames});subtitles.push(`${cueNumber++}\n${stamp(startFrame+frame)} --> ${stamp(startFrame+frame+audioFrames)}\n${text}\n`);frame+=frames;});
 buffers.push(Buffer.alloc(15*735*2));frame+=15;const pcm=Buffer.concat(buffers);writePcm(path.join(root,'studio/public/narration',part.id+'.wav'),pcm);allPcm.push(pcm);timeline.push({...part,audio:'narration/'+part.id+'.wav',startFrame,frames:frame,audioSeconds:frame/30,cues});startFrame+=frame;
}
fs.writeFileSync(path.join(root,'studio/src/share-timeline.json'),JSON.stringify(timeline,null,2));
fs.writeFileSync(path.join(root,'deliverables/日有回声-社区分享.srt'),subtitles.join('\n'));
writePcm(path.join(root,'deliverables/日有回声-分享旁白.wav'),Buffer.concat(allPcm));
fs.writeFileSync(path.join(root,'deliverables/narration-metadata.json'),JSON.stringify({provider:'Windows SAPI, local synthesis',voice:'Microsoft Huihui Desktop - Chinese (Simplified)',fps:30,frames:startFrame,seconds:startFrame/30,parts:parts.length,subtitleCues:subtitles.length,timing:'Each sentence synthesized separately; cues follow measured PCM duration with short pauses'},null,2));
console.log('Sentence-aligned narration: '+startFrame/30+' seconds, '+subtitles.length+' cues');
