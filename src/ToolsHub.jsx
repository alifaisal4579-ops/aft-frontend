import { Link } from 'react-router-dom';

// All 15 tools from the real AFT Tools website. Ported one at a time,
// verified against the source each time -- "live" tools link to their real
// page; the rest show as coming soon rather than a broken/fake link.
const TOOLS = [
  { name: 'Trend Screener', path: null, desc: 'Price vs EMA + OBV vs EMA dual-confirmation trend scan.' },
  { name: 'Sector Screener', path: null, desc: 'Ranks crypto sectors by relative strength.' },
  { name: 'Futures Screener', path: null, desc: 'Every USDT-M perpetual pair, 1H/4H/12H/24H change in one table.' },
  { name: 'RSI Screener', path: '/rsi-screener', desc: 'Every USDT-M pair (\u2265$70M cap), RSI extremes on any timeframe.' },
  { name: 'Volume Profile', path: null, desc: 'HVN/LVN and value area from real traded volume.' },
  { name: 'VWAPs', path: null, desc: 'Daily/weekly/monthly/quarterly anchored VWAPs.' },
  { name: 'Confluence Zones', path: null, desc: 'Ranked price zones from 33 sources.' },
  { name: 'Confluence Dashboard', path: null, desc: 'One combined score per symbol across every tool.' },
  { name: 'Fibonacci Levels', path: null, desc: 'Auto-plotted retracement and extension levels.' },
  { name: 'RSI Checker', path: null, desc: 'Single-symbol RSI check across timeframes.' },
  { name: 'Cipher B Checker', path: null, desc: 'Money-flow / wave-trend signal checker.' },
  { name: 'Order Flow', path: '/order-flow', desc: '13-exchange aggregated depth ladder with wall detection (Phase 1 -- CVD/OI/Funding/Liquidations to follow).' },
  { name: 'Lakhsmi Signals', path: null, desc: 'The core AFT signal-generation engine.' },
  { name: 'Paper Trading', path: null, desc: 'Simulated order tracking against real market data.' },
  { name: 'Position Size Calculator', path: null, desc: 'Risk-based position sizing.' },
];

export default function ToolsHub() {
  return (
    <div>
      <h2>Tools</h2>
      <p className="mode-page-sub">All 15 AFT Tools, being ported here one at a time with the exact same logic as the main site.</p>
      <div className="tools-hub-grid">
        {TOOLS.map((t) => (
          t.path ? (
            <Link key={t.name} to={t.path} className="tools-hub-card live">
              <div className="tools-hub-card-head">
                <span>{t.name}</span>
                <span className="badge running">live</span>
              </div>
              <p>{t.desc}</p>
            </Link>
          ) : (
            <div key={t.name} className="tools-hub-card">
              <div className="tools-hub-card-head">
                <span>{t.name}</span>
                <span className="badge paused">coming soon</span>
              </div>
              <p>{t.desc}</p>
            </div>
          )
        ))}
      </div>
    </div>
  );
}
