import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@/api/endpoints';
import { useAuthStore } from '@/stores/authStore';
import { io } from 'socket.io-client';
import { formatDate } from '@/lib/utils';

export const NotificationsDropdown = () => {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const { accessToken } = useAuthStore();
  const { data } = useQuery({ queryKey: ['notifications'], queryFn: () => notificationsApi.list({ limit: 10 }) });

  useEffect(() => {
    if (!accessToken) return;
    const s = io(import.meta.env.VITE_SOCKET_URL, { auth: { token: accessToken } });
    s.on('notification:new', () => qc.invalidateQueries({ queryKey: ['notifications'] }));
    return () => s.disconnect();
  }, [accessToken, qc]);

  const unread = data?.unread || 0;

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="relative rounded-lg p-2 hover:bg-muted">
        <Bell className="h-4 w-4" />
        {unread > 0 && <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center px-1">{unread > 9 ? '9+' : unread}</span>}
      </button>
      {open && (
        <>
          <div className="fixed inset-0" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-auto scrollbar-thin bg-card border border-base rounded-lg shadow-lg z-20">
            <div className="p-3 border-b border-base flex items-center justify-between">
              <h4 className="font-medium">Notifications</h4>
              <button onClick={async () => { await notificationsApi.markAllRead(); qc.invalidateQueries({ queryKey: ['notifications'] }); }} className="text-xs text-[rgb(var(--primary))]">Mark all read</button>
            </div>
            {data?.items?.length ? data.items.map((n) => (
              <div key={n.id} className={`p-3 border-b border-base ${!n.read_at ? 'bg-muted/40' : ''}`}>
                <p className="text-sm font-medium">{n.title}</p>
                <p className="text-xs text-muted-fg mt-0.5">{n.message}</p>
                <p className="text-[10px] text-muted-fg mt-1">{formatDate(n.created_at)}</p>
              </div>
            )) : <p className="p-6 text-center text-sm text-muted-fg">No notifications</p>}
          </div>
        </>
      )}
    </div>
  );
};