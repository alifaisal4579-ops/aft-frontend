// context/AuthContext.jsx -- holds the current user (or null) and exposes
// login/signup/logout. On mount, attempts a silent login via the httpOnly
// refresh cookie so a page refresh doesn't force the user to log in again,
// without ever touching localStorage.
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as api from './client';

const AuthContext = createContext(null);

// A plain, non-sensitive marker cookie set on THIS domain (alifaisal.trade)
// purely so the Cloudflare Worker gatekeeper (worker.js) can check "is this
// browser logged in" before serving /aft-tools-suite.html directly. The
// REAL session cookie (refreshToken) is httpOnly and scoped to
// api.alifaisal.trade/api/auth only -- it never reaches this domain at all,
// so the Worker can't read it. This marker carries no sensitive data, just
// a boolean flag, and is never trusted for anything security-critical on
// the backend (the backend's own JWT checks are untouched and unaffected).
const SESSION_MARKER = 'aft_session';
function setSessionMarker() {
  document.cookie = `${SESSION_MARKER}=1; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;
}
function clearSessionMarker() {
  document.cookie = `${SESSION_MARKER}=; path=/; max-age=0`;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true while we check for an existing session

  useEffect(() => {
    let cancelled = false;

    async function runSilentLogin(isBfcacheRestore) {
      const u = await api.trySilentLogin();
      if (cancelled) return;
      setUser(u);
      if (!isBfcacheRestore) setLoading(false);
      if (u) setSessionMarker(); else clearSessionMarker();
    }

    runSilentLogin(false);

    // Browsers can restore a full-page-navigated-away-and-back visit from
    // the back/forward cache (bfcache) instead of reloading from scratch --
    // React's component tree and this provider's state come back exactly
    // as they were, but the access token held in memory by client.js does
    // NOT survive that (it's a plain JS module variable, not persisted
    // anywhere), and no fresh mount happens to trigger the effect above
    // again. Without this, clicking a tool link (a real navigation away)
    // and then pressing Back looks like being logged out, even though the
    // httpOnly refresh cookie is still perfectly valid. `pageshow` with
    // `event.persisted === true` is the standard way to detect this and
    // silently re-establish the access token in the background (no
    // loading-screen flash, since we still have the last-known user to
    // show while this resolves).
    function onPageShow(event) {
      if (event.persisted) runSilentLogin(true);
    }
    window.addEventListener('pageshow', onPageShow);

    return () => {
      cancelled = true;
      window.removeEventListener('pageshow', onPageShow);
    };
  }, []);

  const signup = useCallback(async (email, password, blofinUid, fullName) => {
    const { ok, body } = await api.signup(email, password, blofinUid, fullName);
    if (ok) { setUser(body.user); setSessionMarker(); }
    return { ok, error: ok ? null : body.error };
  }, []);

  const login = useCallback(async (email, password) => {
    const { ok, body } = await api.login(email, password);
    if (ok) { setUser(body.user); setSessionMarker(); }
    return { ok, error: ok ? null : body.error };
  }, []);

  const logout = useCallback(async () => {
    await api.logout();
    setUser(null);
    clearSessionMarker();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside an AuthProvider');
  return ctx;
}
