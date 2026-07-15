import { useEffect, useState } from 'react';
import * as api from './client';
import { useAuth } from './AuthContext';
import CreateBotForm from './CreateBotForm';
import BotCard from './BotCard';

export default function Dashboard() {
  const { user } = useAuth();
  const [bots, setBots] = useState(null); // null = loading
  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api.listBots().then(({ ok, body }) => {
      if (cancelled) return;
      if (ok) setBots(body.bots);
      else setError(body.error || 'Could not load your bots.');
    });
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
      <div className="dashboard-head">
        <h2>Your bots</h2>
        {!showCreate && (
          <button className="btn-primary btn-inline" onClick={() => setShowCreate(true)}>
            + Create bot
          </button>
        )}
      </div>

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
