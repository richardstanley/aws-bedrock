import { useState, useEffect, useCallback } from 'react';
import { CognitoUserSession } from 'amazon-cognito-identity-js';
import { signIn, signOut, getCurrentSession, getUsername } from '@/lib/auth';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  username: string | null;
  error: string | null;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    username: null,
    error: null,
  });

  const checkAuthStatus = useCallback(async () => {
    try {
      const session = await getCurrentSession();
      const username = await getUsername();
      setAuthState({
        isAuthenticated: session !== null && session.isValid(),
        isLoading: false,
        username,
        error: null,
      });
    } catch (error) {
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        username: null,
        error: 'Failed to check authentication status',
      });
    }
  }, []);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const login = async (username: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      const response = await signIn(username, password);
      
      if (response.success) {
        await checkAuthStatus();
      } else {
        setAuthState({
          isAuthenticated: false,
          isLoading: false,
          username: null,
          error: response.error || 'Login failed',
        });
      }
    } catch (error) {
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        username: null,
        error: 'Login failed',
      });
    }
  };

  const logout = async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      await signOut();
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        username: null,
        error: null,
      });
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Logout failed',
      }));
    }
  };

  return {
    ...authState,
    login,
    logout,
    refreshAuthStatus: checkAuthStatus,
  };
} 