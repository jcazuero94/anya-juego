import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../docs/', import.meta.url));
const port = Number(process.env.PORT || 4173);
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.json': 'application/json' };
const server = http.createServer(async (req, res) => {
  try {
    const urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const filename = path.resolve(root, '.' + (urlPath === '/' ? '/index.html' : urlPath));
    if (!filename.startsWith(root)) { res.writeHead(403).end(); return; }
    if (!(await stat(filename)).isFile()) { res.writeHead(404).end(); return; }
    res.writeHead(200, { 'Content-Type': mime[path.extname(filename)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(await readFile(filename));
  } catch { res.writeHead(404).end('No encontrado'); }
});
server.listen(port, '127.0.0.1', () => console.log(`Anya: http://127.0.0.1:${port}`));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)));
