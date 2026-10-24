(function (root) {
  'use strict';
  const cfg = root.LILI_SUPABASE || {};
  const SESSION_KEY = 'lili_supabase_session';
  const REVISION_KEY = 'lili_supabase_revision';
  let refreshPromise = null;
  const session = () => { try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch (_) { return null; } };
  const saveSession = (value) => { if (value) localStorage.setItem(SESSION_KEY, JSON.stringify(value)); else localStorage.removeItem(SESSION_KEY); };
  async function apiError(response) {
    const data = await response.json().catch(() => ({}));
    const error = new Error(data.error_description || data.msg || data.message || data.code || `HTTP ${response.status}`);
    error.status = response.status; error.code = data.error_code || data.code; throw error;
  }
  async function auth(path, payload) {
    const response = await fetch(cfg.url.replace(/\/$/, '') + '/auth/v1/' + path, {
      method: 'POST', headers: { apikey: cfg.anonKey, 'content-type': 'application/json' }, body: JSON.stringify(payload)
    });
    if (!response.ok) return apiError(response);
    return response.json();
  }
  async function refresh() {
    const current = session(); if (!current?.refresh_token) throw new Error('auth_required');
    if (refreshPromise) return refreshPromise;
    refreshPromise = auth('token?grant_type=refresh_token', { refresh_token: current.refresh_token })
      .then((value) => { saveSession(value); return value; })
      .catch((error) => { if ([400, 401, 403].includes(error.status)) saveSession(null); throw error; })
      .finally(() => { refreshPromise = null; });
    return refreshPromise;
  }
  async function raw(path, options = {}, authenticated = true) {
    if (!/^https:\/\//.test(cfg.url || '') || !cfg.anonKey) throw new Error('supabase_not_configured');
    const requestOptions = Object.assign({}, options); delete requestOptions._retried;
    const headers = Object.assign({ apikey: cfg.anonKey, 'content-type': 'application/json' }, options.headers || {});
    const current = session();
    if (authenticated && current?.access_token) headers.authorization = `Bearer ${current.access_token}`;
    const response = await fetch(cfg.url.replace(/\/$/, '') + path, Object.assign(requestOptions, { headers }));
    if (response.status === 401 && authenticated && current?.refresh_token && !options._retried) {
      await refresh(); return raw(path, Object.assign({}, options, { _retried: true }), authenticated);
    }
    if (!response.ok) return apiError(response);
    if (response.status === 204) return null;
    const text = await response.text(); return text ? JSON.parse(text) : null;
  }
  async function initialize(displayName) {
    await raw('/rest/v1/rpc/lili_initialize_account', { method: 'POST', body: JSON.stringify({ display_name_input: displayName || '' }) });
  }
  async function captureAuthCallback() {
    if (!location.hash || !/access_token=/.test(location.hash)) return false;
    const values = new URLSearchParams(location.hash.slice(1));
    const accessToken = values.get('access_token'); if (!accessToken) return false;
    let claims = {};
    try {
      const encoded = accessToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      claims = JSON.parse(atob(encoded.padEnd(Math.ceil(encoded.length / 4) * 4, '=')));
    } catch (_) { /* profile is optional */ }
    const value = {
      access_token: accessToken, refresh_token: values.get('refresh_token') || '', token_type: values.get('token_type') || 'bearer',
      expires_in: Number(values.get('expires_in') || 0), user: { id: claims.sub, email: claims.email, user_metadata: claims.user_metadata || {} }
    };
    saveSession(value); history.replaceState(null, '', location.pathname + location.search + '#today');
    await initialize(value.user.user_metadata.display_name || ''); return true;
  }
  async function signIn(email, password) {
    const value = await auth('token?grant_type=password', { email: String(email || '').trim().toLowerCase(), password });
    saveSession(value); await initialize(value.user?.user_metadata?.display_name || ''); return value;
  }
  async function signUp(email, password, displayName) {
    const redirect = location.origin + location.pathname;
    const value = await auth('signup?redirect_to=' + encodeURIComponent(redirect), {
      email: String(email || '').trim().toLowerCase(), password,
      data: { app: 'lili', display_name: String(displayName || '').trim().slice(0, 80) }
    });
    if (value?.access_token) { saveSession(value); await initialize(displayName); }
    return value;
  }
  async function signOut() {
    try { if (session()) await raw('/auth/v1/logout?scope=local', { method: 'POST' }); } catch (_) { /* local logout still succeeds */ }
    saveSession(null); localStorage.removeItem(REVISION_KEY);
  }
  async function pull() {
    const rows = await raw('/rest/v1/lili_user_state?select=state,revision,updated_at&limit=1');
    const row = rows?.[0]; if (!row) throw new Error('state_missing');
    localStorage.setItem(REVISION_KEY, String(row.revision || 0)); return row;
  }
  async function push(state) {
    const expected = Number(localStorage.getItem(REVISION_KEY) || 0);
    const rows = await raw('/rest/v1/rpc/lili_save_state', {
      method: 'POST', headers: { prefer: 'return=representation' },
      body: JSON.stringify({ expected_revision: expected, new_state: state })
    });
    if (!rows?.length) { const error = new Error('version_conflict'); error.status = 409; throw error; }
    localStorage.setItem(REVISION_KEY, String(rows[0].revision)); return rows[0];
  }
  async function profile() { const rows = await raw('/rest/v1/lili_profiles?select=display_name&limit=1'); return rows?.[0] || null; }
  root.SyncClient = Object.freeze({
    configuredUrl: () => cfg.url || '', isConfigured: () => !!cfg.url && !!cfg.anonKey,
    session, isLoggedIn: () => !!session()?.access_token, currentUser: () => session()?.user || null,
    signUp, login: signIn, logout: signOut, pull, push, profile, refresh, captureAuthCallback
  });
})(typeof globalThis !== 'undefined' ? globalThis : window);
