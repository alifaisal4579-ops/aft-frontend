import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';

// Faithful port of the real AFT Tools website's RSI Screener (page-rsiscreener).
// Same endpoints, same RSI(14) Wilder's-smoothing formula, same $70M market-cap
// filter via CoinGecko, same timeframe-aggregation rules for the two synthetic
// intervals (10m, and Bybit's missing 8h). Nothing here is simplified.

const MIN_MARKET_CAP = 70_000_000;
const ABOVE_OPTIONS = [70, 75, 80, 85, 90, 95];
const BELOW_OPTIONS = [30, 25, 20, 15, 10];

const TF_CONFIG = {
  '1m': { biI: '1m', byI: '1' },
  '3m': { biI: '3m', byI: '3' },
  '5m': { biI: '5m', byI: '5' },
  '10m': { aggregate: 2, baseBiI: '5m', baseByI: '5' },
  '15m': { biI: '15m', byI: '15' },
  '30m': { biI: '30m', byI: '30' },
  '1h': { biI: '1h', byI: '60' },
  '2h': { biI: '2h', byI: '120' },
  '4h': { biI: '4h', byI: '240' },
  '8h': { biI: '8h', byI: null, aggregateBybitOnly: 2, baseByI: '240' },
  '12h': { biI: '12h', byI: '720' },
  '1d': { biI: '1d', byI: 'D' },
};

async function fetchJson(url, retries = 2) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
  } catch (e) {
    if (retries > 0) { await new Promise((r) => setTimeout(r, 350)); return fetchJson(url, retries - 1); }
    throw e;
  }
}

function fmtPrice(v) {
  if (v === null || v === undefined || isNaN(v)) return 'n/a';
  return v.toLocaleString(undefined, { maximumFractionDigits: v < 1 ? 6 : 2 });
}
function fmtPct(v) {
  if (v === null || v === undefined || isNaN(v)) return 'n/a';
  return (v >= 0 ? '+' : '') + v.toFixed(2) + '%';
}
function fmtCompact(v) {
  if (v === null || v === undefined || isNaN(v)) return 'n/a';
  const abs = Math.abs(v);
  if (abs >= 1e9) return (v / 1e9).toFixed(2) + 'B';
  if (abs >= 1e6) return (v / 1e6).toFixed(2) + 'M';
  if (abs >= 1e3) return (v / 1e3).toFixed(2) + 'K';
  return v.toFixed(2);
}

function computeRSI(closes, period = 14) {
  if (closes.length < period + 1) return null;
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const d = closes[i] - closes[i - 1];
    if (d >= 0) gains += d; else losses -= d;
  }
  let avgGain = gains / period, avgLoss = losses / period;
  for (let i = period + 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    const gain = d > 0 ? d : 0, loss = d < 0 ? -d : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
  }
  if (avgLoss === 0) return 100;
  return 100 - 100 / (1 + avgGain / avgLoss);
}

