"""Independent checks of the rendered full film; use bundled Python with Pillow."""
from pathlib import Path
import json, subprocess
from PIL import Image, ImageDraw
ROOT=Path(__file__).resolve().parent.parent
VIDEO=ROOT/'motion-project/out/unbound-75s.mp4'
OUT=ROOT/'motion-project/out/full-review'
OUT.mkdir(parents=True,exist_ok=True)
probe=json.loads(subprocess.check_output(['/opt/homebrew/bin/ffprobe','-v','error','-show_streams','-show_format','-of','json',str(VIDEO)]))
v=next(s for s in probe['streams'] if s['codec_type']=='video')
a=next(s for s in probe['streams'] if s['codec_type']=='audio')
assert (v['width'],v['height'])==(1920,1080)
assert v['avg_frame_rate']=='30/1'
assert v.get('nb_frames')=='2250'
assert abs(float(v['duration'])-75)<.05
peaks=subprocess.run(['/opt/homebrew/bin/ffmpeg','-hide_banner','-i',str(VIDEO),'-vn','-af','volumedetect','-f','null','-'],capture_output=True,text=True).stderr
(OUT/'audio-measure.txt').write_text(peaks)
(OUT/'metadata.json').write_text(json.dumps(probe,indent=2))
times=[0.5,2,4,6,8,10,12,14,16,18,20,22,24,26,28,30,32,34,36,38,40,41.3,42,43,44,45,46,46.9,47.6,48.7,50,52,54,56,58,60,62,64,66,68,70,72,74.5]
for t in times:
 p=OUT/f'frame-{t:05.1f}.jpg'
 subprocess.run(['/opt/homebrew/bin/ffmpeg','-v','error','-ss',str(t),'-i',str(VIDEO),'-frames:v','1','-vf','scale=480:270','-y',str(p)],check=True)
for start in range(0,len(times),12):
 part=times[start:start+12]
 sheet=Image.new('RGB',(1440,4*298),'#202020'); draw=ImageDraw.Draw(sheet)
 for i,t in enumerate(part):
  x=(i%3)*480;y=(i//3)*298
  sheet.paste(Image.open(OUT/f'frame-{t:05.1f}.jpg'),(x,y));draw.text((x+10,y+275),f'{t:.1f}s',fill='white')
 sheet.save(OUT/f'contact-{start//12+1}.jpg',quality=93)
print(json.dumps({'video':str(VIDEO),'seconds':v['duration'],'frames':v['nb_frames'],'audio':a['codec_name'],'bytes':VIDEO.stat().st_size,'reviewFrames':len(times)},indent=2))
print('\n'.join(x for x in peaks.splitlines() if 'mean_volume:' in x or 'max_volume:' in x))
