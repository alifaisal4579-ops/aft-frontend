import { useEffect } from 'react';
import LiveOrderFlow from './LiveOrderFlow';
import LiveRsiScreener from './LiveRsiScreener';

const HOMEPAGE_CSS = `
  :root{
    --bg:#06070C;
    --text:#EEF1F6; --muted:#8993A6; --muted-2:#565F72;
    --tape:#E8A63C; --bull:#2FD8A6; --bear:#FF6259; --violet:#9C8CFF;
    --glass:rgba(255,255,255,.045); --glass-hover:rgba(255,255,255,.075);
    --glass-border:rgba(255,255,255,.09); --glass-border-hover:rgba(232,166,60,.4);
    --mono:'JetBrains Mono',ui-monospace,monospace;
    --sans:'Manrope',-apple-system,sans-serif;
    --display:'Space Grotesk',var(--sans);
    --r:18px;
  }
  *{box-sizing:border-box;margin:0;padding:0;}
  html{scroll-behavior:smooth;}
  ::selection{background:rgba(232,166,60,.28);color:#fff;}
  body{
    background:var(--bg);color:var(--text);font-family:var(--sans);
    -webkit-font-smoothing:antialiased;overflow-x:hidden;line-height:1.5;
  }
  a{color:inherit;text-decoration:none;}
  .wrap{max-width:1180px;margin:0 auto;padding:0 24px;}

  /* ---- ambient animated mesh background ---- */
  .mesh{position:fixed;inset:0;z-index:0;overflow:hidden;pointer-events:none;}
  .mesh::before,.mesh::after,.mesh i{
    content:'';position:absolute;border-radius:50%;filter:blur(90px);opacity:.55;
  }
  .mesh::before{
    width:640px;height:640px;top:-220px;left:-120px;
    background:radial-gradient(circle,rgba(232,166,60,.22),transparent 70%);
    animation:drift1 26s ease-in-out infinite;
  }
  .mesh::after{
    width:560px;height:560px;top:10%;right:-160px;
    background:radial-gradient(circle,rgba(47,216,166,.18),transparent 70%);
    animation:drift2 32s ease-in-out infinite;
  }
  .mesh i{
    width:520px;height:520px;bottom:-200px;left:30%;
    background:radial-gradient(circle,rgba(156,140,255,.15),transparent 70%);
    animation:drift3 38s ease-in-out infinite;
  }
  @keyframes drift1{0%,100%{transform:translate(0,0) scale(1);}50%{transform:translate(80px,60px) scale(1.15);}}
  @keyframes drift2{0%,100%{transform:translate(0,0) scale(1);}50%{transform:translate(-70px,80px) scale(1.1);}}
  @keyframes drift3{0%,100%{transform:translate(0,0) scale(1);}50%{transform:translate(50px,-70px) scale(1.2);}}
  @media (prefers-reduced-motion: reduce){ .mesh::before,.mesh::after,.mesh i{animation:none;} }

  /* ---- glass base ---- */
  .glass{
    background:var(--glass);backdrop-filter:blur(20px) saturate(140%);-webkit-backdrop-filter:blur(20px) saturate(140%);
    border:1px solid var(--glass-border);border-radius:var(--r);
    box-shadow:0 1px 0 rgba(255,255,255,.06) inset, 0 20px 60px -30px rgba(0,0,0,.7);
    position:relative;
  }
  .glass::before{
    content:'';position:absolute;inset:0;border-radius:inherit;padding:1px;pointer-events:none;
    background:linear-gradient(160deg,rgba(255,255,255,.14),transparent 40%);
    -webkit-mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);
    -webkit-mask-composite:xor;mask-composite:exclude;
  }

  /* ---- scroll reveal ---- */
  .reveal{opacity:0;transform:translateY(28px);transition:opacity .7s cubic-bezier(.16,1,.3,1),transform .7s cubic-bezier(.16,1,.3,1);}
  .reveal.in{opacity:1;transform:translateY(0);}
  @media (prefers-reduced-motion: reduce){ .reveal{opacity:1;transform:none;transition:none;} }

  /* ---- nav ---- */
  .nav-outer{position:sticky;top:16px;z-index:60;display:flex;justify-content:center;padding:0 16px;}
  nav{
    width:100%;max-width:1180px;display:flex;align-items:center;gap:24px;
    padding:12px 20px;border-radius:999px;
    background:rgba(10,12,18,.55);backdrop-filter:blur(18px) saturate(160%);-webkit-backdrop-filter:blur(18px) saturate(160%);
    border:1px solid rgba(255,255,255,.08);
    box-shadow:0 1px 0 rgba(255,255,255,.06) inset,0 12px 40px -20px rgba(0,0,0,.8);
    transition:background .3s ease,box-shadow .3s ease;
  }
  nav.scrolled{background:rgba(8,10,16,.78);box-shadow:0 1px 0 rgba(255,255,255,.08) inset,0 16px 50px -18px rgba(0,0,0,.85);}
  .logo{font-family:var(--mono);font-weight:700;font-size:13px;letter-spacing:.02em;white-space:nowrap;}
  .logo b{color:var(--tape);}
  .nav-brand{display:flex;align-items:center;gap:8px;text-decoration:none;flex-shrink:0;}
  .nav-avatar{
    width:26px;height:26px;border-radius:50%;object-fit:cover;flex-shrink:0;
    border:1.5px solid rgba(255,255,255,.2);box-shadow:0 0 0 3px rgba(232,166,60,.14);
  }
  .nav-links{display:flex;gap:20px;flex:1;font-size:13px;color:var(--muted);}
  .nav-links a{transition:color .15s ease;position:relative;}
  .nav-links a:hover{color:var(--text);}
  .nav-links a::after{content:'';position:absolute;left:0;right:0;bottom:-6px;height:1.5px;background:var(--tape);transform:scaleX(0);transform-origin:left;transition:transform .25s ease;}
  .nav-links a:hover::after{transform:scaleX(1);}
  .nav-cta-group{display:flex;align-items:center;gap:10px;}
  .nav-telegram{
    font-family:var(--mono);font-size:12px;font-weight:600;color:var(--muted);
    border:1px solid rgba(255,255,255,.1);padding:8px 14px;border-radius:999px;
    display:flex;align-items:center;gap:6px;transition:all .2s ease;white-space:nowrap;
  }
  .nav-telegram:hover{border-color:rgba(94,196,240,.5);color:#8fd4f5;background:rgba(94,196,240,.06);}
  .nav-telegram svg{width:13px;height:13px;flex-shrink:0;}
  .nav-cta{
    font-family:var(--mono);font-size:12px;font-weight:700;letter-spacing:.02em;
    background:linear-gradient(135deg,#F2BE5E,var(--tape));color:#241a05;padding:9px 18px;border-radius:999px;
    white-space:nowrap;transition:filter .2s ease,transform .2s ease;box-shadow:0 6px 20px -8px rgba(232,166,60,.6);
  }
  .nav-cta:hover{filter:brightness(1.08);transform:translateY(-1px);}
  @media (max-width:820px){ .nav-links{display:none;} }

  /* ---- hero ---- */
  .hero{position:relative;z-index:1;padding:80px 0 40px;}
  .hero-grid{display:grid;grid-template-columns:1.05fr .95fr;gap:56px;align-items:center;}
  .eyebrow{
    display:inline-flex;align-items:center;gap:8px;font-family:var(--mono);font-size:11px;
    letter-spacing:.1em;text-transform:uppercase;color:var(--tape);margin-bottom:22px;
    padding:6px 14px;border-radius:999px;background:rgba(232,166,60,.08);border:1px solid rgba(232,166,60,.22);
  }
  .eyebrow i{width:6px;height:6px;border-radius:50%;background:var(--tape);box-shadow:0 0 0 3px rgba(232,166,60,.22);animation:pulse 2s ease-in-out infinite;}
  @keyframes pulse{0%,100%{opacity:1;}50%{opacity:.4;}}
  h1{
    font-family:var(--display);font-size:clamp(36px,4.8vw,56px);font-weight:700;line-height:1.04;
    letter-spacing:-.02em;margin-bottom:22px;
  }
  h1 .accent{background:linear-gradient(100deg,var(--tape),#F5C878 60%,var(--tape));-webkit-background-clip:text;background-clip:text;color:transparent;}
  .hero-sub{font-size:16.5px;color:var(--muted);max-width:520px;margin-bottom:30px;line-height:1.7;}
  .hero-sub b{color:var(--text);font-weight:600;}
  .cta-row{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:36px;}
  .btn-primary{
    font-family:var(--mono);font-size:13.5px;font-weight:700;
    background:linear-gradient(135deg,#F2BE5E,var(--tape));color:#241a05;padding:15px 26px;border-radius:14px;
    display:inline-flex;align-items:center;gap:8px;transition:filter .2s ease,transform .2s ease,box-shadow .2s ease;
    box-shadow:0 10px 30px -10px rgba(232,166,60,.55);
  }
  .btn-primary:hover{filter:brightness(1.07);transform:translateY(-2px);box-shadow:0 14px 36px -8px rgba(232,166,60,.65);}
  .btn-secondary{
    font-family:var(--mono);font-size:13.5px;font-weight:600;color:var(--text);
    padding:15px 24px;border-radius:14px;transition:all .2s ease;
  }
  .btn-secondary:hover{background:var(--glass-hover);border-color:var(--glass-border-hover);}
  .trust-row{display:flex;gap:22px;flex-wrap:wrap;font-family:var(--mono);font-size:11.5px;color:var(--muted-2);}
  .trust-row b{color:var(--muted);}

  /* ---- hero glass terminal ---- */
  .hero-visual{position:relative;}
  .hero-glow{position:absolute;inset:-60px;background:radial-gradient(circle at 65% 30%,rgba(232,166,60,.28),transparent 60%);filter:blur(20px);z-index:-1;}
  .terminal{padding:22px 22px 18px;animation:floatCard 7s ease-in-out infinite;}
  @keyframes floatCard{0%,100%{transform:translateY(0);}50%{transform:translateY(-10px);}}
  @media (prefers-reduced-motion: reduce){ .terminal{animation:none;} }
  .term-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;}
  .term-title{font-family:var(--mono);font-size:10.5px;letter-spacing:.09em;text-transform:uppercase;color:var(--muted);}
  .term-live{font-family:var(--mono);font-size:10px;color:var(--bull);display:flex;align-items:center;gap:5px;}
  .term-live::before{content:'';width:6px;height:6px;border-radius:50%;background:var(--bull);box-shadow:0 0 8px var(--bull);animation:pulse 2s ease-in-out infinite;}
  .conf-row{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:12px;background:rgba(255,255,255,.03);margin-bottom:7px;transition:background .2s ease;}
  .conf-row:hover{background:rgba(255,255,255,.06);}
  .conf-sym{font-family:var(--mono);font-size:12px;font-weight:600;width:70px;flex-shrink:0;}
  .conf-bars{display:flex;gap:3px;flex:1;}
  .conf-bar{height:14px;border-radius:4px;flex:1;background:rgba(255,255,255,.07);}
  .conf-bar.on{background:var(--bull);box-shadow:0 0 10px rgba(47,216,166,.5);}
  .conf-bar.on.tape{background:var(--tape);box-shadow:0 0 10px rgba(232,166,60,.5);}
  .conf-score{font-family:var(--mono);font-size:11px;font-weight:700;width:34px;text-align:right;flex-shrink:0;}
  .conf-score.high{color:var(--bull);} .conf-score.mid{color:var(--tape);}
  .term-foot{margin-top:10px;padding-top:12px;border-top:1px solid rgba(255,255,255,.07);font-family:var(--mono);font-size:10px;color:var(--muted-2);display:flex;justify-content:space-between;}

  /* ---- ticker ---- */
  .ticker-outer{position:relative;z-index:1;display:flex;justify-content:center;padding:0 16px;margin:36px 0;}
  .ticker-strip{width:100%;max-width:1180px;padding:13px 0;border-radius:999px;overflow:hidden;}
  .ticker-track{display:flex;gap:44px;white-space:nowrap;animation:scroll 34s linear infinite;width:max-content;padding:0 24px;}
  .ticker-outer:hover .ticker-track{animation-play-state:paused;}
  @keyframes scroll{from{transform:translateX(0);}to{transform:translateX(-50%);}}
  .ticker-item{font-family:var(--mono);font-size:12.5px;color:var(--muted);display:flex;align-items:center;gap:8px;}
  .ticker-item b{color:var(--text);}
  .up{color:var(--bull);} .down{color:var(--bear);}
  @media (prefers-reduced-motion: reduce){ .ticker-track{animation:none;} }

  /* ---- section shell ---- */
  section{position:relative;z-index:1;padding:70px 0;}
  .section-head{max-width:640px;margin-bottom:44px;}
  .section-head.center{margin-left:auto;margin-right:auto;text-align:center;}
  h2{font-family:var(--display);font-size:clamp(26px,3vw,34px);font-weight:700;letter-spacing:-.01em;line-height:1.18;margin-bottom:12px;}
  .section-desc{color:var(--muted);font-size:15px;line-height:1.7;}

  /* ---- tool grid ---- */
  .tool-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(270px,1fr));gap:14px;}
  .tool-card{
    padding:24px 22px;transition:transform .3s cubic-bezier(.16,1,.3,1),background .3s ease,border-color .3s ease;
    display:block;text-decoration:none;color:inherit;
  }
  .tool-card:hover{transform:translateY(-5px);background:var(--glass-hover);border-color:var(--glass-border-hover);}
  .tool-card.live{cursor:pointer;}
  .tool-live-badge{
    position:absolute;top:20px;right:20px;font-family:var(--mono);font-size:8.5px;letter-spacing:.04em;
    color:var(--bull);background:rgba(47,216,166,.12);border:1px solid rgba(47,216,166,.3);
    padding:3px 9px;border-radius:999px;white-space:nowrap;
  }
  .tool-icon{
    width:38px;height:38px;border-radius:12px;display:flex;align-items:center;justify-content:center;
    margin-bottom:16px;font-family:var(--mono);font-weight:700;font-size:13px;
  }
  .tool-card h3{font-family:var(--display);font-size:16px;font-weight:600;margin-bottom:8px;}
  .tool-card p{font-size:12.5px;color:var(--muted);line-height:1.6;margin-bottom:12px;}
  .tool-tag{font-family:var(--mono);font-size:9.5px;letter-spacing:.05em;text-transform:uppercase;color:var(--muted-2);}

  /* ---- process ---- */
  .process{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;}
  @media (max-width:820px){ .process{grid-template-columns:repeat(2,1fr);} }
  .process-step{padding:26px 22px;}
  .process-num{font-family:var(--mono);font-size:11px;color:var(--tape);margin-bottom:16px;}
  .process-step h4{font-family:var(--display);font-size:15px;font-weight:600;margin-bottom:9px;}
  .process-step p{font-size:12.5px;color:var(--muted);line-height:1.6;}

  /* ---- deep dive ---- */
  .deepdive{display:grid;grid-template-columns:1fr 1fr;gap:56px;align-items:center;margin-bottom:70px;}
  .deepdive.reverse .dd-visual{order:2;} .deepdive.reverse .dd-text{order:1;}
  @media (max-width:860px){ .deepdive,.deepdive.reverse{grid-template-columns:1fr;} .deepdive.reverse .dd-visual,.deepdive.reverse .dd-text{order:0;} }
  .dd-eyebrow{font-family:var(--mono);font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--tape);margin-bottom:14px;}
  .dd-text h3{font-family:var(--display);font-size:23px;font-weight:700;margin-bottom:15px;letter-spacing:-.01em;}
  .dd-text p{color:var(--muted);font-size:14.5px;line-height:1.7;margin-bottom:16px;}
  .dd-list{list-style:none;}
  .dd-list li{font-size:13.5px;color:var(--muted);padding:6px 0 6px 24px;position:relative;}
  .dd-list li::before{content:'\\2713';position:absolute;left:2px;color:var(--bull);font-family:var(--mono);font-size:12px;}
  .dd-visual{padding:20px;}

  .live-widget-loading,.live-widget-error{font-family:var(--mono);font-size:12.5px;color:var(--muted);padding:30px 10px;text-align:center;}
  .live-widget-error{color:var(--bear);}
  .live-widget-foot{margin-top:10px;padding-top:10px;border-top:1px solid rgba(255,255,255,.07);font-family:var(--mono);font-size:10px;color:var(--muted-2);display:flex;justify-content:space-between;}
  .preview-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;}
  .preview-title{font-family:var(--mono);font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);}
  .preview-live{font-family:var(--mono);font-size:10px;color:var(--bull);display:flex;align-items:center;gap:5px;}
  .preview-live::before{content:'';width:6px;height:6px;border-radius:50%;background:var(--bull);animation:pulse 2s ease-in-out infinite;}

  /* ---- faq ---- */
  .faq-item{padding:24px 0;border-bottom:1px solid rgba(255,255,255,.06);}
  .faq-item:last-child{border-bottom:none;}
  .faq-item h4{font-family:var(--display);font-size:16px;font-weight:600;margin-bottom:9px;}
  .faq-item p{font-size:13.5px;color:var(--muted);line-height:1.7;max-width:680px;}

  /* ---- final cta ---- */
  .final-cta{padding:64px 40px;text-align:center;position:relative;overflow:hidden;}
  .final-cta-glow{position:absolute;inset:-40px;background:radial-gradient(ellipse at 50% 0%,rgba(232,166,60,.16),transparent 65%);pointer-events:none;}
  .final-cta h2{position:relative;margin-bottom:14px;}
  .final-cta p{position:relative;color:var(--muted);font-size:15px;max-width:480px;margin:0 auto 28px;}
  .final-cta .cta-row{justify-content:center;position:relative;margin-bottom:0;}

  footer{position:relative;z-index:1;padding:44px 0 36px;}
  .footer-inner{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;padding-top:28px;border-top:1px solid rgba(255,255,255,.07);}
  .footer-links{display:flex;gap:22px;font-size:12.5px;color:var(--muted);}
  .footer-links a:hover{color:var(--text);}
  .footer-note{font-family:var(--mono);font-size:10.5px;color:var(--muted-2);max-width:560px;line-height:1.6;margin-top:18px;}
`;
const PART_A = `

<div class="mesh"><i></i></div>

<div class="nav-outer">
  <nav id="mainNav" class="glass">
    <a href="/" class="nav-brand">
      <img src="/logo.jpg" alt="Ali Faisal Trades" class="nav-avatar">
      <span class="logo">Ali Faisal Trades</span>
    </a>
    <div class="nav-links">
      <a href="/sector-screener.html">Sector Screener</a>
      <a href="/confluence-dashboard.html">Confluence Dashboard</a>
      <a href="/position-size-calculator.html">Position Size Calculator</a>
    </div>
    <div class="nav-cta-group">
      <a class="nav-telegram" href="https://t.me/alifaisaltrades" target="_blank" rel="noopener">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71l-4.14-3.05-2 1.92c-.23.23-.42.42-.82.42z"/></svg>
        <span>Join Telegram</span>
      </a>
      <a class="nav-cta" href="/login">Open Terminal &rarr;</a>
    </div>
  </nav>
</div>

<header class="hero">
  <div class="wrap hero-grid">
    <div>
      <div class="eyebrow"><i></i>16 Tools &middot; One Login &middot; Zero Guesswork</div>
      <h1>Price shows what happened.<br><span class="accent">Order flow shows who did it.</span></h1>
      <p class="hero-sub">
        Ali Faisal Trades is a <b>16-tool institutional trading suite</b> &mdash; screeners, order flow, volume,
        VWAPs, Fibonacci structure, live signals and a paper-trading bot &mdash; all unified into one
        confluence engine. Log in once, and every tool talks to every other tool.
      </p>
      <div class="cta-row">
        <a class="btn-primary" href="/login">Login &amp; Start Trading &rarr;</a>
        <a class="btn-secondary glass" href="#suite">See all 16 tools</a>
      </div>
      <div class="trust-row">
        <span><b>16</b> tools, one login</span>
        <span><b>14</b> exchanges aggregated</span>
        <span><b>Real-time</b> order book data</span>
      </div>
    </div>

    <div class="hero-visual">
      <div class="hero-glow"></div>
      <div class="terminal glass">
        <div class="term-head">
          <span class="term-title">Confluence Dashboard</span>
          <span class="term-live">Live</span>
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
        <div class="term-foot">
          <span>RSI &middot; Volume &middot; Order Flow &middot; VWAP &middot; Fib</span>
          <span>updated 4s ago</span>
        </div>
      </div>
    </div>
  </div>
</header>

<div class="ticker-outer">
  <div class="ticker-strip glass">
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
</div>

<section id="suite">
  <div class="wrap">
    <div class="section-head reveal">
      <div class="eyebrow"><i></i>The full suite &middot; 16 tools</div>
      <h2>Not sixteen separate tabs. One confluence stack.</h2>
      <p class="section-desc">
        Each tool answers a different question &mdash; where's the crowd, where's the real size, where's
        the level that matters, who's already positioned. Three are open right now, no login needed.
      </p>
    </div>

    <div class="tool-grid">
      <a href="/sector-screener.html" class="tool-card live glass reveal">
        <div class="tool-icon" style="background:rgba(232,166,60,.14);color:var(--tape);">Se</div>
        <span class="tool-live-badge">Try it now</span>
        <h3>Sector Screener</h3>
        <p>Ranks crypto sectors by relative strength so you know which basket the money is actually rotating into.</p>
        <span class="tool-tag">rotation &middot; relative strength</span>
      </a>
      <div class="tool-card glass reveal">
        <div class="tool-icon" style="background:rgba(47,216,166,.14);color:var(--bull);">Tr</div>
        <h3>Trend Screener</h3>
        <p>Price vs EMA200 combined with OBV vs its own EMA &mdash; a dual-confirmation trend scan.</p>
        <span class="tool-tag">dual-confirmation</span>
      </div>
      <div class="tool-card glass reveal">
        <div class="tool-icon" style="background:rgba(156,140,255,.14);color:var(--violet);">Fu</div>
        <h3>Futures Screener</h3>
        <p>Every USDT-M perpetual pair with 1H/4H/12H/24H change side by side in one table.</p>
        <span class="tool-tag">multi-timeframe</span>
      </div>
      <div class="tool-card glass reveal">
        <div class="tool-icon" style="background:rgba(47,216,166,.14);color:var(--bull);">RS</div>
        <h3>RSI Screener</h3>
        <p>Scans the entire market for overbought and oversold conditions, filtered by market cap.</p>
        <span class="tool-tag">momentum &middot; extremes</span>
      </div>
      <div class="tool-card glass reveal">
        <div class="tool-icon" style="background:rgba(156,140,255,.14);color:var(--violet);">Vo</div>
        <h3>Volume Profile</h3>
        <p>Maps where volume actually traded, surfacing nodes that behave like real support/resistance.</p>
        <span class="tool-tag">HVN/LVN &middot; value area</span>
      </div>
      <div class="tool-card glass reveal">
        <div class="tool-icon" style="background:rgba(232,166,60,.14);color:var(--tape);">VW</div>
        <h3>Anchor VWAP</h3>
        <p>Daily, weekly, monthly and quarterly anchored VWAPs in one view with previous-levels table.</p>
        <span class="tool-tag">anchored &middot; multi-timeframe</span>
      </div>
      <div class="tool-card glass reveal">
        <div class="tool-icon" style="background:rgba(255,98,89,.14);color:var(--bear);">CZ</div>
        <h3>Confluence Zones</h3>
        <p>Ranks price zones by how many of 33 independent sources mark the same level.</p>
        <span class="tool-tag">33 sources &middot; ranked</span>
      </div>
      <a href="/confluence-dashboard.html" class="tool-card live glass reveal">
        <div class="tool-icon" style="background:rgba(156,140,255,.14);color:var(--violet);">CD</div>
        <span class="tool-live-badge">Try it now</span>
        <h3>Confluence Dashboard</h3>
        <p>Trend, OBV, RSI and VWAP into one score per symbol across 5 timeframes.</p>
        <span class="tool-tag">aggregated &middot; scored</span>
      </a>
      <div class="tool-card glass reveal">
        <div class="tool-icon" style="background:rgba(47,216,166,.14);color:var(--bull);">Fi</div>
        <h3>Fibonacci Levels</h3>
        <p>Auto-plots retracement and extension levels off the dominant swing, before price gets there.</p>
        <span class="tool-tag">retracement &middot; extension</span>
      </div>
      <div class="tool-card glass reveal">
        <div class="tool-icon" style="background:rgba(47,216,166,.14);color:var(--bull);">RC</div>
        <h3>RSI Checker</h3>
        <p>A fast, single-symbol RSI read across every timeframe at once.</p>
        <span class="tool-tag">single symbol</span>
      </div>
      <div class="tool-card glass reveal">
        <div class="tool-icon" style="background:rgba(156,140,255,.14);color:var(--violet);">CB</div>
        <h3>Cipher B Checker</h3>
        <p>Money-flow and wave-trend signal checker &mdash; a second, independent momentum lens.</p>
        <span class="tool-tag">money flow &middot; wave trend</span>
      </div>
      <div class="tool-card glass reveal">
        <div class="tool-icon" style="background:rgba(255,98,89,.14);color:var(--bear);">OF</div>
        <h3>Order Flow</h3>
        <p>Aggregated depth ladder across 14 exchanges with wall detection and CVD divergence.</p>
        <span class="tool-tag">depth &middot; walls &middot; CVD</span>
      </div>
      <div class="tool-card glass reveal">
        <div class="tool-icon" style="background:rgba(232,166,60,.14);color:var(--tape);">LS</div>
        <h3>Lakhsmi Signals</h3>
        <p>The core AFT signal engine &mdash; the same logic that powers the automated trading bots.</p>
        <span class="tool-tag">core engine</span>
      </div>
      <div class="tool-card glass reveal">
        <div class="tool-icon" style="background:rgba(47,216,166,.14);color:var(--bull);">PT</div>
        <h3>Paper Trading</h3>
        <p>Simulated order tracking against real live market data &mdash; risk nothing until you're ready.</p>
        <span class="tool-tag">simulated &middot; real data</span>
      </div>
      <div class="tool-card glass reveal">
        <div class="tool-icon" style="background:rgba(255,98,89,.14);color:var(--bear);">Al</div>
        <h3>Alerts</h3>
        <p>Price and confluence alerts so you're not staring at charts all day.</p>
        <span class="tool-tag">price &middot; confluence</span>
      </div>
      <a href="/position-size-calculator.html" class="tool-card live glass reveal">
        <div class="tool-icon" style="background:rgba(232,166,60,.14);color:var(--tape);">$</div>
        <span class="tool-live-badge">Try it now</span>
        <h3>Position Size Calculator</h3>
        <p>Portfolio, risk %, stop-loss % in &mdash; exact position size out. Three fields, no guessing.</p>
        <span class="tool-tag">risk-based sizing</span>
      </a>
    </div>
  </div>
</section>

<section id="confluence">
  <div class="wrap">
    <div class="section-head center reveal">
      <div class="eyebrow" style="justify-content:center;"><i></i>How confluence works</div>
      <h2>Four questions, asked in order.</h2>
      <p class="section-desc">A symbol only earns a high confluence score if it survives every stage.</p>
    </div>
    <div class="process">
      <div class="process-step glass reveal">
        <div class="process-num">01 &middot; SCREEN</div>
        <h4>Where's the crowd?</h4>
        <p>Sector and RSI screeners narrow thousands of pairs to a handful showing real strength.</p>
      </div>
      <div class="process-step glass reveal">
        <div class="process-num">02 &middot; CONFIRM</div>
        <h4>Is size actually there?</h4>
        <p>Volume Profile and Order Flow check whether real size backs the move.</p>
      </div>
      <div class="process-step glass reveal">
        <div class="process-num">03 &middot; LOCATE</div>
        <h4>Where's the level?</h4>
        <p>VWAPs and Fibonacci structure pinpoint the exact zone that should react.</p>
      </div>
      <div class="process-step glass reveal">
        <div class="process-num">04 &middot; SCORE</div>
        <h4>How many agree?</h4>
        <p>The Confluence Dashboard tallies every independent yes into one live score.</p>
      </div>
    </div>
  </div>
</section>
`;
const PART_C = `

<section id="faq">
  <div class="wrap" style="max-width:820px;">
    <div class="section-head reveal">
      <div class="eyebrow"><i></i>Frequently asked</div>
      <h2>What the suite is built to do.</h2>
    </div>
    <div class="glass" style="padding:8px 28px;">
      <div class="faq-item">
        <h4>Do I need to use all 16 tools together?</h4>
        <p>No. Each tool works standalone, but the Confluence Dashboard is what turns separate signals into one visible score &mdash; that's where the suite compounds.</p>
      </div>
      <div class="faq-item">
        <h4>What counts as a high-confluence setup?</h4>
        <p>A symbol where multiple independent tools &mdash; screener, volume, order flow, level structure &mdash; agree at the same zone, at the same time.</p>
      </div>
      <div class="faq-item">
        <h4>Is this financial advice or a signal service?</h4>
        <p>No. Ali Faisal Trades is market-structure and order-flow analytics &mdash; decision support, not a buy/sell call.</p>
      </div>
      <div class="faq-item">
        <h4>Which exchanges does the data come from?</h4>
        <p>Order flow and depth data is aggregated across 14 exchanges; screeners and levels are computed on real market data.</p>
      </div>
    </div>
  </div>
</section>

<section>
  <div class="wrap">
    <div class="final-cta glass reveal">
      <div class="final-cta-glow"></div>
      <h2>16 tools. One login. Trading made easy.</h2>
      <p>Stop reading eight tabs to make one decision. Log in once and every tool works together.</p>
      <div class="cta-row">
        <a class="btn-primary" href="/login">Login &amp; Start Trading &rarr;</a>
      </div>
    </div>
  </div>
</section>

<footer>
  <div class="wrap">
    <div class="footer-inner">
      <span class="logo">Ali Faisal Trades</span>
      <div class="footer-links">
        <a href="#suite">Suite</a>
        <a href="#confluence">How it works</a>
        <a href="#faq">FAQ</a>
      </div>
    </div>
    <p class="footer-note">
      Educational and informational only. Ali Faisal Trades provides market-structure and order-flow analytics, not financial advice.
      Crypto markets are volatile and leveraged trading carries substantial risk of loss. &copy; 2026 Ali Faisal Trades.
    </p>
  </div>
</footer>

<script>
  // Scroll-reveal
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  // Nav glass intensifies on scroll
  const nav = document.getElementById('mainNav');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  }, { passive: true });
</script>

`;

