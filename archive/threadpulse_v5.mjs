// ThreadPulse v5 — single-file local Reddit post analyzer
// Requires Node.js 18+
// Run:  node threadpulse_v5.mjs
// Open: http://localhost:8787
//
// Flags: --port 9000   (or PORT=9000)
//
// Nothing is stored on a server. Your key, draft and history live in this
// browser's local storage. The key is forwarded to TypeSafe per request and
// is never written to disk or printed to the terminal.

import http from "node:http";
import process from "node:process";

const argPort = (() => {
  const i = process.argv.indexOf("--port");
  return i > -1 ? Number(process.argv[i + 1]) : NaN;
})();
const PORT = Number.isFinite(argPort) && argPort > 0 ? argPort : Number(process.env.PORT || 8787);
const HOST = process.env.HOST || "127.0.0.1";
const UPSTREAM = "https://api.typesafe.ai/v1/systemone";
const UPSTREAM_TIMEOUT_MS = 60_000;

const html = String.raw`<!doctype html>
<html lang="en" data-theme="light">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="color-scheme" content="light dark">
<meta name="description" content="Score a Reddit draft before you post it, rewrite it, and watch the number move.">
<title>ThreadPulse</title>
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='9' fill='%23191C22'/%3E%3Cg fill='none' stroke='%237C8FFF' stroke-width='2.1' stroke-linecap='round'%3E%3Cpath d='M11 11.5v10.2'/%3E%3Cpath d='M11 15.6h3.4a2 2 0 0 1 2 2v.6'/%3E%3Cpath d='M11 20.8h6.8a2 2 0 0 0 2-2v-.6'/%3E%3C/g%3E%3Ccircle cx='11' cy='9.4' r='2.5' fill='%237C8FFF'/%3E%3Ccircle cx='16.4' cy='19.6' r='1.6' fill='%237C8FFF'/%3E%3Ccircle cx='19.8' cy='16.3' r='1.6' fill='%237C8FFF'/%3E%3C/svg%3E">
<style>
/* ============================================================
   ThreadPulse v5 tokens

   One colour rule, applied everywhere:
     - PRIMARY (cobalt) is only ever interactive: buttons, links, focus,
       selected states. It never appears in data.
     - GOOD / MID / BAD only ever encode a measurement. They never
       appear on a control.
   That separation is why v4 felt noisy: mint was doing both jobs, so
   nothing could be read at a glance.
============================================================ */
:root{
  --bg:#F5F6F9;
  --surface:#FFFFFF;
  --surface-2:#F0F2F6;
  --surface-3:#E7EAEF;
  --line:#DFE2E8;
  --line-2:#C7CDD6;
  --ink:#191C22;
  --ink-2:#39404B;
  --muted:#5C6572;
  --faint:#666F7C;

  --primary:#2C4BCF;
  --primary-2:#2340B8;
  --primary-ink:#FFFFFF;
  --primary-soft:rgba(44,75,207,.09);
  --primary-line:rgba(44,75,207,.28);

  --good:#17734A;
  --mid:#96620F;
  --bad:#B93B36;
  --good-soft:rgba(26,127,82,.12);
  --mid-soft:rgba(150,98,15,.13);
  --bad-soft:rgba(185,59,54,.12);
  --good-bar:#2E9E68;
  --mid-bar:#C08A2A;
  --bad-bar:#CC534D;

  --shadow-1:0 1px 2px rgba(20,24,32,.05);
  --shadow-2:0 2px 4px rgba(20,24,32,.04),0 8px 24px rgba(20,24,32,.06);
  --shadow-3:0 12px 40px rgba(20,24,32,.14);

  --r-lg:16px;
  --r-md:11px;
  --r-sm:8px;

  --t-2xs:12px;
  --t-xs:13px;
  --t-sm:14px;
  --t-md:15px;
  --t-lg:17px;
  --t-xl:20px;

  --sans:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;
  --mono:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,"Liberation Mono",monospace;
}
:root[data-theme="dark"]{
  --bg:#12141A;
  --surface:#1A1D24;
  --surface-2:#21252D;
  --surface-3:#2A2F38;
  --line:#2B303A;
  --line-2:#3B424D;
  --ink:#E8EBF0;
  --ink-2:#C2C9D3;
  --muted:#98A0AC;
  --faint:#8A93A0;

  --primary:#7C8FFF;
  --primary-2:#96A6FF;
  --primary-ink:#11141C;
  --primary-soft:rgba(124,143,255,.15);
  --primary-line:rgba(124,143,255,.35);

  --good:#43BE86;
  --mid:#DEA340;
  --bad:#F0736B;
  --good-soft:rgba(67,190,134,.14);
  --mid-soft:rgba(222,163,64,.15);
  --bad-soft:rgba(240,115,107,.14);
  --good-bar:#43BE86;
  --mid-bar:#DEA340;
  --bad-bar:#F0736B;

  --shadow-1:0 1px 2px rgba(0,0,0,.4);
  --shadow-2:0 2px 6px rgba(0,0,0,.3),0 10px 30px rgba(0,0,0,.28);
  --shadow-3:0 16px 46px rgba(0,0,0,.5);
}

*,*::before,*::after{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{
  margin:0;min-height:100dvh;background:var(--bg);color:var(--ink);
  font-family:var(--sans);font-size:var(--t-sm);line-height:1.5;letter-spacing:-.008em;
  -webkit-font-smoothing:antialiased;
}
h1,h2,h3,h4,p{margin:0}
button,input,textarea,select{font:inherit;color:inherit}
button{cursor:pointer;background:none;border:0;padding:0}
button:disabled{cursor:not-allowed}
svg{display:block;flex:none}
[hidden]{display:none !important}
::selection{background:var(--primary-soft)}
:where(a,button,input,textarea,select,[tabindex]):focus-visible{
  outline:2px solid var(--primary);outline-offset:2px;border-radius:5px;
}
.sr{position:absolute;width:1px;height:1px;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.num{font-family:var(--mono);font-variant-numeric:tabular-nums}
.wrap{width:min(1400px,100% - 44px);margin:0 auto}

/* ============================================================
   app bar
============================================================ */
.appbar{
  position:sticky;top:0;z-index:30;background:var(--bg);
  border-bottom:1px solid var(--line);
}
.appbar-in{display:flex;align-items:center;justify-content:space-between;gap:16px;height:62px}
.brand{display:flex;align-items:center;gap:11px;text-decoration:none;color:inherit}
.logo{
  width:34px;height:34px;border-radius:10px;background:var(--ink);flex:none;
  display:grid;place-items:center;box-shadow:var(--shadow-1);
}
:root[data-theme="dark"] .logo{background:#0C0E13;border:1px solid var(--line)}
.logo svg{width:23px;height:23px}
.brand b{font-size:var(--t-md);font-weight:640;letter-spacing:-.017em}
.brand small{display:block;font-size:var(--t-2xs);color:var(--faint);font-weight:450;margin-top:-1px}
.bar-actions{display:flex;align-items:center;gap:8px}

.pill{
  height:34px;padding:0 12px;border-radius:var(--r-md);border:1px solid var(--line);
  background:var(--surface);display:inline-flex;align-items:center;gap:8px;
  font-size:var(--t-2xs);font-weight:540;color:var(--ink-2);box-shadow:var(--shadow-1);
  transition:border-color .15s,background .15s;
}
.pill:hover{border-color:var(--line-2)}
.pill[aria-expanded="true"]{background:var(--surface-2);border-color:var(--line-2)}
.dot{width:7px;height:7px;border-radius:50%;background:var(--faint);flex:none}
.dot.ok{background:var(--good-bar)}
.dot.bad{background:var(--bad-bar)}
.dot.busy{background:var(--mid-bar);animation:blink 1s infinite}
@keyframes blink{50%{opacity:.25}}
.ibtn{
  width:34px;height:34px;border-radius:var(--r-md);border:1px solid var(--line);background:var(--surface);
  display:grid;place-items:center;color:var(--ink-2);box-shadow:var(--shadow-1);transition:border-color .15s,color .15s;
}
.ibtn:hover{border-color:var(--line-2);color:var(--ink)}
.ibtn svg{width:16px;height:16px}

/* setup strip — expands in flow, nothing floats over the page */
.setup{border-bottom:1px solid var(--line);background:var(--surface-2);overflow:hidden}
.setup-in{display:flex;align-items:flex-end;gap:12px;padding:16px 0;flex-wrap:wrap}
.setup-field{flex:1 1 320px;min-width:0}
.setup-note{flex:1 1 100%;font-size:var(--t-2xs);color:var(--faint);line-height:1.5;max-width:76ch}

/* ============================================================
   layout
============================================================ */
.grid{
  display:grid;grid-template-columns:minmax(340px,.82fr) minmax(0,1fr);
  gap:20px;align-items:start;padding:20px 0 60px;
}
.card{
  background:var(--surface);border:1px solid var(--line);border-radius:var(--r-lg);
  box-shadow:var(--shadow-2);overflow:hidden;
}
.card-head{
  display:flex;align-items:center;justify-content:space-between;gap:12px;
  padding:14px 18px;border-bottom:1px solid var(--line);
}
.card-head h2{font-size:var(--t-sm);font-weight:620}
.card-head .sub{font-size:var(--t-2xs);color:var(--faint);margin-top:1px}
.card-body{padding:18px}

/* ============================================================
   form
============================================================ */
.field{margin-bottom:15px}
.field:last-child{margin-bottom:0}
.flabel{display:flex;align-items:baseline;justify-content:space-between;gap:10px;margin-bottom:6px}
.flabel label{font-size:var(--t-2xs);font-weight:580;color:var(--ink-2)}
.count{font-size:var(--t-2xs);color:var(--faint);font-family:var(--mono)}
.count.warn{color:var(--mid)}
.count.over{color:var(--bad);font-weight:600}
.hint{margin-top:6px;font-size:var(--t-2xs);color:var(--faint);line-height:1.45}
.hint.bad{color:var(--bad)}
.input{
  width:100%;border:1px solid var(--line);background:var(--surface);color:var(--ink);
  border-radius:var(--r-md);padding:10px 12px;font-size:var(--t-sm);
  transition:border-color .15s,box-shadow .15s;
}
.input::placeholder{color:var(--faint)}
.input:hover:not(:focus){border-color:var(--line-2)}
.input:focus{outline:none;border-color:var(--primary);box-shadow:0 0 0 3px var(--primary-soft)}
.input[aria-invalid="true"]{border-color:var(--bad)}
textarea.input{min-height:170px;resize:vertical;line-height:1.6}
select.input{
  appearance:none;cursor:pointer;padding-right:32px;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%235C6572' stroke-width='2' stroke-linecap='round'%3E%3Cpath d='m7 10 5 5 5-5'/%3E%3C/svg%3E");
  background-repeat:no-repeat;background-position:right 10px center;background-size:15px;
}
:root[data-theme="dark"] select.input{
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2398A0AC' stroke-width='2' stroke-linecap='round'%3E%3Cpath d='m7 10 5 5 5-5'/%3E%3C/svg%3E");
}
.pre-wrap{position:relative}
.pre-wrap .pre{position:absolute;left:12px;top:50%;transform:translateY(-50%);font-family:var(--mono);font-size:var(--t-sm);color:var(--faint);pointer-events:none}
.pre-wrap .input{padding-left:31px}
.two{display:grid;grid-template-columns:1fr 1fr;gap:12px}

.srow{
  border:1px solid var(--line);border-radius:var(--r-md);padding:11px 12px;background:var(--surface-2);
  display:flex;align-items:center;justify-content:space-between;gap:12px;
}
.srow-copy b{display:block;font-size:var(--t-2xs);font-weight:580}
.srow-copy small{display:block;font-size:var(--t-2xs);color:var(--faint);margin-top:1px}
.switch{position:relative;width:40px;height:23px;flex:none}
.switch input{position:absolute;inset:0;opacity:0;margin:0;cursor:pointer;z-index:1}
.slider{position:absolute;inset:0;background:var(--line-2);border-radius:999px;transition:background .18s}
.slider::after{content:"";position:absolute;left:3px;top:3px;width:17px;height:17px;background:#fff;border-radius:50%;box-shadow:0 1px 3px rgba(0,0,0,.3);transition:transform .18s}
.switch input:checked+.slider{background:var(--primary)}
.switch input:checked+.slider::after{transform:translateX(17px)}
.switch input:focus-visible+.slider{outline:2px solid var(--primary);outline-offset:2px}

.drop{
  position:relative;border:1.5px dashed var(--line-2);border-radius:var(--r-md);background:var(--surface-2);
  padding:18px 14px;text-align:center;transition:border-color .15s,background .15s;
}
.drop.on{border-color:var(--primary);background:var(--primary-soft)}
.drop input{position:absolute;inset:0;opacity:0;cursor:pointer}
.drop svg{width:19px;height:19px;margin:0 auto 6px;color:var(--muted)}
.drop b{display:block;font-size:var(--t-2xs);font-weight:580}
.drop span{display:block;font-size:var(--t-2xs);color:var(--faint);margin-top:2px}
.thumb{border:1px solid var(--line);border-radius:var(--r-md);overflow:hidden}
.thumb img{display:block;width:100%;height:150px;object-fit:cover;background:var(--surface-3)}
.thumb-bar{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 10px;border-top:1px solid var(--line);background:var(--surface-2)}
.thumb-bar span{font-size:var(--t-2xs);color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}

/* ============================================================
   buttons
============================================================ */
.btn{
  height:38px;padding:0 14px;border-radius:var(--r-md);border:1px solid var(--line);background:var(--surface);
  color:var(--ink);display:inline-flex;align-items:center;justify-content:center;gap:8px;
  font-size:var(--t-2xs);font-weight:580;white-space:nowrap;
  transition:background .15s,border-color .15s,opacity .15s;
}
.btn:hover:not(:disabled){background:var(--surface-2);border-color:var(--line-2)}
.btn:disabled{opacity:.45}
.btn svg{width:15px;height:15px}
.btn-primary{background:var(--primary);border-color:var(--primary);color:var(--primary-ink)}
.btn-primary:hover:not(:disabled){background:var(--primary-2);border-color:var(--primary-2)}
.btn-quiet{background:transparent;border-color:transparent;color:var(--muted)}
.btn-quiet:hover:not(:disabled){background:var(--surface-2);color:var(--ink)}
.btn-sm{height:31px;padding:0 10px;border-radius:var(--r-sm);font-size:var(--t-2xs)}
.btn-sm svg{width:14px;height:14px}
.btn-ico{width:38px;padding:0}
.btn-ico.btn-sm{width:31px}
.grow{flex:1}
.kbd{font-family:var(--mono);font-size:11px;padding:2px 5px;border-radius:4px;background:rgba(255,255,255,.16);opacity:.9}
.btn:not(.btn-primary) .kbd{background:var(--surface-3);opacity:.85}
.acts{display:flex;gap:9px;margin-top:18px;padding-top:16px;border-top:1px solid var(--line)}

/* ============================================================
   tabs
============================================================ */
.tabs{display:flex;gap:2px;padding:3px;background:var(--surface-2);border:1px solid var(--line);border-radius:10px}
.tab{
  height:29px;padding:0 12px;border-radius:7px;font-size:var(--t-2xs);font-weight:560;color:var(--muted);
  display:inline-flex;align-items:center;gap:7px;transition:background .15s,color .15s;
}
.tab:hover{color:var(--ink)}
.tab[aria-selected="true"]{background:var(--surface);color:var(--ink);box-shadow:var(--shadow-1)}
.tab .badge{
  min-width:17px;height:17px;padding:0 4px;border-radius:5px;background:var(--surface-3);
  font-family:var(--mono);font-size:11px;display:grid;place-items:center;color:var(--muted);
}
.tab[aria-selected="true"] .badge{background:var(--primary-soft);color:var(--primary)}
.panel{display:none}
.panel.on{display:block}

/* ============================================================
   score block
============================================================ */
.score{padding:20px 18px 18px;border-bottom:1px solid var(--line)}
.score-top{display:flex;align-items:flex-start;gap:20px;margin-bottom:22px}
.score-num{flex:none;display:flex;align-items:baseline;gap:5px}
.score-num strong{font-family:var(--mono);font-variant-numeric:tabular-nums;font-size:52px;font-weight:600;letter-spacing:-.05em;line-height:.92}
.score-num span{font-size:var(--t-xs);color:var(--faint)}
.score-num.is-good strong{color:var(--good)}
.score-num.is-mid strong{color:var(--mid)}
.score-num.is-bad strong{color:var(--bad)}
.score-copy{min-width:0;flex:1}
.score-copy h3{font-size:var(--t-xl);font-weight:620;letter-spacing:-.022em;line-height:1.22}
.score-copy p{font-size:var(--t-xs);color:var(--muted);line-height:1.5;margin-top:5px;max-width:52ch}

/* the scale: a real measurement, with every past run on it */
.scale{position:relative;padding-top:26px}
.scale-marks{position:absolute;left:0;right:0;top:0;height:24px}
.mark{position:absolute;bottom:0;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:2px}
.mark-tag{
  font-family:var(--mono);font-size:11px;font-weight:600;padding:1px 5px;border-radius:4px;
  background:var(--ink);color:var(--bg);white-space:nowrap;
}
.mark-stem{width:2px;height:7px;background:var(--ink);border-radius:1px}
.mark.ghost{opacity:.42}
.mark.ghost .mark-tag{background:transparent;color:var(--faint);border:1px solid var(--line-2);font-weight:500}
.mark.ghost .mark-stem{background:var(--line-2)}
.scale-track{display:flex;height:9px;border-radius:999px;overflow:hidden;background:var(--surface-3)}
.seg{height:100%}
.seg-bad{background:var(--bad-soft)}
.seg-mid{background:var(--mid-soft)}
.seg-ok{background:var(--good-soft)}
.seg-good{background:var(--good-bar);opacity:.55}
.scale-ticks{position:relative;height:18px;margin-top:5px}
.tick{position:absolute;transform:translateX(-50%);font-family:var(--mono);font-size:11px;color:var(--faint)}
.tick i{display:block;font-style:normal;font-size:11px;letter-spacing:-.01em}

/* callout: the one thing to fix */
.fix{
  display:flex;gap:11px;align-items:flex-start;margin:0 18px 18px;padding:13px 14px;
  border:1px solid var(--line);border-left:3px solid var(--mid-bar);border-radius:var(--r-md);background:var(--surface-2);
}
.fix.sev-bad{border-left-color:var(--bad-bar)}
.fix.sev-ok{border-left-color:var(--good-bar)}
.fix-copy b{display:block;font-size:var(--t-2xs);font-weight:620;margin-bottom:3px}
.fix-copy p{font-size:var(--t-2xs);color:var(--muted);line-height:1.5;max-width:60ch}

/* ============================================================
   sections + bars
============================================================ */
.sec{padding:16px 18px;border-top:1px solid var(--line)}
.sec:first-child{border-top:0}
.sec-head{display:flex;align-items:baseline;justify-content:space-between;gap:12px;margin-bottom:13px}
.sec-head h4{font-size:var(--t-2xs);font-weight:620}
.sec-head span{font-size:var(--t-2xs);color:var(--faint)}
.bars{display:grid;gap:10px}
.bar{display:grid;grid-template-columns:130px minmax(0,1fr) 38px;gap:12px;align-items:center}
.bar>span{font-size:var(--t-2xs);color:var(--muted)}
.bar>b{font-family:var(--mono);font-variant-numeric:tabular-nums;font-size:var(--t-2xs);font-weight:600;text-align:right}
.track{height:6px;border-radius:999px;background:var(--surface-3);overflow:hidden}
.fill{height:100%;width:0;border-radius:999px;transition:width .55s cubic-bezier(.22,.9,.28,1)}
.v-good .fill{background:var(--good-bar)} .v-good>b{color:var(--good)}
.v-mid .fill{background:var(--mid-bar)}  .v-mid>b{color:var(--mid)}
.v-bad .fill{background:var(--bad-bar)}  .v-bad>b{color:var(--bad)}
.v-flat .fill{background:var(--line-2)}  .v-flat>b{color:var(--muted)}

.risks{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.risk{border:1px solid var(--line);border-radius:var(--r-md);padding:11px 12px;background:var(--surface)}
.risk-top{display:flex;align-items:baseline;justify-content:space-between;gap:8px;margin-bottom:8px}
.risk-top span{font-size:var(--t-2xs);color:var(--muted)}
.risk-top b{font-family:var(--mono);font-variant-numeric:tabular-nums;font-size:var(--t-lg);font-weight:600;letter-spacing:-.03em}
.risk .track{height:4px}
.risk.v-good{background:var(--good-soft);border-color:transparent}
.risk.v-mid{background:var(--mid-soft);border-color:transparent}
.risk.v-bad{background:var(--bad-soft);border-color:transparent}

.tags{display:flex;flex-wrap:wrap;gap:7px}
.tag{
  display:inline-flex;align-items:baseline;gap:6px;padding:5px 9px;border-radius:7px;
  border:1px solid var(--line);background:var(--surface-2);font-size:var(--t-2xs);
}
.tag i{font-style:normal;color:var(--faint)}
.tag b{font-weight:580}

/* ============================================================
   empty / loading / error
============================================================ */
.pad{min-height:520px;display:grid;place-items:center;text-align:center;padding:40px 26px}
.pad-mark{
  width:58px;height:58px;border-radius:16px;background:var(--surface-2);border:1px solid var(--line);
  display:grid;place-items:center;margin:0 auto 15px;color:var(--muted);
}
.pad-mark svg{width:25px;height:25px}
.pad h3{font-size:var(--t-lg);font-weight:600;margin-bottom:6px}
.pad p{font-size:var(--t-xs);color:var(--muted);max-width:42ch;margin:0 auto;line-height:1.55}
.pad-acts{display:flex;gap:9px;justify-content:center;margin-top:18px;flex-wrap:wrap}
.pad-mark.is-bad{background:var(--bad-soft);border-color:transparent;color:var(--bad)}
.detail{
  margin:15px auto 0;max-width:48ch;text-align:left;font-family:var(--mono);font-size:var(--t-2xs);
  line-height:1.5;color:var(--muted);background:var(--surface-2);border:1px solid var(--line);
  border-radius:var(--r-sm);padding:10px 12px;word-break:break-word;
}
.load{padding:24px 18px;min-height:520px}
.load-note{display:flex;align-items:center;gap:9px;font-size:var(--t-xs);color:var(--muted);margin-bottom:22px}
.spin{width:15px;height:15px;border:2px solid var(--line);border-top-color:var(--primary);border-radius:50%;animation:spin .7s linear infinite;flex:none}
@keyframes spin{to{transform:rotate(360deg)}}
.skel{background:var(--surface-2);border-radius:8px;position:relative;overflow:hidden}
.skel::after{content:"";position:absolute;inset:0;transform:translateX(-100%);
  background:linear-gradient(90deg,transparent,rgba(125,135,150,.14),transparent);animation:sweep 1.3s infinite}
@keyframes sweep{100%{transform:translateX(100%)}}
.steps{display:grid;gap:9px;margin-bottom:24px}
.step{display:flex;align-items:center;gap:10px;font-size:var(--t-2xs);color:var(--faint)}
.step.now{color:var(--ink);font-weight:560}
.step.done{color:var(--muted)}
.step-ico{width:16px;height:16px;border-radius:50%;border:1.5px solid var(--line-2);flex:none;display:grid;place-items:center}
.step.now .step-ico{border-color:var(--primary)}
.step.done .step-ico{border-color:var(--good-bar);background:var(--good-bar);color:#fff}
.step-ico svg{width:10px;height:10px}

/* ============================================================
   rewrites
============================================================ */
.rw-intro{padding:18px}
.rw-head{
  display:flex;align-items:center;justify-content:space-between;gap:14px;
  padding:15px 18px;border-bottom:1px solid var(--line);background:var(--surface-2);flex-wrap:wrap;
}
.rw-delta{display:flex;align-items:center;gap:13px}
.rw-box span{display:block;font-size:var(--t-2xs);color:var(--faint)}
.rw-box strong{display:block;font-family:var(--mono);font-variant-numeric:tabular-nums;font-size:26px;font-weight:600;letter-spacing:-.04em;line-height:1.1}
.rw-arrow{color:var(--faint)}
.rw-arrow svg{width:18px;height:18px}
.rw-gain{
  font-family:var(--mono);font-size:var(--t-xs);font-weight:600;padding:3px 8px;border-radius:6px;
}
.rw-gain.up{background:var(--good-soft);color:var(--good)}
.rw-gain.down{background:var(--bad-soft);color:var(--bad)}
.rw-gain.flat{background:var(--surface-3);color:var(--muted)}

.opts{display:grid;gap:9px;padding:18px 18px 0}
.opt{
  width:100%;text-align:left;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:14px;align-items:center;
  padding:12px 14px;border:1px solid var(--line);background:var(--surface);border-radius:var(--r-md);
  transition:border-color .15s,background .15s;
}
.opt:hover{border-color:var(--line-2)}
.opt[aria-pressed="true"]{border-color:var(--primary);background:var(--primary-soft)}
.opt-name{display:flex;align-items:center;gap:7px;font-size:var(--t-2xs);font-weight:620}
.opt-tag{font-size:11px;font-weight:600;padding:1px 6px;border-radius:4px;background:var(--primary-soft);color:var(--primary)}
.opt-title{display:block;font-size:var(--t-2xs);color:var(--muted);margin-top:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.opt-score{display:flex;align-items:baseline;gap:6px}
.opt-score b{font-family:var(--mono);font-variant-numeric:tabular-nums;font-size:var(--t-xl);font-weight:600;letter-spacing:-.03em}
.opt-score i{font-style:normal;font-family:var(--mono);font-size:11px;font-weight:600}
.opt-score i.up{color:var(--good)} .opt-score i.down{color:var(--bad)} .opt-score i.flat{color:var(--muted)}

.edit{padding:18px}
.edit-note{font-size:var(--t-2xs);color:var(--faint);margin-bottom:13px;line-height:1.5;max-width:66ch}
.chips{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:15px}
.chip{display:inline-flex;align-items:center;gap:6px;padding:5px 10px;border-radius:999px;font-size:var(--t-2xs);border:1px solid transparent}
.chip.up{background:var(--good-soft);color:var(--good)}
.chip.down{background:var(--bad-soft);color:var(--bad)}
.chip.neutral{background:var(--surface-2);color:var(--muted);border-color:var(--line)}
details.diff{border:1px solid var(--line);border-radius:var(--r-md);background:var(--surface);overflow:hidden;margin-top:13px}
details.diff summary{padding:11px 14px;font-size:var(--t-2xs);font-weight:580;cursor:pointer;list-style:none;display:flex;align-items:center;gap:8px}
details.diff summary::-webkit-details-marker{display:none}
details.diff summary svg{width:14px;height:14px;color:var(--muted);transition:transform .18s}
details.diff[open] summary svg{transform:rotate(90deg)}
.diff-grid{display:grid;grid-template-columns:1fr 1fr;gap:1px;background:var(--line);border-top:1px solid var(--line)}
.diff-cell{background:var(--surface);padding:14px}
.diff-cell b{display:block;font-size:var(--t-2xs);color:var(--faint);margin-bottom:7px}
.diff-cell p{font-size:var(--t-2xs);line-height:1.6;color:var(--ink-2);white-space:pre-wrap}

/* ============================================================
   history
============================================================ */
.hist{display:grid;gap:9px;padding:18px}
.hrow{
  display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:14px;align-items:center;
  padding:12px 14px;border:1px solid var(--line);border-radius:var(--r-md);background:var(--surface);
}
.hscore{
  width:44px;height:44px;border-radius:10px;display:grid;place-items:center;flex:none;
  font-family:var(--mono);font-variant-numeric:tabular-nums;font-size:var(--t-lg);font-weight:600;letter-spacing:-.03em;
}
.hscore.v-good{background:var(--good-soft);color:var(--good)}
.hscore.v-mid{background:var(--mid-soft);color:var(--mid)}
.hscore.v-bad{background:var(--bad-soft);color:var(--bad)}
.hmeta{min-width:0}
.hmeta b{display:block;font-size:var(--t-2xs);font-weight:560;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.hmeta span{display:block;font-size:var(--t-2xs);color:var(--faint);margin-top:3px}
.hbadge{font-size:11px;padding:1px 6px;border-radius:4px;background:var(--surface-3);color:var(--muted);margin-left:7px}
.hacts{display:flex;gap:7px;flex:none}

/* ============================================================
   method
============================================================ */
.method{padding:20px 18px;max-width:78ch}
.method h4{font-size:var(--t-2xs);font-weight:620;margin:20px 0 7px}
.method h4:first-child{margin-top:0}
.method p{font-size:var(--t-xs);color:var(--muted);line-height:1.65}
.method ul{margin:7px 0 0;padding-left:18px;font-size:var(--t-xs);color:var(--muted);line-height:1.7}
.method code{font-family:var(--mono);font-size:var(--t-2xs);background:var(--surface-3);padding:2px 5px;border-radius:4px;color:var(--ink-2)}
.formula{margin-top:9px;padding:13px;border-radius:var(--r-md);background:var(--surface-2);border:1px solid var(--line);font-family:var(--mono);font-size:var(--t-2xs);line-height:1.9;color:var(--ink-2)}

/* ============================================================
   toasts
============================================================ */
.toasts{position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:80;display:grid;gap:8px;width:min(430px,calc(100vw - 32px))}
.toast{
  display:flex;align-items:flex-start;gap:11px;padding:12px 13px;border-radius:var(--r-md);
  background:var(--ink);color:var(--bg);box-shadow:var(--shadow-3);animation:rise .22s cubic-bezier(.22,.9,.28,1);
}
:root[data-theme="dark"] .toast{background:var(--surface-3);color:var(--ink);border:1px solid var(--line-2)}
@keyframes rise{from{opacity:0;transform:translateY(10px)}}
.toast.out{animation:sink .18s forwards}
@keyframes sink{to{opacity:0;transform:translateY(8px)}}
.toast-ico{width:17px;height:17px;flex:none;margin-top:1px;opacity:.75}
.toast.ok .toast-ico{color:var(--good-bar);opacity:1}
.toast.bad .toast-ico{color:var(--bad-bar);opacity:1}
.toast-copy{flex:1;min-width:0}
.toast b{display:block;font-size:var(--t-2xs);font-weight:620}
.toast span{display:block;font-size:var(--t-2xs);opacity:.72;margin-top:2px;line-height:1.45}
.toast-act{flex:none;align-self:center;height:27px;padding:0 10px;border-radius:6px;border:1px solid currentColor;opacity:.75;font-size:var(--t-2xs);font-weight:580}
.toast-act:hover{opacity:1}
.toast-x{flex:none;width:17px;height:17px;opacity:.55}
.toast-x:hover{opacity:1}

/* ============================================================
   responsive
============================================================ */
@media(max-width:1100px){
  .grid{grid-template-columns:1fr}
  .pad,.load{min-height:320px}
}
@media(max-width:760px){
  .wrap{width:min(100% - 24px,1400px)}
  .brand small{display:none}
  .two{grid-template-columns:1fr}
  .score-top{flex-direction:column;gap:12px}
  .score-num strong{font-size:44px}
  .risks{grid-template-columns:1fr}
  .bar{grid-template-columns:104px minmax(0,1fr) 34px}
  .diff-grid{grid-template-columns:1fr}
  .hrow{grid-template-columns:auto minmax(0,1fr);row-gap:11px}
  .hacts{grid-column:1/-1}
  .tabs{width:100%;overflow-x:auto}
  .acts{flex-wrap:wrap}
  .acts .grow{flex:1 1 100%}
  .rw-head{gap:10px}
}
@media(prefers-reduced-motion:reduce){
  *,*::before,*::after{animation-duration:.01ms !important;animation-iteration-count:1 !important;transition-duration:.01ms !important}
}
@media print{
  .appbar,.setup,.acts,.toasts,.tabs{display:none !important}
  .grid{grid-template-columns:1fr}
  .card{box-shadow:none}
}
</style>
</head>
<body>
<a class="sr" href="#editor">Skip to the editor</a>

<header class="appbar">
  <div class="wrap appbar-in">
    <a class="brand" href="/" aria-label="ThreadPulse">
      <span class="logo" aria-hidden="true">
        <!-- A comment thread: root post, spine, two nested replies.
             Drawn rather than borrowed - it is the shape of the thing
             being measured. -->
        <svg viewBox="0 0 32 32" fill="none">
          <g stroke="currentColor" stroke-width="2.1" stroke-linecap="round" class="logo-lines">
            <path d="M11 11.5v10.2"/>
            <path d="M11 15.6h3.4a2 2 0 0 1 2 2v.6"/>
            <path d="M11 20.8h6.8a2 2 0 0 0 2-2v-.6"/>
          </g>
          <circle cx="11" cy="9.4" r="2.5" fill="currentColor"/>
          <circle cx="16.4" cy="19.6" r="1.6" fill="currentColor"/>
          <circle cx="19.8" cy="16.3" r="1.6" fill="currentColor"/>
        </svg>
      </span>
      <span>
        <b>ThreadPulse</b>
        <small>Runs on your machine</small>
      </span>
    </a>

    <div class="bar-actions">
      <button class="pill" id="setupBtn" aria-expanded="false" aria-controls="setup">
        <span class="dot" id="connDot"></span>
        <span id="connText">No API key</span>
      </button>
      <button class="ibtn" id="themeBtn" aria-label="Switch to dark theme" title="Switch theme">
        <svg id="themeIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11Z"/>
        </svg>
      </button>
    </div>
  </div>
</header>

<div class="setup" id="setup" hidden>
  <div class="wrap setup-in">
    <div class="setup-field">
      <div class="flabel"><label for="apiKey">TypeSafe API key</label></div>
      <input class="input" id="apiKey" type="password" autocomplete="off" spellcheck="false" placeholder="sk-...">
    </div>
    <button class="btn btn-primary" id="testBtn">Test connection</button>
    <button class="btn" id="forgetBtn">Forget key</button>
    <p class="setup-note">Kept in this browser only, sent straight to TypeSafe with each request, never written to disk or printed in the terminal. Without a key you can still use offline scoring, which runs a local estimate and calls nothing.</p>
  </div>
</div>

<main class="wrap grid">

  <!-- ==================== editor ==================== -->
  <section class="card" id="editor">
    <div class="card-head">
      <div>
        <h2>Draft</h2>
        <p class="sub" id="saveState">Saved on this device as you type</p>
      </div>
      <button class="btn btn-sm" id="sampleBtn">Fill with example</button>
    </div>

    <div class="card-body">
      <div class="two">
        <div class="field">
          <div class="flabel"><label for="subreddit">Subreddit</label></div>
          <div class="pre-wrap">
            <span class="pre" aria-hidden="true">r/</span>
            <input class="input" id="subreddit" placeholder="SideProject" autocomplete="off" spellcheck="false">
          </div>
        </div>
        <div class="field">
          <div class="flabel"><label for="authorContext">Your angle</label></div>
          <select class="input" id="authorContext">
            <option value="not_provided">Not specified</option>
            <option value="creator_founder">I made the thing</option>
            <option value="regular_member">Just a member here</option>
            <option value="question">I need an answer</option>
            <option value="news">Sharing news or info</option>
          </select>
        </div>
      </div>

      <div class="field">
        <div class="flabel"><label for="title">Title</label><span class="count" id="titleCount">0/300</span></div>
        <input class="input" id="title" maxlength="300" placeholder="The title exactly as you would post it" autocomplete="off">
        <p class="hint" id="titleHint">Reddit cuts titles at 300 characters.</p>
      </div>

      <div class="field">
        <div class="flabel"><label for="body">Body</label><span class="count" id="bodyCount">0 characters</span></div>
        <textarea class="input" id="body" placeholder="The post itself. Leave empty for a link or image post."></textarea>
      </div>

      <div class="field">
        <div class="srow">
          <div class="srow-copy">
            <b>Post has an image</b>
            <small>Describe it so the model can judge it</small>
          </div>
          <span class="switch">
            <input id="imageToggle" type="checkbox" role="switch" aria-label="Post has an image">
            <span class="slider" aria-hidden="true"></span>
          </span>
        </div>

        <div id="imageArea" hidden style="margin-top:12px">
          <div class="drop" id="drop">
            <input id="imageInput" type="file" accept="image/*" aria-label="Choose an image to preview">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 16V4m0 0L8 8m4-4 4 4"/><path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>
            </svg>
            <b>Drop an image or choose a file</b>
            <span>Preview only. The picture never leaves this machine.</span>
          </div>
          <div class="thumb" id="thumb" hidden>
            <img id="thumbImg" alt="Preview of the image attached to your draft">
            <div class="thumb-bar">
              <span id="thumbMeta"></span>
              <button class="btn btn-sm" id="removeImg" type="button">Remove</button>
            </div>
          </div>
          <div class="field" style="margin-top:12px">
            <div class="flabel"><label for="imageNotes">What the image shows</label></div>
            <input class="input" id="imageNotes" placeholder="A dashboard screenshot with the weekly chart" autocomplete="off">
            <p class="hint">Only this description is scored, so make it match what a reader would see.</p>
          </div>
        </div>
      </div>

      <div class="acts">
        <button class="btn btn-primary grow" id="analyzeBtn">
          <span id="analyzeText">Score this draft</span>
          <span class="kbd" id="kbdHint" aria-hidden="true">Ctrl+Enter</span>
        </button>
        <button class="btn" id="demoBtn" title="Score offline with a local estimate">Offline</button>
        <button class="btn btn-ico" id="clearBtn" aria-label="Clear the draft" title="Clear the draft">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 7h16"/><path d="M9.5 7V4.8A.8.8 0 0 1 10.3 4h3.4a.8.8 0 0 1 .8.8V7"/><path d="M6.5 7 7.4 20h9.2L17.5 7"/><path d="M10.5 11v5M13.5 11v5"/>
          </svg>
        </button>
      </div>
    </div>
  </section>

  <!-- ==================== readout ==================== -->
  <section class="card">
    <div class="card-head">
      <div class="tabs" role="tablist" aria-label="Readout views">
        <button class="tab" role="tab" id="tabReadingBtn" aria-controls="tabReading" aria-selected="true">Reading</button>
        <button class="tab" role="tab" id="tabRewritesBtn" aria-controls="tabRewrites" aria-selected="false">Rewrites</button>
        <button class="tab" role="tab" id="tabHistoryBtn" aria-controls="tabHistory" aria-selected="false">
          History <span class="badge" id="histCount">0</span>
        </button>
        <button class="tab" role="tab" id="tabMethodBtn" aria-controls="tabMethod" aria-selected="false">Method</button>
      </div>
      <span class="sub" id="readoutSub">Nothing scored yet</span>
    </div>

    <!-- ---------- reading ---------- -->
    <div class="panel on" id="tabReading" role="tabpanel" aria-labelledby="tabReadingBtn">

      <div id="viewEmpty">
        <div class="pad">
          <div>
            <div class="pad-mark" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
                <path d="M7 5.5v13"/><path d="M7 10h4a2 2 0 0 1 2 2v.7"/><path d="M7 17h7.5a2 2 0 0 0 2-2v-.7"/>
                <circle cx="7" cy="4" r="1.6" fill="currentColor" stroke="none"/>
              </svg>
            </div>
            <h3>No reading yet</h3>
            <p>Write a title and body on the left, then score it. Every run is kept, so you can watch the number move as you rewrite.</p>
            <div class="pad-acts">
              <button class="btn btn-primary" id="emptySample">Use the example draft</button>
              <button class="btn" id="emptyDemo">Score offline</button>
            </div>
          </div>
        </div>
      </div>

      <div id="viewLoading" hidden>
        <div class="load">
          <div class="load-note"><span class="spin"></span><span id="loadingText">Asking TypeSafe for eight judgements</span></div>
          <div style="display:flex;gap:20px;margin-bottom:26px;align-items:flex-start">
            <div class="skel" style="width:96px;height:56px"></div>
            <div style="flex:1;display:grid;gap:9px">
              <div class="skel" style="height:20px;width:52%"></div>
              <div class="skel" style="height:12px;width:86%"></div>
              <div class="skel" style="height:12px;width:62%"></div>
            </div>
          </div>
          <div class="skel" style="height:9px;margin-bottom:30px"></div>
          <div class="skel" style="height:12px;width:22%;margin-bottom:14px"></div>
          <div class="skel" style="height:6px;margin-bottom:12px"></div>
          <div class="skel" style="height:6px;margin-bottom:12px"></div>
          <div class="skel" style="height:6px;margin-bottom:26px"></div>
          <div class="skel" style="height:70px"></div>
        </div>
      </div>

      <div id="viewError" hidden>
        <div class="pad">
          <div>
            <div class="pad-mark is-bad" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 8v5"/><path d="M12 16.5h.01"/><circle cx="12" cy="12" r="9"/>
              </svg>
            </div>
            <h3 id="errTitle">The request did not go through</h3>
            <p id="errText"></p>
            <p class="detail" id="errDetail" hidden></p>
            <div class="pad-acts">
              <button class="btn btn-primary" id="retryBtn">Try again</button>
              <button class="btn" id="errKeyBtn">Check API key</button>
            </div>
          </div>
        </div>
      </div>

      <div id="viewResult" hidden>
        <div class="score">
          <div class="score-top">
            <div class="score-num" id="scoreNumWrap">
              <strong id="scoreNum">0</strong><span>/100</span>
            </div>
            <div class="score-copy">
              <h3 id="verdictTitle">—</h3>
              <p id="verdictText">—</p>
            </div>
          </div>

          <div class="scale">
            <div class="scale-marks" id="scaleMarks"></div>
            <div class="scale-track">
              <span class="seg seg-bad" style="width:45%"></span>
              <span class="seg seg-mid" style="width:17%"></span>
              <span class="seg seg-ok" style="width:16%"></span>
              <span class="seg seg-good" style="width:22%"></span>
            </div>
            <div class="scale-ticks" id="scaleTicks"></div>
          </div>
        </div>

        <div class="fix" id="fixBox">
          <div class="fix-copy">
            <b id="fixTitle"></b>
            <p id="fixText"></p>
          </div>
        </div>

        <div class="sec">
          <div class="sec-head"><h4>What is working</h4><span>Higher is better</span></div>
          <div class="bars">
            <div class="bar" id="rowTitle"><span>Title strength</span><div class="track"><div class="fill" id="barTitle"></div></div><b id="valTitle">0</b></div>
            <div class="bar" id="rowDiscussion"><span>Reason to reply</span><div class="track"><div class="fill" id="barDiscussion"></div></div><b id="valDiscussion">0</b></div>
            <div class="bar" id="rowRelevance"><span>Fit with the sub</span><div class="track"><div class="fill" id="barRelevance"></div></div><b id="valRelevance">0</b></div>
          </div>
        </div>

        <div class="sec">
          <div class="sec-head"><h4>What could get it buried</h4><span>Lower is better</span></div>
          <div class="risks">
            <div class="risk" id="riskPromo"><div class="risk-top"><span>Reads as promo</span><b id="valPromo">0</b></div><div class="track"><div class="fill" id="barPromo"></div></div></div>
            <div class="risk" id="riskClick"><div class="risk-top"><span>Overpromises</span><b id="valClick">0</b></div><div class="track"><div class="fill" id="barClick"></div></div></div>
            <div class="risk" id="riskMod"><div class="risk-top"><span>Mod trouble</span><b id="valMod">0</b></div><div class="track"><div class="fill" id="barMod"></div></div></div>
          </div>
        </div>

        <div class="sec">
          <div class="sec-head"><h4>How readers will take it</h4><span>Top matches</span></div>
          <div class="bars" id="intentBars" style="margin-bottom:14px"></div>
          <div class="tags">
            <span class="tag"><i>Reads as</i><b id="tagIntent">—</b></span>
            <span class="tag"><i>Pulls on</i><b id="tagDriver">—</b></span>
            <span class="tag"><i>Model certainty</i><b id="tagConf">—</b></span>
          </div>
        </div>

        <div class="sec">
          <div class="sec-head"><h4>Underneath</h4><span id="modelNote"></span></div>
          <div style="display:flex;gap:9px;flex-wrap:wrap">
            <button class="btn btn-sm" id="rewriteJump">Rewrite this draft</button>
            <button class="btn btn-sm" id="copyReportBtn">Copy summary</button>
            <button class="btn btn-sm" id="downloadBtn">Download JSON</button>
            <button class="btn btn-sm" id="rawBtn" aria-expanded="false" aria-controls="rawWrap">Raw response</button>
          </div>
          <div id="rawWrap" hidden style="margin-top:12px">
            <pre class="detail" style="max-width:none;max-height:300px;overflow:auto" id="rawJson"></pre>
          </div>
        </div>
      </div>
    </div>

    <!-- ---------- rewrites ---------- -->
    <div class="panel" id="tabRewrites" role="tabpanel" aria-labelledby="tabRewritesBtn">

      <div id="rwEmpty">
        <div class="pad">
          <div>
            <div class="pad-mark" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 17.5 14.6 6.9a2.2 2.2 0 0 1 3.1 3.1L7.1 20.6 3 21.6l1-4.1Z"/><path d="M13 8.5 16 11.5"/>
              </svg>
            </div>
            <h3>Nothing to rewrite yet</h3>
            <p>Score a draft first. Rewrites are built from your own sentences and graded against that reading, so there is something to beat.</p>
            <div class="pad-acts"><button class="btn btn-primary" id="rwGoScore">Go to the draft</button></div>
          </div>
        </div>
      </div>

      <div id="rwLoading" hidden>
        <div class="load">
          <div class="steps" id="rwSteps"></div>
          <div class="skel" style="height:60px;margin-bottom:12px"></div>
          <div class="skel" style="height:60px;margin-bottom:12px"></div>
          <div class="skel" style="height:60px"></div>
        </div>
      </div>

      <div id="rwResult" hidden>
        <div class="rw-head">
          <div class="rw-delta">
            <div class="rw-box"><span>Your draft</span><strong id="beforeScore">—</strong></div>
            <span class="rw-arrow" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h15m-5-5 5 5-5 5"/></svg>
            </span>
            <div class="rw-box"><span id="afterLabel">Best rewrite</span><strong id="afterScore">—</strong></div>
            <span class="rw-gain flat" id="gain">—</span>
          </div>
          <button class="btn btn-sm" id="regenBtn">Build again</button>
        </div>

        <div class="opts" id="opts" role="group" aria-label="Rewrite options"></div>

        <div class="edit">
          <p class="edit-note" id="editNote"></p>
          <div class="chips" id="gainChips"></div>

          <div class="field">
            <div class="flabel"><label for="rwTitle">Title</label><span class="count" id="rwTitleCount">0/300</span></div>
            <input class="input" id="rwTitle" maxlength="300">
          </div>
          <div class="field">
            <div class="flabel"><label for="rwBody">Body</label><span class="count" id="rwBodyCount">0 characters</span></div>
            <textarea class="input" id="rwBody" style="min-height:190px"></textarea>
          </div>

          <details class="diff">
            <summary>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg>
              Compare with your draft
            </summary>
            <div class="diff-grid">
              <div class="diff-cell"><b>Yours</b><p id="originalPreview"></p></div>
              <div class="diff-cell"><b>Rewrite</b><p id="improvedPreview"></p></div>
            </div>
          </details>

          <div class="acts">
            <button class="btn btn-primary grow" id="applyBtn">Use this and score it</button>
            <button class="btn" id="copyImprovedBtn">Copy</button>
          </div>
        </div>
      </div>
    </div>

    <!-- ---------- history ---------- -->
    <div class="panel" id="tabHistory" role="tabpanel" aria-labelledby="tabHistoryBtn">
      <div id="histEmpty">
        <div class="pad">
          <div>
            <div class="pad-mark" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>
              </svg>
            </div>
            <h3>No runs saved yet</h3>
            <p>Every draft you score is kept here on this machine, with its score and the reading behind it. Nothing is uploaded.</p>
          </div>
        </div>
      </div>
      <div id="histList" hidden>
        <div class="hist" id="histRows"></div>
        <div class="sec" style="display:flex;gap:9px;flex-wrap:wrap">
          <button class="btn btn-sm" id="exportHist">Export all runs</button>
          <button class="btn btn-sm" id="clearHist">Clear history</button>
        </div>
      </div>
    </div>

    <!-- ---------- method ---------- -->
    <div class="panel" id="tabMethod" role="tabpanel" aria-labelledby="tabMethodBtn">
      <div class="method">
        <h4>What is actually asked</h4>
        <p>TypeSafe is a judge, not a writer. One draft goes out with eight independent judgements attached: two labels (how the post reads, what pulls people in), three graded qualities, and three risk checks. Nothing here is one opinion averaged into a number.</p>

        <h4>The arithmetic</h4>
        <div class="formula">
quality = 0.34·title + 0.34·reply + 0.32·fit<br>
risk&nbsp;&nbsp;&nbsp;&nbsp;= 0.42·promo + 0.25·overpromise + 0.33·mod<br>
score&nbsp;&nbsp;&nbsp;= quality × (1 − 0.55·risk)<br>
<br>
if promo &gt; 0.78 or mod &gt; 0.68 → score is capped at 40
        </div>
        <p style="margin-top:10px">Risk multiplies rather than adds. In the previous version it was an 18% additive term, which meant a post could be flagged as likely to be removed and still score 78 — and fixing the removal risk entirely bought about 10 points. Now the thing that gets a post deleted is the thing that moves the number.</p>

        <h4>What the bands mean</h4>
        <ul>
          <li><b>78 and up</b> — worth posting as is.</li>
          <li><b>62 to 77</b> — solid, with one signal left on the table.</li>
          <li><b>45 to 61</b> — readable, but nobody has a reason to reply yet.</li>
          <li><b>Under 45</b> — the point is not landing, or the post will be pulled.</li>
        </ul>

        <h4>How rewrites are built</h4>
        <p>Since the model cannot write, every rewrite is assembled from your own sentences. Seven title treatments and six body treatments are generated, aimed at whichever signal came back weakest. They are scored separately, which means titles and bodies can be mixed — the winning combination is usually not one that was written as a pair.</p>
        <p style="margin-top:8px">The most promising three combinations are then re-scored in full, against the same eight judgements as your original, so the number you are shown is measured rather than predicted. Two API calls, roughly forty combinations explored.</p>

        <h4>Offline mode</h4>
        <p>Offline scoring runs a small local heuristic. No network, no key, no model. Useful for a feel of the tool, not for a real read.</p>

        <h4>Shortcuts</h4>
        <ul>
          <li><code id="scKey">Ctrl</code> + <code>Enter</code> — score the draft</li>
          <li><code>1</code> to <code>4</code> — switch tab, when not typing</li>
        </ul>

        <h4>Where things are kept</h4>
        <p>The server in this file only relays requests to TypeSafe. Your key, your draft and your run history live in this browser's local storage and are never sent anywhere else. Images stay in the page and are never uploaded — only the description you write about them is scored.</p>
      </div>
    </div>
  </section>
</main>

<div class="toasts" id="toasts" role="status" aria-live="polite"></div>
<script>
"use strict";

/* ============================================================
   helpers
============================================================ */
var $ = function (id) { return document.getElementById(id); };
var clamp = function (x) { var n = Number(x); return Math.max(0, Math.min(1, isFinite(n) ? n : 0)); };
var pct = function (x) { return Math.round(clamp(x) * 100); };
var esc = function (s) {
  return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
};
var pretty = function (s) {
  return String(s || "\u2014").split("_").join(" ").replace(/^\w/, function (m) { return m.toUpperCase(); });
};
var isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
var MOD = isMac ? "\u2318" : "Ctrl";

var store = {
  get: function (k, f) {
    try { var v = localStorage.getItem("threadpulse." + k); return v === null ? f : JSON.parse(v); }
    catch (e) { return f; }
  },
  set: function (k, v) { try { localStorage.setItem("threadpulse." + k, JSON.stringify(v)); } catch (e) {} },
  del: function (k) { try { localStorage.removeItem("threadpulse." + k); } catch (e) {} }
};

function timeAgo(ts) {
  var d = Date.now() - ts;
  if (d < 60000) return "just now";
  if (d < 3600000) { var m = Math.round(d / 60000); return m + (m === 1 ? " minute ago" : " minutes ago"); }
  if (d < 86400000) { var h = Math.round(d / 3600000); return h + (h === 1 ? " hour ago" : " hours ago"); }
  var day = Math.round(d / 86400000);
  return day + (day === 1 ? " day ago" : " days ago");
}

/* ============================================================
   state
============================================================ */
var current = null;
var runLog = store.get("history", []);
var rewrite = { options: [], selected: null, edited: false, source: null };
var lastAction = null;
var busy = false;

/* ============================================================
   toasts
============================================================ */
var ICO = {
  ok: '<path d="m5 12.5 4.5 4.5L19 7"/>',
  bad: '<circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16.5h.01"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.5h.01"/>'
};
function toast(kind, title, text, action) {
  var el = document.createElement("div");
  el.className = "toast " + kind;
  var h = '<svg class="toast-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' +
    (ICO[kind] || ICO.info) + "</svg><div class=\"toast-copy\"><b>" + esc(title) + "</b>" +
    (text ? "<span>" + esc(text) + "</span>" : "") + "</div>";
  if (action) h += '<button class="toast-act" type="button">' + esc(action.label) + "</button>";
  h += '<button class="toast-x" type="button" aria-label="Dismiss"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m6 6 12 12M18 6 6 18"/></svg></button>';
  el.innerHTML = h;
  var close = function () { el.classList.add("out"); setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 200); };
  if (action) el.querySelector(".toast-act").addEventListener("click", function () { close(); action.run(); });
  el.querySelector(".toast-x").addEventListener("click", close);
  $("toasts").appendChild(el);
  setTimeout(close, action ? 8000 : 4000);
  while ($("toasts").children.length > 3) $("toasts").removeChild($("toasts").firstChild);
}

/* ============================================================
   theme
============================================================ */
var SUN = '<circle cx="12" cy="12" r="4.2"/><path d="M12 2.6v2.2M12 19.2v2.2M4.2 12H2M22 12h-2.2M6.3 6.3 4.8 4.8M19.2 19.2l-1.5-1.5M17.7 6.3l1.5-1.5M4.8 19.2l1.5-1.5"/>';
var MOON = '<path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11Z"/>';
function applyTheme(t) {
  document.documentElement.setAttribute("data-theme", t);
  $("themeIcon").innerHTML = t === "dark" ? SUN : MOON;
  var next = t === "dark" ? "light" : "dark";
  $("themeBtn").setAttribute("aria-label", "Switch to " + next + " theme");
  $("themeBtn").title = "Switch to " + next + " theme";
}
applyTheme(store.get("theme", null) ||
  (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
$("themeBtn").addEventListener("click", function () {
  var t = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
  applyTheme(t); store.set("theme", t);
});

/* ============================================================
   setup strip + key
============================================================ */
function setConn(kind, text) { $("connDot").className = "dot " + (kind || ""); $("connText").textContent = text; }
function openSetup(open) {
  $("setup").hidden = !open;
  $("setupBtn").setAttribute("aria-expanded", open ? "true" : "false");
  if (open) $("apiKey").focus();
}
$("setupBtn").addEventListener("click", function () { openSetup($("setup").hidden); });

var storedKey = store.get("key", "");
if (storedKey) { $("apiKey").value = storedKey; setConn("", "Key saved"); } else setConn("", "No API key");
$("apiKey").addEventListener("input", function () {
  var v = $("apiKey").value.trim();
  if (v) { store.set("key", v); setConn("", "Key saved"); } else { store.del("key"); setConn("", "No API key"); }
});
$("forgetBtn").addEventListener("click", function () {
  $("apiKey").value = ""; store.del("key"); setConn("", "No API key");
  toast("info", "Key removed", "It is gone from this browser.");
});
function key() { return $("apiKey").value.trim(); }

/* ============================================================
   API
============================================================ */
function api(payload) {
  if (!key()) return Promise.reject(new Error("No API key is set."));
  return fetch("/api/typesafe", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-TypeSafe-Key": key() },
    body: JSON.stringify(payload)
  }).then(function (res) {
    return res.json().catch(function () { return {}; }).then(function (data) {
      if (!res.ok) {
        var msg = data.error || (data.detail && data.detail.message) || data.detail || data.message ||
          ("TypeSafe replied with status " + res.status + ".");
        if (res.status === 401 || res.status === 403) msg = "TypeSafe rejected the key.";
        var e = new Error(msg); e.status = res.status; throw e;
      }
      return data;
    });
  });
}
$("testBtn").addEventListener("click", function () {
  if (!key()) { toast("bad", "Add a key first", "Paste your TypeSafe key in the box."); $("apiKey").focus(); return; }
  setConn("busy", "Testing"); $("testBtn").disabled = true;
  api({ state: "ThreadPulse connection test", model: "jev-latest",
        questions: { ok: { type: "noul", instructions: "Is this text clearly an API connection test?" } } })
    .then(function () { setConn("ok", "Connected"); toast("ok", "Connected", "TypeSafe answered as expected."); openSetup(false); })
    .catch(function (e) { setConn("bad", "Not connected"); toast("bad", "Connection failed", e.message); })
    .then(function () { $("testBtn").disabled = false; });
});

/* ============================================================
   tabs
============================================================ */
var TABS = ["Reading", "Rewrites", "History", "Method"];
function showTab(name) {
  TABS.forEach(function (t) {
    var on = t === name;
    $("tab" + t).classList.toggle("on", on);
    $("tab" + t + "Btn").setAttribute("aria-selected", on ? "true" : "false");
  });
}
TABS.forEach(function (t) {
  $("tab" + t + "Btn").addEventListener("click", function () { showTab(t); });
});

/* ============================================================
   editor: autosave, counters
============================================================ */
var FIELDS = ["subreddit", "authorContext", "title", "body", "imageNotes"];
var saveTimer = null;
function saveDraft() {
  var d = {}; FIELDS.forEach(function (id) { d[id] = $(id).value; });
  d.imageToggle = $("imageToggle").checked;
  store.set("draft", d);
  $("saveState").textContent = "Saved just now";
  clearTimeout(saveTimer);
  saveTimer = setTimeout(function () { $("saveState").textContent = "Saved on this device as you type"; }, 2200);
}
function loadDraft() {
  var d = store.get("draft", null); if (!d) return;
  FIELDS.forEach(function (id) { if (typeof d[id] === "string") $(id).value = d[id]; });
  if (d.imageToggle) { $("imageToggle").checked = true; $("imageArea").hidden = false; }
}
function counterFor(el, countEl, max) {
  var n = el.value.length;
  if (max) {
    countEl.textContent = n + "/" + max;
    countEl.className = "count" + (n >= max ? " over" : n > max - 40 ? " warn" : "");
  } else {
    countEl.textContent = n === 1 ? "1 character" : n.toLocaleString() + " characters";
  }
}
function updateCounters() {
  counterFor($("title"), $("titleCount"), 300);
  counterFor($("body"), $("bodyCount"));
  var n = $("title").value.length, h = $("titleHint");
  if (n === 0) { h.textContent = "Reddit cuts titles at 300 characters."; h.className = "hint"; }
  else if (n < 15) { h.textContent = "Short titles rarely give anyone a reason to click."; h.className = "hint"; }
  else if (n >= 300) { h.textContent = "At the limit. Reddit will not take any more."; h.className = "hint bad"; }
  else { h.textContent = "Reddit cuts titles at 300 characters."; h.className = "hint"; }
}
function syncButtons() {
  $("analyzeBtn").disabled = busy || !$("title").value.trim();
  $("demoBtn").disabled = busy;
}
FIELDS.forEach(function (id) {
  $(id).addEventListener("input", function () { updateCounters(); syncButtons(); saveDraft(); });
  $(id).addEventListener("change", saveDraft);
});
$("imageToggle").addEventListener("change", function () { $("imageArea").hidden = !this.checked; saveDraft(); });

/* image preview */
function showImage(file) {
  if (!file) return;
  if (!/^image\//.test(file.type)) { toast("bad", "Not an image", "Pick a PNG, JPG, GIF or WebP."); return; }
  if (file.size > 12 * 1024 * 1024) { toast("bad", "Image too large", "Keep the preview under 12 MB."); return; }
  var r = new FileReader();
  r.onload = function (ev) {
    $("thumbImg").src = ev.target.result;
    $("thumbMeta").textContent = file.name + " \u00b7 " + Math.max(1, Math.round(file.size / 1024)) + " KB";
    $("thumb").hidden = false; $("drop").hidden = true;
    if (!$("imageNotes").value.trim()) $("imageNotes").focus();
  };
  r.readAsDataURL(file);
}
$("imageInput").addEventListener("change", function (e) { showImage(e.target.files && e.target.files[0]); });
$("removeImg").addEventListener("click", function () {
  $("imageInput").value = ""; $("thumbImg").removeAttribute("src");
  $("thumb").hidden = true; $("drop").hidden = false;
});
["dragenter", "dragover"].forEach(function (ev) {
  $("drop").addEventListener(ev, function (e) { e.preventDefault(); $("drop").classList.add("on"); });
});
["dragleave", "drop"].forEach(function (ev) {
  $("drop").addEventListener(ev, function (e) { e.preventDefault(); $("drop").classList.remove("on"); });
});
$("drop").addEventListener("drop", function (e) {
  showImage(e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]);
});

function fillSample() {
  $("subreddit").value = "SideProject";
  $("authorContext").value = "creator_founder";
  $("title").value = "I built the modern notepad.exe, but for Markdown";
  $("body").value = "Every markdown app wants vaults, accounts, sync. I wanted the opposite: open a file, write, close it. So I built a tiny editor that starts in under a second and saves plain .md files wherever you put them. No login, no database.\n\nWhat is the one thing your current markdown editor does that you wish it would stop doing?";
  updateCounters(); syncButtons(); saveDraft();
}
$("sampleBtn").addEventListener("click", fillSample);
$("emptySample").addEventListener("click", function () { fillSample(); $("title").focus(); });
$("rewriteJump").addEventListener("click", function () { showTab("Rewrites"); buildRewrites(); });

$("clearBtn").addEventListener("click", function () {
  if (!$("title").value && !$("body").value) { $("title").focus(); return; }
  var snap = {}; FIELDS.forEach(function (id) { snap[id] = $(id).value; });
  var hadImg = $("imageToggle").checked;
  FIELDS.forEach(function (id) { $(id).value = id === "authorContext" ? "not_provided" : ""; });
  $("imageToggle").checked = false; $("imageArea").hidden = true; $("removeImg").click();
  updateCounters(); syncButtons(); saveDraft(); $("title").focus();
  toast("info", "Draft cleared", "Your run runLog is untouched.", {
    label: "Undo", run: function () {
      FIELDS.forEach(function (id) { $(id).value = snap[id]; });
      $("imageToggle").checked = hadImg; $("imageArea").hidden = !hadImg;
      updateCounters(); syncButtons(); saveDraft();
    }
  });
});

function getState() {
  var sub = $("subreddit").value.trim().replace(/^\/?r\//i, "");
  return {
    subreddit_or_audience: sub ? "r/" + sub : "not provided",
    post_context: $("authorContext").value,
    title: $("title").value.trim(),
    body: $("body").value.trim() || "not provided",
    image_context: $("imageToggle").checked
      ? ($("imageNotes").value.trim() || "an image is attached but the author did not describe it")
      : "not used"
  };
}

/* ============================================================
   questions
============================================================ */
var Q_TITLE = {
  type: "score",
  instructions: "Judge the Reddit title for clarity, specificity, accuracy, and natural reader interest. Do not reward empty clickbait.",
  criteria: ["Weak, vague, confusing, generic, or misleading.", "Understandable but ordinary or missing useful specificity.",
             "Clear, specific, accurate, and naturally interesting.", "Exceptionally crisp and compelling while accurately setting expectations."]
};
var Q_DISCUSSION = {
  type: "score",
  instructions: "How much genuine discussion or useful response does this post naturally invite?",
  criteria: ["Little reason for readers to reply.", "Some readers may have something useful to add.",
             "Clear openings for useful replies or conversation.", "Many relevant readers are likely to have substantive experiences, opinions, or follow-up questions."]
};
var Q_RELEVANCE = {
  type: "score",
  instructions: "How well is this post targeted to the stated subreddit or audience? If none is provided, judge whether it still has a clear audience.",
  criteria: ["Poorly targeted or audience unclear.", "Somewhat relevant but broad.",
             "Clearly relevant to a recognizable audience.", "Highly specific and naturally suited to the stated community."]
};
var Q_PROMO = { type: "noul", instructions: "Does this post primarily read as self-promotion, solicitation, advertising, or traffic acquisition rather than contribution?" };
var Q_CLICK = { type: "noul", instructions: "Is the title meaningfully clickbait, misleading, manipulative, or disproportionately hyped compared with the content?" };
var Q_MOD = { type: "noul", instructions: "Based only on the supplied content, is there a clear common subreddit moderation risk such as spam, solicitation, low effort, unclear relevance, misleading framing, or excessive self-promotion?" };

var analysisQuestions = {
  post_intent: {
    type: "choice",
    instructions: "What is the primary intent of this Reddit post?",
    criteria: {
      question: "Primarily asks a factual or open question.",
      discussion: "Primarily invites opinions, experiences, debate, or conversation.",
      showcase: "Primarily shares something the author made, achieved, found, or experienced.",
      help_advice: "Primarily asks for practical help, troubleshooting, or advice.",
      information: "Primarily shares useful information, news, a guide, or explanation.",
      promotion: "Primarily promotes, sells, recruits, solicits, or drives traffic.",
      other: "None of the other categories fit well."
    }
  },
  engagement_driver: {
    type: "choice",
    instructions: "Which single factor most naturally gives readers a reason to engage with this Reddit post?",
    criteria: {
      utility: "Practical usefulness or learning value.",
      curiosity: "A genuine information gap.",
      community_relevance: "Strong relevance to the stated subreddit or audience.",
      novelty: "Something notably new, unusual, or original.",
      emotion: "A relatable emotional experience.",
      controversy: "Likely disagreement or debate.",
      weak_none: "No clear engagement driver."
    }
  },
  title_strength: Q_TITLE,
  discussion_potential: Q_DISCUSSION,
  community_relevance: Q_RELEVANCE,
  self_promotion: Q_PROMO,
  clickbait: Q_CLICK,
  moderation_risk: Q_MOD
};

/* ============================================================
   scoring
============================================================ */
function scorePct(a) {
  if (!a) return 0;
  var n = Object.keys(a.legend || {}).length || 4;
  return n > 1 ? clamp(Number(a.score) / (n - 1)) : 0;
}
function composeRaw(t, d, r, p, c, m) {
  var quality = 0.34 * t + 0.34 * d + 0.32 * r;
  var risk = 0.42 * p + 0.25 * c + 0.33 * m;
  var score = quality * (1 - 0.55 * risk);
  var capped = m > 0.68 || p > 0.78;
  if (capped) score = Math.min(score, 0.40);
  return { title: t, discussion: d, relevance: r, promo: p, click: c, mod: m,
           quality: quality, risk: risk, capped: capped, potential: clamp(score) };
}
function compose(a) {
  return composeRaw(
    scorePct(a.title_strength), scorePct(a.discussion_potential), scorePct(a.community_relevance),
    clamp(a.self_promotion && a.self_promotion.noul),
    clamp(a.clickbait && a.clickbait.noul),
    clamp(a.moderation_risk && a.moderation_risk.noul)
  );
}
function verdict(s) {
  if (s.capped) return ["Likely to be removed",
    "Whatever else is good here, this reads enough like promotion or rule-breaking that a mod or the sub's own readers will bury it."];
  if (s.potential >= 0.78) return ["Ready to post", "Clear value, the right audience, and an obvious reason to reply."];
  if (s.potential >= 0.62) return ["Nearly there", "A good draft with one signal still left on the table."];
  if (s.potential >= 0.45) return ["Needs a hook", "Perfectly readable, but nobody has been given a reason to reply."];
  return ["Not landing yet", "The point of the post is not coming through to a reader skimming a feed."];
}
function scoreBand(v) { return v >= 0.62 ? "good" : v >= 0.45 ? "mid" : "bad"; }
function qualBand(v) { return v >= 0.67 ? "good" : v >= 0.4 ? "mid" : "bad"; }
function riskBand(v) { return v < 0.34 ? "good" : v < 0.67 ? "mid" : "bad"; }

var ADVICE = {
  promo: ["Promotion is the thing holding this back",
    "Lead with what you learned or what surprised you, not with what you built. Drop the product name from the title, cut any link from the body, and let people ask for it in the comments."],
  mod: ["A mod is likely to pull this",
    "Check the sub's rules on self-promotion and low-effort posts. Many subs want this kind of post in a weekly thread instead, which usually gets a warmer response anyway."],
  click: ["The title promises more than the body delivers",
    "Bring the title down to exactly what a reader will find. Overpromising costs you more in downvotes than the extra clicks are worth."],
  title: ["The title is doing the least work",
    "Say what the thing is and who it is for inside the first six words. Specifics beat intrigue: a number, a constraint, or an unexpected detail."],
  discussion: ["Nobody has been given a reason to reply",
    "End with one concrete question a reader can answer from their own experience. Not \"thoughts?\" but something only someone who has done this could answer."],
  relevance: ["It is not clearly aimed at this sub",
    "Use the words this community already uses, and reference something specific to it. If you cannot, a smaller and more specific sub will do better than a big one."],
  none: ["Nothing obvious left to fix",
    "Every signal is in good shape. Rewrites may still find a couple of points, but this is ready as it stands."]
};
function biggestFix(s) {
  var risks = [["promo", s.promo], ["mod", s.mod], ["click", s.click]].sort(function (a, b) { return b[1] - a[1]; });
  var quals = [["title", s.title], ["discussion", s.discussion], ["relevance", s.relevance]].sort(function (a, b) { return a[1] - b[1]; });
  if (s.capped) return { key: s.mod > 0.68 ? "mod" : "promo", sev: "bad" };
  if (risks[0][1] > 0.5) return { key: risks[0][0], sev: risks[0][1] > 0.67 ? "bad" : "mid" };
  if (quals[0][1] < 0.7) return { key: quals[0][0], sev: quals[0][1] < 0.4 ? "bad" : "mid" };
  return { key: "none", sev: "ok" };
}

/* ============================================================
   render
============================================================ */
var BANDS = [[0, 45, "will be pulled"], [45, 62, "thin"], [62, 78, "solid"], [78, 100, "ready"]];
function renderScale(score) {
  $("scaleTicks").innerHTML = BANDS.map(function (b) {
    return '<span class="tick" style="left:' + ((b[0] + b[1]) / 2) + '%"><i>' + b[2] + "</i></span>";
  }).join("");
  var ghosts = runLog.slice(0, 4).filter(function (h) { return h.score !== score; }).slice(0, 3);
  var marks = ghosts.map(function (h) {
    return '<span class="mark ghost" style="left:' + Math.min(97, Math.max(3, h.score)) + '%">' +
      '<span class="mark-tag">' + h.score + '</span><span class="mark-stem"></span></span>';
  });
  marks.push('<span class="mark" style="left:' + Math.min(97, Math.max(3, score)) + '%">' +
    '<span class="mark-tag">' + score + '</span><span class="mark-stem"></span></span>');
  $("scaleMarks").innerHTML = marks.join("");
}

function showView(which) {
  ["viewEmpty", "viewLoading", "viewError", "viewResult"].forEach(function (id) { $(id).hidden = id !== which; });
}

function render(response, state, source) {
  var a = response.answers || {};
  var s = compose(a);
  var v = verdict(s);
  current = { state: state, response: response, scores: s, source: source };

  showTab("Reading");
  showView("viewResult");
  $("readoutSub").textContent = source === "demo" ? "Offline estimate" : "Scored by " + (response.model || "jev-latest");
  $("modelNote").textContent = source === "demo" ? "local heuristic" : (response.model || "jev-latest");

  var score = pct(s.potential);
  $("scoreNum").textContent = score;
  $("scoreNumWrap").className = "score-num is-" + scoreBand(s.potential);
  $("verdictTitle").textContent = v[0];
  $("verdictText").textContent = v[1];
  renderScale(score);

  var fix = biggestFix(s);
  $("fixBox").className = "fix sev-" + fix.sev;
  $("fixTitle").textContent = ADVICE[fix.key][0];
  $("fixText").textContent = ADVICE[fix.key][1];

  [["Title", s.title], ["Discussion", s.discussion], ["Relevance", s.relevance]].forEach(function (p) {
    $("bar" + p[0]).style.width = pct(p[1]) + "%";
    $("val" + p[0]).textContent = pct(p[1]);
    $("row" + p[0]).className = "bar v-" + qualBand(p[1]);
  });
  [["Promo", s.promo], ["Click", s.click], ["Mod", s.mod]].forEach(function (p) {
    $("bar" + p[0]).style.width = pct(p[1]) + "%";
    $("val" + p[0]).textContent = pct(p[1]);
    $("risk" + p[0]).className = "risk v-" + riskBand(p[1]);
  });

  $("tagIntent").textContent = pretty(a.post_intent && a.post_intent.choice);
  $("tagDriver").textContent = pretty(a.engagement_driver && a.engagement_driver.choice);
  var conf = (Number((a.post_intent && a.post_intent.confidence) || 0) +
              Number((a.engagement_driver && a.engagement_driver.confidence) || 0)) / 2;
  $("tagConf").textContent = pct(conf) + "%";

  var probs = (a.post_intent && a.post_intent.probabilities) || {};
  var list = Object.keys(probs).map(function (k) { return [k, probs[k]]; })
    .sort(function (x, y) { return y[1] - x[1]; }).slice(0, 4);
  $("intentBars").innerHTML = list.length ? list.map(function (e, i) {
    return '<div class="bar ' + (i === 0 ? "v-good" : "v-flat") + '"><span>' + esc(pretty(e[0])) + "</span>" +
      '<div class="track"><div class="fill" style="width:' + pct(e[1]) + '%"></div></div><b>' + pct(e[1]) + "</b></div>";
  }).join("") : '<p class="hint">No breakdown returned.</p>';

  $("rawJson").textContent = JSON.stringify(response, null, 2);
  $("rawWrap").hidden = true;
  $("rawBtn").setAttribute("aria-expanded", "false");
}

function showError(title, message, detail) {
  showTab("Reading"); showView("viewError");
  $("errTitle").textContent = title;
  $("errText").textContent = message;
  $("errDetail").hidden = !detail;
  if (detail) $("errDetail").textContent = detail;
  $("readoutSub").textContent = "Last run failed";
}

/* ============================================================
   runLog (persisted)
============================================================ */
function saveRun(response, state, source) {
  var s = compose(response.answers || {});
  runLog.unshift({
    id: String(Date.now()) + Math.random().toString(36).slice(2, 6),
    at: Date.now(), score: pct(s.potential), title: state.title,
    sub: state.subreddit_or_audience, source: source, state: state, response: response
  });
  if (runLog.length > 30) runLog = runLog.slice(0, 30);
  store.set("history", runLog);
  renderHistory();
}
function renderHistory() {
  $("histCount").textContent = runLog.length;
  $("histEmpty").hidden = runLog.length > 0;
  $("histList").hidden = runLog.length === 0;
  if (!runLog.length) return;
  $("histRows").innerHTML = runLog.map(function (h) {
    var band = scoreBand(h.score / 100);
    return '<div class="hrow">' +
      '<span class="hscore v-' + band + '">' + h.score + "</span>" +
      '<span class="hmeta"><b>' + esc(h.title || "Untitled draft") + "</b>" +
      "<span>" + esc(h.sub) + " \u00b7 " + timeAgo(h.at) +
      (h.source === "demo" ? '<span class="hbadge">offline</span>' : "") + "</span></span>" +
      '<span class="hacts">' +
      '<button class="btn btn-sm" data-act="view" data-id="' + h.id + '">Reading</button>' +
      '<button class="btn btn-sm" data-act="load" data-id="' + h.id + '">Load</button>' +
      "</span></div>";
  }).join("");
  Array.prototype.forEach.call($("histRows").querySelectorAll("button"), function (b) {
    b.addEventListener("click", function () {
      var h = runLog.filter(function (x) { return x.id === b.getAttribute("data-id"); })[0];
      if (!h) return;
      if (b.getAttribute("data-act") === "view") { render(h.response, h.state, h.source); }
      else {
        $("subreddit").value = (h.state.subreddit_or_audience || "").replace(/^r\//, "").replace("not provided", "");
        $("authorContext").value = h.state.post_context || "not_provided";
        $("title").value = h.state.title || "";
        $("body").value = h.state.body === "not provided" ? "" : (h.state.body || "");
        updateCounters(); syncButtons(); saveDraft();
        showTab("Reading");
        toast("ok", "Loaded into the editor", "Score it again to compare.");
      }
    });
  });
}
$("clearHist").addEventListener("click", function () {
  var backup = runLog.slice();
  runLog = []; store.set("history", runLog); renderHistory();
  toast("info", "History cleared", backup.length + " runs removed.", {
    label: "Undo", run: function () { runLog = backup; store.set("history", runLog); renderHistory(); }
  });
});
$("exportHist").addEventListener("click", function () {
  download(JSON.stringify(runLog, null, 2), "threadpulse-runLog.json");
});
function download(text, name) {
  var url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
  var a = document.createElement("a");
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
}

/* ============================================================
   scoring a draft
============================================================ */
function setBusy(on, label) {
  busy = on;
  $("analyzeText").textContent = on ? (label || "Scoring") : "Score this draft";
  syncButtons();
}
function analyze() {
  var st = getState();
  if (!st.title) {
    $("title").setAttribute("aria-invalid", "true"); $("title").focus();
    toast("bad", "A title is required", "It is the one field the score cannot be built without.");
    return;
  }
  $("title").removeAttribute("aria-invalid");
  if (!key()) { openSetup(true); toast("info", "Add your API key", "Or use Offline for a rough local estimate."); return; }
  lastAction = analyze;
  setBusy(true);
  showTab("Reading"); showView("viewLoading");
  $("loadingText").textContent = "Asking TypeSafe for eight judgements";
  $("readoutSub").textContent = "Scoring";
  api({ state: st, model: "jev-latest", questions: analysisQuestions })
    .then(function (r) {
      setConn("ok", "Connected");
      render(r, st, "api"); saveRun(r, st, "api");
      rewrite.options = []; renderRewriteEmpty();
    })
    .catch(function (e) {
      setConn("bad", "Not connected");
      var isKey = e.status === 401 || e.status === 403;
      showError(isKey ? "That key was not accepted" : "The request did not go through",
        isKey ? "TypeSafe turned the request down. Check the key, then try again."
              : "Nothing was scored. Your draft is untouched.", e.message);
    })
    .then(function () { setBusy(false); });
}
$("analyzeBtn").addEventListener("click", analyze);
$("retryBtn").addEventListener("click", function () { if (lastAction) lastAction(); });
$("errKeyBtn").addEventListener("click", function () { openSetup(true); });

/* offline heuristic */
function heuristicAnswers(st) {
  var body = st.body === "not provided" ? "" : (st.body || "");
  var text = (st.title + " " + body).toLowerCase();
  var asks = /\?|\bwhat\b|\bhow\b|\bwhy\b|feedback|thoughts|advice/.test(text);
  var promoWords = (text.match(/\b(buy|sale|discount|sign up|subscribe|download my|check out my|link in bio|try it|my app|my product)\b/g) || []).length;
  var hype = (text.match(/\b(shocking|insane|game changer|secret|you won't believe|guaranteed|crazy|revolutionary|ultimate)\b/g) || []).length;
  var firstPerson = /^i (built|made|launched|created)\b/i.test(st.title) ? 1 : 0;

  var title = clamp(0.4 + (st.title.length > 30 ? 0.26 : 0.04) + (hype ? -0.2 : 0.1) + (/\d/.test(st.title) ? 0.05 : 0));
  var discussion = clamp(0.26 + (asks ? 0.4 : 0.05) + (body.length > 140 ? 0.16 : 0.03) + (/\?\s*$/.test(body.trim()) ? 0.08 : 0));
  var relevance = st.subreddit_or_audience !== "not provided" ? 0.76 : 0.48;
  var promo = clamp(0.05 + promoWords * 0.18 + firstPerson * 0.22 + (st.post_context === "creator_founder" ? 0.14 : 0));
  var click = clamp(0.04 + hype * 0.24);
  var mod = clamp(0.06 + promo * 0.5 + click * 0.3);

  var sc = function (v) { return { type: "score", score: Math.round(v * 3), legend: { "0": "Low", "1": "Fair", "2": "Strong", "3": "Excellent" }, confidence: 0.78 }; };
  var probs = {
    discussion: asks ? 0.34 : 0.15,
    showcase: /i built|i made|my project|i launched/.test(text) ? 0.36 : 0.15,
    question: asks ? 0.2 : 0.08, information: 0.13, promotion: promo * 0.3, other: 0.06
  };
  var tot = 0; Object.keys(probs).forEach(function (k) { tot += probs[k]; });
  Object.keys(probs).forEach(function (k) { probs[k] /= tot; });
  var choice = Object.keys(probs).sort(function (x, y) { return probs[y] - probs[x]; })[0];
  return {
    post_intent: { type: "choice", choice: choice, probabilities: probs, confidence: 0.8 },
    engagement_driver: { type: "choice", choice: asks ? "community_relevance" : "utility",
      probabilities: { utility: 0.42, community_relevance: 0.31, curiosity: 0.11, novelty: 0.08, emotion: 0.03, controversy: 0.02, weak_none: 0.03 }, confidence: 0.7 },
    title_strength: sc(title), discussion_potential: sc(discussion), community_relevance: sc(relevance),
    self_promotion: { type: "noul", noul: promo }, clickbait: { type: "noul", noul: click }, moderation_risk: { type: "noul", noul: mod }
  };
}
function runDemo() {
  if (!$("title").value.trim()) fillSample();
  var st = getState();
  lastAction = runDemo;
  var r = { model: "offline estimate", answers: heuristicAnswers(st) };
  render(r, st, "demo"); saveRun(r, st, "demo");
  rewrite.options = []; renderRewriteEmpty();
  toast("info", "Offline estimate", "No model was called. Add a key for a real reading.");
}
$("demoBtn").addEventListener("click", runDemo);
$("emptyDemo").addEventListener("click", runDemo);

/* report actions */
$("rawBtn").addEventListener("click", function () {
  var open = $("rawWrap").hidden;
  $("rawWrap").hidden = !open;
  this.setAttribute("aria-expanded", open ? "true" : "false");
});
function copyText(text, t, m) {
  var done = function () { toast("ok", t, m); };
  var bad = function () { toast("bad", "Copy blocked", "Your browser refused clipboard access."); };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done).catch(bad);
  else {
    try {
      var ta = document.createElement("textarea");
      ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select(); document.execCommand("copy");
      document.body.removeChild(ta); done();
    } catch (e) { bad(); }
  }
}
$("copyReportBtn").addEventListener("click", function () {
  if (!current) return;
  var s = current.scores, v = verdict(s);
  copyText([
    "ThreadPulse reading", "Score " + pct(s.potential) + "/100 - " + v[0], "",
    "Title strength    " + pct(s.title), "Reason to reply   " + pct(s.discussion), "Fit with the sub  " + pct(s.relevance), "",
    "Reads as promo    " + pct(s.promo), "Overpromises      " + pct(s.click), "Mod trouble       " + pct(s.mod), "",
    "Biggest fix: " + ADVICE[biggestFix(s).key][0], "", current.state.subreddit_or_audience, current.state.title
  ].join("\n"), "Summary copied", "Paste it wherever you keep notes.");
});
$("downloadBtn").addEventListener("click", function () {
  if (!current) return;
  download(JSON.stringify({ state: current.state, scores: current.scores, response: current.response }, null, 2),
    "threadpulse-" + pct(current.scores.potential) + ".json");
});

/* ============================================================
   rewrite engine
   The model judges, it does not write. So every variant is
   assembled out of the author's own sentences, and titles and
   bodies are scored separately so they can be recombined.
============================================================ */
function ns(s) { return String(s || "").replace(/\s+/g, " ").trim(); }
function cleanTitle(s) {
  return ns(s).replace(/[\u{1F300}-\u{1FAFF}\u2600-\u27BF\uFE0F]/gu, "")
    .replace(/!{2,}/g, "!").replace(/\?{2,}/g, "?").replace(/\s+([?!.,])/g, "$1")
    .replace(/^\[(?:update|launch|promo|announcement)\]\s*/i, "").trim();
}
function sentences(t) { return ns(t).split(/(?<=[.!?])\s+/).filter(Boolean); }
function stripPromo(t) {
  return ns(t)
    .replace(/\bhttps?:\/\/\S+/gi, "")
    .replace(/\b(check it out|go check it out|please check it out|sign up now|buy now|subscribe now|don'?t miss out|link in bio|it'?s free|try it out)\b[.!]?/gi, "")
    .replace(/\s{2,}/g, " ").replace(/\s+([.,!?])/g, "$1").trim();
}
function lastQuestion(t) {
  var qs = sentences(t).filter(function (s) { return s.indexOf("?") > -1; });
  return qs.length ? qs[qs.length - 1] : "";
}
function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
function uniqueBy(arr, keyFn) {
  var seen = {}, out = [];
  arr.forEach(function (x) {
    var k = keyFn(x);
    if (!k || seen[k]) return;
    seen[k] = 1; out.push(x);
  });
  return out;
}

var FILLER = /\b(just|really|very|basically|actually|simply|quite|literally|kind of|sort of)\s+/gi;
var HEDGE = /^(i think|i guess|maybe|perhaps|honestly)[,\s]+/i;
var HYPE = /\b(insane|crazy|shocking|game[- ]changer|revolutionary|ultimate|the best ever|secret|mind[- ]blowing)\s*/gi;

function titleVariants(st) {
  var T = cleanTitle(st.title);
  var body = st.body === "not provided" ? "" : st.body;
  var sents = sentences(stripPromo(body));
  var out = [{ id: "as_written", label: "As written", text: T }];

  if (T.indexOf("?") === -1) {
    out.push({ id: "asks", label: "Ends in a question",
      text: (T.replace(/[.!]+$/, "") + " \u2014 what would you change?").slice(0, 300) });
  }
  var stripped = T.replace(/^i(?:'ve)?\s+(built|made|created|launched|wrote|shipped)\s+(a|an|the|my)?\s*/i, "");
  if (stripped !== T && stripped.length > 8) {
    out.push({ id: "subject_first", label: "Subject first", text: cap(stripped).slice(0, 300) });
  }
  var tight = ns(T.replace(FILLER, "")).replace(/\s+([?!.,])/g, "$1");
  if (tight !== T && tight.length > 8) out.push({ id: "tight", label: "Filler removed", text: tight });

  var dehedged = ns(T.replace(HEDGE, "")).replace(/,?\s*i think\b/i, "");
  if (dehedged !== T && dehedged.length > 8) out.push({ id: "direct", label: "Hedges removed", text: cap(dehedged) });

  var dehyped = ns(T.replace(HYPE, ""));
  if (dehyped !== T && dehyped.length > 8) out.push({ id: "no_hype", label: "Hype removed", text: cap(dehyped) });

  var lead = sents[0] || "";
  if (lead && lead.length > 20 && lead.length < 110) {
    out.push({ id: "from_body", label: "Opening line as title",
      text: cap(lead.replace(/[.!]+$/, "")).slice(0, 300) });
  }
  var q = lastQuestion(body);
  if (q && q.length < 120) {
    out.push({ id: "body_question", label: "Your own question", text: cap(ns(q)).slice(0, 300) });
  }
  return uniqueBy(out, function (x) { return x.text.toLowerCase(); }).slice(0, 7);
}

function bodyVariants(st) {
  var raw = st.body === "not provided" ? "" : st.body;
  var B = stripPromo(raw);
  var sents = sentences(B);
  var q = lastQuestion(B);
  var ask = q || "What would you change first?";
  var BR = "\n\n";
  var out = [];

  if (!B) {
    return [{ id: "minimal", label: "A short body", text: ask }];
  }
  out.push({ id: "cleaned", label: "As written, tidied", text: B });

  var lead = sents[0] || B;
  var mid = sents.slice(1, -1).join(" ");
  var structured = lead + (mid ? BR + mid : "");
  var end = q || sents[sents.length - 1] || "";
  if (end && end !== lead && structured.indexOf(end) === -1) structured += BR + end;
  if (!q) structured += BR + ask;
  out.push({ id: "structured", label: "Restructured", text: structured });

  var concise = sents.slice(0, 3).join(" ");
  if (q && concise.indexOf(q) === -1) concise += BR + q;
  else if (!q) concise += BR + ask;
  out.push({ id: "concise", label: "Trimmed", text: concise });

  var rest = q ? sents.filter(function (s) { return s !== q; }).join(" ") : B;
  out.push({ id: "question_first", label: "Question up front", text: ask + BR + rest });

  if (sents.length >= 4) {
    var bullets = sents.slice(1, Math.min(5, sents.length))
      .map(function (s) { return "- " + s; }).join("\n");
    out.push({ id: "scannable", label: "Scannable", text: sents[0] + BR + bullets + BR + ask });
  }

  var toned = B
    .replace(/\bmy (app|product|startup|tool|project|site)\b/gi, "the $1")
    .replace(/^i(?:'ve)?\s+(built|made|created|launched)\b/i, "I put together")
    .replace(/\b(free|100% free|completely free)\b/gi, "").replace(/\s{2,}/g, " ").trim();
  if (!lastQuestion(toned)) toned += BR + ask;
  out.push({ id: "toned", label: "Sales tone removed", text: toned });

  return uniqueBy(out, function (x) { return x.text.toLowerCase(); }).slice(0, 6);
}

/* round one: score the parts */
function partQuestions(titles, bodies) {
  var q = {};
  titles.forEach(function (t, i) {
    q["tt" + i] = { type: "score", instructions: "Judge titles[" + i + "].text as a Reddit post title for clarity, specificity, accuracy, and natural reader interest. Do not reward empty clickbait.", criteria: Q_TITLE.criteria };
    q["tc" + i] = { type: "noul", instructions: "Is titles[" + i + "].text meaningfully clickbait, misleading, manipulative, or disproportionately hyped relative to original.body?" };
  });
  bodies.forEach(function (b, j) {
    q["bd" + j] = { type: "score", instructions: "Considering bodies[" + j + "].text as the body of a Reddit post, how much genuine discussion or useful response does it invite?", criteria: Q_DISCUSSION.criteria };
    q["br" + j] = { type: "score", instructions: "How well is bodies[" + j + "].text targeted to subreddit_or_audience? If none is provided, judge whether it still has a clear audience.", criteria: Q_RELEVANCE.criteria };
    q["bp" + j] = { type: "noul", instructions: "Does bodies[" + j + "].text primarily read as self-promotion, solicitation, advertising, or traffic acquisition rather than contribution?" };
    q["bm" + j] = { type: "noul", instructions: "Based only on bodies[" + j + "].text, is there a clear common subreddit moderation risk such as spam, solicitation, low effort, unclear relevance, misleading framing, or excessive self-promotion?" };
  });
  return q;
}
/* round two: score the whole thing, exactly as the original was scored */
function comboQuestions(combos) {
  var q = {};
  combos.forEach(function (c, i) {
    var p = "c" + i + "_";
    q[p + "title"] = { type: "score", instructions: "Judge candidates[" + i + "].title as a Reddit post title for clarity, specificity, accuracy, and natural reader interest. Do not reward empty clickbait.", criteria: Q_TITLE.criteria };
    q[p + "disc"] = { type: "score", instructions: "Considering candidates[" + i + "] as one whole Reddit post, how much genuine discussion or useful response does it invite?", criteria: Q_DISCUSSION.criteria };
    q[p + "rel"] = { type: "score", instructions: "How well is candidates[" + i + "] targeted to subreddit_or_audience? If none is provided, judge whether it has a clear audience.", criteria: Q_RELEVANCE.criteria };
    q[p + "promo"] = { type: "noul", instructions: "Does candidates[" + i + "] primarily read as self-promotion, solicitation, advertising, or traffic acquisition rather than contribution?" };
    q[p + "click"] = { type: "noul", instructions: "Is candidates[" + i + "].title meaningfully clickbait, misleading, manipulative, or disproportionately hyped compared with candidates[" + i + "].body?" };
    q[p + "mod"] = { type: "noul", instructions: "Based only on candidates[" + i + "], is there a clear common subreddit moderation risk such as spam, solicitation, low effort, unclear relevance, misleading framing, or excessive self-promotion?" };
  });
  return q;
}

function rwStep(i, labels) {
  $("rwSteps").innerHTML = labels.map(function (l, n) {
    var cls = n < i ? "done" : n === i ? "now" : "";
    var inner = n < i ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round"><path d="m5 12.5 4.5 4.5L19 7"/></svg>' : "";
    return '<span class="step ' + cls + '"><span class="step-ico">' + inner + "</span>" + esc(l) + "</span>";
  }).join("");
}
function renderRewriteEmpty() {
  $("rwEmpty").hidden = false; $("rwLoading").hidden = true; $("rwResult").hidden = true;
  if (current) {
    $("rwEmpty").querySelector("h3").textContent = "Ready to rewrite";
    $("rwEmpty").querySelector("p").textContent =
      "Seven title treatments and six body treatments will be built from your own sentences, scored apart so they can be recombined, then the best three combinations are scored in full.";
    $("rwGoScore").textContent = "Build rewrites";
  }
}

function buildRewrites() {
  if (!current) { showTab("Rewrites"); renderRewriteEmpty(); toast("bad", "Score a draft first", "Rewrites are ranked against a reading."); return; }
  var st = current.state;
  var titles = titleVariants(st);
  var bodies = bodyVariants(st);
  if (titles.length + bodies.length < 3) { toast("bad", "Not enough to work with", "Add a body to the draft first."); return; }

  var offline = current.source === "demo" || !key();
  var labels = offline
    ? ["Building " + titles.length + " titles and " + bodies.length + " bodies",
       "Estimating " + (titles.length * bodies.length) + " combinations locally"]
    : ["Building " + titles.length + " titles and " + bodies.length + " bodies",
       "Scoring the parts (" + (titles.length * 2 + bodies.length * 4) + " judgements)",
       "Re-scoring the best three in full"];

  showTab("Rewrites");
  $("rwEmpty").hidden = true; $("rwResult").hidden = true; $("rwLoading").hidden = false;
  rwStep(0, labels);

  var allCombos = [];
  titles.forEach(function (t, i) {
    bodies.forEach(function (b, j) {
      allCombos.push({ ti: i, bj: j, title: t.text, body: b.text,
        label: t.id === "as_written" ? b.label : (b.id === "cleaned" ? t.label : t.label + " + " + b.label.toLowerCase()) });
    });
  });

  /* ---- offline: estimate every combination locally ---- */
  if (offline) {
    rewrite.source = "offline";
    setTimeout(function () {
      rwStep(1, labels);
      setTimeout(function () {
        var scored = allCombos.map(function (c) {
          return Object.assign({}, c, { scores: compose(heuristicAnswers({
            title: c.title, body: c.body || "not provided",
            subreddit_or_audience: st.subreddit_or_audience, post_context: st.post_context
          })), verified: false });
        }).sort(function (a, b) { return b.scores.potential - a.scores.potential; });
        showOptions(uniqueBy(scored, function (x) { return (x.title + "|" + x.body).toLowerCase(); }).slice(0, 4));
      }, 380);
    }, 300);
    return;
  }

  /* ---- online: two passes ---- */
  rewrite.source = "api";
  var partState = {
    subreddit_or_audience: st.subreddit_or_audience,
    post_context: st.post_context,
    original: { title: st.title, body: st.body },
    titles: titles.map(function (t, i) { return { index: i, text: t.text }; }),
    bodies: bodies.map(function (b, j) { return { index: j, text: b.text }; })
  };
  rwStep(1, labels);
  api({ state: partState, model: "jev-latest", questions: partQuestions(titles, bodies) })
    .then(function (r1) {
      var a = r1.answers || {};
      var estimated = allCombos.map(function (c) {
        return Object.assign({}, c, {
          scores: composeRaw(
            scorePct(a["tt" + c.ti]), scorePct(a["bd" + c.bj]), scorePct(a["br" + c.bj]),
            clamp(a["bp" + c.bj] && a["bp" + c.bj].noul),
            clamp(a["tc" + c.ti] && a["tc" + c.ti].noul),
            clamp(a["bm" + c.bj] && a["bm" + c.bj].noul)
          )
        });
      }).sort(function (x, y) { return y.scores.potential - x.scores.potential; });

      var top = uniqueBy(estimated, function (x) { return (x.title + "|" + x.body).toLowerCase(); }).slice(0, 3);
      rwStep(2, labels);
      return api({
        state: {
          subreddit_or_audience: st.subreddit_or_audience,
          post_context: st.post_context,
          original: { title: st.title, body: st.body },
          candidates: top.map(function (c) { return { title: c.title, body: c.body }; })
        },
        model: "jev-latest",
        questions: comboQuestions(top)
      }).then(function (r2) {
        var b = r2.answers || {};
        var verified = top.map(function (c, i) {
          var p = "c" + i + "_";
          return Object.assign({}, c, {
            verified: true,
            estimate: c.scores.potential,
            scores: composeRaw(
              scorePct(b[p + "title"]), scorePct(b[p + "disc"]), scorePct(b[p + "rel"]),
              clamp(b[p + "promo"] && b[p + "promo"].noul),
              clamp(b[p + "click"] && b[p + "click"].noul),
              clamp(b[p + "mod"] && b[p + "mod"].noul)
            )
          });
        }).sort(function (x, y) { return y.scores.potential - x.scores.potential; });
        showOptions(verified);
      }).catch(function () {
        /* round two failed: fall back to the estimates rather than nothing */
        showOptions(top.map(function (c) { return Object.assign({}, c, { verified: false }); }));
        toast("info", "Showing estimates", "The confirming pass failed, so these numbers are predicted.");
      });
    })
    .catch(function (e) {
      $("rwLoading").hidden = true; renderRewriteEmpty();
      toast("bad", "Rewrites could not be built", e.message);
    });
}
$("rwGoScore").addEventListener("click", function () {
  if (current) buildRewrites();
  else { showTab("Reading"); $("title").focus(); }
});
$("regenBtn").addEventListener("click", buildRewrites);

function showOptions(list) {
  rewrite.options = list;
  $("rwLoading").hidden = true; $("rwEmpty").hidden = true; $("rwResult").hidden = false;
  var before = pct(current.scores.potential);
  $("beforeScore").textContent = before;
  $("opts").innerHTML = list.map(function (c, i) {
    var d = pct(c.scores.potential) - before;
    return '<button class="opt" type="button" data-i="' + i + '" aria-pressed="' + (i === 0) + '">' +
      '<span><span class="opt-name">' + esc(c.label) + (i === 0 ? '<span class="opt-tag">best</span>' : "") + "</span>" +
      '<span class="opt-title">' + esc(c.title) + "</span></span>" +
      '<span class="opt-score"><b>' + pct(c.scores.potential) + "</b>" +
      '<i class="' + (d > 0 ? "up" : d < 0 ? "down" : "flat") + '">' + (d > 0 ? "+" + d : d === 0 ? "\u00b10" : String(d)) + "</i></span></button>";
  }).join("");
  Array.prototype.forEach.call($("opts").querySelectorAll(".opt"), function (b) {
    b.addEventListener("click", function () { selectOption(Number(b.getAttribute("data-i"))); });
  });
  selectOption(0);
}

function gainList(before, after) {
  var out = [];
  var L = { title: "Title strength", discussion: "Reason to reply", relevance: "Fit with the sub" };
  ["title", "discussion", "relevance"].forEach(function (k) {
    var d = Math.round((after[k] - before[k]) * 100);
    if (d >= 4) out.push(["up", L[k] + " +" + d]);
    else if (d <= -4) out.push(["down", L[k] + " " + d]);
  });
  [["promo", "Promo tone"], ["click", "Overpromising"], ["mod", "Mod risk"]].forEach(function (p) {
    var d = Math.round((before[p[0]] - after[p[0]]) * 100);
    if (d >= 4) out.push(["up", p[1] + " \u2212" + d]);
    else if (d <= -4) out.push(["down", p[1] + " +" + Math.abs(d)]);
  });
  if (before.capped && !after.capped) out.unshift(["up", "No longer flagged for removal"]);
  if (!out.length) out.push(["neutral", "Best balance of the options"]);
  return out.slice(0, 5);
}

function selectOption(i) {
  var c = rewrite.options[i];
  if (!c) return;
  rewrite.selected = c; rewrite.edited = false;
  Array.prototype.forEach.call($("opts").querySelectorAll(".opt"), function (b, n) {
    b.setAttribute("aria-pressed", n === i ? "true" : "false");
  });
  var before = pct(current.scores.potential), after = pct(c.scores.potential), d = after - before;
  $("afterLabel").textContent = i === 0 ? "Best rewrite" : c.label;
  $("afterScore").textContent = after;
  $("gain").textContent = d > 0 ? "+" + d : d === 0 ? "no change" : String(d);
  $("gain").className = "rw-gain " + (d > 0 ? "up" : d < 0 ? "down" : "flat");
  $("editNote").textContent = c.verified
    ? "This version was scored in full, the same way your draft was. Edit it below and score it again if you want to keep tuning."
    : "This number is estimated from the parts rather than measured. Put it in the editor and score it to confirm.";
  $("gainChips").innerHTML = gainList(current.scores, c.scores).map(function (g) {
    return '<span class="chip ' + g[0] + '">' + esc(g[1]) + "</span>";
  }).join("");
  $("rwTitle").value = c.title;
  $("rwBody").value = c.body;
  counterFor($("rwTitle"), $("rwTitleCount"), 300);
  counterFor($("rwBody"), $("rwBodyCount"));
  $("originalPreview").textContent = current.state.title + "\n\n" +
    (current.state.body === "not provided" ? "(no body)" : current.state.body);
  $("improvedPreview").textContent = c.title + "\n\n" + c.body;
}
["rwTitle", "rwBody"].forEach(function (id) {
  $(id).addEventListener("input", function () {
    counterFor($("rwTitle"), $("rwTitleCount"), 300);
    counterFor($("rwBody"), $("rwBodyCount"));
    if (!rewrite.edited) {
      rewrite.edited = true;
      $("editNote").textContent = "You have edited this version, so the number above no longer describes it. Score it to find out what it is worth.";
    }
    $("improvedPreview").textContent = $("rwTitle").value + "\n\n" + $("rwBody").value;
  });
});
$("applyBtn").addEventListener("click", function () {
  if (!rewrite.selected) return;
  $("title").value = $("rwTitle").value;
  $("body").value = $("rwBody").value;
  updateCounters(); syncButtons(); saveDraft();
  if (current && current.source === "demo") runDemo(); else if (key()) analyze(); else {
    showTab("Reading");
    toast("info", "Put in the editor", "Add a key or use Offline to score it.");
  }
});
$("copyImprovedBtn").addEventListener("click", function () {
  copyText($("rwTitle").value + "\n\n" + $("rwBody").value, "Rewrite copied", "Title and body are on your clipboard.");
});

/* ============================================================
   keyboard
============================================================ */
document.addEventListener("keydown", function (e) {
  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
    e.preventDefault();
    if (!busy && $("title").value.trim()) analyze();
    return;
  }
  if (e.key === "Escape" && !$("setup").hidden) { openSetup(false); $("setupBtn").focus(); return; }
  var tag = (e.target.tagName || "").toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select" || e.metaKey || e.ctrlKey || e.altKey) return;
  var n = ["1", "2", "3", "4"].indexOf(e.key);
  if (n > -1) { showTab(TABS[n]); }
});

/* ============================================================
   boot
============================================================ */
$("kbdHint").textContent = isMac ? "\u2318\u21a9" : "Ctrl+Enter";
$("scKey").textContent = MOD;
loadDraft();
updateCounters();
syncButtons();
renderHistory();
renderRewriteEmpty();
</script>
</body>
</html>`;

