import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function ModeSelect() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="mode-select">
      <h2 className="mode-select-greeting">Welcome, {user?.email}</h2>
      <p className="mode-select-sub">Choose how you want to trade.</p>

      <div className="mode-cards">
        <button className="mode-card mode-card-sim" onClick={() => navigate('/dashboard/simulated')}>
          <div className="mode-card-icon">
            <span className="status-dot running" />
          </div>
          <h3>Simulated Bot Trading</h3>
          <p>
            Paper trading with real market data -- no real money, no risk.
            Create bots, pick symbols and sessions, and track performance
            using the Lakhsmi Signals engine.
          </p>
          <span className="mode-card-cta">Open &rarr;</span>
        </button>

        <button className="mode-card mode-card-real" onClick={() => navigate('/dashboard/real')}>
          <div className="mode-card-icon">
            <span className="mode-card-badge">Real</span>
          </div>
          <h3>Real Bot Trading</h3>
          <p>
            Connect your own exchange account and let the bot place real
            orders with your funds. Requires an API key with Trade
            permission only.
          </p>
          <span className="mode-card-cta">Open &rarr;</span>
        </button>
      </div>
    </div>
  );
}
