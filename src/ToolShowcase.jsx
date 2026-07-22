import { useState } from 'react';

const TOOLS = [
  { key: 'sector', icon: 'Se', color: 'tape', name: 'Sector Screener', tag: 'rotation \u00b7 relative strength', live: '/sector-screener.html',
    headline: 'Know which basket the money is rotating into \u2014 before everyone else does.',
    desc: 'Ranks crypto sectors by relative strength so you\u2019re never late to a rotation.' },
  { key: 'trend', icon: 'Tr', color: 'bull', name: 'Trend Screener', tag: 'dual-confirmation',
    headline: 'One trend signal can lie. Two, agreeing, rarely do.',
    desc: 'Price vs EMA200 combined with OBV vs its own EMA \u2014 a dual-confirmation trend scan.' },
  { key: 'futures', icon: 'Fu', color: 'violet', name: 'Futures Screener', tag: 'multi-timeframe',
    headline: 'Every perpetual pair, every timeframe, one screen.',
    desc: 'Every USDT-M perpetual pair with 1H/4H/12H/24H change side by side in one table.' },
  { key: 'rsiscreener2', icon: 'RS', color: 'bull', name: 'RSI Screener', tag: 'momentum \u00b7 extremes', live: '#rsiscreener',
    headline: 'Find the whole market\u2019s extremes in the time it takes to read four rows.',
    desc: 'Scans the entire market for overbought and oversold conditions, filtered by market cap.' },
  { key: 'volprofile', icon: 'Vo', color: 'violet', name: 'Volume Profile', tag: 'HVN/LVN \u00b7 value area',
    headline: 'Support and resistance, drawn by actual volume \u2014 not a guess.',
    desc: 'Maps where volume actually traded, surfacing nodes that behave like real support/resistance.' },
  { key: 'vwap', icon: 'VW', color: 'tape', name: 'Anchor VWAP', tag: 'anchored \u00b7 multi-timeframe',
    headline: 'The price big players actually benchmark against.',
    desc: 'Daily, weekly, monthly and quarterly anchored VWAPs in one view with a previous-levels table.' },
  { key: 'czones', icon: 'CZ', color: 'bear', name: 'Confluence Zones', tag: '33 sources \u00b7 ranked',
    headline: '33 independent signals. One ranked list of zones that matter.',
    desc: 'Ranks price zones by how many of 33 independent sources mark the same level.' },
  { key: 'cdash', icon: 'CD', color: 'violet', name: 'Confluence Dashboard', tag: 'aggregated \u00b7 scored', live: '/confluence-dashboard.html',
    headline: 'The single number that turns four screens into one decision.',
    desc: 'Trend, OBV, RSI and VWAP into one score per symbol across 5 timeframes.' },
  { key: 'fib', icon: 'Fi', color: 'bull', name: 'Fibonacci Levels', tag: 'retracement \u00b7 extension',
    headline: 'Know the exact zone before price gets there.',
    desc: 'Auto-plots retracement and extension levels off the dominant swing, before price gets there.' },
  { key: 'rsichecker', icon: 'RC', color: 'bull', name: 'RSI Checker', tag: 'single symbol',
    headline: 'One symbol, every timeframe, one glance.',
    desc: 'A fast, single-symbol RSI read across every timeframe at once.' },
  { key: 'cipherb', icon: 'CB', color: 'violet', name: 'Cipher B Checker', tag: 'money flow \u00b7 wave trend',
    headline: 'A second opinion your momentum indicator can\u2019t give you alone.',
    desc: 'Money-flow and wave-trend signal checker \u2014 a second, independent momentum lens.' },
  { key: 'orderflow2', icon: 'OF', color: 'bear', name: 'Order Flow', tag: 'depth \u00b7 walls \u00b7 CVD', live: '#orderflow',
    headline: 'See where size is actually resting \u2014 not where a line guesses it is.',
    desc: 'Aggregated depth ladder across 14 exchanges with wall detection and CVD divergence.' },
  { key: 'lakhsmi', icon: 'LS', color: 'tape', name: 'Lakhsmi Signals', tag: 'core engine',
    headline: 'The exact engine that powers the automated bots \u2014 in your hands.',
    desc: 'The core AFT signal engine \u2014 the same logic that powers the automated trading bots.' },
  { key: 'paper', icon: 'PT', color: 'bull', name: 'Paper Trading', tag: 'simulated \u00b7 real data',
    headline: 'Prove the strategy before a single dollar is at risk.',
    desc: 'Simulated order tracking against real live market data \u2014 risk nothing until you\u2019re ready.' },
  { key: 'alerts', icon: 'Al', color: 'bear', name: 'Alerts', tag: 'price \u00b7 confluence',
    headline: 'Stop staring at charts. Let the setup come to you.',
    desc: 'Price and confluence alerts so you\u2019re not staring at charts all day.' },
  { key: 'possize', icon: '$', color: 'tape', name: 'Position Size Calculator', tag: 'risk-based sizing', live: '/position-size-calculator.html',
    headline: 'Three fields in. The exact size that keeps your risk fixed, out.',
    desc: 'Portfolio, risk %, stop-loss % in \u2014 exact position size out. Three fields, no guessing.' },
];

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
    </div>
  );
}
