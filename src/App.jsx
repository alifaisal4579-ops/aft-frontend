import { useState } from 'react';
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
import Disclaimer from './Disclaimer';
import About from './About';
import PrivacyPolicy from './PrivacyPolicy';
import Contact from './Contact';

function Topbar() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const displayName = (user && user.full_name) || '';
  return (
    <div className="site-nav-outer">
      <nav className="site-nav">
        <Link to="/" className="nav-brand">
          <img src="/logo.jpg" alt="Ali Faisal Trades" className="nav-avatar" />
          <span className="logo">Ali Faisal Trades</span>
        </Link>
        <button className="nav-toggle" aria-label="Menu" onClick={() => setMenuOpen((o) => !o)}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
        </button>
        <div className={`nav-links${menuOpen ? ' open' : ''}`}>
          <a href="/volume-profile.html">Volume Profile</a>
          <a href="/order-flow.html">Order Flow</a>
          <a href="/fibonacci-levels.html">Fibonacci Levels</a>
          <a href="/rsi-checker.html">RSI Checker</a>
          <a href="/confluence-zones.html">Confluence Zones</a>
          <Link to="/dashboard" className="nav-dashboard-btn">Dashboard</Link>
        </div>
        {user && (
          <div className="nav-user-group">
            {displayName && <span className="nav-user-name">{displayName}</span>}
            <button className="nav-logout-btn" onClick={logout}>Log out</button>
          </div>
        )}
      </nav>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Homepage, login and signup render full-screen, with no topbar/app-shell around them */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/about" element={<About />} />
      <Route path="/disclaimer" element={<Disclaimer />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/contact" element={<Contact />} />

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