const SECURITY_HEADERS = {
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "X-Frame-Options": "DENY",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), interest-cohort=()"
};

const PAGE_CSP = [
  "default-src 'none'",
  "img-src 'self' data: blob:",
  "style-src 'unsafe-inline'",
  "script-src 'unsafe-inline'",
  "connect-src 'self'",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-ancestors 'none'"
].join("; ");

function send(res, status, body, type = "application/json; charset=utf-8", extra = {}) {
  res.writeHead(status, { "Content-Type": type, ...SECURITY_HEADERS, ...extra });
  res.end(body);
}
const fail = (res, status, message) => send(res, status, JSON.stringify({ error: message }));

async function readBody(req, limit = 2_000_000) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) {
      const err = new Error("too_large");
      err.tooLarge = true;
      throw err;
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

const server = http.createServer(async (req, res) => {
  const url = (req.url || "/").split("?")[0];

  if (url === "/" || url === "/index.html") {
    if (req.method !== "GET" && req.method !== "HEAD") return fail(res, 405, "Method not allowed.");
    return send(res, 200, req.method === "HEAD" ? "" : html, "text/html; charset=utf-8", {
      "Content-Security-Policy": PAGE_CSP
    });
  }

  if (url === "/health") {
    return send(res, 200, JSON.stringify({ ok: true, service: "threadpulse", version: "5.0.0" }));
  }

  if (url === "/api/typesafe") {
    if (req.method !== "POST") return fail(res, 405, "Method not allowed.");

    const key = String(req.headers["x-typesafe-key"] || "").trim();
    if (!key) return fail(res, 400, "No API key was sent with the request.");

    let raw;
    try {
      raw = await readBody(req);
    } catch (err) {
      if (err.tooLarge) return fail(res, 413, "That draft is too large to send.");
      return fail(res, 400, "The request body could not be read.");
    }

    let payload;
    try {
      payload = JSON.parse(raw);
    } catch {
      return fail(res, 400, "The request body was not valid JSON.");
    }
    if (!payload || typeof payload !== "object" || !payload.questions) {
      return fail(res, 400, "The request is missing its questions.");
    }

    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), UPSTREAM_TIMEOUT_MS);

    try {
      const upstream = await fetch(UPSTREAM, {
        method: "POST",
        headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: ac.signal
      });
      const text = await upstream.text();
      res.writeHead(upstream.status, {
        "Content-Type": upstream.headers.get("content-type") || "application/json; charset=utf-8",
        ...SECURITY_HEADERS
      });
      return res.end(text);
    } catch (err) {
      if (err?.name === "AbortError") {
        return fail(res, 504, `TypeSafe did not answer within ${Math.round(UPSTREAM_TIMEOUT_MS / 1000)} seconds.`);
      }
      return fail(res, 502, `Could not reach TypeSafe: ${err?.message || err}`);
    } finally {
      clearTimeout(timer);
    }
  }

  return fail(res, 404, "Not found.");
});

