import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
const root = new URL('../', import.meta.url);
const theme = new URL('wordpress/vinyl-archive/', root);
await mkdir(new URL('assets/', theme), {recursive:true});
const html = await readFile(new URL('index.html', root), 'utf8');
let body = html.slice(html.indexOf('<div class="demo">'), html.indexOf('<script type="module"'));
const routes = {home:'',collection:'koleksiyon',signed:'imzali-plaklar',artists:'sanatcilar',genres:'turler',about:'hakkimda'};
for (const [anchor, slug] of Object.entries(routes)) {
 const path = Boolean(slug) ? '/?pagename='+slug : '/'+slug+(slug ? '/' : '');
 body = body.replaceAll(`href="#${anchor}"`, `href="<?php echo esc_url(home_url('${path}')); ?>"`);
}
body = body.replace(/<section id="about"[^]*?<\/section>/, await readFile(new URL('scripts/wordpress-about.html', root), 'utf8'));
body = body.replace('<main>', '<main id="main-content">');
await writeFile(new URL('template-parts-archive.php', theme), `<?php defined('ABSPATH') || exit; ?>\n${body}`);
await copyFile(new URL('src/style.css',root),new URL('assets/archive.css',theme));
await copyFile(new URL('src/data.js',root),new URL('assets/data.js',theme));
let app = await readFile(new URL('src/app.js',root),'utf8');
// WordPress supplies real page URLs; collection actions navigate to the collection page.
app = app.replace("render();location.hash='collection';", "render();const target=new URL(document.body.dataset.collectionUrl);if(tile.dataset.artist)target.searchParams.set('artist',tile.dataset.artist);if(tile.dataset.genre)target.searchParams.set('genre',tile.dataset.genre);location.href=target.href;");
// Escape all API text before interpolation into the existing static card templates.
app = app.replace("import { albums, filterAlbums } from './data.js';", `import { albums as demoAlbums } from './data.js';
const payloadNode = document.getElementById('vinyl-collection-data');
const payload = payloadNode ? JSON.parse(payloadNode.textContent) : null;
const live = payload?.live === true;
${await readFile(new URL('scripts/wordpress-discogs-ui.js', root), 'utf8')}
const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const albums = (live ? payload.albums : demoAlbums).map((row, index) => {
 const a = Object.fromEntries(Object.entries(row).map(([k,v]) => [k, typeof v === 'string' ? escapeHTML(v) : v]));
 return {...a, id:index, manualCoverUrl:live?safeManualImage(row.manualCoverUrl):'', coverImage:live?safeDiscogsImage(row.coverImage):'', discogsUrl:live && /^[1-9][0-9]{0,11}$/.test(String(row.discogsId))?'https://www.discogs.com/release/'+row.discogsId:'', cover:live?'public-cover':a.cover, color:live?'#292523':a.color, mark:live?'◉':a.mark, genre:a.genre || 'Diğer'};
});
const filterAlbums = (query='', genre='') => {
 const term=escapeHTML(query.trim().toLocaleLowerCase('tr-TR'));
 return albums.filter(a=>(!genre || a.genre.split(',').map(g=>g.trim()).includes(escapeHTML(genre))) && (a.artist+' '+a.album).toLocaleLowerCase('tr-TR').includes(term));
};`);
app = app.replace("const genres = [...new Set(albums.map(a=>a.genre))];", "const genres = [...new Set(albums.flatMap(a=>a.genre.split(',').map(g=>g.trim()).filter(Boolean)))].sort((a,b)=>a.localeCompare(b,'tr'));");
app = app.replace("$('#featured-grid').innerHTML=albums.slice(0,4)", "$('#featured-grid').innerHTML=(live ? albums.filter(a=>a.featured).concat(albums.filter(a=>!a.featured)).slice(0,4) : albums.slice(0,4))");
app = app.replace("const term = $('#signed-search').value.trim().toLocaleLowerCase('tr-TR');", "const term = escapeHTML($('#signed-search').value.trim().toLocaleLowerCase('tr-TR'));");
app = app.replace('ÖZGÜN ÖRNEK KAPAK', "${live ? 'KAPAK GÖRSELİ YOK' : 'ÖZGÜN ÖRNEK KAPAK'}");
app = app.replace("'<span class=\"signed-badge\">✎ İmzalı · Örnek</span>'", "'<span class=\"signed-badge\">✎ İmzalı' + (live ? '' : ' · Örnek') + '</span>'");
app = app.replace('ÖRNEK ALBÜM · TASARIM PROTOTİPİ', "${live ? 'KOLEKSİYONDAN' : 'ÖRNEK ALBÜM · TASARIM PROTOTİPİ'}");
app = app.replace("a.signed?'İmzalı (örnek)'", "a.signed?(live?'İmzalı':'İmzalı (örnek)')");
app = app.replace("['Baskı yılı','Örnek veride belirtilmedi']", "['Baskı yılı',live?(a.pressingYear || 'Belirtilmedi'):'Örnek veride belirtilmedi']");
app = app.replace("a.country+' (örnek)'", "(a.country || 'Belirtilmedi')+(live?'':' (örnek)')");
app = app.replace("['Format','LP · 12 inç (örnek)']", "['Format',live?(a.format || 'Belirtilmedi'):'LP · 12 inç (örnek)']");
app = app.replace('Bu kayıt gerçek koleksiyona bağlı değildir. Kapak, albümün resmî görseli yerine kullanılan özgün bir tasarım yer tutucusudur.', "${live ? 'Koleksiyon kaydı NocoDB üzerinden alınmıştır. Görsel, kapak bulunmadığında kullanılan yer tutucudur.' : 'Bu kayıt gerçek koleksiyona bağlı değildir. Kapak, albümün resmî görseli yerine kullanılan özgün bir tasarım yer tutucusudur.'}");
app = app.replace('${result.length} örnek plak', "${result.length}${live ? '' : ' örnek'} plak");
app = app.replace('${matches.length} örnek imzalı plak', "${matches.length}${live ? '' : ' örnek'} imzalı plak");

