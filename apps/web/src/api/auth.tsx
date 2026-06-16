import React, { createContext, useContext, useState, useCallback } from 'react';
import { ApiClient } from '@caddy-manager/shared-api';
import { setApiClient } from './client';

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
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem('auth'));

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    try {
      const client = new ApiClient('/api', username, password);
      await client.getServers();
      localStorage.setItem('auth', JSON.stringify({ username, password }));
      setApiClient(client);
      setIsAuthenticated(true);
      return true;
    } catch {
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('auth');
    setApiClient(new ApiClient('/api', 'admin', 'admin'));
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
