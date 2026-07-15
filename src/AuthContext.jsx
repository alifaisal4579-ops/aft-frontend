// context/AuthContext.jsx -- holds the current user (or null) and exposes
// login/signup/logout. On mount, attempts a silent login via the httpOnly
// refresh cookie so a page refresh doesn't force the user to log in again,
// without ever touching localStorage.
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as api from './client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true while we check for an existing session

  useEffect(() => {
    let cancelled = false;
    api.trySilentLogin().then((u) => {
      if (!cancelled) { setUser(u); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, []);

  const signup = useCallback(async (email, password) => {
    const { ok, body } = await api.signup(email, password);
    if (ok) setUser(body.user);
    return { ok, error: ok ? null : body.error };
  }, []);

  const login = useCallback(async (email, password) => {
    const { ok, body } = await api.login(email, password);
    if (ok) setUser(body.user);
    return { ok, error: ok ? null : body.error };
  }, []);

  const logout = useCallback(async () => {
    await api.logout();
    setUser(null);
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
