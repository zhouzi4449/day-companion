import fs from 'node:fs';
import {CUES} from './src/config.js';
const rate=44100,seconds=45,samples=rate*seconds,data=new Float64Array(samples);
// Original procedural score: soft pentatonic plucks, no external music samples.
const chords=[[48,55,60,64,67],[45,52,57,60,64],[41,48,53,57,60],[43,50,55,60,62]];
for(let bar=0;bar<15;bar++){const chord=chords[bar%4];for(let beat=0;beat<4;beat++){const start=bar*3+beat*.75,note=chord[(bar+beat)%chord.length]+(beat===2?12:0),freq=440*2**((note-69)/12);for(let j=0;j<rate*3.2&&Math.floor(start*rate)+j<samples;j++){const t=j/rate,env=Math.min(t/.025,1)*Math.exp(-t*1.9);data[Math.floor(start*rate)+j]+=env*(Math.sin(2*Math.PI*freq*t)+.2*Math.sin(4*Math.PI*freq*t))*.1;}}}
const wav=Buffer.alloc(44+samples*4);wav.write('RIFF');wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(2,22);wav.writeUInt32LE(rate,24);wav.writeUInt32LE(rate*4,28);wav.writeUInt16LE(4,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(samples*4,40);let peak=0;
for(let i=0;i<samples;i++){const fade=Math.min(i/(rate*1.5),(samples-i)/(rate*2),1),v=Math.max(-1,Math.min(1,data[i]*fade));peak=Math.max(peak,Math.abs(v));wav.writeInt16LE(Math.round(v*32767),44+i*4);wav.writeInt16LE(Math.round(v*.94*32767),46+i*4);}fs.writeFileSync('public/gentle-score.wav',wav);
const time=s=>{const ms=Math.round(s*1000);return [Math.floor(ms/3600000),Math.floor(ms/60000)%60,Math.floor(ms/1000)%60].map(v=>String(v).padStart(2,'0')).join(':')+','+String(ms%1000).padStart(3,'0');};
fs.mkdirSync('../deliverables',{recursive:true});fs.writeFileSync('../deliverables/日有回声-宣传片.srt',CUES.map(([a,b,text],i)=>`${i+1}\n${time(a)} --> ${time(b)}\n${text}\n`).join('\n'),'utf8');console.log(JSON.stringify({originalScore:true,seconds,peak,subtitleCues:CUES.length}));
