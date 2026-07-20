import { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';

// PHASE 1+2 of the real Order Flow tool: Aggregated Depth Ladder + CVD +
// Open Interest + Funding Rate + Long/Short Ratio + Premium/Basis, plus the
// cross-referencing "read" text under each panel -- ported with the exact
// same logic as the real site's page-orderflow.
// NOT yet included (real site has these too, coming in a later phase):
// live Trade Tape (WebSocket), live Liquidations feed (WebSocket), the
// Multi-Coin Comparison scanner (100-coin scan with its own table), the
// confluence overlay on the ladder (needs Fibonacci/VWAP/Profile logic
// ported first), and the Depth Chart view toggle.

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

function loadChartJs() {
  return new Promise((resolve) => {
    if (window.Chart) { resolve(window.Chart); return; }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.umd.min.js';
    script.onload = () => resolve(window.Chart);
    document.head.appendChild(script);
  });
}

// ---- Open Interest (combined Binance + Bybit + OKX) ----
async function fetchBinanceOi(symbol) {
  const [curRes, histRes] = await Promise.all([
    fetchJson(`https://fapi.binance.com/fapi/v1/openInterest?symbol=${symbol}`),
    fetchJson(`https://fapi.binance.com/futures/data/openInterestHist?symbol=${symbol}&period=1h&limit=48`),
  ]);
  const current = parseFloat(curRes.openInterest);
  const history = histRes.map((r) => ({ time: r.timestamp, oi: parseFloat(r.sumOpenInterest) }));
  return { current, history };
}
async function fetchBybitOi(symbol) {
  const [curRes, histRes] = await Promise.all([
    fetchJson(`https://api.bybit.com/v5/market/open-interest?category=linear&symbol=${symbol}&intervalTime=1h&limit=1`),
    fetchJson(`https://api.bybit.com/v5/market/open-interest?category=linear&symbol=${symbol}&intervalTime=1h&limit=48`),
  ]);
  if (curRes.retCode !== 0) throw new Error(curRes.retMsg || 'Bybit error');
  const current = parseFloat(curRes.result.list[0].openInterest);
  const history = histRes.result.list.slice().reverse().map((r) => ({ time: +r.timestamp, oi: parseFloat(r.openInterest) }));
  return { current, history };
}
async function fetchOkxOi(symbol) {
  const instId = okxInstId(symbol);
  const [oiRes, ctVal] = await Promise.all([
    fetchJson(`https://www.okx.com/api/v5/public/open-interest?instId=${instId}`),
    fetchOkxCtVal(instId),
  ]);
  if (!oiRes.data || !oiRes.data.length) throw new Error('No OKX OI data for ' + instId);
  const current = parseFloat(oiRes.data[0].oi) * ctVal;
  return { current, history: [] };
}

// ---- CVD helpers ----
function bucketTrades(trades, bucketMs) {
  const map = new Map();
  trades.forEach((t) => {
    const bucket = Math.floor(t.timeMs / bucketMs) * bucketMs;
    map.set(bucket, (map.get(bucket) || 0) + t.signedSize);
  });
  return map;
}
function tfToMs(tf) {
  return { '15m': 900000, '1h': 3600000, '4h': 14400000 }[tf] || 3600000;
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
  const cvdChartRef = useRef(null);
  const oiChartRef = useRef(null);
  const fundingChartRef = useRef(null);
  const lsChartRef = useRef(null);
  const cvdCanvasRef = useRef(null);
  const oiCanvasRef = useRef(null);
  const fundingCanvasRef = useRef(null);
  const lsCanvasRef = useRef(null);
  const nextFundingTimeRef = useRef(null);
  const fundingCountdownTimerRef = useRef(null);

  const [cvdTf, setCvdTf] = useState('1h');
  const [cvd, setCvd] = useState(null);
  const [oi, setOi] = useState(null);
  const [funding, setFunding] = useState(null);
  const [fundingCountdown, setFundingCountdown] = useState('n/a');
  const [ls, setLs] = useState(null);
  const [basis, setBasis] = useState(null);
  const [reads, setReads] = useState({});

  const currentSymbol = () => (symbol === '__custom' ? customSymbol.trim().toUpperCase() : symbol);
  const currentExchange = () => exchange;
  const isFutures = () => market === 'futures';

  async function loadCvdPanel(sym, Chart) {
    const bucketMs = tfToMs(cvdTf);
    try {
      const bucketMap = new Map(), priceMap = new Map();
      try {
        const binData = await fetchJson(`https://fapi.binance.com/fapi/v1/klines?symbol=${sym}&interval=${cvdTf}&limit=100`);
        if (Array.isArray(binData) && binData.length) {
          binData.forEach((c) => {
            const bucket = Math.floor(c[0] / bucketMs) * bucketMs;
            const volume = parseFloat(c[5]), takerBuyBase = parseFloat(c[9]);
            const d = 2 * takerBuyBase - volume;
            bucketMap.set(bucket, (bucketMap.get(bucket) || 0) + d);
            priceMap.set(bucket, parseFloat(c[4]));
          });
        }
      } catch (e) { /* Binance may not list this pair */ }
      try {
        const category = isFutures() ? 'linear' : 'spot';
        const data = await fetchJson(`https://api.bybit.com/v5/market/recent-trade?category=${category}&symbol=${sym}&limit=1000`);
        if (data.retCode === 0) {
          const trades = (data.result.list || []).map((t) => ({ timeMs: +t.time, signedSize: (t.side === 'Buy' ? 1 : -1) * parseFloat(t.size) }));
          bucketTrades(trades, bucketMs).forEach((v, k) => bucketMap.set(k, (bucketMap.get(k) || 0) + v));
        }
      } catch (e) { /* continue */ }
      try {
        const instId = okxInstId(sym);
        const res = await fetchJson(`https://www.okx.com/api/v5/market/trades?instId=${instId}&limit=500`);
        if (res.data && res.data.length) {
          const trades = res.data.map((t) => ({ timeMs: +t.ts, signedSize: (t.side === 'buy' ? 1 : -1) * parseFloat(t.sz) }));
          bucketTrades(trades, bucketMs).forEach((v, k) => bucketMap.set(k, (bucketMap.get(k) || 0) + v));
        }
      } catch (e) { /* continue */ }

      if (!bucketMap.size) throw new Error('CVD unavailable on all exchanges for ' + sym);

      const sortedBuckets = [...bucketMap.entries()].sort((a, b) => a[0] - b[0]).slice(-100);
      const deltas = sortedBuckets.map(([, d]) => d);
      let running = 0;
      const cumulative = deltas.map((d) => { running += d; return running; });
      const lastDelta = deltas.length ? deltas.slice(-5).reduce((a, b) => a + b, 0) : 0;
      const bias = cumulative[cumulative.length - 1] > 0 ? 'Bullish' : cumulative[cumulative.length - 1] < 0 ? 'Bearish' : 'Flat';

      let divergence = null;
      const pairs = sortedBuckets.map(([k], i) => ({ p: priceMap.get(k), c: cumulative[i] })).filter((x) => x.p !== undefined);
      if (pairs.length >= 20) {
        const w = pairs.slice(-40), half = Math.floor(w.length / 2);
        const a = w.slice(0, half), b = w.slice(half);
        const maxP = (arr) => Math.max(...arr.map((x) => x.p)), minP = (arr) => Math.min(...arr.map((x) => x.p));
        const maxC = (arr) => Math.max(...arr.map((x) => x.c)), minC = (arr) => Math.min(...arr.map((x) => x.c));
        if (maxP(b) > maxP(a) && maxC(b) < maxC(a)) divergence = 'bearish';
        else if (minP(b) < minP(a) && minC(b) > minC(a)) divergence = 'bullish';
      }

      const result = { cumulative: cumulative[cumulative.length - 1], lastDelta, bias, divergence };
      setCvd(result);

      if (cvdChartRef.current) cvdChartRef.current.destroy();
      cvdChartRef.current = new Chart(cvdCanvasRef.current, {
        type: 'bar',
        data: {
          labels: deltas.map((_, i) => i),
          datasets: [
            { type: 'bar', data: deltas, backgroundColor: deltas.map((d) => (d >= 0 ? 'rgba(47,216,166,.45)' : 'rgba(255,98,89,.45)')), barPercentage: 1, categoryPercentage: 1, order: 2 },
            { type: 'line', data: cumulative, borderColor: '#E8A63C', borderWidth: 2, pointRadius: 0, tension: .15, yAxisID: 'y2', order: 1 },
          ],
        },
        options: {
          responsive: true, animation: { duration: 250 }, plugins: { legend: { display: false } },
          scales: {
            x: { display: false },
            y: { ticks: { color: '#7C8998', font: { family: 'JetBrains Mono', size: 9 }, callback: fmtCompact }, grid: { color: '#1A2029' } },
            y2: { position: 'right', ticks: { color: '#E8A63C', font: { family: 'JetBrains Mono', size: 9 }, callback: fmtCompact }, grid: { display: false } },
          },
        },
      });
      return result;
    } catch (e) {
      setCvd({ error: e.message || 'Failed' });
      return null;
    }
  }

  async function loadOiPanel(sym, ticker, Chart) {
    try {
      const [binanceRes, bybitRes, okxRes] = await Promise.allSettled([fetchBinanceOi(sym), fetchBybitOi(sym), fetchOkxOi(sym)]);
      const sources = [];
      if (binanceRes.status === 'fulfilled') sources.push({ name: 'Binance', ...binanceRes.value });
      if (bybitRes.status === 'fulfilled') sources.push({ name: 'Bybit', ...bybitRes.value });
      if (okxRes.status === 'fulfilled') sources.push({ name: 'OKX', ...okxRes.value });
      if (!sources.length) throw new Error('OI unavailable on all exchanges for ' + sym);

      const current = sources.reduce((a, s) => a + s.current, 0);
      const notional = current * ticker.lastPrice;
      const breakdown = sources.map((s) => `${s.name}: ${fmtCompact(s.current)}`).join(' \u00b7 ')
        + (sources.length < 3 ? ` (${3 - sources.length} exchange${3 - sources.length > 1 ? 's' : ''} unavailable for this pair)` : '');

      const bucketMap = new Map();
      sources.forEach((s) => s.history.forEach((h) => {
        const bucket = Math.round(h.time / 3600000) * 3600000;
        bucketMap.set(bucket, (bucketMap.get(bucket) || 0) + h.oi);
      }));
      const history = [...bucketMap.entries()].sort((a, b) => a[0] - b[0]).map(([time, v]) => ({ time, oi: v }));
      let changePct = null;
      if (history.length >= 2) changePct = (history[history.length - 1].oi - history[0].oi) / history[0].oi * 100;

      const result = { current, notional, breakdown, changePct };
      setOi(result);

      const oiSeries = history.map((h) => h.oi);
      if (oiSeries.length) {
        const minOi = Math.min(...oiSeries), maxOi = Math.max(...oiSeries);
        const pad = (maxOi - minOi) * 0.15 || maxOi * 0.01;
        if (oiChartRef.current) oiChartRef.current.destroy();
        oiChartRef.current = new Chart(oiCanvasRef.current, {
          type: 'line',
          data: { labels: history.map((_, i) => i), datasets: [{ data: oiSeries, borderColor: '#6C93F5', backgroundColor: 'rgba(108,147,245,.12)', borderWidth: 2, pointRadius: 0, tension: .15, fill: true }] },
          options: {
            responsive: true, animation: { duration: 250 }, plugins: { legend: { display: false } },
            scales: { x: { display: false }, y: { min: minOi - pad, max: maxOi + pad, ticks: { color: '#7C8998', font: { family: 'JetBrains Mono', size: 9 }, callback: fmtCompact }, grid: { color: '#1A2029' } } },
          },
        });
      }
      return result;
    } catch (e) {
      setOi({ error: e.message || 'Failed' });
      return null;
    }
  }

  async function loadFundingPanel(sym, Chart) {
    try {
      let currentRate, history;
      if (currentExchange() === 'bybit') {
        const [tickerRes, histRes] = await Promise.all([
          fetchJson(`https://api.bybit.com/v5/market/tickers?category=linear&symbol=${sym}`),
          fetchJson(`https://api.bybit.com/v5/market/funding/history?category=linear&symbol=${sym}&limit=21`),
        ]);
        if (tickerRes.retCode !== 0) throw new Error(sym + ': ' + (tickerRes.retMsg || 'Bybit error'));
        const t = tickerRes.result.list[0];
        currentRate = parseFloat(t.fundingRate);
        nextFundingTimeRef.current = +t.nextFundingTime;
        history = histRes.result.list.slice().reverse().map((r) => ({ time: +r.fundingRateTimestamp, rate: parseFloat(r.fundingRate) }));
      } else {
        const [premRes, histRes] = await Promise.all([
          fetchJson(`https://fapi.binance.com/fapi/v1/premiumIndex?symbol=${sym}`),
          fetchJson(`https://fapi.binance.com/fapi/v1/fundingRate?symbol=${sym}&limit=21`),
        ]);
        currentRate = parseFloat(premRes.lastFundingRate);
        nextFundingTimeRef.current = premRes.nextFundingTime;
        history = histRes.map((r) => ({ time: r.fundingTime, rate: parseFloat(r.fundingRate) }));
      }

      let avgRate = null;
      if (history.length) avgRate = history.reduce((a, h) => a + h.rate, 0) / history.length;
      const result = { currentRate, avgRate };
      setFunding(result);

      clearInterval(fundingCountdownTimerRef.current);
      const tick = () => {
        const diff = nextFundingTimeRef.current - Date.now();
        if (diff <= 0) { setFundingCountdown('due now'); return; }
        const h = Math.floor(diff / 3600000), m = Math.floor((diff % 3600000) / 60000), s = Math.floor((diff % 60000) / 1000);
        setFundingCountdown(`${h}h ${m}m ${s}s`);
      };
      tick();
      fundingCountdownTimerRef.current = setInterval(tick, 1000);

      const rates = history.map((h) => h.rate * 100);
      if (fundingChartRef.current) fundingChartRef.current.destroy();
      fundingChartRef.current = new Chart(fundingCanvasRef.current, {
        type: 'bar',
        data: { labels: history.map((_, i) => i), datasets: [{ data: rates, backgroundColor: rates.map((r) => (r >= 0 ? 'rgba(47,216,166,.55)' : 'rgba(255,98,89,.55)')), barPercentage: .8, categoryPercentage: .9 }] },
        options: {
          responsive: true, animation: { duration: 250 }, plugins: { legend: { display: false } },
          scales: { x: { display: false }, y: { ticks: { color: '#7C8998', font: { family: 'JetBrains Mono', size: 9 }, callback: (v) => v.toFixed(3) + '%' }, grid: { color: '#1A2029' } } },
        },
      });
      return result;
    } catch (e) {
      setFunding({ error: e.message || 'Failed' });
      return null;
    }
  }

  async function loadLsPanel(sym, Chart) {
    try {
      let longPct, shortPct, history;
      if (currentExchange() === 'bybit') {
        const res = await fetchJson(`https://api.bybit.com/v5/market/account-ratio?category=linear&symbol=${sym}&period=1h&limit=48`);
        if (res.retCode !== 0) throw new Error(res.retMsg || 'Bybit error');
        const list = res.result.list.slice().reverse();
        if (!list.length) throw new Error('No long/short data for ' + sym);
        const latest = list[list.length - 1];
        longPct = parseFloat(latest.buyRatio) * 100; shortPct = parseFloat(latest.sellRatio) * 100;
        history = list.map((r) => ({ longPct: parseFloat(r.buyRatio) * 100 }));
      } else {
        const res = await fetchJson(`https://fapi.binance.com/futures/data/globalLongShortAccountRatio?symbol=${sym}&period=1h&limit=48`);
        if (!Array.isArray(res) || !res.length) throw new Error('No long/short data for ' + sym);
        const latest = res[res.length - 1];
        longPct = parseFloat(latest.longAccount) * 100; shortPct = parseFloat(latest.shortAccount) * 100;
        history = res.map((r) => ({ longPct: parseFloat(r.longAccount) * 100 }));
      }
      const result = { longPct, shortPct };
      setLs(result);

      const series = history.map((h) => h.longPct);
      if (lsChartRef.current) lsChartRef.current.destroy();
      lsChartRef.current = new Chart(lsCanvasRef.current, {
        type: 'line',
        data: { labels: history.map((_, i) => i), datasets: [{ data: series, borderColor: '#2FD8A6', backgroundColor: 'rgba(47,216,166,.10)', borderWidth: 2, pointRadius: 0, tension: .15, fill: true }] },
        options: {
          responsive: true, animation: { duration: 250 }, plugins: { legend: { display: false } },
          scales: { x: { display: false }, y: { min: 0, max: 100, ticks: { color: '#7C8998', font: { family: 'JetBrains Mono', size: 9 }, callback: (v) => v + '%' }, grid: { color: '#1A2029' } } },
        },
      });
      return result;
    } catch (e) {
      setLs({ error: e.message || 'Failed' });
      return null;
    }
  }

  async function loadBasisPanel(sym) {
    try {
      let spotPrice, futuresPrice;
      if (currentExchange() === 'bybit') {
        const [spotRes, futRes] = await Promise.all([
          fetchJson(`https://api.bybit.com/v5/market/tickers?category=spot&symbol=${sym}`),
          fetchJson(`https://api.bybit.com/v5/market/tickers?category=linear&symbol=${sym}`),
        ]);
        if (spotRes.retCode !== 0 || !spotRes.result.list.length) throw new Error('No spot data');
        if (futRes.retCode !== 0 || !futRes.result.list.length) throw new Error('No futures data');
        spotPrice = parseFloat(spotRes.result.list[0].lastPrice); futuresPrice = parseFloat(futRes.result.list[0].lastPrice);
      } else {
        const [spotRes, futRes] = await Promise.all([
          fetchJson(`https://api.binance.com/api/v3/ticker/price?symbol=${sym}`),
          fetchJson(`https://fapi.binance.com/fapi/v1/ticker/price?symbol=${sym}`),
        ]);
        spotPrice = parseFloat(spotRes.price); futuresPrice = parseFloat(futRes.price);
      }
      const basisPct = (futuresPrice - spotPrice) / spotPrice * 100;
      const result = { spotPrice, futuresPrice, basisPct };
      setBasis(result);
      return result;
    } catch (e) {
      setBasis({ error: e.message || 'Failed' });
      return null;
    }
  }

  // Cross-references CVD / order book / OI / funding / LS-ratio / basis the
  // way a professional order-flow trader would -- flags where they agree
  // (confirmation) or disagree (divergence / squeeze risk), instead of just
  // reporting each number on its own. Exact same wording/logic as the real
  // site's generateReads().
  function buildReads(ticker, cvdR, bidPct, oiR, fundingR, lsR, basisR) {
    const priceChg = ticker.change1dPct;
    const out = {};

    if (cvdR && !cvdR.error) {
      let t, c = '';
      if (cvdR.bias === 'Bullish' && priceChg > 0) { t = `<b>Uptrend looks real.</b> More buying than selling (CVD is bullish) and price is up ${priceChg.toFixed(2)}% -- actual buying is pushing this move, not just price drifting up on its own.`; c = 'bull'; }
      else if (cvdR.bias === 'Bullish') { t = `<b>Buying is happening, but price isn't moving up yet.</b> There's more buying than selling, but price is ${priceChg === 0 ? 'flat' : 'down ' + Math.abs(priceChg).toFixed(2) + '%'}. This could mean price is about to go up, or sellers are quietly absorbing all that buying. Worth watching closely rather than assuming either way.`; c = 'warn'; }
      else if (cvdR.bias === 'Bearish' && priceChg < 0) { t = `<b>Downtrend looks real.</b> More selling than buying (CVD is bearish) and price is down ${Math.abs(priceChg).toFixed(2)}% -- actual selling is pushing this move, not just a random price dip.`; c = 'bear'; }
      else if (cvdR.bias === 'Bearish') { t = `<b>Selling is happening even though price is going up.</b> There's more selling than buying, but price is ${priceChg === 0 ? 'flat' : 'up ' + priceChg.toFixed(2) + '%'}. This can mean someone is quietly selling into the rise. If you're long, be a bit careful here.`; c = 'warn'; }
      else t = `Buying and selling are about even right now -- no clear direction from the actual trades.`;
      if (cvdR.divergence === 'bearish') { t += ` <b>Warning -- bearish divergence:</b> price pushed to a higher high recently, but CVD did not -- the rise isn't backed by real net buying, and moves like this often run out of fuel.`; c = 'bear'; }
      else if (cvdR.divergence === 'bullish') { t += ` <b>Note -- bullish divergence:</b> price dipped to a lower low recently, but CVD held higher -- the drop isn't backed by real net selling, and dips like this often get bought back up.`; c = 'bull'; }
      out.cvd = { text: t, cls: c };
    } else out.cvd = { text: 'CVD unavailable right now.', cls: '' };

    let obText, obClass = '';
    if (bidPct !== null && bidPct !== undefined && !isNaN(bidPct)) {
      const skew = bidPct - 50;
      if (Math.abs(skew) < 8) obText = `The order book is fairly even (${bidPct.toFixed(1)}% buy orders) -- no strong lean either way right now.`;
      else if (skew > 0) { obText = `<b>More buy orders waiting</b> (${bidPct.toFixed(1)}% of the book). This gives some light support just below price -- but these orders can be pulled or cancelled any second, so don't rely on this too much.`; obClass = 'bull'; }
      else { obText = `<b>More sell orders waiting</b> (${(100 - bidPct).toFixed(1)}% of the book). This gives some light resistance just above price -- same warning applies, these orders can disappear fast.`; obClass = 'bear'; }
      const lastCvdBias = cvdR && !cvdR.error ? cvdR.bias : null;
      if (lastCvdBias && ((skew > 8 && lastCvdBias === 'Bearish') || (skew < -8 && lastCvdBias === 'Bullish'))) {
        obText += ` Heads up: this disagrees with the ${lastCvdBias.toLowerCase()} reading from CVD -- the waiting orders and the actual trades are pointing different ways. When this happens, the actual trades (CVD) usually win out.`;
        obClass = 'warn';
      }
    } else obText = 'Order book unavailable right now.';
    out.book = { text: obText, cls: obClass };

    if (oiR && !oiR.error && oiR.changePct !== null && oiR.changePct !== undefined) {
      const oiUp = oiR.changePct > 1, oiDown = oiR.changePct < -1, priceUp = priceChg > 0.3, priceDown = priceChg < -0.3;
      let t, c = '';
      if (oiUp && priceUp) { t = `<b>New buyers are jumping in.</b> Open Interest is up ${oiR.changePct.toFixed(2)}% while price rose ${priceChg.toFixed(2)}% -- this means new money is opening fresh long positions, not just old shorts closing out. This move has real backing behind it.`; c = 'bull'; }
      else if (oiUp && priceDown) { t = `<b>New sellers are jumping in.</b> Open Interest is up ${oiR.changePct.toFixed(2)}% while price fell ${Math.abs(priceChg).toFixed(2)}% -- new short positions are opening, meaning this drop has real backing, not just people taking profit.`; c = 'bear'; }
      else if (oiDown && priceUp) { t = `<b>Shorts are buying back to close out.</b> Open Interest fell ${Math.abs(oiR.changePct).toFixed(2)}% while price rose ${priceChg.toFixed(2)}% -- part of this rally is short-sellers covering their positions, not fresh buyers coming in. This kind of move can run out of steam once the covering is done.`; c = 'warn'; }
      else if (oiDown && priceDown) { t = `<b>Longs are closing out or getting stopped out.</b> Open Interest fell ${Math.abs(oiR.changePct).toFixed(2)}% as price dropped ${Math.abs(priceChg).toFixed(2)}% -- existing long positions are closing, not new short-sellers piling in. This often looks more like the drop running out of steam than a fresh downtrend starting.`; c = 'warn'; }
      else t = `Open Interest barely changed (${oiR.changePct >= 0 ? '+' : ''}${oiR.changePct.toFixed(2)}%) -- no big build-up of new positions right now, in either direction.`;
      out.oi = { text: t, cls: c };
    } else out.oi = { text: 'Open Interest change unavailable right now.', cls: '' };

    if (fundingR && !fundingR.error && fundingR.currentRate !== null && fundingR.currentRate !== undefined && !isNaN(fundingR.currentRate)) {
      const ratePct = fundingR.currentRate * 100, extreme = Math.abs(ratePct) > 0.05;
      let t, c = '';
      if (ratePct > 0.005) {
        t = `<b>Funding is positive (+${ratePct.toFixed(4)}%).</b> Long traders are paying short traders right now -- meaning more people are betting on price going up.`; c = 'bull';
        if (extreme) t += ` This is quite high, meaning a LOT of people are long right now. When too many people are on one side, a sudden move against them (a "squeeze") becomes more likely if momentum slows down.`;
        if (cvdR && !cvdR.error && cvdR.bias === 'Bearish') { t += ` <b>Something doesn't match up:</b> lots of traders are long (paying funding), but the actual trades (CVD) are leaning toward selling. When leveraged traders and real trades disagree like this, it's a common setup for a "long squeeze" if price breaks lower.`; c = 'warn'; }
      } else if (ratePct < -0.005) {
        t = `<b>Funding is negative (${ratePct.toFixed(4)}%).</b> Short traders are paying long traders right now -- meaning more people are betting on price going down.`; c = 'bear';
        if (extreme) t += ` This is quite low, meaning a LOT of people are short right now. When too many people are on one side, a sudden move against them (a "squeeze") becomes more likely if price catches a bid.`;
        if (cvdR && !cvdR.error && cvdR.bias === 'Bullish') { t += ` <b>Something doesn't match up:</b> lots of traders are short (paying funding), but the actual trades (CVD) are leaning toward buying. Watch for a "short squeeze" (price jumping up and forcing shorts to buy back) if this continues.`; c = 'warn'; }
      } else t = `Funding is close to zero (${ratePct >= 0 ? '+' : ''}${ratePct.toFixed(4)}%) -- no strong bias toward longs or shorts using leverage right now.`;
      out.funding = { text: t, cls: c };
    } else out.funding = { text: 'Funding rate unavailable right now.', cls: '' };

    if (lsR && !lsR.error) {
      const skew = lsR.longPct - lsR.shortPct;
      let t, c = '';
      if (Math.abs(skew) < 10) t = `Traders are fairly split (${lsR.longPct.toFixed(1)}% long / ${lsR.shortPct.toFixed(1)}% short) -- no strong lean toward either side.`;
      else if (skew > 0) {
        t = `<b>Most traders are long</b> (${lsR.longPct.toFixed(1)}% long vs ${lsR.shortPct.toFixed(1)}% short).`; c = 'bull';
        if (skew > 30) { t += ` This is a very one-sided crowd -- when almost everyone bets the same way, it's often worth being a little cautious, especially if this matches the funding reading above.`; c = 'warn'; }
      } else {
        t = `<b>Most traders are short</b> (${lsR.shortPct.toFixed(1)}% short vs ${lsR.longPct.toFixed(1)}% long).`; c = 'bear';
        if (-skew > 30) { t += ` This is a very one-sided crowd -- when almost everyone bets the same way, it's often worth being a little cautious, especially if this matches the funding reading above.`; c = 'warn'; }
      }
      out.ls = { text: t, cls: c };
    } else out.ls = { text: 'Long/short ratio unavailable right now.', cls: '' };

    if (basisR && !basisR.error && basisR.basisPct !== undefined && !isNaN(basisR.basisPct)) {
      const b = basisR.basisPct;
      let t, c = '';
      if (Math.abs(b) < 0.02) t = `Futures price and spot price are almost the same (${b >= 0 ? '+' : ''}${b.toFixed(3)}%) -- no real gap between the two markets right now.`;
      else if (b > 0) {
        t = `<b>Futures are more expensive than spot</b> (+${b.toFixed(3)}%). Traders using leverage are paying extra to be long here, which matches more people betting on price going up.`; c = 'bull';
        if (fundingR && !fundingR.error && fundingR.currentRate > 0.0005 && b > 0.05) t += ` This matches the positive funding reading too -- both signs are pointing the same way: more people betting long.`;
      } else {
        t = `<b>Futures are cheaper than spot</b> (${b.toFixed(3)}%). Traders using leverage are accepting a discount to be short (or hedged) here, which matches more people betting on price going down.`; c = 'bear';
        if (fundingR && !fundingR.error && fundingR.currentRate < -0.0005 && b < -0.05) t += ` This matches the negative funding reading too -- both signs are pointing the same way: more people betting short.`;
      }
      out.basis = { text: t, cls: c };
    } else out.basis = { text: 'Basis unavailable right now.', cls: '' };

    return out;
  }

  // Matches the real site exactly: only the ladder auto-refreshes every 5s
  // (startLadderAutoRefresh -> loadOrderBook). CVD/OI/Funding/LS/Basis are
  // comparatively slow-moving and hit more rate-limit-sensitive endpoints
  // (CoinGecko, exchange history), so they only reload on the Load button
  // or the initial mount, exactly like loadAll() on the real site.
  const loadLadderOnly = useCallback(async () => {
    const sym = activeSymbolRef.current;
    if (!sym) return;
    try {
      const t = await fetchTicker(sym, exchange, market === 'futures');
      setTicker(t);
      const { books, used } = await fetchDepthAll(sym);
      const computed = computeLadder(books, binDetail, wallSeenRef.current);
      wallSeenRef.current = computed.newSeen;
      setLadder(computed);
      setUsedVenues(used);
      setImbHist((prev) => {
        const next = [...prev, computed.bidPct];
        return next.length > 120 ? next.slice(-120) : next;
      });
      setLastUpdated(new Date());
      setReads((prev) => ({ ...prev, book: buildReads(t, cvd, computed.bidPct, oi, funding, ls, basis).book }));
    } catch (e) {
      setError(e.message || 'Failed to load.');
    }
  }, [exchange, market, binDetail, cvd, oi, funding, ls, basis]);

  const load = useCallback(async () => {
    const sym = activeSymbolRef.current;
    if (!sym) return;
    setLoading(true);
    setError(null);
    try {
      const Chart = await loadChartJs();
      const t = await fetchTicker(sym, exchange, market === 'futures');
      setTicker(t);

      const { books, used } = await fetchDepthAll(sym);
      const computed = computeLadder(books, binDetail, wallSeenRef.current);
      wallSeenRef.current = computed.newSeen;
      setLadder(computed);
      setUsedVenues(used);
      setImbHist((prev) => {
        const next = [...prev, computed.bidPct];
        return next.length > 120 ? next.slice(-120) : next;
      });
      setLastUpdated(new Date());

      const [cvdR, oiR, fundingR, lsR, basisR] = await Promise.all([
        loadCvdPanel(sym, Chart),
        loadOiPanel(sym, t, Chart),
        loadFundingPanel(sym, Chart),
        loadLsPanel(sym, Chart),
        loadBasisPanel(sym),
      ]);
      setReads(buildReads(t, cvdR, computed.bidPct, oiR, fundingR, lsR, basisR));
    } catch (e) {
      setError(e.message || 'Failed to load.');
    } finally {
      setLoading(false);
    }
  }, [exchange, market, binDetail, cvdTf]);

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
    timerRef.current = setInterval(loadLadderOnly, 5000);
    return () => clearInterval(timerRef.current);
  }, [loadLadderOnly]);

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => clearInterval(fundingCountdownTimerRef.current);
  }, []);

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

      <div className="of-grid">
        <div className="of-section-label"><span>Order Flow Core</span></div>

        <div className="of-panel">
          <div className="of-panel-title">Cumulative Volume Delta &mdash; Combined (Binance + Bybit + OKX)</div>
          <div className="of-cvd-controls">
            <select value={cvdTf} onChange={(e) => setCvdTf(e.target.value)}>
              <option value="15m">15m candles</option>
              <option value="1h">1H candles</option>
              <option value="4h">4H candles</option>
            </select>
          </div>
          <div className="of-cvd-stats">
            <div className="of-stat"><b>{cvd && !cvd.error ? fmtCompact(cvd.cumulative) : '\u2014'}</b><span>Cumulative delta (window)</span></div>
            <div className="of-stat"><b>{cvd && !cvd.error ? (cvd.lastDelta >= 0 ? '+' : '') + fmtCompact(cvd.lastDelta) : '\u2014'}</b><span>Last candle delta</span></div>
            <div className="of-stat"><b style={{ color: cvd && !cvd.error ? (cvd.bias === 'Bullish' ? 'var(--bull)' : cvd.bias === 'Bearish' ? 'var(--bear)' : 'var(--muted)') : undefined }}>{cvd ? (cvd.error || cvd.bias) : '\u2014'}</b><span>Read</span></div>
          </div>
          <canvas ref={cvdCanvasRef} height="180"></canvas>
          {reads.cvd && <div className={`of-read ${reads.cvd.cls}`} dangerouslySetInnerHTML={{ __html: reads.cvd.text }} />}
        </div>

        <div className="of-panel">
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
              {reads.book && <div className={`of-read ${reads.book.cls}`} dangerouslySetInnerHTML={{ __html: reads.book.text }} />}
            </>
          )}
        </div>

        <div className="of-section-label"><span>Derivatives Positioning</span></div>

        <div className="of-panel">
          <div className="of-panel-title">Open Interest &mdash; Combined (Binance + Bybit + OKX)</div>
          <div className="of-cvd-stats">
            <div className="of-stat"><b>{oi && !oi.error ? fmtCompact(oi.current) : '\u2014'}</b><span>Current OI</span></div>
            <div className="of-stat"><b>{oi && !oi.error ? '$' + fmtCompact(oi.notional) : '\u2014'}</b><span>Notional (USD)</span></div>
            <div className="of-stat"><b style={{ color: oi && !oi.error && oi.changePct !== null ? (oi.changePct >= 0 ? 'var(--bull)' : 'var(--bear)') : undefined }}>{oi && !oi.error && oi.changePct !== null ? (oi.changePct >= 0 ? '+' : '') + oi.changePct.toFixed(2) + '%' : oi ? (oi.error || '\u2014') : '\u2014'}</b><span>24H change</span></div>
          </div>
          {oi && !oi.error && <div className="of-oi-breakdown">{oi.breakdown}</div>}
          <canvas ref={oiCanvasRef} height="150"></canvas>
          {reads.oi && <div className={`of-read ${reads.oi.cls}`} dangerouslySetInnerHTML={{ __html: reads.oi.text }} />}
        </div>

        <div className="of-panel">
          <div className="of-panel-title">Funding Rate</div>
          <div className="of-cvd-stats">
            <div className="of-stat"><b style={{ color: funding && !funding.error ? (funding.currentRate >= 0 ? 'var(--bull)' : 'var(--bear)') : undefined }}>{funding ? (funding.error || (funding.currentRate >= 0 ? '+' : '') + (funding.currentRate * 100).toFixed(4) + '%') : '\u2014'}</b><span>Current rate</span></div>
            <div className="of-stat"><b>{fundingCountdown}</b><span>Next funding</span></div>
            <div className="of-stat"><b style={{ color: funding && !funding.error && funding.avgRate !== null ? (funding.avgRate >= 0 ? 'var(--bull)' : 'var(--bear)') : undefined }}>{funding && !funding.error && funding.avgRate !== null ? (funding.avgRate >= 0 ? '+' : '') + (funding.avgRate * 100).toFixed(4) + '%' : '\u2014'}</b><span>7D average</span></div>
          </div>
          <canvas ref={fundingCanvasRef} height="150"></canvas>
          {reads.funding && <div className={`of-read ${reads.funding.cls}`} dangerouslySetInnerHTML={{ __html: reads.funding.text }} />}
        </div>

        <div className="of-panel">
          <div className="of-panel-title">Long/Short Ratio</div>
          <div className="of-cvd-stats">
            <div className="of-stat"><b>{ls && !ls.error ? ls.longPct.toFixed(1) + '%' : '\u2014'}</b><span>Long accounts</span></div>
            <div className="of-stat"><b>{ls && !ls.error ? ls.shortPct.toFixed(1) + '%' : '\u2014'}</b><span>Short accounts</span></div>
            <div className="of-stat"><b style={{ color: ls && !ls.error ? (ls.longPct >= ls.shortPct ? 'var(--bull)' : 'var(--bear)') : undefined }}>{ls && !ls.error ? (ls.shortPct > 0 ? (ls.longPct / ls.shortPct).toFixed(2) : 'n/a') : '\u2014'}</b><span>L/S ratio</span></div>
          </div>
          <canvas ref={lsCanvasRef} height="150"></canvas>
          {reads.ls && <div className={`of-read ${reads.ls.cls}`} dangerouslySetInnerHTML={{ __html: reads.ls.text }} />}
        </div>

        <div className="of-panel">
          <div className="of-panel-title">Futures Premium / Basis</div>
          <div className="of-cvd-stats">
            <div className="of-stat"><b>{basis && !basis.error ? fmtPrice(basis.spotPrice) : '\u2014'}</b><span>Spot price</span></div>
            <div className="of-stat"><b>{basis && !basis.error ? fmtPrice(basis.futuresPrice) : '\u2014'}</b><span>Futures price</span></div>
            <div className="of-stat"><b style={{ color: basis && !basis.error ? (basis.basisPct >= 0 ? 'var(--bull)' : 'var(--bear)') : undefined }}>{basis ? (basis.error || (basis.basisPct >= 0 ? '+' : '') + basis.basisPct.toFixed(3) + '%') : '\u2014'}</b><span>Basis</span></div>
          </div>
          {reads.basis && <div className={`of-read ${reads.basis.cls}`} dangerouslySetInnerHTML={{ __html: reads.basis.text }} />}
        </div>
      </div>

      <div className="of-caption">
        Combines up to 13 public order books into one aggregated depth ladder (wall = 3x+ the median of ~6 neighbouring
        bins, floored at 2x the whole ladder's median; wall age tracked across refreshes). CVD combines Binance's exact
        taker-buy split with trade-based approximations from Bybit and OKX, with basic bullish/bearish divergence
        detection against price. Open Interest, Funding, Long/Short Ratio and Basis are combined across exchanges the
        same way. Each panel's "read" cross-references it against the others (e.g. funding vs CVD, OI vs price) the way
        a professional order-flow trader would. The ladder auto-refreshes every 5s; everything else reloads on Load or
        whenever you change Exchange/Market/Symbol/Timeframe. NOT yet included: live Trade Tape, live Liquidations feed,
        the Multi-Coin Comparison scanner, the confluence overlay on the ladder (needs Fibonacci/VWAP/Profile logic from
        other unported tools), and the Depth Chart view toggle -- these are the next phase.
      </div>
    </div>
  );
}
