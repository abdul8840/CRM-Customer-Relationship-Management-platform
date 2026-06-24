import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '@/api/endpoints';

const ADMIN_ROLES = ['super_admin', 'admin', 'manager'];

export const useAuthStore = create(
  persist((set, get) => ({
    user: null, accessToken: null, refreshToken: null, booted: false,
    bootstrap: async () => {
      if (!get().accessToken) return set({ booted: true });
      try {
        const user = await authApi.me();
        if (!ADMIN_ROLES.includes(user.role?.slug)) throw new Error('not_admin');
        set({ user, booted: true });
      } catch { set({ user: null, accessToken: null, refreshToken: null, booted: true }); }
    },
    login: async (creds) => {
      const data = await authApi.login(creds);
      if (!ADMIN_ROLES.includes(data.user.role?.slug)) {
        throw new Error('You do not have admin access');
      }
      set({ user: data.user, accessToken: data.accessToken, refreshToken: data.refreshToken });
      return data.user;
    },
    refresh: async () => {
      const rt = get().refreshToken;
      const data = await authApi.refresh({ refresh_token: rt });
      set({ accessToken: data.accessToken, refreshToken: data.refreshToken, user: data.user });
    },
    logout: async () => {
      try { await authApi.logout({ refresh_token: get().refreshToken }); } catch {}
      set({ user: null, accessToken: null, refreshToken: null });
    },
    isSuperAdmin: () => get().user?.role?.slug === 'super_admin',
  }), { name: 'crm-admin-auth', partialize: (s) => ({ accessToken: s.accessToken, refreshToken: s.refreshToken }) })
);