import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { getRoleType, getDefaultRouteForRole } from '../utils/roleUtils';

const RoleRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const userRole = getRoleType(user);

  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    // User is trying to access an endpoint outside their privilege level.
    // Redirect them to their own authorized dashboard.
    const redirectUrl = getDefaultRouteForRole(user);
    return <Navigate to={redirectUrl} replace />;
  }

  return children;
};

export default RoleRoute;
