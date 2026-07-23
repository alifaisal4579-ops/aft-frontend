import { useState } from 'react';

const TOOLS = [
  { key: 'sector', icon: 'Se', color: 'tape', name: 'Sector Screener', tag: 'rotation \u00b7 relative strength', live: '/sector-screener.html', visual: 'ranked',
    headline: 'Know which basket the money is rotating into \u2014 before everyone else does.',
    desc: 'Ranks crypto sectors by relative strength so you\u2019re never late to a rotation.',
    demo: [ { label: 'AI', value: 92 }, { label: 'L1s', value: 78 }, { label: 'DeFi', value: 61 }, { label: 'Memes', value: 34 } ] },
  { key: 'trend', icon: 'Tr', color: 'bull', name: 'Trend Screener', tag: 'dual-confirmation', visual: 'levels',
    headline: 'One trend signal can lie. Two, agreeing, rarely do.',
    desc: 'Price vs EMA200 combined with OBV vs its own EMA \u2014 a dual-confirmation trend scan.' },
  { key: 'futures', icon: 'Fu', color: 'violet', name: 'Futures Screener', tag: 'multi-timeframe', visual: 'ranked',
    headline: 'Every perpetual pair, every timeframe, one screen.',
    desc: 'Every USDT-M perpetual pair with 1H/4H/12H/24H change side by side in one table.',
    demo: [ { label: 'SOLUSDT', value: 88 }, { label: 'AVAXUSDT', value: 71 }, { label: 'INJUSDT', value: 54 }, { label: 'DOGEUSDT', value: 22 } ] },
  { key: 'rsiscreener2', icon: 'RS', color: 'bull', name: 'RSI Screener', tag: 'momentum \u00b7 extremes', live: '#rsiscreener', visual: 'score',
    headline: 'Find the whole market\u2019s extremes in the time it takes to read four rows.',
    desc: 'Scans the entire market for overbought and oversold conditions, filtered by market cap.',
    demo: [ { sym: 'XRPUSDT', pct: 18, label: 'Oversold' }, { sym: 'DOTUSDT', pct: 24, label: 'Oversold' }, { sym: 'PEPEUSDT', pct: 81, label: 'Overbought' } ] },
  { key: 'volprofile', icon: 'Vo', color: 'violet', name: 'Volume Profile', tag: 'HVN/LVN \u00b7 value area', visual: 'levels',
    headline: 'Support and resistance, drawn by actual volume \u2014 not a guess.',
    desc: 'Maps where volume actually traded, surfacing nodes that behave like real support/resistance.' },
  { key: 'vwap', icon: 'VW', color: 'tape', name: 'Anchor VWAP', tag: 'anchored \u00b7 multi-timeframe', visual: 'levels',
    headline: 'The price big players actually benchmark against.',
    desc: 'Daily, weekly, monthly and quarterly anchored VWAPs in one view with a previous-levels table.' },
  { key: 'czones', icon: 'CZ', color: 'bear', name: 'Confluence Zones', tag: '33 sources \u00b7 ranked', visual: 'score',
    headline: '33 independent signals. One ranked list of zones that matter.',
    desc: 'Ranks price zones by how many of 33 independent sources mark the same level.',
    demo: [ { sym: '$64,200', pct: 100, label: '5/5' }, { sym: '$61,800', pct: 60, label: '3/5' }, { sym: '$67,400', pct: 40, label: '2/5' } ] },
  { key: 'cdash', icon: 'CD', color: 'violet', name: 'Confluence Dashboard', tag: 'aggregated \u00b7 scored', live: '/confluence-dashboard.html', visual: 'score',
    headline: 'The single number that turns four screens into one decision.',
    desc: 'Trend, OBV, RSI and VWAP into one score per symbol across 5 timeframes.',
    demo: [ { sym: 'BTCUSDT', pct: 80, label: '4/5' }, { sym: 'SOLUSDT', pct: 60, label: '3/5' }, { sym: 'ETHUSDT', pct: 40, label: '2/5' } ] },
  { key: 'fib', icon: 'Fi', color: 'bull', name: 'Fibonacci Levels', tag: 'retracement \u00b7 extension', visual: 'levels',
    headline: 'Know the exact zone before price gets there.',
    desc: 'Auto-plots retracement and extension levels off the dominant swing, before price gets there.' },
  { key: 'rsichecker', icon: 'RC', color: 'bull', name: 'RSI Checker', tag: 'single symbol', visual: 'score',
    headline: 'One symbol, every timeframe, one glance.',
    desc: 'A fast, single-symbol RSI read across every timeframe at once.',
    demo: [ { sym: '15m', pct: 71, label: '71' }, { sym: '1H', pct: 58, label: '58' }, { sym: '4H', pct: 33, label: '33' } ] },
  { key: 'cipherb', icon: 'CB', color: 'violet', name: 'Cipher B Checker', tag: 'money flow \u00b7 wave trend', visual: 'levels',
    headline: 'A second opinion your momentum indicator can\u2019t give you alone.',
    desc: 'Money-flow and wave-trend signal checker \u2014 a second, independent momentum lens.' },
  { key: 'orderflow2', icon: 'OF', color: 'bear', name: 'Order Flow', tag: 'depth \u00b7 walls \u00b7 CVD', live: '#orderflow', visual: 'ladder',
    headline: 'See where size is actually resting \u2014 not where a line guesses it is.',
    desc: 'Aggregated depth ladder across 14 exchanges with wall detection and CVD divergence.' },
  { key: 'lakhsmi', icon: 'LS', color: 'tape', name: 'Lakhsmi Signals', tag: 'core engine', visual: 'ranked',
    headline: 'The exact engine that powers the automated bots \u2014 in your hands.',
    desc: 'The core AFT signal engine \u2014 the same logic that powers the automated trading bots.',
    demo: [ { label: 'BTCUSDT Buy', value: 85 }, { label: 'ETHUSDT Buy', value: 70 }, { label: 'SOLUSDT Sell', value: 45 } ] },
  { key: 'paper', icon: 'PT', color: 'bull', name: 'Paper Trading', tag: 'simulated \u00b7 real data', visual: 'badge',
    headline: 'Prove the strategy before a single dollar is at risk.',
    desc: 'Simulated order tracking against real live market data \u2014 risk nothing until you\u2019re ready.' },
  { key: 'alerts', icon: 'Al', color: 'bear', name: 'Alerts', tag: 'price \u00b7 confluence', visual: 'bell',
    headline: 'Stop staring at charts. Let the setup come to you.',
    desc: 'Price and confluence alerts so you\u2019re not staring at charts all day.' },
  { key: 'possize', icon: '$', color: 'tape', name: 'Position Size Calculator', tag: 'risk-based sizing', live: '/position-size-calculator.html', visual: 'calc',
    headline: 'Three fields in. The exact size that keeps your risk fixed, out.',
    desc: 'Portfolio, risk %, stop-loss % in \u2014 exact position size out. Three fields, no guessing.' },
];

