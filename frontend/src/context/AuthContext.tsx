'use client';

import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '../store/useAuthStore';

interface User {
  id: number;
  username: string;
  email: string;
  role: 'ADMIN' | 'SALES' | 'WAREHOUSE' | 'ACCOUNTS';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, role: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  hasRole: (roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const initialized = useRef(false);

  const {
    user,
    loading,
    isAuthenticated,
    checkAuth,
    loginUser,
    registerUser,
    logoutUser,
  } = useAuthStore();

  // Check authentication only once when the application starts.
  useEffect(() => {
    if (initialized.current) return;

    initialized.current = true;

    void checkAuth();
  }, [checkAuth]);

  // Handle redirects separately from authentication initialization.
  useEffect(() => {
    if (loading) return;

    const publicRoutes = ['/login', '/register'];
    const isPublicRoute = publicRoutes.includes(pathname);

    if (!isAuthenticated && !isPublicRoute) {
      router.replace('/login');
      return;
    }

    if (isAuthenticated && isPublicRoute) {
      router.replace('/');
    }
  }, [loading, isAuthenticated, pathname, router]);

  const login = async (email: string, password: string) => {
    await loginUser({ email, password });
    router.replace('/');
  };

  const register = async (
    username: string,
    email: string,
    password: string,
    role: string
  ) => {
    await registerUser({ username, email, password, role });
    router.replace('/');
  };

  const logout = () => {
    logoutUser();
    router.replace('/login');
  };

  const hasRole = (roles: string[]) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}