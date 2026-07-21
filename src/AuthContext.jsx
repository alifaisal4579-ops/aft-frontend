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
    api.trySilentLogin().then((u) => {
      if (!cancelled) {
        setUser(u);
        setLoading(false);
        if (u) setSessionMarker(); else clearSessionMarker();
      }
    });
    return () => { cancelled = true; };
  }, []);

  const signup = useCallback(async (email, password, blofinUid) => {
    const { ok, body } = await api.signup(email, password, blofinUid);
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
