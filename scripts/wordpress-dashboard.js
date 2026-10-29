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
statsNode.innerHTML = metrics.map(([label,n],i)=> i===10 ? `<a class="stat-card" href="${signedLink}"><strong>${n}</strong><span>${label}</span></a>` : `<div class="stat-card"><strong${({0:'album-count',8:'artist-count',11:'genre-count'}[i]) ? ' id="'+({0:'album-count',8:'artist-count',11:'genre-count'}[i])+'"' : ''}>${n}</strong><span>${label}</span></div>`).join('');
const collectionURL = new URL(document.body.dataset.collectionUrl || '/koleksiyon/', location.origin);
function listURL(format) {const url=new URL(collectionURL);url.searchParams.set('format',format);return url.href;}
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
const requestedFormat=params.get('format');
if(view==='collection' && requestedFormat){
 const renderFormat=()=>{
  const result=filterAlbums($('#search').value,$('#genre-filter').value).filter(a=>formatClass(a)===requestedFormat);
  $('#collection-grid').innerHTML=result.length?result.map(card).join(''):'<p class="empty">Bu aramaya uygun plak bulunamadı.</p>';
  $('#result-count').textContent=`${result.length} plak gösteriliyor`;
 };
 ['input','change'].forEach(event=>document.querySelector('.filters').addEventListener(event,renderFormat));
 $('#clear').addEventListener('click',renderFormat);renderFormat();
}
const homeSections=['home','dashboard-reports','featured','single-feature','signed-feature'];
document.querySelectorAll('main > section').forEach(section=>section.hidden=view==='home' ? !(homeSections.includes(section.id)||section===statsNode) : section.id!==(views[view]||view));
if(view==='home') {$('#collection-grid').replaceChildren();$('#signed-grid').replaceChildren();$('#artist-grid').replaceChildren();$('#genre-grid').replaceChildren();}
