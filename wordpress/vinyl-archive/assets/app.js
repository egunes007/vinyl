import { albums as demoAlbums } from './data.js';
const payloadNode = document.getElementById('vinyl-collection-data');
const payload = payloadNode ? JSON.parse(payloadNode.textContent) : null;
const live = payload?.live === true;
// Inlined by build-wordpress.mjs; API text is escaped before rendering.
function safeDiscogsImage(value) {
 try {
  const url = new URL(value);
  return url.protocol === 'https:' && ['i.discogs.com','img.discogs.com'].includes(url.hostname) && !url.username && !url.password && !url.port ? escapeHTML(url.href) : '';
 } catch { return ''; }
}
function safeManualImage(value) {
 try {
  const url = new URL(value);
  return url.origin === location.origin && ['http:','https:'].includes(url.protocol) && !url.username && !url.password ? escapeHTML(url.href) : '';
 } catch { return ''; }
}
function discogsCover(a) {
 const image = a.manualCoverUrl || a.coverImage;
 return image ? `<div class="cover photo-cover"><img src="${image}" data-cover-id="${a.id}" alt="${a.artist} — ${a.album} albüm kapağı" loading="lazy" decoding="async" referrerpolicy="no-referrer"><span class="cover-credit">${a.manualCoverUrl ? 'Koleksiyon kapağı' : 'Görsel: Discogs'}</span></div>` : '';
}

