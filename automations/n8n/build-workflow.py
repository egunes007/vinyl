import json
from pathlib import Path
root=Path(__file__).resolve().parent
nodes=[]; connections={}
def node(name,type,params,version=1,**extra):
 n={'id':name.lower().replace(' ','-'),'name':name,'type':'n8n-nodes-base.'+type,'typeVersion':version,'position':[len(nodes)*210,0],'parameters':params,**extra};nodes.append(n);return n
def link(a,b,out=0):
 c=connections.setdefault(a,{'main':[]})['main']
 while len(c)<=out:c.append([])
 c[out].append({'node':b,'type':'main','index':0})
def code(name,text):
 return node(name,'code',{'jsCode':text},2)
def http(name,params,credential='NocoDB'):
 params={'authentication':'genericCredentialType','genericAuthType':'httpHeaderAuth',**params}
 return node(name,'httpRequest',params,4.2,credentials={'httpHeaderAuth':{'id':'','name':credential}})
def condition(name,expression):
 return node(name,'if',{'conditions':{'options':{'caseSensitive':True,'leftValue':'','typeValidation':'strict','version':2},'conditions':[{'id':name,'leftValue':expression,'rightValue':True,'operator':{'type':'boolean','operation':'true','singleValue':True}}],'combinator':'and'},'options':{}},2.2)
