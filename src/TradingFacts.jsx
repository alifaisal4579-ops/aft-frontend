import { useEffect, useState } from 'react';

// Rotating educational facts -- general market-structure/trading-concept
// trivia, not price predictions or signals. Purely informational.
const FACTS = [
  'Funding rates on perpetual futures exist to keep the perp price tethered to spot -- when funding is very positive, longs are paying shorts.',
  'Open Interest rising with price usually means new money is entering the trend. OI falling while price rises can mean short-covering, not fresh buying.',
  'A "wall" on the order book (a large resting limit order) doesn\u2019t always hold -- it can be pulled the moment price gets close to it.',
  'RSI above 70 or below 30 doesn\u2019t mean "reverse now" -- in a strong trend, RSI can stay overbought or oversold for a long time.',
  'CVD (Cumulative Volume Delta) tracks aggressive market-order flow, not the order book -- it shows who\u2019s hitting bids/asks, not who\u2019s resting.',
  'VWAP resets each session (day/week/month) -- it\u2019s the average price weighted by volume, often used as a fair-value reference by larger players.',
  'Liquidation cascades happen because forced closes are market orders -- one large liquidation can trigger the next by moving price into the next cluster.',
  'The Fibonacci "Golden Pocket" (0.618\u20130.65 retracement) is popular precisely because so many traders watch it -- which can become self-fulfilling.',
  'Basis (the gap between futures and spot price) tends to compress toward zero as a futures contract nears expiry.',
  'A rising Long/Short ratio doesn\u2019t guarantee price will keep rising -- it can also mean the crowd is heavily positioned one way, which is a squeeze risk.',
];

const ROTATE_MS = 7000;

export default function TradingFacts() {
  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % FACTS.length);
        setFade(true);
      }, 250);
    }, ROTATE_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="facts-card">
      <div className="facts-eyebrow">Did you know?</div>
      <p className={`facts-text ${fade ? 'in' : ''}`}>{FACTS[index]}</p>
      <div className="facts-dots">
        {FACTS.map((_, i) => (
          <span key={i} className={`facts-dot ${i === index ? 'active' : ''}`} />
        ))}
      </div>
    </div>
  );
}
