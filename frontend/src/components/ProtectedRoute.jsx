import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PageLoader } from './Spinner';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, initializing } = useAuth();
  const location = useLocation();

  if (initializing) {
    return <PageLoader label="Checking your session…" />;
  }

  if (!isAuthenticated) {
    // Remember where the user wanted to go so we can return after login.
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
