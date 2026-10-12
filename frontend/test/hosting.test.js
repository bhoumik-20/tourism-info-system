import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker/index.js';

test('hosting bridge keeps API offline errors honest and rejects cross-site changes', async () => {
  const missing = await worker.fetch(new Request('https://voyage.example/api/cities'), {});
  assert.equal(missing.status, 503);
  const crossSite = await worker.fetch(new Request('https://voyage.example/api/users', {
    method: 'POST', headers: { Origin: 'https://elsewhere.example', 'Content-Type': 'application/json' }, body: '{}',
  }), {});
  assert.equal(crossSite.status, 403);
});

test('hosting bridge preserves Oracle rejection status and code without forwarding visitor credentials', async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (url, init) => {
      assert.equal(url.href, 'https://tunnel.example/api/users/2/trips?limit=3');
      assert.equal(init.headers.get('X-Voyage-Tunnel-Key'), 'test-only-key');
      assert.equal(init.headers.get('Cookie'), null);
      assert.equal(init.headers.get('Authorization'), null);
      return Response.json({ error: 'Event dates do not overlap.', code: 'ORA-20033' }, { status: 409 });
    };
    const result = await worker.fetch(new Request('https://voyage.example/api/users/2/trips?limit=3', {
      headers: { Cookie: 'visitor-cookie', Authorization: 'visitor-token' },
    }), { VOYAGE_BACKEND_URL: 'https://tunnel.example', VOYAGE_TUNNEL_KEY: 'test-only-key' });
    assert.equal(result.status, 409);
    assert.equal((await result.json()).code, 'ORA-20033');
    assert.equal(result.headers.get('Cache-Control'), 'no-store');
  } finally { globalThis.fetch = originalFetch; }
});

test('hosting bridge supports successful deletes and rejects tunnel error HTML', async () => {
  const originalFetch = globalThis.fetch;
  const env = { VOYAGE_BACKEND_URL: 'https://tunnel.example', VOYAGE_TUNNEL_KEY: 'test-only-key' };
  try {
    globalThis.fetch = async () => new Response(null, { status: 204 });
    const result = await worker.fetch(new Request('https://voyage.example/api/reviews/123', {
      method: 'DELETE', headers: { Origin: 'https://voyage.example' },
    }), env);
    assert.equal(result.status, 204);
    globalThis.fetch = async () => new Response('<html>Tunnel unavailable</html>', { status: 502 });
    const unavailable = await worker.fetch(new Request('https://voyage.example/api/cities'), env);
    assert.equal(unavailable.status, 503);
    assert.match((await unavailable.json()).error, /host PC is unavailable/);
  } finally { globalThis.fetch = originalFetch; }
});
