// Inlined by build-wordpress.mjs; API text is escaped before rendering.
function safeDiscogsImage(value) {
 try {
  const url = new URL(value);
  return url.protocol === 'https:' && ['i.discogs.com','img.discogs.com'].includes(url.hostname) && !url.username && !url.password && !url.port ? escapeHTML(url.href) : '';
 } catch { return ''; }
}
function discogsCover(a) {
 return a.coverImage ? `<div class="cover photo-cover"><img src="${a.coverImage}" data-cover-id="${a.id}" alt="${a.artist} — ${a.album} albüm kapağı" loading="lazy" decoding="async" referrerpolicy="no-referrer"><span class="cover-credit">Görsel: Discogs</span></div>` : '';
}
