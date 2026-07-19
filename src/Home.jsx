import { useEffect } from 'react';
import LiveOrderFlow from './LiveOrderFlow';
import LiveRsiScreener from './LiveRsiScreener';

const HOMEPAGE_CSS = `
  :root{
    --bg:#080B10; --surface:#0E131B; --surface-2:#151C27; --surface-3:#1A2230;
    --border:#222B38; --border-soft:rgba(34,43,56,.6);
    --text:#E8ECF1; --muted:#7C8998; --muted-2:#57626F;
    --tape:#E8A63C; --tape-soft:rgba(232,166,60,.12);
    --bull:#2FD8A6; --bull-soft:rgba(47,216,166,.12);
    --bear:#FF6259; --bear-soft:rgba(255,98,89,.12);
    --violet:#8B7FE8; --violet-soft:rgba(139,127,232,.12);
    --mono:'JetBrains Mono',ui-monospace,monospace;
    --display:'Space Grotesk',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
    --radius:16px; --radius-sm:10px;
  }
  *{box-sizing:border-box;margin:0;padding:0;}
  html{scroll-behavior:smooth;}
  ::selection{background:rgba(232,166,60,.25);color:var(--text);}
  body{
    background:
      radial-gradient(ellipse 1100px 600px at 12% -8%, rgba(232,166,60,.07), transparent 55%),
      radial-gradient(ellipse 900px 600px at 100% 8%, rgba(47,216,166,.055), transparent 55%),
      var(--bg);
    color:var(--text); font-family:var(--display); -webkit-font-smoothing:antialiased;
    line-height:1.5;
  }
  a{color:inherit;text-decoration:none;}
  .wrap{max-width:1180px;margin:0 auto;padding:0 24px;}
  img,svg{display:block;max-width:100%;}

  /* ---- nav ---- */
  nav{
    position:sticky;top:0;z-index:50;
    background:rgba(8,11,16,.82);backdrop-filter:blur(10px);
    border-bottom:1px solid var(--border-soft);
  }
  .nav-inner{display:flex;align-items:center;gap:28px;padding:16px 24px;max-width:1180px;margin:0 auto;}
  .logo{font-family:var(--mono);font-weight:700;font-size:14px;letter-spacing:.02em;}
  .logo b{color:var(--tape);}
  .nav-links{display:flex;gap:22px;flex:1;font-size:13px;color:var(--muted);}
  .nav-links a:hover{color:var(--text);}
  .nav-cta{
    font-family:var(--mono);font-size:12px;font-weight:600;letter-spacing:.02em;
    background:var(--tape);color:#241a05;padding:9px 16px;border-radius:8px;
    transition:filter .15s ease;
  }
  .nav-cta:hover{filter:brightness(1.08);}
  .nav-cta-group{display:flex;align-items:center;gap:10px;}
  .nav-telegram{
    font-family:var(--mono);font-size:12px;font-weight:600;letter-spacing:.01em;
    color:var(--muted);border:1px solid var(--border);padding:8px 14px;border-radius:8px;
    display:flex;align-items:center;gap:6px;transition:border-color .15s ease,color .15s ease;
  }
  .nav-telegram:hover{border-color:#2FA5D8;color:#5FC2EF;}
  .nav-telegram svg{width:14px !important;height:14px !important;flex-shrink:0;}
  @media (max-width:760px){ .nav-links{display:none;} .nav-telegram span{display:none;} }

  /* ---- hero ---- */
  .hero{padding:76px 0 40px;}
  .hero-grid{display:grid;grid-template-columns:1.05fr .95fr;gap:48px;align-items:center;}
  .eyebrow{
    font-family:var(--mono);font-size:11px;letter-spacing:.14em;text-transform:uppercase;
    color:var(--tape);margin-bottom:16px;display:flex;align-items:center;gap:8px;
  }
  .eyebrow::before{content:'';width:6px;height:6px;border-radius:50%;background:var(--tape);box-shadow:0 0 0 3px var(--tape-soft);}
  h1{
    font-size:clamp(34px,4.6vw,52px);font-weight:700;line-height:1.06;letter-spacing:-.02em;
    margin-bottom:20px;
  }
  h1 .accent{color:var(--tape);}
  .hero-sub{font-size:16.5px;color:var(--muted);max-width:520px;margin-bottom:28px;line-height:1.65;}
  .hero-sub b{color:var(--text);font-weight:600;}
  .cta-row{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:34px;}
  .btn-primary{
    font-family:var(--mono);font-size:13px;font-weight:700;letter-spacing:.01em;
    background:var(--tape);color:#241a05;padding:13px 22px;border-radius:9px;
    display:inline-flex;align-items:center;gap:8px;transition:filter .15s ease,transform .15s ease;
  }
  .btn-primary:hover{filter:brightness(1.08);transform:translateY(-1px);}
  .btn-secondary{
    font-family:var(--mono);font-size:13px;font-weight:600;
    border:1px solid var(--border);color:var(--text);padding:13px 20px;border-radius:9px;
    transition:border-color .15s ease;
  }
  .btn-secondary:hover{border-color:var(--tape);}
  .trust-row{display:flex;gap:20px;flex-wrap:wrap;font-family:var(--mono);font-size:11.5px;color:var(--muted-2);}
  .trust-row b{color:var(--muted);}

  /* ---- hero visual: mini confluence card ---- */
  .hero-visual{position:relative;}
  .glow{position:absolute;inset:-40px;background:radial-gradient(circle at 60% 30%, rgba(232,166,60,.14), transparent 65%);filter:blur(10px);z-index:0;}
  .preview-card{
    position:relative;z-index:1;background:linear-gradient(160deg,var(--surface-2),var(--surface));
    border:1px solid var(--border-soft);border-radius:var(--radius);padding:18px 18px 14px;
    box-shadow:0 20px 50px -20px rgba(0,0,0,.6);
  }
  .preview-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;}
  .preview-title{font-family:var(--mono);font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);}
  .preview-live{
    font-family:var(--mono);font-size:10px;color:var(--bull);display:flex;align-items:center;gap:5px;
  }
  .preview-live::before{content:'';width:6px;height:6px;border-radius:50%;background:var(--bull);animation:blink 2s ease-in-out infinite;}
  @keyframes blink{0%,100%{opacity:1;}50%{opacity:.3;}}
  .conf-row{
    display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:8px;
    background:rgba(8,11,16,.4);margin-bottom:6px;
  }
  .conf-sym{font-family:var(--mono);font-size:12px;font-weight:600;width:64px;flex-shrink:0;}
  .conf-bars{display:flex;gap:3px;flex:1;}
  .conf-bar{height:14px;border-radius:3px;flex:1;background:var(--border);}
  .conf-bar.on{background:var(--bull);}
  .conf-bar.on.tape{background:var(--tape);}
  .conf-score{font-family:var(--mono);font-size:11px;font-weight:700;width:34px;text-align:right;flex-shrink:0;}
  .conf-score.high{color:var(--bull);}
  .conf-score.mid{color:var(--tape);}
  .preview-foot{
    margin-top:10px;padding-top:10px;border-top:1px solid var(--border-soft);
    font-family:var(--mono);font-size:10px;color:var(--muted-2);display:flex;justify-content:space-between;
  }

  /* ---- ticker strip ---- */
  .ticker-strip{
    border-top:1px solid var(--border-soft);border-bottom:1px solid var(--border-soft);
    background:var(--surface);overflow:hidden;padding:13px 0;
  }
  .ticker-track{display:flex;gap:40px;white-space:nowrap;animation:scroll 32s linear infinite;width:max-content;}
  .ticker-strip:hover .ticker-track{animation-play-state:paused;}
  @keyframes scroll{from{transform:translateX(0);}to{transform:translateX(-50%);}}
  .ticker-item{font-family:var(--mono);font-size:12.5px;color:var(--muted);display:flex;align-items:center;gap:8px;}
  .ticker-item b{color:var(--text);}
  .ticker-item .up{color:var(--bull);}
  .ticker-item .down{color:var(--bear);}
  @media (prefers-reduced-motion: reduce){ .ticker-track{animation:none;} }

  /* ---- section shell ---- */
  section{padding:88px 0;scroll-margin-top:64px;}
  .section-head{max-width:640px;margin-bottom:48px;}
  .section-head.center{margin-left:auto;margin-right:auto;text-align:center;}
  h2{font-size:clamp(24px,3vw,32px);font-weight:700;letter-spacing:-.01em;line-height:1.18;margin-bottom:12px;}
  .section-desc{color:var(--muted);font-size:15px;line-height:1.7;}

  /* ---- tool grid ---- */
  .tool-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:1px;background:var(--border-soft);border:1px solid var(--border-soft);border-radius:var(--radius);overflow:hidden;}
  .tool-card{background:var(--surface);padding:26px 24px;transition:background .18s ease;}
  .tool-card:hover{background:var(--surface-2);}
  .tool-icon{width:34px;height:34px;border-radius:9px;display:flex;align-items:center;justify-content:center;margin-bottom:16px;font-family:var(--mono);font-weight:700;font-size:13px;}
  .tool-card h3{font-size:15.5px;font-weight:600;margin-bottom:8px;}
  .tool-card p{font-size:13px;color:var(--muted);line-height:1.6;margin-bottom:12px;}
  .tool-tag{font-family:var(--mono);font-size:10px;letter-spacing:.05em;text-transform:uppercase;color:var(--muted-2);}

  /* ---- process ---- */
  .process{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:var(--border-soft);border:1px solid var(--border-soft);border-radius:var(--radius);overflow:hidden;}
  @media (max-width:820px){ .process{grid-template-columns:repeat(2,1fr);} }
  .process-step{background:var(--surface);padding:24px 20px;position:relative;}
  .process-num{font-family:var(--mono);font-size:11px;color:var(--tape);margin-bottom:14px;}
  .process-step h4{font-size:14.5px;font-weight:600;margin-bottom:8px;}
  .process-step p{font-size:12.5px;color:var(--muted);line-height:1.6;}

  /* ---- deep dive with mockups ---- */
  .deepdive{display:grid;grid-template-columns:1fr 1fr;gap:56px;align-items:center;margin-bottom:90px;scroll-margin-top:80px;}
  .deepdive.reverse{grid-template-columns:1fr 1fr;}
  .deepdive.reverse .dd-visual{order:2;}
  .deepdive.reverse .dd-text{order:1;}
  @media (max-width:860px){ .deepdive,.deepdive.reverse{grid-template-columns:1fr;} .deepdive.reverse .dd-visual,.deepdive.reverse .dd-text{order:0;} }
  .dd-eyebrow{font-family:var(--mono);font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--tape);margin-bottom:12px;}
  .dd-text h3{font-size:22px;font-weight:700;margin-bottom:14px;letter-spacing:-.01em;}
  .dd-text p{color:var(--muted);font-size:14.5px;line-height:1.7;margin-bottom:16px;}
  .dd-list{list-style:none;}
  .dd-list li{font-size:13.5px;color:var(--muted);padding:6px 0 6px 22px;position:relative;}
  .dd-list li::before{content:'\\2713';position:absolute;left:0;color:var(--bull);font-family:var(--mono);font-size:12px;}
  .dd-visual{background:linear-gradient(160deg,var(--surface-2),var(--surface));border:1px solid var(--border-soft);border-radius:var(--radius);padding:20px;box-shadow:0 20px 50px -24px rgba(0,0,0,.55);}

  /* order flow ladder mockup */
  .ladder{font-family:var(--mono);font-size:11.5px;}
  .ladder-row{display:grid;grid-template-columns:56px 1fr 56px;gap:8px;align-items:center;padding:3px 0;}
  .ladder-bar{height:15px;border-radius:3px;}
  .ladder-bar.ask{background:linear-gradient(90deg,transparent,var(--bear-soft));margin-left:auto;}
  .ladder-bar.bid{background:linear-gradient(90deg,var(--bull-soft),transparent);}
  .ladder-price{color:var(--muted);text-align:right;}
  .ladder-price.mid{color:var(--tape);font-weight:700;text-align:center;}
  .ladder-wall{color:var(--text);font-size:9.5px;background:var(--tape-soft);color:var(--tape);padding:1px 5px;border-radius:4px;margin-left:6px;}

  /* rsi screener table mockup */
  .mini-table{width:100%;font-family:var(--mono);font-size:12px;border-collapse:collapse;}
  .mini-table th{text-align:left;color:var(--muted-2);font-size:9.5px;letter-spacing:.06em;text-transform:uppercase;padding:8px 8px;border-bottom:1px solid var(--border-soft);}
  .mini-table td{padding:9px 8px;border-bottom:1px solid rgba(34,43,56,.4);}
  .mini-table tr:last-child td{border-bottom:none;}
  .pill{font-size:10px;padding:2px 8px;border-radius:12px;font-weight:600;}
  .pill.bull{background:var(--bull-soft);color:var(--bull);}
  .pill.bear{background:var(--bear-soft);color:var(--bear);}

  /* ---- faq ---- */
  .faq-item{border-bottom:1px solid var(--border-soft);padding:22px 0;}
  .faq-item h4{font-size:15.5px;font-weight:600;margin-bottom:8px;}
  .faq-item p{font-size:13.5px;color:var(--muted);line-height:1.7;max-width:680px;}

  /* ---- final cta ---- */
  .final-cta{
    background:linear-gradient(150deg,var(--surface-2),var(--surface));
    border:1px solid var(--border-soft);border-radius:20px;padding:56px 40px;text-align:center;
    position:relative;overflow:hidden;
  }
  .final-cta::before{content:'';position:absolute;inset:0;background:radial-gradient(circle at 50% 0%, rgba(232,166,60,.1), transparent 60%);}
  .final-cta h2{position:relative;margin-bottom:14px;}
  .final-cta p{position:relative;color:var(--muted);font-size:15px;max-width:480px;margin:0 auto 26px;}
  .final-cta .cta-row{justify-content:center;position:relative;}

  footer{border-top:1px solid var(--border-soft);padding:40px 0 32px;}
  .footer-inner{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;}
  .footer-links{display:flex;gap:20px;font-size:12.5px;color:var(--muted);}
  .footer-note{font-family:var(--mono);font-size:11px;color:var(--muted-2);max-width:560px;line-height:1.6;margin-top:20px;}

  .live-widget-loading,.live-widget-error{
    font-family:var(--mono);font-size:12.5px;color:var(--muted);padding:30px 10px;text-align:center;
  }
  .live-widget-error{color:var(--bear);}
  .live-widget-foot{
    margin-top:10px;padding-top:10px;border-top:1px solid var(--border-soft);
    font-family:var(--mono);font-size:10px;color:var(--muted-2);display:flex;justify-content:space-between;
  }
`;
const PART1_BEFORE = `

<nav>
  <div class="nav-inner">
    <span class="logo">AFT <b>Tools</b></span>
    <div class="nav-links">
      <a href="/tools/order-flow">Order Flow</a>
      <a href="/tools/rsi-screener">RSI Screener</a>
    </div>
    <div class="nav-cta-group">
      <a class="nav-telegram" href="https://t.me/alifaisaltrades" target="_blank" rel="noopener">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="width:14px;height:14px;min-width:14px;max-width:14px;"><path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71l-4.14-3.05-2 1.92c-.23.23-.42.42-.82.42z"/></svg>
        <span>Join Telegram</span>
      </a>
      <a class="nav-cta" href="/login">Open Terminal &rarr;</a>
    </div>
  </div>
</nav>

<header class="hero">
  <div class="wrap hero-grid">
    <div>
      <div class="eyebrow">Institutional Order Flow &middot; Crypto</div>
      <h1>Price shows what happened.<br><span class="accent">Order flow shows who did it.</span></h1>
      <p class="hero-sub">
        AFT Tools is a <b>seven-tool confluence suite</b> for spotting institutional footprints across
        crypto markets &mdash; screeners, volume and order flow, VWAPs and Fibonacci structure, unified
        into one live confluence dashboard so you're not reading eight tabs to make one decision.
      </p>
      <div class="cta-row">
        <a class="btn-primary" href="#suite">Open Toolkit &rarr;</a>
        <a class="btn-secondary" href="#confluence">See how confluence works</a>
      </div>
      <div class="trust-row">
        <span><b>7</b> integrated tools</span>
        <span><b>14</b> exchanges aggregated</span>
        <span><b>Real-time</b> order book data</span>
      </div>
    </div>

    <div class="hero-visual">
      <div class="glow"></div>
      <div class="preview-card">
        <div class="preview-head">
          <span class="preview-title">Confluence Dashboard</span>
          <span class="preview-live">Live</span>
        </div>
        <div class="conf-row">
          <span class="conf-sym">BTCUSDT</span>
          <div class="conf-bars">
            <div class="conf-bar on"></div><div class="conf-bar on"></div><div class="conf-bar on"></div>
            <div class="conf-bar on"></div><div class="conf-bar"></div>
          </div>
          <span class="conf-score high">4/5</span>
        </div>
        <div class="conf-row">
          <span class="conf-sym">SOLUSDT</span>
          <div class="conf-bars">
            <div class="conf-bar on tape"></div><div class="conf-bar on tape"></div><div class="conf-bar on tape"></div>
            <div class="conf-bar"></div><div class="conf-bar"></div>
          </div>
          <span class="conf-score mid">3/5</span>
        </div>
        <div class="conf-row">
          <span class="conf-sym">ETHUSDT</span>
          <div class="conf-bars">
            <div class="conf-bar on"></div><div class="conf-bar on"></div>
            <div class="conf-bar"></div><div class="conf-bar"></div><div class="conf-bar"></div>
          </div>
          <span class="conf-score mid">2/5</span>
        </div>
        <div class="preview-foot">
          <span>RSI &middot; Volume &middot; Order Flow &middot; VWAP &middot; Fib</span>
          <span>updated 4s ago</span>
        </div>
      </div>
    </div>
  </div>
</header>

<div class="ticker-strip">
  <div class="ticker-track">
    <span class="ticker-item">BTCUSDT <b>$64,682</b> <span class="up">+1.2%</span> &middot; 4/5 confluence</span>
    <span class="ticker-item">Order Flow: bid wall <b>$64,420</b> &middot; 340K USDT</span>
    <span class="ticker-item">SOLUSDT <b>$187.9</b> <span class="down">-0.8%</span> &middot; VWAP reclaim</span>
    <span class="ticker-item">RSI Screener: <b>6</b> symbols oversold &lt;30</span>
    <span class="ticker-item">ETHUSDT <b>$3,681</b> <span class="up">+0.4%</span> &middot; Fib 61.8% test</span>
    <span class="ticker-item">Volume Profile: HVN forming <b>$64,100&ndash;64,300</b></span>
    <span class="ticker-item">BTCUSDT <b>$64,682</b> <span class="up">+1.2%</span> &middot; 4/5 confluence</span>
    <span class="ticker-item">Order Flow: bid wall <b>$64,420</b> &middot; 340K USDT</span>
    <span class="ticker-item">SOLUSDT <b>$187.9</b> <span class="down">-0.8%</span> &middot; VWAP reclaim</span>
    <span class="ticker-item">RSI Screener: <b>6</b> symbols oversold &lt;30</span>
    <span class="ticker-item">ETHUSDT <b>$3,681</b> <span class="up">+0.4%</span> &middot; Fib 61.8% test</span>
    <span class="ticker-item">Volume Profile: HVN forming <b>$64,100&ndash;64,300</b></span>
  </div>
</div>

<section id="suite">
  <div class="wrap">
    <div class="section-head">
      <div class="eyebrow">The suite</div>
      <h2>Not seven separate tabs. One confluence stack.</h2>
      <p class="section-desc">
        Each tool answers a different question &mdash; where's the crowd, where's the real size, where's
        the level that matters. Used together, they stop agreeing by accident and start agreeing on purpose.
      </p>
    </div>

    <div class="tool-grid">
      <div class="tool-card">
        <div class="tool-icon" style="background:var(--tape-soft);color:var(--tape);">S</div>
        <h3>Sector Screener</h3>
        <p>Ranks crypto sectors (L1s, DeFi, AI, memecoins) by relative strength so you know which basket the money is actually rotating into before you pick a symbol inside it.</p>
        <span class="tool-tag">rotation &middot; relative strength</span>
      </div>
      <div class="tool-card">
        <div class="tool-icon" style="background:var(--bull-soft);color:var(--bull);">R</div>
        <h3>RSI Screener</h3>
        <p>Scans the market for overbought and oversold conditions across timeframes, filtered by a minimum market cap so you're not chasing illiquid noise.</p>
        <span class="tool-tag">momentum &middot; extremes</span>
      </div>
      <div class="tool-card">
        <div class="tool-icon" style="background:var(--violet-soft);color:var(--violet);">V</div>
        <h3>Volume Profile</h3>
        <p>Maps where volume actually traded, not just where price moved &mdash; surfacing high-volume nodes and value areas that behave like real support and resistance.</p>
        <span class="tool-tag">HVN/LVN &middot; value area</span>
      </div>
      <div class="tool-card">
        <div class="tool-icon" style="background:var(--bear-soft);color:var(--bear);">O</div>
        <h3>Order Flow</h3>
        <p>An aggregated depth ladder across 14 exchanges with wall detection, CVD divergence and liquidation clusters &mdash; the closest read you'll get on where size is actually resting.</p>
        <span class="tool-tag">depth &middot; walls &middot; CVD</span>
      </div>
      <div class="tool-card">
        <div class="tool-icon" style="background:var(--tape-soft);color:var(--tape);">W</div>
        <h3>VWAPs</h3>
        <p>Daily, weekly, monthly and quarterly anchored VWAPs in one view, with a previous-levels table so you can see exactly which anchor price is currently respecting.</p>
        <span class="tool-tag">anchored &middot; multi-timeframe</span>
      </div>
      <div class="tool-card">
        <div class="tool-icon" style="background:var(--bull-soft);color:var(--bull);">F</div>
        <h3>Fibonacci Levels</h3>
        <p>Auto-plots retracement and extension levels off the dominant swing, so the 61.8% and 78.6% zones that matter are marked before price gets there, not after.</p>
        <span class="tool-tag">retracement &middot; extension</span>
      </div>
      <div class="tool-card">
        <div class="tool-icon" style="background:var(--violet-soft);color:var(--violet);">C</div>
        <h3>Confluences Dashboard</h3>
        <p>Pulls every tool above into one score per symbol &mdash; how many independent signals actually agree, right now, so a "setup" means more than one indicator's opinion.</p>
        <span class="tool-tag">aggregated &middot; scored</span>
      </div>
    </div>
  </div>
</section>

<section id="confluence" style="background:var(--surface);border-top:1px solid var(--border-soft);border-bottom:1px solid var(--border-soft);">
  <div class="wrap">
    <div class="section-head center" style="margin-left:auto;margin-right:auto;">
      <div class="eyebrow" style="justify-content:center;">How confluence works</div>
      <h2>Four questions, asked in order.</h2>
      <p class="section-desc">A symbol only earns a high confluence score if it survives every stage &mdash; not by tripping one indicator.</p>
    </div>
    <div class="process">
      <div class="process-step">
        <div class="process-num">01 &middot; SCREEN</div>
        <h4>Where's the crowd?</h4>
        <p>Sector and RSI screeners narrow thousands of pairs to the handful actually showing relative strength or momentum extremes.</p>
      </div>
      <div class="process-step">
        <div class="process-num">02 &middot; CONFIRM</div>
        <h4>Is size actually there?</h4>
        <p>Volume Profile and Order Flow check whether real size backs the move, or if it's thin, easily-reversed volume.</p>
      </div>
      <div class="process-step">
        <div class="process-num">03 &middot; LOCATE</div>
        <h4>Where's the level?</h4>
        <p>VWAPs and Fibonacci structure pinpoint the exact price zone the setup should react at, not just "somewhere near here."</p>
      </div>
      <div class="process-step">
        <div class="process-num">04 &middot; SCORE</div>
        <h4>How many agree?</h4>
        <p>The Confluences Dashboard tallies every independent yes into one live score per symbol &mdash; visible, not hidden in your head.</p>
      </div>
    </div>
  </div>
</section>
`;
const PART3_AFTER = `

<section id="faq" style="background:var(--surface);border-top:1px solid var(--border-soft);">
  <div class="wrap" style="max-width:820px;">
    <div class="section-head">
      <div class="eyebrow">Frequently asked</div>
      <h2>What the suite is built to do.</h2>
    </div>

    <div class="faq-item">
      <h4>Do I need to use all seven tools together?</h4>
      <p>No. Each tool works standalone, but the Confluences Dashboard is what turns "four separate signals" into one visible score &mdash; that's where the suite compounds.</p>
    </div>
    <div class="faq-item">
      <h4>What counts as a high-confluence setup?</h4>
      <p>A symbol where multiple independent tools &mdash; screener, volume, order flow, level structure &mdash; agree at the same time, at the same zone. One indicator alone never counts as confluence.</p>
    </div>
    <div class="faq-item">
      <h4>Is this financial advice or a signal service?</h4>
      <p>No. AFT Tools is market-structure and order-flow analytics &mdash; decision support, not a buy/sell call. You still make the trade decision and manage your own risk.</p>
    </div>
    <div class="faq-item">
      <h4>Which exchanges does the data come from?</h4>
      <p>Order flow and depth data is aggregated across 14 exchanges; screeners and levels are computed on real market data, not testnet or delayed feeds.</p>
    </div>
  </div>
</section>

<section>
  <div class="wrap">
    <div class="final-cta">
      <h2>Stop reading eight tabs to make one decision.</h2>
      <p>Seven tools, one confluence score, updated live. Free to open, no install.</p>
      <div class="cta-row">
        <a class="btn-primary" href="#suite">Open Toolkit &rarr;</a>
      </div>
    </div>
  </div>
</section>

<footer>
  <div class="wrap">
    <div class="footer-inner">
      <span class="logo">AFT <b>Tools</b></span>
      <div class="footer-links">
        <a href="#suite">Suite</a>
        <a href="#confluence">Confluence Engine</a>
        <a href="#faq">FAQ</a>
      </div>
    </div>
    <p class="footer-note">
      Educational and informational only. AFT Tools provides market-structure and order-flow analytics, not financial advice.
      Crypto markets are volatile and leveraged trading carries substantial risk of loss. &copy; 2026 AFT Tools.
    </p>
  </div>
</footer>

`;

