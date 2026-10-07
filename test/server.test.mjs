import test from 'node:test';
import assert from 'node:assert/strict';
import { startProduction } from '../app/server.js';

let server;
let base;
test.before(async () => {
  ({ server } = await startProduction({ port: 0 }));
  base = `http://127.0.0.1:${server.address().port}`;
});
test.after(() => server.close());

test('GET /health returns ok', async () => {
  const res = await fetch(`${base}/health`);
  assert.equal(res.status, 200);
  assert.equal(await res.text(), 'ok');
});

test('GET /version returns name and version', async () => {
  const res = await fetch(`${base}/version`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.name, 'agent-spec-grader');
  assert.ok(body.version);
});

test('static allowlist serves the lab and all four examples', async () => {
  for (const path of ['/', '/guide.html', '/styles.css', '/app.js', '/spec.mjs',
    '/examples/vague-wish.json', '/examples/user-story.json',
    '/examples/use-case.json', '/examples/agent-ready.json']) {
    const res = await fetch(`${base}${path}`);
    assert.equal(res.status, 200, `${path} should serve`);
  }
});

test('spec.mjs is served as JavaScript', async () => {
  const res = await fetch(`${base}/spec.mjs`);
  assert.match(res.headers.get('content-type'), /javascript/);
});

test('unknown paths 404 and POSTs are rejected', async () => {
  assert.equal((await fetch(`${base}/../package.json`)).status, 404);
  assert.equal((await fetch(`${base}/nope`)).status, 404);
  assert.equal((await fetch(`${base}/`, { method: 'POST' })).status, 404);
});

test('security headers are present', async () => {
  const res = await fetch(`${base}/`);
  assert.ok(res.headers.get('content-security-policy'));
  assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
});
