'use strict';
const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');

function createClient() {
  const store = new Map(); const calls = [];
  const responses = [
    { access_token: 'token', refresh_token: 'refresh', user: { id: 'u1', email: 'learner@example.com', user_metadata: { display_name: 'Lili' } } },
    null,
    [{ state: { v: 1, highlights: [] }, revision: 4, updated_at: '2026-01-01' }],
    [{ revision: 5, updated_at: '2026-01-02' }]
  ];
  const context = {
    LILI_SUPABASE: { url: 'https://project.supabase.co', anonKey: 'public-anon' },
    localStorage: { getItem: (k) => store.get(k) || null, setItem: (k, v) => store.set(k, v), removeItem: (k) => store.delete(k) },
    location: { origin: 'https://example.test', pathname: '/lili/', hash: '' }, history: { replaceState() {} },
    fetch: async (url, options) => { calls.push({ url, options }); const body = responses.shift(); return { ok: true, status: body === null ? 204 : 200, text: async () => body === null ? '' : JSON.stringify(body), json: async () => body }; },
    URLSearchParams, JSON, Object, String, Number, Error, Promise, atob
  };
  context.globalThis = context; vm.createContext(context);
  vm.runInContext(fs.readFileSync(require.resolve('../sync-client.js'), 'utf8'), context);
  return { client: context.SyncClient, calls, store };
}

test('Supabase login initializes an isolated account and persists revisioned state', async () => {
  const { client, calls, store } = createClient();
  await client.login('LEARNER@example.com', 'long-password');
  assert.equal(client.currentUser().id, 'u1');
  assert.match(calls[0].url, /auth\/v1\/token\?grant_type=password/);
  assert.equal(JSON.parse(calls[0].options.body).email, 'learner@example.com');
  assert.match(calls[1].url, /rpc\/lili_initialize_account/);
  const pulled = await client.pull(); assert.equal(pulled.revision, 4);
  await client.push({ v: 1, highlights: [{ id: 'h1' }] });
  assert.equal(JSON.parse(calls[3].options.body).expected_revision, 4);
  assert.equal(store.get('lili_supabase_revision'), '5');
});
