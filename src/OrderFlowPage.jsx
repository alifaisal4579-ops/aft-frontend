import { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';

// PHASE 1 of the real Order Flow tool -- the core Aggregated Depth Ladder
// (13-venue order book aggregation + local-neighborhood wall detection),
// ported with the exact same logic as the real site's page-orderflow.
// NOT yet included (real site has these too, coming in a later phase):
// CVD panel, Open Interest, Funding Rate, Long/Short Ratio, Premium/Basis,
// Liquidations (WebSocket), live Trade Tape (WebSocket), the confluence
// overlay on the ladder (needs Fibonacci/VWAP/Profile logic ported first),
// and the Depth Chart view toggle.

const SYMBOL_OPTIONS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT', 'DOGEUSDT', 'ADAUSDT'];
const ROWS = 22;

async function fetchJson(url, retries = 2) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
  } catch (e) {
    if (retries > 0) { await new Promise((r) => setTimeout(r, 400)); return fetchJson(url, retries - 1); }
    throw e;
  }
}

function fmtPrice(v) {
  if (v === null || v === undefined || isNaN(v)) return 'n/a';
  return v.toLocaleString(undefined, { maximumFractionDigits: v < 1 ? 6 : 2 });
}
function fmtCompact(v) {
  if (v === null || v === undefined || isNaN(v)) return 'n/a';
  const abs = Math.abs(v);
  const sign = v < 0 ? '-' : '';
  if (abs >= 1e9) return sign + (abs / 1e9).toFixed(2) + 'B';
  if (abs >= 1e6) return sign + (abs / 1e6).toFixed(2) + 'M';
  if (abs >= 1e3) return sign + (abs / 1e3).toFixed(1) + 'K';
  return sign + abs.toFixed(2);
}

async function fetchTicker(symbol, exchange, futures) {
  if (exchange === 'bybit') {
    const category = futures ? 'linear' : 'spot';
    const data = await fetchJson(`https://api.bybit.com/v5/market/tickers?category=${category}&symbol=${symbol}`);
    if (data.retCode !== 0) throw new Error(symbol + ': ' + (data.retMsg || 'Bybit error'));
    const t = data.result && data.result.list && data.result.list[0];
    if (!t) throw new Error(symbol + ': no ticker data on Bybit.');
    return { lastPrice: parseFloat(t.lastPrice), change1dPct: parseFloat(t.price24hPcnt) * 100 };
  }
  const base = futures ? 'https://fapi.binance.com' : 'https://api.binance.com';
  const path = futures ? '/fapi/v1/ticker/24hr' : '/api/v3/ticker/24hr';
  const t = await fetchJson(`${base}${path}?symbol=${symbol}`);
  return { lastPrice: parseFloat(t.lastPrice), change1dPct: parseFloat(t.priceChangePercent) };
}

function okxInstId(symbol) {
  if (symbol.endsWith('USDT')) return symbol.slice(0, -4) + '-USDT-SWAP';
  if (symbol.endsWith('USDC')) return symbol.slice(0, -4) + '-USDC-SWAP';
  return symbol;
}
let okxCtValCache = {};
async function fetchOkxCtVal(instId) {
  if (okxCtValCache[instId]) return okxCtValCache[instId];
  const res = await fetchJson(`https://www.okx.com/api/v5/public/instruments?instType=SWAP&instId=${instId}`);
  if (!res.data || !res.data.length) throw new Error('OKX instrument not found: ' + instId);
  const ctVal = parseFloat(res.data[0].ctVal);
  okxCtValCache[instId] = ctVal;
  return ctVal;
}
let mexcCsCache = {};
async function fetchMexcContractSize(mexcSymbol) {
  if (mexcCsCache[mexcSymbol]) return mexcCsCache[mexcSymbol];
  const res = await fetchJson(`https://contract.mexc.com/api/v1/contract/detail?symbol=${mexcSymbol}`);
  if (!res.data || !res.data.contractSize) throw new Error('MEXC contract not found: ' + mexcSymbol);
  const cs = parseFloat(res.data.contractSize);
  mexcCsCache[mexcSymbol] = cs;
  return cs;
}

