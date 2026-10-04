from pathlib import Path
import json, hashlib, wave, subprocess, xml.etree.ElementTree as ET
from html.parser import HTMLParser
from PIL import Image
import numpy as np
R=Path(__file__).resolve().parent.parent
def edit(rel,changes):
    p=R/rel; s=p.read_text()
    for a,b in changes:
        if b not in s: s=s.replace(a,b)
    p.write_text(s,encoding='utf-8')

edit('README.md',[
 ('| video-inbox/presenter-green.mp4 | 人物が喋って手を動かす動画 | ユーザーによるSeedance生成待ち |','| video-inbox/presenter-green.mp4 | 人物が喋って手を動かす動画 | ユーザーから受領済み・約8秒、854×480 |\n| video-inbox/presenter-alpha.webm / presenter-frames/ | 切り抜き動画とRGBA連番 | 30fps、アルファ確認済み |\n| video-inbox/presenter-voice.wav | 原本から抽出した音声 | 同梱 |'),
 ('1. Seedanceへ04-presenter-green.pngを添付し、seedance-presenter-ja.txtを使って人物の約8秒の1カットを生成する。音声付きが選べる場合は指定の日本語台詞も生成する。','1. 人物動画は受領済み。video-inbox/presenter-green.mp4が原本。追加のSeedance生成は不要。'),
 ('2. 生成動画をvideo-inbox/presenter-green.mp4へ保存する。別音声の場合はpresenter-voice.wav/mp3も保存する。','2. 切り抜き動画presenter-alpha.webm、RGBA連番presenter-frames/、抽出音声presenter-voice.wavも用意済み。handoff/RECEIVED_VIDEO_NOTES.mdで動作と画質を確認する。'),
 ('人物動画がなくても文字の制作は進められますが、人物を含む完成本編は未完了です。切り抜き用スクリプトhandoff/key-presenter.shは初期設定の例で、実際の人物動画ではキーの色と輪郭の調整・確認が必要です。','素材準備は完了。本編の制作はこれからです。切り抜きは実動画で行い、透過WebMをVP9アルファ対応のデコーダーで確認しました。Remotionでは必要に応じてRGBA連番を使い、音声は一度だけ再生してください。'),
 ])
edit('handoff/OPUS_BRIEF.md',[
 ('ユーザーがSeedanceで作る人物動画だけが外部待ち。','人物動画もユーザーから受領済みで、切り抜き動画とRGBA連番・抽出音声まで準備済み。追加のSeedance生成は不要。'),
 ('audio/timing-cues.jsonを読み、','audio/timing-cues.json、handoff/RECEIVED_VIDEO_NOTES.mdを読み、'),
 ('## 人物の生成動画と合成','## 人物の生成動画と合成\n\n実素材の推奨：video-inbox/presenter-frames/のRGBA連番を30fpsで描画し、presenter-voice.wavを同期して一度だけ再生する。フレーム1が0秒。透過WebMが正常にデコードできる場合はそちらでもよい。原本は854×480なので人物の高さは450–510px程度に抑える。約4秒以降に手が上がり、5–6秒で外側へ示す動きになる。その実際の動きを起点に文字を出す／押し広げる。原本の画質や動作を直すための有料再生成は行わない。'),
 ('画像を揺らしただけで「話す人物動画が完成した」と扱わない。','画像を揺らしただけで「話す人物動画が完成した」と扱わない。現在は実動画が揃っているので、完成本編には必ず受領した人物動画を使う。'),
 ])
edit('handoff/CODEX_HANDOFF.md',[
 ('ユーザーがSeedanceで作る人物動画だけが外部待ち。','人物動画も受領・切り抜き済みです。'),
 ('ユーザーが生成します。','ユーザーが生成し、video-inbox/presenter-green.mp4へ格納済みです。'),
 ('今回のCodex環境ではclaude auth statusがloggedIn:falseを返しましたが、ユーザーは既にログインしており、別のCodexセッションではCLIに指示できたと説明しています。ユーザーに再ログインを繰り返し依頼せず、このセッションで通常の認証を利用できるか確認してください。CLI未認証という結果を、ユーザー全体のアカウントが未ログインだと断定しないでください。','認証確認：制限内の実行ではloggedIn:falseでしたが、通常の環境で確認するとloggedIn:trueでした。ユーザーはログイン済みです。実行制限が認証アクセスに影響するため、必要な場合は通常の承認付き実行を使い、ユーザーへ再ログインを依頼しないでください。'),
 ])
edit('video-inbox/README.md',[
 ('現時点で人物の生成動画は未作成。','人物の生成動画を受領済み。presenter-green.mp4が原本。presenter-alpha.webmとpresenter-frames/は切り抜き済み素材、presenter-voice.wavは抽出音声。'),
 ])

notes=R/'references/REFERENCE_NOTES.md'
if '受領した動画' not in notes.read_text():
    notes.write_text(notes.read_text()+'\n## 受領した動画\n\nユーザーからvideo-inbox/presenter-green.mp4を受領。Dreaminaで生成された架空人物の約8秒の動画。追加生成は実施していない。背景を切り抜いて30fpsの透過WebMとRGBA連番を作成し、音声をWAVとして抽出。詳細はhandoff/RECEIVED_VIDEO_NOTES.mdを参照。\n')

