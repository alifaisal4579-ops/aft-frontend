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
  const [showLastCheck, setShowLastCheck] = useState(false);

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

  const isReal = bot.mode === 'real';
  const maxPerDay = bot.max_trades_per_day || bot.symbols.length;
  const lastCheck = bot.last_check_results
    ? (typeof bot.last_check_results === 'string' ? JSON.parse(bot.last_check_results) : bot.last_check_results)
    : null;

  return (
    <div className="bot-card">
      <div className="bot-card-head">
        <span className={`status-dot ${bot.status}`} />
        <span className="bot-type">{BOT_TYPE_LABELS[bot.bot_type] || bot.bot_type}</span>
        {isReal && <span className="badge real-money-badge">Real money</span>}
        <span className={`badge ${bot.status}`}>{bot.status}</span>
      </div>

      <div className="bot-card-stats">
        <div className="bot-card-stat full">
          <span className="bot-card-stat-label">Symbols</span>
          <span className="bot-card-stat-value wrap">{bot.symbols.join(', ')}</span>
        </div>
        <div className="bot-card-stat">
          <span className="bot-card-stat-label">Sessions</span>
          <span className="bot-card-stat-value">{bot.sessions.join(', ')}</span>
        </div>
        <div className="bot-card-stat">
          <span className="bot-card-stat-label">Last check</span>
          <span className="bot-card-stat-value">{fmtTime(bot.last_check_at)}</span>
        </div>
        <div className="bot-card-stat">
          <span className="bot-card-stat-label">Max trades/day</span>
          <span className="bot-card-stat-value">
            {maxPerDay}{!bot.max_trades_per_day && ' (auto = symbol count)'}
          </span>
        </div>
        <div className="bot-card-stat full">
          <span className="bot-card-stat-label">Risk per trade</span>
          {isReal ? (
            <span className="bot-card-stat-value wrap">${bot.risk_per_trade_usd} &middot; real BloFin funds</span>
          ) : (
            <span className="bot-card-stat-value wrap">{bot.risk_percent}% (capped ${bot.max_loss_usd}) &middot; ${bot.paper_balance} paper balance</span>
          )}
        </div>
        {isReal && (
          <div className="bot-card-stat full">
            <span className="bot-card-stat-label">Leverage &amp; margin</span>
            <span className="bot-card-stat-value">{bot.leverage}x &middot; {bot.margin_mode === 'isolated' ? 'Isolated' : 'Cross'}</span>
          </div>
        )}
      </div>

      <div className="bot-card-actions">
        <button className="btn-ghost" onClick={toggleStatus} disabled={busy}>
          {bot.status === 'running' ? 'Pause' : 'Start'}
        </button>
        <button className="btn-ghost" onClick={() => setShowTrades((v) => !v)}>
          {showTrades ? 'Hide trades' : 'View trades'}
        </button>
        {lastCheck && (
          <button className="btn-ghost" onClick={() => setShowLastCheck((v) => !v)}>
            {showLastCheck ? 'Hide last check' : 'Why no trade?'}
          </button>
        )}
        <button className="btn-ghost danger" onClick={handleDelete} disabled={busy} aria-label="Delete bot">
          Delete
        </button>
      </div>

      {showLastCheck && lastCheck && (
        <div className="bot-card-lastcheck">
          <div className="bot-card-lastcheck-head">
            {lastCheck.session} session &middot; {fmtTime(lastCheck.time)}
          </div>
          <table className="last-check-table">
            <thead>
              <tr><th>Symbol</th><th>Result</th><th>Detail</th></tr>
            </thead>
            <tbody>
              {(lastCheck.results || []).map((r) => (
                <tr key={r.symbol}>
                  <td>{r.symbol}</td>
                  <td><span className={`badge ${r.status}`}>{r.status}</span></td>
                  <td className="wrap">{r.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showTrades && (
        <div className="bot-card-trades">
          <TradesPanel botId={bot.id} />
        </div>
      )}
    </div>
  );
}
