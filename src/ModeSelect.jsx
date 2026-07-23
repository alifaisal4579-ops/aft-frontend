import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import * as api from './client';
import GainersLosers from './GainersLosers';
import FundingExtremes from './FundingExtremes';
import TradingFacts from './TradingFacts';

// Session labels are fixed clock hours in Pakistan Time (PKT, UTC+5, no DST).
const SESSION_HOURS_PKT = { '12AM': 0, '5AM': 5, '12PM': 12, '7PM': 19 };

function getPktNow() {
  // en-US locale with the Asia/Karachi timezone gives us the current
  // wall-clock time in PKT regardless of what timezone the browser is in.
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Karachi', hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(new Date());
  const get = (t) => parts.find((p) => p.type === t).value;
  return new Date(`${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}:${get('second')}`);
}

function nextSessionCountdown(sessionLabels) {
  if (!sessionLabels || !sessionLabels.length) return null;
  const now = getPktNow();
  let best = null;
  for (const label of sessionLabels) {
    const hour = SESSION_HOURS_PKT[label];
    if (hour === undefined) continue;
    const candidate = new Date(now);
    candidate.setHours(hour, 0, 0, 0);
    if (candidate <= now) candidate.setDate(candidate.getDate() + 1);
    if (!best || candidate < best.time) best = { label, time: candidate };
  }
  if (!best) return null;
  const msLeft = best.time - now;
  const h = Math.floor(msLeft / 3600000);
  const m = Math.floor((msLeft % 3600000) / 60000);
  return { label: best.label, hours: h, minutes: m };
}

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

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 5) return 'Good night';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Good night';
}

export default function ModeSelect() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { prices, error } = useTop5Prices();
  const displayName = (user && user.full_name) || '';
  const greeting = getGreeting();

  const [bots, setBots] = useState(null);
  const [hasExchangeKey, setHasExchangeKey] = useState(null);
  const [countdown, setCountdown] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [botsRes, keysRes] = await Promise.all([api.listBots(), api.listExchangeKeys()]);
      if (cancelled) return;
      if (botsRes.ok) setBots(botsRes.body.bots || []);
      if (keysRes.ok) setHasExchangeKey((keysRes.body.keys || []).length > 0);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!bots) return;
    const runningSessions = [...new Set(
      bots.filter((b) => b.status === 'running').flatMap((b) => b.sessions || [])
    )];
    function tick() { setCountdown(nextSessionCountdown(runningSessions)); }
    tick();
    const interval = setInterval(tick, 30000);
    return () => clearInterval(interval);
  }, [bots]);

  const showGettingStarted = bots !== null && bots.length === 0;

  return (
    <div className="ms-page">
      <div className="ms-mesh"><i></i></div>
      <div className="ms-grid"></div>

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

      <h2 className="mode-select-greeting">{displayName ? `${greeting}, ${displayName}` : greeting}</h2>
      <p className="mode-select-sub">16 tools, one login. Pick a tool below, or manage your bots.</p>

      {countdown && (
        <div className="session-countdown">
          <i></i>Next session ({countdown.label}) in {countdown.hours}h {countdown.minutes}m
        </div>
      )}

      {showGettingStarted && (
        <section className="ms-section">
          <div className="getting-started glass">
            <div className="getting-started-head">
              <span className="getting-started-eyebrow">Getting started</span>
              <h3>Three steps to your first automated trade</h3>
            </div>
            <div className="getting-started-steps">
              <div className={`gs-step ${hasExchangeKey ? 'done' : ''}`}>
                <span className="gs-step-num">{hasExchangeKey ? '\u2713' : '1'}</span>
                <div>
                  <b>Connect your exchange</b>
                  <p>Add a BloFin API key with Trade permission only (no withdrawal access needed).</p>
                </div>
              </div>
              <div className="gs-step">
                <span className="gs-step-num">2</span>
                <div>
                  <b>Create your first bot</b>
                  <p>Start with Simulated mode -- paper trading against real market data, zero risk.</p>
                </div>
              </div>
              <div className="gs-step">
                <span className="gs-step-num">3</span>
                <div>
                  <b>Explore the tools</b>
                  <p>Screeners, order flow, and the Confluence Dashboard are ready below, right now.</p>
                </div>
              </div>
            </div>
            <button className="gs-cta" onClick={() => navigate('/dashboard/simulated')}>Create your first bot &rarr;</button>
          </div>
        </section>
      )}

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
            <div className="mode-card-icon mode-card-icon-sim">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 3h6M10 3v5.5L4.5 18a1.5 1.5 0 0 0 1.3 2.2h12.4a1.5 1.5 0 0 0 1.3-2.2L14 8.5V3" />
                <path d="M7 15h10" />
              </svg>
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
            <div className="mode-card-icon mode-card-icon-real">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z" />
              </svg>
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

      <div className="ms-sticky-telegram">
        <a href="https://t.me/alifaisaltrades" target="_blank" rel="noopener">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71l-4.14-3.05-2 1.92c-.23.23-.42.42-.82.42z" /></svg>
          <span>Join Telegram</span>
        </a>
      </div>
    </div>
  );
}
