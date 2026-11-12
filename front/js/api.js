/* =========================================================
   KENNEDITO — cliente HTTP da API (contas, saves e ranking)
   ========================================================= */
'use strict';

(function () {
  const CONFIG = window.KC_CONFIG || {};
  const TOKEN_KEY = 'kennedito.cloud.token.v1';
  const ACCOUNT_KEY = 'kennedito.cloud.account.v1';
  const BASE_KEY = 'kennedito.cloud.base.v1';

  function isLocalHost() {
    const host = String(window.location.hostname || '').toLowerCase();
    return host === 'localhost' || host === '127.0.0.1' || host === '::1' || host === '';
  }

  function queryApi() {
    try {
      const params = new URLSearchParams(window.location.search);
      return String(params.get('api') || '').trim().replace(/\/+$/, '');
    } catch (e) { return ''; }
  }

  function resolveBases() {
    // ?api=... força um servidor só (usado nos testes e no dev local)
    const fromQuery = queryApi();
    if (fromQuery) return [fromQuery];

    const list = [];
    const push = function (value) {
      const v = String(value || '').trim().replace(/\/+$/, '');
      if (v && list.indexOf(v) < 0) list.push(v);
    };

    // a lista configurada: o primeiro que responder passa a ser o principal
    if (Array.isArray(CONFIG.apiBases)) CONFIG.apiBases.forEach(push);
    push(CONFIG.apiBase);

    // a base que já funcionou neste dispositivo ganha a primeira vaga
    const saved = safeStorageGet(BASE_KEY);
    if (saved) {
      const v = String(saved).replace(/\/+$/, '');
      const at = list.indexOf(v);
      if (at > 0) {
        list.splice(at, 1);
        list.unshift(v);
      }
    }

    if (isLocalHost()) {
      const local = String(CONFIG.localApiBase || 'http://localhost:3001').trim().replace(/\/+$/, '');
      if (local && list.indexOf(local) < 0) list.unshift(local);
    }
    return list;
  }

  class ApiError extends Error {
    constructor(message, status, code) {
      super(message);
      this.name = 'ApiError';
      this.status = Number(status) || 0;
      this.code = code || 'request_error';
    }
  }

  const API = {
    bases: resolveBases(),
    base: resolveBases()[0] || '',
    token: safeStorageGet(TOKEN_KEY) || null,
    account: null,
    enabled: false,
    timeoutMs: Math.max(2000, Number(CONFIG.requestTimeoutMs) || 15000),
    ApiError,
    online: false,
    lastError: null
  };

  try {
    const cached = JSON.parse(safeStorageGet(ACCOUNT_KEY) || 'null');
    if (cached && typeof cached.name === 'string') API.account = cached;
  } catch (e) {
    API.account = null;
  }

  API.enabled = !!API.base;

  API.isNetworkError = function (error) {
    return !!error && (!error.status || error.status === 0);
  };

  API.isUnavailable = function (error) {
    const status = Number(error && error.status) || 0;
    return status === 0 || status === 404 || status >= 500;
  };

  API.storeSession = function (token, account) {
    API.token = token || null;
    API.account = account || null;
    safeStorageSet(TOKEN_KEY, API.token);
    safeStorageSet(ACCOUNT_KEY, account ? JSON.stringify(account) : null);
  };

  API.clearSession = function () {
    API.token = null;
    API.account = null;
    safeStorageSet(TOKEN_KEY, null);
    safeStorageSet(ACCOUNT_KEY, null);
  };

  API.getCachedAccount = function () {
    return API.account ? Object.assign({}, API.account) : null;
  };

  async function requestOnce(base, path, opts) {
    const headers = { Accept: 'application/json' };
    if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
    const authToken = opts.token || API.token;
    if (opts.auth !== false && authToken) headers.Authorization = 'Bearer ' + authToken;

    const controller = new AbortController();
    const timer = setTimeout(function () { controller.abort(); }, API.timeoutMs);
    try {
      const response = await fetch(base + path, {
        method: opts.method || 'GET',
        headers,
        body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
        signal: controller.signal,
        cache: 'no-store',
        credentials: 'omit',
        mode: 'cors',
        keepalive: !!opts.keepalive
      });
      const text = await response.text();
      let data = null;
      if (text) {
        try { data = JSON.parse(text); } catch (e) { data = null; }
      }
      if (!response.ok) {
        const error = data && data.error ? data.error : null;
        throw new ApiError(
          (error && error.message) || 'O servidor respondeu com erro (' + response.status + ').',
          response.status,
          (error && error.code) || 'request_error'
        );
      }
      API.online = true;
      API.lastError = null;
      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        API.lastError = error;
        if (API.isUnavailable(error)) API.online = false;
        throw error;
      }
      if (error && error.name === 'AbortError') {
        API.online = false;
        const timeout = new ApiError('O servidor demorou para responder.', 0, 'timeout');
        API.lastError = timeout;
        throw timeout;
      }
      API.online = false;
      const network = new ApiError('Não foi possível falar com o servidor.', 0, 'network');
      API.lastError = network;
      throw network;
    } finally {
      clearTimeout(timer);
    }
  }

  /* Tenta os servidores configurados em ordem. Se o primeiro estiver fora
     do ar (404, 5xx ou rede), cai para o proximo sem quebrar o jogo. */
  async function request(path, options) {
    const opts = options || {};
    const bases = API.bases && API.bases.length ? API.bases : (API.base ? [API.base] : []);
    if (!bases.length) {
      throw new ApiError('Servidor não configurado neste cliente.', 0, 'offline');
    }
    let lastError = null;
    for (let i = 0; i < bases.length; i++) {
      const base = bases[i];
      try {
        const data = await requestOnce(base, path, opts);
        if (API.base !== base) {
          API.base = base;
          safeStorageSet(BASE_KEY, base);
        }
        return data;
      } catch (error) {
        lastError = error;
        const canRetry = API.isUnavailable(error) && i < bases.length - 1;
        if (!canRetry) throw error;
      }
    }
    throw lastError;
  }

  API.health = function () {
    return request('/api/health', { auth: false });
  };

  API.createAccount = async function (payload) {
    const data = await request('/api/accounts', {
      method: 'POST',
      body: {
        name: payload.name,
        pin: payload.pin,
        save: payload.save
      },
      auth: false
    });
    API.storeSession(data.token, data.account);
    return data;
  };

  API.login = async function (payload) {
    const data = await request('/api/accounts/login', {
      method: 'POST',
      body: { name: payload.name, pin: payload.pin },
      auth: false
    });
    API.storeSession(data.token, data.account);
    return data;
  };

  API.logout = async function () {
    const token = API.token;
    API.clearSession();
    if (!API.base || !token) return;
    try {
      await request('/api/accounts/logout', { method: 'POST', token });
    } catch (e) {
      // O token local já foi removido; a sessão remota expira sozinha.
    }
  };

  API.me = async function () {
    const data = await request('/api/me');
    if (data && data.account) API.storeSession(API.token, data.account);
    return data;
  };

  API.putSave = async function (save) {
    return request('/api/me/save', {
      method: 'PUT',
      body: { save }
    });
  };

  API.leaderboard = function (limit) {
    return request('/api/leaderboard?limit=' + encodeURIComponent(limit || 10), { auth: false });
  };

  API.submitRun = function (run) {
    return request('/api/runs', {
      method: 'POST',
      body: run
    });
  };

  window.KC_API = API;
})();
