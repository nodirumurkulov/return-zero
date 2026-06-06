"use client";

import { useEffect } from "react";

// Self-contained Hugo marketing landing. The design ships its own nav, footer,
// styles and micro-interactions, so it renders at "/" outside the (marketing)
// chrome. Markup + CSS are embedded verbatim from the approved design (fonts
// pulled in via @import); the scroll/reveal/waitlist behaviour is reimplemented
// in a single effect.

const LANDING_CSS = `@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..800&family=Geist:wght@400;500;600;700;800&family=Geist+Mono:wght@400;500;600&display=swap');
:root {
    /* Brand — sampled from the blue Hugo cat */
    --brand-700: #1356d4;
    --brand-600: #1f6ff5;
    --brand-500: #4f8bf7;
    --brand-200: #c4daff;
    --brand-100: #e1ecff;
    --brand-50:  #f0f5ff;

    /* Neutrals (zinc) */
    --ink:      #18181b;
    --ink-2:    #3f3f46;
    --muted:    #71717a;
    --line:     #e7e7ea;
    --line-2:   #f1f1f3;
    --bg:       #ffffff;
    --bg-soft:  #fafafb;

    /* Severity */
    --sev-critical: #dc2626;
    --sev-high:     #ea580c;
    --sev-amber:    #b45309;
    --sev-green:    #15803d;
    --sev-crit-bg:  #fef2f2;
    --sev-crit-bd:  #fecdcd;

    --teal: #2c8aa3;

    --radius: 16px;
    --shadow-sm: 0 1px 2px rgba(16,24,40,.06), 0 1px 3px rgba(16,24,40,.06);
    --shadow-md: 0 8px 24px -10px rgba(16,24,40,.18), 0 2px 6px -2px rgba(16,24,40,.08);
    --shadow-lg: 0 30px 60px -22px rgba(20,40,90,.30), 0 12px 28px -12px rgba(16,24,40,.16);
    --shadow-blue: 0 18px 40px -16px rgba(31,111,245,.45);

    --maxw: 1200px;
  }

  * { box-sizing: border-box; }
  html { scroll-behavior: smooth; }
  body {
    margin: 0;
    font-family: "Geist", system-ui, sans-serif;
    color: var(--ink);
    background: var(--bg);
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
    line-height: 1.5;
  }
  h1, h2, h3 { margin: 0; letter-spacing: -0.03em; line-height: 1.04; }
  p { margin: 0; }
  a { color: inherit; text-decoration: none; }
  .mono { font-family: "Geist Mono", ui-monospace, monospace; }

  .wrap { max-width: var(--maxw); margin: 0 auto; padding: 0 28px; }
  section { scroll-margin-top: 84px; }

  .eyebrow {
    display: inline-flex; align-items: center; gap: 8px;
    font-family: "Geist Mono", monospace;
    font-size: 12px; font-weight: 500; letter-spacing: 0.14em; text-transform: uppercase;
    color: var(--brand-700);
    white-space: nowrap;
  }
  .eyebrow::before {
    content: ""; width: 7px; height: 7px; border-radius: 50%;
    background: var(--brand-600); box-shadow: 0 0 0 4px var(--brand-100);
  }

  /* ---------- Buttons ---------- */
  .btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 9px;
    font-family: inherit; font-size: 15px; font-weight: 600;
    padding: 12px 20px; border-radius: 11px; cursor: pointer;
    border: 1px solid transparent; transition: transform .15s ease, box-shadow .2s ease, background .2s ease;
    white-space: nowrap;
  }
  .btn-primary {
    background: var(--brand-600); color: #fff; box-shadow: var(--shadow-blue);
  }
  .btn-primary:hover { background: var(--brand-700); transform: translateY(-1px); }
  .btn-ghost {
    background: #fff; color: var(--ink); border-color: var(--line);
  }
  .btn-ghost:hover { border-color: var(--brand-200); background: var(--brand-50); transform: translateY(-1px); }
  .btn-lg { font-size: 16px; padding: 15px 26px; border-radius: 12px; }
  .arrow { transition: transform .15s ease; }
  .btn:hover .arrow { transform: translateX(3px); }

  /* ---------- Nav ---------- */
  header.nav {
    position: sticky; top: 0; z-index: 50;
    background: rgba(255,255,255,.82);
    backdrop-filter: saturate(180%) blur(14px);
    border-bottom: 1px solid transparent;
    transition: border-color .2s ease, box-shadow .2s ease;
  }
  header.nav.scrolled { border-color: var(--line); box-shadow: 0 1px 0 rgba(16,24,40,.02); }
  .nav-inner { display: flex; align-items: center; gap: 28px; height: 68px; }
  .brand { display: flex; align-items: center; gap: 11px; }
  .brand img { width: 34px; height: 34px; border-radius: 9px; box-shadow: var(--shadow-sm); }
  .brand .bt { font-family: "Bricolage Grotesque", "Geist", sans-serif; font-size: 18px; font-weight: 700; letter-spacing: -0.02em; }
  .brand .bs { font-size: 11px; color: var(--muted); font-family: "Geist Mono", monospace; letter-spacing: .02em; margin-top: -2px; }
  .nav-links { display: flex; align-items: center; gap: 4px; margin: 0 auto; }
  .nav-links a {
    font-size: 14.5px; font-weight: 500; color: var(--ink-2);
    padding: 8px 14px; border-radius: 9px; transition: background .15s, color .15s;
  }
  .nav-links a:hover { color: var(--ink); background: var(--line-2); }
  .nav-cta { display: flex; align-items: center; gap: 8px; }
  .nav-signin { font-size: 14.5px; font-weight: 600; color: var(--ink-2); padding: 10px 14px; border-radius: 9px; }
  .nav-signin:hover { color: var(--ink); }

  /* ---------- Hero ---------- */
  .hero {
    position: relative; overflow: hidden;
    padding: 78px 0 70px;
    background:
      radial-gradient(1100px 520px at 78% -8%, var(--brand-50) 0%, rgba(240,245,255,0) 60%),
      radial-gradient(800px 420px at 6% 12%, #f6f9ff 0%, rgba(246,249,255,0) 55%);
  }
  .hero::before {
    content: ""; position: absolute; inset: 0;
    background-image: linear-gradient(var(--line-2) 1px, transparent 1px), linear-gradient(90deg, var(--line-2) 1px, transparent 1px);
    background-size: 56px 56px;
    -webkit-mask-image: radial-gradient(900px 520px at 70% 0%, #000 0%, transparent 72%);
    mask-image: radial-gradient(900px 520px at 70% 0%, #000 0%, transparent 72%);
    opacity: .7; pointer-events: none;
  }
  .hero-grid {
    position: relative;
    display: grid; grid-template-columns: 1.05fr 0.95fr; gap: 56px; align-items: center;
  }
  .hero-tag {
    display: inline-flex; align-items: center; gap: 9px;
    background: #fff; border: 1px solid var(--brand-200);
    color: var(--brand-700); font-size: 13px; font-weight: 600;
    padding: 7px 14px 7px 10px; border-radius: 999px; box-shadow: var(--shadow-sm);
  }
  .hero-tag .pip { background: var(--sev-crit-bg); color: var(--sev-critical); border: 1px solid var(--sev-crit-bd);
    font-family: "Geist Mono", monospace; font-size: 11px; font-weight: 600; padding: 2px 7px; border-radius: 999px; letter-spacing: .02em; }
  h1.hero-title {
    font-family: "Bricolage Grotesque", "Geist", sans-serif;
    margin-top: 22px;
    font-size: clamp(44px, 5.4vw, 74px);
    font-weight: 700;
    letter-spacing: -0.045em;
  }
  h1.hero-title .grad {
    background: linear-gradient(95deg, var(--brand-600), #6aa0ff);
    -webkit-background-clip: text; background-clip: text; color: transparent;
  }
  .hero-sub {
    margin-top: 22px; max-width: 540px;
    font-size: 19px; line-height: 1.55; color: var(--ink-2);
  }
  .hero-actions { margin-top: 30px; display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
  .hero-note { margin-top: 16px; font-size: 13.5px; color: var(--muted); display: flex; align-items: center; gap: 8px; }
  .hero-note .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--sev-green); box-shadow: 0 0 0 3px #dcfce7; }

  /* lighter-blue clickable pillar cards */
  .pillars { margin-top: 38px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; max-width: 560px; }
  .pillar {
    display: block; text-align: left; cursor: pointer;
    background: var(--brand-50); border: 1px solid var(--brand-100);
    border-radius: 14px; padding: 16px 16px 15px;
    transition: transform .16s ease, box-shadow .2s ease, border-color .2s ease, background .2s ease;
  }
  .pillar:hover { transform: translateY(-3px); border-color: var(--brand-200); background: #fff; box-shadow: var(--shadow-md); }
  .pillar .pn { font-family: "Geist Mono", monospace; font-size: 11px; color: var(--brand-600); font-weight: 600; }
  .pillar .pi { width: 30px; height: 30px; margin-top: 8px; display: grid; place-items: center; border-radius: 9px; background: #fff; border: 1px solid var(--brand-100); color: var(--brand-600); }
  .pillar h4 { margin: 12px 0 3px; font-size: 16px; font-weight: 650; letter-spacing: -0.02em; }
  .pillar p { font-size: 13px; color: var(--muted); line-height: 1.4; }
  .pillar .more { margin-top: 10px; font-size: 12.5px; font-weight: 600; color: var(--brand-700); display: inline-flex; align-items: center; gap: 5px; }

  /* hero product mock */
  .hero-mock { position: relative; }
  .hero-cat { position: absolute; top: -54px; right: 14px; width: 148px; z-index: 6; pointer-events: none; }
  .hero-cat-svg { width: 100%; height: auto; display: block; transform-origin: 50% 92%; animation: catWiggle 4s ease-in-out infinite; filter: drop-shadow(0 9px 11px rgba(31,111,245,.26)); }
  .cat-tail { transform-box: fill-box; transform-origin: 92% 78%; animation: tailFlick 1.9s ease-in-out infinite; }
  .cat-head { transform-box: fill-box; transform-origin: 32% 100%; animation: headBob 2.7s ease-in-out infinite; }
  .cat-paw { transform-box: fill-box; transform-origin: 0% 50%; animation: pawBat 0.85s ease-in-out infinite; }
  .cat-body { transform-box: fill-box; transform-origin: 50% 100%; animation: catBreathe 2.7s ease-in-out infinite; }
  @keyframes catWiggle { 0%,100% { transform: rotate(-1.6deg); } 50% { transform: rotate(1.6deg); } }
  @keyframes tailFlick { 0%,100% { transform: rotate(-13deg); } 50% { transform: rotate(18deg); } }
  @keyframes headBob { 0%,100% { transform: rotate(-4.5deg); } 50% { transform: rotate(4deg); } }
  @keyframes pawBat { 0%,55%,100% { transform: rotate(0deg); } 75% { transform: rotate(-26deg); } }
  @keyframes catBreathe { 0%,100% { transform: scaleY(1); } 50% { transform: scaleY(1.05); } }
  @media (prefers-reduced-motion: reduce) { .hero-cat-svg, .cat-tail, .cat-head, .cat-paw, .cat-body { animation: none; } }
  .mock-card {
    background: #fff; border: 1px solid var(--line); border-radius: 18px;
    box-shadow: var(--shadow-lg); overflow: hidden;
  }
  .mock-top { display: flex; align-items: center; gap: 8px; padding: 13px 16px; border-bottom: 1px solid var(--line-2); background: var(--bg-soft); }
  .mc-dot { width: 10px; height: 10px; border-radius: 50%; }
  .mock-title { margin-left: 8px; font-size: 12.5px; color: var(--muted); font-family: "Geist Mono", monospace; }
  .mock-body { padding: 16px; display: grid; gap: 12px; }
  .inc {
    border: 1px solid var(--line); border-radius: 13px; padding: 14px; background: #fff;
    box-shadow: var(--shadow-sm);
  }
  .inc.lead { border-color: var(--sev-crit-bd); box-shadow: 0 10px 26px -14px rgba(220,38,38,.4); }
  .sev {
    display: inline-flex; align-items: center; gap: 7px; font-size: 12px; font-weight: 600;
    padding: 4px 10px; border-radius: 999px; border: 1px solid;
  }
  .sev .d { width: 6px; height: 6px; border-radius: 50%; }
  .sev.critical { background: var(--sev-crit-bg); color: var(--sev-critical); border-color: var(--sev-crit-bd); }
  .sev.critical .d { background: var(--sev-critical); }
  .sev.high { background: #fff7ed; color: var(--sev-high); border-color: #fed7aa; }
  .sev.high .d { background: var(--sev-high); }
  .inc-row { display: flex; align-items: center; justify-content: space-between; }
  .inc-time { font-size: 11.5px; color: var(--muted); }
  .inc-h { margin-top: 10px; font-size: 15px; font-weight: 650; letter-spacing: -0.02em; }
  .inc-impact { margin-top: 11px; display: flex; align-items: baseline; gap: 7px; }
  .inc-impact .amt { font-size: 22px; font-weight: 700; letter-spacing: -0.03em; font-variant-numeric: tabular-nums; }
  .inc-impact .lbl { font-size: 12px; color: var(--muted); }
  .chips { margin-top: 11px; display: flex; flex-wrap: wrap; gap: 6px; }
  .chip { font-family: "Geist Mono", monospace; font-size: 10.5px; color: var(--ink-2); background: var(--line-2); border-radius: 6px; padding: 3px 7px; }
  .inc-foot { margin-top: 12px; padding-top: 11px; border-top: 1px solid var(--line-2); display: flex; align-items: center; gap: 8px; }
  .bot { width: 20px; height: 20px; border-radius: 6px; background: var(--brand-50); color: var(--brand-600); display: grid; place-items: center; }
  .inc-foot .by { font-size: 11.5px; color: var(--muted); }
  .recover { margin-left: auto; display: flex; align-items: center; gap: 8px; }
  .bar { width: 86px; height: 6px; border-radius: 999px; background: var(--line); overflow: hidden; }
  .bar i { display: block; height: 100%; border-radius: 999px; background: var(--sev-green); }
  .recover .pct { font-size: 11.5px; font-weight: 600; color: var(--sev-green); font-variant-numeric: tabular-nums; }
  .float-badge {
    position: absolute; left: -26px; bottom: 36px;
    background: #fff; border: 1px solid var(--line); border-radius: 12px; padding: 11px 14px;
    box-shadow: var(--shadow-md); display: flex; align-items: center; gap: 10px;
  }
  .float-badge .ic { width: 30px; height: 30px; border-radius: 8px; display: grid; place-items: center; background: #dcfce7; color: var(--sev-green); }
  .float-badge .ft { font-size: 11px; color: var(--muted); }
  .float-badge .fv { font-size: 13.5px; font-weight: 650; }

  /* ---------- Integrations ---------- */
  .integ { padding: 64px 0 64px; border-top: 1px solid var(--line-2); border-bottom: 1px solid var(--line-2); background: var(--bg-soft); text-align: center; }
  .integ .lead-t { font-size: 13px; font-weight: 600; color: var(--muted); letter-spacing: .01em; }
  .logo-row { margin: 30px auto 0; display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 18px; max-width: 980px; }
  .logo-pill {
    display: inline-flex; align-items: center; gap: 11px;
    padding: 14px 22px; border-radius: 14px; background: #fff; border: 1px solid var(--line);
    box-shadow: var(--shadow-sm); transition: transform .16s ease, box-shadow .2s ease, border-color .2s;
  }
  .logo-pill:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); border-color: var(--brand-200); }
  .logo-pill svg { width: 26px; height: 26px; }
  .logo-pill span { font-size: 18px; font-weight: 650; letter-spacing: -0.02em; color: var(--ink); }
  .integ-sub { margin-top: 26px; font-size: 14px; color: var(--muted); }

  /* ---------- Section shared ---------- */
  .sec { padding: 96px 0; }
  .sec-head { max-width: 720px; }
  .sec-head.center { margin: 0 auto; text-align: center; }
  h2.sec-title { font-family: "Bricolage Grotesque", "Geist", sans-serif; margin-top: 16px; font-size: clamp(32px, 3.7vw, 50px); font-weight: 700; letter-spacing: -0.04em; }
  .sec-lead { margin-top: 18px; font-size: 18px; line-height: 1.55; color: var(--ink-2); }

  /* ---------- Damage / P&L ---------- */
  .damage { background: radial-gradient(820px 380px at 14% -12%, #fdeeec 0%, rgba(253,238,236,0) 58%), radial-gradient(720px 360px at 92% 112%, #eef3ff 0%, rgba(238,243,255,0) 58%), var(--bg-soft); color: var(--ink); position: relative; overflow: hidden; border-top: 1px solid var(--line-2); border-bottom: 1px solid var(--line-2); }
  .damage::before {
    content: ""; position: absolute; inset: 0; opacity: 0;
    background: radial-gradient(700px 360px at 12% -10%, rgba(220,38,38,.18), transparent 60%),
                radial-gradient(700px 360px at 90% 110%, rgba(31,111,245,.16), transparent 60%);
  }
  .damage .wrap { position: relative; }
  .damage .eyebrow { color: var(--sev-critical); }
  .damage .eyebrow::before { background: var(--sev-critical); box-shadow: 0 0 0 4px #fbdedb; }
  .damage h2.sec-title { color: var(--ink); }
  .damage-grid { margin-top: 52px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
  .dmg-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 2px; align-self: center; }
  .dmg-li { display: flex; align-items: flex-start; gap: 16px; padding: 18px 0; border-bottom: 1px solid var(--line); }
  .dmg-li:last-child { border-bottom: 0; }
  .dmg-ic { flex-shrink: 0; width: 46px; height: 46px; border-radius: 13px; display: grid; place-items: center; background: #fff; border: 1px solid #f7c4bf; color: var(--sev-critical); box-shadow: var(--shadow-sm); }
  .dmg-li h3 { font-size: 21px; font-weight: 650; letter-spacing: -0.02em; color: var(--ink); }
  .dmg-li p { margin-top: 3px; font-size: 14.5px; color: var(--muted); line-height: 1.45; }
  .damage-foot { margin-top: 40px; display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
  .damage-foot .ft { font-size: 15px; color: var(--muted); }

  /* ---------- Features ---------- */
  .feat-grid { margin-top: 56px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
  .feat {
    background: #fff; border: 1px solid var(--line); border-radius: var(--radius);
    padding: 26px; transition: transform .16s ease, box-shadow .2s ease, border-color .2s ease;
  }
  .feat:hover { transform: translateY(-4px); box-shadow: var(--shadow-md); border-color: var(--brand-200); }
  .feat .fic { width: 46px; height: 46px; border-radius: 12px; display: grid; place-items: center; background: var(--brand-50); color: var(--brand-600); border: 1px solid var(--brand-100); }
  .feat h3 { margin-top: 20px; font-size: 19px; font-weight: 650; letter-spacing: -0.02em; }
  .feat p { margin-top: 9px; font-size: 14.5px; color: var(--muted); line-height: 1.5; }
  .feat .tag { margin-top: 16px; display: inline-block; font-family: "Geist Mono", monospace; font-size: 11px; color: var(--ink-2); background: var(--line-2); border-radius: 6px; padding: 4px 9px; }

  /* ---------- How it works ---------- */
  .how { background: var(--bg-soft); border-top: 1px solid var(--line-2); }
  .steps { margin-top: 58px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 0; position: relative; }
  .step { position: relative; padding: 0 22px; }
  .step:first-child { padding-left: 0; }
  .step:last-child { padding-right: 0; }
  .step:not(:last-child)::after {
    content: ""; position: absolute; top: 26px; right: -1px; width: 2px; bottom: 0;
  }
  .step-num {
    width: 54px; height: 54px; border-radius: 14px; display: grid; place-items: center;
    background: #fff; border: 1px solid var(--line); box-shadow: var(--shadow-sm);
    font-family: "Geist Mono", monospace; font-size: 17px; font-weight: 600; color: var(--brand-600);
    position: relative; z-index: 2;
  }
  .step .connector { position: absolute; top: 27px; left: 54px; right: 0; height: 2px; background: repeating-linear-gradient(90deg, var(--brand-200) 0 7px, transparent 7px 14px); z-index: 1; }
  .step:last-child .connector { display: none; }
  /* animated resolved check on the final step */
  .step-num.resolved { color: #fff; background: var(--sev-green); border-color: var(--sev-green); box-shadow: 0 10px 22px -8px rgba(21,128,61,.6); }
  .step-num.resolved svg { width: 27px; height: 27px; transform-origin: center; animation: checkPop 3s ease-in-out infinite; }
  .step-num.resolved svg path { stroke-dasharray: 30; stroke-dashoffset: 0; }
  .step-num.resolved::after { content: ""; position: absolute; inset: -5px; border-radius: 18px; border: 2px solid var(--sev-green); opacity: 0; animation: pulseRing 3s ease-out infinite; }
  @keyframes checkPop { 0%,68%,100%{transform:scale(1)} 80%{transform:scale(1.2)} }
  @keyframes pulseRing { 0%{transform:scale(.85);opacity:.55} 62%{transform:scale(1.28);opacity:0} 100%{opacity:0} }
  @media (prefers-reduced-motion: reduce) { .step-num.resolved svg{animation:none} .step-num.resolved::after{animation:none} }
  .step h3 { margin-top: 22px; font-size: 20px; font-weight: 650; letter-spacing: -0.02em; }
  .step .lifecycle { margin-top: 10px; font-family: "Geist Mono", monospace; font-size: 11.5px; color: var(--brand-700); }
  .step p { margin-top: 12px; font-size: 14.5px; color: var(--ink-2); line-height: 1.5; }
  .step ul { margin: 16px 0 0; padding: 0; list-style: none; display: grid; gap: 8px; }
  .step ul li { font-size: 13.5px; color: var(--muted); display: flex; align-items: flex-start; gap: 9px; line-height: 1.4; }
  .step ul li::before { content: ""; margin-top: 7px; width: 6px; height: 6px; border-radius: 50%; background: var(--brand-500); flex-shrink: 0; }

  .agents-strip { margin-top: 56px; background: #fff; border: 1px solid var(--line); border-radius: var(--radius); padding: 24px 26px; display: flex; align-items: center; gap: 22px; flex-wrap: wrap; box-shadow: var(--shadow-sm); }
  .agents-strip .as-t { font-size: 14px; font-weight: 600; color: var(--ink); white-space: nowrap; }
  .agents-strip .as-list { display: flex; gap: 10px; flex-wrap: wrap; }
  .agent-chip { display: inline-flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 500; color: var(--ink-2); background: var(--bg-soft); border: 1px solid var(--line); border-radius: 999px; padding: 8px 13px; }

  /* ---------- Pricing ---------- */
  .price-grid { margin-top: 56px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; align-items: stretch; }
  .tier {
    background: #fff; border: 1px solid var(--line); border-radius: 20px; padding: 30px; display: flex; flex-direction: column;
    transition: transform .16s ease, box-shadow .2s ease;
  }
  .tier:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); }
  .tier.featured { border: 1.5px solid var(--brand-600); box-shadow: var(--shadow-blue); position: relative; }
  .tier.featured::before {
    content: "Most popular"; position: absolute; top: -12px; left: 30px;
    background: var(--brand-600); color: #fff; font-size: 11.5px; font-weight: 600; letter-spacing: .02em;
    padding: 5px 12px; border-radius: 999px; font-family: "Geist Mono", monospace;
  }
  .tier .tname { font-size: 15px; font-weight: 650; }
  .tier .tdesc { margin-top: 6px; font-size: 13.5px; color: var(--muted); min-height: 38px; }
  .tier .tprice { margin-top: 18px; display: flex; align-items: baseline; gap: 6px; }
  .tier .tprice .amt { font-size: 42px; font-weight: 700; letter-spacing: -0.04em; }
  .tier .tprice .per { font-size: 14px; color: var(--muted); }
  .tier .tbtn { margin-top: 22px; }
  .tier ul { margin: 24px 0 0; padding: 0; list-style: none; display: grid; gap: 12px; }
  .tier ul li { font-size: 14px; color: var(--ink-2); display: flex; align-items: flex-start; gap: 10px; line-height: 1.4; }
  .tier ul li svg { flex-shrink: 0; margin-top: 1px; color: var(--brand-600); }
  .tier.featured ul li svg { color: var(--brand-600); }

  /* ---------- Final CTA ---------- */
  .cta {
    margin: 0 auto; max-width: var(--maxw);
  }
  .cta-card {
    position: relative; overflow: hidden;
    background: linear-gradient(135deg, var(--brand-700), var(--brand-600) 55%, #5a93ff);
    border-radius: 28px; padding: 64px 56px; text-align: center; color: #fff;
    box-shadow: var(--shadow-blue);
  }
  .cta-card::before {
    content: ""; position: absolute; inset: 0;
    background-image: linear-gradient(rgba(255,255,255,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.08) 1px, transparent 1px);
    background-size: 44px 44px;
    -webkit-mask-image: radial-gradient(600px 300px at 50% 0%, #000, transparent 75%);
    mask-image: radial-gradient(600px 300px at 50% 0%, #000, transparent 75%);
  }
  .cta-card > * { position: relative; }
  .cta-card h2 { font-family: "Bricolage Grotesque", "Geist", sans-serif; font-size: clamp(30px, 3.6vw, 46px); font-weight: 700; letter-spacing: -0.04em; }
  .cta-card p { margin-top: 16px; font-size: 18px; color: rgba(255,255,255,.85); }
  .waitlist-form { margin: 30px auto 0; display: flex; gap: 10px; max-width: 480px; }
  .waitlist-form input {
    flex: 1; font-family: inherit; font-size: 15px; padding: 14px 18px; border-radius: 12px;
    border: 1px solid rgba(255,255,255,.3); background: rgba(255,255,255,.14); color: #fff; outline: none;
  }
  .waitlist-form input::placeholder { color: rgba(255,255,255,.7); }
  .waitlist-form input:focus { border-color: #fff; background: rgba(255,255,255,.2); }
  .waitlist-form .btn { background: #fff; color: var(--brand-700); box-shadow: none; }
  .waitlist-form .btn:hover { background: #eef4ff; transform: translateY(-1px); }
  .cta-note { margin-top: 16px; font-size: 13.5px; color: rgba(255,255,255,.75); }
  #wl-success { margin-top: 18px; font-size: 15px; font-weight: 600; color: #fff; display: none; }

  /* ---------- Footer ---------- */
  footer { padding: 56px 0 44px; border-top: 1px solid var(--line); margin-top: 96px; }
  .foot-inner { display: flex; align-items: center; justify-content: space-between; gap: 24px; flex-wrap: wrap; }
  .foot-links { display: flex; gap: 22px; flex-wrap: wrap; }
  .foot-links a { font-size: 14px; color: var(--muted); }
  .foot-links a:hover { color: var(--ink); }
  .foot-copy { font-size: 13px; color: var(--muted); }

  /* ---------- product mocks ---------- */
  .pill { display:inline-flex; align-items:center; gap:7px; font-size:12.5px; font-weight:600; padding:5px 12px; border-radius:999px; border:1px solid; white-space:nowrap; }
  .pill .pd { width:6px; height:6px; border-radius:50%; }
  .pill.crit { background:var(--sev-crit-bg); color:var(--sev-critical); border-color:var(--sev-crit-bd); }
  .pill.crit .pd { background:var(--sev-critical); }
  .pill.invs { background:#fff7ed; color:var(--sev-high); border-color:#fed7aa; }
  .pill.invs .pd { background:var(--sev-high); }
  .pill.appr { background:#fffbeb; color:var(--sev-amber); border-color:#fcd97a; }
  .pill.appr .pd { background:var(--sev-amber); }
  .pill.mon { background:#fefce8; color:#a16207; border-color:#fcd97a; }
  .pill.mon .pd { background:#ca8a04; }
  .pill.res { background:#f0fdf4; color:var(--sev-green); border-color:#bbf7d0; }
  .pill.res .pd { background:var(--sev-green); }
  .pill.det { background:var(--line-2); color:var(--ink-2); border-color:var(--line); }
  .pill.det .pd { background:var(--muted); }

  .panel { background:#fff; border:1px solid var(--line); border-radius:18px; box-shadow:var(--shadow-lg); overflow:hidden; }
  .panel-head { display:flex; align-items:center; justify-content:space-between; padding:16px 18px; border-bottom:1px solid var(--line-2); }
  .panel-head .ph-l { display:flex; align-items:baseline; gap:10px; }
  .ph-t { font-family:"Geist Mono",monospace; font-size:12px; letter-spacing:.12em; text-transform:uppercase; color:var(--muted); font-weight:500; white-space:nowrap; }
  .ph-c { font-size:13px; color:var(--muted); white-space:nowrap; }
  .panel-body { padding:14px; display:grid; gap:11px; }
  .irow { border:1px solid var(--line); border-radius:13px; padding:14px 16px; background:#fff; transition:border-color .15s, box-shadow .15s; }
  .irow:hover { border-color:var(--brand-200); box-shadow:var(--shadow-sm); }
  .irow .it { font-size:15px; font-weight:650; letter-spacing:-0.02em; }
  .irow .is { margin-top:5px; font-size:13px; color:var(--muted); }

  .health { border:1px solid var(--line); border-radius:13px; padding:16px; background:var(--bg-soft); }
  .health-top { display:flex; align-items:center; justify-content:space-between; }
  .health .hl { font-family:"Geist Mono",monospace; font-size:11px; letter-spacing:.12em; text-transform:uppercase; color:var(--muted); font-weight:500; white-space:nowrap; }
  .health h4 { margin-top:12px; font-size:18px; font-weight:650; letter-spacing:-0.02em; }
  .health .sub { margin-top:3px; font-size:13px; color:var(--muted); }
  .metrics { margin-top:16px; display:grid; grid-template-columns:1fr 1fr; gap:15px 24px; }
  .metric .ml { font-size:12.5px; color:var(--muted); }
  .metric .mv { margin-top:3px; font-family:"Geist Mono",monospace; font-size:19px; font-weight:600; letter-spacing:-0.01em; }
  .metric .mv.bad { color:var(--sev-critical); }

  /* breach + demo cards */
  .damage-body { margin-top:46px; display:grid; grid-template-columns:1.05fr 0.95fr; gap:30px; align-items:start; }
  .dmg-bullets { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
  .breach { background:#fff5f4; border:1px solid #fbd6d2; border-radius:18px; padding:28px; box-shadow:0 22px 50px -24px rgba(220,38,38,.4); }
  .breach .bl { font-family:"Geist Mono",monospace; font-size:11.5px; letter-spacing:.14em; text-transform:uppercase; color:var(--sev-critical); font-weight:600; }
  .breach h4 { margin-top:14px; font-size:23px; font-weight:700; letter-spacing:-0.03em; color:var(--ink); }
  .est { display:inline-flex; align-items:baseline; gap:7px; margin-top:16px; background:#fde0dd; border:1px solid #f7c4bf; border-radius:9px; padding:7px 13px; white-space:nowrap; }
  .est b { font-family:"Geist Mono",monospace; font-size:15px; color:var(--sev-critical); }
  .est .dim { font-family:"Geist Mono",monospace; font-size:13px; color:#d98a82; font-weight:500; }
  .breach-rows { margin-top:22px; display:grid; gap:15px; }
  .brow { display:flex; align-items:center; justify-content:space-between; gap:16px; }
  .brow .bk { font-size:14.5px; color:var(--muted); }
  .brow .bv { font-family:"Geist Mono",monospace; font-size:15px; font-weight:600; color:var(--ink); white-space:nowrap; }
  .brow .bv.bad { color:var(--sev-critical); }

  /* red progress bar */
  .pbar { display:flex; align-items:center; gap:14px; }
  .pbar .track { flex:1; height:8px; border-radius:999px; background:#eceaea; overflow:hidden; }
  .pbar .track i { display:block; height:100%; background:var(--sev-critical); border-radius:999px; }
  .pbar .pn { font-family:"Geist Mono",monospace; font-size:14px; font-weight:600; color:var(--ink-2); }

  /* lifecycle flow */
  .lifeflow { margin-top:46px; display:flex; align-items:center; gap:10px; flex-wrap:wrap; justify-content:center; }
  .lf-line { flex:1; min-width:18px; height:2px; background:repeating-linear-gradient(90deg, var(--line) 0 6px, transparent 6px 12px); }

  /* investigation mock */
  .invest-grid { margin-top:48px; display:grid; grid-template-columns:0.82fr 1.18fr; gap:20px; align-items:start; }
  .col-label { font-size:13px; color:var(--muted); margin-bottom:12px; font-weight:500; }
  .inv-panel { background:#fff; border:1px solid var(--line); border-radius:16px; box-shadow:var(--shadow-md); padding:18px; }
  .col-stage { margin-bottom:11px; }
  .inv-head { padding-bottom:16px; border-bottom:1px solid var(--line-2); }
  .inv-head .il { font-family:"Geist Mono",monospace; font-size:11px; letter-spacing:.12em; text-transform:uppercase; color:var(--muted); font-weight:500; }
  .inv-head h4 { margin-top:9px; font-size:17px; font-weight:650; letter-spacing:-0.02em; }
  .inv-head .rc { margin-top:4px; font-size:13.5px; color:var(--muted); }
  .agent-find { font-family:"Geist Mono",monospace; font-size:11px; letter-spacing:.12em; text-transform:uppercase; color:var(--muted); font-weight:500; margin:18px 0 12px; }
  .agents-list { display:grid; gap:12px; }
  .agent { border:1px solid var(--line); border-radius:12px; padding:15px; }
  .agent-top { display:flex; align-items:center; justify-content:space-between; gap:12px; }
  .agent-id { display:flex; align-items:center; gap:10px; }
  .agent-ic { width:30px; height:30px; border-radius:8px; display:grid; place-items:center; background:var(--bg-soft); border:1px solid var(--line); font-size:15px; }
  .agent-name { font-size:14px; font-weight:650; }
  .conf { font-family:"Geist Mono",monospace; font-size:11px; font-weight:500; padding:4px 10px; border-radius:999px; border:1px solid; white-space:nowrap; }
  .conf.hi { background:#f0fdf4; color:var(--sev-green); border-color:#bbf7d0; }
  .conf.mod { background:#fffbeb; color:var(--sev-amber); border-color:#fcd97a; }
  .agent p { margin-top:12px; font-size:13.5px; color:var(--ink-2); line-height:1.5; }
  .dchip { display:inline-block; margin-top:11px; font-family:"Geist Mono",monospace; font-size:11.5px; color:var(--ink-2); background:var(--line-2); border-radius:6px; padding:4px 9px; }
  .raw { margin-top:13px; padding-top:12px; border-top:1px solid var(--line-2); font-size:12.5px; color:var(--muted); }

  /* showcase demo incident */
  .showcase { background:var(--bg-soft); border-top:1px solid var(--line-2); }
  .demo-card { margin-top:8px; background:#fff6f5; border:1px solid #fbd6d2; border-radius:22px; padding:38px 40px; box-shadow:0 26px 60px -28px rgba(220,38,38,.35); }
  .demo-tags { display:flex; align-items:center; gap:12px; flex-wrap:wrap; }
  .demo-tags .dl { font-family:"Geist Mono",monospace; font-size:12px; letter-spacing:.14em; text-transform:uppercase; color:var(--sev-critical); font-weight:600; }
  .demo-card h3 { margin-top:20px; font-size:clamp(26px,3vw,34px); font-weight:700; letter-spacing:-0.035em; }
  .demo-meta { margin-top:16px; display:flex; align-items:center; gap:14px; flex-wrap:wrap; }
  .demo-meta .opened { font-size:14px; color:var(--muted); }
  .demo-rc { margin-top:18px; font-size:15px; color:var(--ink-2); }
  .demo-card .pbar { margin-top:14px; max-width:520px; }
  .demo-narr { margin-top:26px; padding-top:24px; border-top:1px solid #f3cfca; display:grid; gap:13px; }
  .demo-narr p { font-size:15.5px; color:var(--ink-2); line-height:1.5; max-width:760px; }

  /* ---------- reveal ---------- */
  .reveal { opacity: 0; transform: translateY(18px); transition: opacity .6s ease, transform .6s ease; }
  .reveal.in { opacity: 1; transform: none; }

  /* ---------- responsive ---------- */
  @media (max-width: 1000px) {
    .hero-grid { grid-template-columns: 1fr; gap: 44px; }
    .hero-mock { max-width: 520px; }
    .damage-grid, .feat-grid, .price-grid, .steps { grid-template-columns: repeat(2, 1fr); gap: 18px; }
    .step .connector { display: none; }
    .step { padding: 0; }
  }
  @media (max-width: 1000px) {
    .damage-body { grid-template-columns: 1fr; }
    .invest-grid { grid-template-columns: 1fr; }
  }
  @media (max-width: 760px) {
    .dmg-bullets { grid-template-columns: 1fr; }
    .lifeflow .lf-line { display: none; }
    .demo-card { padding: 26px 22px; }
    .nav-links { display: none; }
    .wrap { padding: 0 20px; }
    .pillars { grid-template-columns: 1fr; max-width: 100%; }
    .damage-grid, .feat-grid, .price-grid, .steps { grid-template-columns: 1fr; }
    .sec { padding: 70px 0; }
    .cta-card { padding: 44px 24px; }
    .waitlist-form { flex-direction: column; }
    .float-badge { left: 8px; }
    .nav-signin { display: none; }
  }`;

