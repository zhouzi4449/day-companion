import React from 'react';
import {AbsoluteFill,Audio,Img,Sequence,interpolate,spring,staticFile,useCurrentFrame,useVideoConfig} from 'remotion';
import timeline from './share-timeline.json';
import {C,FONT,FPS} from './config';
import {SPRING} from './spring-presets';
const clamp={extrapolateLeft:'clamp',extrapolateRight:'clamp'};
export const SHARE_FRAMES=timeline.reduce((total,part)=>total+part.frames,0);
function ShareScene({part,index}){
 const frame=useCurrentFrame(),{fps}=useVideoConfig(),dark=index===0||index===9;
 const enter=spring({frame:frame-6,fps,config:SPRING.gentle});
 const color=dark?C.white:C.ink;
 return <AbsoluteFill style={{background:dark?C.green:C.cream,color,fontFamily:FONT.body}}>
  <div style={{position:'absolute',right:-180,top:-160,width:850,height:850,borderRadius:'50%',border:`1px solid ${dark?'#5A8272':C.line}`}}/>
  <div style={{position:'absolute',left:90,top:56,display:'flex',gap:18,alignItems:'center',fontSize:34,fontFamily:FONT.hero}}><Img src={staticFile('logo.svg')} style={{width:52,height:52}}/>日有回声</div>
  <div style={{position:'absolute',right:85,top:72,fontSize:18,color:dark?C.mint:C.muted}}>0.8.0 · Windows 桌面体验版{part.screen?' / 示例数据 · 界面实录':' / 合成旁白'}</div>
  <div style={{position:'absolute',left:100,top:part.screen?250:285,width:part.screen?470:1400,opacity:enter,transform:`translateY(${(1-enter)*40}px)`}}>
   <p style={{fontSize:22,letterSpacing:2,color:dark?C.mint:C.muted}}>{index===9?'欢迎一起参与':String(index+1).padStart(2,'0')+' / 每一天，有一点回声'}</p>
   <h1 style={{fontFamily:FONT.hero,fontSize:part.screen?66:88,fontWeight:400,lineHeight:1.5,whiteSpace:'pre-line',margin:'38px 0'}}>{part.title}</h1>
   <div style={{width:70,height:2,background:dark?C.mint:C.green,marginTop:38}}/>
  </div>
  {part.screen?<div style={{position:'absolute',left:620,top:185,width:1210,height:700,borderRadius:18,background:C.white,border:`1px solid ${C.line}`,overflow:'hidden',boxShadow:'0 24px 60px #183F341C',opacity:enter,transform:`translateX(${(1-enter)*48}px)`}}><div style={{height:30,background:'#DFE8DF',fontSize:14,color:C.muted,padding:'5px 16px'}}>日有回声 · 实际桌面界面</div><Img src={staticFile('screens/'+part.screen+'.png')} style={{width:'calc(100% - 40px)',height:630,margin:20,objectFit:'contain',objectPosition:'center'}}/></div>:
  index===8?<div style={{position:'absolute',left:1050,top:380,width:760,padding:38,background:C.white,borderRadius:18,border:`1px solid ${C.line}`,fontSize:30,lineHeight:1.9}}><p>PolyForm Noncommercial 1.0.0</p><p>非商业使用、修改与分发遵循许可</p><p>商业授权：联系 zhouzi4449</p><p style={{fontSize:23,color:C.muted}}>源码公开许可，非OSI开源许可</p></div>:
  index===0?<Img src={staticFile('logo.svg')} style={{position:'absolute',right:150,top:320,width:320,height:320,opacity:enter}}/>:
  <div style={{position:'absolute',left:110,top:750,fontSize:32,color:C.mint,lineHeight:1.8}}>github.com/zhouzi4449/day-companion<br/><span style={{fontSize:25}}>报告问题 · 核对资料 · 提交改进</span></div>}
  {index===9?<p style={{position:'absolute',left:110,top:883,fontSize:20,color:C.mint}}>一般成长支持，不提供诊断；界面使用示例数据。</p>:null}
 </AbsoluteFill>;
}
export function ShareVideo(){
 const frame=useCurrentFrame();const part=timeline.find(p=>frame>=p.startFrame&&frame<p.startFrame+p.frames)??timeline.at(-1);
 const relative=frame-part.startFrame;
 const caption=(part.cues.find(cue=>relative>=cue.from&&relative<cue.to)??part.cues.filter(cue=>cue.from<=relative).at(-1))?.text??'';
 const closing=frame>=timeline.at(-1).startFrame;
 return <AbsoluteFill>
  {timeline.map((p,index)=><Sequence key={p.id} from={p.startFrame} durationInFrames={p.frames}><ShareScene part={p} index={index}/><Audio src={staticFile(p.audio)}/></Sequence>)}
  <Audio src={staticFile('gentle-score.wav')} loop volume={.12}/>
  <div style={{position:'absolute',bottom:30,left:150,right:150,display:'flex',justifyContent:'center'}}><div style={{background:'#173F33F5',color:C.white,borderRadius:12,padding:'14px 32px',fontFamily:FONT.body,fontSize:31,lineHeight:1.55,maxWidth:1580,textAlign:'center'}}>{caption}</div></div>
  <div style={{position:'absolute',left:0,right:0,bottom:0,height:4,background:C.mint}}><div style={{width:frame/SHARE_FRAMES*100+'%',height:4,background:closing?C.white:C.green}}/></div>
 </AbsoluteFill>;
}
