"""Local ASR sanity check of narration; never a proof of naturalness or human voice."""
import argparse, json, os, pathlib
import numpy as np
import soundfile as sf
import torch, torchaudio, whisper

parser=argparse.ArgumentParser()
parser.add_argument('--samples', action='store_true')
parser.add_argument('--v3', action='store_true')
parser.add_argument('--mixed', action='store_true')
args=parser.parse_args()
root=pathlib.Path(__file__).resolve().parent
model=whisper.load_model('base',device='cuda',download_root=str(pathlib.Path(os.environ['LOCALAPPDATA'])/'DayCompanionTools/models/whisper'))
files=list((root/'deliverables').glob('试听-*.wav')) if args.samples else [root/'deliverables'/('日有回声-成熟声音乐混音.wav' if args.mixed else '日有回声-成熟旁白.wav' if args.v3 else '日有回声-新版旁白.wav')]
results=[]
for file in files:
    audio,rate=sf.read(file,dtype='float32')
    if audio.ndim==2: audio=audio.mean(axis=1)
    assert audio.ndim==1
    audio=torchaudio.functional.resample(torch.from_numpy(audio),rate,16000).numpy()
    result=model.transcribe(audio,language='zh',task='transcribe',temperature=0,condition_on_previous_text=False,verbose=False)
    item={'file':file.name,'text':result['text'],'segments':result['segments']}
    results.append(item)
    print(json.dumps({'file':file.name,'transcript':result['text']},ensure_ascii=False),flush=True)
out=root/('capture/raw/voice-samples-transcript.json' if args.samples else 'deliverables/voice-v3-mixed-transcript.json' if args.mixed else 'deliverables/voice-v3-transcript.json' if args.v3 else 'deliverables/voice-v2-transcript.json')
out.write_text(json.dumps({'model':'OpenAI Whisper base, 20250625','purpose':'ASR sanity check, not proof of human recording or naturalness','results':results},ensure_ascii=False,indent=2),encoding='utf-8')
