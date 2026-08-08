import { Navigate } from 'react-router-dom';
import { useContext } from 'react';
import type { ReactNode } from 'react';
import { AuthContext } from '../context/AuthContext';

interface RoleRouteProps {
  children: ReactNode;
  allowedRoles: string[];
}

const RoleRoute = ({ children, allowedRoles }: RoleRouteProps) => {
  const { user, isAuthenticated } = useContext(AuthContext);

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" />;
  }

  return <>{children}</>;
};

export default RoleRoute;
