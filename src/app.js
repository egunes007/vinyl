import { albums, filterAlbums } from './data.js';
const $ = s => document.querySelector(s);
const cover = a => `<div class="cover ${a.cover}" style="--cover:${a.color}"><span class="cover-artist">${a.artist}</span><strong class="cover-art">${a.mark}</strong><span class="cover-title">${a.album}</span><span class="cover-disclaimer">ÖZGÜN ÖRNEK KAPAK</span></div>`;
const card = a => `<button class="album-card" data-album="${a.id}" aria-label="${a.artist} — ${a.album}, detayları aç">${cover(a)}<div class="card-info"><span class="card-genre">${a.genre} <span>↗</span></span><h3>${a.album}</h3><p>${a.artist} <span>· ${a.year}</span></p></div></button>`;
const genres = [...new Set(albums.map(a=>a.genre))];
$('#album-count').textContent=albums.length.toString().padStart(2,'0');
$('#artist-count').textContent=new Set(albums.map(a=>a.artist)).size.toString().padStart(2,'0');
$('#genre-count').textContent=genres.length.toString().padStart(2,'0');
$('#featured-grid').innerHTML=albums.slice(0,4).map(card).join('');
$('#genre-filter').innerHTML+=genres.map(g=>`<option>${g}</option>`).join('');
function render(){const result=filterAlbums($('#search').value,$('#genre-filter').value);$('#collection-grid').innerHTML=result.length?result.map(card).join(''):'<p class="empty">Bu aramaya uygun plak bulunamadı. Filtreleri temizleyip tekrar deneyin.</p>';$('#result-count').textContent=`${result.length} örnek plak gösteriliyor`;}
render();
$('#search').addEventListener('input',render);$('#genre-filter').addEventListener('change',render);
$('#clear').onclick=()=>{$('#search').value='';$('#genre-filter').value='';render();};
$('#genre-grid').innerHTML=genres.map((g,i)=>`<button class="genre-tile" data-genre="${g}"><span class="genre-number">0${i+1} /</span><strong>${g}</strong><span>${albums.filter(a=>a.genre===g).length} örnek plak <b>↗</b></span></button>`).join('');
$('#artist-grid').innerHTML=[...albums].sort((a,b)=>a.artist.localeCompare(b.artist,'tr')).map(a=>`<button class="artist" data-artist="${a.artist}"><span>${a.artist}</span><span>1 plak ↗</span></button>`).join('');
document.addEventListener('click',e=>{
 const tile=e.target.closest('[data-genre], [data-artist]');if(tile){$('#search').value=tile.dataset.artist||'';$('#genre-filter').value=tile.dataset.genre||'';render();location.hash='collection';}
 const c=e.target.closest('[data-album]');if(!c)return;const a=albums.find(a=>a.id===Number(c.dataset.album));
 $('#album-detail').innerHTML=`${cover(a)}<div class="detail-copy"><p class="eyebrow">ÖRNEK ALBÜM · TASARIM PROTOTİPİ</p><h2>${a.album}</h2><p class="detail-artist">${a.artist}</p><dl>${[['İlk yayın yılı',a.year],['Baskı yılı','Örnek veride belirtilmedi'],['Baskı ülkesi',a.country+' (örnek)'],['Plak şirketi',a.label],['Format','LP · 12 inç (örnek)'],['Tür',a.genre],['Stil',a.style]].map(([k,v])=>`<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl><p class="muted">Bu kayıt gerçek koleksiyona bağlı değildir. Kapak, albümün resmî görseli yerine kullanılan özgün bir tasarım yer tutucusudur.</p></div>`;
 $('#album-dialog').showModal();
});
$('.close').onclick=()=>$('#album-dialog').close();$('#album-dialog').addEventListener('click',e=>{if(e.target===$('#album-dialog'))$('#album-dialog').close();});
$('.menu').onclick=()=>{const expanded=$('.menu').getAttribute('aria-expanded')!=='true';$('.menu').setAttribute('aria-expanded',expanded);$('nav').classList.toggle('open',expanded);};
$('nav').addEventListener('click',e=>{if(e.target.closest('a')){$('nav').classList.remove('open');$('.menu').setAttribute('aria-expanded','false');}});
