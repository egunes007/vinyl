"""Build the separate scheduled, single-record cover workflow."""
import json
from pathlib import Path
from copy import deepcopy
root=Path(__file__).resolve().parent
previous=json.loads((root/'vinyl-discogs-covers-1.0.3.json').read_text())
original={n['name']:n for n in previous['nodes']}
nodes=[]
def reuse(name):
 n=deepcopy(original[name]);nodes.append(n);return n
reuse('Manual start')
nodes.append({'id':'every-ten-minutes','name':'Every 10 minutes','type':'n8n-nodes-base.scheduleTrigger','typeVersion':1.2,'position':[0,0],'parameters':{'rule':{'interval':[{'field':'minutes','minutesInterval':10}]}}})
n=reuse('Configuration');n['parameters']['jsCode']="return [{json:{baseUrl:'http://192.168.1.13:8080',tableId:'m4z9hmr4f6ylz8m'}}];"
reuse('Read collection')['parameters']['queryParameters']['parameters'].append({'name':'sort','value':'Id'})
n=reuse('Select candidates');n['name']='First missing cover';n['id']='first-missing-cover'
n['parameters']['jsCode']=r"""const pages=$input.all().map(i=>i.json);
if(!pages.length||pages.some(p=>!Array.isArray(p.list)))throw new Error('Invalid NocoDB list');
const last=pages.at(-1);
if(last.list.length>=100&&last.pageInfo?.isLastPage!==true)throw new Error('Incomplete scan; no changes made');
const config=$('Configuration').first().json;
const state=$getWorkflowStaticData('global');state.noImageUntil??={};
const now=Date.now();
for(const [id,expiry] of Object.entries(state.noImageUntil))if(expiry<=now)delete state.noImageUntil[id];
const empty=v=>v==null||v===''||(Array.isArray(v)&&v.length===0)||(typeof v==='string'&&/^\s*\[\s*\]\s*$/.test(v));
const rows=pages.flatMap(p=>p.list).sort((a,b)=>Number(a.Id)-Number(b.Id));
const row=rows.find(r=>/^\d+$/.test(String(r.Id))&&empty(r.Cover_Image)&&/^[1-9]\d{0,11}$/.test(String(r.Discogs_ID??'').trim())&&!state.noImageUntil[String(r.Id)]);
if(!row)return [];
return [{json:{...config,recordId:row.Id,releaseId:String(row.Discogs_ID).trim(),artist:String(row.Artist??''),album:String(row.Album??'')}}];"""
reuse('Discogs release')
n=reuse('Choose image');n['parameters']['jsCode']=r"""const item=$('First missing cover').first().json;
const response=$json;
if([401,403,429].includes(response.statusCode))throw new Error('Discogs access/rate limit: '+response.statusCode);
if(response.statusCode!==200&&response.statusCode!==404)throw new Error('Discogs HTTP '+response.statusCode);
const images=response.body?.images||[];
if(!Array.isArray(images))throw new Error('Invalid Discogs image list');
const image=images.find(i=>i.type==='primary')||images[0];
const uri=image?.uri;
if(response.statusCode===404||typeof uri!=='string'||/[\s\\]/.test(uri)||!/^https:\/\/(?:i|img)\.discogs\.com\/[^#]+$/i.test(uri)){
 const state=$getWorkflowStaticData('global');state.noImageUntil??={};
 state.noImageUntil[String(item.recordId)]=Date.now()+24*60*60*1000;
 return []; // Next scheduled run moves past this record for 24 hours.
}
return [{json:{...item,coverUrl:uri},pairedItem:{item:0}}];"""
reuse('Download cover')
n=reuse('Prepare image file');n['parameters']['jsCode']=n['parameters']['jsCode'].replace("$('Choose image').item", "$('Choose image').first()")
reuse('Upload image to NocoDB')
n=reuse('Validate upload');n['parameters']['jsCode']=n['parameters']['jsCode'].replace("$('Choose image').item", "$('Choose image').first()").replace('!attachments.length||','attachments.length!==1||')
reuse('Recheck empty cover')
n=reuse('Protect existing cover');n['parameters']['jsCode']=r"""const item=$('Validate upload').first().json;
const row=$json;
if(String(row.Id)!==String(item.recordId))throw new Error('Wrong record returned');
const v=row.Cover_Image;
const empty=v==null||v===''||(Array.isArray(v)&&v.length===0)||(typeof v==='string'&&/^\s*\[\s*\]\s*$/.test(v));
if(!empty||String(row.Discogs_ID??'').trim()!==item.releaseId)return [];
return [{json:item,pairedItem:{item:0}}];"""
reuse('Attach cover')
n=reuse('Updated result');n['parameters']['jsCode']=n['parameters']['jsCode'].replace("$('Protect existing cover').item", "$('Protect existing cover').first()")
connections={}
def link(a,b):connections[a]={'main':[[{'node':b,'type':'main','index':0}]]}
link('Manual start','Configuration');link('Every 10 minutes','Configuration')
chain=[n['name'] for n in nodes[2:]]
for a,b in zip(chain,chain[1:]):link(a,b)
for i,n in enumerate(nodes):n['position']=[(i%5)*270,(i//5)*260]
workflow={'name':'VINYL — Her 10 dakikada tek kapak v1.0.0','nodes':nodes,'connections':connections,'active':False,'settings':{'executionOrder':'v1','timezone':'Europe/Istanbul','saveDataSuccessExecution':'none','saveDataErrorExecution':'none','saveManualExecutions':False},'pinData':{},'tags':[]}
(root/'vinyl-one-cover-every-10-minutes-1.0.0.json').write_text(json.dumps(workflow,ensure_ascii=False,indent=2)+'\n')