export default function Home() {
  useEffect(() => {
    document.title = 'Ali Faisal Trades \u00b7 16 Institutional Trading Tools \u00b7 One Login';

    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

    const nav = document.getElementById('mainNav');
    const onScroll = () => {
      if (!nav) return;
      if (window.scrollY > 40) nav.classList.add('scrolled');
      else nav.classList.remove('scrolled');
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      io.disconnect();
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <>
      <style>{HOMEPAGE_CSS}</style>
      <div dangerouslySetInnerHTML={{ __html: PART_A }} />

      <section>
        <div className="wrap">
          <div id="orderflow" className="deepdive">
            <div className="dd-text reveal">
              <div className="dd-eyebrow">Order Flow</div>
              <h3>See where size is actually resting, not where a line on a chart guesses it is.</h3>
              <p>An aggregated depth ladder across 14 exchanges, with local-neighborhood wall detection and a live imbalance read.</p>
              <ul className="dd-list">
                <li>Wall age tracking &mdash; is this size fresh or stale</li>
                <li>CVD divergence detector</li>
                <li>Liquidation cluster binning</li>
                <li>14-exchange aggregated depth</li>
              </ul>
            </div>
            <div className="dd-visual glass reveal">
              <div className="preview-head">
                <span className="preview-title">BTCUSDT &middot; Depth Ladder</span>
                <span className="preview-live">Live</span>
              </div>
              <LiveOrderFlow />
            </div>
          </div>

          <div id="rsiscreener" className="deepdive reverse">
            <div className="dd-visual glass reveal">
              <div className="preview-head">
                <span className="preview-title">RSI Screener &middot; 1H</span>
                <span className="preview-live">Live</span>
              </div>
              <LiveRsiScreener />
            </div>
            <div className="dd-text reveal">
              <div className="dd-eyebrow">RSI Screener</div>
              <h3>Scan the whole market for extremes in the time it takes to read four rows.</h3>
              <p>Filtered by a minimum market cap floor, refreshed continuously &mdash; so you spend time deciding, not scrolling.</p>
              <ul className="dd-list">
                <li>Overbought / oversold across multiple timeframes</li>
                <li>Market-cap floor filters out illiquid noise</li>
                <li>One-click into full confluence view per symbol</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <div dangerouslySetInnerHTML={{ __html: PART_C }} />
    </>
  );
}
