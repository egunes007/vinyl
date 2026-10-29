import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const theme = new URL('../wordpress/vinyl-archive/', import.meta.url);
const read = path => readFile(new URL(path, theme), 'utf8');
test('WordPress yaşam döngüsü kancaları ve güvenli sayfa bağlantıları', async () => {
 const header = await read('header.php');
 assert.match(header, /wp_head\(\)/); assert.match(header, /wp_body_open\(\)/);
 assert.match(await read('footer.php'), /wp_footer\(\)/);
 assert.match(await read('functions.php'), /wp_enqueue_script_module/);
 const body = await read('template-parts-archive.php');

 for(const slug of ['koleksiyon','imzali-plaklar','sanatcilar','turler','hakkimda'])assert.ok(body.includes(`esc_url(home_url('/?pagename=${slug}'))`));
 assert.ok(header.includes("home_url('/?pagename=koleksiyon')"));
 assert.ok(!body.includes('href="#signed"'));
 assert.match(body,/class="turntable"/);
});
test('özel sayfalar ve tür/sanatçı araması WordPress rotalarını kullanır', async () => {
 const app = await read('assets/app.js');
 assert.match(app,/dataset.archiveView/);
 assert.match(app,/dataset.collectionUrl/);
 assert.match(app,/target.searchParams.set\('artist'/);
 assert.match(app,/target.searchParams.set\('genre'/);
 assert.ok(!app.includes("location.hash='collection'"));
 assert.match(await read('style.css'),/Theme Name: Vinyl Archive/);
});
