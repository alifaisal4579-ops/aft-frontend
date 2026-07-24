import LegalPageLayout from './LegalPageLayout';

export default function PrivacyPolicy() {
  return (
    <LegalPageLayout
      eyebrow="Legal"
      title="Privacy Policy"
      updated="July 23, 2026"
      description="How Ali Faisal Trades collects, encrypts, and protects your account information and exchange API credentials."
    >
      <p>
        This Privacy Policy explains what information Ali Faisal Trades ("AFT Tools," "we," "us,"
        or "our") collects when you use our website and Services, how we use and protect it, and
        the choices available to you.
      </p>

      <h2>1. Information We Collect</h2>
      <p><strong>Account information.</strong> When you create an account, we collect your email address, full name, and a securely hashed version of your password. We never store your password in plain text.</p>
      <p><strong>Exchange API credentials.</strong> If you choose to connect an exchange account (currently BloFin) to use our automated real-money bots, we collect the API key, API secret, and passphrase you generate on that exchange. These credentials are encrypted at rest using AES-256-GCM authenticated encryption before being stored, are decrypted only in-memory on our server at the exact moment a trade needs to be placed or monitored, and are never transmitted back to your browser after the initial save &mdash; only a masked hint (e.g. "&bull;&bull;&bull;&bull; a1b2") is ever shown in your dashboard.</p>
      <p><strong>Bot configuration and trading data.</strong> If you create a paper-trading or real-money bot, we store the configuration you choose (symbols, sessions, risk parameters, leverage, margin mode) and a record of the trades that configuration generates, including entry/exit prices, stop-loss and take-profit levels, and profit/loss figures, so that this history can be shown back to you in your dashboard.</p>
      <p><strong>Session and authentication data.</strong> We use a short-lived access token (kept in memory in your browser) and a longer-lived refresh token (stored in an httpOnly cookie, meaning it cannot be read by JavaScript) to keep you signed in securely. We also set a separate, non-sensitive cookie used only to control which navigation options are shown to you in the interface; it does not carry any authentication authority on its own.</p>
      <p><strong>Usage and technical data.</strong> We may log basic technical information (such as IP address and timestamps) for security purposes, including rate-limiting and detecting abusive or automated login attempts.</p>

      <h2>2. How We Use Your Information</h2>
      <ul>
        <li>To create and maintain your account, and to authenticate you when you log in;</li>
        <li>To operate the tools, screeners, alerts, and paper/real trading bots you configure;</li>
        <li>To place, monitor, and manage orders on your connected exchange account, strictly according to the bot configuration you set;</li>
        <li>To display your trade history, bot performance, and account settings back to you;</li>
        <li>To maintain the security of our platform, including detecting and preventing fraudulent or unauthorized account activity; and</li>
        <li>To communicate with you about your account or material changes to our Services or policies.</li>
      </ul>
      <p>We do not sell your personal information or your exchange API credentials to any third party, under any circumstances.</p>

      <h2>3. How Your Exchange API Credentials Are Protected</h2>
      <p>
        Because a leaked exchange API credential could allow someone to trade on your exchange
        account, we take specific precautions with this data:
      </p>
      <ul>
        <li>Credentials are encrypted using AES-256-GCM, an authenticated encryption standard, with a unique initialization vector for each stored value;</li>
        <li>The encryption key is held only in our server's environment configuration and is never stored in our database;</li>
        <li>Decryption happens only in server-side memory, at the moment a trade needs to be placed or an existing position needs to be monitored &mdash; never in your browser;</li>
        <li>Once saved, your API key, secret, and passphrase are never displayed or returned to the frontend in full again, in any part of the Services; and</li>
        <li>We strongly recommend creating an exchange API key with trading permissions only (no withdrawal permission), which most exchanges, including BloFin, support natively. This means that even in a worst-case credential compromise, your funds cannot be withdrawn from your exchange account using that key.</li>
      </ul>

      <h2>4. Cookies</h2>
      <p>
        We use a small number of cookies required for the Services to function: a refresh-token
        cookie (httpOnly, so it cannot be accessed by JavaScript) used to keep you signed in, and a
        UX-only marker cookie used to decide what the navigation bar should display. We do not use
        third-party advertising or cross-site tracking cookies.
      </p>

      <h2>5. Third-Party Data Sources</h2>
      <p>
        Our tools display market data sourced from third-party cryptocurrency exchanges (including
        BloFin, Binance, Bybit, and OKX) and, in some tools, from CoinGecko for market
        capitalization data. This data is public market information and is not linked to your
        personal account information when displayed. Fetching this data may involve your browser
        making requests directly to these third parties' public endpoints in some tools; those
        requests are subject to the respective third party's own privacy practices.
      </p>

      <h2>6. Data Retention</h2>
      <p>
        We retain your account information and trade history for as long as your account remains
        active, so that your dashboard, trade history, and bot configurations remain available to
        you. If you delete an exchange API key from your account, it is permanently removed from
        our database at that time. If you would like your account and associated data deleted
        entirely, contact us via the <a href="/contact">Contact page</a>.
      </p>

      <h2>7. Your Rights</h2>
      <p>
        Depending on your jurisdiction, you may have rights to access, correct, export, or delete
        the personal information we hold about you. You can remove a saved exchange API key at any
        time directly from your dashboard. For any other request, including full account deletion,
        please reach out via the <a href="/contact">Contact page</a>, and we will respond as
        promptly as we reasonably can.
      </p>

      <h2>8. Security</h2>
      <p>
        We use industry-standard measures to protect your information, including password hashing,
        encrypted storage of exchange credentials, and httpOnly cookies for session tokens. No
        method of storage or transmission over the internet is 100% secure, and we cannot guarantee
        absolute security. You also play a role in keeping your account secure &mdash; use a strong,
        unique password, and consider creating exchange API keys with trading-only permissions
        (no withdrawal access) whenever your exchange supports it.
      </p>

      <h2>9. Children's Privacy</h2>
      <p>
        Our Services are not directed at, and are not intended for use by, anyone under the age of
        18. We do not knowingly collect personal information from minors.
      </p>

      <h2>10. Changes to This Policy</h2>
      <p>
        We may update this Privacy Policy from time to time. Material changes will be reflected by
        updating the "Last updated" date at the top of this page.
      </p>

      <h2>11. Contact Us</h2>
      <p>
        If you have any questions about this Privacy Policy or how your data is handled, please
        reach out via our <a href="/contact">Contact page</a> or through our{' '}
        <a href="https://t.me/alifaisaltrades" target="_blank" rel="noopener">Telegram community</a>.
      </p>
    </LegalPageLayout>
  );
}
