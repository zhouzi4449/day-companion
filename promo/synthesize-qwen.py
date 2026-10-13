"""Generate narration from a licensed preset voice; no voice cloning or user data.

Install pinned requirements in an isolated environment, then pass the model path:
python promo/synthesize-qwen.py --model PATH --samples
python promo/synthesize-qwen.py --model PATH --speaker Serena
"""
import argparse, json, pathlib, time
import numpy as np
import soundfile as sf
import torch
from qwen_tts import Qwen3TTSModel

parser = argparse.ArgumentParser()
parser.add_argument('--model', required=True)
parser.add_argument('--speaker', default='Serena')
parser.add_argument('--samples', action='store_true')
parser.add_argument('--profile', help='Optional style id from voice-profiles-v3.json')
parser.add_argument('--profile-samples', action='store_true')
args = parser.parse_args()
root = pathlib.Path(__file__).resolve().parent
out = root / ('capture/raw/qwen-clauses-v3' if args.profile else 'capture/raw/qwen-clauses')
out.mkdir(parents=True, exist_ok=True)
torch.set_num_threads(6)
torch.manual_seed(20261013)
model = Qwen3TTSModel.from_pretrained(args.model, device_map='cuda:0', dtype=torch.bfloat16, attn_implementation='sdpa')
print('Preset speakers: ' + str(model.get_supported_speakers()), flush=True)
style = '像向朋友介绍自己做的小项目一样，轻松自然、真诚亲切。普通话，语速稍快，句子连贯，重音自然，不要播音腔，不要逐字用力，不要拖长句尾。'
profiles = json.loads((root / 'voice-profiles-v3.json').read_text(encoding='utf-8')) if args.profile or args.profile_samples else []
if args.profile:
    chosen = next(p for p in profiles if p['id'] == args.profile)
    style, args.speaker = chosen['instruct'], chosen['speaker']
records = []
if args.profile_samples:
    jobs = [(p['speaker'], '忙了一天，晚上却觉得自己什么也没做？我做了一个桌面应用，叫日有回声。', root / f"deliverables/试听-v3-{p['id']}.wav", p['instruct']) for p in profiles]
elif args.samples:
    jobs = [(speaker, '忙了一天，晚上却觉得自己什么也没做？我做了一个桌面应用，叫日有回声。', root / f'deliverables/试听-{speaker}.wav', style) for speaker in ['Serena', 'Dylan', 'Vivian']]
else:
    import re
    parts = json.loads((root / 'narration-v2.json').read_text(encoding='utf-8'))
    jobs = [(args.speaker, clause, out / f"{part['id']}-{index}.wav", style) for part in parts for index, clause in enumerate(filter(None, re.split(r'(?<=[。！？])', part['text'])))]
for speaker, text, file, style in jobs:
    fingerprint = {'speaker': speaker, 'text': text, 'instruct': style, 'seed': 20261013}
    receipt = file.with_suffix('.json')
    if file.exists() and not args.samples and not args.profile_samples:
        assert receipt.exists() and json.loads(receipt.read_text(encoding='utf-8')) == fingerprint, 'Existing audio has different or unknown text/voice; preserve it in another folder before regeneration'
        print('Already generated: ' + file.name, flush=True)
        continue
    started = time.time()
    torch.manual_seed(20261013)
    with torch.inference_mode():
        wavs, sr = model.generate_custom_voice(text=text, language='Chinese', speaker=speaker, instruct=style, max_new_tokens=1000, do_sample=True, temperature=0.75, top_p=0.9)
    audio = np.asarray(wavs[0], dtype=np.float32)
    assert audio.size and np.isfinite(audio).all(), 'Invalid generated audio'
    raw_peak = float(np.max(np.abs(audio)))
    rms = float(np.sqrt(np.mean(audio**2)))
    assert rms > 0.002, 'Voice is nearly silent'
    gain = min(0.09/rms, 0.92/raw_peak)
    audio *= gain
    sf.write(file, audio, sr, subtype='PCM_16')
    receipt.write_text(json.dumps(fingerprint, ensure_ascii=False), encoding='utf-8')
    item = {'file': file.name, 'speaker': speaker, 'text': text, 'sampleRate': sr, 'seconds': len(audio)/sr, 'generationSeconds': round(time.time()-started, 2), 'peak': float(np.max(np.abs(audio))), 'linearGain': gain, 'rawPeak': raw_peak}
    records.append(item)
    print(json.dumps(item, ensure_ascii=False), flush=True)
(root / ('deliverables/voice-v3-samples.json' if args.profile_samples else 'deliverables/voice-samples.json' if args.samples else 'capture/raw/qwen-v3-generation.json' if args.profile else 'capture/raw/qwen-generation.json')).write_text(json.dumps(records, ensure_ascii=False, indent=2), encoding='utf-8')
