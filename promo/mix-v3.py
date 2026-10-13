"""Prepare an audible instrumental bed with speech-driven ducking; preserve stems."""
import argparse, hashlib, json, pathlib
import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt, lfilter

parser=argparse.ArgumentParser()
parser.add_argument('--samples',action='store_true')
args=parser.parse_args()
root=pathlib.Path(__file__).resolve().parent
music,rate=sf.read(root/'capture/raw/chill-wave.wav',dtype='float64')
assert rate==24000 and music.ndim==2 and music.shape[1]==2
music=sosfilt(butter(2,70,fs=rate,btype='highpass',output='sos'),music,axis=0)
music=sosfilt(butter(2,6500,fs=rate,btype='lowpass',output='sos'),music,axis=0)
# A modest midrange dip makes space for consonants and spoken words.
a=10**(-4/40);w=2*np.pi*1700/rate;alpha=np.sin(w)/(2*.8)
music=lfilter([1+alpha*a,-2*np.cos(w),1-alpha*a],[1+alpha/a,-2*np.cos(w),1-alpha/a],music,axis=0)

def rms(data): return float(np.sqrt(np.mean(data*data)))
def mix(voice_file,mix_file,stem_file=None):
    voice,sr=sf.read(voice_file,dtype='float64')
    assert sr==rate and voice.ndim==1
    bed=music[:len(voice)].copy()
    assert len(bed)==len(voice), 'Music too short'
    block=240;count=int(np.ceil(len(voice)/block));vlevels=[];mlevels=[]
    for i in range(count):
        start=i*block;stop=min(len(voice),start+block)
        # 200ms window includes nearby phonemes; 80ms look-ahead reduces the bed before a word.
        vlevels.append(rms(voice[max(0,start-2400):min(len(voice),stop+1920)]))
        mlevels.append(rms(bed[max(0,start-2400):min(len(bed),stop+2400)]))
    gains=[];gain=.03/max(rms(bed),.001);release=np.exp(-.01/.55)
    for vl,ml in zip(vlevels,mlevels):
        desired=min(.010,vl/6.31) if vl>.008 else .030
        target=min(.24,desired/max(ml,.008))
        gain=target if target<gain else gain*release+target*(1-release)
        gains.append(gain)
    envelope=np.interp(np.arange(len(voice)),np.arange(count)*block,np.asarray(gains))
    fade=np.minimum(np.arange(len(voice))/(rate*.65),(len(voice)-np.arange(len(voice)))/(rate*1.2)).clip(0,1)
    bed*=envelope[:,None]*fade[:,None]
    # Protect quiet word onsets as well as average speech; each overlapping
    # 200ms voiced window imposes a conservative music gain ceiling.
    ceilings=np.ones(count)
    for start in range(0,len(voice)-4800,block):
        vl=rms(voice[start:start+4800]);ml=rms(bed[start:start+4800])
        if vl>.02 and ml>.00001:
            stop=min(count,int(np.ceil((start+4800)/block)))
            ceilings[start//block:stop]=np.minimum(ceilings[start//block:stop],min(1,vl/(5.012*ml)))
    guard=[];gain=1
    for target in ceilings:
        gain=target if target<gain else gain*release+target*(1-release)
        guard.append(gain)
    bed*=np.repeat(guard,block)[:len(voice),None]
    combined=voice[:,None]+bed
    peak=float(np.max(np.abs(combined)));linear_gain=min(1,.96/max(peak,.001))
    combined*=linear_gain;bed*=linear_gain;voice*=linear_gain
    sf.write(mix_file,combined,rate,subtype='PCM_16')
    if stem_file: sf.write(stem_file,bed,rate,subtype='PCM_16')
    margins=[]
    for i in range(0,len(voice)-4800,4800):
        vl=rms(voice[i:i+4800]);ml=rms(bed[i:i+4800])
        if vl>.02 and ml>.00001: margins.append(20*np.log10(vl/ml))
    result={'seconds':len(voice)/rate,'sampleRate':rate,'voiceRms':rms(voice),'musicRms':rms(bed),'combinedPeak':float(np.max(np.abs(combined))),'linearGain':linear_gain,'duckAttackMs':10,'duckLookaheadMs':80,'duckReleaseMs':550,'musicMidrangeDipDb':-4,'speechMarginP10Db':float(np.percentile(margins,10)),'speechMarginMedianDb':float(np.median(margins)),'minimumSpeechMarginDb':float(min(margins)),'measurement':'200ms windows with voice RMS above .02; a level check, not a listening test','music':{'title':'Chill Wave','artist':'Kevin MacLeod','license':'CC BY 4.0','source':'https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1600048','licenseUrl':'https://creativecommons.org/licenses/by/4.0/','changes':'excerpt, EQ, fades and speech-driven ducking; original melody and tempo preserved'}}
    assert result['speechMarginP10Db']>=12,'Music competes with speech; reduce the bed'
    assert result['minimumSpeechMarginDb']>=12,'Music competes with a quiet word'
    assert result['combinedPeak']<.98,'Clipped mix'
    return result

if args.samples:
    for name in ['mature-low-clear','mature-magnetic']:
        result=mix(root/f'deliverables/试听-v3-{name}.wav',root/f'deliverables/试听-v3-{name}-带音乐.wav')
        print(json.dumps({'sample':name,**result},ensure_ascii=False),flush=True)
else:
    result=mix(root/'deliverables/日有回声-成熟旁白.wav',root/'studio/public/music/launch-v3-mix.wav',root/'deliverables/日有回声-背景音乐混音.wav')
    sf.write(root/'deliverables/日有回声-成熟声音乐混音.wav',*sf.read(root/'studio/public/music/launch-v3-mix.wav'),subtype='PCM_16')
    source=root/'studio/public/music/chill-wave-kevin-macleod.mp3'
    result['music']['originalMp3Sha256']=hashlib.sha256(source.read_bytes()).hexdigest()
    result['mixedWavSha256']=hashlib.sha256((root/'studio/public/music/launch-v3-mix.wav').read_bytes()).hexdigest()
    (root/'deliverables/music-v3-mix-metadata.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps(result,ensure_ascii=False),flush=True)
