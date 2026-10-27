/* FCT demo — zero-dependency static file server for Railway (and local preview: `npm start`). */
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = __dirname, PORT = process.env.PORT || 8080;
const TYPES = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.json':'application/json',
  '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.ico':'image/x-icon', '.woff2':'font/woff2', '.md':'text/plain; charset=utf-8' };
const BLOCK = ['/fct details', '/server.js', '/package.json', '/railway.json', '/node_modules', '/tools', '/build_plan.md', '/.'];
http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/' || p === '') p = '/index.html';
  if (p === '/health') { res.writeHead(200, {'Content-Type':'text/plain'}); return res.end('ok'); }
  if (BLOCK.some(b => p.toLowerCase().startsWith(b))) { res.writeHead(404); return res.end('Not found'); }
  const file = path.normalize(path.join(ROOT, p));
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.stat(file, (err, st) => {
    const f = !err && st.isDirectory() ? path.join(file, 'index.html') : file;
    fs.readFile(f, (e, data) => {
      if (e) { res.writeHead(404, {'Content-Type':'text/plain'}); return res.end('Not found'); }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(f).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' });
      res.end(data);
    });
  });
}).listen(PORT, () => console.log('FCT demo on http://localhost:' + PORT));
