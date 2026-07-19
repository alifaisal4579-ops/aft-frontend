import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { useAuth } from './AuthContext';
import ProtectedRoute from './ProtectedRoute';
import Home from './Home';
import Login from './Login';
import Signup from './Signup';
import ModeSelect from './ModeSelect';
import SimulatedDashboard from './SimulatedDashboard';
import RealDashboard from './RealDashboard';
import ToolsHub from './ToolsHub';
import RsiScreenerPage from './RsiScreenerPage';
import OrderFlowPage from './OrderFlowPage';

function Topbar() {
  const { user, logout } = useAuth();
  return (
    <div className="topbar">
      <span className="brand">Ali Faisal Trades</span>
      {user && (
        <div>
          <span className="user-email">{user.email}</span>
          <button className="btn-ghost" onClick={logout}>Log out</button>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const { loading } = useAuth();
  if (loading) return <div className="center-loading">Loading...</div>;

  return (
    <Routes>
      {/* Homepage, login and signup render full-screen, with no topbar/app-shell around them */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Everything else gets the app shell (topbar + content) */}
      <Route
        path="*"
        element={
          <div className="app-shell">
            <Topbar />
            <div className="main-content">
              <Routes>
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <ModeSelect />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/simulated"
                  element={
                    <ProtectedRoute>
                      <SimulatedDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/real"
                  element={
                    <ProtectedRoute>
                      <RealDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/tools"
                  element={
                    <ProtectedRoute>
                      <ToolsHub />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/tools/rsi-screener"
                  element={
                    <ProtectedRoute>
                      <RsiScreenerPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/tools/order-flow"
                  element={
                    <ProtectedRoute>
                      <OrderFlowPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </div>
          </div>
        }
      />
    </Routes>
  );
}