server.on("clientError", (_err, socket) => {
  if (socket.writable) socket.end("HTTP/1.1 400 Bad Request\r\n\r\n");
});

let attempts = 0;
server.on("error", (err) => {
  if (err.code === "EADDRINUSE" && attempts < 10) {
    attempts += 1;
    const next = PORT + attempts;
    console.log(`  Port ${next - 1} is busy, trying ${next}...`);
    server.listen(next, HOST);
    return;
  }
  if (err.code === "EADDRINUSE") {
    console.error(`\n  Ports ${PORT}-${PORT + 10} are all in use.`);
    console.error(`  Start it somewhere else:  node threadpulse_v5.mjs --port 9100\n`);
    process.exit(1);
  }
  console.error(`\n  Server error: ${err.message}\n`);
  process.exit(1);
});

server.listen(PORT, HOST, () => {
  const addr = server.address();
  const line = `http://localhost:${addr.port}`;
  console.log("");
  console.log("  \x1b[1mThreadPulse\x1b[0m \x1b[2mv5\x1b[0m");
  console.log(`  \x1b[36m${line}\x1b[0m`);
  console.log("");
  console.log("  \x1b[2mYour API key stays in the browser. Nothing is written to disk.\x1b[0m");
  console.log("  \x1b[2mLeave this window open while you use the app. Ctrl+C to stop.\x1b[0m");
  console.log("");
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    console.log("\n  Stopping ThreadPulse.\n");
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 1500).unref();
  });
}
