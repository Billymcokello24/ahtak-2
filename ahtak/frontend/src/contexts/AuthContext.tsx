import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import { login as apiLogin, auth } from '../lib/api';

interface AuthContextType {
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));

  // Validate token on load; clear if expired/invalid so user isn't sent to dashboard with bad auth
  useEffect(() => {
    const t = localStorage.getItem('token');
    if (!t) return;
    auth.me().catch(() => {
      localStorage.removeItem('token');
      setToken(null);
    });
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const { token: t } = await apiLogin(username, password);
    localStorage.setItem('token', t);
    setToken(t);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        token,
        login,
        logout,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
