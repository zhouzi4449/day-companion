import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.dirname(fileURLToPath(import.meta.url));
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8' };
const port = Number(process.env.PORT || 4173);
http.createServer(async (request, response) => {
  try {
    if (request.method !== 'GET') { response.writeHead(405).end(); return; }
    const requested = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const file = path.resolve(root, requested === '/' ? 'index.html' : '.' + requested);
    if (!file.startsWith(root + path.sep) || !mime[path.extname(file)] || path.basename(file) === 'server.mjs') { response.writeHead(404).end(); return; }
    const body = await readFile(file);
    response.writeHead(200, { 'Content-Type': mime[path.extname(file)], 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'none'; object-src 'none'; frame-ancestors 'none'; base-uri 'none'", 'Referrer-Policy': 'no-referrer' });
    response.end(body);
  } catch { response.writeHead(404).end(); }
}).listen(port, '127.0.0.1', () => console.log(`本地原型：http://127.0.0.1:${port}；仅本机访问；未接入真实 AI。`));
