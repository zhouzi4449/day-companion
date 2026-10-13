import React from 'react';
import {Composition} from 'remotion';
import {MainVideo,Scene} from './Composition';
import {SCENES,FPS,WIDTH,HEIGHT} from './config';
import {ShareVideo,SHARE_FRAMES} from './ShareVideo';
import {LaunchVideo,LAUNCH_FRAMES} from './LaunchVideo';
export const Root=()=> <><Composition id="MainVideo" component={MainVideo} width={WIDTH} height={HEIGHT} fps={FPS} durationInFrames={45*FPS}/><Composition id="ShareVideo" component={ShareVideo} width={WIDTH} height={HEIGHT} fps={FPS} durationInFrames={SHARE_FRAMES}/><Composition id="LaunchVideo" component={LaunchVideo} width={WIDTH} height={HEIGHT} fps={FPS} durationInFrames={LAUNCH_FRAMES}/>{SCENES.map((s,index)=><Composition key={s.id} id={s.id} component={Scene} defaultProps={{index}} width={WIDTH} height={HEIGHT} fps={FPS} durationInFrames={s.seconds*FPS}/>)}</>;
