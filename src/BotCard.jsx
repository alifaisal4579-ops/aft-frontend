import { useState } from 'react';
import * as api from './client';

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
        <span>{bot.risk_percent}% / trade (capped ${bot.max_loss_usd}) &middot; ${bot.paper_balance} paper balance</span>
      </div>
      <div className="bot-card-row">
        <span className="bot-card-label">Last check</span>
        <span>{fmtTime(bot.last_check_at)}</span>
      </div>

      <div className="bot-card-actions">
        <button className="btn-ghost" onClick={toggleStatus} disabled={busy}>
          {bot.status === 'running' ? 'Pause' : 'Start'}
        </button>
        <button className="btn-ghost danger" onClick={handleDelete} disabled={busy}>
          Delete
        </button>
      </div>
    </div>
  );
}
