from pathlib import Path
import sys, json, math, wave, hashlib
sys.path.insert(0, '/private/tmp/unbound-fonttools')
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SVGNS = 'http://www.w3.org/2000/svg'
def write(path, text):
    (ROOT/path).parent.mkdir(parents=True, exist_ok=True)
    (ROOT/path).write_text(text, encoding='utf-8')
def svg(w,h,body,desc=''):
    return f'<svg xmlns="{SVGNS}" width="{w}" height="{h}" viewBox="0 0 {w} {h}"><desc>{desc}</desc>{body}</svg>'

archivo = TTFont(ROOT/'typography/Archivo-Variable.ttf')
noto = TTFont(ROOT/'typography/NotoSansJP-Variable.ttf')
fonts = {
 'condensed': instantiateVariableFont(archivo, {'wght':900, 'wdth':62}, inplace=False),
 'wide': instantiateVariableFont(archivo, {'wght':900, 'wdth':100}, inplace=False),
 'japanese': instantiateVariableFont(noto, {'wght':700}, inplace=False),
}
words = [('PRESS','condensed'),('PUSH','condensed'),('HOLD','condensed'),('BREAK','condensed'),('FLOW','condensed'),('UNBOUND','condensed'),('AI','wide'),('UNBOUND','wide'),('これ、どうやって','japanese'),('AIで作るんだろう？','japanese'),('自分でも、できる。','japanese')]
word_keys = ['press','push','hold','break','flow','unbound','ai','unbound-wide','question-1','question-2','answer']
data = {'coordinateSystem':'font native y-up; SVG uses parent translate(0,baseline) scale(1,-1)', 'words':{}}
glyph_seen = set()
for key,(text,fkey) in zip(word_keys,words):
    f=fonts[fkey]; gs=f.getGlyphSet(); cmap=f.getBestCmap(); upm=f['head'].unitsPerEm
    tracking=upm*(0.018 if fkey!='japanese' else 0.025)
    x=0; letters=[]; bounds=[]
    for i,char in enumerate(text):
        name=cmap[ord(char)]; pen=SVGPathPen(gs); gs[name].draw(pen)
        bpen=BoundsPen(gs); gs[name].draw(bpen); b=bpen.bounds
        letters.append({'id':f'{key}-glyph-{i:02d}','character':char,'glyphName':name,'d':pen.getCommands(),'x':round(x,3),'advance':gs[name].width,'bounds':b})
        if b: bounds.append((b[0]+x,b[1],b[2]+x,b[3]))
        x+=gs[name].width+tracking
        token=(fkey,char)
        if token not in glyph_seen and char.isascii() and char.isalnum():
            glyph_seen.add(token)
            bx0,by0,bx1,by1=b; m=upm*0.015
            body=f'<path id="glyph-{char}" fill="#F5F3EC" d="{pen.getCommands()}" transform="translate({-bx0+m},{by1+m}) scale(1,-1)"/>'
            write(f'typography/glyphs/{fkey}-{char}.svg',svg(round(bx1-bx0+2*m,3),round(by1-by0+2*m,3),body,f'Archivo {fkey} independent glyph {char}'))
    xmin=min(b[0] for b in bounds); ymin=min(b[1] for b in bounds); xmax=max(b[2] for b in bounds); ymax=max(b[3] for b in bounds)
    m=upm*0.02; width=round(xmax-xmin+2*m,3); height=round(ymax-ymin+2*m,3)
    body=f'<g fill="#F5F3EC" transform="translate({m-xmin},{m+ymax}) scale(1,-1)">'
    body+=''.join(f'<path id="{a["id"]}" d="{a["d"]}" transform="translate({a["x"]},0)"/>' for a in letters)+'</g>'
    write(f'typography/words/{key}.svg',svg(width,height,body,f'{text}; each glyph has a stable independent id'))
    data['words'][key]={'text':text,'font':fkey,'unitsPerEm':upm,'tracking':tracking,'viewBox':[0,0,width,height],'baseline':m+ymax,'offsetX':m-xmin,'glyphs':letters}
