from pathlib import Path
import xml.etree.ElementTree as ET
import json, base64
ROOT=Path(__file__).resolve().parent.parent
ET.register_namespace('', 'http://www.w3.org/2000/svg')
def word(key,x,y,w,fill='#F5F3EC'):
    root=ET.parse(ROOT/f'typography/words/{key}.svg').getroot()
    width=float(root.attrib['width']); s=w/width
    body=''.join(ET.tostring(c,encoding='unicode') for c in root if not c.tag.endswith('desc'))
    return f'<g transform="translate({x},{y}) scale({s})">{body}</g>'.replace('fill="#F5F3EC"',f'fill="{fill}"')
def image(name,x,y,w,h):
    encoded=base64.b64encode((ROOT/f'images/{name}.png').read_bytes()).decode('ascii')
    return f'<image xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="data:image/png;base64,{encoded}" x="{x}" y="{y}" width="{w}" height="{h}" preserveAspectRatio="xMidYMid meet"/>'
def label(text,x,y,color='#8B8B88',size=20):
    return f'<text x="{x}" y="{y}" font-family="Arial,sans-serif" font-size="{size}" letter-spacing="3" fill="{color}">{text}</text>'
def mark(x,y,w,color='#F5F3EC'):
    r=ET.parse(ROOT/'vectors/logo-loop.svg').getroot()
    body=''.join(ET.tostring(c,encoding='unicode') for c in r if c.tag.endswith('path'))
    return f'<g transform="translate({x},{y}) scale({w/400})">{body}</g>'.replace('fill="#F5F3EC"',f'fill="{color}"')
def page(name,body):
    foot='<path d="M80 990 H1840" stroke="#333" stroke-width="1"/>'+label('UNBOUND / MATERIAL STUDY',80,1030)+label(name.upper(),1370,1030)
    svg=f'<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080"><rect width="1920" height="1080" fill="#050505"/>{body}{foot}</svg>'
    (ROOT/f'previews/{name}.svg').write_text(svg,encoding='utf-8')

page('01-pressure',
    image('01-pressure',650,385,1270,590)+
    word('press',80,120,1720)+
    '<rect x="80" y="710" width="390" height="8" fill="#FF4D24"/>'+
    label('01 / PRESSURE',80,75,'#FF4D24',25)+
    label('TYPE TAKES THE WEIGHT.',80,770,'#F5F3EC',25)+mark(80,800,120))

page('02-portal',
    '<defs><clipPath id="window"><circle cx="910" cy="515" r="365"/></clipPath></defs>'+
    '<g clip-path="url(#window)">'+image('03-macro',70,-20,1700,1060)+'</g>'+
    '<circle cx="910" cy="515" r="400" fill="none" stroke="#F5F3EC" stroke-width="60"/>'+
    '<circle cx="910" cy="515" r="457" fill="none" stroke="#FF4D24" stroke-width="2" stroke-dasharray="4 10"/>'+
    '<path d="M60 515 H350 M1470 515 H1860" stroke="#FF4D24" stroke-width="4"/>'+
    label('02 / THROUGH THE LETTER',80,75,'#FF4D24',25)+
    label('ONE SHAPE. ANOTHER WORLD.',80,950,'#F5F3EC',25)+mark(1700,80,140))

page('03-human',
    image('../previews/presenter-gesture-alpha',1030,600,854,480)+
    word('ai',80,130,620)+
    word('question-1',80,590,940)+word('question-2',80,715,990)+
    '<rect x="80" y="875" width="280" height="8" fill="#FF4D24"/>'+
    label('03 / HUMAN INTERRUPTS THE SYSTEM',80,75,'#FF4D24',25)+
    label('ACTUAL VIDEO FRAME / CHROMA KEY SAMPLE',80,950,'#8B8B88',18))

page('04-release',
    image('02-release',0,220,1920,900)+
    word('flow',80,110,1720)+
    label('04 / RELEASE',80,75,'#FF4D24',25)+
    '<path d="M80 920 C430 750 930 970 1550 860" fill="none" stroke="#FF4D24" stroke-width="5"/>'+
    mark(1650,730,190,'#FF4D24'))

page('05-resolve',
    mark(690,75,540)+word('unbound-wide',120,650,1680)+
    '<rect x="835" y="925" width="250" height="7" fill="#FF4D24"/>'+
    label('05 / EVERY PIECE FINDS ITS PLACE',80,75,'#FF4D24',25))

