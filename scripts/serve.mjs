// Local preview of the built site, with byte-range support so videos seek.
// Usage: node scripts/serve.mjs [port]      (default 8765)
import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const port = Number(process.argv[2] ?? 8765);
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json',
  '.mp4': 'video/mp4', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };

createServer((req, res) => {
  let file = path.join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!file.startsWith(root)) { res.writeHead(403).end(); return; }
  let stat;
  try {
    stat = statSync(file);
    if (stat.isDirectory()) { file = path.join(file, 'index.html'); stat = statSync(file); }
  } catch { res.writeHead(404).end('Not found'); return; }
  const headers = { 'Content-Type': TYPES[path.extname(file)] ?? 'application/octet-stream', 'Accept-Ranges': 'bytes' };
  const range = req.headers.range?.match(/bytes=(\d*)-(\d*)/);
  if (range) {
    const start = range[1] ? Number(range[1]) : stat.size - Number(range[2]);
    const end = range[1] && range[2] ? Math.min(Number(range[2]), stat.size - 1) : stat.size - 1;
    res.writeHead(206, { ...headers, 'Content-Range': `bytes ${start}-${end}/${stat.size}`, 'Content-Length': end - start + 1 });
    createReadStream(file, { start, end }).pipe(res);
  } else {
    res.writeHead(200, { ...headers, 'Content-Length': stat.size });
    createReadStream(file).pipe(res);
  }
}).listen(port, '127.0.0.1', () => console.log(`http://localhost:${port}/`));
