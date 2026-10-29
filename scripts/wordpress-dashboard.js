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
