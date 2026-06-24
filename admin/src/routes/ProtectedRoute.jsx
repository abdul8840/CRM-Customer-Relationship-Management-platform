import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Loader2 } from 'lucide-react';

export const ProtectedRoute = ({ children }) => {
  const { user, booted, accessToken } = useAuthStore();
  const location = useLocation();
  if (!booted) return <div className="h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!accessToken || !user) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
};