// Tiny static server for local checks (dev tooling, never shipped).
// Serves a built site the way a static host does: /x/ -> x/index.html,
// /x -> x.html or a redirect to /x/, unknown paths -> 404.html with status 404.
// usage: node tools/serve.mjs <dir> <port>
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname, resolve } from 'node:path';

const [dir, port] = [resolve(process.argv[2]), Number(process.argv[3])];
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.woff2': 'font/woff2', '.woff': 'font/woff', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8', '.json': 'application/json', '.ico': 'image/x-icon' };
const file = (p) => existsSync(p) && statSync(p).isFile() ? p : null;

createServer((req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const abs = join(dir, path);
  if (!abs.startsWith(dir)) { res.writeHead(403).end(); return; }
  if (!path.endsWith('/') && existsSync(abs) && statSync(abs).isDirectory() && file(join(abs, 'index.html'))) {
    res.writeHead(308, { Location: path + '/' }).end(); return;
  }
  const hit = file(abs) || file(join(abs, 'index.html')) || file(abs + '.html');
  const out = hit || join(dir, '404.html');
  res.writeHead(hit ? 200 : 404, { 'Content-Type': TYPES[extname(out)] || 'application/octet-stream' });
  res.end(readFileSync(out));
}).listen(port, () => console.log(`${dir} on http://localhost:${port}`));
