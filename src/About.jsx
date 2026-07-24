import LegalPageLayout from './LegalPageLayout';

export default function About() {
  return (
    <LegalPageLayout
      eyebrow="About us"
      title="About Ali Faisal Trades"
      description="Ali Faisal Trades is a 16-tool crypto trading terminal -- screeners, order flow, volume profile, VWAP, Fibonacci levels and a confluence-scoring engine aggregated across 14 exchanges, unified behind one login."
    >
      <h2>What we are</h2>
      <p>
        Ali Faisal Trades is a 16-tool institutional-style trading analytics suite built for
        cryptocurrency traders who are tired of piecing together a picture of the market from
        eight different browser tabs. Instead of a screener in one tab, an order book in another,
        and a separate chart for volume profile or VWAP, every tool in our suite is unified behind
        one login and designed to talk to the others &mdash; so a trend signal, an RSI reading, a
        volume node, and a live order-flow read can all feed into a single confluence score for a
        symbol, rather than sitting in isolation.
      </p>

      <h2>What the suite includes</h2>
      <p>Our tools fall into a few broad categories:</p>
      <ul>
        <li><strong>Screeners</strong> &mdash; Trend Screener, Sector Screener, Futures Screener, and RSI Screener scan the market for symbols and sectors worth a closer look.</li>
        <li><strong>Structure &amp; levels</strong> &mdash; Volume Profile, Anchor VWAP, Fibonacci Levels, and Confluence Zones map out the price levels where multiple independent signals agree.</li>
        <li><strong>Order flow &amp; momentum</strong> &mdash; Order Flow (aggregated depth, CVD, and liquidations across multiple exchanges), RSI Checker, and Cipher B Checker read the market's immediate pressure.</li>
        <li><strong>Confluence Dashboard</strong> &mdash; combines trend, momentum, and volume signals into one ranked score per symbol, across multiple timeframes.</li>
        <li><strong>Position Size Calculator</strong> &mdash; turns your account size, risk tolerance, and stop-loss distance into an exact position size, removing the guesswork from risk management.</li>
        <li><strong>Lakhsmi Signals &amp; automated bots</strong> &mdash; the same signal-generation engine that powers our automated paper-trading and real-money trading bots, available for traders who prefer to review and act on signals manually.</li>
        <li><strong>Paper Trading &amp; Alerts</strong> &mdash; test a strategy against live market data with zero capital at risk, or set price and confluence alerts so you're not staring at a chart all day.</li>
      </ul>

      <h2>Why "confluence"</h2>
      <p>
        No single indicator is right all the time. Our philosophy is that a setup becomes more
        worth paying attention to when multiple, independent signals agree on the same level or
        direction at the same time &mdash; a "confluence." Rather than asking you to manually
        cross-reference trend direction, RSI, volume nodes, VWAP, and Fibonacci levels by hand
        across separate charts, our tools do that cross-referencing for you and surface a single,
        ranked view of where the evidence is strongest.
      </p>

      <h2>Free tools and real trading</h2>
      <p>
        Three of our tools &mdash; Sector Screener, Confluence Dashboard, and Position Size
        Calculator &mdash; are available to try without creating an account. The full 16-tool
        suite, live signals, alerts, and our paper-trading and real-money bots require a free
        login. Our real-money bots connect directly to your own exchange account using your own
        API credentials; we never take custody of your funds, and every credential is encrypted at
        rest. See our <a href="/disclaimer">Disclaimer</a> for the risks involved in using any tool
        that places real trades, and our <a href="/privacy-policy">Privacy Policy</a> for exactly
        how your data and API credentials are handled.
      </p>

      <h2>Who this is for</h2>
      <p>
        Ali Faisal Trades is built for cryptocurrency traders &mdash; from those who want a
        faster, cleaner screening workflow, to those comfortable configuring an automated bot
        against their own exchange account. It is not intended for, and should not be relied on by,
        anyone unable or unwilling to accept the risks of cryptocurrency trading described in our{' '}
        <a href="/disclaimer">Disclaimer</a>.
      </p>

      <h2>Get in touch</h2>
      <p>
        Questions, feedback, or found something that looks off in one of the tools? Visit our{' '}
        <a href="/contact">Contact page</a> or join the conversation on{' '}
        <a href="https://t.me/alifaisaltrades" target="_blank" rel="noopener">Telegram</a>.
      </p>
    </LegalPageLayout>
  );
}
