import { Navigate } from 'react-router-dom';
import { useContext } from 'react';
import type { ReactNode } from 'react';
import { AuthContext } from '../context/AuthContext';

interface AdminRouteProps {
  children: ReactNode;
}

const AdminRoute = ({ children }: AdminRouteProps) => {
  const { user, isAuthenticated } = useContext(AuthContext);

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (user && user.role !== 'admin') {
    return <Navigate to="/unauthorized" />;
  }

  return <>{children}</>;
};

export default AdminRoute;
