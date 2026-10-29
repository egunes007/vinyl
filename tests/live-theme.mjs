// npm install --prefix /tmp/vinyl-browser --no-audit --no-fund jsdom
import { JSDOM } from '/tmp/vinyl-browser/node_modules/jsdom/lib/api.js';
import { readFileSync } from 'node:fs';
import { runInContext } from 'node:vm';
import assert from 'node:assert/strict';
const html=readFileSync('wordpress/vinyl-archive/template-parts-archive.php','utf8').replace(/<\?php echo esc_url\(home_url\('([^']+)'\)\); \?>/g, 'https://example.test$1').replace(/<\?php[^]*?\?>/g, '');
const app=readFileSync('wordpress/vinyl-archive/assets/app.js','utf8').replace("import { albums as demoAlbums } from './data.js';",'const demoAlbums=[];');
const rows=[{artist:'A & B',album:'<img src=x onerror="alert(1)">',genre:'Rock & Roll',year:'2000',signed:true,featured:true,formatClass:'lp',artistCountry:'Türkiye'},{artist:'A & B',album:'Second',genre:'Rock & Roll',year:'2001',signed:false,formatClass:'single',artistCountry:'Türkiye'}];
function render(albums,error=false,view='collection',dashboard={years:{},undated:0},query=''){
 const dom=new JSDOM(html,{url:'https://example.test/'+query,runScripts:'outside-only'});
 const {document}=dom.window;
 document.body.dataset.archiveView=view;document.body.dataset.collectionUrl='https://example.test/?pagename=koleksiyon';
 const node=document.createElement('script');node.id='vinyl-collection-data';node.type='application/json';node.textContent=JSON.stringify({live:true,albums,error,dashboard});document.head.append(node);
 document.querySelector('#album-dialog').showModal=function(){this.open=true;};
 document.querySelector('#album-dialog').close=function(){this.open=false;};
 runInContext(app,dom.getInternalVMContext());return dom;
}
const dom=render(rows), doc=dom.window.document;
assert.equal(doc.querySelector('#album-count').textContent,'2');
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
const coveredRows=[{...rows[0],discogsId:'123',coverImage:'https://i.discogs.com/cover.jpg'},{...rows[1],discogsId:'456',coverImage:'https://evil.test/untrusted.jpg'}];
const covered=render(coveredRows), cd=covered.window.document;
const image=cd.querySelector('#collection-grid img');
assert.equal(image.getAttribute('src'),'https://i.discogs.com/cover.jpg');
assert.equal(image.getAttribute('loading'),'lazy');
assert.equal(image.getAttribute('referrerpolicy'),'no-referrer');
assert.equal(cd.querySelectorAll('#collection-grid img').length,1);
assert.equal(cd.querySelector('#collection-grid .discogs-credit').href,'https://www.discogs.com/release/123');
assert.equal(cd.querySelectorAll('button a').length,0);
cd.querySelector('#collection-grid .album-card').click();
assert.equal(cd.querySelector('#album-detail img').getAttribute('src'),'https://i.discogs.com/cover.jpg');
image.dispatchEvent(new covered.window.Event('error'));
assert.equal(cd.querySelectorAll('img[data-cover-id="0"]').length,0);
assert.ok(cd.querySelector('#album-detail .public-cover'));
console.log('PASS: Discogs gallery/detail covers, lazy loading, source links, untrusted host rejection, broken-image fallback');
const manualRows=[{...coveredRows[0],manualCoverUrl:'https://example.test/wp-json/vinyl-archive/v1/cover/'+'a'.repeat(64)}];
const manual=render(manualRows), md=manual.window.document;
const manualImage=md.querySelector('#collection-grid img');
assert.equal(manualImage.src,manualRows[0].manualCoverUrl);
assert.equal(md.querySelector('#collection-grid .cover-credit').textContent,'Koleksiyon kapağı');
manualImage.dispatchEvent(new manual.window.Event('error'));
assert.equal(md.querySelector('#collection-grid img').src,'https://i.discogs.com/cover.jpg');
md.querySelector('#collection-grid img').dispatchEvent(new manual.window.Event('error'));
assert.equal(md.querySelector('#collection-grid img'),null);
const unsafeManual=render([{...rows[0],manualCoverUrl:'https://evil.test/track.jpg'}]);
assert.equal(unsafeManual.window.document.querySelector('#collection-grid img'),null);
console.log('PASS: NocoDB cover priority, manual-to-Discogs-to-placeholder fallback, cross-origin manual image rejection');
const dashboardHome=render(rows,false,'home'), hd=dashboardHome.window.document;
assert.equal(hd.querySelectorAll('.stats .stat-card').length,12);
assert.equal(hd.querySelector('#collection').hidden,true);
assert.equal(hd.querySelector('#collection-grid').children.length,0);
assert.equal(hd.querySelector('#dashboard-reports').hidden,false);
assert.equal(hd.querySelector('#single-feature').hidden,false);
assert.equal(hd.querySelector('#featured-grid').querySelectorAll('[data-album]').length,1);
assert.equal(hd.querySelector('#single-feature-grid').querySelectorAll('[data-album]').length,1);
assert.equal(hd.querySelectorAll('#purchase-months tr').length,13);
assert.ok(hd.querySelectorAll('.stats a')[8].href.endsWith('/?pagename=imzali-plaklar'));
assert.ok(hd.querySelector('#featured .text-link').href.includes('format=lp'));
assert.ok(hd.querySelector('#single-feature .text-link').href.includes('format=single'));
const many=Array.from({length:16},(_,i)=>({...rows[0],artist:i<8?'Z':'A',album:'Album '+i,formatClass:i<12?'lp':'single'}));
const sampleHome=render(many,false,'home').window.document;
for(const id of ['featured-grid','signed-feature-grid']) {
 const ids=[...sampleHome.querySelectorAll('#'+id+' [data-album]')].map(n=>n.dataset.album);
 assert.equal(ids.length,5);assert.equal(new Set(ids).size,5);
}
assert.match(sampleHome.querySelector('.top-artists ol li').textContent,/Z8/);
const tieHome=render([{...rows[0],artist:'Z'},{...rows[0],artist:'A'}],false,'home').window.document;
assert.match(tieHome.querySelector('.top-artists ol li').textContent,/A1/);
console.log('PASS: twelve metrics, home visibility, full-list links, five unique samples, format isolation, top artists and alphabetical ties');

const purchases=render(rows,false,'home',{years:{2023:{12:{lp:1,total:1}},2024:{1:{double:2,total:3},2:{single:1,total:1}}},undated:2}).window;
const chooseYear=purchases.document.querySelector('#purchase-year');
chooseYear.value='2024';chooseYear.dispatchEvent(new purchases.Event('change'));
const purchaseRows=purchases.document.querySelectorAll('#purchase-months tr');
assert.equal(purchaseRows[0].lastElementChild.textContent,'1');
assert.equal(purchaseRows[1].lastElementChild.textContent,'3');
assert.equal(purchaseRows[2].children[3].textContent,'1');
chooseYear.value='2025';chooseYear.dispatchEvent(new purchases.Event('change'));
assert.equal(purchases.document.querySelector('#purchase-months tr').lastElementChild.textContent,'5');
const filtered=render(rows,false,'collection',undefined,'?format=single').window;
assert.equal(filtered.document.querySelectorAll('#collection-grid [data-album]').length,1);
assert.match(filtered.document.querySelector('#collection-grid').textContent,/Second/);
const filteredSearch=filtered.document.querySelector('#search');filteredSearch.value='missing';filteredSearch.dispatchEvent(new filtered.Event('input'));
assert.equal(filtered.document.querySelectorAll('#collection-grid [data-album]').length,0);
filtered.document.querySelector('#clear').click();
assert.equal(filtered.document.querySelectorAll('#collection-grid [data-album]').length,2);
console.log('PASS: year selection, cumulative past, monthly columns and full-list format filtering with reset');
const categories=['lp','double','boxset','ten','single','shellac','flexi'];
const categoryRows=categories.map((formatClass,i)=>({...rows[0],artist:'Artist '+i,album:'Record '+i,formatClass,artistCountry:i%2?'Türkiye':'Fransa',genre:i%2?'Rock':'Jazz'}));
const metricDoc=render(categoryRows,false,'home').window.document;
assert.deepEqual([...metricDoc.querySelectorAll('.stats strong')].map(n=>Number(n.textContent)),[7,1,1,1,1,1,1,1,7,2,7,2]);
const topDoc=render(Array.from({length:15},(_,i)=>({...rows[0],artist:'Artist '+i})),false,'home').window.document;
assert.equal(topDoc.querySelectorAll('.top-artists ol:first-of-type')[0].children.length,10);
const emptyHome=render([],true,'home').window.document;
assert.ok(emptyHome.querySelector('.demo').textContent.includes('yüklenemiyor'));
assert.equal(emptyHome.querySelectorAll('#featured-grid [data-album]').length,0);
console.log('PASS: exact format metric counts, distinct artist countries and genres, Top 10 limit, connection-error state');

const sortableRows=[
 {...rows[0],artist:'Z',album:'Old',purchaseOrder:0},
 {...rows[0],artist:'B',album:'New B',purchaseOrder:1,formatClass:'double'},
 {...rows[0],artist:'A',album:'New A',purchaseOrder:1},
 {...rows[0],artist:'C',album:'Unknown',purchaseOrder:null},
];
const collectionWindow=render(sortableRows,false,'collection').window, collectionDoc=collectionWindow.document;
const order=()=>[...collectionDoc.querySelectorAll('#collection-grid .album-card h3')].map(n=>n.textContent);
assert.deepEqual(order(),['New A','New B','Unknown','Old']);
const sortControl=collectionDoc.querySelector('#collection-sort');
function sortBy(value){sortControl.value=value;sortControl.dispatchEvent(new collectionWindow.Event('change'));}
sortBy('artist-desc');assert.deepEqual(order(),['Old','Unknown','New B','New A']);
sortBy('purchase-desc');assert.deepEqual(order(),['New A','New B','Old','Unknown']);
sortBy('purchase-asc');assert.deepEqual(order(),['Old','New A','New B','Unknown']);
const formatControl=collectionDoc.querySelector('#format-filter');formatControl.value='double';formatControl.dispatchEvent(new collectionWindow.Event('change'));
assert.deepEqual(order(),['New B']);
formatControl.value='shellac';formatControl.dispatchEvent(new collectionWindow.Event('change'));assert.deepEqual(order(),[]);
collectionDoc.querySelector('#clear').click();assert.equal(order().length,4);
const dashboardLinks=[...hd.querySelectorAll('.stats a')];
assert.equal(dashboardLinks.length,9);
assert.equal(new URL(dashboardLinks[0].href).search,'?pagename=koleksiyon');
assert.ok(dashboardLinks.slice(0,8).every(a=>new URL(a.href).searchParams.get('pagename')==='koleksiyon'));
assert.equal(new URL(hd.querySelector('#featured .text-link').href).searchParams.get('pagename'),'koleksiyon');
assert.deepEqual(dashboardLinks.slice(1,8).map(a=>new URL(a.href).searchParams.get('format')),['lp','double','boxset','ten','single','shellac','flexi']);
console.log('PASS: collection alphabetical/month rank sorting, same-month ties, missing dates last, format controls/reset, all dashboard format links');

const queryNav=render(rows,false,'signed',undefined,'?pagename=imzali-plaklar').window.document;
assert.equal(queryNav.querySelectorAll('nav a[aria-current="page"]').length,1);
assert.equal(new URL(queryNav.querySelector('nav a[aria-current="page"]').href).searchParams.get('pagename'),'imzali-plaklar');
console.log('PASS: query-based navigation keeps page and format parameters and highlights only the active page');
