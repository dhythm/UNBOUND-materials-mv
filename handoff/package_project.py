from pathlib import Path
import zipfile
ROOT=Path(__file__).resolve().parent.parent
PROJECT=ROOT/'motion-project'
OUT=ROOT.parent/'UNBOUND-editable-project.zip'
EXCLUDED={'node_modules','.git','.cache','.remotion','out','build'}
with zipfile.ZipFile(OUT,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for p in sorted(PROJECT.rglob('*')):
  rel=p.relative_to(PROJECT)
  if p.is_file() and not any(part in EXCLUDED for part in rel.parts):
   z.write(p,Path('UNBOUND-motion-project')/rel)
 with z.open('UNBOUND-motion-project/START-HERE.txt','w') as f:
  f.write('UNBOUND — 編集用Remotionプロジェクト\n\n依存関係の準備：npm ci\n編集プレビュー：npm run studio\n本編出力：npm run render:main\n出力先：out/unbound-75s.mp4\n\n75秒 / 1920×1080 / 30fps。publicに必要な画像、フォント、透過人物連番、音を同梱。ローカル依存のnode_modulesと完成動画は別ファイルです。素材の出典・ライセンスはpublicの同梱情報を参照してください。\n'.encode('utf-8'))
with zipfile.ZipFile(OUT) as z:
 assert z.testzip() is None
 print(f'{OUT}: {OUT.stat().st_size:,} bytes / {len(z.infolist())} files / integrity OK')
