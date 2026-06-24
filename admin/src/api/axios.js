import axios from 'axios';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing = null;
api.interceptors.response.use(
  (r) => r,
  async (err) => {
    const { response, config } = err;
    if (response?.status === 401 && !config._retry && config.url !== '/auth/refresh') {
      config._retry = true;
      try {
        refreshing = refreshing || useAuthStore.getState().refresh();
        await refreshing;
        refreshing = null;
        config.headers.Authorization = `Bearer ${useAuthStore.getState().accessToken}`;
        return api(config);
      } catch (e) {
        refreshing = null;
        useAuthStore.getState().logout();
        return Promise.reject(e);
      }
    }
    const msg = response?.data?.message || err.message || 'Request failed';
    if (response?.status !== 401) toast.error(msg);
    return Promise.reject(err);
  }
);

export default api;