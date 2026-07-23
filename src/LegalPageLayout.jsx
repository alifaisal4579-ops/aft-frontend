import { useEffect } from 'react';

const PAGE_CSS = `
  *{box-sizing:border-box;margin:0;padding:0;}
  html{scroll-behavior:smooth;}
  body{background:var(--bg);color:var(--text);font-family:var(--sans);-webkit-font-smoothing:antialiased;line-height:1.5;}
  a{color:inherit;text-decoration:none;}
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
    border:1.5px solid rgba(255,255,255,.2);
    box-shadow:0 0 0 3px rgba(232,166,60,.14),0 2px 10px rgba(0,0,0,.45);
    backdrop-filter:blur(6px) saturate(140%);-webkit-backdrop-filter:blur(6px) saturate(140%);
  }
  .nav-links{display:flex;align-items:center;justify-content:flex-end;gap:28px;flex:1;flex-wrap:nowrap;font-size:14px;color:var(--muted);}
  .nav-links a{font-family:var(--display);transition:color .15s ease;position:relative;white-space:nowrap;flex-shrink:0;text-decoration:none;color:var(--muted);}
  .nav-links a:hover{color:var(--text);}
  .nav-cta-group{display:flex;align-items:center;gap:10px;margin-left:24px;flex-shrink:0;}
  .nav-telegram{
    font-family:var(--display);font-size:13px;font-weight:600;color:var(--muted);
    border:1px solid var(--border);padding:8px 16px;border-radius:6px;
    display:flex;align-items:center;gap:6px;transition:all .2s ease;white-space:nowrap;text-decoration:none;
  }
  .nav-telegram:hover{border-color:rgba(94,196,240,.5);color:#8fd4f5;background:rgba(94,196,240,.06);}
  .nav-telegram svg{width:13px;height:13px;flex-shrink:0;}
  .nav-cta{
    font-family:var(--display);font-size:13px;font-weight:700;letter-spacing:.01em;text-decoration:none;
    background:linear-gradient(135deg,#F2BE5E,var(--tape));color:#241a05;padding:9px 18px;border-radius:6px;
    white-space:nowrap;transition:filter .2s ease,transform .2s ease;box-shadow:0 6px 20px -8px rgba(232,166,60,.6);
  }
  .nav-cta:hover{filter:brightness(1.08);transform:translateY(-1px);}
  .nav-mobile-menu{display:flex;align-items:center;gap:28px;flex:1;justify-content:flex-end;}
  .nav-toggle{display:none;background:transparent;border:1px solid var(--border);color:var(--text);border-radius:6px;padding:8px 10px;cursor:pointer;align-items:center;justify-content:center;}
  @media (max-width:900px){
    .nav-toggle{display:flex;}
    .nav-mobile-menu{display:none;}
    .nav-mobile-menu.open{
      display:flex;position:absolute;top:100%;left:16px;right:16px;z-index:70;margin-top:8px;
      flex-direction:column;align-items:stretch;gap:4px;
      background:var(--bg);border:1px solid var(--border);border-radius:16px;padding:14px 18px;
    }
    .nav-mobile-menu.open .nav-links{display:flex;flex-direction:column;gap:0;}
    .nav-mobile-menu.open .nav-links a{padding:10px 0;border-bottom:1px solid var(--border);}
    .nav-mobile-menu.open .nav-cta-group{display:flex;flex-direction:column;align-items:stretch;gap:8px;margin-top:10px;padding-top:10px;border-top:1px solid var(--border);}
    .nav-mobile-menu.open .nav-telegram,.nav-mobile-menu.open .nav-cta{justify-content:center;}
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

  footer{position:relative;z-index:1;padding:44px 0 36px;}
  .footer-inner{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;padding-top:28px;border-top:1px solid rgba(255,255,255,.07);}
  .footer-links{display:flex;gap:22px;flex-wrap:wrap;font-size:12.5px;color:var(--muted);}
  .footer-links a:hover{color:var(--text);}
  .footer-note{font-family:var(--mono);font-size:10.5px;color:var(--muted-2, var(--muted));max-width:560px;line-height:1.6;margin-top:18px;}
`;

export default function LegalPageLayout({ eyebrow, title, updated, children }) {
  useEffect(() => {
    document.title = `${title} \u00b7 Ali Faisal Trades`;

    const navToggle = document.getElementById('navToggle');
    const navMobileMenu = document.getElementById('navMobileMenu');
    const onToggleClick = () => { if (navMobileMenu) navMobileMenu.classList.toggle('open'); };
    if (navToggle) navToggle.addEventListener('click', onToggleClick);
    return () => { if (navToggle) navToggle.removeEventListener('click', onToggleClick); };
  }, [title]);

  return (
    <>
      <style>{PAGE_CSS}</style>

      <div className="nav-outer">
        <nav id="mainNav">
          <a href="/" className="nav-brand">
            <img src="/logo.jpg" alt="Ali Faisal Trades" className="nav-avatar" />
            <span className="logo">Ali Faisal Trades</span>
          </a>
          <button className="nav-toggle" id="navToggle" aria-label="Menu">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
          </button>
          <div className="nav-mobile-menu" id="navMobileMenu">
            <div className="nav-links">
              <a href="/sector-screener.html">Sector Screener</a>
              <a href="/confluence-dashboard.html">Confluence Dashboard</a>
              <a href="/position-size-calculator.html">Position Size Calculator</a>
            </div>
            <div className="nav-cta-group">
              <a className="nav-telegram" href="https://t.me/alifaisaltrades" target="_blank" rel="noopener">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71l-4.14-3.05-2 1.92c-.23.23-.42.42-.82.42z" /></svg>
                <span>Join Telegram</span>
              </a>
              <a className="nav-cta" href="/login">Open Terminal &rarr;</a>
            </div>
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
        <div className="wrap">
          <div className="footer-inner">
            <span className="logo">Ali Faisal Trades</span>
            <div className="footer-links">
              <a href="/about">About</a>
              <a href="/disclaimer">Disclaimer</a>
              <a href="/privacy-policy">Privacy Policy</a>
              <a href="/contact">Contact</a>
            </div>
          </div>
          <p className="footer-note">
            Educational and informational only. Ali Faisal Trades provides market-structure and order-flow analytics, not financial advice.
            Crypto markets are volatile and leveraged trading carries substantial risk of loss. &copy; 2026 Ali Faisal Trades.
          </p>
        </div>
      </footer>
    </>
  );
} 
