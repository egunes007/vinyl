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
