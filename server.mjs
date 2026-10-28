import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
const root = resolve(import.meta.dirname);
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml' };
http.createServer(async (req, res) => {
  try {
    const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const file = resolve(root, '.' + (path === '/' ? '/index.html' : path));
    if (!file.startsWith(root + '/') || !(path === '/' || path === '/index.html' || path.startsWith('/src/') || path.startsWith('/public/'))) { res.writeHead(404).end(); return; }
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff' }).end(body);
  } catch { res.writeHead(404).end('Bulunamadı'); }
}).listen(Number(process.env.PORT || 3000), '0.0.0.0', () => console.log('VINYL ARCHIVE — port ' + (process.env.PORT || 3000)));
