import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import DashboardLayout from './layouts/DashboardLayout';
import OwnerDashboard from './pages/OwnerDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import SalesDashboard from './pages/SalesDashboard';
import PlatformAdmin from './pages/PlatformAdmin';
import QuotationBuilder from './pages/QuotationBuilder';
import Quotations from './pages/Quotations';
import Products from './pages/Products';
import Customers from './pages/Customers';
import Team from './pages/Team';
import Settings from './pages/Settings';
import RoleRoute from './routes/RoleRoute';
import { getDefaultRouteForRole } from './utils/roleUtils';

// Authenticated root redirector based on exact role
const IndexRedirect = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  const defaultPath = getDefaultRouteForRole(user);
  return <Navigate to={defaultPath} replace />;
};

const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Entry Point: Public Landing Page */}
        <Route path="/" element={<LandingPage />} />

        {/* Authentication */}
        <Route path="/login" element={<Login />} />

        {/* Dynamic authenticated dashboard redirect */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <IndexRedirect />
            </PrivateRoute>
          }
        />

        {/* Authenticated Dashboard Routes */}
        <Route
          element={
            <PrivateRoute>
              <DashboardLayout />
            </PrivateRoute>
          }
        >
          {/* Dedicated Role-Based Endpoints */}
          <Route
            path="platform"
            element={
              <RoleRoute allowedRoles={['superadmin']}>
                <PlatformAdmin />
              </RoleRoute>
            }
          />

          <Route
            path="owner"
            element={
              <RoleRoute allowedRoles={['owner']}>
                <OwnerDashboard />
              </RoleRoute>
            }
          />

          <Route
            path="manager"
            element={
              <RoleRoute allowedRoles={['manager', 'owner']}>
                <ManagerDashboard />
              </RoleRoute>
            }
          />

          <Route
            path="sales"
            element={
              <RoleRoute allowedRoles={['sales', 'owner']}>
                <SalesDashboard />
              </RoleRoute>
            }
          />

          {/* Operational Pages Guarded by Roles */}
          <Route
            path="products"
            element={
              <RoleRoute allowedRoles={['owner', 'manager', 'sales']}>
                <Products />
              </RoleRoute>
            }
          />

          <Route
            path="customers"
            element={
              <RoleRoute allowedRoles={['owner', 'manager', 'sales']}>
                <Customers />
              </RoleRoute>
            }
          />

          <Route
            path="quotations"
            element={
              <RoleRoute allowedRoles={['owner', 'sales', 'manager']}>
                <Quotations />
              </RoleRoute>
            }
          />

          <Route
            path="quotations/new"
            element={
              <RoleRoute allowedRoles={['owner', 'sales', 'manager']}>
                <QuotationBuilder />
              </RoleRoute>
            }
          />

          <Route
            path="team"
            element={
              <RoleRoute allowedRoles={['owner']}>
                <Team />
              </RoleRoute>
            }
          />

          <Route
            path="settings"
            element={
              <RoleRoute allowedRoles={['owner']}>
                <Settings />
              </RoleRoute>
            }
          />
        </Route>

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