app = app.replace("$('#artist-grid').innerHTML=[...albums]", "$('#artist-grid').innerHTML=[...new Map(albums.map(a=>[a.artist,a])).values()]");
app = app.replace('${albums.filter(a=>a.genre===g).length} örnek plak', "${albums.filter(a=>a.genre===g).length}${live ? '' : ' örnek'} plak");
app = app.replace('1 plak ↗', '${albums.filter(record=>record.artist===a.artist).length} plak ↗');
app = app.replace('const cover = a => `', 'const cover = a => discogsCover(a) || `');
app = app.replace('const card = a => `<button', 'const card = a => `<article class="album-entry"><button');
app = app.replace('</div></button>`;\nconst genres', '</div></button>${a.discogsUrl ? \'<a class="discogs-credit" href="\'+a.discogsUrl+\'" target="_blank" rel="noopener noreferrer">Discogs ↗</a>\' : \'\'}</article>`;\nconst genres');
app = app.replace('</p></div>`;\n $(\'#album-dialog\')', '</p>${a.discogsUrl ? \'<a class="discogs-credit" href="\'+a.discogsUrl+\'" target="_blank" rel="noopener noreferrer">Discogs albüm kaydı ↗</a>\' : \'\'}</div>`;\n $(\'#album-dialog\')');
app = app.replace('Koleksiyon kaydı NocoDB üzerinden alınmıştır. Görsel, kapak bulunmadığında kullanılan yer tutucudur.', 'Koleksiyon kaydı NocoDB üzerinden alınmıştır. Kapaklar koleksiyondan veya Discogs üzerinden alınır; kapak bulunamadığında yer tutucu gösterilir.');
const start=app.indexOf('function routeSigned(');
app=app.slice(0,start)+`
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

`;
app += await readFile(new URL('scripts/wordpress-dashboard.js', root), 'utf8');
await writeFile(new URL('assets/app.js',theme),app);
console.log('WordPress tema bileşenleri güncellendi.');