function RankedDemo({ rows }) {
  const bars = rows || [{ label: 'A', value: 80 }, { label: 'B', value: 55 }, { label: 'C', value: 30 }];
  return (
    <div className="demo-ranked">
      {bars.map((r, i) => (
        <div className="demo-ranked-row" key={r.label}>
          <span className="demo-ranked-rank">#{i + 1}</span>
          <span className="demo-ranked-label">{r.label}</span>
          <div className="demo-ranked-track"><div className="demo-ranked-fill" style={{ width: `${r.value}%` }} /></div>
          <span className="demo-ranked-val">{r.value}</span>
        </div>
      ))}
    </div>
  );
}

function LevelsDemo() {
  const candles = [40, 55, 35, 62, 48, 70, 58, 80, 66, 90];
  return (
    <div className="demo-levels">
      <div className="demo-levels-line demo-line-1" />
      <div className="demo-levels-line demo-line-2" />
      <div className="demo-levels-candles">
        {candles.map((h, i) => (
          <div className="demo-candle" key={i} style={{ height: `${h}%` }}>
            <div className={`demo-candle-body ${i % 3 === 0 ? 'down' : 'up'}`} />
          </div>
        ))}
      </div>
    </div>
  );
}

function ScoreDemo({ rows }) {
  const items = rows || [{ sym: 'BTCUSDT', pct: 80, label: '4/5' }, { sym: 'ETHUSDT', pct: 50, label: '2/5' }];
  return (
    <div className="demo-score">
      {items.map((r) => (
        <div className="demo-score-row" key={r.sym}>
          <span className="demo-score-sym">{r.sym}</span>
          <div className="demo-score-track"><div className="demo-score-fill" style={{ width: `${r.pct}%` }} /></div>
          <span className="demo-score-label">{r.label}</span>
        </div>
      ))}
    </div>
  );
}

