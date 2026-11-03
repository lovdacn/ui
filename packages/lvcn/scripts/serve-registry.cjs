/**
 * Minimal static file server for testing registry resolution over HTTP.
 *
 * Serves a registry root so the CLI exercises the real `fetch` path and URL joining
 * (`<base>/styles/<engine>/<style>/<name>.json`) instead of the filesystem shortcut.
 *
 *   node serve-registry.cjs <root> <port>
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.resolve(process.argv[2] || '.');
const port = Number(process.argv[3] || 8099);

http
  .createServer((req, res) => {
    const requested = decodeURIComponent((req.url || '/').split('?')[0]);
    const target = path.join(root, requested);

    // Refuse anything that escapes the served root.
    if (!target.startsWith(root)) {
      res.writeHead(403).end('forbidden');
      return;
    }
    if (!fs.existsSync(target) || !fs.statSync(target).isFile()) {
      res.writeHead(404).end('not found');
      return;
    }
    const type = target.endsWith('.json')
      ? 'application/json'
      : target.endsWith('.css')
        ? 'text/css'
        : 'text/plain';
    res.writeHead(200, { 'content-type': type });
    fs.createReadStream(target).pipe(res);
  })
  .listen(port, '127.0.0.1', () => {
    console.log(`serving ${root} on http://127.0.0.1:${port}`);
  });
