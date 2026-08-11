import { create } from 'zustand';
import api from '../utils/api';

interface User {
  id: number;
  username: string;
  email: string;
  role: 'ADMIN' | 'SALES' | 'WAREHOUSE' | 'ACCOUNTS';
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  user?: T;
  token?: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  checkAuth: () => Promise<void>;
  loginUser: (credentials: { email: string; password: string }) => Promise<void>;
  registerUser: (userData: { username: string; email: string; password: string; role: string }) => Promise<void>;
  logoutUser: () => void;
  clearAuthError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  error: null,
  isAuthenticated: false,

  checkAuth: async () => {
    set({ loading: true });
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      set({ user: null, isAuthenticated: false, loading: false });
      return;
    }
    try {
      // api.ts response interceptor returns response.data directly,
      // so the resolved value IS the response body (ApiResponse<User>)
      const res = await api.get<ApiResponse<User>>('/auth/me') as unknown as ApiResponse<User>;
      if (res.success && res.user) {
        set({ user: res.user, isAuthenticated: true, loading: false, error: null });
      } else {
        localStorage.removeItem('token');
        set({ user: null, isAuthenticated: false, loading: false });
      }
    } catch {
      localStorage.removeItem('token');
      set({ user: null, isAuthenticated: false, loading: false });
    }
  },

  loginUser: async ({ email, password }) => {
    set({ loading: true, error: null });
    try {
      // api.ts response interceptor returns response.data directly,
      // so the resolved value IS the response body (ApiResponse<User>)
      const res = await api.post<ApiResponse<User>>('/auth/login', { email, password }) as unknown as ApiResponse<User>;
      if (res.success && res.token) {
        localStorage.setItem('token', res.token);
        set({ user: res.user || null, isAuthenticated: true, loading: false, error: null });
      } else {
        set({ loading: false, error: 'Login failed' });
        throw new Error('Login failed');
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Login failed';
      set({ loading: false, error: message });
      throw error instanceof Error ? error : new Error(message);
    }
  },

  registerUser: async ({ username, email, password, role }) => {
    set({ loading: true, error: null });
    try {
      // api.ts response interceptor returns response.data directly,
      // so the resolved value IS the response body (ApiResponse<User>)
      const res = await api.post<ApiResponse<User>>('/auth/register', { username, email, password, role }) as unknown as ApiResponse<User>;
      if (res.success && res.token) {
        localStorage.setItem('token', res.token);
        set({ user: res.user || null, isAuthenticated: true, loading: false, error: null });
      } else {
        set({ loading: false, error: 'Registration failed' });
        throw new Error('Registration failed');
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      set({ loading: false, error: message });
      throw error instanceof Error ? error : new Error(message);
    }
  },

  logoutUser: () => {
    localStorage.removeItem('token');
    set({ user: null, isAuthenticated: false, loading: false, error: null });
  },

  clearAuthError: () => {
    set({ error: null });
  },
}));
