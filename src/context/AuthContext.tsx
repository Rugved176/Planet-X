import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types.ts';
import { api, getStoredToken, setStoredToken, removeStoredToken } from '../lib/api.ts';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; name: string; phone?: string; college?: string }) => Promise<void>;
  logout: () => void;
  updateProfile: (data: { name?: string; phone?: string; college?: string }) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    const currentToken = getStoredToken();
    if (!currentToken) {
      setUser(null);
      setToken(null);
      setLoading(false);
      return;
    }

    try {
      const res = await api.getMe();
      setUser(res.user);
      setToken(currentToken);
    } catch (err) {
      console.warn('Session expired or invalid, logging out:', err);
      removeStoredToken();
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.login({ email, password });
    setStoredToken(res.token);
    setToken(res.token);
    setUser(res.user);
  };

  const register = async (data: { email: string; password: string; name: string; phone?: string; college?: string }) => {
    const res = await api.register(data);
    setStoredToken(res.token);
    setToken(res.token);
    setUser(res.user);
  };

  const logout = () => {
    removeStoredToken();
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (data: { name?: string; phone?: string; college?: string }) => {
    const res = await api.updateProfile(data);
    setUser(res.user);
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAdmin,
        login,
        register,
        logout,
        updateProfile,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