write('typography/glyph-layouts.json',json.dumps(data,ensure_ascii=False,indent=2))
write('typography/fonts.css','''@font-face { font-family: Archivo; src: url('./Archivo-Variable.ttf') format('truetype'); font-weight:100 900; font-stretch:62% 125%; font-display:block; }
@font-face { font-family: NotoSansJP; src: url('./NotoSansJP-Variable.ttf') format('truetype'); font-weight:100 900; font-display:block; }
''')

def ellipse_point(t,rx,ry): return np.array([200+rx*math.cos(t),200+ry*math.sin(t)])
def rotate(p,deg):
    a=math.radians(deg); q=p-np.array([200,200]); return np.array([200+q[0]*math.cos(a)-q[1]*math.sin(a),200+q[0]*math.sin(a)+q[1]*math.cos(a)])
def arc(t0,t1,rx,ry,rot):
    k=4/3*math.tan((t1-t0)/4)
    p0=ellipse_point(t0,rx,ry); p3=ellipse_point(t1,rx,ry)
    p1=p0+k*np.array([-rx*math.sin(t0),ry*math.cos(t0)])
    p2=p3-k*np.array([-rx*math.sin(t1),ry*math.cos(t1)])
    return [rotate(p,rot).round(4).tolist() for p in [p0,p1,p2,p3]]
def path_from_points(p):
    pair=lambda a: f'{a[0]:.4f},{a[1]:.4f}'
    return 'M'+pair(p[0])+' C'+' '.join(pair(a) for a in p[1:4])+' L'+pair(p[4])+' C'+' '.join(pair(a) for a in p[5:8])+' Z'
poses={}; palette=['#F5F3EC']*6
for name,(rx,ry,rot) in {'loop':(155,155,0),'pressure':(102,176,-18),'release':(174,112,15)}.items():
    pieces=[]
    for i in range(6):
        a=math.radians(-60+i*50); b=math.radians(-60+i*50+47)
        points=arc(a,b,rx,ry,rot)+arc(b,a,rx-48,ry-48,rot)
        pieces.append({'id':f'logo-segment-{i}','points':points,'d':path_from_points(points)})
    poses[name]=pieces
    body=''.join(f'<path id="{p["id"]}" fill="#F5F3EC" d="{p["d"]}"/>' for p in pieces)
    write(f'vectors/logo-{name}.svg',svg(400,400,body,'UNBOUND original open-loop mark; six independently animatable segments'))
write('vectors/logo-morph-controls.json',json.dumps({'viewBox':[0,0,400,400],'topology':'Each segment: M point0 C point1 point2 point3 L point4 C point5 point6 point7 Z. Interpolate coordinates per segment. No cross-glyph path morph implied.','poses':poses},indent=2))
write('vectors/rail.svg',svg(1920,1080,'<path id="rail-main" d="M-100 790 C350 790 460 210 900 210 S1420 890 2020 440" fill="none" stroke="#FF4D24" stroke-width="8"/><path id="rail-secondary" d="M-100 814 C350 814 460 234 900 234 S1420 914 2020 464" fill="none" stroke="#F5F3EC" stroke-width="2"/>','Two continuous paths for motion rails or reveals'))
write('vectors/portal.svg',svg(600,600,'<path id="portal-ring" fill="#F5F3EC" fill-rule="evenodd" d="M300 20 A280 280 0 1 1 299.99 20 Z M300 115 A185 185 0 1 0 300.01 115 Z"/>','Ring mask; aperture and rim for a camera-through-letter transition'))
write('vectors/ribbon-centerline.svg',svg(1920,1080,'<path id="ribbon-centerline" d="M-100 740 C300 1060 410 40 920 350 S1350 930 2040 160" fill="none" stroke="#F5F3EC" stroke-width="120" stroke-linecap="butt"/>','Editable vector ribbon centerline, not a photographic deformation'))