export default function Home() {
  useEffect(() => {
    document.title = 'AFT Tools \u00b7 Institutional Order Flow \u0026 Confluence Suite';
  }, []);

  return (
    <>
      <style>{HOMEPAGE_CSS}</style>
      <div dangerouslySetInnerHTML={{ __html: PART1_BEFORE }} />

      <section>
        <div className="wrap">
          <div id="orderflow" className="deepdive">
            <div className="dd-text">
              <div className="dd-eyebrow">Order Flow</div>
              <h3>See where size is actually resting, not where a line on a chart guesses it is.</h3>
              <p>An aggregated depth ladder across 14 exchanges, with local-neighborhood wall detection, distance-from-mid tracking and a live imbalance read.</p>
              <ul className="dd-list">
                <li>Wall age tracking &mdash; is this size fresh or stale</li>
                <li>CVD divergence detector</li>
                <li>Liquidation cluster binning</li>
                <li>14-exchange aggregated depth</li>
              </ul>
            </div>
            <div className="dd-visual">
              <div className="preview-head" style={{ marginBottom: 16 }}>
                <span className="preview-title">BTCUSDT &middot; Depth Ladder</span>
                <span className="preview-live">Live</span>
              </div>
              <LiveOrderFlow />
            </div>
          </div>

          <div id="rsiscreener" className="deepdive reverse">
            <div className="dd-visual">
              <div className="preview-head" style={{ marginBottom: 4 }}>
                <span className="preview-title">RSI Screener &middot; 1H</span>
                <span className="preview-live">Live</span>
              </div>
              <LiveRsiScreener />
            </div>
            <div className="dd-text">
              <div className="dd-eyebrow">RSI Screener</div>
              <h3>Scan the whole market for extremes in the time it takes to read four rows.</h3>
              <p>Filtered by a minimum market cap floor, across the timeframes that matter to you, refreshed continuously &mdash; so you spend time deciding, not scrolling.</p>
              <ul className="dd-list">
                <li>Overbought / oversold across multiple timeframes</li>
                <li>Market-cap floor filters out illiquid noise</li>
                <li>One-click into full confluence view per symbol</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <div dangerouslySetInnerHTML={{ __html: PART3_AFTER }} />
    </>
  );
}
