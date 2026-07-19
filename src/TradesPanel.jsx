import { useEffect, useState } from 'react';
import * as api from './client';

function n(v) { return v === null || v === undefined ? null : Number(v); }
function fmtPrice(v) {
  const num = n(v);
  if (num === null || Number.isNaN(num)) return 'n/a';
  return num.toLocaleString(undefined, { maximumFractionDigits: num < 1 ? 6 : 2 });
}
function fmtUsd(v) {
  const num = n(v) || 0;
  return (num >= 0 ? '+$' : '-$') + Math.abs(num).toFixed(2);
}
function fmtTime(iso) {
  if (!iso) return '\u2014';
  return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function outcomeLabel(t) {
  const l1 = t.leg1_status === 'closed_tp', l2 = t.leg2_status === 'closed_tp';
  if (l1 && l2) return { text: 'TP1 + TP2 (Full)', cls: 'win' };
  if (l1 || l2) return { text: t.sl_moved_to_be ? 'TP1, then BE stop' : 'TP1 hit, then SL', cls: 'partial' };
  return { text: 'SL (Full loss)', cls: 'loss' };
}
function weekStartOf(iso) {
  const d = new Date(iso);
  const day = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  const dow = new Date(day).getUTCDay();
  return day - ((dow + 6) % 7) * 86400000;
}
function fmtWeek(ws) {
  const a = new Date(ws), b = new Date(ws + 6 * 86400000);
  const f = (x) => x.toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' });
  return `${f(a)} \u2013 ${f(b)}, ${b.getUTCFullYear()}`;
}

export default function TradesPanel({ botId }) {
  const [data, setData] = useState(null); // { open, closed }
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api.getBotTrades(botId).then(({ ok, body }) => {
      if (cancelled) return;
      if (ok) setData(body);
      else setError(body.error || 'Could not load trades.');
    });
    return () => { cancelled = true; };
  }, [botId]);

  if (error) return <div className="auth-error">{error}</div>;
  if (!data) return <p className="muted-text">Loading trades...</p>;

  const closed = data.closed || [];
  const open = data.open || [];

  const wins = closed.filter((t) => t.leg1_status === 'closed_tp' || t.leg2_status === 'closed_tp').length;
  const losses = closed.length - wins;
  const totalPnl = closed.reduce((a, t) => a + (n(t.pnl_usd) || 0), 0);
  const winRate = closed.length ? ((wins / closed.length) * 100).toFixed(1) + '%' : 'n/a';

  const weeks = new Map();
  closed.forEach((t) => {
    const ws = weekStartOf(t.closed_at || t.opened_at);
    if (!weeks.has(ws)) weeks.set(ws, []);
    weeks.get(ws).push(t);
  });
  const weekEntries = [...weeks.entries()].sort((a, b) => b[0] - a[0]);

  return (
    <div className="trades-panel">
      <div className="trades-summary">
        <div className="trades-chip"><span className="trades-chip-value">{closed.length}</span><span className="trades-chip-label">Closed</span></div>
        <div className="trades-chip"><span className="trades-chip-value bull">{wins}</span><span className="trades-chip-label">Wins</span></div>
        <div className="trades-chip"><span className="trades-chip-value bear">{losses}</span><span className="trades-chip-label">Losses</span></div>
        <div className="trades-chip"><span className="trades-chip-value">{winRate}</span><span className="trades-chip-label">Win rate</span></div>
        <div className="trades-chip"><span className={`trades-chip-value ${totalPnl >= 0 ? 'bull' : 'bear'}`}>{fmtUsd(totalPnl)}</span><span className="trades-chip-label">P&amp;L</span></div>
      </div>

      <div className="trades-subhead">Open / Pending ({open.length})</div>
      {open.length === 0 ? (
        <p className="muted-text small">No open or pending trades.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Symbol</th><th>Side</th><th>Status</th><th>Entry</th><th>SL</th><th>TP1</th><th>TP2</th><th>Opened</th></tr>
            </thead>
            <tbody>
              {open.map((t) => (
                <tr key={t.id}>
                  <td>{t.symbol}</td>
                  <td className={t.side === 'Buy' ? 'bull' : 'bear'}>{t.side}</td>
                  <td>
                    <span className={`badge ${t.status}`}>{t.status}</span>
                    {t.sl_moved_to_be && <span className="badge riskfree">RISK FREE</span>}
                  </td>
                  <td>{fmtPrice(t.entry)}</td>
                  <td>{fmtPrice(t.sl)}</td>
                  <td>{fmtPrice(t.tp1)}</td>
                  <td>{fmtPrice(t.tp2)}</td>
                  <td>{fmtTime(t.opened_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="trades-subhead">Closed \u2014 week by week</div>
      {weekEntries.length === 0 ? (
        <p className="muted-text small">No closed trades yet.</p>
      ) : (
        weekEntries.map(([ws, trades]) => {
          const wWins = trades.filter((t) => t.leg1_status === 'closed_tp' || t.leg2_status === 'closed_tp').length;
          const wLosses = trades.length - wWins;
          const wPnl = trades.reduce((a, t) => a + (n(t.pnl_usd) || 0), 0);
          return (
            <div key={ws} className="week-block">
              <div className="week-head">
                Week of {fmtWeek(ws)}
                <span className="week-stats">
                  {trades.length} trades &middot; <i className="bull">{wWins}W</i> / <i className="bear">{wLosses}L</i> &middot;{' '}
                  <i className={wPnl >= 0 ? 'bull' : 'bear'}>{fmtUsd(wPnl)}</i>
                </span>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Symbol</th><th>Side</th><th>Entry</th><th>Outcome</th><th>P&amp;L</th><th>Confluences</th><th>Opened</th></tr>
                  </thead>
                  <tbody>
                    {trades.map((t) => {
                      const o = outcomeLabel(t);
                      return (
                        <tr key={t.id}>
                          <td>{t.symbol}</td>
                          <td className={t.side === 'Buy' ? 'bull' : 'bear'}>{t.side}</td>
                          <td>{fmtPrice(t.entry)}</td>
                          <td><span className={`badge ${o.cls}`}>{o.text}</span></td>
                          <td className={n(t.pnl_usd) >= 0 ? 'bull' : 'bear'}>{fmtUsd(t.pnl_usd)}</td>
                          <td className="confluences">{t.confluences || '\u2014'}</td>
                          <td>{fmtTime(t.opened_at)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
