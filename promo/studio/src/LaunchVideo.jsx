import React from 'react';
import {AbsoluteFill,Audio,Img,Sequence,interpolate,spring,staticFile,useCurrentFrame,useVideoConfig} from 'remotion';
import timeline from './launch-timeline.json';
import captures from './capture-v2.json';
import {C,FONT} from './config';
const clamp={extrapolateLeft:'clamp',extrapolateRight:'clamp'};
const accent='#E5B47C',night='#17382E';
export const LAUNCH_FRAMES=timeline.reduce((total,part)=>total+part.frames,0);
const notes={Daily:'一件小事，就够开始',Talk:'可以继续聊，也可以纠正',Step:'先确认，再保存到目标',Goals:'自己的理由 · 小步骤 · 行动时机',Roles:'虚构成人角色 · 偏好可以调整',Knowledge:'52 张原创卡 / 28 个方法',Records:'按天回望 · 标题可编辑 · 备份可恢复'};
// Normalized focus within actual 2139x1407 desktop screenshots.
const targets={Daily:[.4,.6,1.8],Talk:[.5,.76,1.5],Step:[.42,.49,1.75],Goals:[.5,.54,1.55],Roles:[.32,.48,1.7],Knowledge:[.74,.61,1.55],Records:[.46,.4,1.55]};
function DesktopShot({part,frame}){
 const progress=frame/part.frames,list=captures.steps[part.id];
 if(part.kind==='knowledge'&&progress>.35&&progress<.92)return <div style={{position:'absolute',left:120,top:244,width:1680,height:710,borderRadius:18,background:'#E2EBDD',border:'1px solid #A8B8AB',boxShadow:'0 25px 50px #09211835',overflow:'hidden'}}>
  <div style={{position:'absolute',left:75,top:75,fontSize:176,fontWeight:700,lineHeight:1,color:night}}>52<span style={{fontSize:40,marginLeft:16}}>张</span></div>
  <div style={{position:'absolute',left:84,top:295,fontSize:33,fontWeight:600,color:night}}>原创知识卡 · 来源可查</div>
  <div style={{position:'absolute',left:84,top:384,fontSize:25,lineHeight:2,color:C.muted}}>28 个可试方法<br/>学习 / 拖延 / 沟通 / 休息<br/>步骤、适用边界和停止条件</div>
  <Img src={staticFile('screens/growth-method.png')} style={{position:'absolute',right:110,top:20,height:670,width:576,objectFit:'contain',borderRadius:10,boxShadow:'0 12px 28px #09211822'}}/>
  <div style={{position:'absolute',left:24,bottom:16,color:night,background:'#F2F1E9F2',padding:'9px 16px',borderRadius:8,fontSize:18,fontWeight:500}}>示例资料卡 · 实际界面截图</div>
 </div>;
 const index=list?Math.min(list.length-1,Math.floor(interpolate(progress,[.08,.75],[0,list.length],clamp))):0;
 const file=list?.[index]?.file??'screens/'+part.screen+'.png';
 const focus=targets[part.id]??[.5,.48,1.05];
 const zoom=interpolate(progress,[0,.16,.35,.78,.95],[1,1,focus[2],focus[2],1.06],clamp);
 const strength=interpolate(progress,[.16,.35,.78,.95],[0,1,1,.08],clamp);
 const cx=.5+(focus[0]-.5)*strength,cy=.5+(focus[1]-.5)*strength;
 const scale=.62*zoom;
 const width=2139*scale,height=1407*scale;
 const left=width>=1680?Math.max(1680-width,Math.min(0,840-width*cx)):(1680-width)/2;
 const top=height>=710?Math.max(710-height,Math.min(0,355-height*cy)):(710-height)/2;
 return <div style={{position:'absolute',left:120,top:244,width:1680,height:710,overflow:'hidden',borderRadius:18,background:'#F0F4F0',border:'1px solid #A8B8AB',boxShadow:'0 25px 50px #09211835'}}>
  <Img src={staticFile(file)} style={{position:'absolute',width,height,left,top,maxWidth:'none'}}/>
  <div style={{position:'absolute',left:24,bottom:16,color:night,background:'#F2F1E9F2',padding:'9px 16px',borderRadius:8,fontSize:18,fontWeight:500}}>示例操作截图 · 重新编排节奏</div>
 </div>;
}
function LaunchScene({part,index,musicCredits}){
 const frame=useCurrentFrame(),{fps}=useVideoConfig(),p=frame/part.frames;
 const dark=['hook','reveal','license','community'].includes(part.kind),background=dark?night:C.cream;
 const enter=spring({frame:frame-3,fps,config:{damping:24,stiffness:160,mass:.8}});
 const kicker=part.kind==='hook'?'今天的你，也值得被听见':part.kind==='community'?'项目已经公开，欢迎一起参与':part.kind==='license'?'使用与协作':'日有回声 · Windows 桌面成长陪伴';
 return <AbsoluteFill style={{background,color:dark?C.white:C.ink,fontFamily:FONT.body,fontWeight:400}}>
  <div style={{position:'absolute',left:0,top:0,width:1920,height:1080,opacity:.09,backgroundImage:`radial-gradient(${dark?C.mint:C.green} 1px, transparent 1px)`,backgroundSize:'26px 26px'}}/>
  <div style={{position:'absolute',left:82,top:45,display:'flex',alignItems:'center',gap:14,fontSize:27,fontWeight:600}}><Img src={staticFile('logo.svg')} style={{width:42,height:42}}/>日有回声</div>
  <div style={{position:'absolute',right:82,top:54,fontSize:17,color:dark?C.mint:C.muted}}>0.8.0 体验版 · 合成配音 · 示例数据</div>
  {part.kind==='hook'?<>
   <div style={{position:'absolute',left:150,top:218,fontSize:25,color:C.mint}}>{kicker}</div>
   <div style={{position:'absolute',left:145,top:295,fontSize:105,lineHeight:1.22,fontWeight:700,transform:`translateY(${(1-enter)*35}px)`,opacity:enter}}>忙了一天，<br/><span style={{color:accent}}>还是觉得没进步？</span></div>
   <div style={{position:'absolute',left:155,top:665,display:'flex',gap:20}}>{['看懂了例子','自己写又卡住','晚上有点着急'].map((t,i)=>{const s=spring({frame:frame-18-i*9,fps,config:{damping:22,stiffness:170}});return <div key={t} style={{fontSize:29,color:C.mint,border:'1px solid #638875',borderRadius:12,padding:'22px 28px',opacity:s,transform:`translateY(${(1-s)*20}px)`}}>{t}</div>;})}</div>
   <div style={{position:'absolute',right:110,bottom:220,fontFamily:FONT.hero,fontSize:32,color:accent,opacity:interpolate(p,[.7,.85],[0,1],clamp)}}>先把今天，说清楚。</div>
  </>:part.kind==='reveal'?<>
   <div style={{position:'absolute',left:125,top:265,fontSize:24,color:C.mint}}>{kicker}</div>
   <h1 style={{position:'absolute',left:120,top:310,fontFamily:FONT.hero,fontSize:112,lineHeight:1.15,fontWeight:600,margin:0,opacity:enter,transform:`translateX(${(1-enter)*-80}px)`}}>日有回声</h1>
   <p style={{position:'absolute',left:130,top:482,fontSize:34,lineHeight:1.8,color:accent}}>把今天说清楚。<br/>把下一步走踏实。</p>
   <div style={{position:'absolute',right:95,top:205,width:1010,height:670,borderRadius:20,background:C.white,overflow:'hidden',boxShadow:'0 35px 70px #09211870',opacity:enter,transform:`translateY(${(1-enter)*70}px) rotate(-1.2deg)`}}><Img src={staticFile('screens/today.png')} style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'top'}}/></div>
  </>:part.kind==='license'?<>
   <p style={{position:'absolute',left:130,top:214,fontSize:25,color:C.mint}}>{kicker}</p>
   <h1 style={{position:'absolute',left:125,top:290,fontSize:82,lineHeight:1.25,fontWeight:700,margin:0}}>源码公开，欢迎协作。<br/><span style={{color:accent}}>商业使用，先联系授权。</span></h1>
   <div style={{position:'absolute',left:130,top:600,fontSize:32,lineHeight:1.9,color:C.mint}}>PolyForm Noncommercial 1.0.0<br/><span style={{fontSize:24}}>非商业使用、修改与分发，需遵循许可。<br/>源码公开许可，非 OSI 开源许可。</span></div>
  </>:part.kind==='community'?<>
   <p style={{position:'absolute',left:140,top:220,fontSize:25,color:C.mint}}>{kicker}</p>
   <h1 style={{position:'absolute',left:132,top:314,fontSize:92,lineHeight:1.2,fontWeight:700,margin:0,opacity:enter}}>一起升级，<br/><span style={{fontFamily:FONT.hero,color:accent}}>日有回声。</span></h1>
   <div style={{position:'absolute',right:145,top:315,fontSize:33,lineHeight:2.3,color:C.mint}}>{['报告遇到的问题','补充可靠的资料','提交一个小改进'].map((t,i)=><div key={t} style={{opacity:interpolate(frame,[15+i*12,26+i*12],[0,1],clamp)}}><span style={{color:accent}}>0{i+1}</span>　{t}</div>)}</div>
   <div style={{position:'absolute',left:142,top:700,fontSize:35,color:C.white,borderBottom:`2px solid ${accent}`,paddingBottom:18}}>github.com/zhouzi4449/day-companion</div>
   <div style={{position:'absolute',left:143,top:825,fontSize:19,color:C.mint}}>一般成长支持，不提供诊断。当前版本仍需共同完善。</div>
   {musicCredits?<div style={{position:'absolute',left:143,top:887,fontSize:17,lineHeight:1.65,color:C.mint}}>Music: “Chill Wave” — Kevin MacLeod (incompetech.com) · CC BY 4.0<br/>creativecommons.org/licenses/by/4.0/ · Excerpt, EQ, fades &amp; ducking</div>:null}
  </>:<>
   <div style={{position:'absolute',left:122,top:125,fontSize:20,color:C.muted}}>0{index} / {notes[part.id]}</div>
   <h1 style={{position:'absolute',left:120,top:160,fontSize:57,lineHeight:1.1,fontWeight:700,margin:0,opacity:enter,transform:`translateY(${(1-enter)*18}px)`}}>{part.title}</h1>
   <DesktopShot part={part} frame={frame}/>
   {part.kind==='knowledge'&&p<.3?<div style={{position:'absolute',left:180,top:326,padding:'24px 35px',background:night,color:C.white,borderRadius:15,fontSize:36,fontWeight:700,boxShadow:'0 10px 30px #09211825'}}>52 张原创知识卡<br/><span style={{fontSize:23,fontWeight:400,color:C.mint}}>学习 / 拖延 / 沟通 / 休息</span></div>:null}
  </>}
 </AbsoluteFill>;
}
export function LaunchVideo({parts=timeline,audioMix=null,musicCredits=false}){
 const totalFrames=parts.reduce((n,p)=>n+p.frames,0);
 const frame=useCurrentFrame(),part=parts.find(p=>frame>=p.startFrame&&frame<p.startFrame+p.frames)??parts.at(-1),relative=frame-part.startFrame;
 const caption=(part.cues.find(c=>relative>=c.from&&relative<c.to)??part.cues.filter(c=>c.from<=relative).at(-1))?.text??'';
 return <AbsoluteFill>
  {parts.map((p,i)=><Sequence key={p.id} from={p.startFrame} durationInFrames={p.frames}><LaunchScene part={p} index={i} musicCredits={musicCredits}/>{p.audio&&!audioMix?<Audio src={staticFile(p.audio)}/>:null}</Sequence>)}
  {audioMix?<Audio src={staticFile(audioMix)}/>:<Audio src={staticFile('gentle-score.wav')} loop volume={f=>interpolate(f,[0,25,totalFrames-45,totalFrames],[0,.065,.065,0],clamp)}/>}
  {caption?<div style={{position:'absolute',bottom:32,left:220,right:220,display:'flex',justifyContent:'center'}}><div style={{fontFamily:FONT.body,fontSize:30,fontWeight:500,lineHeight:1.45,background:'#102B24F2',color:C.white,padding:'12px 26px',borderRadius:10,textAlign:'center',maxWidth:1480}}>{caption}</div></div>:null}
  <div style={{position:'absolute',bottom:0,left:0,height:4,background:accent,width:frame/totalFrames*1920}}/>
 </AbsoluteFill>;
}
