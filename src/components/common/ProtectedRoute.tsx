import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Role } from '@/types/enums';

interface ProtectedRouteProps {
  allowedRoles?: Role[];
}

const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, hasRole } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !hasRole(...allowedRoles)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export { ProtectedRoute };
export default ProtectedRoute;
