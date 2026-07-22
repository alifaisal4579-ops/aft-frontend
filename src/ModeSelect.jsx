import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import GainersLosers from './GainersLosers';
import FundingExtremes from './FundingExtremes';
import TradingFacts from './TradingFacts';

const TOP5 = [
  { symbol: 'BTCUSDT', label: 'BTC' },
  { symbol: 'ETHUSDT', label: 'ETH' },
  { symbol: 'SOLUSDT', label: 'SOL' },
  { symbol: 'BNBUSDT', label: 'BNB' },
  { symbol: 'XRPUSDT', label: 'XRP' },
];

const ICON_COLORS = {
  tape: { bg: 'rgba(232,166,60,.14)', fg: 'var(--tape)' },
  bull: { bg: 'rgba(47,216,166,.14)', fg: 'var(--bull)' },
  bear: { bg: 'rgba(255,98,89,.14)', fg: 'var(--bear)' },
  violet: { bg: 'rgba(156,140,255,.14)', fg: 'var(--violet, #9C8CFF)' },
};

const TOOLS = [
  { name: 'Trend Screener', path: '/trend-screener.html', icon: 'Tr', color: 'bull', desc: 'Price vs EMA + OBV vs EMA dual-confirmation trend scan.' },
  { name: 'Sector Screener', path: '/sector-screener.html', icon: 'Se', color: 'tape', desc: 'Ranks crypto sectors by relative strength.' },
  { name: 'Futures Screener', path: '/futures-screener.html', icon: 'Fu', color: 'violet', desc: 'Every USDT-M perpetual pair, 1H/4H/12H/24H change in one table.' },
  { name: 'RSI Screener', path: '/rsi-screener.html', icon: 'RS', color: 'bull', desc: 'Every USDT-M pair (\u2265$70M cap), RSI extremes on any timeframe.' },
  { name: 'Volume Profile', path: '/volume-profile.html', icon: 'Vo', color: 'violet', desc: 'HVN/LVN and value area from real traded volume.' },
  { name: 'VWAPs', path: '/anchor-vwap.html', icon: 'VW', color: 'tape', desc: 'Daily/weekly/monthly/quarterly anchored VWAPs.' },
  { name: 'Confluence Zones', path: '/confluence-zones.html', icon: 'CZ', color: 'bear', desc: 'Ranked price zones from 33 sources.' },
  { name: 'Confluence Dashboard', path: '/confluence-dashboard.html', icon: 'CD', color: 'violet', desc: 'One combined score per symbol across every tool.' },
  { name: 'Fibonacci Levels', path: '/fibonacci-levels.html', icon: 'Fi', color: 'bull', desc: 'Auto-plotted retracement and extension levels.' },
  { name: 'RSI Checker', path: '/rsi-checker.html', icon: 'RC', color: 'bull', desc: 'Single-symbol RSI check across timeframes.' },
  { name: 'Cipher B Checker', path: '/cipher-b-checker.html', icon: 'CB', color: 'violet', desc: 'Money-flow / wave-trend signal checker.' },
  { name: 'Order Flow', path: '/order-flow.html', icon: 'OF', color: 'bear', desc: 'Aggregated depth ladder, CVD, OI, funding, liquidations and trade tape.' },
  { name: 'Lakhsmi Signals', path: '/lakhsmi-signals.html', icon: 'LS', color: 'tape', desc: 'The core AFT signal-generation engine.' },
];

function useTop5Prices() {
  const [prices, setPrices] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const results = await Promise.all(
          TOP5.map((c) =>
            fetch(`https://api.bybit.com/v5/market/tickers?category=linear&symbol=${c.symbol}`)
              .then((r) => r.json())
              .then((d) => {
                const t = d.result && d.result.list && d.result.list[0];
                if (!t) throw new Error('no data');
                return { ...c, price: parseFloat(t.lastPrice), pct: parseFloat(t.price24hPcnt) * 100 };
              })
          )
        );
        if (!cancelled) setPrices(results);
      } catch (e) {
        if (!cancelled) setError('Could not load live prices.');
      }
    }
    load();
    const interval = setInterval(load, 15000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  return { prices, error };
}

function fmtPrice(v) {
  if (v === null || v === undefined || isNaN(v)) return '—';
  return v.toLocaleString(undefined, { maximumFractionDigits: v < 1 ? 6 : 2 });
}

export default function ModeSelect() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { prices, error } = useTop5Prices();
  const displayName = (user && user.full_name) || '';

  return (
    <div className="ms-page">
      <div className="ms-mesh"><i></i></div>

      <div className="ms-ticker glass">
        {error ? (
          <span style={{ color: 'var(--bear)', fontFamily: 'var(--mono)', fontSize: 12.5 }}>{error}</span>
        ) : !prices ? (
          <span style={{ color: 'var(--muted)', fontFamily: 'var(--mono)', fontSize: 12.5 }}>Loading live prices…</span>
        ) : (
          prices.map((c) => (
            <div className="ms-ticker-item" key={c.symbol}>
              <span className="ms-ticker-sym">{c.label}</span>
              <span className="ms-ticker-price">{fmtPrice(c.price)}</span>
              <span className={`ms-ticker-pct ${c.pct >= 0 ? 'up' : 'down'}`}>
                {c.pct >= 0 ? '+' : ''}{c.pct.toFixed(2)}%
              </span>
            </div>
          ))
        )}
      </div>

      <h2 className="mode-select-greeting">{displayName ? `Welcome, ${displayName}` : 'Welcome'}</h2>
      <p className="mode-select-sub">16 tools, one login. Pick a tool below, or manage your bots.</p>

      <section className="ms-section">
        <div className="ms-section-label"><span>Market Pulse</span></div>
        <div className="pulse-grid">
          <div className="pulse-col glass">
            <GainersLosers />
          </div>
          <div className="pulse-col glass">
            <FundingExtremes />
          </div>
          <div className="pulse-col glass">
            <TradingFacts />
          </div>
        </div>
      </section>

      <section className="ms-section">
        <div className="ms-section-label"><span>Tools</span></div>
        <div className="tool-grid">
          {TOOLS.map((t) => {
            const c = ICON_COLORS[t.color];
            return (
              <a key={t.name} href={t.path} className="tool-card glass live">
                <div className="tool-icon" style={{ background: c.bg, color: c.fg }}>{t.icon}</div>
                <span className="tool-live-badge">Open</span>
                <h3>{t.name}</h3>
                <p>{t.desc}</p>
              </a>
            );
          })}
        </div>
      </section>

      <section className="ms-section">
        <div className="ms-section-label"><span>Trading Bots</span></div>
        <div className="mode-cards">
          <button className="mode-card mode-card-sim glass" onClick={() => navigate('/dashboard/simulated')}>
            <div className="mode-card-icon">
              <span className="status-dot running" />
            </div>
            <h3>Simulated Bot Trading</h3>
            <p>
              Paper trading with real market data -- no real money, no risk.
              Create bots, pick symbols and sessions, and track performance
              using the Lakhsmi Signals engine.
            </p>
            <span className="mode-card-cta">Open &rarr;</span>
          </button>

          <button className="mode-card mode-card-real glass" onClick={() => navigate('/dashboard/real')}>
            <div className="mode-card-icon">
              <span className="mode-card-badge">Real</span>
            </div>
            <h3>Real Bot Trading</h3>
            <p>
              Connect your own exchange account and let the bot place real
              orders with your funds. Requires an API key with Trade
              permission only.
            </p>
            <span className="mode-card-cta">Open &rarr;</span>
          </button>
        </div>
      </section>
    </div>
  );
}