// Aggregates 13 public order books (up to ~1900 raw price levels per side
// from free REST endpoints). Any venue that fails (CORS, pair not listed)
// simply drops out via allSettled -- the meta line shows which markets
// actually made it in, exactly like the real site.
async function fetchDepthAll(symbol) {
  const okxSpotId = symbol.replace(/(USDT|USDC)$/, '-$1');
  const okxPerpId = okxInstId(symbol);
  const defs = [
    ['Binance Perp', async () => {
      const d = await fetchJson(`https://fapi.binance.com/fapi/v1/depth?symbol=${symbol}&limit=1000`);
      return { bids: d.bids.map(([p, q]) => [+p, +q]), asks: d.asks.map(([p, q]) => [+p, +q]) };
    }],
    ['Binance Spot', async () => {
      const d = await fetchJson(`https://api.binance.com/api/v3/depth?symbol=${symbol}&limit=5000`);
      return { bids: d.bids.map(([p, q]) => [+p, +q]), asks: d.asks.map(([p, q]) => [+p, +q]) };
    }],
    ['Bybit Perp', async () => {
      const d = await fetchJson(`https://api.bybit.com/v5/market/orderbook?category=linear&symbol=${symbol}&limit=500`);
      if (d.retCode !== 0) throw new Error(d.retMsg || 'Bybit error');
      return { bids: d.result.b.map(([p, q]) => [+p, +q]), asks: d.result.a.map(([p, q]) => [+p, +q]) };
    }],
    ['Bybit Spot', async () => {
      const d = await fetchJson(`https://api.bybit.com/v5/market/orderbook?category=spot&symbol=${symbol}&limit=200`);
      if (d.retCode !== 0) throw new Error(d.retMsg || 'Bybit error');
      return { bids: d.result.b.map(([p, q]) => [+p, +q]), asks: d.result.a.map(([p, q]) => [+p, +q]) };
    }],
    ['OKX Perp', async () => {
      const d = await fetchJson(`https://www.okx.com/api/v5/market/books?instId=${okxPerpId}&sz=400`);
      if (d.code !== '0' || !d.data || !d.data[0]) throw new Error('OKX error ' + (d.msg || d.code));
      const mult = await fetchOkxCtVal(okxPerpId);
      return { bids: d.data[0].bids.map((r) => [+r[0], +r[1] * mult]), asks: d.data[0].asks.map((r) => [+r[0], +r[1] * mult]) };
    }],
    ['OKX Spot', async () => {
      const d = await fetchJson(`https://www.okx.com/api/v5/market/books?instId=${okxSpotId}&sz=400`);
      if (d.code !== '0' || !d.data || !d.data[0]) throw new Error('OKX error ' + (d.msg || d.code));
      return { bids: d.data[0].bids.map((r) => [+r[0], +r[1]]), asks: d.data[0].asks.map((r) => [+r[0], +r[1]]) };
    }],
    ['MEXC Spot', async () => {
      const d = await fetchJson(`https://api.mexc.com/api/v3/depth?symbol=${symbol}&limit=5000`);
      if (!d.bids || !d.asks) throw new Error('MEXC spot error');
      return { bids: d.bids.map(([p, q]) => [+p, +q]), asks: d.asks.map(([p, q]) => [+p, +q]) };
    }],
    ['MEXC Perp', async () => {
      const ms = symbol.replace(/(USDT|USDC)$/, '_$1');
      const d = await fetchJson(`https://contract.mexc.com/api/v1/contract/depth/${ms}?limit=1000`);
      if (!d.data || !d.data.bids) throw new Error('MEXC perp error');
      const cs = await fetchMexcContractSize(ms);
      return { bids: d.data.bids.map((r) => [+r[0], +r[1] * cs]), asks: d.data.asks.map((r) => [+r[0], +r[1] * cs]) };
    }],
    ['Gate Spot', async () => {
      const gs = symbol.replace(/(USDT|USDC)$/, '_$1');
      const d = await fetchJson(`https://api.gateio.ws/api/v4/spot/order_book?currency_pair=${gs}&limit=100`);
      if (!d.bids || !d.asks) throw new Error('Gate spot error');
      return { bids: d.bids.map(([p, q]) => [+p, +q]), asks: d.asks.map(([p, q]) => [+p, +q]) };
    }],
    ['Bitget Spot', async () => {
      const d = await fetchJson(`https://api.bitget.com/api/v2/spot/market/orderbook?symbol=${symbol}&type=step0&limit=150`);
      if (!d.data || !d.data.bids) throw new Error('Bitget spot error ' + (d.msg || ''));
      return { bids: d.data.bids.map(([p, q]) => [+p, +q]), asks: d.data.asks.map(([p, q]) => [+p, +q]) };
    }],
    ['Bitget Perp', async () => {
      const d = await fetchJson(`https://api.bitget.com/api/v2/mix/market/merge-depth?productType=USDT-FUTURES&symbol=${symbol}&limit=100`);
      if (!d.data || !d.data.bids) throw new Error('Bitget perp error ' + (d.msg || ''));
      return { bids: d.data.bids.map(([p, q]) => [+p, +q]), asks: d.data.asks.map(([p, q]) => [+p, +q]) };
    }],
    ['Kraken Spot', async () => {
      const d = await fetchJson(`https://api.kraken.com/0/public/Depth?pair=${symbol}&count=500`);
      if (d.error && d.error.length) throw new Error('Kraken: ' + d.error[0]);
      const book = d.result && Object.values(d.result)[0];
      if (!book || !book.bids) throw new Error('Kraken: pair not found');
      return { bids: book.bids.map((r) => [+r[0], +r[1]]), asks: book.asks.map((r) => [+r[0], +r[1]]) };
    }],
    ['HTX Spot', async () => {
      const d = await fetchJson(`https://api.huobi.pro/market/depth?symbol=${symbol.toLowerCase()}&type=step0`);
      if (d.status !== 'ok' || !d.tick || !d.tick.bids) throw new Error('HTX error ' + (d['err-msg'] || ''));
      return { bids: d.tick.bids.map(([p, q]) => [+p, +q]), asks: d.tick.asks.map(([p, q]) => [+p, +q]) };
    }],
    ['KuCoin Spot', async () => {
      const ks = symbol.replace(/(USDT|USDC)$/, '-$1');
      const d = await fetchJson(`https://api.kucoin.com/api/v1/market/orderbook/level2_100?symbol=${ks}`);
      if (!d.data || !d.data.bids) throw new Error('KuCoin error ' + (d.msg || ''));
      return { bids: d.data.bids.map(([p, q]) => [+p, +q]), asks: d.data.asks.map(([p, q]) => [+p, +q]) };
    }],
  ];
  const results = await Promise.allSettled(defs.map(([, fn]) => fn()));
  const books = [], used = [];
  results.forEach((r, i) => {
    if (r.status === 'fulfilled') { books.push(r.value); used.push(defs[i][0]); }
    else console.warn('[Depth Ladder] ' + defs[i][0] + ' failed:', r.reason && r.reason.message);
  });
  if (!books.length) throw new Error('All order book sources failed.');
  return { books, used };
}

