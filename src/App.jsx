import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';

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
      {/* Login/signup render full-screen, with no topbar/app-shell around them */}
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
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </div>
          </div>
        }
      />
    </Routes>
  );
}