node('Manual start','manualTrigger',{})
code('Configuration',"""return [{json:{baseUrl:'http://192.168.1.13:8080',tableId:'m4z9hmr4f6ylz8m',dryRun:true,maxRecords:5}}];""")
code('Validate configuration',r"""const c=$json;
const base=typeof c.baseUrl==='string'?c.baseUrl:'';
const match=/^(https?):\/\/([a-z0-9.-]+)(?::([0-9]{1,5}))?\/?$/i.exec(base);
if(!match||/[\s\\]/.test(base)||!match[2].split('.').every(label=>/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i.test(label))||(match[3]&&(Number(match[3])<1||Number(match[3])>65535)))throw new Error('NocoDB baseUrl must be an HTTP(S) origin without a path');
if(!/^[A-Za-z0-9_-]+$/.test(c.tableId)||!Number.isInteger(c.maxRecords)||c.maxRecords<1||c.maxRecords>1000||typeof c.dryRun!=='boolean')throw new Error('Invalid configuration');
return [{json:{...c,baseUrl:base.replace(/\/$/,'')}}];""")
http('Read collection',{'url':"={{ $json.baseUrl + '/api/v2/tables/' + $json.tableId + '/records' }}",'sendQuery':True,'queryParameters':{'parameters':[{'name':'limit','value':'100'},{'name':'fields','value':'Id,Artist,Album,Discogs_ID,Cover_Image'}]},'options':{'timeout':30000,'redirect':{'redirect':{'followRedirects':False}},'pagination':{'pagination':{'paginationMode':'updateAParameterInEachRequest','parameters':{'parameters':[{'type':'query','name':'offset','value':'={{ $pageCount * 100 }}'}]},'paginationCompleteWhen':'other','completeExpression':'={{ $response.body.pageInfo?.isLastPage === true || $response.body.list.length < 100 }}','limitPagesFetched':True,'maxRequests':100,'requestInterval':300}}}})
code('Select candidates',"""const pages=$input.all().map(i=>i.json);
if(!pages.length||pages.some(p=>!Array.isArray(p.list)))throw new Error('Invalid NocoDB v2 list');
const last=pages.at(-1);if(last.list.length>=100&&last.pageInfo?.isLastPage!==true)throw new Error('Pagination limit reached; no updates made');
const config=$('Validate configuration').first().json;
const empty=v=>v==null||v===''||(Array.isArray(v)&&v.length===0)||(typeof v==='string'&&/^\\s*\\[\\s*\\]\\s*$/.test(v));
const seen=new Set(), selected=[];let scanned=0;
for(const row of pages.flatMap(p=>p.list)){
 const id=row.Id;if(id==null||!/^\\d+$/.test(String(id)))continue;
 if(seen.has(String(id)))continue;seen.add(String(id));scanned++;
 if(!empty(row.Cover_Image)||! /^[1-9]\\d{0,11}$/.test(String(row.Discogs_ID??'').trim()))continue;
 selected.push({recordId:id,artist:String(row.Artist??''),album:String(row.Album??''),releaseId:String(row.Discogs_ID).trim()});
}
return selected.slice(0,config.maxRecords).map(item=>({json:{...config,...item,scanned,eligible:selected.length}}));""")
node('One record at a time','splitInBatches',{'batchSize':1,'options':{}},3)
node('Pace Discogs requests','wait',{'amount':2,'unit':'seconds'},1.1,webhookId='vinyl-cover-pacing')
http('Discogs release',{'url':"={{ 'https://api.discogs.com/releases/' + $json.releaseId }}",'sendHeaders':True,'headerParameters':{'parameters':[{'name':'User-Agent','value':'VinylArchiveN8N/1.0 +https://github.com/egunes007/vinyl'},{'name':'Accept','value':'application/json'}]},'options':{'timeout':30000,'redirect':{'redirect':{'followRedirects':False}},'response':{'response':{'fullResponse':True,'neverError':True,'responseFormat':'json'}}}},'Discogs')
code('Choose image',r"""const item=$('One record at a time').item.json;
const response=$json;
if([401,403,429].includes(response.statusCode))throw new Error('Discogs access/rate limit: '+response.statusCode+'. Stop and retry later.');
if(response.statusCode!==200)return [{json:{...item,status:'skipped',reason:'Discogs HTTP '+response.statusCode},pairedItem:{item:0}}];
const images=response.body?.images||[];
const image=images.find(i=>i.type==='primary')||images[0];
const uri=image?.uri;
if(typeof uri!=='string'||/[\s\\]/.test(uri)||!/^https:\/\/(?:i|img)\.discogs\.com\/[^#]+$/i.test(uri))return [{json:{...item,status:'skipped',reason:'No permitted cover image'},pairedItem:{item:0}}];
return [{json:{...item,status:'candidate',coverUrl:uri},pairedItem:{item:0}}];""")
condition('Has image',"={{ $json.status === 'candidate' }}")
condition('Preview only',"={{ $json.dryRun }}")
code('Preview result',"""return [{json:{recordId:$json.recordId,artist:$json.artist,album:$json.album,releaseId:$json.releaseId,status:'preview',message:'Cover found; no NocoDB upload or update performed'}}];""")
http('Upload image to NocoDB',{'method':'POST','url':"={{ $json.baseUrl + '/api/v2/storage/upload-by-url' }}",'sendBody':True,'specifyBody':'json','jsonBody':"={{ [{url:$json.coverUrl,fileName:'discogs-'+$json.releaseId+'.jpg'}] }}",'options':{'timeout':60000,'redirect':{'redirect':{'followRedirects':False}}}})
code('Validate upload',"""const item=$('Choose image').item.json;
const attachments=$input.all().flatMap(i=>Array.isArray(i.json)?i.json:[i.json]);
if(!attachments.length||attachments.some(a=>typeof a!=='object'||!a.title||!(a.path||a.url||a.signedUrl)|| (a.size!=null && (!Number.isFinite(Number(a.size)) || Number(a.size)<=0 || Number(a.size)>8*1024*1024)) || (a.mimetype && !['image/jpeg','image/png','image/webp','image/gif'].includes(a.mimetype))))throw new Error('Unexpected upload response; record unchanged');
return [{json:{...item,attachments},pairedItem:{item:0}}];""")
http('Recheck empty cover',{'url':"={{ $json.baseUrl + '/api/v2/tables/' + $json.tableId + '/records/' + $json.recordId }}",'options':{'timeout':30000,'redirect':{'redirect':{'followRedirects':False}}}})
code('Protect existing cover',"""const item=$('Validate upload').item.json;
const row=$json;
if(String(row.Id)!==String(item.recordId))throw new Error('Recheck returned wrong record');
const v=row.Cover_Image;
const empty=v==null||v===''||(Array.isArray(v)&&v.length===0)||(typeof v==='string'&&/^\\s*\\[\\s*\\]\\s*$/.test(v));
return [{json:{...item,mayUpdate:empty&&String(row.Discogs_ID??'').trim()===item.releaseId,status:empty?'ready':'skipped',reason:empty?'':'Cover was added by another process'},pairedItem:{item:0}}];""")
condition('Still empty',"={{ $json.mayUpdate }}")
http('Attach cover',{'method':'PATCH','url':"={{ $json.baseUrl + '/api/v2/tables/' + $json.tableId + '/records' }}",'sendBody':True,'specifyBody':'json','jsonBody':"={{ [{Id:$json.recordId,Cover_Image:$json.attachments}] }}",'options':{'timeout':30000,'redirect':{'redirect':{'followRedirects':False}}}})
code('Updated result',"""const item=$('Protect existing cover').item.json;
return [{json:{recordId:item.recordId,artist:item.artist,album:item.album,releaseId:item.releaseId,status:'updated'},pairedItem:{item:0}}];""")
node('Completed','noOp',{})
for a,b in [('Manual start','Configuration'),('Configuration','Validate configuration'),('Validate configuration','Read collection'),('Read collection','Select candidates'),('Select candidates','One record at a time'),('Pace Discogs requests','Discogs release'),('Discogs release','Choose image'),('Choose image','Has image'),('Preview result','One record at a time'),('Upload image to NocoDB','Validate upload'),('Validate upload','Recheck empty cover'),('Recheck empty cover','Protect existing cover'),('Protect existing cover','Still empty'),('Attach cover','Updated result'),('Updated result','One record at a time')]:link(a,b)
link('One record at a time','Completed',0);link('One record at a time','Pace Discogs requests',1)
link('Has image','Preview only',0);link('Has image','One record at a time',1)
link('Preview only','Preview result',0);link('Preview only','Upload image to NocoDB',1)
link('Still empty','Attach cover',0);link('Still empty','One record at a time',1)
# Lay out the long workflow in readable rows.
for i,n in enumerate(nodes):n['position']=[(i%6)*260,(i//6)*300]
workflow={'name':'VINYL — Discogs kapaklarını NocoDB’ye aktar v1.0.1','nodes':nodes,'connections':connections,'active':False,'settings':{'executionOrder':'v1','saveDataSuccessExecution':'none','saveDataErrorExecution':'none','saveManualExecutions':False},'pinData':{},'tags':[]}
(root/'vinyl-discogs-covers-1.0.1.json').write_text(json.dumps(workflow,ensure_ascii=False,indent=2)+'\n')
