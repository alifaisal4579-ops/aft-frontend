import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { useAuth } from './AuthContext';
import ProtectedRoute from './ProtectedRoute';
import Home from './Home';
import Login from './Login';
import Signup from './Signup';
import ModeSelect from './ModeSelect';
import SimulatedDashboard from './SimulatedDashboard';
import RealDashboard from './RealDashboard';
import ToolsSuite from './ToolsSuite';

function Topbar() {
  const { user, logout } = useAuth();
  const displayName = (user && (user.full_name || user.email)) || '';
  return (
    <div className="site-nav-outer">
      <nav className="site-nav glass">
        <span className="logo">Ali Faisal <b>Trades</b></span>
        <div className="nav-links">
          <a href="/volume-profile.html">Volume Profile</a>
          <a href="/order-flow.html">Order Flow</a>
          <a href="/fibonacci-levels.html">Fibonacci Levels</a>
          <a href="/rsi-checker.html">RSI Checker</a>
          <a href="/confluence-zones.html">Confluence Zones</a>
          <Link to="/dashboard" className="nav-dashboard-btn">Dashboard</Link>
        </div>
        {user && (
          <div className="nav-user-group">
            <span className="nav-user-name">{displayName}</span>
            <button className="nav-logout-btn" onClick={logout}>Log out</button>
          </div>
        )}
      </nav>
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

      {/* Tools also render full-screen (it's an embedded iframe of the real
          site, which has its own nav/chrome) -- but still behind login. */}
      <Route
        path="/tools"
        element={
          <ProtectedRoute>
            <ToolsSuite />
          </ProtectedRoute>
        }
      />

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
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </div>
          </div>
        }
      />
    </Routes>
  );
}
