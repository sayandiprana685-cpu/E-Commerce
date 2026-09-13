import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Spinner } from '../components/Skeletons';

export const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Spinner label="Checking your session…" />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
};

export const RoleRoute = ({ roles, children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Spinner label="Checking permissions…" />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (!roles.includes(user.role)) {
    const home = user.role === 'admin' ? '/admin' : user.role === 'seller' ? '/seller' : '/account';
    return <Navigate to={home} replace />;
  }
  return children;
};

export const GuestRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (user) {
    const home = user.role === 'admin' ? '/admin' : user.role === 'seller' ? '/seller' : '/account';
    return <Navigate to={home} replace />;
  }
  return children;
};