function niceBinSize(raw) {
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const n = raw / mag;
  let nice;
  if (n < 1.5) nice = 1; else if (n < 2.25) nice = 2; else if (n < 3.75) nice = 2.5; else if (n < 7.5) nice = 5; else nice = 10;
  return nice * mag;
}
function medianOf(arr) {
  const s = arr.slice().sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

// Computes the ladder rows + wall set + imbalance from raw aggregated
// books -- same binning, same LOCAL-neighborhood (6-either-side) wall
// detection with a global-median floor, same as the real site.
function computeLadder(books, binDetail, wallSeenMap) {
  const allBids = [], allAsks = [];
  books.forEach((b) => { allBids.push(...b.bids); allAsks.push(...b.asks); });
  if (!allBids.length || !allAsks.length) throw new Error('Empty order book.');

  const mids = books
    .filter((b) => b.bids.length && b.asks.length)
    .map((b) => (Math.max(...b.bids.map((r) => r[0])) + Math.min(...b.asks.map((r) => r[0]))) / 2);
  const mid = mids.reduce((a, b) => a + b, 0) / mids.length;

  const lowBid = Math.min(...allBids.map((r) => r[0]));
  const highAsk = Math.max(...allAsks.map((r) => r[0]));
  const span = Math.max(highAsk - lowBid, mid * 0.0001);
  const divisor = binDetail === 'fine' ? 88 : binDetail === 'coarse' ? 22 : 44;
  const binSize = niceBinSize(span / divisor);

  const bidBins = new Map(), askBins = new Map();
  allBids.forEach(([p, q]) => { if (p > mid) return; const k = Math.floor(p / binSize) * binSize; bidBins.set(k, (bidBins.get(k) || 0) + q); });
  allAsks.forEach(([p, q]) => { if (p < mid) return; const k = Math.floor(p / binSize) * binSize; askBins.set(k, (askBins.get(k) || 0) + q); });

  const bidRows = [...bidBins.entries()].sort((a, b) => b[0] - a[0]).slice(0, ROWS);
  const askRowsAsc = [...askBins.entries()].sort((a, b) => a[0] - b[0]).slice(0, ROWS);
  const askRows = askRowsAsc.slice().reverse();

  const sumBid = bidRows.reduce((a, r) => a + r[1], 0);
  const sumAsk = askRows.reduce((a, r) => a + r[1], 0);
  const bidPct = sumBid + sumAsk > 0 ? (sumBid / (sumBid + sumAsk)) * 100 : 50;

  const allQty = [...bidRows.map((r) => r[1]), ...askRows.map((r) => r[1])];
  const maxQty = Math.max(...allQty, 1e-9);

  const ordered = [...bidRows.slice().reverse(), ...askRowsAsc];
  const orderedQty = ordered.map((r) => r[1]);
  const floorQty = medianOf(orderedQty) * 2;
  const wallSet = new Set();
  ordered.forEach(([p, q], i) => {
    const lo = Math.max(0, i - 6), hi = Math.min(orderedQty.length, i + 7);
    const neigh = [];
    for (let j = lo; j < hi; j++) if (j !== i) neigh.push(orderedQty[j]);
    if (neigh.length && q >= medianOf(neigh) * 3 && q >= floorQty) wallSet.add(p);
  });

  const now = Date.now();
  const newSeen = new Map();
  function wallAge(side, price) {
    const key = side + ':' + price.toFixed(8);
    const first = wallSeenMap.get(key) || now;
    newSeen.set(key, first);
    const ms = now - first;
    if (ms < 60000) return 'new';
    if (ms < 3600000) return Math.floor(ms / 60000) + 'm';
    return Math.floor(ms / 3600000) + 'h' + Math.floor((ms % 3600000) / 60000) + 'm';
  }

  const bidDisplay = bidRows.map(([p, q]) => ({ price: p, qty: q, side: 'bid', wall: wallSet.has(p), age: wallSet.has(p) ? wallAge('bid', p) : null, dist: (p - mid) / mid * 100 }));
  const askDisplay = askRows.map(([p, q]) => ({ price: p, qty: q, side: 'ask', wall: wallSet.has(p), age: wallSet.has(p) ? wallAge('ask', p) : null, dist: (p - mid) / mid * 100 }));

  return { mid, binSize, bidRows: bidDisplay, askRows: askDisplay, maxQty, bidPct, newSeen, lo: bidRows.length ? bidRows[bidRows.length - 1][0] : mid, hi: askRowsAsc.length ? askRowsAsc[askRowsAsc.length - 1][0] : mid };
}

export default function OrderFlowPage() {
  const [exchange, setExchange] = useState('bybit');
  const [market, setMarket] = useState('futures');
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [customSymbol, setCustomSymbol] = useState('');
  const [binDetail, setBinDetail] = useState('auto');
  const [ticker, setTicker] = useState(null);
  const [ladder, setLadder] = useState(null);
  const [usedVenues, setUsedVenues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [imbHist, setImbHist] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);

  const wallSeenRef = useRef(new Map());
  const timerRef = useRef(null);
  const activeSymbolRef = useRef('BTCUSDT');

  const currentSymbol = () => (symbol === '__custom' ? customSymbol.trim().toUpperCase() : symbol);

  const load = useCallback(async () => {
    const sym = activeSymbolRef.current;
    if (!sym) return;
    setLoading(true);
    setError(null);
    try {
      const [t, { books, used }] = await Promise.all([
        fetchTicker(sym, exchange, market === 'futures'),
        fetchDepthAll(sym),
      ]);
      setTicker(t);
      const computed = computeLadder(books, binDetail, wallSeenRef.current);
      wallSeenRef.current = computed.newSeen;
      setLadder(computed);
      setUsedVenues(used);
      setImbHist((prev) => {
        const next = [...prev, computed.bidPct];
        return next.length > 120 ? next.slice(-120) : next;
      });
      setLastUpdated(new Date());
    } catch (e) {
      setError(e.message || 'Failed to load.');
    } finally {
      setLoading(false);
    }
  }, [exchange, market, binDetail]);

  function handleLoadClick() {
    const sym = currentSymbol();
    if (!sym) { setError('Enter a custom pair.'); return; }
    activeSymbolRef.current = sym;
    wallSeenRef.current = new Map();
    setImbHist([]);
    load();
  }

  useEffect(() => {
    if (!activeSymbolRef.current) return;
    clearInterval(timerRef.current);
    timerRef.current = setInterval(load, 5000);
    return () => clearInterval(timerRef.current);
  }, [load]);

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const sparkPoints = imbHist.length >= 2
    ? imbHist.map((v, i) => `${(i / (imbHist.length - 1) * 90).toFixed(1)},${(18 - (v / 100) * 18).toFixed(1)}`).join(' ')
    : '';

  return (
    <div className="of-wrap">
      <Link to="/tools" className="back-link">&larr; Back to Tools</Link>
      <div className="of-header">
        <h1>Order Flow</h1>
        <p>Aggregated depth ladder across up to 13 venues, with local-neighborhood wall detection</p>
      </div>

      <div className="of-controls">
        <div className="of-field">
          <label>Exchange (ticker)</label>
          <select value={exchange} onChange={(e) => setExchange(e.target.value)}>
            <option value="binance">Binance</option>
            <option value="bybit">Bybit</option>
          </select>
        </div>
        <div className="of-field">
          <label>Market (ticker)</label>
          <select value={market} onChange={(e) => setMarket(e.target.value)}>
            <option value="futures">Futures (USDT-M)</option>
            <option value="spot">Spot</option>
          </select>
        </div>
        <div className="of-field">
          <label>Symbol</label>
          <select value={symbol} onChange={(e) => setSymbol(e.target.value)}>
            {SYMBOL_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            <option value="__custom">Custom&hellip;</option>
          </select>
        </div>
        {symbol === '__custom' && (
          <div className="of-field">
            <label>Custom pair</label>
            <input type="text" value={customSymbol} onChange={(e) => setCustomSymbol(e.target.value)} placeholder="e.g. LTCUSDT" />
          </div>
        )}
        <button onClick={handleLoadClick} disabled={loading}>{loading ? 'Loading\u2026' : 'Load'}</button>
      </div>

      {ticker && (
        <div className="of-ticker">
          <span className="of-ticker-dot"></span>
          <span className="of-ticker-sym">{activeSymbolRef.current}{market === 'futures' ? '.P' : ''}</span>
          <span className="of-ticker-price">{fmtPrice(ticker.lastPrice)}</span>
          <span className={`of-ticker-pct ${ticker.change1dPct >= 0 ? 'up' : 'down'}`}>{ticker.change1dPct >= 0 ? '+' : ''}{ticker.change1dPct.toFixed(2)}%</span>
          <span className="of-ticker-meta">24H change</span>
        </div>
      )}

      <div className="of-panel" style={{ marginTop: 16 }}>
        <div className="of-panel-title" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <span>Order Book &mdash; Aggregated Depth Ladder (up to 13 markets)</span>
          <label className="of-tape-filter">Detail
            <select value={binDetail} onChange={(e) => setBinDetail(e.target.value)}>
              <option value="fine">Fine (more rows)</option>
              <option value="auto">Auto</option>
              <option value="coarse">Coarse (bigger bins)</option>
            </select>
          </label>
        </div>

        {error && <div style={{ color: 'var(--bear)', fontFamily: 'var(--mono)', fontSize: 12, padding: '10px 0' }}>{error}</div>}

        {ladder && (
          <>
            <div className="of-imbalance">
              <div className="of-imbalance-bar"><div className="of-imbalance-fill" style={{ width: `${ladder.bidPct.toFixed(1)}%` }}></div></div>
              <div className="of-imb-row">
                <div className="of-imbalance-label">{ladder.bidPct.toFixed(1)}% bids &middot; {(100 - ladder.bidPct).toFixed(1)}% asks (visible range)</div>
                {sparkPoints && (
                  <span className="of-imb-spark">
                    <svg width="90" height="18" viewBox="0 0 90 18">
                      <line x1="0" y1="9" x2="90" y2="9" stroke="rgba(124,137,152,.35)" strokeDasharray="3,3" strokeWidth="1" />
                      <polyline points={sparkPoints} fill="none" stroke="#E8A63C" strokeWidth="1.5" />
                    </svg>
                  </span>
                )}
              </div>
            </div>

            <div className="of-ladder">
              {ladder.askRows.map((r) => (
                <div key={'a' + r.price} className={`of-lad-row ask${r.wall ? ' wall' : ''}`}>
                  <span className="lp">{fmtPrice(r.price)}</span>
                  <div className="lbar-wrap">
                    <div className="lbar" style={{ width: `${(r.qty / ladder.maxQty * 100).toFixed(1)}%` }}></div>
                    {r.wall && <span className="ltag">{fmtCompact(r.qty)} &middot; ${fmtCompact(r.qty * ladder.mid)} &middot; {r.dist >= 0 ? '+' : ''}{r.dist.toFixed(2)}% &middot; {r.age}</span>}
                  </div>
                  <span className="lq">{fmtCompact(r.qty)}</span>
                </div>
              ))}
              <div className="of-lad-mid"><span>{fmtPrice(ladder.mid)}</span><i>mid (all markets)</i></div>
              {ladder.bidRows.map((r) => (
                <div key={'b' + r.price} className={`of-lad-row bid${r.wall ? ' wall' : ''}`}>
                  <span className="lp">{fmtPrice(r.price)}</span>
                  <div className="lbar-wrap">
                    <div className="lbar" style={{ width: `${(r.qty / ladder.maxQty * 100).toFixed(1)}%` }}></div>
                    {r.wall && <span className="ltag">{fmtCompact(r.qty)} &middot; ${fmtCompact(r.qty * ladder.mid)} &middot; {r.dist >= 0 ? '+' : ''}{r.dist.toFixed(2)}% &middot; {r.age}</span>}
                  </div>
                  <span className="lq">{fmtCompact(r.qty)}</span>
                </div>
              ))}
            </div>

            <div className="of-lad-meta">
              Aggregated {usedVenues.length} markets ({usedVenues.join(', ')}) &middot; bin {fmtPrice(ladder.binSize)} &middot;
              covers {fmtPrice(ladder.lo)} &ndash; {fmtPrice(ladder.hi)} &middot; auto-refresh 5s &middot;
              updated {lastUpdated ? lastUpdated.toLocaleTimeString() : ''}
            </div>
          </>
        )}
      </div>

      <div className="of-caption">
        Combines up to 13 public order books (Binance, Bybit, OKX, MEXC, Gate, Bitget, Kraken, HTX, KuCoin -- spot and
        perp where available) into one aggregated ladder. A bin is flagged as a wall if it holds 3x+ the median of its
        ~6 neighbouring bins, with a floor of 2x the whole ladder's median. Wall age is tracked across refreshes so a
        persistent wall (minutes old) reads differently from one that just appeared. This is Phase 1 of the full tool
        &mdash; CVD, Open Interest, Funding, Long/Short Ratio, Liquidations and live Trade Tape are not included yet.
      </div>
    </div>
  );
}
