import { Menu, Sun, Moon, LogOut, Settings, User } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useThemeStore } from '@/stores/themeStore';
import { useUiStore } from '@/stores/uiStore';
import { Avatar } from '@/components/ui/Avatar';
import { NotificationsDropdown } from './NotificationsDropdown';

export const Header = () => {
  const { user, logout } = useAuthStore();
  const { theme, toggle } = useThemeStore();
  const { toggleSidebar } = useUiStore();
  const [open, setOpen] = useState(false);
  const nav = useNavigate();

  return (
    <header className="sticky top-0 z-30 h-16 bg-card/80 backdrop-blur border-b border-base flex items-center justify-between px-4 lg:px-6">
      <button className="lg:hidden" onClick={toggleSidebar}><Menu className="h-5 w-5" /></button>
      <div className="flex-1" />
      <div className="flex items-center gap-2">
        <button onClick={toggle} className="rounded-lg p-2 hover:bg-muted" title="Toggle theme">
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
        <NotificationsDropdown />
        <div className="relative">
          <button onClick={() => setOpen(!open)} className="flex items-center gap-2 rounded-lg p-1 hover:bg-muted">
            <Avatar src={user?.avatar_url} name={`${user?.first_name || ''} ${user?.last_name || ''}`} size={32} />
          </button>
          {open && (
            <>
              <div className="fixed inset-0" onClick={() => setOpen(false)} />
              <div className="absolute right-0 mt-2 w-56 bg-card border border-base rounded-lg shadow-lg overflow-hidden z-20">
                <div className="p-3 border-b border-base">
                  <p className="font-medium text-sm">{user?.first_name} {user?.last_name}</p>
                  <p className="text-xs text-muted-fg truncate">{user?.email}</p>
                </div>
                <button onClick={() => { setOpen(false); nav('/profile'); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"><User className="h-4 w-4" /> Profile</button>
                <button onClick={() => { setOpen(false); nav('/billing'); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"><Settings className="h-4 w-4" /> Billing</button>
                <button onClick={async () => { await logout(); nav('/login'); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted text-red-600"><LogOut className="h-4 w-4" /> Logout</button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};