function LadderDemo() {
  const asks = [ ['65,912.4', '0.82'], ['65,901.1', '1.44'], ['65,893.7', '2.10'] ];
  const bids = [ ['65,880.2', '3.05'], ['65,871.6', '1.22'], ['65,860.9', '0.65'] ];
  return (
    <div className="demo-ladder">
      {asks.map(([p, s]) => (
        <div className="demo-ladder-row ask" key={p}><span>{p}</span><span>{s}</span></div>
      ))}
      <div className="demo-ladder-mid">65,884.90</div>
      {bids.map(([p, s]) => (
        <div className="demo-ladder-row bid" key={p}><span>{p}</span><span>{s}</span></div>
      ))}
    </div>
  );
}

function BadgeDemo() {
  return (
    <div className="demo-badge">
      <div className="demo-badge-pill">SIMULATED</div>
      <div className="demo-badge-pnl">+$142.30</div>
      <div className="demo-badge-sub">0 real dollars at risk</div>
    </div>
  );
}

function BellDemo() {
  return (
    <div className="demo-bell">
      <div className="demo-bell-icon-wrap">
        <div className="demo-bell-ring r1" />
        <div className="demo-bell-ring r2" />
        <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor"><path d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22zm7-6v-5a7 7 0 0 0-5.5-6.84V3a1.5 1.5 0 0 0-3 0v1.16A7 7 0 0 0 5 11v5l-2 2v1h18v-1l-2-2z"/></svg>
      </div>
      <div className="demo-bell-toast">BTCUSDT hit $65,900 &middot; Confluence 4/5</div>
    </div>
  );
}

function CalcDemo() {
  return (
    <div className="demo-calc">
      <div className="demo-calc-row"><span>Portfolio</span><b>$5,000</b></div>
      <div className="demo-calc-row"><span>Risk</span><b>1.5%</b></div>
      <div className="demo-calc-row"><span>SL distance</span><b>2.1%</b></div>
      <div className="demo-calc-arrow">&darr;</div>
      <div className="demo-calc-result"><span>Position size</span><b>$3,571</b></div>
    </div>
  );
}

function ToolDemo({ tool }) {
  switch (tool.visual) {
    case 'ranked': return <RankedDemo rows={tool.demo} />;
    case 'score': return <ScoreDemo rows={tool.demo} />;
    case 'ladder': return <LadderDemo />;
    case 'badge': return <BadgeDemo />;
    case 'bell': return <BellDemo />;
    case 'calc': return <CalcDemo />;
    case 'levels':
    default: return <LevelsDemo />;
  }
}

export default function ToolShowcase() {
  const [active, setActive] = useState(0);
  const tool = TOOLS[active];

  return (
    <div className="showcase">
      <div className="showcase-tabs">
        {TOOLS.map((t, i) => (
          <button
            key={t.key}
            className={`showcase-tab ${i === active ? 'active' : ''}`}
            onClick={() => setActive(i)}
          >
            <span className={`showcase-tab-icon c-${t.color}`}>{t.icon}</span>
            {t.name}
          </button>
        ))}
      </div>

      <div className="showcase-panel glass">
        <div className="showcase-panel-main">
          <div className="showcase-panel-icon">
            <span className={`tool-icon c-${tool.color}`}>{tool.icon}</span>
          </div>
          <div className="showcase-panel-body">
            <div className="showcase-panel-tag">{tool.tag}</div>
            <h3>{tool.headline}</h3>
            <p>{tool.desc}</p>
            {tool.live ? (
              <a className="btn-secondary glass" href={tool.live}>Try {tool.name} free &rarr;</a>
            ) : (
              <a className="btn-secondary glass" href="/login">Unlock with login &rarr;</a>
            )}
          </div>
        </div>
        <div className="showcase-panel-demo">
          <div className="demo-live-tag"><i></i>Live preview</div>
          <ToolDemo tool={tool} />
        </div>
      </div>
    </div>
  );
}
