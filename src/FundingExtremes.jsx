import { useEffect, useState } from 'react';

// Live funding-rate leaderboard across Bybit USDT-M perpetuals. Extreme
// funding (very positive or very negative) often signals crowded
// positioning and squeeze risk -- informational only, not a signal.
const REFRESH_MS = 60000;
const MIN_TURNOVER_USD = 5_000_000;

function fmtPct(v) {
  return (v >= 0 ? '+' : '') + (v * 100).toFixed(4) + '%';
}

export default function FundingExtremes() {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch('https://api.bybit.com/v5/market/tickers?category=linear');
        const data = await res.json();
        if (data.retCode !== 0) throw new Error(data.retMsg || 'Bybit error');
        if (cancelled) return;

        const list = data.result.list
          .filter((t) => t.symbol.endsWith('USDT'))
          .map((t) => ({
            symbol: t.symbol,
            funding: parseFloat(t.fundingRate),
            turnover: parseFloat(t.turnover24h),
          }))
          .filter((t) => t.turnover >= MIN_TURNOVER_USD && !isNaN(t.funding));

        const highest = list.slice().sort((a, b) => b.funding - a.funding).slice(0, 4);
        const lowest = list.slice().sort((a, b) => a.funding - b.funding).slice(0, 4);

        setRows({ highest, lowest });
        setUpdatedAt(new Date());
        setError(null);
      } catch (e) {
        if (!cancelled) setError('Could not load funding rates right now.');
      }
    }

    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => { cancelled = true; clearInterval(timer); };
  }, []);

  if (error) {
    return <div className="live-widget-error">{error}</div>;
  }
  if (!rows) {
    return <div className="live-widget-loading">Checking funding rates&hellip;</div>;
  }

  return (
    <div className="movers-grid">
      <div className="movers-col">
        <div className="movers-col-head bear">Highest Funding (longs paying)</div>
        <div className="movers-list">
          {rows.highest.map((r, i) => (
            <div className="movers-row funding-row" key={r.symbol}>
              <span className="movers-rank">#{i + 1}</span>
              <span className="movers-sym">{r.symbol.replace('USDT', '')}</span>
              <span className="movers-pct down">{fmtPct(r.funding)}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="movers-col">
        <div className="movers-col-head bull">Lowest Funding (shorts paying)</div>
        <div className="movers-list">
          {rows.lowest.map((r, i) => (
            <div className="movers-row funding-row" key={r.symbol}>
              <span className="movers-rank">#{i + 1}</span>
              <span className="movers-sym">{r.symbol.replace('USDT', '')}</span>
              <span className="movers-pct up">{fmtPct(r.funding)}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="live-widget-foot movers-foot">
        <span>USDT-M perpetuals &middot; Bybit &middot; per 8h funding</span>
        <span>{updatedAt ? updatedAt.toLocaleTimeString() : ''}</span>
      </div>
    </div>
  );
}
