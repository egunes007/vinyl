import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const workflow=JSON.parse(readFileSync(new URL('../automations/n8n/vinyl-one-cover-every-10-minutes-1.0.0.json',import.meta.url)));
const config={baseUrl:'http://nocodb:8080',tableId:'table'};
function run(name,{json={},inputs=[{json}],refs={},state={}}={}){
 const code=workflow.nodes.find(n=>n.name===name).parameters.jsCode;
 return structuredClone(runInNewContext('(function(){'+code+'})()',{$json:json,$input:{all:()=>inputs,first:()=>inputs[0]},$:key=>({first:()=>({json:refs[key]})}),$getWorkflowStaticData:()=>state,URL:undefined},{timeout:1000}));
}
test('one linear scheduled workflow with no preview/batch loop and ten minute interval',()=>{
 assert.equal(workflow.active,false);
 const timer=workflow.nodes.find(n=>n.type==='n8n-nodes-base.scheduleTrigger');
 assert.deepEqual(timer.parameters.rule.interval,[{field:'minutes',minutesInterval:10}]);
 assert.ok(!workflow.nodes.some(n=>/splitInBatches|\.if$/.test(n.type)));
 for(const connection of Object.values(workflow.connections))assert.equal(connection.main[0].length,1);
 assert.ok(!('dryRun' in run('Configuration')[0].json));
});
test('choose only the first empty cover by ID, ignore existing covers and invalid release IDs',()=>{
 const rows=[{Id:9,Discogs_ID:99,Cover_Image:[]},{Id:2,Discogs_ID:22,Cover_Image:'[]'},{Id:1,Discogs_ID:11,Cover_Image:[{title:'keep'}]},{Id:0,Discogs_ID:'invalid'}];
 const options={inputs:[{json:{list:rows}}],refs:{Configuration:config}};
 const found=run('First missing cover',options);
 assert.equal(found.length,1);assert.equal(found[0].json.recordId,2);
 assert.equal(run('First missing cover',{...options,state:{noImageUntil:{2:Date.now()+100000}}})[0].json.recordId,9);
 assert.deepEqual(run('First missing cover',{...options,state:{noImageUntil:{2:Date.now()+100000,9:Date.now()+100000}}}),[]);
 assert.throws(()=>run('First missing cover',{...options,inputs:[{json:{list:Array(100).fill(rows[0])}}]}),/Incomplete/);
});
test('unavailable artwork is held for 24 hours so the next schedule can make progress',()=>{
 const state={};const refs={'First missing cover':{...config,recordId:2,releaseId:'22'}};
 assert.deepEqual(run('Choose image',{json:{statusCode:404},refs,state}),[]);
 assert.ok(state.noImageUntil['2']>Date.now()+23*60*60*1000);
 const chosen=run('Choose image',{json:{statusCode:200,body:{images:[{type:'primary',uri:'https://i.discogs.com/cover.jpg'}]}},refs});
 assert.equal(chosen.length,1);assert.equal(chosen[0].json.coverUrl,'https://i.discogs.com/cover.jpg');
 assert.throws(()=>run('Choose image',{json:{statusCode:429},refs}),/rate limit/);
});
test('exactly one attachment is accepted and an existing cover or changed release blocks writing',()=>{
 const item={...config,recordId:2,releaseId:'22'};
 const attachment={title:'discogs-22.jpg',path:'download/test.jpg',mimetype:'image/jpeg',size:123};
 const validated=run('Validate upload',{inputs:[{json:attachment}],refs:{'Choose image':item}});
 assert.equal(validated[0].json.attachments.length,1);
 assert.throws(()=>run('Validate upload',{inputs:[{json:attachment},{json:attachment}],refs:{'Choose image':item}}),/Unexpected/);
 const refs={'Validate upload':validated[0].json};
 assert.equal(run('Protect existing cover',{json:{Id:2,Discogs_ID:22,Cover_Image:[]},refs}).length,1);
 assert.deepEqual(run('Protect existing cover',{json:{Id:2,Discogs_ID:22,Cover_Image:[attachment]},refs}),[]);
 assert.deepEqual(run('Protect existing cover',{json:{Id:2,Discogs_ID:33,Cover_Image:[]},refs}),[]);
 const download=workflow.nodes.find(n=>n.name==='Download cover');
 assert.equal(download.parameters.authentication,'none');assert.equal(download.credentials,undefined);
});
