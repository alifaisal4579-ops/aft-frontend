import { Link } from 'react-router-dom';
import ExchangeKeys from './ExchangeKeys';

export default function RealDashboard() {
  return (
    <div>
      <Link to="/dashboard" className="back-link">&larr; Back</Link>

      <div className="dashboard-head">
        <h2>Real Bot Trading</h2>
      </div>
      <p className="mode-page-sub">
        Connect your exchange account to enable real order placement with your own funds.
      </p>

      <div className="coming-soon-banner">
        <b>Bot automation for real trading is launching soon.</b>
        <span>
          You can connect your exchange API key now so you're ready -- creating and
          running a real-money bot will be enabled here shortly.
        </span>
      </div>

      <ExchangeKeys />
    </div>
  );
}
