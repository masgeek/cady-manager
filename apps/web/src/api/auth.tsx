import React, { createContext, useContext, useState, useCallback } from 'react';
import { ApiClient } from '@caddy-manager/shared-api';
import { setApiClient, api } from './client';

interface AuthContextType {
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  login: async () => false,
  logout: () => {},
  isAuthenticated: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem('token'));

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) return false;
      const { token } = await res.json();
      localStorage.setItem('token', token);
      const client = new ApiClient('/api', token);
      setApiClient(client);
      setIsAuthenticated(true);
      return true;
    } catch {
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setApiClient(new ApiClient('/api'));
    setIsAuthenticated(false);
  }, []);

  return (
    <AuthContext.Provider value={{ login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