# Deterministic original sound effects and a restrained rhythmic edit guide.
SR=48000; rng=np.random.default_rng(10426)
def tone(freq,dur,decay=8):
    t=np.arange(round(SR*dur))/SR; return np.sin(2*np.pi*freq*t)*np.exp(-decay*t)
def wavwrite(rel,a):
    if a.ndim==1: a=np.stack([a,a],axis=1)
    a=np.nan_to_num(a); peak=float(np.max(np.abs(a))); a=a/(max(peak,1)*1.05)
    with wave.open(str(ROOT/rel),'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(a,-1,1)*32767).astype('<i2').tobytes())
def kick():
    t=np.arange(int(.55*SR))/SR; f=47+125*np.exp(-t*45); return .7*np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t*10)
def click():
    t=np.arange(int(.16*SR))/SR; return (.12*rng.normal(size=len(t))+.15*np.sin(2*np.pi*3300*t))*np.exp(-t*55)
def sweep(dur,up=True):
    t=np.arange(int(dur*SR))/SR; n=rng.normal(size=len(t)); n=np.convolve(n,np.ones(7)/7,mode='same')
    env=np.sin(np.pi*t/dur)**2; f=120+2400*((t/dur) if up else (1-t/dur))**2
    return .25*n*env+.12*np.sin(2*np.pi*np.cumsum(f)/SR)*env
sfx={'impact-low':kick(),'snap-click':click(),'tension-rise':sweep(2.5,True),'release-sweep':sweep(1.4,False),'metal-flex':tone(347,1.4,4)+.35*tone(521,1.4,5)+.25*tone(1079,1.4,7),'lock-final':tone(220,.7,12)+.22*tone(1320,.7,20)}
for name,a in sfx.items(): wavwrite(f'audio/{name}.wav',a)
guide=np.zeros((75*SR,2)); bpm=128; beat=60/bpm
def place(at,a,gain=1,pan=0):
    start=round(at*SR); end=min(start+len(a),len(guide)); a=a[:end-start]*gain
    if start>=0 and end>start: guide[start:end,0]+=a*(1-pan)*.5; guide[start:end,1]+=a*(1+pan)*.5
for b in range(160):
    at=b*beat
    if 41.25<=at<48.75: continue
    if at<5.625 and b%4: continue
    if at>=69.375: continue
    energy=.65 if at<48.75 else .9
    place(at,sfx['impact-low'],energy)
    if b%4 in [1,3]: place(at+.5*beat,click(),energy*.5,(-1 if b%2 else 1)*.3)
    if b%4==2: place(at,tone(137,.3,18),energy*.24)
place(39,sfx['tension-rise'],.45)
place(48.75,sfx['release-sweep'],.9)
place(65.625,sfx['metal-flex'],.6)
place(71.25,sfx['lock-final'],.8)
guide*=np.linspace(1,0,len(guide))[:,None]*.5+.5
wavwrite('audio/rhythm-guide-128bpm-75s.wav',guide)
sections=[('ignition',0,5.625),('pressure',5.625,16.875),('chain',16.875,28.125),('portal',28.125,41.25),('human-question',41.25,48.75),('release',48.75,65.625),('resolve',65.625,75)]
write('audio/timing-cues.json',json.dumps({'bpm':128,'fps':30,'durationSeconds':75,'durationFrames':2250,'sections':[{'id':k,'startSeconds':a,'endSeconds':b,'startFrame':round(a*30),'endFrameExclusive':round(b*30)} for k,a,b in sections],'note':'Guide only. Human speech is not synthesized here; duck music around the external presenter clip. Align hand contact to actual generated performance.'},indent=2))
print('Outlined words:',len(words),'Independent Latin glyphs:',len(glyph_seen),'Logo poses:',len(poses),'Original SFX:',len(sfx))
for p in (ROOT/'images').glob('*.png'):
    im=Image.open(p); print(p.name,im.size,im.mode)