const LANDING_HTML = `<!-- ============ NAV ============ -->
<header class="nav" id="nav">
  <div class="wrap nav-inner">
    <a class="brand" href="#top">
      <img src="/catLogo.png" alt="Hugo logo" />
      <div>
        <div class="bt">Hugo</div>
        <div class="bs">Commerce IR</div>
      </div>
    </a>
    <nav class="nav-links">
      
      <a href="#how">How it works</a>
      <a href="#pricing">Pricing</a>
    </nav>
    <div class="nav-cta">
      <a class="nav-signin" href="#waitlist">Sign in</a>
      <a class="btn btn-primary" href="#waitlist">Join waitlist</a>
    </div>
  </div>
</header>

<!-- ============ HERO ============ -->
<section class="hero" id="top">
  <div class="wrap hero-grid">
    <div class="hero-left">
      <span class="hero-tag"><span class="pip">CRITICAL</span> Return rate +9.2pts on Court Trainer</span>
      <h1 class="hero-title">Every KPI breach is an <span class="grad">incident.</span><br />Hugo runs the response.</h1>
      <div class="hero-actions">
        <a class="btn btn-primary btn-lg" href="#waitlist">Join the waitlist <svg class="arrow" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a>
        <a class="btn btn-ghost btn-lg" href="#how">See how it works</a>
      </div>
    
    </div>

    <!-- product mock: incidents + catalog health -->
    <div class="hero-mock">
      <div class="panel">
        <div class="panel-head">
          <div class="ph-l"><span class="ph-t">Incidents</span><span class="ph-c">3 open</span></div>
          <span class="pill crit"><span class="pd"></span>Critical</span>
        </div>
        <div class="panel-body">
          <div class="irow">
            <div class="it">Court Trainer Return Spike</div>
            <div class="is">6h ago · £24,800</div>
          </div>
          <div class="irow">
            <div class="it">ROAS dip — UK cold campaigns</div>
            <div class="is">11h ago · £9,200</div>
          </div>
          <div class="irow">
            <div class="it">UK12 stockout loop</div>
            <div class="is">2d ago · £4,100</div>
          </div>
          <div class="health">
            <div class="health-top">
              <span class="hl">Catalog health</span>
              <span class="pill crit"><span class="pd"></span>Critical</span>
            </div>
            <h4>Court Trainer</h4>
            <div class="sub">Footwear · Unisex</div>
            <div class="metrics">
              <div class="metric"><div class="ml">Return rate</div><div class="mv bad">18.4%</div></div>
              <div class="metric"><div class="ml">ROAS</div><div class="mv">0.82</div></div>
              <div class="metric"><div class="ml">Refund rate</div><div class="mv">9.2%</div></div>
              <div class="metric"><div class="ml">Support (30d)</div><div class="mv">47</div></div>
            </div>
          </div>
        </div>
      </div>
      <div class="float-badge">
        <span class="ic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></span>
        <div>
          <div class="ft">Mean time to recover</div>
          <div class="fv">4.2 days → 11 hrs</div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ============ INTEGRATIONS ============ -->
<section class="integ">
  <div class="wrap">
    <p class="lead-t">Plugs into the commerce stack you already run</p>
    <div class="logo-row">
      <span class="logo-pill"><svg viewBox="0 0 24 24" fill="#95BF47"><path d="M15.337 23.979l7.216-1.561s-2.604-17.613-2.625-17.73c-.018-.116-.114-.192-.211-.192-.094-.008-1.929-.143-1.929-.143s-1.275-1.268-1.439-1.404c-.045-.037-.075-.057-.121-.074l-.914 21.104.023.001zM11.71 9.428s-.81-.424-1.774-.424c-1.447 0-1.504.906-1.504 1.141 0 1.232 3.24 1.715 3.24 4.629 0 2.295-1.44 3.769-3.394 3.769-2.344 0-3.531-1.461-3.531-1.461l.626-2.078s1.227 1.054 2.266 1.054c.675 0 .955-.539.955-.929 0-1.619-2.657-1.694-2.657-4.359 0-2.247 1.612-4.42 4.862-4.42 1.245 0 1.862.358 1.862.358l-.927 2.736zM12.301 1.378c.122 0 .244.047.361.135-.835.39-1.733 1.383-2.112 3.365l-1.539.477c.428-1.457 1.443-4.452 3.29-4.452z"/></svg><span>Shopify</span></span>
      <span class="logo-pill"><svg viewBox="0 0 24 24"><path fill="#E01E5A" d="M5.04 15.16a2.4 2.4 0 1 1-4.8 0 2.4 2.4 0 0 1 2.4-2.4h2.4v2.4zm1.2 0a2.4 2.4 0 0 1 4.8 0v6a2.4 2.4 0 0 1-4.8 0v-6z"/><path fill="#36C5F0" d="M8.64 5a2.4 2.4 0 1 1 0-4.8 2.4 2.4 0 0 1 2.4 2.4v2.4h-2.4zm0 1.2a2.4 2.4 0 0 1 0 4.8h-6a2.4 2.4 0 0 1 0-4.8h6z"/><path fill="#2EB67D" d="M18.96 8.64a2.4 2.4 0 1 1 4.8 0 2.4 2.4 0 0 1-2.4 2.4h-2.4v-2.4zm-1.2 0a2.4 2.4 0 0 1-4.8 0v-6a2.4 2.4 0 0 1 4.8 0v6z"/><path fill="#ECB22E" d="M15.36 18.96a2.4 2.4 0 1 1 0 4.8 2.4 2.4 0 0 1-2.4-2.4v-2.4h2.4zm0-1.2a2.4 2.4 0 0 1 0-4.8h6a2.4 2.4 0 0 1 0 4.8h-6z"/></svg><span>Slack</span></span>
    </div>
    <p class="integ-sub">One read-only connection. Your KPIs, thresholds and forecasts stay yours.</p>
  </div>
</section>

<!-- ============ DAMAGE / P&L ============ -->
<section class="sec damage">
  <div class="wrap">
    <div class="sec-head">
      <span class="eyebrow">The problem</span>
      <h2 class="sec-title">The damage is already<br />in the P&amp;L.</h2>
    </div>
    <div class="damage-body">
      <ul class="dmg-list reveal">
        <li class="dmg-li">
          <span class="dmg-ic"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg></span>
          <div><h3>Spotted late</h3><p>Found in a weekly review — days after the bleed started.</p></div>
        </li>
        <li class="dmg-li">
          <span class="dmg-ic"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg></span>
          <div><h3>Scattered data</h3><p>Returns, ads, merch and stock live in four separate tools.</p></div>
        </li>
        <li class="dmg-li">
          <span class="dmg-ic"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></span>
          <div><h3>Slack debates</h3><p>Root cause argued in threads with no shared timeline.</p></div>
        </li>
        <li class="dmg-li">
          <span class="dmg-ic"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg></span>
          <div><h3>No recovery proof</h3><p>Fixes ship, but nobody confirms the metric came back.</p></div>
        </li>
      </ul>
      <div class="breach reveal">
        <div class="bl">Typical breach</div>
        <h4>Court Trainer Return Spike</h4>
        <div class="est"><b>£24,800</b> <span class="dim">est. 14d</span></div>
        <div class="breach-rows">
          <div class="brow"><span class="bk">Return rate</span><span class="bv bad">18.4%</span></div>
          <div class="brow"><span class="bk">Threshold</span><span class="bv">6.5%</span></div>
          <div class="brow"><span class="bk">Days to detect (manual)</span><span class="bv">5–7</span></div>
        </div>
      </div>
    </div>
    <div class="damage-foot">
      <a class="btn btn-primary btn-lg" href="#how">See how Hugo closes the loop <svg class="arrow" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a>
      <span class="ft">Math finds it · agents explain it · humans approve · Hugo proves recovery.</span>
    </div>
  </div>
</section>

<!-- ============ HOW IT WORKS ============ -->
<section class="sec how" id="how">
  <div class="wrap">
    <div class="sec-head center">
      <span class="eyebrow">How Hugo works</span>
      <h2 class="sec-title">From breach to recovery, in one loop.</h2>
      <p class="sec-lead">Math finds the breach, agents explain it, humans approve the fix, and Hugo monitors until the metric is back to healthy.</p>
    </div>

    <div class="lifeflow reveal">
      <span class="pill det">Detected</span>
      <span class="lf-line"></span>
      <span class="pill invs">Investigating</span>
      <span class="lf-line"></span>
      <span class="pill appr">Awaiting Approval</span>
      <span class="lf-line"></span>
      <span class="pill mon">Monitoring</span>
      <span class="lf-line"></span>
      <span class="pill res">Resolved</span>
    </div>

    <div class="steps">
      <div class="step reveal">
        <div class="step-num">01</div><div class="connector"></div>
        <h3>Detect</h3>
        <div class="lifecycle">detected</div>
        <ul>
          <li>Config-driven KPIs &amp; thresholds</li>
          <li>Opens on breach or forecast risk</li>
          <li>Auto-scored severity</li>
        </ul>
      </div>
      <div class="step reveal">
        <div class="step-num">02</div><div class="connector"></div>
        <h3>Investigate</h3>
        <div class="lifecycle">investigating</div>
        <ul>
          <li>Returns · merch · marketing</li>
          <li>Inventory · forecasting</li>
          <li>Root cause + confidence</li>
        </ul>
      </div>
      <div class="step reveal">
        <div class="step-num">03</div><div class="connector"></div>
        <h3>Approve</h3>
        <div class="lifecycle">fix_proposed → deploying</div>
        <ul>
          <li>Ranked, costed actions</li>
          <li>Approve in app or Slack</li>
          <li>Optional auto-deploy</li>
        </ul>
      </div>
      <div class="step reveal">
        <div class="step-num resolved" aria-label="Resolved"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></div><div class="connector"></div>
        <h3>Recover</h3>
        <div class="lifecycle">monitoring → resolved</div>
        <ul>
          <li>Live recovery tracking</li>
          <li>Auto-resolve at 100%</li>
          <li>Full incident timeline</li>
        </ul>
      </div>
    </div>
  </div>
</section>

<!-- ============ PRICING ============ -->
<section class="sec" id="pricing">
  <div class="wrap">
    <div class="sec-head center">
      <span class="eyebrow">Pricing</span>
      <h2 class="sec-title">Start free. Scale when it pays for itself.</h2>
      <p class="sec-lead">One recovered incident usually covers the year. Early-access pricing is locked for waitlist members.</p>
    </div>
    <div class="price-grid">
      <div class="tier reveal">
        <div class="tname">Starter</div>
        <div class="tdesc">For single-store operators getting their first incidents under control.</div>
        <div class="tprice"><span class="amt">£49</span><span class="per">/ month</span></div>
        <a class="btn btn-ghost tbtn" href="#waitlist">Join waitlist</a>
        <ul>
          <li><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>1 store connection</li>
          <li><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>KPI detection &amp; alerts</li>
          <li><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>50 incidents / month</li>
          <li><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>Email &amp; Slack notifications</li>
        </ul>
      </div>
      <div class="tier featured reveal">
        <div class="tname">Growth</div>
        <div class="tdesc">For teams running the full detect → recover loop across a catalogue.</div>
        <div class="tprice"><span class="amt">£199</span><span class="per">/ month</span></div>
        <a class="btn btn-primary tbtn" href="#waitlist">Join waitlist</a>
        <ul>
          <li><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>Up to 5 stores</li>
          <li><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>Full five-agent investigation</li>
          <li><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>Unlimited incidents</li>
          <li><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>Approval workflows &amp; recovery</li>
          <li><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>Predictive forecasts</li>
        </ul>
      </div>
      <div class="tier reveal">
        <div class="tname">Scale</div>
        <div class="tdesc">For multi-brand operators that need control, security and support.</div>
        <div class="tprice"><span class="amt">Custom</span></div>
        <a class="btn btn-ghost tbtn" href="#waitlist">Talk to us</a>
        <ul>
          <li><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>Unlimited stores &amp; brands</li>
          <li><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>Custom KPIs &amp; thresholds</li>
          <li><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>SSO &amp; audit log</li>
          <li><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>Dedicated support</li>
        </ul>
      </div>
    </div>
  </div>
</section>

<!-- ============ FINAL CTA ============ -->
<section class="sec" id="waitlist" style="padding-top: 0;">
  <div class="wrap">
    <div class="cta">
      <div class="cta-card">
        <h2>Stop the bleed before the quarter closes.</h2>
        <p>Join the private beta and get early-access pricing locked for life.</p>
        <form class="waitlist-form" id="wl-form">
          <input type="email" id="wl-email" placeholder="you@yourbrand.com" required aria-label="Work email" />
          <button class="btn btn-lg" type="submit">Join waitlist</button>
        </form>
        <div class="cta-note">Free during private beta · No card required · One read-only connection</div>
        <div id="wl-success">✓ You're on the list — we'll be in touch shortly.</div>
      </div>
    </div>
  </div>
</section>

<!-- ============ FOOTER ============ -->
<footer>
  <div class="wrap foot-inner">
    <a class="brand" href="#top">
      <img src="/catLogo.png" alt="Hugo logo" />
      <div>
        <div class="bt">Hugo</div>
        <div class="bs">Commerce Incident Response</div>
      </div>
    </a>
    <nav class="foot-links">
      
      <a href="#how">How it works</a>
      <a href="#pricing">Pricing</a>
      <a href="#waitlist">Join waitlist</a>
    </nav>
    <div class="foot-copy">© 2026 Hugo · Commerce Incident Response</div>
  </div>
</footer>`;

export function HugoLanding() {
  useEffect(() => {
    const nav = document.getElementById("nav");
    const onScroll = () => nav?.classList.toggle("scrolled", window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );
    document.querySelectorAll<HTMLElement>(".reveal").forEach((el, i) => {
      el.style.transitionDelay = `${(i % 4) * 60}ms`;
      io.observe(el);
    });

    const form = document.getElementById("wl-form") as HTMLFormElement | null;
    const onSubmit = (event: Event) => {
      event.preventDefault();
      const input = document.getElementById("wl-email") as HTMLInputElement | null;
      if (!input || !input.value.trim()) return;
      if (form) form.style.display = "none";
      const success = document.getElementById("wl-success");
      if (success) success.style.display = "block";
    };
    form?.addEventListener("submit", onSubmit);

    return () => {
      window.removeEventListener("scroll", onScroll);
      io.disconnect();
      form?.removeEventListener("submit", onSubmit);
    };
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: LANDING_CSS }} />
      <div dangerouslySetInnerHTML={{ __html: LANDING_HTML }} />
    </>
  );
}
