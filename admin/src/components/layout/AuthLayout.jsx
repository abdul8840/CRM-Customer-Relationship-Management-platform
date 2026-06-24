import { Outlet } from 'react-router-dom';
export const AuthLayout = () => (
  <div className="min-h-screen grid lg:grid-cols-2">
    <div className="hidden lg:flex bg-gradient-to-br from-brand-600 to-brand-900 text-white p-12 flex-col justify-between">
      <div className="font-bold text-2xl">CRM Platform</div>
      <div>
        <h2 className="text-4xl font-bold leading-tight">Close more deals with a CRM your team will love.</h2>
        <p className="mt-4 text-white/80">Manage leads, deals, contacts, tasks and revenue — all in one place.</p>
      </div>
      <p className="text-sm text-white/60">© {new Date().getFullYear()} CRM Platform</p>
    </div>
    <div className="flex items-center justify-center p-6">
      <div className="w-full max-w-md"><Outlet /></div>
    </div>
  </div>
);