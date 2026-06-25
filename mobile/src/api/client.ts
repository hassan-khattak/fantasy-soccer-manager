import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { AuthTokens } from '../types';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

export const ACCESS_TOKEN_KEY  = 'access_token';
export const REFRESH_TOKEN_KEY = 'refresh_token';

const client = axios.create({ baseURL: BASE_URL });

// Inject access token on every request
client.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401: attempt silent refresh, retry once, then logout
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const rawRefresh = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
        if (!rawRefresh) throw new Error('No refresh token');

        const { data } = await axios.post<AuthTokens>(
          `${BASE_URL}/auth/refresh`,
          { refresh_token: rawRefresh }
        );

        await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, data.access_token);
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, data.refresh_token);

        originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
        return client(originalRequest);
      } catch {
        // Refresh failed — clear tokens so AuthContext navigates to auth screens
        await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
        await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default client;
