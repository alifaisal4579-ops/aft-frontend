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
const SESSION_OPTIONS = ['5AM', '7PM', '12PM', '12AM'];

export default function CreateBotForm({ onCreated, onCancel }) {
  const [botType, setBotType] = useState('scalp_market');
  const [symbolsText, setSymbolsText] = useState('BTCUSDT, ETHUSDT');
  const [sessions, setSessions] = useState(['7PM']);
  const [riskPercent, setRiskPercent] = useState(1);
  const [maxLossUsd, setMaxLossUsd] = useState(100);
  const [paperBalance, setPaperBalance] = useState(1000);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  function toggleSession(s) {
    setSessions((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    const symbols = symbolsText
      .split(',')
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);

    if (!symbols.length) { setError('Enter at least one symbol.'); return; }
    if (!sessions.length) { setError('Pick at least one session.'); return; }

    setBusy(true);
    const { ok, body } = await api.createBot({
      bot_type: botType,
      symbols,
      sessions,
      risk_percent: Number(riskPercent),
      max_loss_usd: Number(maxLossUsd),
      paper_balance: Number(paperBalance),
    });
    setBusy(false);

    if (ok) onCreated(body.bot);
    else setError(body.error || 'Something went wrong.');
  }

  return (
    <form onSubmit={handleSubmit} className="create-bot-form">
      {error && <div className="auth-error">{error}</div>}

      <div className="field">
        <label htmlFor="botType">Bot type</label>
        <select id="botType" value={botType} onChange={(e) => setBotType(e.target.value)}>
          {BOT_TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="symbols">Symbols (comma-separated)</label>
        <input id="symbols" type="text" value={symbolsText} onChange={(e) => setSymbolsText(e.target.value)}
          placeholder="BTCUSDT, ETHUSDT, SOLUSDT" />
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

      <div className="field-row">
        <div className="field">
          <label htmlFor="riskPercent">Risk % per trade</label>
          <input id="riskPercent" type="number" step="0.1" min="0.1" max="5"
            value={riskPercent} onChange={(e) => setRiskPercent(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="maxLossUsd">Max loss $/trade</label>
          <input id="maxLossUsd" type="number" min="1"
            value={maxLossUsd} onChange={(e) => setMaxLossUsd(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="paperBalance">Paper balance $</label>
          <input id="paperBalance" type="number" min="1"
            value={paperBalance} onChange={(e) => setPaperBalance(e.target.value)} />
        </div>
      </div>

      <p className="form-note">
        Paper trading only for now -- this simulates trades using real market data
        without placing real orders.
      </p>

      <div className="form-actions">
        <button type="button" className="btn-ghost" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? 'Creating...' : 'Create bot'}
        </button>
      </div>
    </form>
  );
}
