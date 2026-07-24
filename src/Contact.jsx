import LegalPageLayout from './LegalPageLayout';

export default function Contact() {
  return (
    <LegalPageLayout
      eyebrow="Get in touch"
      title="Contact Us"
      description="Get in touch with Ali Faisal Trades via Telegram for questions about any of the 16 crypto trading tools or your account."
    >
      <h2>Telegram community</h2>
      <p>
        The fastest way to reach us, ask a question about any tool, or report something that looks
        off is our Telegram community:
      </p>
      <p>
        <a href="https://t.me/alifaisaltrades" target="_blank" rel="noopener">
          t.me/alifaisaltrades &rarr;
        </a>
      </p>

      <h2>What to include</h2>
      <p>To help us respond quickly, please include as much of the following as applies:</p>
      <ul>
        <li>Which tool you were using (e.g., Order Flow, Confluence Dashboard, a specific bot);</li>
        <li>The symbol and timeframe involved, if relevant;</li>
        <li>A screenshot, if you're reporting something that looks incorrect; and</li>
        <li>Whether you're using a paper-trading bot or a real-money bot, if your question is about a trade.</li>
      </ul>

      <h2>Account, billing, or security matters</h2>
      <p>
        For anything involving your account, an exchange API key, or a security concern, please
        reach out through Telegram as well and flag that it's account-related &mdash; we
        prioritize these. For your safety, never share your exchange API secret or passphrase with
        anyone, including anyone claiming to be part of our team; we will never ask for it outside
        of the secure form in your own dashboard.
      </p>

      <h2>Response times</h2>
      <p>
        We aim to respond to messages as quickly as we reasonably can. Response times may vary
        depending on volume and the complexity of your question.
      </p>
    </LegalPageLayout>
  );
}
