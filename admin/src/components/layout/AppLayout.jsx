import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const AppLayout = () => (
  <div className="flex min-h-screen bg-app">
    <Sidebar />
    <div className="flex-1 flex flex-col min-w-0">
      <Header />
      <main className="flex-1 p-4 lg:p-6"><Outlet /></main>
    </div>
  </div>
);