# Remove only discarded preview files created in this task.
for n in ['03-human-direct.png','03-human-sharp.png','03-human-proof.png','03-human-proof.svg']:
    (R/'previews'/n).unlink(missing_ok=True)

entries=[]; svgcount=0; durations={}
for p in sorted(R.rglob('*')):
    if not p.is_file() or p.name in ['manifest.json','verification.json'] or p.name.endswith('.log') or p.suffix=='.jsonl': continue
    rel=str(p.relative_to(R)); e={'path':rel,'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
    if p.suffix=='.png':
        im=Image.open(p); im.verify(); im=Image.open(p)
        e.update(width=im.width,height=im.height,mode=im.mode)
        if im.mode=='RGBA': e['alphaRange']=list(im.getextrema()[-1])
    if p.suffix=='.svg':
        rt=ET.parse(p).getroot(); assert 'viewBox' in rt.attrib
        e['viewBox']=rt.attrib['viewBox']; svgcount+=1
    if p.suffix=='.wav':
        with wave.open(str(p)) as w:
            e.update(sampleRate=w.getframerate(),channels=w.getnchannels(),durationSeconds=w.getnframes()/w.getframerate())
            durations[rel]=e['durationSeconds']; pcm=np.frombuffer(w.readframes(w.getnframes()),dtype='<i2')
            e['samplePeak']=float(np.max(np.abs(pcm.astype(float)))/32768)
    if p.suffix in ['.mp4','.webm']:
        probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','stream=codec_name,codec_type,width,height,r_frame_rate,avg_frame_rate:stream_tags=alpha_mode','-show_entries','format=duration','-of','json',str(p)]))
        e['probe']=probe
    entries.append(e)

frames=sorted((R/'video-inbox/presenter-frames').glob('frame-*.png'))
assert len(frames)==241, len(frames)
for p in [frames[0],frames[120],frames[180],frames[-1]]:
    im=Image.open(p); assert im.mode=='RGBA' and im.getextrema()[-1]==(0,255)
    assert im.getpixel((10,10))[3]==0
assert durations['audio/rhythm-guide-128bpm-75s.wav']==75
layouts=json.loads((R/'typography/glyph-layouts.json').read_text()); assert len(layouts['words'])==11
controls=json.loads((R/'vectors/logo-morph-controls.json').read_text()); assert all(len(x)==6 for x in controls['poses'].values())
assert all(len(a['points'])==8 for pose in controls['poses'].values() for a in pose)
cues=json.loads((R/'audio/timing-cues.json').read_text()); sections=cues['sections']
assert sections[0]['startFrame']==0 and sections[-1]['endFrameExclusive']==2250
assert all(a['endFrameExclusive']==b['startFrame'] for a,b in zip(sections,sections[1:]))
class Links(HTMLParser):
    def __init__(self):super().__init__(); self.links=[]
    def handle_starttag(self,tag,attrs):
        d=dict(attrs)
        for k in ['src','href']:
            if k in d and not d[k].startswith(('http','data:','#')):self.links.append(d[k])
hp=Links(); hp.feed((R/'index.html').read_text()); missing=[s for s in hp.links if s!='manifest.json' and not (R/s).exists()]; assert not missing,missing

manifest={'title':'UNBOUND','createdDate':'2026-10-04','timezone':'Asia/Tokyo','stage':'materials-ready','target':{'width':1920,'height':1080,'fps':30,'seconds':75},'imageGeneration':{'tool':'built-in image_gen','model':'not exposed by the tool','promptsDirectory':'prompts'},'presenterVideo':{'status':'received-and-keyed','additionalGenerations':0,'nativeSize':[854,480],'rgbaFrameCount':len(frames),'framesFps':30,'notes':'handoff/RECEIVED_VIDEO_NOTES.md'},'files':entries}
(R/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
assert all((R/s).exists() for s in hp.links)
verification={'date':'2026-10-04','svgFilesParsed':svgcount,'imageFilesVerified':sum(e['path'].endswith('.png') for e in entries),'wordLayouts':len(layouts['words']),'logoPartsPerPose':6,'logoTopology':'8 matched points per segment across three poses','guideDurationSeconds':75,'rgbaVideoFrames':len(frames),'alphaCheckedFrames':[1,121,181,241],'backgroundAlpha':0,'htmlBrokenLinks':missing,'previewRenderer':'Sharp / librsvg, embedded raster data','visualReview':['generated image plates','logo','five styleframes','presenter contact sheet','keyed hand gesture'], 'notYetVerified':['75-second final animation','final mixed audio and dialogue semantics','final Remotion render'], 'cliAuthentication':'Logged in confirmed in normal execution environment; restricted environment obscures auth'}
(R/'verification.json').write_text(json.dumps(verification,ensure_ascii=False,indent=2))
print(json.dumps({'assets':len(entries),'svgFiles':svgcount,'rgbaFrames':len(frames),'materials':'ready','totalMB':round(sum(e['bytes'] for e in entries)/1e6,1)},ensure_ascii=False))
