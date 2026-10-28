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
document.querySelectorAll('nav a').forEach(a => {if(new URL(a.href).pathname===location.pathname)a.setAttribute('aria-current','page');});
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

