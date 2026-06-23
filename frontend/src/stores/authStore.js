import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '@/api/endpoints';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      booted: false,

      setAuth: ({ user, accessToken, refreshToken }) => set({ user, accessToken, refreshToken }),

      bootstrap: async () => {
        if (!get().accessToken) return set({ booted: true });
        try {
          const user = await authApi.me();
          set({ user, booted: true });
        } catch { set({ user: null, accessToken: null, refreshToken: null, booted: true }); }
      },

      login: async (creds) => {
        const data = await authApi.login(creds);
        set({ user: data.user, accessToken: data.accessToken, refreshToken: data.refreshToken });
        return data.user;
      },

      register: (d) => authApi.register(d),
      verifyEmail: (d) => authApi.verifyEmail(d),

      refresh: async () => {
        const rt = get().refreshToken;
        if (!rt) throw new Error('No refresh token');
        const data = await authApi.refresh({ refresh_token: rt });
        set({ accessToken: data.accessToken, refreshToken: data.refreshToken, user: data.user });
      },

      logout: async () => {
        try { await authApi.logout({ refresh_token: get().refreshToken }); } catch {}
        set({ user: null, accessToken: null, refreshToken: null });
      },

      hasRole: (...roles) => roles.includes(get().user?.role?.slug),
    }),
    { name: 'crm-auth', partialize: (s) => ({ accessToken: s.accessToken, refreshToken: s.refreshToken }) }
  )
);