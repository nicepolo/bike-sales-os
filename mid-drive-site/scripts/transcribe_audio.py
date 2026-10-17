#!/usr/bin/env python3
"""Generate machine-timed Mandarin transcript captions; output must be reviewed."""
import json,re
from pathlib import Path
from faster_whisper import WhisperModel
from opencc import OpenCC

AUDIO='audio-16k.wav'
ROOT=Path('mid-drive-site/assets/captions')
BOUNDARIES=[0,50,140,190,325,395,770,925,1125,1240,1485,1670,1756.08]
def stamp(seconds):
    x=max(0,round(seconds*1000));ms=x%1000;x//=1000
    sec=x%60;x//=60;minute=x%60;hour=x//60
    return f'{hour:02}:{minute:02}:{sec:02}.{ms:03}'
model=WhisperModel('small',device='cpu',compute_type='int8',cpu_threads=4,num_workers=1)
segments,info=model.transcribe(AUDIO,beam_size=3,language=None,vad_filter=True,
    vad_parameters={'min_silence_duration_ms':500,'speech_pad_ms':300},
    condition_on_previous_text=False,no_speech_threshold=.65,
    compression_ratio_threshold=2.4,log_prob_threshold=-1.0)
print('DETECTED_LANGUAGE:',info.language,'CONFIDENCE:',round(info.language_probability,3),flush=True)
if info.language!='zh':
    raise RuntimeError('Spoken language not detected as Chinese. Verify before publishing subtitles.')
convert=OpenCC('s2twp')
items=[]
for seg in segments:
    raw=str(seg.text or '').strip()
    text=re.sub(r'\s+',' ',convert.convert(raw)).strip()
    if not text or seg.end<=seg.start or seg.no_speech_prob>.85:continue
    items.append({'start':round(seg.start,3),'end':round(seg.end,3),'text':text})
print('ASR_SEGMENTS:',len(items),'TOTAL_CHARS:',sum(len(x['text']) for x in items),flush=True)
for x in items[:25]:
    print(f"{x['start']:07.2f} - {x['end']:07.2f}: {x['text']}",flush=True)
if len(items)<20 or sum(len(x['text']) for x in items)<150:
    raise RuntimeError('Too little clear speech: do not fabricate voice subtitles.')
ROOT.mkdir(parents=True,exist_ok=True)
counts=[]
for n in range(12):
    lo,hi=BOUNDARIES[n],BOUNDARIES[n+1]
    cues=[]
    for line in items:
        if line['end']<=lo or line['start']>=hi:continue
        start=max(0,line['start']-lo);end=min(hi-lo,line['end']-lo)
        if end-start<.2:continue
        cues.append((start,end,line['text']))
    lines=['WEBVTT','','NOTE AI 語音辨識字幕尚未人工校對。零件與安全術語需依實際錄音確認。','']
    for i,(s,e,t) in enumerate(cues,1):
        lines.extend([str(i),f'{stamp(s)} --> {stamp(e)}',t,''])
    (ROOT/f'chapter-{n+1:02d}-speech.vtt').write_text('\n'.join(lines)+'\n',encoding='utf-8')
    counts.append(len(cues))
    print(f'CHAPTER {n+1:02d}: {len(cues)} cues',flush=True)
(ROOT/'transcription-metadata.json').write_text(json.dumps({
    'source':'IMG_8838.MOV','method':'faster-whisper small CPU int8',
    'language':info.language,'reviewed_by_human':False,
    'segment_count':len(items),'per_chapter':counts,
    'note':'AI word/phrase recognition and timestamps require checking.'
},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('TRANSCRIPTION_COMPLETE',flush=True)
