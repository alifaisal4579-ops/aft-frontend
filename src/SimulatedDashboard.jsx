import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as api from './client';
import CreateBotForm from './CreateBotForm';
import BotCard from './BotCard';

export default function SimulatedDashboard() {
  const [bots, setBots] = useState(null); // null = loading
  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api.listBots()
      .then(({ ok, body }) => {
        if (cancelled) return;
        if (ok) setBots(body.bots);
        else setError(body.error || 'Could not load your bots.');
      })
      .catch(() => { if (!cancelled) setError('Could not reach the server. Please refresh.'); });
    return () => { cancelled = true; };
  }, []);

  function handleCreated(bot) {
    setBots((prev) => [bot, ...(prev || [])]);
    setShowCreate(false);
  }

  function handleChanged(updatedBot, deletedId) {
    if (deletedId) {
      setBots((prev) => prev.filter((b) => b.id !== deletedId));
    } else if (updatedBot) {
      setBots((prev) => prev.map((b) => (b.id === updatedBot.id ? updatedBot : b)));
    }
  }

  return (
    <div>
      <Link to="/dashboard" className="back-link">&larr; Back</Link>

      <div className="dashboard-head">
        <h2>Simulated Bot Trading</h2>
        {!showCreate && (
          <button className="btn-primary btn-inline" onClick={() => setShowCreate(true)}>
            + Create bot
          </button>
        )}
      </div>
      <p className="mode-page-sub">Paper trading with real market data -- no real orders are ever placed.</p>

      {error && <div className="auth-error">{error}</div>}

      {showCreate && (
        <div className="create-bot-panel">
          <CreateBotForm onCreated={handleCreated} onCancel={() => setShowCreate(false)} />
        </div>
      )}

      {bots === null && <p className="muted-text">Loading your bots...</p>}

      {bots !== null && bots.length === 0 && !showCreate && (
        <p className="muted-text">
          You don't have any bots yet. Create one to start paper trading with the
          Lakhsmi Signals engine.
        </p>
      )}

      <div className="bot-grid">
        {bots?.map((bot) => (
          <BotCard key={bot.id} bot={bot} onChanged={handleChanged} />
        ))}
      </div>
    </div>
  );
}
