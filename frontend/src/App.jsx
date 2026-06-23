import { useEffect } from 'react';
import AppRoutes from './routes';
import { useAuthStore } from './stores/authStore';
import { useThemeStore } from './stores/themeStore';

export default function App() {
  const { bootstrap } = useAuthStore();
  const { theme } = useThemeStore();
  useEffect(() => { bootstrap(); }, [bootstrap]);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);
  return <AppRoutes />;
}