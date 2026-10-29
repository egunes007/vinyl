import test from 'node:test';
import {runInNewContext} from 'node:vm';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../automations/n8n/',import.meta.url);
const workflow=JSON.parse(readFileSync(new URL('vinyl-discogs-covers-1.0.2.json',root)));
function run(name,json={},inputs=[{json}],refs={}) {
 const node=workflow.nodes.find(n=>n.name===name);
 const $=key=>({first:()=>({json:refs[key]}),item:{json:refs[key]}});
 return structuredClone(runInNewContext('(function(){'+node.parameters.jsCode+'})()',{$json:json,$input:{all:()=>inputs},$,URL:undefined},{timeout:1000}));
}
const config={baseUrl:'http://nocodb:8080',tableId:'table123',dryRun:true,maxRecords:5};
const candidate={...config,recordId:1,releaseId:'123',artist:'A',album:'B'};
test('workflow is inactive, preview by default, credential values absent, links valid',()=>{
 assert.equal(workflow.active,false);
 assert.equal(run('Configuration')[0].json.dryRun,true);
 assert.equal(workflow.settings.saveDataSuccessExecution,'none');
 const names=new Set(workflow.nodes.map(n=>n.name));
 for(const [source,outputs] of Object.entries(workflow.connections)){
  assert.ok(names.has(source));for(const branch of outputs.main)for(const target of branch)assert.ok(names.has(target.node));
 }
 const http=workflow.nodes.filter(n=>n.type==='n8n-nodes-base.httpRequest');
 assert.ok(http.every(n=>n.parameters.authentication==='genericCredentialType'));
 assert.equal(http.find(n=>n.name==='Discogs release').credentials.httpHeaderAuth.name,'Discogs');
 assert.ok(http.filter(n=>n.name!=='Discogs release').every(n=>n.credentials.httpHeaderAuth.name==='NocoDB'));
 assert.equal(workflow.connections['Preview only'].main[0][0].node,'Preview result');
 assert.equal(workflow.connections['Preview result'].main[0][0].node,'One record at a time');
});
test('only empty covers and valid IDs, deduplication, pagination and batch limit',()=>{
 const rows=[{Id:1,Discogs_ID:123,Cover_Image:[]},{Id:1,Discogs_ID:123},{Id:2,Discogs_ID:'456',Cover_Image:'[]'},
 {Id:3,Discogs_ID:123,Cover_Image:[{url:'/download/keep.jpg'}]},{Id:4,Discogs_ID:'bad'},
 {Id:5,Discogs_ID:789,Cover_Image:'broken existing metadata'},{Id:6,Discogs_ID:321,Cover_Image:{url:'keep'}}];
 const result=run('Select candidates',{},[{json:{list:rows}}],{'Validate configuration':config});
 assert.deepEqual(result.map(i=>i.json.recordId),[1,2]);
 assert.equal(run('Select candidates',{},[{json:{list:rows}}],{'Validate configuration':{...config,maxRecords:1}}).length,1);
 assert.throws(()=>run('Select candidates',{},[{json:{list:Array(100).fill(rows[0])}}],{'Validate configuration':config}),/Pagination limit/);
 assert.throws(()=>run('Select candidates',{},[{json:{error:'Unauthorized'}}],{'Validate configuration':config}),/Invalid/);
});
test('Discogs image allowlist, primary image, rate limits and missing releases',()=>{
 const refs={'One record at a time':candidate};
 assert.equal(run('Choose image',{statusCode:200,body:{images:[{type:'secondary',uri:'https://i.discogs.com/second.jpg'},{type:'primary',uri:'https://i.discogs.com/first.jpg'}]}},undefined,refs)[0].json.coverUrl,'https://i.discogs.com/first.jpg');
 for(const uri of ['http://i.discogs.com/a','https://evil.test/a','https://i.discogs.com.evil.test/a','https://user:pass@i.discogs.com/a'])assert.equal(run('Choose image',{statusCode:200,body:{images:[{uri}]}},undefined,refs)[0].json.status,'skipped');
 assert.equal(run('Choose image',{statusCode:404},undefined,refs)[0].json.status,'skipped');
 for(const statusCode of [401,403,429])assert.throws(()=>run('Choose image',{statusCode},undefined,refs),/Stop/);
});
test('recheck protects covers and changed releases, update scope remains one attachment field',()=>{
 const refs={'Validate upload':candidate};
 assert.equal(run('Protect existing cover',{Id:1,Discogs_ID:123,Cover_Image:[]},undefined,refs)[0].json.mayUpdate,true);
 assert.equal(run('Protect existing cover',{Id:1,Discogs_ID:123,Cover_Image:[{url:'keep'}]},undefined,refs)[0].json.mayUpdate,false);
 assert.equal(run('Protect existing cover',{Id:1,Discogs_ID:456,Cover_Image:[]},undefined,refs)[0].json.mayUpdate,false);
 assert.throws(()=>run('Protect existing cover',{Id:2},undefined,refs),/wrong record/);
 const patch=workflow.nodes.find(n=>n.name==='Attach cover').parameters;
 assert.equal(patch.method,'PATCH');
 assert.match(patch.jsonBody,/\[\{Id:\$json.recordId,Cover_Image:\$json.attachments\}\]/);
 assert.throws(()=>run('Validate upload',{},[{json:{error:'failed'}}],{'Choose image':candidate}),/Unexpected upload/);
});

test('Code nodes validate URLs without the URL global available in n8n',()=>{
 assert.equal(run('Validate configuration',config)[0].json.baseUrl,config.baseUrl);
 assert.equal(run('Validate configuration',{...config,baseUrl:'http://192.168.1.13:8080/'})[0].json.baseUrl,'http://192.168.1.13:8080');
 for(const baseUrl of ['http://user:secret@host','https://host/path','https://host?token=x','https://host#x','http://host:70000','http://host:0','http://host\\evil','http://host\n','http://bad..host','file:///tmp'])assert.throws(()=>run('Validate configuration',{...config,baseUrl}),/origin/);
 const refs={'One record at a time':candidate};
 for(const uri of ['https://i.discogs.com:443/a','https://i.discogs.com/a#fragment','https://i.discogs.com/a\n','https://i.discogs.com\\evil/a'])assert.equal(run('Choose image',{statusCode:200,body:{images:[{uri}]}},undefined,refs)[0].json.status,'skipped');
});

test('pagination sends offset as n8n qs parameters and stops on the last NocoDB page',()=>{
 const read=workflow.nodes.find(n=>n.name==='Read collection').parameters;
 const pagination=read.options.pagination.pagination;
 assert.equal(pagination.paginationMode,'updateAParameterInEachRequest');
 const [parameter]=pagination.parameters.parameters;
 assert.equal(parameter.type,'qs');assert.equal(parameter.name,'offset');
 const evaluate=(expression,context)=>runInNewContext(expression.replace(/^=\{\{/, '').replace(/\}\}$/, ''),context);
 assert.deepEqual([0,1,2,3].map($pageCount=>evaluate(parameter.value,{$pageCount})),[0,100,200,300]);
 assert.equal(evaluate(pagination.completeExpression,{$response:{body:{list:Array(100),pageInfo:{isLastPage:false}}}}),false);
 assert.equal(evaluate(pagination.completeExpression,{$response:{body:{list:Array(16)}}}),true);
 assert.equal(evaluate(pagination.completeExpression,{$response:{body:{list:Array(100),pageInfo:{isLastPage:true}}}}),true);
});
