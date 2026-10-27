import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { getDefaultRouteForRole } from '../utils/roleUtils';

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth);
  return <Navigate to={getDefaultRouteForRole(user)} replace />;
};

export default Dashboard;
