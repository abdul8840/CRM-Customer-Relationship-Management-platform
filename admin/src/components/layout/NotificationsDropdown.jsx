import { useEffect, useRef, useState } from 'react';
import { Bell, Check, CheckCheck, Trash2, X, ExternalLink, Inbox } from 'lucide-react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { io } from 'socket.io-client';
import { notificationsApi } from '@/api/endpoints';
import { useAuthStore } from '@/stores/authStore';
import { cn, formatDate } from '@/lib/utils';

// Icon mapping for different notification types
const typeStyles = {
  'task.reminder': { color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400', emoji: '⏰' },
  'task.assigned': { color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400', emoji: '📋' },
  'lead.assigned': { color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400', emoji: '🎯' },
  'lead.converted': { color: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400', emoji: '✨' },
  'deal.won': { color: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400', emoji: '🏆' },
  'deal.lost': { color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400', emoji: '💔' },
  'deal.stage_changed': { color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400', emoji: '📊' },
  'subscription.activated': { color: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400', emoji: '💳' },
  'subscription.expired': { color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400', emoji: '⚠️' },
  'subscription.renewed': { color: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400', emoji: '🔄' },
  'invoice.paid': { color: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400', emoji: '✅' },
  'invoice.failed': { color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400', emoji: '❌' },
  'ticket.created': { color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400', emoji: '🎫' },
  'ticket.replied': { color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400', emoji: '💬' },
  'mention': { color: 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400', emoji: '@' },
  default: { color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300', emoji: '🔔' },
};

const getStyle = (type) => typeStyles[type] || typeStyles.default;

// Compute "time ago"
const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(date, { day: '2-digit', month: 'short' });
};

// Smart link resolver — maps notification type/data to in-app routes
const getNotificationLink = (notification) => {
  const data = notification.data || {};
  const type = notification.type || '';

  if (type.startsWith('task.') && data.task_id) return `/tasks?highlight=${data.task_id}`;
  if (type.startsWith('lead.') && data.lead_id) return `/leads?highlight=${data.lead_id}`;
  if (type.startsWith('deal.') && data.deal_id) return `/deals?highlight=${data.deal_id}`;
  if (type.startsWith('subscription.')) return '/billing';
  if (type.startsWith('invoice.')) return '/billing';
  if (type.startsWith('ticket.') && data.ticket_id) return `/support?ticket=${data.ticket_id}`;
  return null;
};

export const NotificationsDropdown = () => {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'unread'
  const dropdownRef = useRef(null);
  const socketRef = useRef(null);
  const qc = useQueryClient();
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);

  // Fetch notifications
  const { data, isLoading } = useQuery({
    queryKey: ['notifications-dropdown', activeTab],
    queryFn: () =>
      notificationsApi.list({
        limit: 15,
        ...(activeTab === 'unread' && { unread: 'true' }),
      }),
    enabled: !!accessToken && !!user,
    refetchInterval: open ? false : 60_000, // poll every 60s when closed
  });

  // Live socket connection
  useEffect(() => {
    if (!accessToken || !user) return;
    const socketUrl = import.meta.env.VITE_SOCKET_URL;
    if (!socketUrl) return;

    socketRef.current = io(socketUrl, {
      auth: { token: accessToken },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });

    socketRef.current.on('connect', () => {
      // console.debug('🔌 Socket connected');
    });

    socketRef.current.on('notification:new', (notification) => {
      // Optimistic update — prepend to list
      qc.setQueryData(['notifications-dropdown', 'all'], (old) => {
        if (!old) return old;
        return {
          ...old,
          items: [notification, ...(old.items || [])].slice(0, 15),
          total: (old.total || 0) + 1,
          unread: (old.unread || 0) + 1,
        };
      });
      qc.invalidateQueries({ queryKey: ['notifications-dropdown'] });
      qc.invalidateQueries({ queryKey: ['all-notifications'] });

      // Browser-style toast
      toast(notification.title, {
        description: notification.message,
        action: getNotificationLink(notification)
          ? { label: 'View', onClick: () => (window.location.href = getNotificationLink(notification)) }
          : undefined,
      });

      // Native browser notification (with permission)
      if ('Notification' in window && Notification.permission === 'granted' && document.hidden) {
        try {
          new Notification(notification.title, {
            body: notification.message,
            icon: '/favicon.ico',
            tag: `crm-${notification.id}`,
          });
        } catch {}
      }
    });

    socketRef.current.on('disconnect', () => {
      // console.debug('🔌 Socket disconnected');
    });

    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [accessToken, user, qc]);

  // Request browser notification permission once
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      // Ask after a small delay so it doesn't pop on page load
      const t = setTimeout(() => {
        Notification.requestPermission().catch(() => {});
      }, 5000);
      return () => clearTimeout(t);
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Escape key to close
  useEffect(() => {
    const handler = (e) => e.key === 'Escape' && setOpen(false);
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  // Mutations
  const markRead = useMutation({
    mutationFn: (id) => notificationsApi.markRead(id),
    onMutate: async (id) => {
      // Optimistic update
      await qc.cancelQueries({ queryKey: ['notifications-dropdown'] });
      const previous = qc.getQueryData(['notifications-dropdown', activeTab]);
      qc.setQueryData(['notifications-dropdown', activeTab], (old) => {
        if (!old) return old;
        return {
          ...old,
          items: old.items.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)),
          unread: Math.max(0, (old.unread || 0) - 1),
        };
      });
      return { previous };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.previous) qc.setQueryData(['notifications-dropdown', activeTab], ctx.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['notifications-dropdown'] }),
  });

  const markAllRead = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      toast.success('All notifications marked as read');
      qc.invalidateQueries({ queryKey: ['notifications-dropdown'] });
      qc.invalidateQueries({ queryKey: ['all-notifications'] });
    },
  });

  const remove = useMutation({
    mutationFn: (id) => notificationsApi.remove(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['notifications-dropdown'] });
      const previous = qc.getQueryData(['notifications-dropdown', activeTab]);
      qc.setQueryData(['notifications-dropdown', activeTab], (old) => {
        if (!old) return old;
        const wasUnread = old.items.find((n) => n.id === id && !n.read_at);
        return {
          ...old,
          items: old.items.filter((n) => n.id !== id),
          total: Math.max(0, (old.total || 0) - 1),
          unread: wasUnread ? Math.max(0, (old.unread || 0) - 1) : old.unread,
        };
      });
      return { previous };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.previous) qc.setQueryData(['notifications-dropdown', activeTab], ctx.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['notifications-dropdown'] }),
  });

  const unread = data?.unread || 0;
  const notifications = data?.items || [];

  const handleNotificationClick = (notification) => {
    if (!notification.read_at) markRead.mutate(notification.id);
    setOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell trigger */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'relative rounded-lg p-2 hover:bg-muted transition focus-visible:outline-none focus-visible:ring-brand',
          open && 'bg-muted'
        )}
        aria-label={`Notifications ${unread > 0 ? `(${unread} unread)` : ''}`}
        aria-haspopup="true"
        aria-expanded={open}
      >
        <Bell className={cn('h-5 w-5', unread > 0 && 'text-[rgb(var(--primary))]')} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] rounded-full bg-red-500 text-white text-[10px] font-semibold flex items-center justify-center px-1 ring-2 ring-[rgb(var(--card))]">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          className={cn(
            'absolute right-0 mt-2 w-[380px] max-w-[calc(100vw-2rem)] z-50',
            'bg-card border border-base rounded-xl shadow-2xl overflow-hidden',
            'animate-in fade-in slide-in-from-top-2 duration-200'
          )}
          role="dialog"
          aria-label="Notifications"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-base">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">Notifications</h3>
              {unread > 0 && (
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-[rgb(var(--primary))] text-white font-semibold">
                  {unread}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unread > 0 && (
                <button
                  onClick={() => markAllRead.mutate()}
                  disabled={markAllRead.isPending}
                  className="text-xs text-[rgb(var(--primary))] hover:underline px-2 py-1 disabled:opacity-50"
                  title="Mark all as read"
                >
                  <CheckCheck className="h-3.5 w-3.5 inline mr-1" />
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="rounded p-1 hover:bg-muted text-muted-fg"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-base">
            {[
              { key: 'all', label: 'All' },
              { key: 'unread', label: `Unread${unread > 0 ? ` (${unread})` : ''}` },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'flex-1 px-4 py-2.5 text-sm font-medium transition border-b-2',
                  activeTab === tab.key
                    ? 'border-[rgb(var(--primary))] text-[rgb(var(--primary))]'
                    : 'border-transparent text-muted-fg hover:text-fg'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="max-h-[450px] overflow-y-auto scrollbar-thin">
            {isLoading ? (
              <div className="space-y-2 p-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex gap-3 p-2">
                    <div className="h-10 w-10 rounded-full bg-muted animate-pulse flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-3/4 bg-muted animate-pulse rounded" />
                      <div className="h-2 w-1/2 bg-muted animate-pulse rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-12 text-center">
                <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                  <Inbox className="h-6 w-6 text-muted-fg" />
                </div>
                <p className="text-sm font-medium">
                  {activeTab === 'unread' ? "You're all caught up!" : 'No notifications yet'}
                </p>
                <p className="text-xs text-muted-fg mt-1">
                  {activeTab === 'unread' ? 'All notifications have been read' : "We'll notify you when something happens"}
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-base">
                {notifications.map((n) => {
                  const style = getStyle(n.type);
                  const link = getNotificationLink(n);
                  const isUnread = !n.read_at;

                  const Content = (
                    <div
                      className={cn(
                        'group flex items-start gap-3 p-3 transition cursor-pointer',
                        isUnread ? 'bg-blue-50/50 dark:bg-blue-950/20 hover:bg-blue-50 dark:hover:bg-blue-950/30' : 'hover:bg-muted/50'
                      )}
                      onClick={() => handleNotificationClick(n)}
                    >
                      {/* Icon */}
                      <div
                        className={cn(
                          'h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 text-lg',
                          style.color
                        )}
                        aria-hidden="true"
                      >
                        {style.emoji}
                      </div>

                      {/* Body */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={cn('text-sm leading-snug', isUnread && 'font-semibold')}>
                            {n.title}
                          </p>
                          {isUnread && (
                            <span className="h-2 w-2 rounded-full bg-[rgb(var(--primary))] flex-shrink-0 mt-1.5" />
                          )}
                        </div>
                        {n.message && (
                          <p className="text-xs text-muted-fg mt-0.5 line-clamp-2">{n.message}</p>
                        )}
                        <div className="flex items-center justify-between mt-1.5">
                          <p className="text-[10px] text-muted-fg">{timeAgo(n.created_at)}</p>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                            {isUnread && (
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  markRead.mutate(n.id);
                                }}
                                className="rounded p-1 hover:bg-muted text-muted-fg"
                                title="Mark as read"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                remove.mutate(n.id);
                              }}
                              className="rounded p-1 hover:bg-muted text-muted-fg hover:text-red-500"
                              title="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );

                  return (
                    <li key={n.id}>
                      {link ? (
                        <Link to={link} onClick={() => setOpen(false)}>
                          {Content}
                        </Link>
                      ) : (
                        Content
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-2 border-t border-base bg-muted/30">
              <Link
                to="/notifications"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-2 w-full text-sm text-[rgb(var(--primary))] hover:bg-muted rounded-lg p-2 font-medium transition"
              >
                View all notifications
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};