function computeRSISeries(closes, period = 14) {
  if (closes.length < period + 1) return [];
  const series = new Array(closes.length).fill(null);
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const d = closes[i] - closes[i - 1];
    if (d >= 0) gains += d; else losses -= d;
  }
  let avgGain = gains / period, avgLoss = losses / period;
  series[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  for (let i = period + 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    const gain = d > 0 ? d : 0, loss = d < 0 ? -d : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    series[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }
  return series;
}

async function getBinanceSymbols() {
  const info = await fetchJson('https://fapi.binance.com/fapi/v1/exchangeInfo');
  return info.symbols
    .filter((s) => s.status === 'TRADING' && s.contractType === 'PERPETUAL' && s.quoteAsset === 'USDT')
    .map((s) => s.symbol);
}
async function getBinance24hr() {
  const data = await fetchJson('https://fapi.binance.com/fapi/v1/ticker/24hr');
  const map = new Map();
  data.forEach((t) => map.set(t.symbol, { price: parseFloat(t.lastPrice), ch24h: parseFloat(t.priceChangePercent) }));
  return map;
}
async function getBybitSymbolsAnd24hr() {
  const [instRes, tickerRes] = await Promise.all([
    fetchJson('https://api.bybit.com/v5/market/instruments-info?category=linear&limit=1000'),
    fetchJson('https://api.bybit.com/v5/market/tickers?category=linear'),
  ]);
  if (instRes.retCode !== 0) throw new Error(instRes.retMsg || 'Bybit error');
  if (tickerRes.retCode !== 0) throw new Error(tickerRes.retMsg || 'Bybit error');
  const validSymbols = new Set(
    instRes.result.list.filter((i) => i.status === 'Trading' && i.quoteCoin === 'USDT').map((i) => i.symbol)
  );
  const map = new Map();
  tickerRes.result.list.forEach((t) => {
    if (!validSymbols.has(t.symbol)) return;
    map.set(t.symbol, { price: parseFloat(t.lastPrice), ch24h: parseFloat(t.price24hPcnt) * 100 });
  });
  return { symbols: [...validSymbols], map };
}

async function getMarketCapMap() {
  const map = new Map();
  for (let page = 1; page <= 6; page++) {
    try {
      const data = await fetchJson(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=${page}`);
      if (!Array.isArray(data) || !data.length) break;
      data.forEach((c) => {
        const sym = (c.symbol || '').toUpperCase();
        if (!map.has(sym)) map.set(sym, c.market_cap);
      });
      if (data.length < 250) break;
    } catch (e) { break; }
  }
  return map;
}

function aggregateCandles(closes, groupSize) {
  const out = [];
  for (let i = 0; i + groupSize <= closes.length; i += groupSize) out.push(closes[i + groupSize - 1]);
  return out;
}

async function fetchClosesForSymbol(symbol, tfKey, exchange) {
  const cfg = TF_CONFIG[tfKey];
  if (exchange === 'bybit') {
    if (cfg.aggregate) {
      const res = await fetchJson(`https://api.bybit.com/v5/market/kline?category=linear&symbol=${symbol}&interval=${cfg.baseByI}&limit=200`);
      if (res.retCode !== 0 || !res.result.list.length) return null;
      return aggregateCandles(res.result.list.slice().reverse().map((c) => parseFloat(c[4])), cfg.aggregate);
    }
    if (cfg.aggregateBybitOnly) {
      const res = await fetchJson(`https://api.bybit.com/v5/market/kline?category=linear&symbol=${symbol}&interval=${cfg.baseByI}&limit=200`);
      if (res.retCode !== 0 || !res.result.list.length) return null;
      return aggregateCandles(res.result.list.slice().reverse().map((c) => parseFloat(c[4])), cfg.aggregateBybitOnly);
    }
    const res = await fetchJson(`https://api.bybit.com/v5/market/kline?category=linear&symbol=${symbol}&interval=${cfg.byI}&limit=100`);
    if (res.retCode !== 0 || !res.result.list || res.result.list.length < 20) return null;
    return res.result.list.slice().reverse().map((c) => parseFloat(c[4]));
  }
  if (cfg.aggregate) {
    const data = await fetchJson(`https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=${cfg.baseBiI}&limit=200`);
    if (!Array.isArray(data) || !data.length) return null;
    return aggregateCandles(data.map((c) => parseFloat(c[4])), cfg.aggregate);
  }
  const data = await fetchJson(`https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=${cfg.biI}&limit=100`);
  if (!Array.isArray(data) || data.length < 20) return null;
  return data.map((c) => parseFloat(c[4]));
}

async function runBatched(items, worker, concurrency, onProgress) {
  let idx = 0, done = 0;
  const results = new Array(items.length);
  async function runOne() {
    while (idx < items.length) {
      const myIdx = idx++;
      try { results[myIdx] = await worker(items[myIdx], myIdx); }
      catch (e) { results[myIdx] = null; }
      done++;
      if (onProgress) onProgress(done, items.length);
    }
  }
  await Promise.all(new Array(concurrency).fill(0).map(runOne));
  return results;
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

export default function RsiScreenerPage() {
  const [exchange, setExchange] = useState('bybit');
  const [tf, setTf] = useState('15m');
  const [direction, setDirection] = useState('above');
  const [threshold, setThreshold] = useState(75);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ pct: 0, label: '' });
  const [allRows, setAllRows] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [sortKey, setSortKey] = useState('rsi');
  const [sortDir, setSortDir] = useState('desc');
  const [activeSymbol, setActiveSymbol] = useState(null);
  const [chartTitle, setChartTitle] = useState('');
  const [error, setError] = useState(null);

  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  const thresholdOptions = direction === 'above' ? ABOVE_OPTIONS : BELOW_OPTIONS;

  useEffect(() => {
    setThreshold(direction === 'above' ? 75 : 25);
  }, [direction]);

  async function handleScan() {
    setLoading(true);
    setError(null);
    setProgress({ pct: 0, label: 'Fetching symbol list\u2026' });
    setAllRows([]);

    try {
      let symbols, bulkMap;
      if (exchange === 'bybit') {
        const r = await getBybitSymbolsAnd24hr();
        symbols = r.symbols; bulkMap = r.map;
      } else {
        symbols = await getBinanceSymbols();
        bulkMap = await getBinance24hr();
      }
      symbols = symbols.filter((s) => bulkMap.has(s));

      setProgress({ pct: 0, label: 'Checking market caps\u2026' });
      const marketCapMap = await getMarketCapMap();

      const qualifying = symbols.filter((s) => {
        const base = s.endsWith('USDT') ? s.slice(0, -4) : s;
        const cap = marketCapMap.get(base);
        return cap && cap >= MIN_MARKET_CAP;
      });

      setProgress({ pct: 0, label: `Computing RSI(14) for ${qualifying.length} pairs (\u2265$70M cap)\u2026` });

      const rsiResults = await runBatched(qualifying, async (symbol) => {
        const closes = await fetchClosesForSymbol(symbol, tf, exchange);
        return closes ? computeRSI(closes, 14) : null;
      }, 8, (done, total) => {
        setProgress({ pct: Math.round((done / total) * 100), label: `Computing RSI(14)\u2026 ${done}/${total}` });
      });

      const rows = qualifying.map((symbol, i) => {
        const bulk = bulkMap.get(symbol);
        const base = symbol.endsWith('USDT') ? symbol.slice(0, -4) : symbol;
        return { symbol, price: bulk.price, ch24h: bulk.ch24h, marketCap: marketCapMap.get(base), rsi: rsiResults[i] };
      });

      setAllRows(rows);
      setLoaded(true);
    } catch (e) {
      setError(e.message || 'Failed to load.');
    } finally {
      setLoading(false);
    }
  }

  const filteredByCondition = allRows.filter((r) => {
    if (r.rsi === null || r.rsi === undefined) return false;
    return direction === 'above' ? r.rsi >= threshold : r.rsi <= threshold;
  });

  const query = search.trim().toUpperCase();
  const visible = (query ? filteredByCondition.filter((r) => r.symbol.includes(query)) : filteredByCondition.slice())
    .sort((a, b) => {
      let av = a[sortKey], bv = b[sortKey];
      if (sortKey === 'symbol') return sortDir === 'asc' ? a.symbol.localeCompare(b.symbol) : b.symbol.localeCompare(a.symbol);
      av = av === null || av === undefined ? -Infinity : av;
      bv = bv === null || bv === undefined ? -Infinity : bv;
      return sortDir === 'asc' ? av - bv : bv - av;
    });

  function toggleSort(key) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('desc'); }
  }

  async function showChart(symbol) {
    setActiveSymbol(symbol);
    setChartTitle(`${symbol} \u2014 RSI(14) on ${tf}, loading\u2026`);
    try {
      const Chart = await loadChartJs();
      const closes = await fetchClosesForSymbol(symbol, tf, exchange);
      if (!closes || closes.length < 20) throw new Error('Not enough candle data to chart.');
      const rsiSeries = computeRSISeries(closes, 14);
      const labels = closes.map((_, i) => i);
      const lastRsi = [...rsiSeries].reverse().find((v) => v !== null);
      setChartTitle(`${symbol} \u2014 RSI(14) on ${tf} \u00b7 Current: ${lastRsi !== undefined ? lastRsi.toFixed(1) : 'n/a'}`);

      if (chartRef.current) chartRef.current.destroy();
      chartRef.current = new Chart(canvasRef.current, {
        type: 'line',
        data: {
          labels,
          datasets: [
            { data: rsiSeries, borderColor: '#E8A63C', borderWidth: 2, pointRadius: 0, tension: .15, spanGaps: true },
            { data: labels.map(() => 70), borderColor: 'rgba(255,98,89,.4)', borderWidth: 1, borderDash: [4, 4], pointRadius: 0 },
            { data: labels.map(() => 30), borderColor: 'rgba(47,216,166,.4)', borderWidth: 1, borderDash: [4, 4], pointRadius: 0 },
          ],
        },
        options: {
          responsive: true, animation: { duration: 250 },
          plugins: { legend: { display: false } },
          scales: {
            x: { display: false },
            y: { min: 0, max: 100, ticks: { color: '#7C8998', font: { family: 'JetBrains Mono', size: 9 } }, grid: { color: '#1A2029' } },
          },
        },
      });
    } catch (e) {
      setChartTitle(`${symbol} \u2014 ${e.message || 'Failed to load chart.'}`);
      if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; }
    }
  }

  function closeChart() {
    setActiveSymbol(null);
    if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; }
  }

  return (
    <div className="rs-wrap">
      <Link to="/tools" className="back-link">&larr; Back to Tools</Link>
      <div className="rs-header">
        <h1>RSI Screener</h1>
        <p>Every USDT-M perpetual pair (&ge;$70M market cap) &mdash; scan for RSI extremes on any timeframe</p>
      </div>

      <div className="rs-controls">
        <div className="rs-field">
          <label>Exchange</label>
          <select value={exchange} onChange={(e) => setExchange(e.target.value)}>
            <option value="binance">Binance</option>
            <option value="bybit">Bybit</option>
          </select>
        </div>
        <div className="rs-field">
          <label>Timeframe</label>
          <select value={tf} onChange={(e) => setTf(e.target.value)}>
            {Object.keys(TF_CONFIG).map((k) => <option key={k} value={k}>{k.toUpperCase()}</option>)}
          </select>
        </div>
        <div className="rs-field">
          <label>Condition</label>
          <select value={direction} onChange={(e) => setDirection(e.target.value)}>
            <option value="above">RSI Above</option>
            <option value="below">RSI Below</option>
          </select>
        </div>
        <div className="rs-field">
          <label>Threshold</label>
          <select value={threshold} onChange={(e) => setThreshold(Number(e.target.value))}>
            {thresholdOptions.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <div className="rs-field" style={{ flex: 1, minWidth: 160 }}>
          <label>Search</label>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Filter e.g. BTC, ETH\u2026" />
        </div>
        <button onClick={handleScan} disabled={loading}>{loading ? 'Scanning\u2026' : 'Scan All Pairs'}</button>
      </div>

      {loading && (
        <div className="rs-progress">
          <div className="rs-progress-bar"><div className="rs-progress-fill" style={{ width: `${progress.pct}%` }}></div></div>
          <div className="rs-progress-label">{progress.label}</div>
        </div>
      )}

      {loaded && !loading && (
        <div className="rs-summary">
          <span><b>{allRows.length}</b> pairs scanned (&ge;$70M cap)</span>
          <span><b>{filteredByCondition.length}</b> match RSI {direction === 'above' ? '\u2265' : '\u2264'} {threshold}</span>
          <span>Showing <b>{visible.length}</b></span>
        </div>
      )}

      <div className="rs-table-wrap">
        <table className="rs-table">
          <thead>
            <tr>
              {['symbol', 'price', 'rsi', 'ch24h', 'marketCap'].map((key) => (
                <th key={key} className={sortKey === key ? `sorted ${sortDir === 'asc' ? 'asc' : ''}` : ''} onClick={() => toggleSort(key)}>
                  {{ symbol: 'Symbol', price: 'Price', rsi: 'RSI', ch24h: '24H %', marketCap: 'Market Cap' }[key]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {error ? (
              <tr><td colSpan={5} style={{ color: 'var(--bear)', padding: 20, textAlign: 'center' }}>{error}</td></tr>
            ) : !loaded ? (
              <tr><td colSpan={5} style={{ color: 'var(--muted)', padding: 20, textAlign: 'center' }}>Pick a timeframe and RSI condition, then press "Scan All Pairs".</td></tr>
            ) : visible.length === 0 ? (
              <tr><td colSpan={5} style={{ color: 'var(--muted)', padding: 20, textAlign: 'center' }}>No pairs currently match this RSI condition.</td></tr>
            ) : visible.map((r) => (
              <tr key={r.symbol} className={r.symbol === activeSymbol ? 'active-row' : ''} onClick={() => showChart(r.symbol)}>
                <td><span className="sym-cell">{r.symbol}</span></td>
                <td>{fmtPrice(r.price)}</td>
                <td className={r.rsi >= 70 ? 'rsi-ob' : r.rsi <= 30 ? 'rsi-os' : ''}>{r.rsi !== null ? r.rsi.toFixed(1) : 'n/a'}</td>
                <td className={r.ch24h >= 0 ? 'up' : 'down'}>{fmtPct(r.ch24h)}</td>
                <td>${fmtCompact(r.marketCap)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {activeSymbol && (
        <div className="rs-chart-panel">
          <div className="rs-chart-head">
            <span>{chartTitle}</span>
            <button onClick={closeChart}>&#10005; Close</button>
          </div>
          <canvas ref={canvasRef} height="110"></canvas>
        </div>
      )}

      <div className="rs-caption">
        Pulls the complete USDT-M perpetual futures symbol list from the exchange itself, filters to &ge;$70M market cap
        (via CoinGecko's free public API, matched by ticker symbol), then fetches candles for every qualifying pair on
        the selected timeframe and computes RSI(14) live. "10m" and (on Bybit) "8H" aren't native exchange intervals
        &mdash; they're built by aggregating 5m/4H candles. Click any row to see that pair's RSI history charted out
        for verification. Click any column header to sort. Futures only, no API key needed.
      </div>
    </div>
  );
}
