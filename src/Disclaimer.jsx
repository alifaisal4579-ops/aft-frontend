import LegalPageLayout from './LegalPageLayout';

export default function Disclaimer() {
  return (
    <LegalPageLayout
      eyebrow="Legal"
      title="Disclaimer"
      updated="July 23, 2026"
      description="Ali Faisal Trades' tools and automated bots are for educational and informational purposes only, not financial advice. Read the full risk disclaimer before trading."
    >
      <h2>1. Educational and Informational Purposes Only</h2>
      <p>
        Ali Faisal Trades ("AFT Tools," "we," "us," or "our") provides a suite of market-structure
        and order-flow analytics tools, screeners, a confluence-scoring engine, and automated
        signal-following bots (collectively, the "Services"). The Services are provided strictly
        for educational and informational purposes. Nothing displayed, calculated, generated, or
        communicated by the Services &mdash; including but not limited to confluence scores, trend
        signals, RSI readings, volume profile levels, Fibonacci levels, VWAP calculations, order
        flow data, or automated trade signals &mdash; constitutes financial, investment, trading,
        legal, or tax advice, and none of it should be construed as a recommendation to buy, sell,
        or hold any financial instrument or cryptocurrency asset.
      </p>

      <h2>2. No Financial Advisory Relationship</h2>
      <p>
        We are not a registered investment advisor, broker-dealer, financial planner, or financial
        analyst in any jurisdiction, and no part of the Services creates an advisory or fiduciary
        relationship between you and Ali Faisal Trades. You should not treat any output of the
        Services as personalized financial advice tailored to your individual circumstances. Before
        making any trading or investment decision, you are strongly encouraged to consult a
        licensed, independent financial advisor who is familiar with your personal financial
        situation.
      </p>

      <h2>3. Nature of Cryptocurrency and Leveraged Trading Risk</h2>
      <p>
        Trading cryptocurrencies, and in particular trading cryptocurrency derivatives such as
        leveraged perpetual futures, carries a substantial risk of loss and is not suitable for
        every investor. The value of cryptocurrencies is highly volatile and can fluctuate
        significantly within short periods of time, driven by factors including market sentiment,
        liquidity conditions, regulatory developments, and exchange-specific events, many of which
        are unpredictable and outside our control.
      </p>
      <p>
        Leveraged trading in particular amplifies both potential gains and potential losses. It is
        possible to lose more than your initial margin on a leveraged position, and in the case of
        automated liquidation, positions may be closed by the exchange at prices materially worse
        than anticipated. You should only trade with capital you can afford to lose in full, and
        you should fully understand the mechanics of leverage, margin, and liquidation on your
        exchange of choice before using any bot or tool that places real orders.
      </p>

      <div className="legal-callout">
        <b>Key point:</b> Any trade placed through our Services &mdash; whether initiated manually
        based on a tool's output, or placed automatically by one of our real-money trading bots
        &mdash; is executed directly on your own exchange account, using your own funds and your
        own exchange API credentials. You retain full control of, and full responsibility for,
        your exchange account and the funds within it at all times.
      </div>

      <h2>4. No Guarantee of Accuracy, Performance, or Results</h2>
      <p>
        While we make reasonable efforts to source market data from exchanges and third-party
        providers accurately and to calculate our indicators, screeners, and confluence scores
        correctly, we do not guarantee the accuracy, completeness, timeliness, or reliability of any
        data, calculation, signal, or output produced by the Services. Market data is sourced from
        third-party exchanges and data providers; outages, delays, rate limits, or errors on those
        third-party systems can affect the accuracy or availability of information within the
        Services, and we are not responsible for the accuracy of data we do not generate ourselves.
      </p>
      <p>
        Past performance of any strategy, signal, confluence score, or bot &mdash; whether shown in
        paper-trading results, backtests, or live trading history &mdash; is not indicative of
        future results. No representation is made that any account or trading approach used with
        the Services will, or is likely to, achieve profits or losses similar to those shown in any
        example, illustration, or historical record.
      </p>

      <h2>5. Automated Trading Bots ("Real Bots")</h2>
      <p>
        Our real-money trading bots place live orders on your connected exchange account, on a
        schedule and according to logic that you configure (including but not limited to symbols,
        sessions, risk amount per trade, leverage, and margin mode). By enabling a real bot, you
        acknowledge and accept that:
      </p>
      <ul>
        <li>Orders will be placed automatically, without a human reviewing each individual trade before it is sent to the exchange;</li>
        <li>Automated systems can behave unexpectedly due to software bugs, exchange API changes, network interruptions, or unforeseen market conditions;</li>
        <li>You are solely responsible for configuring risk parameters (risk per trade, leverage, margin mode) at a level appropriate for your own risk tolerance and account size;</li>
        <li>You remain responsible for monitoring your exchange account and open positions, and for taking manual action (including cancelling orders or closing positions directly on the exchange) if you believe it is necessary; and</li>
        <li>We do not custody, hold, or have withdrawal access to your funds at any time &mdash; your exchange API credentials are used solely to place, monitor, and manage orders as configured.</li>
      </ul>

      <h2>6. Limitation of Liability</h2>
      <p>
        To the fullest extent permitted by applicable law, Ali Faisal Trades, its owner(s),
        operators, employees, and affiliates shall not be liable for any direct, indirect,
        incidental, special, consequential, or exemplary damages, including but not limited to
        loss of profits, loss of capital, loss of data, or any other financial loss, arising out of
        or in connection with your use of, or inability to use, the Services &mdash; including any
        loss arising from a trade, position, or order placed manually by you or automatically by a
        bot based on information, signals, or functionality provided by the Services.
      </p>
      <p>
        <strong>We are not liable for any trading losses you incur.</strong> You alone bear full
        responsibility for every trading decision made using the Services, whether that decision is
        made manually after reviewing a tool's output, or delegated to an automated bot you have
        configured. This applies regardless of whether a loss results from market movement, a
        data or calculation error, a software defect, an exchange-side issue (including but not
        limited to slippage, liquidation, API downtime, or order rejection), or any other cause.
      </p>

      <h2>7. Third-Party Exchanges and Services</h2>
      <p>
        The Services interact with third-party cryptocurrency exchanges (including BloFin, Binance,
        Bybit, and OKX, among others referenced within specific tools) to retrieve market data and,
        where applicable, to place orders on your behalf using credentials you provide. We do not
        control, and are not responsible for, the availability, security, policies, fees, or conduct
        of any third-party exchange. Your relationship with any exchange you connect to or trade on
        is governed solely by that exchange's own terms of service.
      </p>

      <h2>8. No Warranty</h2>
      <p>
        The Services are provided on an "as is" and "as available" basis, without warranties of any
        kind, whether express or implied, including but not limited to implied warranties of
        merchantability, fitness for a particular purpose, or non-infringement. We do not warrant
        that the Services will be uninterrupted, error-free, or free of harmful components.
      </p>

      <h2>9. Changes to This Disclaimer</h2>
      <p>
        We may update this Disclaimer from time to time to reflect changes in the Services or for
        other operational, legal, or regulatory reasons. Continued use of the Services after an
        update constitutes acceptance of the revised Disclaimer.
      </p>

      <h2>10. Questions</h2>
      <p>
        If you have questions about this Disclaimer, please reach out via our <a href="/contact">Contact page</a>{' '}
        or through our <a href="https://t.me/alifaisaltrades" target="_blank" rel="noopener">Telegram community</a>.
      </p>
    </LegalPageLayout>
  );
}
