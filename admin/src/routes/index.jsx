import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { ProtectedRoute } from './ProtectedRoute';
import Login from '@/pages/auth/Login';
import Dashboard from '@/pages/Dashboard';
import Users from '@/pages/Users';
import Roles from '@/pages/Roles';
import Plans from '@/pages/Plans';
import Subscriptions from '@/pages/Subscriptions';
import Payments from '@/pages/Payments';
import Invoices from '@/pages/Invoices';
import Analytics from '@/pages/Analytics';
import AuditLogs from '@/pages/AuditLogs';
import LoginHistory from '@/pages/LoginHistory';
import Tickets from '@/pages/Tickets';
import Faqs from '@/pages/Faqs';
import Announcements from '@/pages/Announcements';
import Settings from '@/pages/Settings';

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
      </Route>
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="/users" element={<Users />} />
        <Route path="/roles" element={<Roles />} />
        <Route path="/plans" element={<Plans />} />
        <Route path="/subscriptions" element={<Subscriptions />} />
        <Route path="/payments" element={<Payments />} />
        <Route path="/invoices" element={<Invoices />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/audit-logs" element={<AuditLogs />} />
        <Route path="/login-history" element={<LoginHistory />} />
        <Route path="/tickets" element={<Tickets />} />
        <Route path="/faqs" element={<Faqs />} />
        <Route path="/announcements" element={<Announcements />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}