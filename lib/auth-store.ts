import { create } from 'zustand';
import { User } from '@/types';
import { apiFetch } from './api';

const USER_CACHE_KEY = 'markus_user';

const ls = {
  get: (k: string): string | null => { try { return window.localStorage.getItem(k) } catch { return null } },
  set: (k: string, v: string): void => { try { window.localStorage.setItem(k, v) } catch {} },
  del: (k: string): void => { try { window.localStorage.removeItem(k) } catch {} },
};

// Cookie helpers — o middleware.ts do Next.js lê o cookie para proteção server-side.
// Não pode ser httpOnly pois é setado via JS; mas provê proteção contra SSR sem token.
const ck = {
  set: (name: string, value: string) => {
    try {
      const secure = location.protocol === 'https:' ? '; Secure' : ''
      document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; SameSite=Strict; Max-Age=86400${secure}`
    } catch {}
  },
  del: (name: string) => {
    try {
      document.cookie = `${name}=; Path=/; Max-Age=0`
    } catch {}
  },
};

function loadCachedUser(): User | null {
  try {
    const raw = ls.get(USER_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveUserCache(user: User) {
  try {
    ls.set(USER_CACHE_KEY, JSON.stringify(user));
  } catch {}
}

function clearUserCache() {
  ls.del(USER_CACHE_KEY);
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email, password) => {
    const { access_token, refresh_token } = await apiFetch<{ access_token: string; refresh_token: string }>('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    ls.set('markus_at', access_token);
    ls.set('markus_rt', refresh_token);
    ck.set('markus_at', access_token);

    await get().fetchMe();
  },

  logout: async () => {
    const rt = ls.get('markus_rt');
    if (rt) {
      try {
        await apiFetch('/api/v1/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: rt }),
        });
      } catch {}
    }
    ls.del('markus_at');
    ls.del('markus_rt');
    ck.del('markus_at');
    clearUserCache();
    set({ user: null, isAuthenticated: false });
    window.location.href = '/login';
  },

  fetchMe: async () => {
    const user = await apiFetch<User>('/api/v1/auth/me');
    saveUserCache(user);
    set({ user, isAuthenticated: true, isLoading: false });
  },

  initialize: async () => {
    const at = ls.get('markus_at');
    if (!at) {
      clearUserCache();
      set({ isLoading: false });
      return;
    }

    // Show cached user immediately to avoid blank screen
    const cached = loadCachedUser();
    if (cached) {
      set({ user: cached, isAuthenticated: true, isLoading: false });
    }

    try {
      await get().fetchMe();
    } catch (error) {
      const msg = error instanceof Error ? error.message : '';
      const isAuthFailure =
        msg === 'Session expired' ||
        msg === 'no_refresh_token' ||
        msg === 'refresh_failed';

      if (isAuthFailure) {
        // Real auth error — clear everything and redirect
        clearUserCache();
        set({ user: null, isAuthenticated: false, isLoading: false });
      } else {
        // Network error (API momentaneamente down) — manter sessão com cache
        // O usuário permanece logado; requests individuais vão falhar mas não deslogam
        set({ isLoading: false });
        if (!cached) {
          // Sem cache e sem rede — não há como verificar, redireciona
          set({ isAuthenticated: false });
        }
      }
    }
  },
}));
