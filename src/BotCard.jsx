import { useState } from 'react';
import * as api from './client';
import TradesPanel from './TradesPanel';

const BOT_TYPE_LABELS = {
  scalp_market: 'Scalp -- Market',
  scalp_limit: 'Scalp -- Limit',
  day_limit: 'Day Trade -- Limit',
  day_market: 'Day Trade -- Market',
  swing_limit: 'Swing -- Limit',
  swing_market: 'Swing -- Market',
};

function fmtTime(iso) {
  if (!iso) return 'never';
  return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function BotCard({ bot, onChanged }) {
  const [busy, setBusy] = useState(false);
  const [showTrades, setShowTrades] = useState(false);

  async function toggleStatus() {
    setBusy(true);
    const nextStatus = bot.status === 'running' ? 'paused' : 'running';
    const { ok, body } = await api.updateBot(bot.id, { status: nextStatus });
    setBusy(false);
    if (ok) onChanged(body.bot);
  }

  async function handleDelete() {
    if (!confirm(`Delete this ${BOT_TYPE_LABELS[bot.bot_type]} bot? This cannot be undone.`)) return;
    setBusy(true);
    const { ok } = await api.deleteBot(bot.id);
    setBusy(false);
    if (ok) onChanged(null, bot.id);
  }

  return (
    <div className="bot-card">
      <div className="bot-card-head">
        <span className={`status-dot ${bot.status}`} />
        <span className="bot-type">{BOT_TYPE_LABELS[bot.bot_type] || bot.bot_type}</span>
        {bot.mode === 'real' && <span className="badge real-money-badge">REAL MONEY</span>}
        <span className={`badge ${bot.status}`}>{bot.status}</span>
      </div>

      <div className="bot-card-row">
        <span className="bot-card-label">Symbols</span>
        <span>{bot.symbols.join(', ')}</span>
      </div>
      <div className="bot-card-row">
        <span className="bot-card-label">Sessions</span>
        <span>{bot.sessions.join(', ')}</span>
      </div>
      <div className="bot-card-row">
        <span className="bot-card-label">Risk</span>
        {bot.mode === 'real' ? (
          <span>${bot.risk_per_trade_usd} per trade (real BloFin funds)</span>
        ) : (
          <span>{bot.risk_percent}% / trade (capped ${bot.max_loss_usd}) &middot; ${bot.paper_balance} paper balance</span>
        )}
      </div>
      {bot.mode === 'real' && (
        <div className="bot-card-row">
          <span className="bot-card-label">Leverage</span>
          <span>{bot.leverage}x &middot; {bot.margin_mode === 'isolated' ? 'Isolated' : 'Cross'}</span>
        </div>
      )}
      <div className="bot-card-row">
        <span className="bot-card-label">Last check</span>
        <span>{fmtTime(bot.last_check_at)}</span>
      </div>

      <div className="bot-card-actions">
        <button className="btn-ghost" onClick={toggleStatus} disabled={busy}>
          {bot.status === 'running' ? 'Pause' : 'Start'}
        </button>
        <button className="btn-ghost" onClick={() => setShowTrades((v) => !v)}>
          {showTrades ? 'Hide trades' : 'View trades'}
        </button>
        <button className="btn-ghost danger" onClick={handleDelete} disabled={busy}>
          Delete
        </button>
      </div>

      {showTrades && (
        <div className="bot-card-trades">
          <TradesPanel botId={bot.id} />
        </div>
      )}
    </div>
  );
}
