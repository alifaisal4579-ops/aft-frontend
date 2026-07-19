import { useEffect, useState } from 'react';

// Real, live RSI screener -- fetches 1h candles for a fixed watchlist
// directly from Bybit's public REST API and computes RSI(14) with the same
// Wilder's-smoothing formula AFT's own signal engine uses (signalEngine.js
// computeRSI), so the numbers here match what the bots actually see.
const SYMBOLS = [
  'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'XRPUSDT', 'BNBUSDT',
  'AVAXUSDT', 'NEARUSDT', 'SUIUSDT', 'DOGEUSDT', 'ADAUSDT',
];
const REFRESH_MS = 60000;

function computeRSI(closes, period = 14) {
  if (closes.length <= period) return null;
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff; else losses -= diff;
  }
  let avgGain = gains / period, avgLoss = losses / period;
  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    const gain = diff > 0 ? diff : 0, loss = diff < 0 ? -diff : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
  }
  return avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
}

async function fetchRsiFor(symbol) {
  const res = await fetch(`https://api.bybit.com/v5/market/kline?category=linear&symbol=${symbol}&interval=60&limit=100`);
  const data = await res.json();
  if (data.retCode !== 0) throw new Error(data.retMsg || 'Bybit error');
  const closes = data.result.list.slice().reverse().map((c) => Number(c[4])); // oldest-first
  return computeRSI(closes, 14);
}

export default function LiveRsiScreener() {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const results = await Promise.all(
          SYMBOLS.map(async (symbol) => {
            try {
              const rsi = await fetchRsiFor(symbol);
              return { symbol, rsi, ok: true };
            } catch (e) {
              return { symbol, rsi: null, ok: false };
            }
          })
        );
        if (cancelled) return;
        const ok = results.filter((r) => r.ok && r.rsi !== null);
        if (!ok.length) throw new Error('No symbols returned data.');
        ok.sort((a, b) => a.rsi - b.rsi); // most oversold first
        setRows(ok);
        setUpdatedAt(new Date());
        setError(null);
      } catch (e) {
        if (!cancelled) setError('Could not reach Bybit right now.');
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
    return <div className="live-widget-loading">Scanning live 1H candles&hellip;</div>;
  }

  const shown = [...rows.slice(0, 3), ...rows.slice(-2)]; // most oversold 3 + most overbought 2

  return (
    <div>
      <table className="mini-table">
        <thead><tr><th>Symbol</th><th>RSI (1H)</th><th>Signal</th></tr></thead>
        <tbody>
          {shown.map((r) => {
            const isLow = r.rsi < 35;
            const isHigh = r.rsi > 65;
            return (
              <tr key={r.symbol}>
                <td>{r.symbol}</td>
                <td>{r.rsi.toFixed(1)}</td>
                <td>
                  {isLow && <span className="pill bull">Oversold</span>}
                  {isHigh && <span className="pill bear">Overbought</span>}
                  {!isLow && !isHigh && <span className="pill" style={{ background: 'var(--tape-soft)', color: 'var(--tape)' }}>Neutral</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="live-widget-foot">
        <span>{SYMBOLS.length} symbols scanned &middot; Bybit 1H</span>
        <span>{updatedAt ? updatedAt.toLocaleTimeString() : ''}</span>
      </div>
    </div>
  );
}
