import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authStorage, userAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => authStorage.getUser());
  const [token, setToken] = useState(() => authStorage.getToken());
  const [initializing, setInitializing] = useState(true);

  const isAuthenticated = Boolean(token);

  // Clears all auth state (used by logout and on a global 401).
  const clear = useCallback(() => {
    authStorage.clearAll();
    setToken(null);
    setUser(null);
  }, []);

  // Persist a token, then hydrate the user profile from the backend.
  const login = useCallback(async (newToken) => {
    authStorage.setToken(newToken);
    setToken(newToken);
    try {
      const res = await userAPI.getProfile();
      const profile = res?.data?.data?.user ?? null;
      if (profile) {
        authStorage.setUser(profile);
        setUser(profile);
      }
      return profile;
    } catch {
      // Token is stored; profile hydration can be retried later.
      return null;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await userAPI.logout();
    } catch {
      // Even if the server call fails, drop local credentials.
    }
    clear();
  }, [clear]);

  // React to a forced sign-out triggered by the Axios 401 interceptor.
  useEffect(() => {
    const onUnauthorized = () => clear();
    window.addEventListener('auth:unauthorized', onUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', onUnauthorized);
  }, [clear]);

  // On first load, if we have a token but no cached user, hydrate it once.
  useEffect(() => {
    let active = true;
    (async () => {
      if (token && !user) {
        try {
          const res = await userAPI.getProfile();
          const profile = res?.data?.data?.user ?? null;
          if (active && profile) {
            authStorage.setUser(profile);
            setUser(profile);
          }
        } catch {
          // Interceptor handles 401; ignore otherwise.
        }
      }
      if (active) setInitializing(false);
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = { user, token, isAuthenticated, initializing, login, logout, setUser };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
