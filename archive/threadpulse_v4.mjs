// ThreadPulse v4 — single-file local Reddit post analyzer
// Requires Node.js 18+
// Run:  node threadpulse_v4.mjs
// Open: http://localhost:8787
//
// Flags: --port 9000   (or PORT=9000)
//
// Nothing is stored on a server. Your API key and draft stay in this
// browser's local storage; the key is forwarded to TypeSafe per request
// and is never written to disk or to the console.

import http from "node:http";
import process from "node:process";

const argPort = (() => {
  const i = process.argv.indexOf("--port");
  return i > -1 ? Number(process.argv[i + 1]) : NaN;
})();
const PORT = Number.isFinite(argPort) && argPort > 0 ? argPort : Number(process.env.PORT || 8787);
const HOST = process.env.HOST || "127.0.0.1";
const UPSTREAM = "https://api.typesafe.ai/v1/systemone";
const UPSTREAM_TIMEOUT_MS = 45_000;

const html = String.raw`<!doctype html>
<html lang="en" data-theme="light">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="color-scheme" content="light dark">
<meta name="description" content="Score a Reddit draft before you post it, then rewrite it and re-score.">
<title>ThreadPulse — score a draft before you post</title>
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='9' fill='%2314171C'/%3E%3Cpath d='M5 17h3.4l2.6-7.4 3.8 14 2.7-8.3 1.8 3.5h2.4' fill='none' stroke='%233FCFAE' stroke-width='2.3' stroke-linecap='round' stroke-linejoin='round'/%3E%3Ccircle cx='25.4' cy='18.8' r='2.1' fill='%233FCFAE'/%3E%3C/svg%3E">
<style>
/* ---------------------------------------------------------------
   Tokens
   Light and dark are one palette flipped. The readout panel keeps
   its own fixed dark tokens in both themes: it is an instrument
   display, so it should read the same whatever the room is like.
----------------------------------------------------------------*/
:root{
  --bg:#ECEEF1;
  --bg-tint:rgba(14,124,102,.07);
  --surface:#FFFFFF;
  --surface-2:#F5F6F8;
  --surface-3:#EDEFF2;
  --line:#DCE0E5;
  --line-strong:#C6CCD3;
  --ink:#14171C;
  --ink-2:#333A43;
  --muted:#626B76;
  --faint:#6D757F;
  --accent:#0E7C66;
  --accent-ink:#0B5F4E;
  --accent-soft:rgba(14,124,102,.10);
  --warn:#9C6712;
  --risk:#B53E3A;
  --focus:#0E7C66;
  --shadow-sm:0 1px 2px rgba(17,22,28,.06),0 2px 6px rgba(17,22,28,.05);
  --shadow-md:0 6px 18px rgba(17,22,28,.07),0 18px 46px rgba(17,22,28,.07);
  --shadow-lg:0 24px 70px rgba(17,22,28,.18);

  /* readout: fixed dark */
  --r-bg:#14171C;
  --r-surface:#1B1F26;
  --r-surface-2:#21262E;
  --r-line:#2B313A;
  --r-line-soft:#242931;
  --r-text:#E9ECF0;
  --r-muted:#9BA4AF;
  --r-faint:#78818C;
  --r-accent:#3FCFAE;
  --r-warn:#E9B84C;
  --r-risk:#F0736B;

  --radius-lg:18px;
  --radius:12px;
  --radius-sm:9px;

  --t-2xs:12px;
  --t-xs:13px;
  --t-sm:14px;
  --t-md:15.5px;
  --t-lg:18px;
  --t-xl:22px;

  --sans:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;
  --mono:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,"Liberation Mono",monospace;
}
:root[data-theme="dark"]{
  --bg:#0E1115;
  --bg-tint:rgba(63,207,174,.07);
  --surface:#181C22;
  --surface-2:#1E232A;
  --surface-3:#232830;
  --line:#2A3039;
  --line-strong:#39414B;
  --ink:#E9ECF0;
  --ink-2:#C7CDD5;
  --muted:#98A1AC;
  --faint:#79828D;
  --accent:#3FCFAE;
  --accent-ink:#6FE0C5;
  --accent-soft:rgba(63,207,174,.12);
  --warn:#E9B84C;
  --risk:#F0736B;
  --focus:#3FCFAE;
  --shadow-sm:0 1px 2px rgba(0,0,0,.4);
  --shadow-md:0 8px 26px rgba(0,0,0,.34);
  --shadow-lg:0 24px 70px rgba(0,0,0,.5);
  --r-bg:#12151A;
  --r-surface:#191D23;
  --r-surface-2:#1F242B;
}

*,*::before,*::after{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{
  margin:0;
  min-height:100dvh;
  background:
    radial-gradient(1100px 600px at 88% -14%,var(--bg-tint),transparent 62%),
    var(--bg);
  color:var(--ink);
  font-family:var(--sans);
  font-size:var(--t-md);
  line-height:1.5;
  letter-spacing:-.011em;
  -webkit-font-smoothing:antialiased;
}
h1,h2,h3,h4,p{margin:0}
button,input,textarea,select{font:inherit;color:inherit}
button{cursor:pointer;background:none;border:0;padding:0}
button:disabled{cursor:not-allowed}
svg{display:block;flex:none}
[hidden]{display:none !important}
::selection{background:var(--accent-soft)}

:where(a,button,input,textarea,select,[tabindex]):focus-visible{
  outline:2px solid var(--focus);
  outline-offset:2px;
  border-radius:6px;
}
.readout :where(button,[tabindex]):focus-visible{outline-color:var(--r-accent)}

.sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}
.num{font-family:var(--mono);font-variant-numeric:tabular-nums;font-feature-settings:"tnum" 1}

.shell{width:min(1320px,100% - 40px);margin:0 auto;padding-bottom:64px}

/* ---------------- top bar ---------------- */
.topbar{
  position:relative;
  display:flex;align-items:center;justify-content:space-between;gap:16px;
  padding:18px 0;
}
.brand{display:flex;align-items:center;gap:11px;text-decoration:none;color:inherit}
.mark{
  width:38px;height:38px;border-radius:11px;background:var(--ink);
  display:grid;place-items:center;box-shadow:var(--shadow-sm);flex:none;
}
:root[data-theme="dark"] .mark{background:#000}
.mark svg{width:24px;height:24px;color:var(--accent)}
:root[data-theme="light"] .mark svg{color:#3FCFAE}
.wordmark{display:flex;flex-direction:column;line-height:1.15}
.wordmark b{font-size:var(--t-md);font-weight:640;letter-spacing:-.02em}
.wordmark small{font-size:var(--t-2xs);color:var(--faint);font-weight:450}

.topbar-actions{display:flex;align-items:center;gap:8px}

.pill{
  height:38px;padding:0 13px;border-radius:999px;border:1px solid var(--line);
  background:var(--surface);display:inline-flex;align-items:center;gap:8px;
  font-size:var(--t-xs);font-weight:520;color:var(--ink-2);
  box-shadow:var(--shadow-sm);transition:border-color .16s,background .16s;
}
.pill:hover{border-color:var(--line-strong)}
.pill[aria-expanded="true"]{border-color:var(--line-strong);background:var(--surface-2)}
.dot{width:8px;height:8px;border-radius:50%;background:var(--faint);flex:none}
.dot.ok{background:var(--accent)}
.dot.bad{background:var(--risk)}
.dot.busy{background:var(--warn);animation:blink 1s ease-in-out infinite}
@keyframes blink{50%{opacity:.25}}

.iconbtn{
  width:38px;height:38px;border-radius:11px;border:1px solid var(--line);
  background:var(--surface);display:grid;place-items:center;color:var(--ink-2);
  box-shadow:var(--shadow-sm);transition:border-color .16s,color .16s;
}
.iconbtn:hover{border-color:var(--line-strong);color:var(--ink)}
.iconbtn svg{width:17px;height:17px}

/* connection popover */
.pop{
  position:absolute;right:0;top:64px;z-index:40;width:min(380px,calc(100vw - 32px));
  background:var(--surface);border:1px solid var(--line);border-radius:var(--radius-lg);
  box-shadow:var(--shadow-lg);padding:16px;
}
.pop h3{font-size:var(--t-sm);font-weight:620;margin-bottom:3px}
.pop .pop-sub{font-size:var(--t-xs);color:var(--muted);margin-bottom:12px;line-height:1.45}
.pop-row{display:flex;gap:8px;margin-top:10px}
.pop-note{
  margin-top:12px;padding-top:12px;border-top:1px solid var(--line);
  font-size:var(--t-2xs);color:var(--faint);line-height:1.5;
}
.pop-note a{color:var(--accent);text-underline-offset:2px}

/* ---------------- hero ---------------- */
.hero{padding:34px 0 30px;max-width:44ch}
.hero h1{
  font-size:clamp(33px,4.4vw,50px);line-height:1.04;letter-spacing:-.033em;font-weight:600;
}
.hero p{margin-top:14px;font-size:var(--t-md);color:var(--muted);max-width:52ch;line-height:1.55}

/* ---------------- layout ---------------- */
.layout{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.04fr);gap:18px;align-items:start}

.panel{
  background:var(--surface);border:1px solid var(--line);border-radius:var(--radius-lg);
  box-shadow:var(--shadow-md);overflow:hidden;
}
.panel-head{
  min-height:56px;padding:12px 18px;display:flex;align-items:center;justify-content:space-between;gap:12px;
  border-bottom:1px solid var(--line);
}
.panel-head h2{font-size:var(--t-sm);font-weight:620;letter-spacing:-.012em}
.panel-head .sub{font-size:var(--t-2xs);color:var(--faint);margin-top:1px}
.panel-body{padding:18px}

/* ---------------- form ---------------- */
.field{margin-bottom:16px}
.field:last-child{margin-bottom:0}
.field-label{display:flex;align-items:baseline;justify-content:space-between;gap:10px;margin-bottom:7px}
.field-label label{font-size:var(--t-xs);font-weight:580;color:var(--ink-2)}
.counter{font-size:var(--t-2xs);color:var(--faint)}
.counter.warn{color:var(--warn)}
.counter.over{color:var(--risk);font-weight:600}
.hint{margin-top:6px;font-size:var(--t-2xs);color:var(--faint);line-height:1.45}
.hint.err{color:var(--risk)}

.input{
  width:100%;border:1px solid var(--line);background:var(--surface);color:var(--ink);
  border-radius:var(--radius);padding:11px 13px;font-size:var(--t-sm);
  transition:border-color .16s,box-shadow .16s;
}
.input::placeholder{color:var(--faint)}
.input:hover:not(:focus){border-color:var(--line-strong)}
.input:focus{outline:none;border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft)}
.input[aria-invalid="true"]{border-color:var(--risk)}
textarea.input{min-height:184px;resize:vertical;line-height:1.6;font-size:var(--t-sm)}
select.input{
  appearance:none;cursor:pointer;padding-right:34px;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23626B76' stroke-width='2' stroke-linecap='round'%3E%3Cpath d='m7 10 5 5 5-5'/%3E%3C/svg%3E");
  background-repeat:no-repeat;background-position:right 11px center;background-size:15px;
}
:root[data-theme="dark"] select.input{
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2398A1AC' stroke-width='2' stroke-linecap='round'%3E%3Cpath d='m7 10 5 5 5-5'/%3E%3C/svg%3E");
}
.prefixed{position:relative}
.prefixed .prefix{
  position:absolute;left:13px;top:50%;transform:translateY(-50%);
  font-size:var(--t-sm);color:var(--faint);pointer-events:none;font-family:var(--mono);
}
.prefixed .input{padding-left:33px}
.grid-2{display:grid;grid-template-columns:1fr 1fr;gap:12px}

/* toggle row */
.switch-row{
  border:1px solid var(--line);border-radius:var(--radius);padding:12px 13px;
  display:flex;align-items:center;justify-content:space-between;gap:12px;background:var(--surface-2);
}
.switch-copy{display:flex;align-items:center;gap:11px;min-width:0}
.switch-icon{width:32px;height:32px;border-radius:9px;background:var(--surface);border:1px solid var(--line);display:grid;place-items:center;color:var(--muted);flex:none}
.switch-icon svg{width:16px;height:16px}
.switch-copy b{display:block;font-size:var(--t-xs);font-weight:580}
.switch-copy small{display:block;font-size:var(--t-2xs);color:var(--faint);margin-top:1px}
.switch{position:relative;width:42px;height:24px;flex:none}
.switch input{position:absolute;inset:0;opacity:0;margin:0;cursor:pointer;z-index:1}
.slider{position:absolute;inset:0;background:var(--line-strong);border-radius:999px;transition:background .18s}
.slider::after{content:"";position:absolute;left:3px;top:3px;width:18px;height:18px;background:#fff;border-radius:50%;box-shadow:0 1px 3px rgba(0,0,0,.28);transition:transform .18s}
.switch input:checked+.slider{background:var(--accent)}
.switch input:checked+.slider::after{transform:translateX(18px)}
.switch input:focus-visible+.slider{outline:2px solid var(--focus);outline-offset:2px}

.subpanel{margin-top:12px}
.dropzone{
  position:relative;border:1.5px dashed var(--line-strong);border-radius:var(--radius);
  background:var(--surface-2);padding:22px 16px;text-align:center;transition:border-color .16s,background .16s;
}
.dropzone.drag{border-color:var(--accent);background:var(--accent-soft)}
.dropzone input[type=file]{position:absolute;inset:0;opacity:0;cursor:pointer}
.dropzone svg{width:20px;height:20px;margin:0 auto 7px;color:var(--muted)}
.dropzone b{display:block;font-size:var(--t-xs);font-weight:580}
.dropzone span{display:block;font-size:var(--t-2xs);color:var(--faint);margin-top:3px}
.thumb{position:relative;border:1px solid var(--line);border-radius:var(--radius);overflow:hidden}
.thumb img{display:block;width:100%;height:168px;object-fit:cover;background:var(--surface-3)}
.thumb-bar{
  display:flex;align-items:center;justify-content:space-between;gap:10px;
  padding:9px 11px;border-top:1px solid var(--line);background:var(--surface-2);
}
.thumb-bar span{font-size:var(--t-2xs);color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}

/* ---------------- buttons ---------------- */
.btn{
  height:40px;padding:0 15px;border-radius:var(--radius);border:1px solid var(--line);
  background:var(--surface);color:var(--ink);display:inline-flex;align-items:center;justify-content:center;gap:8px;
  font-size:var(--t-xs);font-weight:580;white-space:nowrap;
  transition:background .16s,border-color .16s,transform .1s,opacity .16s;
}
.btn:hover:not(:disabled){border-color:var(--line-strong);background:var(--surface-2)}
.btn:active:not(:disabled){transform:translateY(1px)}
.btn:disabled{opacity:.48}
.btn svg{width:16px;height:16px}
.btn-primary{background:var(--ink);border-color:var(--ink);color:var(--surface)}
:root[data-theme="dark"] .btn-primary{color:#0E1115}
.btn-primary:hover:not(:disabled){background:var(--ink-2);border-color:var(--ink-2)}
.btn-accent{background:var(--accent);border-color:var(--accent);color:#fff}
:root[data-theme="dark"] .btn-accent{color:#0B1512}
.btn-accent:hover:not(:disabled){filter:brightness(1.06)}
.btn-sm{height:32px;padding:0 11px;border-radius:var(--radius-sm);font-size:var(--t-2xs)}
.btn-sm svg{width:14px;height:14px}
.btn-icon{width:40px;padding:0}
.btn-icon.btn-sm{width:32px}
.btn-ghost{background:transparent;border-color:transparent;color:var(--muted)}
.btn-ghost:hover:not(:disabled){background:var(--surface-2);color:var(--ink)}
.grow{flex:1}
.kbd{
  font-family:var(--mono);font-size:11px;padding:2px 6px;border-radius:5px;
  border:1px solid rgba(255,255,255,.22);opacity:.78;
}
.btn:not(.btn-primary):not(.btn-accent) .kbd{border-color:var(--line-strong);opacity:.7}

.actions{display:flex;gap:9px;margin-top:20px;padding-top:18px;border-top:1px solid var(--line)}

/* ---------------- readout (always dark) ---------------- */
.readout{background:var(--r-bg);border-color:var(--r-line);color:var(--r-text)}
.readout .panel-head{border-bottom-color:var(--r-line)}
.readout .panel-head h2{color:var(--r-text)}
.readout .panel-head .sub{color:var(--r-faint)}
.readout .btn{background:var(--r-surface);border-color:var(--r-line);color:var(--r-text)}
.readout .btn:hover:not(:disabled){background:var(--r-surface-2);border-color:#3A424D}
.readout .btn-accent{background:var(--r-accent);border-color:var(--r-accent);color:#0B1512}
.readout .btn-ghost{background:transparent;border-color:transparent;color:var(--r-muted)}
.readout .btn-ghost:hover:not(:disabled){background:var(--r-surface);color:var(--r-text)}

.state{display:none}
.state.on{display:block}

/* empty */
.empty{min-height:560px;display:grid;place-items:center;text-align:center;padding:40px 28px}
.empty-mark{
  width:64px;height:64px;border-radius:18px;background:var(--r-surface);border:1px solid var(--r-line);
  display:grid;place-items:center;margin:0 auto 16px;color:var(--r-accent);
}
.empty-mark svg{width:28px;height:28px}
.empty h3{font-size:var(--t-lg);font-weight:600;margin-bottom:6px}
.empty p{font-size:var(--t-sm);color:var(--r-muted);max-width:40ch;margin:0 auto;line-height:1.55}
.empty-actions{display:flex;gap:9px;justify-content:center;margin-top:20px;flex-wrap:wrap}

/* loading */
.loading{min-height:560px;padding:28px}
.skel{background:var(--r-surface);border-radius:10px;position:relative;overflow:hidden}
.skel::after{
  content:"";position:absolute;inset:0;transform:translateX(-100%);
  background:linear-gradient(90deg,transparent,rgba(255,255,255,.06),transparent);
  animation:sweep 1.25s infinite;
}
@keyframes sweep{100%{transform:translateX(100%)}}
.skel-top{display:flex;align-items:center;gap:20px;margin-bottom:26px}
.skel-ring{width:112px;height:112px;border-radius:50%;flex:none}
.skel-lines{flex:1;display:grid;gap:9px}
.loading-note{display:flex;align-items:center;gap:9px;font-size:var(--t-xs);color:var(--r-muted);margin-bottom:22px}
.spinner{width:15px;height:15px;border:2px solid var(--r-line);border-top-color:var(--r-accent);border-radius:50%;animation:spin .7s linear infinite;flex:none}
@keyframes spin{to{transform:rotate(360deg)}}

/* error */
.errstate{min-height:560px;display:grid;place-items:center;text-align:center;padding:40px 28px}
.err-mark{width:56px;height:56px;border-radius:16px;background:rgba(240,115,107,.1);border:1px solid rgba(240,115,107,.3);display:grid;place-items:center;margin:0 auto 15px;color:var(--r-risk)}
.err-mark svg{width:24px;height:24px}
.errstate h3{font-size:var(--t-lg);font-weight:600;margin-bottom:7px}
.errstate p{font-size:var(--t-sm);color:var(--r-muted);max-width:42ch;margin:0 auto;line-height:1.55}
.err-detail{
  margin:16px auto 0;max-width:46ch;font-family:var(--mono);font-size:var(--t-2xs);line-height:1.5;
  color:var(--r-faint);background:var(--r-surface);border:1px solid var(--r-line);border-radius:10px;padding:10px 12px;
  text-align:left;word-break:break-word;
}

/* score header */
.score-head{padding:22px 20px;border-bottom:1px solid var(--r-line)}
.score-grid{display:grid;grid-template-columns:auto minmax(0,1fr);gap:22px;align-items:center}
.gauge-wrap{position:relative;width:118px;height:118px;flex:none}
.gauge{width:118px;height:118px;transform:rotate(-90deg)}
.gauge circle{fill:none;stroke-width:9;stroke-linecap:round}
.gauge .track{stroke:var(--r-surface-2)}
.gauge .arc{stroke:var(--r-accent);transition:stroke-dashoffset .7s cubic-bezier(.22,.9,.28,1),stroke .4s}
.gauge-val{position:absolute;inset:0;display:grid;place-content:center;text-align:center}
.gauge-val strong{font-size:33px;font-weight:600;letter-spacing:-.045em;line-height:1;font-family:var(--mono);font-variant-numeric:tabular-nums}
.gauge-val span{display:block;font-size:var(--t-2xs);color:var(--r-faint);margin-top:5px}
.verdict h3{font-size:var(--t-xl);font-weight:600;letter-spacing:-.024em;line-height:1.2}
.verdict p{font-size:var(--t-sm);color:var(--r-muted);line-height:1.5;margin-top:6px;max-width:46ch}
.tags{display:flex;flex-wrap:wrap;gap:7px;margin-top:14px}
.tag{
  display:inline-flex;align-items:baseline;gap:6px;padding:5px 9px;border-radius:7px;
  background:var(--r-surface);border:1px solid var(--r-line);font-size:var(--t-2xs);
}
.tag i{font-style:normal;color:var(--r-faint)}
.tag b{font-weight:560;color:var(--r-text)}

/* sections */
.sec{padding:18px 20px;border-bottom:1px solid var(--r-line-soft)}
.sec:last-child{border-bottom:0}
.sec-head{display:flex;align-items:baseline;justify-content:space-between;gap:12px;margin-bottom:14px}
.sec-head h4{font-size:var(--t-xs);font-weight:620;color:var(--r-text)}
.sec-head span{font-size:var(--t-2xs);color:var(--r-faint)}

.bars{display:grid;gap:11px}
.bar-row{display:grid;grid-template-columns:118px minmax(0,1fr) 46px;gap:12px;align-items:center}
.bar-row>span{font-size:var(--t-xs);color:var(--r-muted)}
.bar-row>b{font-size:var(--t-xs);font-weight:560;text-align:right;color:var(--r-text);font-family:var(--mono);font-variant-numeric:tabular-nums}
.track{height:6px;border-radius:999px;background:var(--r-surface-2);overflow:hidden}
.fill{height:100%;width:0;border-radius:999px;background:var(--r-accent);transition:width .6s cubic-bezier(.22,.9,.28,1)}
.bar-row.lead>span{color:var(--r-text);font-weight:520}
.bar-row.lead .fill{background:var(--r-accent)}
.bar-row.dim .fill{background:#3D4550}

.risks{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.risk{background:var(--r-surface);border:1px solid var(--r-line);border-radius:var(--radius);padding:12px}
.risk-top{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:9px}
.risk-top span{font-size:var(--t-2xs);color:var(--r-muted)}
.risk-top b{font-size:var(--t-lg);font-weight:600;font-family:var(--mono);font-variant-numeric:tabular-nums;letter-spacing:-.03em}
.risk .track{height:4px}
.lvl-ok b{color:var(--r-accent)} .lvl-ok .fill{background:var(--r-accent)}
.lvl-warn b{color:var(--r-warn)} .lvl-warn .fill{background:var(--r-warn)}
.lvl-bad b{color:var(--r-risk)} .lvl-bad .fill{background:var(--r-risk)}

/* improve cta */
.cta{
  margin:18px 20px;padding:15px;border-radius:var(--radius);
  background:linear-gradient(180deg,var(--r-surface-2),var(--r-surface));
  border:1px solid var(--r-line);display:flex;align-items:center;justify-content:space-between;gap:16px;
}
.cta-copy{display:flex;align-items:center;gap:12px;min-width:0}
.cta-icon{width:36px;height:36px;border-radius:10px;background:var(--r-accent);color:#0B1512;display:grid;place-items:center;flex:none}
.cta-icon svg{width:19px;height:19px}
.cta b{display:block;font-size:var(--t-sm);font-weight:600}
.cta span{display:block;font-size:var(--t-2xs);color:var(--r-muted);margin-top:2px}

/* runs */
.runs{display:flex;align-items:center;gap:7px;flex-wrap:wrap}
.run{
  display:inline-flex;align-items:center;gap:7px;height:28px;padding:0 10px;border-radius:999px;
  border:1px solid var(--r-line);background:var(--r-surface);color:var(--r-muted);
  font-size:var(--t-2xs);transition:border-color .16s,color .16s;
}
.run:hover{border-color:#3A424D;color:var(--r-text)}
.run[aria-current="true"]{border-color:var(--r-accent);color:var(--r-text);background:rgba(63,207,174,.1)}
.run b{font-family:var(--mono);font-variant-numeric:tabular-nums;font-weight:600;color:var(--r-text)}
.run .delta{font-size:11px;font-family:var(--mono)}
.run .delta.up{color:var(--r-accent)}
.run .delta.down{color:var(--r-risk)}

/* raw json */
.raw-wrap{margin-top:12px}
pre{
  margin:0;max-height:300px;overflow:auto;background:#0B0E12;border:1px solid var(--r-line);
  border-radius:10px;padding:13px;font-family:var(--mono);font-size:var(--t-2xs);line-height:1.6;
  color:#C2CBD4;white-space:pre-wrap;word-break:break-word;
}

/* ---------------- drawer ---------------- */
.scrim{
  position:fixed;inset:0;background:rgba(10,13,17,.45);backdrop-filter:blur(3px);
  z-index:50;opacity:0;pointer-events:none;transition:opacity .22s;
}
.scrim.on{opacity:1;pointer-events:auto}
.drawer{
  position:fixed;top:0;right:0;bottom:0;z-index:60;width:min(720px,100%);
  background:var(--bg);border-left:1px solid var(--line);box-shadow:var(--shadow-lg);
  transform:translateX(101%);transition:transform .3s cubic-bezier(.22,.9,.28,1);
  display:flex;flex-direction:column;
}
.drawer.on{transform:translateX(0)}
.drawer-head{
  flex:none;display:flex;align-items:center;justify-content:space-between;gap:14px;
  padding:16px 20px;border-bottom:1px solid var(--line);background:var(--surface);
}
.drawer-head .cta-icon{background:var(--accent);color:#fff}
:root[data-theme="dark"] .drawer-head .cta-icon{color:#0B1512}
.drawer-head b{display:block;font-size:var(--t-md);font-weight:620}
.drawer-head span{display:block;font-size:var(--t-2xs);color:var(--muted);margin-top:2px}
.drawer-body{flex:1;overflow:auto;padding:20px;overscroll-behavior:contain}
.drawer-foot{
  flex:none;display:flex;gap:9px;padding:14px 20px;border-top:1px solid var(--line);background:var(--surface);
}

.drawer-loading{padding:60px 20px;text-align:center}
.drawer-loading .spinner{width:26px;height:26px;border-width:2.5px;border-color:var(--line);border-top-color:var(--accent);margin:0 auto 16px}
.drawer-loading b{display:block;font-size:var(--t-md);font-weight:580}
.drawer-loading p{font-size:var(--t-sm);color:var(--muted);margin-top:5px}

.delta-row{display:grid;grid-template-columns:1fr auto 1fr;gap:14px;align-items:center;margin-bottom:18px}
.delta-box{background:var(--surface);border:1px solid var(--line);border-radius:var(--radius);padding:13px 15px}
.delta-box span{display:block;font-size:var(--t-2xs);color:var(--muted)}
.delta-box strong{display:block;font-size:30px;font-weight:600;letter-spacing:-.04em;margin-top:3px;font-family:var(--mono);font-variant-numeric:tabular-nums}
.delta-box em{font-style:normal;font-size:var(--t-sm);font-weight:600;margin-left:8px;font-family:var(--mono)}
.delta-box em.up{color:var(--accent)}
.delta-box em.down{color:var(--risk)}
.delta-box em.flat{color:var(--muted)}
.delta-arrow{color:var(--faint)}
.delta-arrow svg{width:20px;height:20px}

.chips{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:18px}
.chip{
  display:inline-flex;align-items:center;gap:6px;padding:6px 10px;border-radius:999px;
  border:1px solid var(--line);background:var(--surface);font-size:var(--t-2xs);color:var(--ink-2);
}
.chip.gain{border-color:rgba(14,124,102,.34);background:var(--accent-soft);color:var(--accent-ink)}
:root[data-theme="dark"] .chip.gain{color:var(--accent)}

.cands{display:grid;gap:8px;margin-bottom:18px}
.cand{
  width:100%;text-align:left;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:14px;align-items:center;
  padding:12px 14px;border:1px solid var(--line);background:var(--surface);border-radius:var(--radius);
  transition:border-color .16s,background .16s;
}
.cand:hover{border-color:var(--line-strong)}
.cand[aria-pressed="true"]{border-color:var(--accent);background:var(--accent-soft)}
.cand b{display:block;font-size:var(--t-xs);font-weight:600}
.cand span{display:block;font-size:var(--t-2xs);color:var(--muted);margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cand-score{font-family:var(--mono);font-variant-numeric:tabular-nums;font-size:var(--t-lg);font-weight:600;letter-spacing:-.03em}
.cand-badge{font-size:11px;color:var(--accent-ink);background:var(--accent-soft);border-radius:5px;padding:2px 5px;margin-left:7px;vertical-align:1px}
:root[data-theme="dark"] .cand-badge{color:var(--accent)}

.draft{background:var(--surface);border:1px solid var(--line);border-radius:var(--radius);overflow:hidden;margin-bottom:12px}
.draft-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 14px;border-bottom:1px solid var(--line);background:var(--surface-2)}
.draft-head b{font-size:var(--t-xs);font-weight:600}
.draft-head span{font-size:var(--t-2xs);color:var(--muted)}
.draft-body{padding:15px}
.draft-title{font-size:var(--t-lg);font-weight:600;line-height:1.35;letter-spacing:-.017em}
.draft-text{font-size:var(--t-sm);line-height:1.65;color:var(--ink-2);white-space:pre-wrap;max-width:68ch}

details.compare{border:1px solid var(--line);border-radius:var(--radius);background:var(--surface);overflow:hidden}
details.compare summary{padding:12px 14px;font-size:var(--t-xs);font-weight:580;cursor:pointer;list-style:none;display:flex;align-items:center;gap:8px}
details.compare summary::-webkit-details-marker{display:none}
details.compare summary svg{width:15px;height:15px;color:var(--muted);transition:transform .18s}
details.compare[open] summary svg{transform:rotate(90deg)}
.compare-grid{display:grid;grid-template-columns:1fr 1fr;gap:1px;background:var(--line);border-top:1px solid var(--line)}
.compare-cell{background:var(--surface);padding:14px}
.compare-cell b{display:block;font-size:var(--t-2xs);color:var(--muted);margin-bottom:8px}
.compare-cell p{font-size:var(--t-xs);line-height:1.6;color:var(--ink-2);white-space:pre-wrap}

/* ---------------- modal ---------------- */
.modal{
  position:fixed;inset:0;z-index:70;display:grid;place-items:center;padding:20px;
  opacity:0;pointer-events:none;transition:opacity .2s;
}
.modal.on{opacity:1;pointer-events:auto}
.modal-card{
  width:min(560px,100%);max-height:min(84dvh,720px);overflow:auto;background:var(--surface);
  border:1px solid var(--line);border-radius:var(--radius-lg);box-shadow:var(--shadow-lg);
  transform:translateY(10px) scale(.99);transition:transform .2s;
}
.modal.on .modal-card{transform:none}
.modal-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px 20px;border-bottom:1px solid var(--line);position:sticky;top:0;background:var(--surface)}
.modal-head h3{font-size:var(--t-md);font-weight:620}
.modal-body{padding:20px}
.modal-body h4{font-size:var(--t-xs);font-weight:620;margin:18px 0 7px}
.modal-body h4:first-child{margin-top:0}
.modal-body p{font-size:var(--t-sm);color:var(--muted);line-height:1.6;max-width:62ch}
.modal-body ul{margin:7px 0 0;padding-left:19px;font-size:var(--t-sm);color:var(--muted);line-height:1.65}
.modal-body li{margin-bottom:5px}
.modal-body code{font-family:var(--mono);font-size:var(--t-2xs);background:var(--surface-3);padding:2px 5px;border-radius:5px;color:var(--ink-2)}
.formula{
  margin-top:10px;padding:13px;border-radius:10px;background:var(--surface-2);border:1px solid var(--line);
  font-family:var(--mono);font-size:var(--t-2xs);line-height:1.8;color:var(--ink-2);
}

/* ---------------- toast ---------------- */
.toasts{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:90;display:grid;gap:9px;width:min(420px,calc(100vw - 32px))}
.toast{
  display:flex;align-items:flex-start;gap:11px;padding:13px 14px;border-radius:var(--radius);
  background:var(--ink);color:#F4F6F8;box-shadow:var(--shadow-lg);
  animation:rise .24s cubic-bezier(.22,.9,.28,1);
}
:root[data-theme="dark"] .toast{background:#242A32;border:1px solid #333B45}
@keyframes rise{from{opacity:0;transform:translateY(12px)}}
.toast.out{animation:sink .2s forwards}
@keyframes sink{to{opacity:0;transform:translateY(10px)}}
.toast-ico{width:18px;height:18px;flex:none;margin-top:1px;color:#8FA0AE}
.toast.ok .toast-ico{color:#3FCFAE}
.toast.bad .toast-ico{color:#F0736B}
.toast-copy{flex:1;min-width:0}
.toast b{display:block;font-size:var(--t-xs);font-weight:600}
.toast span{display:block;font-size:var(--t-2xs);color:#AEB8C2;margin-top:2px;line-height:1.45}
.toast-act{
  flex:none;align-self:center;height:28px;padding:0 11px;border-radius:7px;
  border:1px solid rgba(255,255,255,.2);color:#fff;font-size:var(--t-2xs);font-weight:580;
}
.toast-act:hover{background:rgba(255,255,255,.1)}
.toast-x{flex:none;color:#8792A0;width:18px;height:18px}
.toast-x:hover{color:#fff}

/* ---------------- responsive ---------------- */
@media(max-width:1080px){
  .layout{grid-template-columns:1fr}
  .empty,.loading,.errstate{min-height:340px}
  .hero{padding:26px 0 24px}
}
@media(max-width:720px){
  .shell{width:min(100% - 24px,1320px)}
  .topbar{padding:14px 0;flex-wrap:wrap}
  .wordmark small{display:none}
  .pop{top:auto;left:0;right:0;width:auto}
  .hero h1{font-size:30px}
  .hero p{font-size:var(--t-sm)}
  .grid-2{grid-template-columns:1fr}
  .score-grid{grid-template-columns:1fr;gap:18px;text-align:center}
  .gauge-wrap{margin:0 auto}
  .verdict p{margin-left:auto;margin-right:auto}
  .tags{justify-content:center}
  .risks{grid-template-columns:1fr}
  .bar-row{grid-template-columns:100px minmax(0,1fr) 42px}
  .cta{flex-direction:column;align-items:stretch}
  .cta .btn{width:100%}
  .compare-grid{grid-template-columns:1fr}
  .delta-row{grid-template-columns:1fr;gap:10px}
  .delta-arrow{transform:rotate(90deg);margin:0 auto}
  .actions{flex-wrap:wrap}
  .actions .grow{flex:1 1 100%}
  .drawer-foot{flex-wrap:wrap}
  .toasts{bottom:14px}
}
@media(prefers-reduced-motion:reduce){
  *,*::before,*::after{animation-duration:.01ms !important;animation-iteration-count:1 !important;transition-duration:.01ms !important}
}
@media print{
  .topbar,.hero,.actions,.cta,.toasts,.drawer,.scrim{display:none !important}
  .layout{grid-template-columns:1fr}
  .panel{box-shadow:none}
}
</style>
</head>
<body>
<a class="sr" href="#draft">Skip to the draft editor</a>

<div class="shell">

  <header class="topbar">
    <a class="brand" href="/" aria-label="ThreadPulse">
      <span class="mark" aria-hidden="true">
        <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
          <path d="M5 17h3.4l2.6-7.4 3.8 14 2.7-8.3 1.8 3.5h2.4"/>
          <circle cx="25.4" cy="18.8" r="2.1" fill="currentColor" stroke="none"/>
        </svg>
      </span>
      <span class="wordmark"><b>ThreadPulse</b><small>Runs on your machine</small></span>
    </a>

    <div class="topbar-actions">
      <button class="pill" id="connBtn" aria-expanded="false" aria-controls="connPanel">
        <span class="dot" id="connDot"></span>
        <span id="connText">No API key</span>
      </button>
      <button class="iconbtn" id="themeBtn" aria-label="Switch to dark theme" title="Switch theme">
        <svg id="themeIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11Z"/>
        </svg>
      </button>
      <button class="iconbtn" id="helpBtn" aria-label="How the score works" title="How the score works">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="9"/><path d="M9.6 9.4a2.5 2.5 0 1 1 3.3 2.4c-.6.2-.9.8-.9 1.4v.4"/><path d="M12 17h.01"/>
        </svg>
      </button>
    </div>

    <div class="pop" id="connPanel" hidden>
      <h3>TypeSafe API key</h3>
      <p class="pop-sub">Needed to score and rewrite a draft. Demo mode works without one.</p>
      <label class="sr" for="apiKey">TypeSafe API key</label>
      <input class="input" id="apiKey" type="password" autocomplete="off" spellcheck="false" placeholder="sk-...">
      <div class="pop-row">
        <button class="btn btn-primary grow" id="testBtn">Test connection</button>
        <button class="btn" id="forgetBtn">Forget key</button>
      </div>
      <p class="pop-note" id="keyNote">Saved in this browser only. It is sent straight to TypeSafe with each request and never written to disk or the terminal.</p>
    </div>
  </header>

  <section class="hero">
    <h1>Find out how a post lands before you post it.</h1>
    <p>Paste a Reddit draft. ThreadPulse scores its pull, names the weakest signal, then writes and ranks alternatives against the same scale.</p>
  </section>

  <main class="layout">

    <!-- ============ draft ============ -->
    <section class="panel" id="draft" aria-labelledby="draftHeading">
      <div class="panel-head">
        <div>
          <h2 id="draftHeading">Draft</h2>
          <p class="sub" id="saveState">Saved on this device as you type</p>
        </div>
        <button class="btn btn-sm" id="sampleBtn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/><path d="M9 12h6M9 16h4"/>
          </svg>
          Fill with example
        </button>
      </div>

      <div class="panel-body">
        <div class="grid-2">
          <div class="field">
            <div class="field-label"><label for="subreddit">Subreddit</label></div>
            <div class="prefixed">
              <span class="prefix" aria-hidden="true">r/</span>
              <input class="input" id="subreddit" placeholder="SideProject" autocomplete="off" spellcheck="false">
            </div>
          </div>
          <div class="field">
            <div class="field-label"><label for="authorContext">Your angle</label></div>
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
          <div class="field-label">
            <label for="title">Title</label>
            <span class="counter" id="titleCount">0/300</span>
          </div>
          <input class="input" id="title" maxlength="300" placeholder="The title exactly as you would post it" autocomplete="off">
          <p class="hint" id="titleHint">Reddit cuts titles at 300 characters.</p>
        </div>

        <div class="field">
          <div class="field-label">
            <label for="body">Body</label>
            <span class="counter" id="bodyCount">0 characters</span>
          </div>
          <textarea class="input" id="body" placeholder="The post itself. Leave empty for a link or image post."></textarea>
        </div>

        <div class="field">
          <div class="switch-row">
            <div class="switch-copy">
              <span class="switch-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="5" width="18" height="14" rx="2.5"/><circle cx="8.5" cy="10" r="1.6"/><path d="m4 17 4.6-4.2 3 2.6 2.7-2.2L20 17"/>
                </svg>
              </span>
              <div>
                <b>Post has an image</b>
                <small>Describe it so the model can judge it</small>
              </div>
            </div>
            <span class="switch">
              <input id="imageToggle" type="checkbox" role="switch" aria-label="Post has an image">
              <span class="slider" aria-hidden="true"></span>
            </span>
          </div>

          <div class="subpanel" id="imageArea" hidden>
            <div class="dropzone" id="dropzone">
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
              <div class="field-label"><label for="imageNotes">What the image shows</label></div>
              <input class="input" id="imageNotes" placeholder="A dashboard screenshot with the weekly chart" autocomplete="off">
              <p class="hint">Only this description is scored, so make it match what a reader would see.</p>
            </div>
          </div>
        </div>

        <div class="actions">
          <button class="btn btn-primary grow" id="analyzeBtn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 18V11M9 18V5M14 18v-5M19 18V8"/>
            </svg>
            <span id="analyzeText">Score this draft</span>
            <span class="kbd" id="kbdHint" aria-hidden="true">Ctrl+Enter</span>
          </button>
          <button class="btn" id="demoBtn" title="Score offline with a local estimate">Try offline</button>
          <button class="btn btn-icon" id="clearBtn" aria-label="Clear the draft" title="Clear the draft">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 7h16"/><path d="M9.5 7V4.8A.8.8 0 0 1 10.3 4h3.4a.8.8 0 0 1 .8.8V7"/><path d="M6.5 7 7.4 20h9.2L17.5 7"/><path d="M10.5 11v5M13.5 11v5"/>
            </svg>
          </button>
        </div>
      </div>
    </section>

    <!-- ============ readout ============ -->
    <section class="panel readout" aria-labelledby="readoutHeading">
      <div class="panel-head">
        <div>
          <h2 id="readoutHeading">Readout</h2>
          <p class="sub" id="readoutSub">Nothing scored yet</p>
        </div>
        <div class="runs" id="runs" aria-label="Previous scores"></div>
      </div>

      <!-- empty -->
      <div class="state on" id="stateEmpty">
        <div class="empty">
          <div>
            <div class="empty-mark" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 14h3l2.2-6.4 3.2 12 2.3-7.2L16 14h5"/>
              </svg>
            </div>
            <h3>No reading yet</h3>
            <p>Write a title and body on the left, then score it. Every run is kept here so you can watch the number move.</p>
            <div class="empty-actions">
              <button class="btn btn-accent" id="emptySample">Use the example draft</button>
              <button class="btn" id="emptyDemo">Score offline</button>
            </div>
          </div>
        </div>
      </div>

      <!-- loading -->
      <div class="state" id="stateLoading">
        <div class="loading">
          <div class="loading-note"><span class="spinner"></span><span id="loadingText">Sending the draft to TypeSafe</span></div>
          <div class="skel-top">
            <div class="skel skel-ring"></div>
            <div class="skel-lines">
              <div class="skel" style="height:22px;width:45%"></div>
              <div class="skel" style="height:13px;width:88%"></div>
              <div class="skel" style="height:13px;width:64%"></div>
              <div class="skel" style="height:26px;width:76%;margin-top:6px"></div>
            </div>
          </div>
          <div class="skel" style="height:13px;width:24%;margin-bottom:14px"></div>
          <div class="skel" style="height:6px;margin-bottom:12px"></div>
          <div class="skel" style="height:6px;margin-bottom:12px"></div>
          <div class="skel" style="height:6px;margin-bottom:28px"></div>
          <div class="skel" style="height:13px;width:18%;margin-bottom:14px"></div>
          <div class="skel" style="height:74px"></div>
        </div>
      </div>

      <!-- error -->
      <div class="state" id="stateError">
        <div class="errstate">
          <div>
            <div class="err-mark" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 8v5"/><path d="M12 16.5h.01"/><circle cx="12" cy="12" r="9"/>
              </svg>
            </div>
            <h3 id="errTitle">The request did not go through</h3>
            <p id="errText"></p>
            <p class="err-detail" id="errDetail" hidden></p>
            <div class="empty-actions">
              <button class="btn btn-accent" id="retryBtn">Try again</button>
              <button class="btn" id="errKeyBtn">Check API key</button>
            </div>
          </div>
        </div>
      </div>

      <!-- result -->
      <div class="state" id="stateResult">
        <div class="score-head">
          <div class="score-grid">
            <div class="gauge-wrap">
              <svg class="gauge" viewBox="0 0 118 118" aria-hidden="true">
                <circle class="track" cx="59" cy="59" r="50"/>
                <circle class="arc" id="gaugeArc" cx="59" cy="59" r="50" stroke-dasharray="314.16" stroke-dashoffset="314.16"/>
              </svg>
              <div class="gauge-val">
                <strong id="scoreNum">0</strong>
                <span>out of 100</span>
              </div>
            </div>
            <div class="verdict">
              <h3 id="verdictTitle">—</h3>
              <p id="verdictText">—</p>
              <div class="tags">
                <span class="tag"><i>Reads as</i><b id="tagIntent">—</b></span>
                <span class="tag"><i>Pulls on</i><b id="tagDriver">—</b></span>
                <span class="tag"><i>Model certainty</i><b id="tagConf">—</b></span>
              </div>
            </div>
          </div>
        </div>

        <div class="sec">
          <div class="sec-head">
            <h4>What is working</h4>
            <span id="weakestNote"></span>
          </div>
          <div class="bars">
            <div class="bar-row" id="rowTitle">
              <span>Title strength</span>
              <div class="track"><div class="fill" id="barTitle"></div></div>
              <b id="valTitle">0</b>
            </div>
            <div class="bar-row" id="rowDiscussion">
              <span>Reason to reply</span>
              <div class="track"><div class="fill" id="barDiscussion"></div></div>
              <b id="valDiscussion">0</b>
            </div>
            <div class="bar-row" id="rowRelevance">
              <span>Fit with the sub</span>
              <div class="track"><div class="fill" id="barRelevance"></div></div>
              <b id="valRelevance">0</b>
            </div>
          </div>
        </div>

        <div class="sec">
          <div class="sec-head">
            <h4>How readers will take it</h4>
            <span>Top matches</span>
          </div>
          <div class="bars" id="intentBars"></div>
        </div>

        <div class="sec">
          <div class="sec-head">
            <h4>What could get it buried</h4>
            <span>Lower is better</span>
          </div>
          <div class="risks">
            <div class="risk" id="riskPromo">
              <div class="risk-top"><span>Reads as promo</span><b id="valPromo">0</b></div>
              <div class="track"><div class="fill" id="barPromo"></div></div>
            </div>
            <div class="risk" id="riskClick">
              <div class="risk-top"><span>Overpromises</span><b id="valClick">0</b></div>
              <div class="track"><div class="fill" id="barClick"></div></div>
            </div>
            <div class="risk" id="riskMod">
              <div class="risk-top"><span>Mod trouble</span><b id="valMod">0</b></div>
              <div class="track"><div class="fill" id="barMod"></div></div>
            </div>
          </div>
        </div>

        <div class="cta">
          <div class="cta-copy">
            <span class="cta-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="m12 3.5 1.5 4.6L18 9.6l-4.5 1.5L12 15.7l-1.5-4.6L6 9.6l4.5-1.5L12 3.5Z"/>
                <path d="m18.5 15 .8 2.4 2.4.8-2.4.8-.8 2.4-.8-2.4-2.4-.8 2.4-.8.8-2.4Z"/>
              </svg>
            </span>
            <div>
              <b>Rewrite and re-score</b>
              <span>Four alternatives, graded on the same scale</span>
            </div>
          </div>
          <button class="btn btn-accent" id="improveBtn">Rewrite this</button>
        </div>

        <div class="sec">
          <div class="sec-head">
            <h4>Underneath</h4>
            <span id="modelNote"></span>
          </div>
          <div style="display:flex;gap:9px;flex-wrap:wrap">
            <button class="btn btn-sm" id="rawBtn" aria-expanded="false" aria-controls="rawWrap">Show raw response</button>
            <button class="btn btn-sm" id="copyReportBtn">Copy summary</button>
            <button class="btn btn-sm" id="downloadBtn">Download JSON</button>
          </div>
          <div class="raw-wrap" id="rawWrap" hidden><pre id="rawJson"></pre></div>
        </div>
      </div>
    </section>
  </main>
</div>

<!-- ============ rewrite drawer ============ -->
<div class="scrim" id="scrim"></div>
<aside class="drawer" id="drawer" role="dialog" aria-modal="true" aria-labelledby="drawerTitle" tabindex="-1" hidden>
  <div class="drawer-head">
    <div style="display:flex;align-items:center;gap:12px;min-width:0">
      <span class="cta-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="m12 3.5 1.5 4.6L18 9.6l-4.5 1.5L12 15.7l-1.5-4.6L6 9.6l4.5-1.5L12 3.5Z"/>
          <path d="m18.5 15 .8 2.4 2.4.8-2.4.8-.8 2.4-.8-2.4-2.4-.8 2.4-.8.8-2.4Z"/>
        </svg>
      </span>
      <div style="min-width:0">
        <b id="drawerTitle">Rewrites</b>
        <span id="drawerSub">Scored against your original</span>
      </div>
    </div>
    <button class="btn btn-icon" id="closeDrawer" aria-label="Close rewrites">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="m6 6 12 12M18 6 6 18"/></svg>
    </button>
  </div>

  <div class="drawer-body">
    <div class="drawer-loading" id="drawerLoading">
      <div class="spinner"></div>
      <b>Grading four rewrites</b>
      <p>Each one is scored the same way your draft was.</p>
    </div>

    <div id="drawerResult" hidden>
      <div class="delta-row">
        <div class="delta-box">
          <span>Your draft</span>
          <strong id="beforeScore">—</strong>
        </div>
        <div class="delta-arrow" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h15m-5-5 5 5-5 5"/></svg>
        </div>
        <div class="delta-box">
          <span id="afterLabel">Best rewrite</span>
          <strong><span id="afterScore">—</span><em id="gain">—</em></strong>
        </div>
      </div>

      <div class="chips" id="gainChips"></div>

      <div class="cands" id="cands" role="group" aria-label="Rewrite options"></div>

      <div class="draft">
        <div class="draft-head"><b>Title</b><span id="candLabel"></span></div>
        <div class="draft-body"><div class="draft-title" id="improvedTitle"></div></div>
      </div>

      <div class="draft">
        <div class="draft-head"><b>Body</b><span>Only your own facts, reordered</span></div>
        <div class="draft-body"><div class="draft-text" id="improvedBody"></div></div>
      </div>

      <details class="compare">
        <summary>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg>
          Compare with your draft
        </summary>
        <div class="compare-grid">
          <div class="compare-cell"><b>Yours</b><p id="originalPreview"></p></div>
          <div class="compare-cell"><b>Rewrite</b><p id="improvedPreview"></p></div>
        </div>
      </details>
    </div>
  </div>

  <div class="drawer-foot" id="drawerFoot" hidden>
    <button class="btn btn-primary grow" id="applyBtn">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7"/></svg>
      Put it in the editor
    </button>
    <button class="btn" id="copyImprovedBtn">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <rect x="8.5" y="8.5" width="11" height="11" rx="2.5"/><path d="M15.5 8.5V6a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2H8"/>
      </svg>
      Copy
    </button>
  </div>
</aside>

<!-- ============ help modal ============ -->
<div class="modal" id="helpModal" role="dialog" aria-modal="true" aria-labelledby="helpTitle" hidden>
  <div class="modal-card">
    <div class="modal-head">
      <h3 id="helpTitle">How the score is built</h3>
      <button class="btn btn-icon" id="closeHelp" aria-label="Close">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="m6 6 12 12M18 6 6 18"/></svg>
      </button>
    </div>
    <div class="modal-body">
      <h4>Where the numbers come from</h4>
      <p>Eight separate judgements are requested for one draft: two labels (how it reads, what pulls people in), three graded qualities, and three risk checks. Nothing is averaged out of a single opinion.</p>

      <h4>The arithmetic</h4>
      <div class="formula">
quality = 0.34·title + 0.34·reply + 0.32·fit<br>
risk&nbsp;&nbsp;&nbsp;&nbsp;= 0.42·promo + 0.25·overpromise + 0.33·mod<br>
score&nbsp;&nbsp;&nbsp;= 0.82·quality + 0.18·(1 − risk)
          </div>
      <p style="margin-top:10px">Quality carries the score. Risk mostly acts as a brake, except when promo or mod risk is severe, which forces the verdict down on its own.</p>

      <h4>What the bands mean</h4>
      <ul>
        <li><b>78 and up</b> — worth posting as is.</li>
        <li><b>62 to 77</b> — solid, with one signal left on the table.</li>
        <li><b>45 to 61</b> — readable, but nobody has a reason to reply yet.</li>
        <li><b>Under 45</b> — the point of the post is not landing.</li>
      </ul>

      <h4>Rewrites</h4>
      <p>Four versions are built from your own sentences: one restructured, one aimed at discussion, one trimmed, and one with the sales tone taken out. No new facts are invented. Each is scored by the same eight judgements and ranked, so the winner is earned rather than asserted.</p>

      <h4>Offline mode</h4>
      <p>Scoring offline uses a small local heuristic, no network, no key. Useful for a feel of the interface, not for a real read.</p>

      <h4>Shortcuts</h4>
      <ul>
        <li><code id="scKey">Ctrl</code> + <code>Enter</code> — score the draft</li>
        <li><code>Esc</code> — close rewrites or this window</li>
      </ul>

      <h4>Privacy</h4>
      <p>The server here only relays requests to TypeSafe. Your key and draft live in this browser's local storage. Images stay in the page and are never uploaded.</p>
    </div>
  </div>
</div>

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
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
};
var pretty = function (s) {
  return String(s || "\u2014").split("_").join(" ").replace(/^\w/, function (m) { return m.toUpperCase(); });
};
var isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
var MOD = isMac ? "\u2318" : "Ctrl";

var store = {
  get: function (k, fallback) {
    try { var v = localStorage.getItem("threadpulse." + k); return v === null ? fallback : JSON.parse(v); }
    catch (e) { return fallback; }
  },
  set: function (k, v) {
    try { localStorage.setItem("threadpulse." + k, JSON.stringify(v)); } catch (e) { /* private mode */ }
  },
  del: function (k) { try { localStorage.removeItem("threadpulse." + k); } catch (e) {} }
};

/* ============================================================
   app state
============================================================ */
var current = null;       /* { state, response, scores, source } */
var runs = [];            /* history of scored runs */
var candidates = [];      /* current rewrite set */
var selectedCand = null;
var lastAction = null;    /* for the retry button */
var busy = false;

/* ============================================================
   toasts
============================================================ */
var ICONS = {
  ok: '<path d="m5 12.5 4.5 4.5L19 7"/>',
  bad: '<circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16.5h.01"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.5h.01"/>'
};
function toast(kind, title, text, action) {
  var el = document.createElement("div");
  el.className = "toast " + kind;
  var html = '<svg class="toast-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" ' +
    'stroke-linecap="round" stroke-linejoin="round">' + (ICONS[kind] || ICONS.info) + '</svg>' +
    '<div class="toast-copy"><b>' + esc(title) + '</b>' + (text ? '<span>' + esc(text) + '</span>' : '') + '</div>';
  if (action) html += '<button class="toast-act" type="button">' + esc(action.label) + '</button>';
  html += '<button class="toast-x" type="button" aria-label="Dismiss">' +
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">' +
    '<path d="m6 6 12 12M18 6 6 18"/></svg></button>';
  el.innerHTML = html;

  var close = function () {
    el.classList.add("out");
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 220);
  };
  if (action) el.querySelector(".toast-act").addEventListener("click", function () { close(); action.run(); });
  el.querySelector(".toast-x").addEventListener("click", close);

  $("toasts").appendChild(el);
  var life = action ? 8000 : 4200;
  setTimeout(close, life);
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
var savedTheme = store.get("theme", null);
applyTheme(savedTheme || (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
$("themeBtn").addEventListener("click", function () {
  var t = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
  applyTheme(t); store.set("theme", t);
});

/* ============================================================
   connection panel + key
============================================================ */
function setConn(kind, text) {
  $("connDot").className = "dot " + (kind || "");
  $("connText").textContent = text;
}
function openConn(open) {
  $("connPanel").hidden = !open;
  $("connBtn").setAttribute("aria-expanded", open ? "true" : "false");
  if (open) $("apiKey").focus();
}
$("connBtn").addEventListener("click", function () { openConn($("connPanel").hidden); });
document.addEventListener("click", function (e) {
  if (!$("connPanel").hidden && !$("connPanel").contains(e.target) && !$("connBtn").contains(e.target)) openConn(false);
});

var storedKey = store.get("key", "");
if (storedKey) { $("apiKey").value = storedKey; setConn("", "Key saved"); }
else setConn("", "No API key");

$("apiKey").addEventListener("input", function () {
  var v = $("apiKey").value.trim();
  if (v) { store.set("key", v); setConn("", "Key saved"); } else { store.del("key"); setConn("", "No API key"); }
  syncAnalyze();
});
$("forgetBtn").addEventListener("click", function () {
  $("apiKey").value = ""; store.del("key"); setConn("", "No API key");
  toast("info", "Key removed", "It is gone from this browser."); syncAnalyze();
});

function key() { return $("apiKey").value.trim(); }

/* ============================================================
   API
============================================================ */
function api(payload) {
  var k = key();
  if (!k) return Promise.reject(new Error("No API key is set."));
  return fetch("/api/typesafe", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-TypeSafe-Key": k },
    body: JSON.stringify(payload)
  }).then(function (res) {
    return res.json().catch(function () { return {}; }).then(function (data) {
      if (!res.ok) {
        var msg = data.error || (data.detail && data.detail.message) || data.detail || data.message;
        if (!msg) msg = "TypeSafe replied with status " + res.status + ".";
        if (res.status === 401 || res.status === 403) msg = "TypeSafe rejected the key.";
        var err = new Error(msg); err.status = res.status; throw err;
      }
      return data;
    });
  });
}

$("testBtn").addEventListener("click", function () {
  if (!key()) { toast("bad", "Add a key first", "Paste your TypeSafe key in the box above."); $("apiKey").focus(); return; }
  setConn("busy", "Testing");
  $("testBtn").disabled = true;
  api({
    state: "ThreadPulse connection test",
    model: "jev-latest",
    questions: { ok: { type: "noul", instructions: "Is this text clearly an API connection test?" } }
  }).then(function () {
    setConn("ok", "Connected");
    toast("ok", "Connected", "TypeSafe answered as expected.");
    openConn(false);
  }).catch(function (e) {
    setConn("bad", "Not connected");
    toast("bad", "Connection failed", e.message);
  }).then(function () { $("testBtn").disabled = false; });
});

/* ============================================================
   draft: autosave, counters, validation
============================================================ */
var FIELDS = ["subreddit", "authorContext", "title", "body", "imageNotes"];
var saveTimer = null;

function saveDraft() {
  var d = {};
  FIELDS.forEach(function (id) { d[id] = $(id).value; });
  d.imageToggle = $("imageToggle").checked;
  store.set("draft", d);
  $("saveState").textContent = "Saved just now";
  clearTimeout(saveTimer);
  saveTimer = setTimeout(function () { $("saveState").textContent = "Saved on this device as you type"; }, 2200);
}
function loadDraft() {
  var d = store.get("draft", null);
  if (!d) return;
  FIELDS.forEach(function (id) { if (typeof d[id] === "string") $(id).value = d[id]; });
  if (d.imageToggle) { $("imageToggle").checked = true; $("imageArea").hidden = false; }
}

function updateCounters() {
  var t = $("title").value.length;
  var c = $("titleCount");
  c.textContent = t + "/300";
  c.className = "counter" + (t >= 300 ? " over" : t > 260 ? " warn" : "");
  var b = $("body").value.length;
  $("bodyCount").textContent = b === 1 ? "1 character" : b.toLocaleString() + " characters";

  var hint = $("titleHint");
  if (t === 0) { hint.textContent = "Reddit cuts titles at 300 characters."; hint.className = "hint"; }
  else if (t < 15) { hint.textContent = "Short titles rarely give anyone a reason to click."; hint.className = "hint"; }
  else if (t >= 300) { hint.textContent = "You are at the limit. Reddit will not take any more."; hint.className = "hint err"; }
  else { hint.textContent = "Reddit cuts titles at 300 characters."; hint.className = "hint"; }
}

function syncAnalyze() {
  var ok = $("title").value.trim().length > 0;
  $("analyzeBtn").disabled = !ok || busy;
  $("improveBtn") && ($("improveBtn").disabled = busy);
}

FIELDS.forEach(function (id) {
  $(id).addEventListener("input", function () { updateCounters(); syncAnalyze(); saveDraft(); });
  $(id).addEventListener("change", saveDraft);
});

$("imageToggle").addEventListener("change", function () {
  $("imageArea").hidden = !this.checked;
  saveDraft();
});

/* image preview (local only) */
function showImage(file) {
  if (!file) return;
  if (!/^image\//.test(file.type)) { toast("bad", "Not an image", "Pick a PNG, JPG, GIF or WebP."); return; }
  if (file.size > 12 * 1024 * 1024) { toast("bad", "Image too large", "Keep the preview under 12 MB."); return; }
  var reader = new FileReader();
  reader.onload = function (ev) {
    $("thumbImg").src = ev.target.result;
    $("thumbMeta").textContent = file.name + " \u00b7 " + Math.max(1, Math.round(file.size / 1024)) + " KB";
    $("thumb").hidden = false;
    $("dropzone").hidden = true;
    if (!$("imageNotes").value.trim()) $("imageNotes").focus();
  };
  reader.readAsDataURL(file);
}
$("imageInput").addEventListener("change", function (e) { showImage(e.target.files && e.target.files[0]); });
$("removeImg").addEventListener("click", function () {
  $("imageInput").value = ""; $("thumbImg").removeAttribute("src");
  $("thumb").hidden = true; $("dropzone").hidden = false;
});
["dragenter", "dragover"].forEach(function (ev) {
  $("dropzone").addEventListener(ev, function (e) { e.preventDefault(); $("dropzone").classList.add("drag"); });
});
["dragleave", "drop"].forEach(function (ev) {
  $("dropzone").addEventListener(ev, function (e) { e.preventDefault(); $("dropzone").classList.remove("drag"); });
});
$("dropzone").addEventListener("drop", function (e) {
  showImage(e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]);
});

/* sample + clear */
function fillSample() {
  $("subreddit").value = "SideProject";
  $("authorContext").value = "creator_founder";
  $("title").value = "I built a free PDF reader for research papers - what should I add next?";
  $("body").value = "I wanted a cleaner way to read research papers, so I built a small open-source desktop reader with fast search and simple annotations. It is free.\n\nI would love feedback from people who read papers often: what is the one feature you wish your current PDF workflow had?";
  updateCounters(); syncAnalyze(); saveDraft();
}
$("sampleBtn").addEventListener("click", fillSample);
$("emptySample").addEventListener("click", function () { fillSample(); $("title").focus(); });

$("clearBtn").addEventListener("click", function () {
  if (!$("title").value && !$("body").value) { $("title").focus(); return; }
  var snapshot = {}; FIELDS.forEach(function (id) { snapshot[id] = $(id).value; });
  var hadImage = $("imageToggle").checked;
  FIELDS.forEach(function (id) { $(id).value = id === "authorContext" ? "not_provided" : ""; });
  $("imageToggle").checked = false; $("imageArea").hidden = true; $("removeImg").click();
  updateCounters(); syncAnalyze(); saveDraft(); $("title").focus();
  toast("info", "Draft cleared", "Your readings are still on the right.", {
    label: "Undo",
    run: function () {
      FIELDS.forEach(function (id) { $(id).value = snapshot[id]; });
      $("imageToggle").checked = hadImage; $("imageArea").hidden = !hadImage;
      updateCounters(); syncAnalyze(); saveDraft();
    }
  });
});

/* ============================================================
   the questions asked of the model
============================================================ */
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
  title_strength: {
    type: "score",
    instructions: "Judge the Reddit title for clarity, specificity, accuracy, and natural reader interest. Do not reward empty clickbait.",
    criteria: [
      "Weak, vague, confusing, generic, or misleading.",
      "Understandable but ordinary or missing useful specificity.",
      "Clear, specific, accurate, and naturally interesting.",
      "Exceptionally crisp and compelling while accurately setting expectations."
    ]
  },
  discussion_potential: {
    type: "score",
    instructions: "How much genuine discussion or useful response does this post naturally invite?",
    criteria: [
      "Little reason for readers to reply.",
      "Some readers may have something useful to add.",
      "Clear openings for useful replies or conversation.",
      "Many relevant readers are likely to have substantive experiences, opinions, or follow-up questions."
    ]
  },
  community_relevance: {
    type: "score",
    instructions: "How well is this post targeted to the stated subreddit or audience? If none is provided, judge whether it still has a clear audience.",
    criteria: [
      "Poorly targeted or audience unclear.",
      "Somewhat relevant but broad.",
      "Clearly relevant to a recognizable audience.",
      "Highly specific and naturally suited to the stated community."
    ]
  },
  self_promotion: { type: "noul", instructions: "Does this post primarily read as self-promotion, solicitation, advertising, or traffic acquisition rather than contribution?" },
  clickbait: { type: "noul", instructions: "Is the title meaningfully clickbait, misleading, manipulative, or disproportionately hyped compared with the content?" },
  moderation_risk: { type: "noul", instructions: "Based only on the supplied content, is there a clear common subreddit moderation risk such as spam, solicitation, low effort, unclear relevance, misleading framing, or excessive self-promotion?" }
};

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
   scoring maths (unchanged weights)
============================================================ */
function scorePct(a) {
  if (!a) return 0;
  var n = Object.keys(a.legend || {}).length || 4;
  return n > 1 ? clamp(Number(a.score) / (n - 1)) : 0;
}
function compose(a) {
  var title = scorePct(a.title_strength);
  var discussion = scorePct(a.discussion_potential);
  var relevance = scorePct(a.community_relevance);
  var promo = clamp(a.self_promotion && a.self_promotion.noul);
  var click = clamp(a.clickbait && a.clickbait.noul);
  var mod = clamp(a.moderation_risk && a.moderation_risk.noul);
  var quality = 0.34 * title + 0.34 * discussion + 0.32 * relevance;
  var risk = 0.42 * promo + 0.25 * click + 0.33 * mod;
  return {
    title: title, discussion: discussion, relevance: relevance,
    promo: promo, click: click, mod: mod,
    potential: clamp(quality * 0.82 + (1 - risk) * 0.18)
  };
}
function verdict(s) {
  if (s.mod > 0.68 || s.promo > 0.78)
    return ["Likely to be removed", "Promotion or moderation risk is drowning out everything else. Fix that before anything else."];
  if (s.potential >= 0.78)
    return ["Ready to post", "Clear value, the right audience, and an obvious reason to reply."];
  if (s.potential >= 0.62)
    return ["Nearly there", "A good draft with one signal still left on the table."];
  if (s.potential >= 0.45)
    return ["Needs a hook", "Perfectly readable, but nobody has been given a reason to reply."];
  return ["Not landing yet", "The point of the post is not coming through to a reader skimming a feed."];
}
function level(v) { return v < 0.34 ? "ok" : v < 0.67 ? "warn" : "bad"; }
function bandColor(p) {
  return p >= 0.62 ? "var(--r-accent)" : p >= 0.45 ? "var(--r-warn)" : "var(--r-risk)";
}

/* ============================================================
   rendering
============================================================ */
var GAUGE_C = 2 * Math.PI * 50;
function showState(which) {
  ["stateEmpty", "stateLoading", "stateError", "stateResult"].forEach(function (id) {
    $(id).classList.toggle("on", id === which);
  });
}
var SIGNAL_LABELS = { title: "Title strength", discussion: "Reason to reply", relevance: "Fit with the sub" };

function render(response, state, source) {
  var a = response.answers || {};
  var s = compose(a);
  var v = verdict(s);
  current = { state: state, response: response, scores: s, source: source };

  showState("stateResult");
  $("readoutSub").textContent = source === "demo"
    ? "Offline estimate, no model was called"
    : "Scored by " + (response.model || "jev-latest");
  $("modelNote").textContent = source === "demo" ? "Local heuristic" : (response.model || "jev-latest");

  $("scoreNum").textContent = pct(s.potential);
  var arc = $("gaugeArc");
  arc.style.stroke = bandColor(s.potential);
  arc.setAttribute("stroke-dasharray", GAUGE_C.toFixed(2));
  arc.setAttribute("stroke-dashoffset", (GAUGE_C * (1 - clamp(s.potential))).toFixed(2));

  $("verdictTitle").textContent = v[0];
  $("verdictText").textContent = v[1];
  $("tagIntent").textContent = pretty(a.post_intent && a.post_intent.choice);
  $("tagDriver").textContent = pretty(a.engagement_driver && a.engagement_driver.choice);
  var conf = (Number((a.post_intent && a.post_intent.confidence) || 0) +
              Number((a.engagement_driver && a.engagement_driver.confidence) || 0)) / 2;
  $("tagConf").textContent = pct(conf) + "%";

  var signals = [["title", s.title], ["discussion", s.discussion], ["relevance", s.relevance]];
  var sorted = signals.slice().sort(function (x, y) { return x[1] - y[1]; });
  var weakest = sorted[0], strongest = sorted[sorted.length - 1];
  signals.forEach(function (pair) {
    var k = pair[0], val = pair[1];
    var cap = k.charAt(0).toUpperCase() + k.slice(1);
    $("bar" + cap).style.width = pct(val) + "%";
    $("val" + cap).textContent = pct(val);
    var row = $("row" + cap);
    row.className = "bar-row" + (k === strongest[0] && strongest[1] - weakest[1] > 0.05 ? " lead" : "") +
      (k === weakest[0] && strongest[1] - weakest[1] > 0.05 ? " dim" : "");
  });
  $("weakestNote").textContent = strongest[1] - weakest[1] > 0.05
    ? "Weakest: " + SIGNAL_LABELS[weakest[0]].toLowerCase()
    : "Evenly balanced";

  [["Promo", s.promo], ["Click", s.click], ["Mod", s.mod]].forEach(function (pair) {
    var id = pair[0], val = pair[1];
    $("val" + id).textContent = pct(val);
    $("bar" + id).style.width = pct(val) + "%";
    $("risk" + id).className = "risk lvl-" + level(val);
  });

  var probs = (a.post_intent && a.post_intent.probabilities) || {};
  var entries = Object.keys(probs).map(function (k) { return [k, probs[k]]; })
    .sort(function (x, y) { return y[1] - x[1]; }).slice(0, 5);
  $("intentBars").innerHTML = entries.length
    ? entries.map(function (e, i) {
        return '<div class="bar-row' + (i === 0 ? " lead" : "") + '">' +
          '<span>' + esc(pretty(e[0])) + '</span>' +
          '<div class="track"><div class="fill" style="width:' + pct(e[1]) + '%' +
          (i === 0 ? "" : ";background:#3D4550") + '"></div></div>' +
          '<b>' + pct(e[1]) + '</b></div>';
      }).join("")
    : '<p style="font-size:var(--t-xs);color:var(--r-faint)">No breakdown returned.</p>';

  $("rawJson").textContent = JSON.stringify(response, null, 2);
  $("rawWrap").hidden = true;
  $("rawBtn").setAttribute("aria-expanded", "false");
  $("rawBtn").textContent = "Show raw response";
}

/* run history */
function addRun(response, state, source) {
  runs.push({ score: pct(compose(response.answers || {}).potential), response: response, state: state, source: source });
  if (runs.length > 8) runs.shift();
  renderRuns(runs.length - 1);
}
function renderRuns(activeIndex) {
  if (runs.length < 2) { $("runs").innerHTML = ""; return; }
  $("runs").innerHTML = runs.map(function (r, i) {
    var d = i === 0 ? null : r.score - runs[i - 1].score;
    var delta = d === null || d === 0 ? "" :
      '<span class="delta ' + (d > 0 ? "up" : "down") + '">' + (d > 0 ? "+" : "") + d + "</span>";
    return '<button class="run" type="button" data-i="' + i + '" aria-current="' + (i === activeIndex) + '">' +
      "Run " + (i + 1) + '<b>' + r.score + "</b>" + delta + "</button>";
  }).join("");
  Array.prototype.forEach.call($("runs").querySelectorAll(".run"), function (btn) {
    btn.addEventListener("click", function () {
      var i = Number(btn.getAttribute("data-i"));
      render(runs[i].response, runs[i].state, runs[i].source);
      renderRuns(i);
    });
  });
}

function showError(title, message, detail) {
  showState("stateError");
  $("errTitle").textContent = title;
  $("errText").textContent = message;
  $("errDetail").hidden = !detail;
  if (detail) $("errDetail").textContent = detail;
  $("readoutSub").textContent = "Last run failed";
}

/* ============================================================
   scoring a draft
============================================================ */
function setBusy(on, label) {
  busy = on;
  $("analyzeBtn").disabled = on;
  $("demoBtn").disabled = on;
  $("analyzeText").textContent = on ? (label || "Scoring") : "Score this draft";
  syncAnalyze();
}

function analyze() {
  var st = getState();
  if (!st.title) {
    $("title").setAttribute("aria-invalid", "true");
    $("title").focus();
    toast("bad", "A title is required", "That is the one field the score cannot be built without.");
    return;
  }
  $("title").removeAttribute("aria-invalid");
  if (!key()) {
    openConn(true);
    toast("info", "Add your API key", "Or use Try offline for a rough local estimate.");
    return;
  }
  lastAction = analyze;
  setBusy(true);
  showState("stateLoading");
  $("loadingText").textContent = "Sending the draft to TypeSafe";
  $("readoutSub").textContent = "Scoring";

  api({ state: st, model: "jev-latest", questions: analysisQuestions })
    .then(function (r) {
      setConn("ok", "Connected");
      render(r, st, "api");
      addRun(r, st, "api");
    })
    .catch(function (e) {
      setConn("bad", "Not connected");
      var isKey = e.status === 401 || e.status === 403;
      showError(
        isKey ? "That key was not accepted" : "The request did not go through",
        isKey ? "TypeSafe turned the request down. Check the key, then try again."
              : "Nothing was scored. Your draft is untouched.",
        e.message
      );
    })
    .then(function () { setBusy(false); });
}
$("analyzeBtn").addEventListener("click", analyze);
$("retryBtn").addEventListener("click", function () { if (lastAction) lastAction(); });
$("errKeyBtn").addEventListener("click", function () { openConn(true); });

/* ============================================================
   offline heuristic
============================================================ */
function heuristicAnswers(st) {
  var text = (st.title + " " + (st.body === "not provided" ? "" : st.body)).toLowerCase();
  var asks = /\?|\bwhat\b|\bhow\b|\bwhy\b|feedback|thoughts|advice/.test(text);
  var promoWords = (text.match(/\b(buy|sale|discount|sign up|subscribe|download my|check out my|link in bio)\b/g) || []).length;
  var hype = (text.match(/\b(shocking|insane|game changer|secret|you won't believe|guaranteed|crazy)\b/g) || []).length;
  var bodyLen = st.body === "not provided" ? 0 : st.body.length;

  var title = clamp(0.4 + (st.title.length > 30 ? 0.26 : 0.04) + (hype ? -0.2 : 0.1) + (/\d/.test(st.title) ? 0.05 : 0));
  var discussion = clamp(0.28 + (asks ? 0.4 : 0.06) + (bodyLen > 140 ? 0.16 : 0.03));
  var relevance = st.subreddit_or_audience !== "not provided" ? 0.76 : 0.48;
  var promo = clamp(0.07 + promoWords * 0.2 + (st.post_context === "creator_founder" ? 0.1 : 0));
  var click = clamp(0.04 + hype * 0.24);
  var mod = clamp(0.09 + promo * 0.45 + click * 0.3);

  var scoreAns = function (v) {
    return { type: "score", score: Math.round(v * 3), legend: { "0": "Low", "1": "Fair", "2": "Strong", "3": "Excellent" }, confidence: 0.78 };
  };
  var probs = {
    discussion: asks ? 0.34 : 0.15,
    showcase: /i built|i made|my project|i launched/.test(text) ? 0.36 : 0.15,
    question: asks ? 0.2 : 0.08,
    information: 0.13,
    promotion: promo * 0.24,
    other: 0.06
  };
  var total = 0; Object.keys(probs).forEach(function (k) { total += probs[k]; });
  Object.keys(probs).forEach(function (k) { probs[k] = probs[k] / total; });
  var choice = Object.keys(probs).sort(function (a, b) { return probs[b] - probs[a]; })[0];

  return {
    post_intent: { type: "choice", choice: choice, probabilities: probs, confidence: 0.8 },
    engagement_driver: {
      type: "choice", choice: asks ? "community_relevance" : "utility",
      probabilities: { utility: 0.42, community_relevance: 0.31, curiosity: 0.11, novelty: 0.08, emotion: 0.03, controversy: 0.02, weak_none: 0.03 },
      confidence: 0.7
    },
    title_strength: scoreAns(title),
    discussion_potential: scoreAns(discussion),
    community_relevance: scoreAns(relevance),
    self_promotion: { type: "noul", noul: promo },
    clickbait: { type: "noul", noul: click },
    moderation_risk: { type: "noul", noul: mod }
  };
}
function runDemo() {
  if (!$("title").value.trim()) fillSample();
  var st = getState();
  lastAction = runDemo;
  var r = { model: "offline estimate", answers: heuristicAnswers(st) };
  render(r, st, "demo");
  addRun(r, st, "demo");
  toast("info", "Offline estimate", "No model was called. Add a key for a real reading.");
}
$("demoBtn").addEventListener("click", runDemo);
$("emptyDemo").addEventListener("click", runDemo);

/* ============================================================
   report actions
============================================================ */
$("rawBtn").addEventListener("click", function () {
  var open = $("rawWrap").hidden;
  $("rawWrap").hidden = !open;
  this.setAttribute("aria-expanded", open ? "true" : "false");
  this.textContent = open ? "Hide raw response" : "Show raw response";
});

function copyText(text, okTitle, okText) {
  var done = function () { toast("ok", okTitle, okText); };
  var fail = function () { toast("bad", "Copy blocked", "Your browser refused clipboard access."); };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(done).catch(fail);
  } else {
    try {
      var ta = document.createElement("textarea");
      ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select(); document.execCommand("copy");
      document.body.removeChild(ta); done();
    } catch (e) { fail(); }
  }
}

$("copyReportBtn").addEventListener("click", function () {
  if (!current) return;
  var s = current.scores, v = verdict(s);
  var lines = [
    "ThreadPulse reading",
    "Score: " + pct(s.potential) + "/100 - " + v[0],
    "",
    "Title strength   " + pct(s.title),
    "Reason to reply  " + pct(s.discussion),
    "Fit with the sub " + pct(s.relevance),
    "",
    "Reads as promo   " + pct(s.promo),
    "Overpromises     " + pct(s.click),
    "Mod trouble      " + pct(s.mod),
    "",
    "Subreddit: " + current.state.subreddit_or_audience,
    "Title: " + current.state.title
  ];
  copyText(lines.join("\n"), "Summary copied", "Paste it anywhere you keep notes.");
});

$("downloadBtn").addEventListener("click", function () {
  if (!current) return;
  var blob = new Blob([JSON.stringify({ state: current.state, scores: current.scores, response: current.response }, null, 2)],
    { type: "application/json" });
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a");
  a.href = url;
  a.download = "threadpulse-" + pct(current.scores.potential) + ".json";
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
});

/* ============================================================
   rewrite engine
============================================================ */
function normalizeSpace(s) { return String(s || "").replace(/\s+/g, " ").trim(); }
function cleanTitle(s) {
  return normalizeSpace(s)
    .replace(/[\u{1F300}-\u{1FAFF}\u2600-\u27BF\uFE0F]/gu, "")
    .replace(/!{2,}/g, "!")
    .replace(/\?{2,}/g, "?")
    .replace(/\s+([?!.,])/g, "$1")
    .replace(/^\[(?:update|launch|promo|announcement)\]\s*/i, "")
    .trim();
}
function sentenceSplit(text) {
  return normalizeSpace(text).split(/(?<=[.!?])\s+/).filter(Boolean);
}
function stripPromo(text) {
  return normalizeSpace(text)
    .replace(/\b(check it out|go check it out|please check it out|sign up now|buy now|subscribe now|don't miss out|link in bio)\b[.!]?/gi, "")
    .replace(/\s{2,}/g, " ").trim();
}
function existingQuestion(body) {
  var qs = sentenceSplit(body).filter(function (s) { return s.indexOf("?") > -1; });
  return qs.length ? qs[qs.length - 1] : "";
}
function buildCandidates(st) {
  var title = cleanTitle(st.title);
  var rawBody = st.body === "not provided" ? "" : st.body;
  var cleanBody = stripPromo(rawBody);
  var sentences = sentenceSplit(cleanBody);
  var question = existingQuestion(cleanBody);
  var noQ = title.replace(/[?]+$/, "").trim();
  var lead = sentences[0] || cleanBody;
  var feedbackLine = question || "What would you change first?";
  var valueLead = lead.length > 180 ? lead.slice(0, 177).trim() + "\u2026" : lead;
  var BR = "\n\n";

  var titleDiscussion = title;
  if (title.indexOf("?") === -1) titleDiscussion = (noQ + " \u2014 what would you improve?").slice(0, 300);

  var titleValue = title;
  if (/^i (built|made|created|launched)\b/i.test(title)) {
    titleValue = title.replace(/\s*[\u2014-]\s*what.*$/i, "").trim();
    if (!/[.!?]$/.test(titleValue)) titleValue += " \u2014 looking for feedback";
  } else if (valueLead && valueLead.length < 115) {
    titleValue = (valueLead.replace(/[.!?]+$/, "") + " \u2014 thoughts?").slice(0, 300);
  }

  var conciseBody = sentences.slice(0, Math.min(4, sentences.length)).join(" ");
  if (question && conciseBody.indexOf(question) === -1) conciseBody = (conciseBody + BR + question).trim();
  else if (!question) conciseBody = (conciseBody + BR + feedbackLine).trim();

  var discussionBody = cleanBody;
  if (!question) discussionBody = (discussionBody + BR + feedbackLine).trim();

  var structuredBody = "";
  if (sentences.length) {
    structuredBody = valueLead;
    var middle = sentences.slice(1, -1).join(" ");
    if (middle) structuredBody += BR + middle;
    var ending = question || sentences[sentences.length - 1] || "";
    if (ending && ending !== valueLead && structuredBody.indexOf(ending) === -1) structuredBody += BR + ending;
    if (!question) structuredBody += BR + feedbackLine;
  } else structuredBody = cleanBody;

  var lowPromo = stripPromo(cleanBody)
    .replace(/\b(my app|my product|my startup)\b/gi, function (m) { return m.toLowerCase(); }).trim();
  if (!existingQuestion(lowPromo)) lowPromo = (lowPromo + BR + feedbackLine).trim();

  var out = [
    { id: "focused", label: "Restructured", note: "Same words, clearer shape", title: title, body: structuredBody || cleanBody },
    { id: "discussion", label: "Built for replies", note: "Title asks something", title: titleDiscussion, body: discussionBody || cleanBody },
    { id: "concise", label: "Trimmed", note: "Shorter, faster to the point", title: titleValue, body: conciseBody || cleanBody },
    { id: "low_promo", label: "Toned down", note: "Sales language removed", title: title, body: lowPromo || cleanBody }
  ];
  return out.filter(function (c, i, arr) {
    return arr.findIndex(function (x) { return x.title === c.title && x.body === c.body; }) === i;
  });
}
function improvementQuestions(list) {
  var q = {};
  list.forEach(function (c, i) {
    var p = "candidate_" + i;
    q[p + "_title"] = { type: "score", instructions: "Judge candidates[" + i + "].title as a Reddit title for clarity, specificity, accuracy, and natural interest. Do not reward empty clickbait.", criteria: ["Weak or vague.", "Usable but ordinary.", "Clear, specific, and naturally interesting.", "Exceptionally crisp while accurate."] };
    q[p + "_discussion"] = { type: "score", instructions: "Considering only candidates[" + i + "].title and candidates[" + i + "].body, how much genuine discussion or useful response does this version invite?", criteria: ["Little reason to reply.", "Some reply potential.", "Clear openings for useful replies.", "Strong substantive discussion potential."] };
    q[p + "_relevance"] = { type: "score", instructions: "How well does candidates[" + i + "] appear targeted to subreddit_or_audience? If audience is not provided, judge whether it has a clear audience.", criteria: ["Poorly targeted.", "Somewhat relevant.", "Clearly relevant.", "Highly specific and naturally suited."] };
    q[p + "_promo"] = { type: "noul", instructions: "Does candidates[" + i + "] primarily read as self-promotion, solicitation, advertising, or traffic acquisition rather than contribution?" };
    q[p + "_click"] = { type: "noul", instructions: "Is candidates[" + i + "].title meaningfully clickbait, misleading, manipulative, or disproportionately hyped?" };
    q[p + "_mod"] = { type: "noul", instructions: "Based only on candidates[" + i + "], is there a clear common subreddit moderation risk such as spam, solicitation, low effort, unclear relevance, misleading framing, or excessive self-promotion?" };
  });
  return q;
}
function candidateScore(a, i) {
  var p = "candidate_" + i;
  var s = {
    title: scorePct(a[p + "_title"]),
    discussion: scorePct(a[p + "_discussion"]),
    relevance: scorePct(a[p + "_relevance"]),
    promo: clamp(a[p + "_promo"] && a[p + "_promo"].noul),
    click: clamp(a[p + "_click"] && a[p + "_click"].noul),
    mod: clamp(a[p + "_mod"] && a[p + "_mod"].noul)
  };
  var quality = 0.34 * s.title + 0.34 * s.discussion + 0.32 * s.relevance;
  var risk = 0.42 * s.promo + 0.25 * s.click + 0.33 * s.mod;
  s.potential = clamp(quality * 0.82 + (1 - risk) * 0.18);
  return s;
}
function gainChips(before, after) {
  var out = [];
  var labels = { title: "Title strength", discussion: "Reason to reply", relevance: "Fit with the sub" };
  ["title", "discussion", "relevance"].forEach(function (k) {
    var d = Math.round((after[k] - before[k]) * 100);
    if (d > 4) out.push(labels[k] + " up " + d);
  });
  [["promo", "Promo tone"], ["click", "Overpromising"], ["mod", "Mod risk"]].forEach(function (pair) {
    var d = Math.round((before[pair[0]] - after[pair[0]]) * 100);
    if (d > 4) out.push(pair[1] + " down " + d);
  });
  if (!out.length) out.push("Best balance of the four");
  return out.slice(0, 4);
}

/* drawer plumbing */
var lastFocused = null;
function openDrawer() {
  lastFocused = document.activeElement;
  $("drawer").hidden = false;
  requestAnimationFrame(function () {
    $("scrim").classList.add("on");
    $("drawer").classList.add("on");
    $("closeDrawer").focus();
  });
  document.body.style.overflow = "hidden";
}
function closeDrawer() {
  $("scrim").classList.remove("on");
  $("drawer").classList.remove("on");
  document.body.style.overflow = "";
  setTimeout(function () { $("drawer").hidden = true; }, 300);
  if (lastFocused && lastFocused.focus) lastFocused.focus();
}
$("scrim").addEventListener("click", closeDrawer);
$("closeDrawer").addEventListener("click", closeDrawer);

function trapFocus(container, e) {
  if (e.key !== "Tab") return;
  var nodes = container.querySelectorAll('a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])');
  var list = Array.prototype.filter.call(nodes, function (n) { return n.offsetParent !== null; });
  if (!list.length) return;
  var first = list[0], last = list[list.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}
$("drawer").addEventListener("keydown", function (e) { trapFocus($("drawer"), e); });

function paintCandidate(index) {
  selectedCand = candidates[index];
  var best = candidates[0];
  Array.prototype.forEach.call($("cands").querySelectorAll(".cand"), function (b, i) {
    b.setAttribute("aria-pressed", i === index ? "true" : "false");
  });
  var before = current.scores.potential;
  var after = selectedCand.scores.potential;
  var d = pct(after) - pct(before);
  $("afterLabel").textContent = selectedCand === best ? "Best rewrite" : selectedCand.label;
  $("afterScore").textContent = pct(after);
  var gainEl = $("gain");
  gainEl.textContent = d === 0 ? "even" : (d > 0 ? "+" + d : String(d));
  gainEl.className = d > 0 ? "up" : d < 0 ? "down" : "flat";
  $("candLabel").textContent = selectedCand.note;
  $("improvedTitle").textContent = selectedCand.title;
  $("improvedBody").textContent = selectedCand.body;
  $("originalPreview").textContent = current.state.title + "\n\n" +
    (current.state.body === "not provided" ? "(no body)" : current.state.body);
  $("improvedPreview").textContent = selectedCand.title + "\n\n" + selectedCand.body;
  $("gainChips").innerHTML = gainChips(current.scores, selectedCand.scores).map(function (t) {
    return '<span class="chip gain">' + esc(t) + "</span>";
  }).join("");
}

function showCandidates(list) {
  candidates = list;
  $("cands").innerHTML = list.map(function (c, i) {
    return '<button class="cand" type="button" data-i="' + i + '" aria-pressed="' + (i === 0) + '">' +
      '<span><b>' + esc(c.label) + (i === 0 ? '<span class="cand-badge">best</span>' : "") + "</b>" +
      '<span>' + esc(c.title) + "</span></span>" +
      '<span class="cand-score">' + pct(c.scores.potential) + "</span></button>";
  }).join("");
  Array.prototype.forEach.call($("cands").querySelectorAll(".cand"), function (b) {
    b.addEventListener("click", function () { paintCandidate(Number(b.getAttribute("data-i"))); });
  });
  $("drawerLoading").hidden = true;
  $("drawerResult").hidden = false;
  $("drawerFoot").hidden = false;
  paintCandidate(0);
}

$("improveBtn").addEventListener("click", function () {
  if (!current) { toast("bad", "Score it first", "The rewrites are ranked against your current reading."); return; }
  var list = buildCandidates(current.state);
  if (!list.length) { toast("bad", "Nothing to rewrite", "Add a body to your draft first."); return; }

  $("drawerLoading").hidden = false;
  $("drawerResult").hidden = true;
  $("drawerFoot").hidden = true;
  openDrawer();

  if (current.source === "demo" || !key()) {
    $("drawerSub").textContent = "Offline estimate";
    setTimeout(function () {
      var scored = list.map(function (c) {
        return Object.assign({}, c, { scores: compose(heuristicAnswers({
          title: c.title, body: c.body || "not provided",
          subreddit_or_audience: current.state.subreddit_or_audience,
          post_context: current.state.post_context
        })) });
      }).sort(function (a, b) { return b.scores.potential - a.scores.potential; });
      showCandidates(scored);
    }, 420);
    return;
  }

  $("drawerSub").textContent = "Scored against your original";
  api({
    state: {
      subreddit_or_audience: current.state.subreddit_or_audience,
      original: { title: current.state.title, body: current.state.body },
      candidates: list
    },
    model: "jev-latest",
    questions: improvementQuestions(list)
  }).then(function (r) {
    var scored = list.map(function (c, i) {
      return Object.assign({}, c, { scores: candidateScore(r.answers || {}, i) });
    }).sort(function (a, b) { return b.scores.potential - a.scores.potential; });
    showCandidates(scored);
  }).catch(function (e) {
    closeDrawer();
    toast("bad", "Rewrites could not be scored", e.message);
  });
});

$("applyBtn").addEventListener("click", function () {
  if (!selectedCand) return;
  $("title").value = selectedCand.title;
  $("body").value = selectedCand.body;
  updateCounters(); syncAnalyze(); saveDraft();
  closeDrawer();
  toast("ok", "Rewrite is in the editor", "Score it again to confirm the gain.", {
    label: "Score it", run: function () { current && current.source === "demo" ? runDemo() : analyze(); }
  });
});
$("copyImprovedBtn").addEventListener("click", function () {
  if (!selectedCand) return;
  copyText(selectedCand.title + "\n\n" + selectedCand.body, "Rewrite copied", "Title and body are on your clipboard.");
});

/* ============================================================
   help modal
============================================================ */
function openHelp() {
  $("helpModal").hidden = false;
  requestAnimationFrame(function () { $("helpModal").classList.add("on"); $("closeHelp").focus(); });
}
function closeHelp() {
  $("helpModal").classList.remove("on");
  setTimeout(function () { $("helpModal").hidden = true; }, 220);
}
$("helpBtn").addEventListener("click", openHelp);
$("closeHelp").addEventListener("click", closeHelp);
$("helpModal").addEventListener("click", function (e) { if (e.target === $("helpModal")) closeHelp(); });
$("helpModal").addEventListener("keydown", function (e) { trapFocus($("helpModal").querySelector(".modal-card"), e); });

/* ============================================================
   keyboard
============================================================ */
document.addEventListener("keydown", function (e) {
  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
    e.preventDefault();
    if (!busy && $("title").value.trim()) analyze();
    return;
  }
  if (e.key === "Escape") {
    if (!$("helpModal").hidden) { closeHelp(); return; }
    if (!$("drawer").hidden) { closeDrawer(); return; }
    if (!$("connPanel").hidden) { openConn(false); $("connBtn").focus(); }
  }
});

/* ============================================================
   boot
============================================================ */
$("kbdHint").textContent = MOD + (isMac ? "\u21a9" : "+Enter");
$("scKey").textContent = MOD;
loadDraft();
updateCounters();
syncAnalyze();
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
    return send(res, 200, JSON.stringify({ ok: true, service: "threadpulse", version: "4.0.0" }));
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
    console.error(`  Start it somewhere else:  node threadpulse_v4.mjs --port 9100\n`);
    process.exit(1);
  }
  console.error(`\n  Server error: ${err.message}\n`);
  process.exit(1);
});

server.listen(PORT, HOST, () => {
  const addr = server.address();
  const line = `http://localhost:${addr.port}`;
  console.log("");
  console.log("  \x1b[1mThreadPulse\x1b[0m \x1b[2mv4\x1b[0m");
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
