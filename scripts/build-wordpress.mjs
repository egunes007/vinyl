import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
const root = new URL('../', import.meta.url);
const theme = new URL('wordpress/vinyl-archive/', root);
await mkdir(new URL('assets/', theme), {recursive:true});
const html = await readFile(new URL('index.html', root), 'utf8');
let body = html.slice(html.indexOf('<div class="demo">'), html.indexOf('<script type="module"'));
const routes = {home:'',collection:'koleksiyon',signed:'imzali-plaklar',artists:'sanatcilar',genres:'turler',about:'hakkimda'};
for (const [anchor, slug] of Object.entries(routes)) {
 body = body.replaceAll(`href="#${anchor}"`, `href="<?php echo esc_url(home_url('/${slug}${slug ? '/' : ''}')); ?>"`);
}
body = body.replace('<main>', '<main id="main-content">');
await writeFile(new URL('template-parts-archive.php', theme), `<?php defined('ABSPATH') || exit; ?>\n${body}`);
await copyFile(new URL('src/style.css',root),new URL('assets/archive.css',theme));
await copyFile(new URL('src/data.js',root),new URL('assets/data.js',theme));
let app = await readFile(new URL('src/app.js',root),'utf8');
// WordPress supplies real page URLs; collection actions navigate to the collection page.
app = app.replace("render();location.hash='collection';", "render();const target=new URL(document.body.dataset.collectionUrl);if(tile.dataset.artist)target.searchParams.set('artist',tile.dataset.artist);if(tile.dataset.genre)target.searchParams.set('genre',tile.dataset.genre);location.href=target.href;");
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
if (genres.includes(requestedGenre)) $('#genre-filter').value = requestedGenre;
render();
document.querySelectorAll('nav a').forEach(a => {if(new URL(a.href).pathname===location.pathname)a.setAttribute('aria-current','page');});
`;
await writeFile(new URL('assets/app.js',theme),app);
console.log('WordPress tema bileşenleri güncellendi.');
