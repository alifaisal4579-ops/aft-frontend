import { useEffect, useState } from 'react';

// Real, live 24H % change leaderboard across all Bybit USDT-M perpetuals.
// Same public endpoint pattern used elsewhere in the dashboard (no auth,
// no backend involved). Refreshes every 30s.
const REFRESH_MS = 30000;
const MIN_TURNOVER_USD = 5_000_000; // filter out illiquid/low-volume pairs

function fmtPrice(v) {
  const n = Number(v);
  if (!isFinite(n)) return '—';
  return n.toLocaleString(undefined, { maximumFractionDigits: n < 1 ? 6 : 2 });
}

export default function GainersLosers() {
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
            price: parseFloat(t.lastPrice),
            pct: parseFloat(t.price24hPcnt) * 100,
            turnover: parseFloat(t.turnover24h),
          }))
          .filter((t) => t.turnover >= MIN_TURNOVER_USD && !isNaN(t.pct));

        const gainers = list.slice().sort((a, b) => b.pct - a.pct).slice(0, 5);
        const losers = list.slice().sort((a, b) => a.pct - b.pct).slice(0, 5);

        setRows({ gainers, losers });
        setUpdatedAt(new Date());
        setError(null);
      } catch (e) {
        if (!cancelled) setError('Could not load market movers right now.');
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
    return <div className="live-widget-loading">Scanning the futures market&hellip;</div>;
  }

  return (
    <div className="movers-grid">
      <div className="movers-col">
        <div className="movers-col-head bull">Top 5 Gainers</div>
        <div className="movers-list">
          {rows.gainers.map((r, i) => (
            <div className="movers-row" key={r.symbol}>
              <span className="movers-rank">#{i + 1}</span>
              <span className="movers-sym">{r.symbol.replace('USDT', '')}</span>
              <span className="movers-price">{fmtPrice(r.price)}</span>
              <span className="movers-pct up">+{r.pct.toFixed(2)}%</span>
            </div>
          ))}
        </div>
      </div>
      <div className="movers-col">
        <div className="movers-col-head bear">Top 5 Losers</div>
        <div className="movers-list">
          {rows.losers.map((r, i) => (
            <div className="movers-row" key={r.symbol}>
              <span className="movers-rank">#{i + 1}</span>
              <span className="movers-sym">{r.symbol.replace('USDT', '')}</span>
              <span className="movers-price">{fmtPrice(r.price)}</span>
              <span className="movers-pct down">{r.pct.toFixed(2)}%</span>
            </div>
          ))}
        </div>
      </div>
      <div className="live-widget-foot movers-foot">
        <span>USDT-M perpetuals &middot; Bybit &middot; min $5M 24h turnover</span>
        <span>{updatedAt ? updatedAt.toLocaleTimeString() : ''}</span>
      </div>
    </div>
  );
}
