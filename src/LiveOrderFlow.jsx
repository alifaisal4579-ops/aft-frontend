import { useEffect, useState, useRef } from 'react';

// Real, live order-book depth from Bybit's public REST API (no auth needed,
// same endpoint pattern already proven in AFT's own bots' bybitClient.js).
// Refreshes every 5s. If the fetch fails (rate limit, network), shows a
// clear error instead of silently freezing on stale/fake numbers.
const SYMBOL = 'BTCUSDT';
const REFRESH_MS = 5000;

function fmtPrice(v) {
  const n = Number(v);
  return n.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}
function fmtSize(v) {
  const n = Number(v);
  if (n >= 1) return n.toFixed(3);
  return n.toFixed(4);
}

export default function LiveOrderFlow() {
  const [book, setBook] = useState(null);
  const [error, setError] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(`https://api.bybit.com/v5/market/orderbook?category=linear&symbol=${SYMBOL}&limit=8`);
        const data = await res.json();
        if (data.retCode !== 0) throw new Error(data.retMsg || 'Bybit error');
        if (cancelled) return;
        setBook(data.result);
        setUpdatedAt(new Date());
        setError(null);
      } catch (e) {
        if (!cancelled) setError('Could not reach Bybit right now.');
      }
    }

    load();
    timerRef.current = setInterval(load, REFRESH_MS);
    return () => { cancelled = true; clearInterval(timerRef.current); };
  }, []);

  if (error) {
    return <div className="live-widget-error">{error}</div>;
  }
  if (!book) {
    return <div className="live-widget-loading">Connecting to live order book&hellip;</div>;
  }

  const asks = book.a.slice(0, 6).slice().reverse(); // lowest ask last so it sits nearest the mid line
  const bids = book.b.slice(0, 6);
  const bestBid = Number(bids[0]?.[0]);
  const bestAsk = Number(asks[asks.length - 1]?.[0]);
  const mid = (bestBid + bestAsk) / 2;
  const maxSize = Math.max(...asks.map((a) => Number(a[1])), ...bids.map((b) => Number(b[1])), 0.0001);

  return (
    <div className="ladder">
      {asks.map(([price, size]) => (
        <div className="ladder-row" key={'a' + price}>
          <span></span>
          <div className="ladder-bar ask" style={{ width: `${Math.min(100, (Number(size) / maxSize) * 100)}%` }}></div>
          <span className="ladder-price">{fmtPrice(price)}</span>
        </div>
      ))}
      <div className="ladder-row"><span></span><span className="ladder-price mid">{fmtPrice(mid)} &middot; mid</span><span></span></div>
      {bids.map(([price, size]) => (
        <div className="ladder-row" key={'b' + price}>
          <span className="ladder-price">{fmtPrice(price)}</span>
          <div className="ladder-bar bid" style={{ width: `${Math.min(100, (Number(size) / maxSize) * 100)}%` }}></div>
          <span></span>
        </div>
      ))}
      <div className="live-widget-foot">
        <span>{SYMBOL} &middot; Bybit perpetual, live depth</span>
        <span>{updatedAt ? updatedAt.toLocaleTimeString() : ''}</span>
      </div>
    </div>
  );
}
