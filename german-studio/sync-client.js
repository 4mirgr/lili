(function (root) {
  'use strict';
  const API_KEY = 'ld-api-url';
  const DEFAULT_API = 'https://lili-german-backend.leyla-saadati99.workers.dev';
  const TOKEN_KEY = 'ld-api-session';
  const VERSION_KEY = 'ld-sync-version';
  const cleanUrl = (value) => String(value || '').trim().replace(/\/+$/, '');
  const configuredUrl = () => cleanUrl(localStorage.getItem(API_KEY) || DEFAULT_API);
  const token = () => sessionStorage.getItem(TOKEN_KEY) || '';
  async function request(path, options) {
    const base = configuredUrl();
    if (!base) throw new Error('api_not_configured');
    const headers = Object.assign({ 'content-type': 'application/json' }, options?.headers || {});
    if (token()) headers.authorization = 'Bearer ' + token();
    const response = await fetch(base + path, Object.assign({}, options, { headers }));
    const data = response.status === 204 ? null : await response.json().catch(() => ({}));
    if (!response.ok) { const error = new Error(data?.error || 'request_failed'); error.status = response.status; error.data = data; throw error; }
    return data;
  }
  const saveSession = (data) => { sessionStorage.setItem(TOKEN_KEY, data.token); sessionStorage.setItem(VERSION_KEY, '0'); return data; };
  root.SyncClient = {
    configure(url) { const value = cleanUrl(url); if (value && !/^https:\/\//.test(value) && !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(value)) throw new Error('https_required'); localStorage.setItem(API_KEY, value); },
    configuredUrl, isConfigured: () => !!configuredUrl(), isLoggedIn: () => !!token(),
    login: (username, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }).then(saveSession),
    register: (username, password, inviteCode) => request('/auth/register', { method: 'POST', body: JSON.stringify({ username, password, inviteCode }) }).then(saveSession),
    bootstrap: (username, password, bootstrapToken) => request('/auth/bootstrap', { method: 'POST', headers: { 'x-bootstrap-token': bootstrapToken }, body: JSON.stringify({ username, password }) }).then(saveSession),
    createInvite: () => request('/auth/invites', { method: 'POST', body: '{}' }),
    me: () => request('/auth/me'),
    pull: async () => { const data = await request('/sync/state'); sessionStorage.setItem(VERSION_KEY, String(data.version)); return data; },
    push: async (state) => { const baseVersion = Number(sessionStorage.getItem(VERSION_KEY) || 0); const data = await request('/sync/state', { method: 'PUT', body: JSON.stringify({ baseVersion, state }) }); sessionStorage.setItem(VERSION_KEY, String(data.version)); return data; },
    logout: async () => { try { await request('/auth/logout', { method: 'POST', body: '{}' }); } finally { sessionStorage.removeItem(TOKEN_KEY); sessionStorage.removeItem(VERSION_KEY); } }
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
