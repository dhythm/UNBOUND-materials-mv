import json
from pathlib import Path
p=Path(__file__).resolve().parent/'opus-full-events.jsonl'
rows=[]
for line in p.read_text().splitlines():
 try:d=json.loads(line)
 except:continue
 if d.get('type')=='assistant':
  for c in d.get('message',{}).get('content',[]):
   if c.get('type')=='text':rows.append(c['text'][:1300])
   elif c.get('type')=='tool_use':rows.append(c['name']+' '+str({k:v for k,v in c.get('input',{}).items() if k!='content'})[:260])
 elif d.get('type')=='result':rows.append('RESULT '+str(d.get('is_error'))+' '+str(d.get('result'))[:3500])
print('\n'.join(rows[-8:]))
errors=(p.parent/'opus-full-errors.log').read_text()
if errors:print('ERROR LOG',errors[-1000:])
