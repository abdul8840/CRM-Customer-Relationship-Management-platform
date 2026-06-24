import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, X } from 'lucide-react';
import AppRoutes from './routes';
import { useAuthStore } from './stores/authStore';
import { useThemeStore } from './stores/themeStore';
import { announcementsApi } from './api/endpoints';

export default function App() {
  const bootstrap = useAuthStore((s) => s.bootstrap);
  const user = useAuthStore((s) => s.user);
  const theme = useThemeStore((s) => s.theme);
  const [dismissed, setDismissed] = useState(() => {
    try { return JSON.parse(localStorage.getItem('dismissed_announcements') || '[]'); }
    catch { return []; }
  });

  // Bootstrap session
  useEffect(() => { bootstrap(); }, [bootstrap]);

  // Apply theme
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // Fetch active announcements (only when authenticated)
  const { data: announcements = [] } = useQuery({
    queryKey: ['active-announcements'],
    queryFn: () => announcementsApi.list().then((r) => (Array.isArray(r) ? r : r.items || [])),
    enabled: !!user,
    refetchInterval: 5 * 60 * 1000, // every 5 minutes
  });

  const visible = announcements.filter(
    (a) => a.is_active && !dismissed.includes(a.id) && (a.audience === 'all' || a.audience === 'admins')
  );

  const dismiss = (id) => {
    const next = [...dismissed, id];
    setDismissed(next);
    localStorage.setItem('dismissed_announcements', JSON.stringify(next));
  };

  const typeColor = {
    info: 'bg-blue-600',
    success: 'bg-green-600',
    warning: 'bg-amber-600',
    critical: 'bg-red-600',
  };

  return (
    <>
      {/* System-wide announcement banner */}
      {visible.length > 0 && (
        <div className="sticky top-0 z-[60]">
          {visible.slice(0, 1).map((a) => (
            <div key={a.id} className={`${typeColor[a.type] || 'bg-blue-600'} text-white px-4 py-2.5 flex items-center justify-between gap-4 text-sm`}>
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <span className="font-semibold">{a.title}</span>
                <span className="opacity-90 truncate hidden sm:inline">— {a.content}</span>
              </div>
              <button
                onClick={() => dismiss(a.id)}
                className="rounded p-1 hover:bg-white/20 flex-shrink-0"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <AppRoutes />
    </>
  );
}