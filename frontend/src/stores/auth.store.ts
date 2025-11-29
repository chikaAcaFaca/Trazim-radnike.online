'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Types
export interface User {
  id: string;
  email: string;
  phone: string | null;
  phoneVerified: boolean;
  emailVerified: boolean;
  role: 'GUEST' | 'EMPLOYER' | 'ADMIN';
  company?: {
    id: string;
    name: string;
    country: string;
    city: string | null;
  } | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  setUser: (user: User | null) => void;
  setTokens: (tokens: AuthTokens | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  login: (user: User, tokens: AuthTokens) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  refreshTokens: (tokens: AuthTokens) => void;
  clearError: () => void;
}

type AuthStore = AuthState & AuthActions;

const initialState: AuthState = {
  user: null,
  tokens: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
        }),

      setTokens: (tokens) => set({ tokens }),

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      login: (user, tokens) =>
        set({
          user,
          tokens,
          isAuthenticated: true,
          error: null,
        }),

      logout: () =>
        set({
          ...initialState,
        }),

      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),

      refreshTokens: (tokens) =>
        set({
          tokens,
        }),

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      storage: typeof window !== 'undefined'
        ? createJSONStorage(() => localStorage)
        : undefined,
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Selector hooks for better performance
export const useUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useAuthTokens = () => useAuthStore((state) => state.tokens);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
export const useAuthError = () => useAuthStore((state) => state.error);

// Helper to get access token
export const getAccessToken = () => {
  const tokens = useAuthStore.getState().tokens;
  return tokens?.accessToken || null;
};
