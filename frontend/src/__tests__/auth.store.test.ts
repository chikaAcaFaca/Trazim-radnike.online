import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';

// Mock zustand persist middleware
vi.mock('zustand/middleware', () => ({
  persist: (config: any) => config,
  createJSONStorage: () => undefined,
}));

// Import after mocks
import {
  useAuthStore,
  useUser,
  useIsAuthenticated,
  useAuthTokens,
  useAuthLoading,
  useAuthError,
  getAccessToken,
  User,
  AuthTokens,
} from '@/stores/auth.store';

describe('Auth Store', () => {
  const mockUser: User = {
    id: 'user-123',
    email: 'test@test.com',
    phone: '+381601234567',
    phoneVerified: true,
    emailVerified: false,
    role: 'EMPLOYER',
    company: {
      id: 'company-123',
      name: 'Test Company',
      country: 'Serbia',
      city: 'Belgrade',
    },
  };

  const mockTokens: AuthTokens = {
    accessToken: 'test-access-token',
    refreshToken: 'test-refresh-token',
    expiresIn: 900,
  };

  beforeEach(() => {
    // Reset store to initial state
    const { result } = renderHook(() => useAuthStore());
    act(() => {
      result.current.logout();
    });
  });

  describe('initial state', () => {
    it('should have null user and tokens', () => {
      const { result } = renderHook(() => useAuthStore());

      expect(result.current.user).toBeNull();
      expect(result.current.tokens).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('setUser', () => {
    it('should set user and update isAuthenticated', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setUser(mockUser);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should set isAuthenticated to false when user is null', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setUser(mockUser);
      });
      expect(result.current.isAuthenticated).toBe(true);

      act(() => {
        result.current.setUser(null);
      });
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('setTokens', () => {
    it('should set tokens', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setTokens(mockTokens);
      });

      expect(result.current.tokens).toEqual(mockTokens);
    });
  });

  describe('setLoading', () => {
    it('should set loading state', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setLoading(true);
      });
      expect(result.current.isLoading).toBe(true);

      act(() => {
        result.current.setLoading(false);
      });
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('setError', () => {
    it('should set error message', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setError('Test error');
      });

      expect(result.current.error).toBe('Test error');
    });
  });

  describe('login', () => {
    it('should set user, tokens, and isAuthenticated', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.login(mockUser, mockTokens);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.tokens).toEqual(mockTokens);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.error).toBeNull();
    });

    it('should clear existing error on login', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setError('Previous error');
      });
      expect(result.current.error).toBe('Previous error');

      act(() => {
        result.current.login(mockUser, mockTokens);
      });
      expect(result.current.error).toBeNull();
    });
  });

  describe('logout', () => {
    it('should reset state to initial values', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.login(mockUser, mockTokens);
        result.current.setError('Some error');
        result.current.setLoading(true);
      });

      act(() => {
        result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.tokens).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('updateUser', () => {
    it('should update user with partial data', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setUser(mockUser);
      });

      act(() => {
        result.current.updateUser({ phoneVerified: true, emailVerified: true });
      });

      expect(result.current.user?.phoneVerified).toBe(true);
      expect(result.current.user?.emailVerified).toBe(true);
      expect(result.current.user?.email).toBe(mockUser.email);
    });

    it('should not update if user is null', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.updateUser({ phoneVerified: true });
      });

      expect(result.current.user).toBeNull();
    });
  });

  describe('refreshTokens', () => {
    it('should update tokens', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setTokens(mockTokens);
      });

      const newTokens: AuthTokens = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresIn: 1800,
      };

      act(() => {
        result.current.refreshTokens(newTokens);
      });

      expect(result.current.tokens).toEqual(newTokens);
    });
  });

  describe('clearError', () => {
    it('should clear error', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setError('Test error');
      });
      expect(result.current.error).toBe('Test error');

      act(() => {
        result.current.clearError();
      });
      expect(result.current.error).toBeNull();
    });
  });

  describe('selector hooks', () => {
    it('useUser should return user', () => {
      const { result: storeResult } = renderHook(() => useAuthStore());
      const { result: userResult } = renderHook(() => useUser());

      act(() => {
        storeResult.current.setUser(mockUser);
      });

      // Re-render to get updated value
      const { result: updatedUserResult } = renderHook(() => useUser());
      expect(updatedUserResult.current).toEqual(mockUser);
    });

    it('useIsAuthenticated should return authentication status', () => {
      const { result: storeResult } = renderHook(() => useAuthStore());
      const { result: authResult } = renderHook(() => useIsAuthenticated());

      expect(authResult.current).toBe(false);

      act(() => {
        storeResult.current.setUser(mockUser);
      });

      const { result: updatedAuthResult } = renderHook(() => useIsAuthenticated());
      expect(updatedAuthResult.current).toBe(true);
    });

    it('useAuthTokens should return tokens', () => {
      const { result: storeResult } = renderHook(() => useAuthStore());

      act(() => {
        storeResult.current.setTokens(mockTokens);
      });

      const { result: tokensResult } = renderHook(() => useAuthTokens());
      expect(tokensResult.current).toEqual(mockTokens);
    });

    it('useAuthLoading should return loading state', () => {
      const { result: storeResult } = renderHook(() => useAuthStore());

      act(() => {
        storeResult.current.setLoading(true);
      });

      const { result: loadingResult } = renderHook(() => useAuthLoading());
      expect(loadingResult.current).toBe(true);
    });

    it('useAuthError should return error', () => {
      const { result: storeResult } = renderHook(() => useAuthStore());

      act(() => {
        storeResult.current.setError('Test error');
      });

      const { result: errorResult } = renderHook(() => useAuthError());
      expect(errorResult.current).toBe('Test error');
    });
  });

  describe('getAccessToken', () => {
    it('should return access token when available', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setTokens(mockTokens);
      });

      expect(getAccessToken()).toBe(mockTokens.accessToken);
    });

    it('should return null when no tokens', () => {
      expect(getAccessToken()).toBeNull();
    });
  });
});
