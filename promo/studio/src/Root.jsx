import React from 'react';
import {Composition} from 'remotion';
import {MainVideo,Scene} from './Composition';
import {SCENES,FPS,WIDTH,HEIGHT} from './config';
export const Root=()=> <><Composition id="MainVideo" component={MainVideo} width={WIDTH} height={HEIGHT} fps={FPS} durationInFrames={45*FPS}/>{SCENES.map((s,index)=><Composition key={s.id} id={s.id} component={Scene} defaultProps={{index}} width={WIDTH} height={HEIGHT} fps={FPS} durationInFrames={s.seconds*FPS}/>)}</>;
