import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Building2, UserCircle, Briefcase, ListTodo, FileText, CreditCard, Bell, LifeBuoy, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/stores/uiStore';

const nav = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/leads', icon: Users, label: 'Leads' },
  { to: '/contacts', icon: UserCircle, label: 'Contacts' },
  { to: '/companies', icon: Building2, label: 'Companies' },
  { to: '/deals', icon: Briefcase, label: 'Deals' },
  { to: '/tasks', icon: ListTodo, label: 'Tasks' },
  { to: '/notes', icon: FileText, label: 'Notes' },
  { to: '/billing', icon: CreditCard, label: 'Billing' },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
  { to: '/support', icon: LifeBuoy, label: 'Support' },
];

export const Sidebar = () => {
  const { sidebarOpen, setSidebar } = useUiStore();
  return (
    <>
      {sidebarOpen && <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setSidebar(false)} />}
      <aside className={cn(
        'fixed lg:sticky top-0 z-50 lg:z-0 h-screen w-64 bg-card border-r border-base flex flex-col transition-transform',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        <div className="flex h-16 items-center justify-between px-5 border-b border-base">
          <div className="font-bold text-lg text-[rgb(var(--primary))]">CRM Platform</div>
          <button className="lg:hidden" onClick={() => setSidebar(false)}><X className="h-5 w-5" /></button>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 scrollbar-thin space-y-1">
          {nav.map(({ to, icon: Icon, label, end }) => (
            <NavLink key={to} to={to} end={end} onClick={() => setSidebar(false)}
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition',
                isActive ? 'bg-[rgb(var(--primary))]/10 text-[rgb(var(--primary))]' : 'hover:bg-muted text-fg'
              )}>
              <Icon className="h-4 w-4" /> {label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
};