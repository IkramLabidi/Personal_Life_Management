import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem('lifeos_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    const boot = async () => {
      const token = localStorage.getItem('lifeos_token');
      if (!token) {
        setBooting(false);
        return;
      }
      try {
        const { data } = await api.get('/auth/me');
        setUser(data.user);
        localStorage.setItem('lifeos_user', JSON.stringify(data.user));
      } catch {
        localStorage.removeItem('lifeos_token');
        localStorage.removeItem('lifeos_user');
        setUser(null);
      } finally {
        setBooting(false);
      }
    };
    boot();
  }, []);

  const persist = (data) => {
    localStorage.setItem('lifeos_token', data.token);
    localStorage.setItem('lifeos_user', JSON.stringify(data.user));
    setUser(data.user);
  };

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    persist(data);
    return data.user;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password });
    persist(data);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('lifeos_token');
    localStorage.removeItem('lifeos_user');
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, booting, isAuthenticated: Boolean(user), login, register, logout }),
    [user, booting, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
