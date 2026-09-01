import { create } from 'zustand';
import { User, AuthTokens } from '@/types';
import { authApi } from '@/lib/api/auth';

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (phoneNumber: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  setTokens: (tokens: AuthTokens | null) => void;
  initializeAuth: () => void;
}

let isListenersAttached = false;

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  tokens: null,
  isAuthenticated: false,
  isLoading: true,

  initializeAuth: () => {
    if (typeof window === 'undefined') return;

    try {
      const storedTokens = localStorage.getItem('auth_tokens');
      const storedUser = localStorage.getItem('auth_user');

      if (storedTokens && storedUser) {
        const tokens: AuthTokens = JSON.parse(storedTokens);
        const user: User = JSON.parse(storedUser);

        set({
          user,
          tokens,
          isAuthenticated: !!tokens.access.token,
          isLoading: false,
        });
      } else {
        set({ user: null, tokens: null, isAuthenticated: false, isLoading: false });
      }
    } catch {
      set({ user: null, tokens: null, isAuthenticated: false, isLoading: false });
    }

    if (!isListenersAttached) {
      isListenersAttached = true;
      window.addEventListener('auth_token_refreshed', () => {
        try {
          const storedTokens = localStorage.getItem('auth_tokens');
          if (storedTokens) {
            const tokens = JSON.parse(storedTokens);
            set({ tokens, isAuthenticated: true });
          }
        } catch {
          // Ignore
        }
      });

      window.addEventListener('auth_logout', () => {
        set({ user: null, tokens: null, isAuthenticated: false });
      });
    }
  },

  login: async (phoneNumber: string, password: string) => {
    set({ isLoading: true });
    try {
      const response = await authApi.login({ phoneNumber, password });
      localStorage.setItem('auth_tokens', JSON.stringify(response.tokens));
      localStorage.setItem('auth_user', JSON.stringify(response.user));

      set({
        user: response.user,
        tokens: response.tokens,
        isAuthenticated: true,
        isLoading: false,
      });

      return response.user;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    const { tokens } = get();
    if (tokens?.refresh?.token) {
      try {
        await authApi.logout(tokens.refresh.token);
      } catch {
        // Ignore backend logout error if already expired
      }
    }
    localStorage.removeItem('auth_tokens');
    localStorage.removeItem('auth_user');
    set({ user: null, tokens: null, isAuthenticated: false, isLoading: false });
  },

  setUser: (user) => {
    if (user) {
      localStorage.setItem('auth_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('auth_user');
    }
    set({ user });
  },

  setTokens: (tokens) => {
    if (tokens) {
      localStorage.setItem('auth_tokens', JSON.stringify(tokens));
      set({ tokens, isAuthenticated: true });
    } else {
      localStorage.removeItem('auth_tokens');
      set({ tokens: null, isAuthenticated: false });
    }
  },
}));
