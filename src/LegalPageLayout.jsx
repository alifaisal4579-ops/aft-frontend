import { useEffect } from 'react';

const PAGE_CSS = `
  *{box-sizing:border-box;}
  body{background:var(--bg);color:var(--text);font-family:var(--sans);-webkit-font-smoothing:antialiased;}
  .wrap{max-width:1180px;margin:0 auto;padding:0 24px;}

  .nav-outer{position:sticky;top:0;z-index:60;background:var(--bg);border-bottom:1px solid var(--border);}
  nav{
    max-width:1400px;margin:0 auto;width:100%;display:flex;align-items:center;justify-content:space-between;
    gap:24px;padding:16px 32px;position:relative;flex-wrap:nowrap;
  }
  .logo{font-family:var(--display);font-weight:700;font-size:15px;white-space:nowrap;color:var(--text);}
  .logo b{color:var(--tape);}
  .nav-brand{display:flex;align-items:center;gap:10px;text-decoration:none;flex-shrink:0;}
  .nav-avatar{
    width:32px;height:32px;border-radius:50%;object-fit:cover;flex-shrink:0;
    border:1.5px solid rgba(255,255,255,.2);box-shadow:0 0 0 3px rgba(232,166,60,.14),0 2px 10px rgba(0,0,0,.45);
  }
  .nav-links{display:flex;align-items:center;justify-content:flex-end;gap:28px;flex:1;flex-wrap:nowrap;font-size:14px;}
  .nav-links a{font-family:var(--display);color:var(--muted);text-decoration:none;white-space:nowrap;transition:color .15s ease;}
  .nav-links a:hover{color:var(--text);}
  .nav-cta-group{display:flex;align-items:center;gap:10px;margin-left:24px;flex-shrink:0;}
  .nav-cta{
    font-family:var(--display);font-size:13px;font-weight:700;text-decoration:none;
    background:linear-gradient(135deg,#F2BE5E,var(--tape));color:#241a05;padding:9px 18px;border-radius:6px;
    white-space:nowrap;box-shadow:0 6px 20px -8px rgba(232,166,60,.6);
  }
  .nav-toggle{display:none;background:transparent;border:1px solid var(--border);color:var(--text);border-radius:6px;padding:8px 10px;cursor:pointer;}
  @media (max-width:820px){
    .nav-toggle{display:flex;}
    .nav-links,.nav-cta-group{display:none;}
    nav{padding:14px 16px;}
  }

  .legal-hero{padding:56px 0 24px;border-bottom:1px solid var(--border);}
  .legal-eyebrow{font-family:var(--mono);font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--tape);margin-bottom:12px;}
  .legal-hero h1{font-family:var(--display);font-size:34px;font-weight:700;margin:0 0 10px;}
  .legal-updated{font-family:var(--mono);font-size:12px;color:var(--muted);}

  .legal-body{max-width:820px;margin:0 auto;padding:48px 24px 90px;}
  .legal-body h2{font-family:var(--display);font-size:19px;font-weight:700;margin:36px 0 12px;color:var(--text);}
  .legal-body h2:first-child{margin-top:0;}
  .legal-body p{font-size:15px;line-height:1.75;color:var(--muted);margin:0 0 16px;}
  .legal-body p strong, .legal-body li strong{color:var(--text);}
  .legal-body ul{margin:0 0 16px;padding-left:22px;}
  .legal-body li{font-size:15px;line-height:1.75;color:var(--muted);margin-bottom:8px;}
  .legal-callout{
    background:rgba(232,166,60,.06);border:1px solid rgba(232,166,60,.25);border-radius:10px;
    padding:18px 20px;margin:24px 0;font-size:14.5px;line-height:1.7;color:var(--text);
  }
  .legal-callout b{color:var(--tape);}
  .legal-body a{color:var(--tape);text-decoration:underline;text-underline-offset:2px;}

  footer{border-top:1px solid var(--border);padding:32px 0;}
  .footer-row{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;}
  .footer-links{display:flex;gap:20px;flex-wrap:wrap;}
  .footer-links a{font-family:var(--mono);font-size:12.5px;color:var(--muted);text-decoration:none;}
  .footer-links a:hover{color:var(--tape);}
  .footer-copy{font-family:var(--mono);font-size:11.5px;color:var(--muted-2, var(--muted));}
`;

export default function LegalPageLayout({ eyebrow, title, updated, children }) {
  useEffect(() => {
    document.title = `${title} \u00b7 Ali Faisal Trades`;
  }, [title]);

  return (
    <>
      <style>{PAGE_CSS}</style>

      <div className="nav-outer">
        <nav>
          <a href="/" className="nav-brand">
            <img src="/logo.jpg" alt="Ali Faisal Trades" className="nav-avatar" />
            <span className="logo">Ali Faisal Trades</span>
          </a>
          <button className="nav-toggle" aria-label="Menu">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
          </button>
          <div className="nav-links">
            <a href="/sector-screener.html">Sector Screener</a>
            <a href="/confluence-dashboard.html">Confluence Dashboard</a>
            <a href="/position-size-calculator.html">Position Size Calculator</a>
          </div>
          <div className="nav-cta-group">
            <a className="nav-cta" href="/login">Open Terminal &rarr;</a>
          </div>
        </nav>
      </div>

      <header className="legal-hero">
        <div className="wrap">
          <div className="legal-eyebrow">{eyebrow}</div>
          <h1>{title}</h1>
          {updated && <div className="legal-updated">Last updated: {updated}</div>}
        </div>
      </header>

      <main className="legal-body">
        {children}
      </main>

      <footer>
        <div className="wrap footer-row">
          <span className="logo">Ali Faisal <b>Trades</b></span>
          <div className="footer-links">
            <a href="/about">About</a>
            <a href="/disclaimer">Disclaimer</a>
            <a href="/privacy-policy">Privacy Policy</a>
            <a href="/contact">Contact</a>
            <a href="https://t.me/alifaisaltrades" target="_blank" rel="noopener">Telegram</a>
          </div>
          <span className="footer-copy">&copy; 2026 Ali Faisal Trades.</span>
        </div>
      </footer>
    </>
  );
}
