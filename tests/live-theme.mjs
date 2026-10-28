// npm install --prefix /tmp/vinyl-browser --no-audit --no-fund jsdom
import { JSDOM } from '/tmp/vinyl-browser/node_modules/jsdom/lib/api.js';
import { readFileSync } from 'node:fs';
import { runInContext } from 'node:vm';
import assert from 'node:assert/strict';
const html=readFileSync('index.html','utf8').replace('<script type="module" src="/src/app.js"></script>','');
const app=readFileSync('wordpress/vinyl-archive/assets/app.js','utf8').replace("import { albums as demoAlbums } from './data.js';",'const demoAlbums=[];');
const rows=[{artist:'A & B',album:'<img src=x onerror="alert(1)">',genre:'Rock & Roll',year:'2000',signed:true,featured:true},{artist:'A & B',album:'Second',genre:'Rock & Roll',year:'2001',signed:false}];
function render(albums,error=false,view='home'){
 const dom=new JSDOM(html,{url:'https://example.test/',runScripts:'outside-only'});
 const {document}=dom.window;
 document.body.dataset.archiveView=view;document.body.dataset.collectionUrl='https://example.test/koleksiyon/';
 const node=document.createElement('script');node.id='vinyl-collection-data';node.type='application/json';node.textContent=JSON.stringify({live:true,albums,error});document.head.append(node);
 document.querySelector('#album-dialog').showModal=function(){this.open=true;};
 document.querySelector('#album-dialog').close=function(){this.open=false;};
 runInContext(app,dom.getInternalVMContext());return dom;
}
const dom=render(rows), doc=dom.window.document;
assert.equal(doc.querySelector('#album-count').textContent,'02');
assert.equal(doc.querySelectorAll('#artist-grid .artist').length,1);
assert.equal(doc.querySelector('#artist-grid .artist').textContent,'A & B2 plak ↗');
assert.equal(doc.querySelectorAll('#collection-grid img').length,0);
assert.ok(doc.querySelector('#collection-grid').textContent.includes('<img src=x onerror="alert(1)">'));
const select=doc.querySelector('#genre-filter');select.value='Rock & Roll';select.dispatchEvent(new dom.window.Event('change'));
assert.equal(doc.querySelectorAll('#collection-grid .album-card').length,2);
const search=doc.querySelector('#search');search.value='A & B';search.dispatchEvent(new dom.window.Event('input'));
assert.equal(doc.querySelectorAll('#collection-grid .album-card').length,2);
doc.querySelector('#collection-grid .album-card').click();
assert.equal(doc.querySelector('#album-dialog').open,true);
assert.equal(doc.querySelector('#album-detail h2').textContent,rows[0].album);
assert.equal(doc.querySelectorAll('#album-detail img').length,0);
assert.equal(doc.querySelectorAll('#signed-grid .album-card').length,1);
const signedSearch=doc.querySelector('#signed-search');signedSearch.value='A & B';signedSearch.dispatchEvent(new dom.window.Event('input'));
assert.equal(doc.querySelectorAll('#signed-grid .album-card').length,1);
const signed=render(rows,false,'signed');assert.equal(signed.window.document.querySelector('#signed').hidden,false);assert.equal(signed.window.document.querySelector('#home').hidden,true);
const empty=render([],true);assert.match(empty.window.document.querySelector('#collection-grid').textContent,/kullanılamıyor/);
assert.equal(empty.window.document.querySelectorAll('.album-card').length,0);
console.log('PASS: live cards, XSS text escaping, ampersand search/genre, artist counts, modal, signed page, failure without demo fallback');
