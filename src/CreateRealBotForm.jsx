import { useState } from 'react';
import * as api from './client';

const BOT_TYPE_OPTIONS = [
  { value: 'scalp_market', label: 'Scalp -- Market entry' },
  { value: 'scalp_limit', label: 'Scalp -- Limit (pullback) entry' },
  { value: 'day_limit', label: 'Day Trade -- Limit (pullback) entry' },
  { value: 'day_market', label: 'Day Trade -- Market entry' },
  { value: 'swing_limit', label: 'Swing Trade -- Limit (pullback) entry' },
  { value: 'swing_market', label: 'Swing Trade -- Market entry' },
];
const SESSION_OPTIONS = ['5AM', '7PM', '8PM'];

export default function CreateRealBotForm({ hasKey, onCreated, onCancel }) {
  const [botType, setBotType] = useState('scalp_market');
  const [symbolsText, setSymbolsText] = useState('BTCUSDT, ETHUSDT');
  const [sessions, setSessions] = useState(['8PM']);
  const [riskPerTrade, setRiskPerTrade] = useState(1.6);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  function toggleSession(s) {
    setSessions((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!hasKey) { setError('Add a BloFin API key first (below) before creating a real bot.'); return; }
    if (!confirmed) { setError('Check the confirmation box -- this bot will place real orders with real money.'); return; }

    const symbols = symbolsText.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean);
    if (!symbols.length) { setError('Enter at least one symbol.'); return; }
    if (!sessions.length) { setError('Pick at least one session.'); return; }
    if (!(Number(riskPerTrade) > 0)) { setError('Risk per trade must be a positive number.'); return; }

    setBusy(true);
    try {
      const { ok, body } = await api.createBot({
        bot_type: botType, symbols, sessions,
        mode: 'real', exchange: 'blofin',
        risk_per_trade_usd: Number(riskPerTrade),
      });
      if (ok) onCreated(body.bot);
      else setError(body.error || 'Something went wrong.');
    } catch (err) {
      setError('Could not reach the server. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="create-bot-form">
      {error && <div className="auth-error">{error}</div>}

      <div className="field">
        <label htmlFor="realBotType">Bot type</label>
        <select id="realBotType" value={botType} onChange={(e) => setBotType(e.target.value)}>
          {BOT_TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="realSymbols">Symbols (comma-separated)</label>
        <input id="realSymbols" type="text" value={symbolsText} onChange={(e) => setSymbolsText(e.target.value)}
          placeholder="BTCUSDT, ETHUSDT" />
      </div>

      <div className="field">
        <label>Daily check session(s)</label>
        <div className="session-checkboxes">
          {SESSION_OPTIONS.map((s) => (
            <label key={s} className="session-chip">
              <input type="checkbox" checked={sessions.includes(s)} onChange={() => toggleSession(s)} />
              {s}
            </label>
          ))}
        </div>
      </div>

      <div className="field">
        <label htmlFor="riskPerTrade">Minimum per trade ($)</label>
        <input id="riskPerTrade" type="number" step="0.1" min="0.1"
          value={riskPerTrade} onChange={(e) => setRiskPerTrade(e.target.value)} />
      </div>

      <div className="real-money-warning">
        <label>
          <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
          I understand this bot will place <b>real orders with real money</b> on my BloFin account,
          risking approximately ${Number(riskPerTrade || 0).toFixed(2)} per trade.
        </label>
      </div>

      <div className="form-actions">
        <button type="button" className="btn-ghost" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn-primary btn-danger" disabled={busy || !hasKey}>
          {busy ? 'Creating...' : 'Create real bot'}
        </button>
      </div>
    </form>
  );
}