const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const albums = (live ? payload.albums : demoAlbums).map((row, index) => {
 const a = Object.fromEntries(Object.entries(row).map(([k,v]) => [k, typeof v === 'string' ? escapeHTML(v) : v]));
 return {...a, id:index, manualCoverUrl:live?safeManualImage(row.manualCoverUrl):'', coverImage:live?safeDiscogsImage(row.coverImage):'', discogsUrl:live && /^[1-9][0-9]{0,11}$/.test(String(row.discogsId))?'https://www.discogs.com/release/'+row.discogsId:'', cover:live?'public-cover':a.cover, color:live?'#292523':a.color, mark:live?'◉':a.mark, genre:a.genre || 'Diğer'};
});
const filterAlbums = (query='', genre='') => {
 const term=escapeHTML(query.trim().toLocaleLowerCase('tr-TR'));
 return albums.filter(a=>(!genre || a.genre===escapeHTML(genre)) && (a.artist+' '+a.album).toLocaleLowerCase('tr-TR').includes(term));
};
const $ = s => document.querySelector(s);
const cover = a => discogsCover(a) || `<div class="cover ${a.cover}" style="--cover:${a.color}"><span class="cover-artist">${a.artist}</span><strong class="cover-art">${a.mark}</strong><span class="cover-title">${a.album}</span><span class="cover-disclaimer">${live ? 'KAPAK GÖRSELİ YOK' : 'ÖZGÜN ÖRNEK KAPAK'}</span></div>`;
const card = a => `<article class="album-entry"><button class="album-card" data-album="${a.id}" aria-label="${a.artist} — ${a.album}, detayları aç"><div class="cover-wrap">${cover(a)}${a.signed?'<span class="signed-badge">✎ İmzalı' + (live ? '' : ' · Örnek') + '</span>':''}</div><div class="card-info"><span class="card-genre">${a.genre} <span>↗</span></span><h3>${a.album}</h3><p>${a.artist} <span>· ${a.year}</span></p></div></button>${a.discogsUrl ? '<a class="discogs-credit" href="'+a.discogsUrl+'" target="_blank" rel="noopener noreferrer">Discogs ↗</a>' : ''}</article>`;
const genres = [...new Set(albums.map(a=>a.genre))];
$('#album-count').textContent=albums.length.toString().padStart(2,'0');
$('#artist-count').textContent=new Set(albums.map(a=>a.artist)).size.toString().padStart(2,'0');
$('#genre-count').textContent=genres.length.toString().padStart(2,'0');
$('#featured-grid').innerHTML=(live ? albums.filter(a=>a.featured).concat(albums.filter(a=>!a.featured)).slice(0,4) : albums.slice(0,4)).map(card).join('');
$('#genre-filter').innerHTML+=genres.map(g=>`<option>${g}</option>`).join('');
function render(){const result=filterAlbums($('#search').value,$('#genre-filter').value);$('#collection-grid').innerHTML=result.length?result.map(card).join(''):'<p class="empty">Bu aramaya uygun plak bulunamadı. Filtreleri temizleyip tekrar deneyin.</p>';$('#result-count').textContent=`${result.length}${live ? '' : ' örnek'} plak gösteriliyor`;}
render();
$('#search').addEventListener('input',render);$('#genre-filter').addEventListener('change',render);
$('#clear').onclick=()=>{$('#search').value='';$('#genre-filter').value='';render();};
$('#genre-grid').innerHTML=genres.map((g,i)=>`<button class="genre-tile" data-genre="${g}"><span class="genre-number">0${i+1} /</span><strong>${g}</strong><span>${albums.filter(a=>a.genre===g).length}${live ? '' : ' örnek'} plak <b>↗</b></span></button>`).join('');
$('#artist-grid').innerHTML=[...new Map(albums.map(a=>[a.artist,a])).values()].sort((a,b)=>a.artist.localeCompare(b.artist,'tr')).map(a=>`<button class="artist" data-artist="${a.artist}"><span>${a.artist}</span><span>${albums.filter(record=>record.artist===a.artist).length} plak ↗</span></button>`).join('');
document.addEventListener('click',e=>{
 const tile=e.target.closest('[data-genre], [data-artist]');if(tile){$('#search').value=tile.dataset.artist||'';$('#genre-filter').value=tile.dataset.genre||'';render();const target=new URL(document.body.dataset.collectionUrl);if(tile.dataset.artist)target.searchParams.set('artist',tile.dataset.artist);if(tile.dataset.genre)target.searchParams.set('genre',tile.dataset.genre);location.href=target.href;}
 const c=e.target.closest('[data-album]');if(!c)return;const a=albums.find(a=>a.id===Number(c.dataset.album));
 $('#album-detail').innerHTML=`${cover(a)}<div class="detail-copy"><p class="eyebrow">${live ? 'KOLEKSİYONDAN' : 'ÖRNEK ALBÜM · TASARIM PROTOTİPİ'}</p><h2>${a.album}</h2><p class="detail-artist">${a.artist}</p><dl>${[['İmza durumu',a.signed?(live?'İmzalı':'İmzalı (örnek)'):'Belirtilmedi'],['İlk yayın yılı',a.year],['Baskı yılı',live?(a.pressingYear || 'Belirtilmedi'):'Örnek veride belirtilmedi'],['Baskı ülkesi',(a.country || 'Belirtilmedi')+(live?'':' (örnek)')],['Plak şirketi',a.label],['Format',live?(a.format || 'Belirtilmedi'):'LP · 12 inç (örnek)'],['Tür',a.genre],['Stil',a.style]].map(([k,v])=>`<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl><p class="muted">${live ? 'Koleksiyon kaydı NocoDB üzerinden alınmıştır. Kapaklar koleksiyondan veya Discogs üzerinden alınır; kapak bulunamadığında yer tutucu gösterilir.' : 'Bu kayıt gerçek koleksiyona bağlı değildir. Kapak, albümün resmî görseli yerine kullanılan özgün bir tasarım yer tutucusudur.'}</p>${a.discogsUrl ? '<a class="discogs-credit" href="'+a.discogsUrl+'" target="_blank" rel="noopener noreferrer">Discogs albüm kaydı ↗</a>' : ''}</div>`;
 $('#album-dialog').showModal();
});
$('.close').onclick=()=>$('#album-dialog').close();$('#album-dialog').addEventListener('click',e=>{if(e.target===$('#album-dialog'))$('#album-dialog').close();});
$('.menu').onclick=()=>{const expanded=$('.menu').getAttribute('aria-expanded')!=='true';$('.menu').setAttribute('aria-expanded',expanded);$('nav').classList.toggle('open',expanded);};
$('nav').addEventListener('click',e=>{if(e.target.closest('a')){$('nav').classList.remove('open');$('.menu').setAttribute('aria-expanded','false');}});

// Yalnızca halka açık imza bayrağı kullanılır; özel Notes metni alınmaz.
const signedAlbums = albums.filter(a => a.signed === true);
$('#signed-feature-grid').innerHTML = signedAlbums.slice(0, 4).map(card).join('');
function renderSigned() {
 const term = escapeHTML($('#signed-search').value.trim().toLocaleLowerCase('tr-TR'));
 const matches = signedAlbums.filter(a => `${a.artist} ${a.album}`.toLocaleLowerCase('tr-TR').includes(term));
 $('#signed-grid').innerHTML = matches.length ? matches.map(card).join('') : '<p class="empty">Bu aramaya uygun imzalı plak bulunamadı.</p>';
 $('#signed-count').textContent = `${matches.length}${live ? '' : ' örnek'} imzalı plak gösteriliyor`;
}
$('#signed-search').addEventListener('input', renderSigned);
renderSigned();

const view = document.body.dataset.archiveView || 'home';
const views = { collection: 'collection', signed: 'signed', artists: 'artists', genres: 'genres', about: 'about' };
if (views[view]) {
 document.querySelectorAll('main > section').forEach(section => { section.hidden = section.id !== views[view]; });
 if (view === 'collection') document.querySelector('#collection h2').innerHTML = 'Koleksiyonum<span>.</span>';
} else { $('#signed').hidden = true; }
const params = new URLSearchParams(location.search);
$('#search').value = params.get('artist') || '';
const requestedGenre = params.get('genre');
if (requestedGenre && genres.includes(escapeHTML(requestedGenre))) $('#genre-filter').value = requestedGenre;
render();
document.querySelectorAll('nav a').forEach(a => {const url=new URL(a.href);if(url.pathname===location.pathname && url.searchParams.get('pagename')===params.get('pagename'))a.setAttribute('aria-current','page');});
document.addEventListener('error', event => {
 const image = event.target;
 if (!(image instanceof HTMLImageElement) || !image.hasAttribute('data-cover-id')) return;
 const album = albums.find(a=>a.id === Number(image.dataset.coverId));
 if (!album) return;
 if (album.manualCoverUrl) album.manualCoverUrl=''; else album.coverImage='';
 // Update every visible instance (featured, collection and modal) without retry loops.
 document.querySelectorAll('img[data-cover-id="'+album.id+'"]').forEach(img=>{const wrapper=img.closest('.photo-cover');if(wrapper)wrapper.outerHTML=cover(album);});
}, true);

if(live) {
 $('.demo').textContent = payload.error ? 'Koleksiyon şu anda yüklenemiyor. Lütfen daha sonra tekrar deneyin.' : 'KİŞİSEL PLAK KOLEKSİYONU · VINYL ARCHIVE';
 const labels = ['#signed-feature > p.muted', '#signed > p.muted', '#collection .section-heading > .muted'];
 labels.forEach(selector => document.querySelectorAll(selector).forEach(node=>node.hidden=true));
 document.querySelectorAll('#signed-feature > p.muted').forEach(node=>node.hidden=true);
 document.querySelector('.stats div:first-child span').textContent='PLAK';
 document.querySelector('footer small').textContent='Kişisel plak koleksiyonu · VINYL ARCHIVE';
 if (!albums.length) {
  const message=payload.error?'Koleksiyon bağlantısı şu anda kullanılamıyor.':'Henüz halka açık plak bulunmuyor.';
  $('#collection-grid').textContent=message;
  $('#signed-grid').textContent=message;
 }
}

// All values inserted as HTML are already escaped by the public payload adapter.
const formatClass = a => a.formatClass || (!live ? 'lp' : /^LP$/i.test(a.format || '') ? 'lp' : 'other');
const countDistinct = values => new Set(values.filter(Boolean)).size;
const statsNode = document.querySelector('.stats');
const metrics = [
 ['Toplam plak', albums.length], ['Yalnızca tekli LP', albums.filter(a=>formatClass(a)==='lp').length],
 ['İkili LP', albums.filter(a=>formatClass(a)==='double').length], ['Boxset', albums.filter(a=>formatClass(a)==='boxset').length],
 ['10″', albums.filter(a=>formatClass(a)==='ten').length], ['Single', albums.filter(a=>formatClass(a)==='single').length],
 ['Taş plak', albums.filter(a=>formatClass(a)==='shellac').length], ['Flexi', albums.filter(a=>formatClass(a)==='flexi').length],
 ['Sanatçı', countDistinct(albums.map(a=>a.artist))], ['Sanatçı ülkesi', countDistinct(albums.flatMap(a=>(a.artistCountry || '').split(',').map(s=>s.trim())))],
 ['İmzalı plak', signedAlbums.length], ['Müzik türü', countDistinct((live ? payload.albums : albums).flatMap(a=>(a.genre || '').split(',').map(s=>s.trim())))]
];
// Derive from the existing link so WordPress installations in subdirectories work too.
const signedLink = document.querySelector('#signed-feature .text-link').href;
statsNode.setAttribute('aria-label','Koleksiyon istatistikleri');
const collectionURL = new URL(document.body.dataset.collectionUrl || '/koleksiyon/', location.origin);
function listURL(format) {const url=new URL(collectionURL);if(format)url.searchParams.set('format',format);return url.href;}
const formatOptions = [['','Tüm formatlar'],['lp','LP'],['double','İkili LP — LP (2)'],['boxset','Boxset'],['ten','10″'],['single','Single'],['shellac','Taş plak — 78'],['flexi','Flexi — Flaxy'],['other','Diğer']];
const metricFormats=['','lp','double','boxset','ten','single','shellac','flexi'];
statsNode.innerHTML=metrics.map(([label,n],i)=>{
 const id=({0:'album-count',8:'artist-count',11:'genre-count'})[i];
 const content=`<strong${id ? ' id="'+id+'"' : ''}>${n}</strong><span>${label}</span>`;
 const href=i<8?listURL(metricFormats[i]):i===10?signedLink:null;
 return href?`<a class="stat-card" href="${href}">${content}</a>`:`<div class="stat-card">${content}</div>`;
}).join('');
function sample(records) {
 const result=[...records];
 for(let i=result.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}
 return result.slice(0,5);
}
function selection(selector, records){document.querySelector(selector).innerHTML=records.length?sample(records).map(card).join(''):'<p class="empty">Bu bölümde henüz plak yok.</p>';}
const featured=document.querySelector('#featured');
featured.querySelector('h2').innerHTML='Öne Çıkan LP’ler<span>.</span>';
featured.querySelector('.text-link').href=listURL('lp');
featured.querySelector('.text-link').textContent='Tüm LP’ler ↗';
const singles=document.createElement('section');singles.id='single-feature';singles.className='section';
singles.innerHTML=`<div class="section-heading"><h2>Öne Çıkan Single’lar<span>.</span></h2><a class="text-link" href="${listURL('single')}">Tüm Single’lar ↗</a></div><div id="single-feature-grid" class="album-grid"></div>`;
featured.after(singles);
selection('#featured-grid',albums.filter(a=>formatClass(a)==='lp'));
selection('#single-feature-grid',albums.filter(a=>formatClass(a)==='single'));
selection('#signed-feature-grid',signedAlbums);
const reports=document.createElement('section');reports.id='dashboard-reports';reports.className='section';
function ranking(classes){
 const counts=new Map();albums.filter(a=>classes.includes(formatClass(a)) && a.artist).forEach(a=>counts.set(a.artist,(counts.get(a.artist)||0)+1));
 return [...counts].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0],'tr')).slice(0,10).map(([artist,n])=>`<li><span>${artist}</span><strong>${n}</strong></li>`).join('') || '<li>Henüz kayıt yok.</li>';
}
reports.innerHTML=`<div class="top-artists"><div><h2>Top 10 Sanatçı</h2><h3>LP / İkili LP / Boxset</h3><ol>${ranking(['lp','double','boxset'])}</ol></div><div><h2>Top 10 Sanatçı</h2><h3>Single</h3><ol>${ranking(['single'])}</ol></div></div><div class="purchase-report"><div class="section-heading"><h2>Aylık Alımlar</h2><label>Yıl <select id="purchase-year" aria-label="Alım yılı"></select></label></div><div class="table-scroll"><table><thead><tr><th scope="col">Ay</th><th scope="col">LP</th><th scope="col">İkili LP</th><th scope="col">Single</th><th scope="col">Boxset</th><th scope="col">Toplam</th></tr></thead><tbody id="purchase-months"></tbody></table></div><p id="purchase-note" class="muted"></p></div>`;
featured.before(reports);
const purchase=payload?.dashboard || {years:{},undated:0};
const currentYear=new Date().getFullYear();
const recordedYears=Object.keys(purchase.years).map(Number);
const firstYear=Math.min(currentYear,...recordedYears), lastYear=Math.max(currentYear,...recordedYears);
const years=Array.from({length:lastYear-firstYear+1},(_,i)=>lastYear-i);
const yearSelect=document.querySelector('#purchase-year');yearSelect.innerHTML=years.map(y=>`<option>${y}</option>`).join('');
const months=['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
function renderPurchases(){
 const year=Number(yearSelect.value);const columns=['lp','double','single','boxset','total'];
 const previous=Object.entries(purchase.years).filter(([y])=>Number(y)<year).flatMap(([,ms])=>Object.values(ms));
 const past=Object.fromEntries(columns.map(k=>[k,previous.reduce((sum,m)=>sum+(m[k]||0),0)]));
 const row=(label,values)=>`<tr><th scope="row">${label}</th>${columns.map(k=>`<td>${values[k]||0}</td>`).join('')}</tr>`;
 document.querySelector('#purchase-months').innerHTML=row('Geçmiş',past)+months.map((name,i)=>row(name,purchase.years[year]?.[i+1]||{})).join('');
 document.querySelector('#purchase-note').textContent=live ? `${purchase.undated || 0} kaydın alım tarihi eksik veya geçersiz; tabloya dahil edilmedi. Toplam sütunu diğer formatları da kapsar.` : 'Örnek modunda alım tarihi verisi bulunmuyor.';
}
yearSelect.addEventListener('change',renderPurchases);renderPurchases();
if(view==='collection'){
 const filters=document.querySelector('#collection .filters');
 const formatSelect=document.createElement('select');formatSelect.id='format-filter';formatSelect.setAttribute('aria-label','Plak formatı');
 formatSelect.innerHTML=formatOptions.map(([value,label])=>`<option value="${value}">${label}</option>`).join('');
 const sortSelect=document.createElement('select');sortSelect.id='collection-sort';sortSelect.setAttribute('aria-label','Koleksiyon sıralaması');
 const sorts=[['artist-asc','Sanatçı: A–Z'],['artist-desc','Sanatçı: Z–A'],['purchase-desc','Alım sırası: Yeniden eskiye'],['purchase-asc','Alım sırası: Eskiden yeniye']];
 sortSelect.innerHTML=sorts.map(([value,label])=>`<option value="${value}">${label}</option>`).join('');
 filters.insertBefore(formatSelect,$('#clear'));filters.insertBefore(sortSelect,$('#clear'));
 if(formatOptions.some(([key])=>key===params.get('format')))formatSelect.value=params.get('format');
 if(sorts.some(([key])=>key===params.get('sort')))sortSelect.value=params.get('sort');
 const decode=value=>{const node=document.createElement('textarea');node.innerHTML=value;return node.value;};
 const alphabetic=(a,b)=>decode(a.artist).localeCompare(decode(b.artist),'tr')||decode(a.album).localeCompare(decode(b.album),'tr')||a.id-b.id;
 const renderCollection=()=>{
  const result=filterAlbums($('#search').value,$('#genre-filter').value).filter(a=>!formatSelect.value||formatClass(a)===formatSelect.value);
  result.sort((a,b)=>{
   if(sortSelect.value==='artist-desc')return -alphabetic(a,b);
   if(sortSelect.value.startsWith('purchase-')){
    const aKnown=Number.isInteger(a.purchaseOrder),bKnown=Number.isInteger(b.purchaseOrder);
    if(aKnown!==bKnown)return aKnown?-1:1;
    if(aKnown&&a.purchaseOrder!==b.purchaseOrder)return (a.purchaseOrder-b.purchaseOrder)*(sortSelect.value==='purchase-desc'?-1:1);
   }
   return alphabetic(a,b);
  });
  $('#collection-grid').innerHTML=result.length?result.map(card).join(''):payload?.error?'<p class="empty">Koleksiyon bağlantısı şu anda kullanılamıyor.</p>':'<p class="empty">Bu aramaya uygun plak bulunamadı.</p>';
  $('#result-count').textContent=`${result.length} plak gösteriliyor`;
 };
 [$('#search'),$('#genre-filter'),formatSelect,sortSelect].forEach(control=>['input','change'].forEach(event=>control.addEventListener(event,renderCollection)));
 $('#clear').addEventListener('click',()=>{formatSelect.value='';sortSelect.value='artist-asc';renderCollection();});
 const note=document.createElement('p');note.className='muted';note.textContent='Alım sıralaması ay bazındadır. Aynı aydaki kayıtlar sanatçı ve albüm adına göre sıralanır; alım ayı eksik kayıtlar sonda gösterilir.';
 $('#result-count').before(note);renderCollection();
}
const homeSections=['home','dashboard-reports','featured','single-feature','signed-feature'];
document.querySelectorAll('main > section').forEach(section=>section.hidden=view==='home' ? !(homeSections.includes(section.id)||section===statsNode) : section.id!==(views[view]||view));
if(view==='home') {$('#collection-grid').replaceChildren();$('#signed-grid').replaceChildren();$('#artist-grid').replaceChildren();$('#genre-grid').replaceChildren();}
