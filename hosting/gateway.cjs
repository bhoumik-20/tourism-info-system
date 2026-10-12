'use strict';
// A small HTTP bridge; it never opens Oracle or reads the Oracle .env file.
const http = require('node:http');
const { timingSafeEqual } = require('node:crypto');

function createGateway(key, upstreamPort = 5000) {
  if (typeof key !== 'string' || key.length < 40) throw new Error('Configure a strong team tunnel key.');
  const expected = Buffer.from(key);
  return http.createServer((req, res) => {
    const received = Buffer.from(String(req.headers['x-voyage-tunnel-key'] || ''));
    if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
      res.writeHead(401, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      return res.end(JSON.stringify({ error: 'Team website connection required.' }));
    }
    if (!req.url.startsWith('/api/') || !['GET', 'HEAD', 'POST', 'PUT', 'DELETE'].includes(req.method)) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Endpoint not found.' }));
    }
    if (Number(req.headers['content-length'] || 0) > 32768) {
      res.writeHead(413, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Request body is too large.' }));
    }
    const headers = {};
    if (req.headers['content-type']) headers['Content-Type'] = req.headers['content-type'];
    const upstream = http.request({
      hostname: '127.0.0.1', port: upstreamPort, method: req.method,
      path: req.url, headers, timeout: 20000,
    }, response => {
      res.writeHead(response.statusCode, {
        'Content-Type': response.headers['content-type'] || 'application/json',
        'Cache-Control': 'no-store',
      });
      response.pipe(res);
    });
    upstream.on('timeout', () => upstream.destroy());
    upstream.on('error', () => {
      if (res.headersSent) return res.destroy();
      res.writeHead(503, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      res.end(JSON.stringify({ error: 'The local Tourism backend is unavailable.' }));
    });
    req.on('aborted', () => upstream.destroy());
    req.pipe(upstream);
  });
}

if (require.main === module) {
  const server = createGateway(process.env.VOYAGE_TUNNEL_KEY);
  server.listen(5001, '127.0.0.1', () => console.log('Voyage team gateway listening on loopback port 5001.'));
  server.on('error', error => { console.error('Gateway failed:', error.code || 'SERVER_ERROR'); process.exitCode = 1; });
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close());
}
module.exports = { createGateway };
