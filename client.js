// api/client.js -- all backend calls go through this. SECURITY DESIGN:
// - The access token is held ONLY in memory (a module-level variable),
//   never in localStorage/sessionStorage -- so it can't be read by an XSS
//   payload that runs later, and it vanishes when the tab closes.
// - The refresh token is an httpOnly cookie the browser manages entirely;
//   this code never sees its value, only sends credentials:'include' so
//   the browser attaches it automatically to the auth backend's domain.
// - On a 401 from any authenticated call, we attempt ONE silent refresh
//   (deduplicated -- concurrent 401s share the same in-flight refresh
//   instead of firing multiple refresh requests) and retry the original
//   call once. If refresh also fails, the caller sees the 401 and the app
//   treats that as "logged out".
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

let accessToken = null;
let refreshPromise = null;

function setAccessToken(token) { accessToken = token; }
function getAccessToken() { return accessToken; }

async function rawRequest(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include', // sends the httpOnly refresh cookie on /api/auth/* calls
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(options.headers || {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  return { res, body };
}

async function doRefresh() {
  if (!refreshPromise) {
    refreshPromise = rawRequest('/api/auth/refresh', { method: 'POST' })
      .then(({ res, body }) => {
        refreshPromise = null;
        if (res.ok && body.accessToken) { setAccessToken(body.accessToken); return true; }
        setAccessToken(null);
        return false;
      })
      .catch(() => { refreshPromise = null; setAccessToken(null); return false; });
  }
  return refreshPromise;
}

// The one function the rest of the app calls. Handles the 401 -> silent
// refresh -> retry-once dance transparently.
async function apiFetch(path, options = {}) {
  let { res, body } = await rawRequest(path, options);
  if (res.status === 401 && path !== '/api/auth/refresh') {
    const refreshed = await doRefresh();
    if (refreshed) {
      ({ res, body } = await rawRequest(path, options));
    }
  }
  return { ok: res.ok, status: res.status, body };
}

async function signup(email, password) {
  const { ok, body } = await apiFetch('/api/auth/signup', { method: 'POST', body: JSON.stringify({ email, password }) });
  if (ok) setAccessToken(body.accessToken);
  return { ok, body };
}

async function login(email, password) {
  const { ok, body } = await apiFetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
  if (ok) setAccessToken(body.accessToken);
  return { ok, body };
}

async function logout() {
  await apiFetch('/api/auth/logout', { method: 'POST' });
  setAccessToken(null);
}

async function fetchMe() {
  return apiFetch('/api/auth/me');
}

// Called once when the app first loads: is there a valid session cookie
// from a previous visit? If so, silently mint a fresh access token without
// making the user log in again.
async function trySilentLogin() {
  const refreshed = await doRefresh();
  if (!refreshed) return null;
  const { ok, body } = await fetchMe();
  return ok ? body.user : null;
}

export { apiFetch, signup, login, logout, fetchMe, trySilentLogin, getAccessToken };