names=['01-pressure','02-portal','03-human','04-release','05-resolve']
cards=''.join(f'<figure><img src="previews/{n}.png" alt="{n}"><figcaption>{n}</figcaption></figure>' for n in names)
assets=[('01-pressure','圧縮・ねじれ'),('02-release','解放・波形'),('03-macro','金属の接写'),('04-presenter-green','Seedance用・グリーンバック'),('05-presenter-cutout','透過人物・仮編集専用')]
photos=''.join(f'<figure><a href="images/{n}.png"><img src="images/{n}.png" alt="{label}"></a><figcaption>{label} <a href="images/{n}.png">PNGを開く</a></figcaption></figure>' for n,label in assets)
html='''<!doctype html><html lang="ja"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>UNBOUND — 素材パック</title><style>
@font-face{font-family:Archivo;src:url('typography/Archivo-Variable.ttf')}@font-face{font-family:Noto;src:url('typography/NotoSansJP-Variable.ttf')}
*{box-sizing:border-box}body{margin:0;background:#0b0b0b;color:#f5f3ec;font-family:Noto,Arial,sans-serif}main{max-width:1480px;margin:auto;padding:48px 36px 100px}a{color:#ff6b46}h1{font-family:Archivo,sans-serif;font-variation-settings:'wght' 900,'wdth' 62;font-size:clamp(80px,15vw,210px);line-height:.88;letter-spacing:-.04em;margin:28px 0}p{color:#b6b4ae;line-height:1.85;max-width:950px}.tag{color:#ff6b46;letter-spacing:.12em;font-size:13px}h2{font-size:24px;margin:60px 0 20px}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:24px}figure{margin:0;background:#151515;border:1px solid #292929}img{display:block;width:100%;aspect-ratio:16/9;object-fit:contain;background:#050505}figcaption{padding:14px 18px;font-size:13px;color:#b6b4ae;display:flex;justify-content:space-between;gap:12px}.links{display:flex;gap:20px;flex-wrap:wrap;padding:18px 0}audio{width:100%;max-width:650px}.note{border-left:3px solid #ff4d24;padding:10px 20px;background:#151515}@media(max-width:800px){main{padding:32px 18px}.grid{grid-template-columns:1fr}}
</style><main><div class="tag">75 SECONDS / TYPE + MATERIAL + HUMAN / 2026.10.04</div><h1>UNBOUND</h1><p>文字に力が宿る。圧縮、連鎖、解放を、一つの形でつなぐための制作素材。人物の実写的な動きだけをSeedanceへ、文字・ロゴ・空間の演出をRemotionへ。</p><div class="note">人物動画を受領し、背景を透過した動画も作成済みです。原本は854×480・約8秒。人物を大きく拡大しすぎない配置で使います。透過人物PNGは別途作成した仮編集用の静止画です。</div><div class="links"><a href="prompts/seedance-presenter-ja.txt">Seedanceプロンプト</a><a href="handoff/OPUS_BRIEF.md">Opusへの制作指示</a><a href="README.md">素材一覧と進め方</a><a href="manifest.json">素材の来歴・寸法</a></div><h2>画面構成のサンプル</h2><p>以下は静止画の構図見本です。人物の構図には受領した動画の切り抜きフレームを使用しています。完成動画ではありません。</p><div class="grid">'''+cards+'''</div><h2>人物の動画素材</h2><video controls preload="metadata" style="width:100%;max-width:854px;background:#161616" src="video-inbox/presenter-alpha.webm"></video><div class="links"><a href="video-inbox/presenter-green.mp4">グリーンバック原本</a><a href="video-inbox/presenter-alpha.webm">透過WebM</a><a href="video-inbox/presenter-voice.wav">抽出音声</a></div><h2>画像素材</h2><div class="grid">'''+photos+'''</div><h2>音とタイミング</h2><p>128 BPM・75秒のオリジナル編集ガイド。音楽の完成版ではなく、衝突や場面転換のタイミングを揃えるためのリズムです。人物の台詞は含みません。</p><audio controls preload="none" src="audio/rhythm-guide-128bpm-75s.wav"></audio><div class="links"><a href="audio/timing-cues.json">場面の区切り</a><a href="references/REFERENCE_NOTES.md">制作リファレンスと来歴</a></div></main></html>'''
(ROOT/'index.html').write_text(html,encoding='utf-8')
print('5 native SVG styleframes and asset gallery created')
