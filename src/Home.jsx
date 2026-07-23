import { useEffect, useState } from 'react';
import LiveOrderFlow from './LiveOrderFlow';
import LiveRsiScreener from './LiveRsiScreener';
import ToolShowcase from './ToolShowcase';

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
  .nav-outer{position:sticky;top:0;z-index:60;background:var(--bg);border-bottom:1px solid var(--border);}
  nav{
    max-width:1400px;margin:0 auto;width:100%;display:flex;align-items:center;justify-content:space-between;
    gap:24px;padding:16px 32px;position:relative;
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
  .nav-links{display:flex;align-items:center;justify-content:flex-end;gap:28px;flex:1;flex-wrap:wrap;}
  .nav-links a{font-family:var(--display);font-size:14px;color:var(--muted);text-decoration:none;white-space:nowrap;transition:color .15s ease;-webkit-tap-highlight-color:transparent;touch-action:manipulation;}
  .nav-links a:hover{color:var(--text);}
  .nav-cta-group{display:flex;align-items:center;gap:16px;flex-shrink:0;}
  .nav-telegram{
    font-family:var(--display);font-size:13.5px;font-weight:600;color:#8fd4f5;
    border:1px solid rgba(94,196,240,.3);padding:8px 16px;border-radius:6px;
    background:rgba(94,196,240,.06);display:flex;align-items:center;gap:6px;
    text-decoration:none;white-space:nowrap;transition:all .2s ease;
  }
  .nav-telegram:hover{border-color:rgba(94,196,240,.6);background:rgba(94,196,240,.12);}
  .nav-telegram svg{width:14px;height:14px;flex-shrink:0;}
  .nav-cta{
    font-family:var(--display);font-size:13px;font-weight:700;letter-spacing:.01em;text-decoration:none;
    background:linear-gradient(135deg,#F2BE5E,var(--tape));color:#241a05;padding:9px 18px;border-radius:6px;
    white-space:nowrap;transition:filter .2s ease,transform .2s ease;box-shadow:0 6px 20px -8px rgba(232,166,60,.6);
  }
  .nav-cta:hover{filter:brightness(1.08);transform:translateY(-1px);}
  .nav-toggle{
    display:none;background:transparent;border:1px solid var(--border);color:var(--text);border-radius:8px;
    min-width:44px;min-height:44px;padding:0;cursor:pointer;align-items:center;justify-content:center;
    -webkit-tap-highlight-color:transparent;touch-action:manipulation;flex-shrink:0;
  }
  @media (max-width:860px){
    .nav-toggle{display:flex;}
    .nav-links{
      display:none;position:absolute;top:100%;left:0;right:0;z-index:70;
      flex-direction:column;align-items:stretch;gap:0;
      background:var(--bg);border-bottom:1px solid var(--border);
      padding:8px 20px 16px;
    }
    .nav-links.open{display:flex;}
    .nav-links a{padding:12px 0;border-bottom:1px solid var(--border);}
    .nav-links a:last-child{border-bottom:none;}
    nav{padding:14px 16px;gap:10px;}
    .nav-cta-group{gap:8px;}
    .nav-telegram{padding:8px 10px;}
    .nav-cta{padding:8px 12px;font-size:12px;}
  }
  @media (max-width:480px){
    .logo{font-size:13px;}
    .nav-telegram span{display:none;}
    .nav-telegram{padding:8px;}
    .nav-telegram svg{width:16px;height:16px;}
    .nav-cta{padding:8px 10px;font-size:11.5px;}
  }

  /* ---- hero ---- */
  .hero{position:relative;z-index:1;padding:80px 0 40px;}
  .hero-grid{display:grid;grid-template-columns:1.05fr .95fr;gap:56px;align-items:center;}
  @media (max-width:900px){ .hero-grid{grid-template-columns:1fr;gap:36px;} .hero-visual{order:-1;} }
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
  .tool-icon.c-tape{background:rgba(232,166,60,.14);color:var(--tape);}
  .tool-icon.c-bull{background:rgba(47,216,166,.14);color:var(--bull);}
  .tool-icon.c-bear{background:rgba(255,98,89,.14);color:var(--bear);}
  .tool-icon.c-violet{background:rgba(156,140,255,.14);color:var(--violet);}

  /* Trust signals bar */
  .trust-bar{display:flex;flex-wrap:wrap;justify-content:center;gap:12px;padding:22px 0 46px;}
  .trust-pill{
    font-family:var(--mono);font-size:12.5px;color:var(--muted);white-space:nowrap;
    border:1px solid rgba(255,255,255,.08);padding:9px 18px;border-radius:999px;
    background:rgba(255,255,255,.02);
  }
  .trust-pill b{color:var(--tape);}

  /* Before/After comparison */
  .ba-grid{display:grid;grid-template-columns:1fr auto 1fr;gap:24px;align-items:center;margin-top:36px;}
  .ba-col{padding:28px 30px;border-radius:16px;}
  .ba-before{border:1px solid rgba(255,98,89,.18);background:rgba(255,98,89,.03);}
  .ba-col-head{font-family:var(--mono);font-size:11px;font-weight:700;letter-spacing:.08em;color:var(--muted);margin-bottom:16px;}
  .ba-col-head.accent{color:var(--tape);}
  .ba-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:14px;}
  .ba-list li{position:relative;padding-left:22px;font-size:14px;color:var(--muted);line-height:1.5;}
  .ba-before .ba-list li::before{content:'\\2715';position:absolute;left:0;top:1px;color:var(--bear);font-size:12px;font-weight:700;}
  .ba-after .ba-list li::before{content:'\\2713';position:absolute;left:0;top:1px;color:var(--bull);font-size:12px;font-weight:700;}
  .ba-after .ba-list li b{color:var(--text);}
  .ba-arrow{font-size:28px;color:var(--tape);font-weight:700;}
  @media (max-width:820px){
    .ba-grid{grid-template-columns:1fr;}
    .ba-arrow{display:none;}
  }

  /* Interactive Tool Showcase */
  .showcase{display:grid;grid-template-columns:280px 1fr;gap:24px;margin-top:20px;}
  .showcase-headline{font-size:clamp(24px,3.4vw,34px);}
  .showcase-headline .accent{color:var(--tape);}
  .showcase-tabs{display:flex;flex-direction:column;gap:4px;max-height:520px;overflow-y:auto;padding-right:8px;}
  .showcase-tabs::-webkit-scrollbar{width:6px;}
  .showcase-tabs::-webkit-scrollbar-track{background:transparent;margin:4px 0;}
  .showcase-tabs::-webkit-scrollbar-thumb{background:rgba(232,166,60,.25);border-radius:99px;}
  .showcase-tabs::-webkit-scrollbar-thumb:hover{background:rgba(232,166,60,.5);}
  .showcase-tabs{scrollbar-width:thin;scrollbar-color:rgba(232,166,60,.35) transparent;}
  .showcase-tab{
    display:flex;align-items:center;gap:10px;text-align:left;background:transparent;border:none;
    color:var(--muted);font-family:var(--sans, inherit);font-size:13.5px;padding:10px 12px;border-radius:10px;
    cursor:pointer;transition:all .15s ease;
  }
  .showcase-tab:hover{background:rgba(255,255,255,.04);color:var(--text);}
  .showcase-tab.active{background:rgba(232,166,60,.1);color:var(--tape);font-weight:600;}
  .showcase-tab-icon{
    width:26px;height:26px;border-radius:8px;display:flex;align-items:center;justify-content:center;
    font-family:var(--mono);font-weight:700;font-size:10.5px;flex-shrink:0;
  }
  .showcase-panel{display:grid;grid-template-columns:1.1fr 1fr;gap:0;padding:0;border-radius:20px;overflow:hidden;align-items:stretch;}
  .showcase-panel-main{display:flex;gap:20px;padding:36px;align-items:flex-start;}
  .showcase-panel-icon .tool-icon{width:52px;height:52px;border-radius:14px;font-size:17px;margin-bottom:0;}
  .showcase-panel-body{flex:1;}
  .showcase-panel-tag{font-family:var(--mono);font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin-bottom:10px;}
  .showcase-panel-body h3{font-family:var(--display);font-size:21px;font-weight:700;margin:0 0 12px;line-height:1.35;}
  .showcase-panel-body p{font-size:14px;color:var(--muted);line-height:1.6;margin:0 0 20px;}
  .showcase-panel-demo{
    background:rgba(255,255,255,.02);border-left:1px solid rgba(255,255,255,.06);
    padding:28px;display:flex;flex-direction:column;justify-content:center;min-height:220px;
  }
  .demo-live-tag{
    display:inline-flex;align-items:center;gap:6px;font-family:var(--mono);font-size:10px;font-weight:700;
    letter-spacing:.06em;text-transform:uppercase;color:var(--bull);margin-bottom:16px;align-self:flex-start;
  }
  .demo-live-tag i{width:6px;height:6px;border-radius:50%;background:var(--bull);animation:ddLivePulse 1.6s ease-in-out infinite;}

  /* Ranked-bars demo */
  .demo-ranked{display:flex;flex-direction:column;gap:10px;}
  .demo-ranked-row{display:grid;grid-template-columns:20px 60px 1fr 28px;align-items:center;gap:8px;font-family:var(--mono);font-size:11.5px;}
  .demo-ranked-rank{color:var(--muted-2, var(--muted));}
  .demo-ranked-label{color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .demo-ranked-track{height:6px;border-radius:3px;background:rgba(255,255,255,.06);overflow:hidden;}
  .demo-ranked-fill{height:100%;background:linear-gradient(90deg,var(--tape),#F2BE5E);border-radius:3px;}
  .demo-ranked-val{color:var(--muted);text-align:right;}

  /* Levels/candle demo */
  .demo-levels{position:relative;height:140px;}
  .demo-levels-line{position:absolute;left:0;right:0;height:1px;background:rgba(232,166,60,.35);border-top:1px dashed rgba(232,166,60,.4);}
  .demo-line-1{top:30%;}
  .demo-line-2{top:62%;}
  .demo-levels-candles{position:absolute;inset:0;display:flex;align-items:flex-end;gap:5px;}
  .demo-candle{flex:1;display:flex;align-items:flex-end;height:100%;}
  .demo-candle-body{width:100%;border-radius:2px 2px 0 0;height:100%;}
  .demo-candle-body.up{background:rgba(47,216,166,.55);}
  .demo-candle-body.down{background:rgba(255,98,89,.55);}

  /* Score demo */
  .demo-score{display:flex;flex-direction:column;gap:12px;}
  .demo-score-row{display:grid;grid-template-columns:88px 1fr 40px;align-items:center;gap:10px;font-family:var(--mono);font-size:11.5px;}
  .demo-score-sym{color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .demo-score-track{height:8px;border-radius:4px;background:rgba(255,255,255,.06);overflow:hidden;}
  .demo-score-fill{height:100%;background:linear-gradient(90deg,var(--bull),#59f0c2);border-radius:4px;}
  .demo-score-label{color:var(--muted);text-align:right;}

  /* Order ladder demo */
  .demo-ladder{display:flex;flex-direction:column;gap:2px;font-family:var(--mono);font-size:11.5px;}
  .demo-ladder-row{display:flex;justify-content:space-between;padding:3px 6px;border-radius:4px;}
  .demo-ladder-row.ask{color:var(--bear);background:rgba(255,98,89,.06);}
  .demo-ladder-row.bid{color:var(--bull);background:rgba(47,216,166,.06);}
  .demo-ladder-mid{text-align:center;color:var(--text);font-weight:700;padding:6px 0;font-size:12.5px;}

  /* Paper trading badge demo */
  .demo-badge{display:flex;flex-direction:column;align-items:flex-start;gap:8px;}
  .demo-badge-pill{font-family:var(--mono);font-size:10.5px;font-weight:700;letter-spacing:.06em;color:var(--bull);background:rgba(47,216,166,.12);padding:5px 12px;border-radius:999px;}
  .demo-badge-pnl{font-family:var(--display);font-size:28px;font-weight:700;color:var(--bull);}
  .demo-badge-sub{font-family:var(--mono);font-size:11px;color:var(--muted);}

  /* Alerts bell demo */
  .demo-bell{display:flex;flex-direction:column;align-items:center;gap:16px;text-align:center;}
  .demo-bell-icon-wrap{position:relative;width:56px;height:56px;display:flex;align-items:center;justify-content:center;color:var(--tape);}
  .demo-bell-ring{position:absolute;border-radius:50%;border:1px solid rgba(232,166,60,.35);animation:bellPulse 2s ease-out infinite;}
  .demo-bell-ring.r1{inset:0;}
  .demo-bell-ring.r2{inset:0;animation-delay:.6s;}
  @keyframes bellPulse{0%{transform:scale(.6);opacity:1;}100%{transform:scale(1.6);opacity:0;}}
  .demo-bell-toast{font-family:var(--mono);font-size:11px;color:var(--muted);background:rgba(255,255,255,.04);padding:8px 12px;border-radius:8px;max-width:220px;}

  /* Position size calculator demo */
  .demo-calc{display:flex;flex-direction:column;gap:6px;font-family:var(--mono);font-size:12px;}
  .demo-calc-row{display:flex;justify-content:space-between;color:var(--muted);padding:2px 0;}
  .demo-calc-row b{color:var(--text);}
  .demo-calc-arrow{text-align:center;color:var(--tape);font-size:14px;margin:2px 0;}
  .demo-calc-result{display:flex;justify-content:space-between;background:rgba(232,166,60,.08);border:1px solid rgba(232,166,60,.25);border-radius:8px;padding:8px 12px;margin-top:2px;}
  .demo-calc-result b{color:var(--tape);font-size:14px;}

  @media (max-width:820px){
    .showcase{grid-template-columns:1fr;}
    .showcase-tabs{
      flex-direction:row;flex-wrap:nowrap;max-height:none;overflow-y:visible;
      overflow-x:auto;-webkit-overflow-scrolling:touch;padding-bottom:6px;gap:8px;
    }
    .showcase-tab{flex-shrink:0;white-space:nowrap;padding:9px 14px;}
    .showcase-panel{grid-template-columns:1fr;}
    .showcase-panel-main{flex-direction:column;padding:20px;}
    .showcase-panel-demo{border-left:none;border-top:1px solid rgba(255,255,255,.06);padding:20px;}
  }

  /* Sticky floating CTA */
  .sticky-cta{
    position:fixed;bottom:24px;right:24px;z-index:80;
    opacity:0;transform:translateY(20px) scale(.9);pointer-events:none;
    transition:opacity .25s ease,transform .25s ease;
  }
  .sticky-cta.show{opacity:1;transform:translateY(0) scale(1);pointer-events:auto;}
  .sticky-cta a{
    display:flex;align-items:center;gap:8px;font-family:var(--mono);font-weight:700;font-size:13px;
    background:linear-gradient(135deg,#F2BE5E,var(--tape));color:#241a05;padding:14px 22px;border-radius:999px;
    text-decoration:none;white-space:nowrap;box-shadow:0 10px 32px -8px rgba(232,166,60,.7);
    animation:stickyCtaPulse 2.4s ease-in-out infinite;
  }
  @keyframes stickyCtaPulse{0%,100%{box-shadow:0 10px 32px -8px rgba(232,166,60,.7);}50%{box-shadow:0 10px 40px -4px rgba(232,166,60,.9);}}
  @media (max-width:600px){ .sticky-cta{bottom:16px;right:16px;} .sticky-cta a{padding:12px 18px;font-size:12px;} }
  @media (max-width:420px){
    .sticky-cta a{width:52px;height:52px;padding:0;border-radius:50%;justify-content:center;}
    .sticky-cta a span{display:none;}
  }

  .sticky-telegram{
    position:fixed;bottom:24px;left:24px;z-index:80;
    opacity:0;transform:translateY(20px) scale(.9);pointer-events:none;
    transition:opacity .25s ease,transform .25s ease;
  }
  .sticky-telegram.show{opacity:1;transform:translateY(0) scale(1);pointer-events:auto;}
  .sticky-telegram a{
    display:flex;align-items:center;gap:8px;font-family:var(--mono);font-weight:700;font-size:13px;
    background:rgba(10,12,18,.9);color:#8fd4f5;padding:14px 22px;border-radius:999px;
    border:1px solid rgba(94,196,240,.4);
    text-decoration:none;white-space:nowrap;box-shadow:0 10px 32px -8px rgba(94,196,240,.5);
    backdrop-filter:blur(12px) saturate(160%);-webkit-backdrop-filter:blur(12px) saturate(160%);
    transition:filter .2s ease,transform .2s ease;
  }
  .sticky-telegram a:hover{filter:brightness(1.15);transform:translateY(-1px);}
  .sticky-telegram svg{width:16px;height:16px;flex-shrink:0;}
  @media (max-width:600px){ .sticky-telegram{bottom:16px;left:16px;} .sticky-telegram a{padding:12px 18px;font-size:12px;} }
  @media (max-width:420px){
    .sticky-telegram a{width:52px;height:52px;padding:0;border-radius:50%;justify-content:center;}
    .sticky-telegram a span{display:none;}
  }

  .tool-card h3{font-family:var(--display);font-size:16px;font-weight:600;margin-bottom:8px;}
  .tool-card p{font-size:12.5px;color:var(--muted);line-height:1.6;margin-bottom:12px;}
  .tool-tag{font-family:var(--mono);font-size:9.5px;letter-spacing:.05em;text-transform:uppercase;color:var(--muted-2);}

  /* ---- process ---- */
  .process{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;}
  @media (max-width:820px){ .process{grid-template-columns:repeat(2,1fr);} }
  @media (max-width:480px){ .process{grid-template-columns:1fr;} }
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
  <nav id="mainNav">
    <a href="/" class="nav-brand">
      <img src="/logo.jpg" alt="Ali Faisal Trades" class="nav-avatar">
      <span class="logo">Ali Faisal Trades</span>
    </a>
    <button class="nav-toggle" id="navToggle" aria-label="Menu">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
    </button>
    <div class="nav-links" id="navLinks">
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

<div class="wrap">
  <div class="trust-bar reveal">
    <div class="trust-pill"><b>NO API KEY</b> needed to try 3 tools free</div>
    <div class="trust-pill"><b>NON-CUSTODIAL</b> &mdash; your funds stay on your exchange</div>
    <div class="trust-pill"><b>14 EXCHANGES</b> aggregated in real time</div>
    <div class="trust-pill"><b>EDUCATIONAL</b> analytics, not a signal service</div>
  </div>
</div>

<section id="before-after">
  <div class="wrap">
    <div class="section-head center reveal">
      <div class="eyebrow" style="justify-content:center;"><i></i>The old way vs. the AFT way</div>
      <h2>Stop trading with eight tabs open.</h2>
    </div>
    <div class="ba-grid">
      <div class="ba-col ba-before reveal">
        <div class="ba-col-head">WITHOUT AFT TOOLS</div>
        <ul class="ba-list">
          <li>Screener in one tab, order book in another, TradingView in a third</li>
          <li>Manually cross-checking RSI, volume and VWAP before every entry</li>
          <li>Missing the setup because you were still switching tabs</li>
          <li>No single number telling you how strong a setup actually is</li>
        </ul>
      </div>
      <div class="ba-arrow">&rarr;</div>
      <div class="ba-col ba-after glass reveal">
        <div class="ba-col-head accent">WITH AFT TOOLS</div>
        <ul class="ba-list">
          <li><b>One login</b> &mdash; every tool already talks to every other tool</li>
          <li><b>One score</b> &mdash; Confluence Dashboard tallies every signal live</li>
          <li><b>Zero tab-switching</b> &mdash; screen, confirm, locate, score, done</li>
          <li><b>Real-time</b> &mdash; 14 exchanges aggregated, updated every few seconds</li>
        </ul>
      </div>
    </div>
  </div>
</section>

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
      <h2>Every serious trader eventually builds this stack. Skip the years it takes.</h2>
      <p>16 tools, 14 exchanges, one login &mdash; ready right now. Free tools need no signup at all.</p>
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
        <a href="/about">About</a>
        <a href="/disclaimer">Disclaimer</a>
        <a href="/privacy-policy">Privacy Policy</a>
        <a href="/contact">Contact</a>
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
  const [showStickyCta, setShowStickyCta] = useState(false);

  useEffect(() => {
    document.title = 'Ali Faisal Trades \u00b7 16 Institutional Trading Tools \u00b7 One Login';

    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

    const nav = document.getElementById('mainNav');
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        if (nav) {
          if (window.scrollY > 40) nav.classList.add('scrolled');
          else nav.classList.remove('scrolled');
        }
        setShowStickyCta(window.scrollY > 700);
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    const navToggle = document.getElementById('navToggle');
    const navMobileMenu = document.getElementById('navLinks');
    const onToggleClick = () => { if (navMobileMenu) navMobileMenu.classList.toggle('open'); };
    if (navToggle) navToggle.addEventListener('click', onToggleClick);

    return () => {
      io.disconnect();
      window.removeEventListener('scroll', onScroll);
      if (navToggle) navToggle.removeEventListener('click', onToggleClick);
    };
  }, []);

  return (
    <>
      <style>{HOMEPAGE_CSS}</style>
      <div dangerouslySetInnerHTML={{ __html: PART_A }} />

      <section>
        <div className="wrap">
          <div className="section-head center reveal">
            <div className="eyebrow" style={{ justifyContent: 'center' }}><i></i>Pick a tool. Watch it work.</div>
            <h2 className="showcase-headline">16 tools. <span className="accent">Zero</span> guesswork.<br />Click through every single one.</h2>
          </div>
          <ToolShowcase />
        </div>
      </section>

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

      <div className={`sticky-cta ${showStickyCta ? 'show' : ''}`}>
        <a href="/login">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          <span>Start Trading</span>
        </a>
      </div>
      <div className={`sticky-telegram ${showStickyCta ? 'show' : ''}`}>
        <a href="https://t.me/alifaisaltrades" target="_blank" rel="noopener">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71l-4.14-3.05-2 1.92c-.23.23-.42.42-.82.42z" /></svg>
          <span>Join Telegram</span>
        </a>
      </div>
    </>
  );
}
