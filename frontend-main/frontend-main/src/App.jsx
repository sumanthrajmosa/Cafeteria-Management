import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

import Login from './pages/Login';
import Signup from './pages/Signup';
import AdminDashboard from './pages/AdminDashboard';
import UserDashboard from './pages/UserDashboard';
import StaffDashboard from './pages/StaffDashboard';
import Booking from './pages/Booking';
import QueueStatus from './pages/QueueStatus';
import Menu from './pages/Menu';
import Analytics from './pages/Analytics';
import StaffForecast from './pages/StaffForecast';
import Incentives from './pages/Incentives';
import IncentiveConfig from './pages/IncentiveConfig';
import Slots from './pages/Slots';
import Addons from './pages/Addons';
import AddonClaim from './pages/AddonClaim';
import Users from './pages/Users';
import Ethics from './pages/Ethics';
import TotpSetup from './pages/TotpSetup';
import AuditLogs from './pages/AuditLogs';
import ForgotPassword from './pages/ForgotPassword';

import Layout from './components/common/Layout';

/* =========================
   PROTECTED ROUTE
========================= */
function ProtectedRoute({ children, adminOnly = false, staffOnly = false }) {
  const { isAuthenticated, isAdmin, isStaff, loading } = useAuth();

  if (loading) {
    return <div className="login-container">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" />;
  }

  if (staffOnly && !isStaff) {
    return <Navigate to="/dashboard" />;
  }

  return children;
}

/* =========================
   APP ROUTES
========================= */
function AppRoutes() {
  const { isAuthenticated, isAdmin, isStaff } = useAuth();

  return (
    <Routes>

      {/* LOGIN */}
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            isAdmin ? <Navigate to="/admin" /> :
              isStaff ? <Navigate to="/staff" /> :
                <Navigate to="/dashboard" />
          ) : (
            <Login />
          )
        }
      />

      {/* SIGNUP */}
      <Route
        path="/signup"
        element={
          isAuthenticated ? (
            isAdmin ? <Navigate to="/admin" /> :
              isStaff ? <Navigate to="/staff" /> :
                <Navigate to="/dashboard" />
          ) : (
            <Signup />
          )
        }
      />

      {/* FORGOT PASSWORD */}
      <Route
        path="/forgot-password"
        element={
          isAuthenticated ? (
            isAdmin ? <Navigate to="/admin" /> :
              isStaff ? <Navigate to="/staff" /> :
                <Navigate to="/dashboard" />
          ) : (
            <ForgotPassword />
          )
        }
      />

      {/* ADMIN */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute adminOnly>
            <Layout>
              <AdminDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* ADMIN SLOTS */}
      <Route
        path="/admin/slots"
        element={
          <ProtectedRoute adminOnly>
            <Layout>
              <Slots />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* STAFF */}
      <Route
        path="/staff"
        element={
          <ProtectedRoute staffOnly>
            <Layout>
              <StaffDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* STUDENT DASHBOARD */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <UserDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* BOOKING (STUDENT ONLY BY ROLE LOGIC IN UI) */}
      <Route
        path="/booking"
        element={
          <ProtectedRoute>
            <Layout>
              <Booking />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* QUEUE VIEW (ALL ROLES – ACTIONS CONTROLLED INSIDE UI) */}
      <Route
        path="/queue"
        element={
          <ProtectedRoute>
            <Layout>
              <QueueStatus />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* MENU */}
      <Route
        path="/menu"
        element={
          <ProtectedRoute>
            <Layout>
              <Menu />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* ANALYTICS (ADMIN ONLY) */}
      <Route
        path="/analytics"
        element={
          <ProtectedRoute adminOnly>
            <Layout>
              <Analytics />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* STAFF FORECAST (STAFF & ADMIN) */}
      <Route
        path="/staff/forecast"
        element={
          <ProtectedRoute>
            <Layout>
              <StaffForecast />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* FORECAST ALIAS FOR ADMIN */}
      <Route
        path="/forecast"
        element={
          <ProtectedRoute adminOnly>
            <Layout>
              <StaffForecast />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* INCENTIVES (STUDENT) */}
      <Route
        path="/incentives"
        element={
          <ProtectedRoute>
            <Layout>
              <Incentives />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* INCENTIVE CONFIG (ADMIN) */}
      <Route
        path="/admin/incentives"
        element={
          <ProtectedRoute adminOnly>
            <Layout>
              <IncentiveConfig />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* USERS (ADMIN) */}
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute adminOnly>
            <Layout>
              <Users />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* ETHICS & RULES (ALL ROLES) */}
      <Route
        path="/ethics"
        element={
          <ProtectedRoute>
            <Layout>
              <Ethics />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* ADDONS (USER) */}
      <Route
        path="/addons"
        element={
          <ProtectedRoute>
            <Layout>
              <Addons />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* ADDON CLAIM (USER) */}
      <Route
        path="/addons/claim"
        element={
          <ProtectedRoute>
            <Layout>
              <AddonClaim />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* ETHICS (PUBLIC OR PROTECTED) */}
      <Route
        path="/ethics"
        element={
          <ProtectedRoute>
            <Layout>
              <Ethics />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* 2FA SETUP (ALL AUTHENTICATED USERS) */}
      <Route
        path="/security"
        element={
          <ProtectedRoute>
            <Layout>
              <TotpSetup />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* AUDIT LOGS (ADMIN ONLY) */}
      <Route
        path="/admin/audit-logs"
        element={
          <ProtectedRoute adminOnly>
            <Layout>
              <AuditLogs />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* DEFAULT */}
      <Route path="/" element={<Navigate to="/login" />} />

    </Routes>
  );
}

/* =========================
   APP ROOT
========================= */
function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
