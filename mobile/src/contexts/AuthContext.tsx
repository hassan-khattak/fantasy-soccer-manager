import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import client, { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from '../api/client';
import { AuthTokens } from '../types';

interface AuthContextValue {
  accessToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading]     = useState(true);

  // Rehydrate token on app launch
  useEffect(() => {
    SecureStore.getItemAsync(ACCESS_TOKEN_KEY)
      .then((token) => setAccessToken(token))
      .finally(() => setIsLoading(false));
  }, []);

  const storeTokens = async (tokens: AuthTokens) => {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY,  tokens.access_token);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refresh_token);
    setAccessToken(tokens.access_token);
  };

  const clearTokens = async () => {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    setAccessToken(null);
  };

  const login = async (email: string, password: string) => {
    const { data } = await client.post<AuthTokens>('/auth/login', {
      user: { email, password },
    });
    await storeTokens(data);
  };

  const register = async (email: string, password: string) => {
    const { data } = await client.post<AuthTokens>('/auth/register', {
      user: { email, password, password_confirmation: password },
    });
    await storeTokens(data);
  };

  const logout = async () => {
    try {
      const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
      await client.delete('/auth/logout', { data: { refresh_token: refreshToken } });
    } catch {
      // Best-effort — clear tokens regardless
    } finally {
      await clearTokens();
    }
  };

  return (
    <AuthContext.Provider value={{ accessToken, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
