import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as api from './client';
import ExchangeKeys from './ExchangeKeys';
import CreateRealBotForm from './CreateRealBotForm';
import BotCard from './BotCard';

export default function RealDashboard() {
  const [bots, setBots] = useState(null);
  const [hasKey, setHasKey] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState(null);

  function load() {
    api.listBots()
      .then(({ ok, body }) => {
        if (ok) setBots(body.bots.filter((b) => b.mode === 'real'));
        else setError(body.error || 'Could not load your bots.');
      })
      .catch(() => setError('Could not reach the server. Please refresh.'));
    api.listExchangeKeys()
      .then(({ ok, body }) => { if (ok) setHasKey(body.keys.some((k) => k.exchange === 'blofin')); })
      .catch(() => {});
  }

  useEffect(() => { load(); }, []);

  function handleCreated(bot) {
    setBots((prev) => [bot, ...(prev || [])]);
    setShowCreate(false);
  }

  function handleChanged(updatedBot, deletedId) {
    if (deletedId) setBots((prev) => prev.filter((b) => b.id !== deletedId));
    else if (updatedBot) setBots((prev) => prev.map((b) => (b.id === updatedBot.id ? updatedBot : b)));
  }

  return (
    <div>
      <Link to="/dashboard" className="back-link">&larr; Back</Link>

      <div className="dashboard-head">
        <h2>Real Bot Trading</h2>
        {!showCreate && (
          <button className="btn-primary btn-inline btn-danger" onClick={() => setShowCreate(true)}>
            + Create real bot
          </button>
        )}
      </div>
      <p className="mode-page-sub">
        Connect your exchange account to enable real order placement with your own funds.
      </p>

      {error && <div className="auth-error">{error}</div>}

      {showCreate && (
        <div className="create-bot-panel">
          <CreateRealBotForm hasKey={!!hasKey} onCreated={handleCreated} onCancel={() => setShowCreate(false)} />
        </div>
      )}

      {bots === null && <p className="muted-text">Loading your bots...</p>}
      {bots !== null && bots.length === 0 && !showCreate && (
        <p className="muted-text">
          You don't have any real bots yet. {hasKey ? 'Create one above.' : 'Add a BloFin API key below first.'}
        </p>
      )}

      <div className="bot-grid">
        {bots?.map((bot) => (
          <BotCard key={bot.id} bot={bot} onChanged={handleChanged} />
        ))}
      </div>

      <hr className="section-divider" />
      <ExchangeKeys />
    </div>
  );
}
