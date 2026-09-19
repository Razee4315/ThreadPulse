// ThreadPulse v3 — single-file local TypeSafe app
// Requires Node.js 18+
// Run: node threadpulse.mjs
// Open: http://localhost:8787

import http from "node:http";

const PORT = Number(process.env.PORT || 8787);

const html = String.raw`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>ThreadPulse</title>
<style>
:root{
  --paper:#f4f5ef;
  --paper-2:#eaede3;
  --card:#fbfcf8;
  --ink:#12150f;
  --ink-2:#1d2119;
  --muted:#72796b;
  --soft:#969d90;
  --line:#daddd3;
  --lime:#d9ff72;
  --lime-2:#b9e952;
  --green:#59802f;
  --amber:#bd8124;
  --red:#c85548;
  --blue:#5b8297;
  --shadow:0 22px 70px rgba(24,29,19,.08);
}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{
  margin:0;
  min-height:100vh;
  color:var(--ink);
  background:
    radial-gradient(900px 520px at 90% -12%,rgba(217,255,114,.24),transparent 66%),
    radial-gradient(650px 520px at -10% 45%,rgba(91,130,151,.07),transparent 66%),
    var(--paper);
  font-family:Inter,ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
  letter-spacing:-.018em;
}
button,input,textarea,select{font:inherit}
button{cursor:pointer}
button:disabled{cursor:not-allowed;opacity:.6}
svg{display:block}
.app{width:min(1280px,calc(100% - 28px));margin:0 auto;padding:16px 0 50px}

/* top */
.top{
  height:58px;display:flex;align-items:center;justify-content:space-between;
  border-bottom:1px solid rgba(18,21,15,.08)
}
.brand{display:flex;align-items:center;gap:10px;font-weight:780;font-size:14px}
.logo{
  width:34px;height:34px;border-radius:11px;background:var(--ink);display:grid;place-items:center;
  box-shadow:0 7px 18px rgba(18,21,15,.14)
}
.logo svg{width:21px;height:21px;color:var(--lime)}
.top-right{display:flex;align-items:center;gap:8px}
.key{
  width:280px;height:38px;border:1px solid var(--line);background:rgba(251,252,248,.82);
  border-radius:11px;display:flex;align-items:center;padding:0 10px;gap:8px
}
.key svg{width:14px;color:var(--muted)}
.key input{width:100%;border:0;outline:0;background:transparent;color:var(--ink);font-size:11px}
.status{height:38px;display:flex;align-items:center;gap:6px;padding:0 3px;font-size:9px;color:var(--muted)}
.dot{width:7px;height:7px;border-radius:50%;background:#a9afa3}
.dot.ok{background:var(--green)}.dot.bad{background:var(--red)}.dot.busy{background:var(--amber);animation:pulse .9s infinite}
@keyframes pulse{50%{opacity:.3}}
.btn{
  height:38px;border:1px solid var(--line);background:var(--card);color:var(--ink);
  border-radius:11px;padding:0 13px;display:inline-flex;align-items:center;justify-content:center;gap:7px;
  font-size:10px;font-weight:740;transition:.18s ease;white-space:nowrap
}
.btn:hover:not(:disabled){transform:translateY(-1px);border-color:#c2c7bb}
.btn.dark{background:var(--ink);color:#fff;border-color:var(--ink)}
.btn.dark:hover:not(:disabled){background:#22271d}
.btn.lime{background:var(--lime);border-color:var(--lime);color:var(--ink)}
.btn.icon{width:38px;padding:0}
.btn.sm{height:31px;padding:0 10px;border-radius:9px;font-size:9px}
.btn svg{width:14px;height:14px}

/* hero */
.hero{padding:46px 0 22px;display:flex;align-items:flex-end;justify-content:space-between;gap:26px}
.hero h1{font-size:clamp(40px,5vw,66px);line-height:.95;letter-spacing:-.065em;margin:0;font-weight:730}
.hero-side{display:flex;align-items:center;gap:10px;padding-bottom:3px}
.hero-side .mini{font-size:10px;color:var(--muted);line-height:1.5;text-align:right}

/* layout */
.layout{display:grid;grid-template-columns:minmax(0,1.02fr) minmax(420px,.98fr);gap:14px}
.card{background:rgba(251,252,248,.88);border:1px solid var(--line);border-radius:19px;box-shadow:var(--shadow);overflow:hidden}
.card.dark-card{background:var(--ink);border-color:var(--ink);color:white}
.card-head{height:52px;padding:0 16px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--line)}
.dark-card .card-head{border-bottom-color:#2b3027}
.card-head strong{font-size:11px}.card-head span{font-size:9px;color:var(--muted)}
.card-body{padding:16px}
.field{margin-bottom:13px}.field:last-child{margin-bottom:0}
.label{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px}
.label label{font-size:9px;font-weight:760}.count{font-size:8px;color:var(--muted)}
.input{
  width:100%;border:1px solid var(--line);background:#fff;color:var(--ink);outline:0;
  border-radius:12px;padding:11px 12px;font-size:11px;transition:.17s ease
}
.input:focus{border-color:#b5c695;box-shadow:0 0 0 4px rgba(217,255,114,.17)}
textarea.input{min-height:188px;resize:vertical;line-height:1.55}
.two{display:grid;grid-template-columns:1fr 1fr;gap:9px}
.toggle{
  height:48px;border:1px solid var(--line);background:white;border-radius:12px;padding:0 12px;
  display:flex;align-items:center;justify-content:space-between
}
.toggle-info{display:flex;align-items:center;gap:8px}
.toggle-icon{width:27px;height:27px;border-radius:8px;background:var(--paper-2);display:grid;place-items:center}
.toggle-icon svg{width:13px;color:var(--muted)}
.toggle b{font-size:9px;display:block}.toggle small{font-size:8px;color:var(--muted);display:block;margin-top:1px}
.switch{position:relative;width:36px;height:21px}.switch input{display:none}
.slider{position:absolute;inset:0;background:#d9ddd3;border-radius:99px;transition:.2s}
.slider:after{content:"";position:absolute;left:3px;top:3px;width:15px;height:15px;background:white;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,.18);transition:.2s}
.switch input:checked+.slider{background:var(--ink)}.switch input:checked+.slider:after{transform:translateX(15px);background:var(--lime)}
.image-area{display:none;margin-top:9px}.image-area.show{display:block}
.upload{
  height:104px;border:1px dashed #c9cdc3;background:white;border-radius:12px;display:grid;place-items:center;text-align:center;position:relative;overflow:hidden
}
.upload input{position:absolute;inset:0;opacity:0;cursor:pointer}.upload svg{width:18px;color:var(--muted);margin:0 auto 5px}
.upload b{font-size:9px;display:block}.upload span{font-size:8px;color:var(--muted);display:block;margin-top:2px}
.preview{display:none;position:relative;border-radius:12px;overflow:hidden;border:1px solid var(--line)}
.preview.show{display:block}.preview img{display:block;width:100%;height:190px;object-fit:cover}.preview .btn{position:absolute;right:8px;top:8px}
.image-note{margin-top:8px}
.actions{display:flex;gap:8px;margin-top:15px}.actions .main{flex:1}

/* empty */
.empty{min-height:600px;display:grid;place-items:center;text-align:center;padding:30px;color:white}
.empty-icon{
  width:68px;height:68px;border:1px solid #32382d;border-radius:21px;background:#191d16;
  display:grid;place-items:center;margin:0 auto 13px
}
.empty-icon svg{width:28px;color:var(--lime)}
.empty h3{font-size:14px;margin:0 0 5px}.empty p{font-size:9px;color:#8f9889;margin:0}

/* result */
.results{display:none}.results.show{display:block}
.result-top{padding:17px;border-bottom:1px solid #2b3027}
.result-row{display:grid;grid-template-columns:105px 1fr;gap:16px;align-items:center}
.gauge{
  --p:0;width:98px;height:98px;border-radius:50%;display:grid;place-items:center;position:relative;
  background:conic-gradient(var(--lime) calc(var(--p)*1%),#2c3128 0)
}
.gauge:before{content:"";position:absolute;inset:7px;background:var(--ink);border-radius:50%}
.gauge-inner{position:relative;z-index:1;text-align:center}.gauge-inner strong{font-size:29px;letter-spacing:-.06em;line-height:1}
.gauge-inner span{display:block;color:#8f9889;font-size:7px;text-transform:uppercase;letter-spacing:.12em;margin-top:3px}
.verdict h2{font-size:18px;margin:0 0 4px;letter-spacing:-.035em}.verdict p{font-size:9px;color:#9ba394;line-height:1.5;margin:0}
.chips{display:flex;flex-wrap:wrap;gap:5px;margin-top:9px}
.chip{font-size:8px;color:#cbd1c4;background:#20251c;border:1px solid #31372d;border-radius:7px;padding:5px 7px}
.result-section{padding:14px 17px;border-bottom:1px solid #2b3027}.result-section:last-child{border-bottom:0}
.section-title{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}
.section-title b{font-size:9px}.section-title span{font-size:8px;color:#7d8677}
.metric{display:grid;grid-template-columns:106px 1fr 32px;gap:7px;align-items:center;margin-bottom:8px}
.metric:last-child{margin-bottom:0}.metric span{font-size:8px;color:#b7beb0}.metric b{font:650 8px ui-monospace,SFMono-Regular,Menlo,monospace;text-align:right;color:#dce2d6}
.track{height:5px;border-radius:99px;background:#2b3027;overflow:hidden}.fill{height:100%;background:var(--lime);border-radius:99px;width:0;transition:width .45s ease}
.risks{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}
.risk{border:1px solid #30362b;background:#1a1f17;border-radius:11px;padding:9px}.risk span{font-size:7px;color:#818a7b;display:block}.risk b{font-size:14px;display:block;margin-top:3px}
.good{color:#bfe97b}.warn{color:#e0ad5c}.danger{color:#e67a6f}
.probs{display:grid;gap:7px}.prob{display:grid;grid-template-columns:94px 1fr 30px;gap:7px;align-items:center}.prob span{font-size:8px;color:#b7beb0}.prob b{font:650 8px ui-monospace,SFMono-Regular,Menlo,monospace;text-align:right;color:#dce2d6}
.improve-box{
  margin:0 17px 17px;border:1px solid #343a2e;background:#1a1f17;border-radius:14px;padding:12px;
  display:flex;align-items:center;justify-content:space-between;gap:12px
}
.improve-box .copy{display:flex;align-items:center;gap:9px}.improve-icon{width:32px;height:32px;border-radius:10px;background:var(--lime);color:var(--ink);display:grid;place-items:center}
.improve-icon svg{width:16px}.improve-box b{font-size:9px;display:block}.improve-box span{font-size:8px;color:#8f9889;display:block;margin-top:2px}
.raw{display:none}.raw.show{display:block}
pre{margin:0;max-height:240px;overflow:auto;background:#0d0f0b;border:1px solid #2b3027;border-radius:10px;padding:10px;font:8px/1.55 ui-monospace,SFMono-Regular,Menlo,monospace;color:#cbd2c4;white-space:pre-wrap;word-break:break-word}

/* improvement drawer */
.overlay{position:fixed;inset:0;background:rgba(10,12,9,.36);backdrop-filter:blur(4px);z-index:50;opacity:0;pointer-events:none;transition:.2s}
.overlay.show{opacity:1;pointer-events:auto}
.drawer{
  position:fixed;right:0;top:0;bottom:0;width:min(680px,100%);background:var(--paper);z-index:60;
  box-shadow:-24px 0 80px rgba(0,0,0,.18);transform:translateX(102%);transition:.28s cubic-bezier(.2,.8,.2,1);
  display:flex;flex-direction:column
}
.drawer.show{transform:translateX(0)}
.drawer-top{height:67px;padding:0 18px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--line);flex:0 0 auto}
.drawer-title{display:flex;align-items:center;gap:10px}.drawer-title .improve-icon{width:34px;height:34px}.drawer-title b{font-size:12px;display:block}.drawer-title span{font-size:8px;color:var(--muted);display:block;margin-top:2px}
.drawer-body{padding:16px 18px 26px;overflow:auto}
.delta{
  display:grid;grid-template-columns:1fr auto 1fr;gap:10px;align-items:center;margin-bottom:13px
}
.delta-box{border:1px solid var(--line);background:var(--card);border-radius:13px;padding:11px}.delta-box span{font-size:8px;color:var(--muted);display:block}.delta-box strong{font-size:23px;letter-spacing:-.05em;display:block;margin-top:2px}.delta-arrow{color:var(--muted)}
.delta-arrow svg{width:17px}
.delta-gain{color:var(--green);font-size:9px;font-weight:760;margin-left:5px}
.why{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:13px}
.why-chip{padding:6px 8px;border:1px solid var(--line);background:var(--card);border-radius:8px;font-size:8px;color:#565d51}
.rewrite-card{border:1px solid var(--line);background:var(--card);border-radius:15px;overflow:hidden;margin-bottom:10px}
.rewrite-head{height:40px;padding:0 12px;border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:space-between}
.rewrite-head b{font-size:9px}.rewrite-head span{font-size:8px;color:var(--muted)}
.rewrite-content{padding:12px}.rewrite-title{font-size:14px;font-weight:720;line-height:1.35;margin-bottom:10px}.rewrite-body{font-size:10px;line-height:1.62;color:#555c50;white-space:pre-wrap}
.drawer-actions{display:flex;gap:8px;margin-top:12px}.drawer-actions .main{flex:1}
.compare{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:10px}
.compare-card{border:1px solid var(--line);background:var(--card);border-radius:13px;padding:11px}
.compare-card b{font-size:8px;display:block;margin-bottom:7px}.compare-card p{font-size:8px;line-height:1.5;color:var(--muted);margin:0;display:-webkit-box;-webkit-line-clamp:5;-webkit-box-orient:vertical;overflow:hidden}
.loader{display:none;padding:60px 20px;text-align:center}.loader.show{display:block}
.loader-ring{width:45px;height:45px;border:3px solid #dce0d5;border-top-color:var(--ink);border-radius:50%;animation:spin .8s linear infinite;margin:0 auto 12px}
@keyframes spin{to{transform:rotate(360deg)}}.loader b{font-size:11px;display:block}.loader span{font-size:8px;color:var(--muted);display:block;margin-top:4px}
.improved{display:none}.improved.show{display:block}

/* toast */
.toast{
  position:fixed;right:20px;bottom:20px;z-index:100;background:var(--ink);color:#fff;border-radius:12px;
  padding:11px 13px;box-shadow:0 18px 55px rgba(0,0,0,.22);transform:translateY(16px);opacity:0;pointer-events:none;transition:.2s;max-width:340px
}
.toast.show{transform:translateY(0);opacity:1}.toast b{font-size:9px;display:block}.toast span{font-size:8px;color:#aeb5a8;display:block;margin-top:2px}

/* mobile */
@media(max-width:950px){
  .layout{grid-template-columns:1fr}.empty{min-height:330px}.hero{align-items:flex-start;flex-direction:column}
  .hero-side .mini{text-align:left}
}
@media(max-width:650px){
  .app{width:min(100% - 18px,1280px)}
  .top{height:auto;padding:10px 0;align-items:flex-start}.top-right{flex-wrap:wrap;justify-content:flex-end}.key{width:100%;order:4}.status{display:none}
  .hero{padding:30px 0 18px}.hero h1{font-size:43px}.hero-side{display:none}.two{grid-template-columns:1fr}
  .result-row{grid-template-columns:1fr;text-align:center}.gauge{margin:0 auto}.chips{justify-content:center}
  .risks{grid-template-columns:1fr}.compare{grid-template-columns:1fr}.drawer{width:100%}
}
</style>
</head>
<body>
<div class="app">
  <header class="top">
    <div class="brand">
      <div class="logo" aria-label="ThreadPulse">
        <!-- custom signal mark: source dot + expanding signal + pulse -->
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="6" cy="12" r="1.7" fill="currentColor" stroke="none"/>
          <path d="M9.3 8.7a4.7 4.7 0 0 1 0 6.6"/>
          <path d="M12.2 5.8a8.8 8.8 0 0 1 0 12.4"/>
          <path d="M15 12h2l1.4-3 1.5 6 1.1-3H23"/>
        </svg>
      </div>
      ThreadPulse
    </div>
    <div class="top-right">
      <div class="key">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
          <circle cx="8" cy="12" r="3.5"/><path d="M11.5 12H21m-3 0v3m-3-3v2"/>
        </svg>
        <input id="apiKey" type="password" autocomplete="off" placeholder="TypeSafe API key">
      </div>
      <button class="btn" id="testBtn">Test</button>
      <div class="status"><span class="dot" id="apiDot"></span><span id="apiText">Not tested</span></div>
    </div>
  </header>

  <section class="hero">
    <h1>Predict.<br>Improve. Re-score.</h1>
    <div class="hero-side">
      <div class="mini">Reddit post intelligence<br>powered by TypeSafe judgments.</div>
    </div>
  </section>

  <main class="layout">
    <section class="card">
      <div class="card-head">
        <strong>Post</strong>
        <button class="btn sm" id="sampleBtn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 4h14v16H5z"/><path d="M8 8h8M8 12h6"/></svg>
          Sample
        </button>
      </div>
      <div class="card-body">
        <div class="two">
          <div class="field">
            <div class="label"><label>Subreddit</label></div>
            <input class="input" id="subreddit" placeholder="r/SideProject">
          </div>
          <div class="field">
            <div class="label"><label>Context</label></div>
            <select class="input" id="authorContext">
              <option value="not_provided">Not specified</option>
              <option value="creator_founder">My own project</option>
              <option value="regular_member">Community post</option>
              <option value="question">Question</option>
              <option value="news">News / information</option>
            </select>
          </div>
        </div>

        <div class="field">
          <div class="label"><label>Title</label><span class="count" id="titleCount">0 / 300</span></div>
          <input class="input" id="title" maxlength="300" placeholder="Paste Reddit title">
        </div>

        <div class="field">
          <div class="label"><label>Description</label><span class="count" id="bodyCount">0</span></div>
          <textarea class="input" id="body" placeholder="Paste post description"></textarea>
        </div>

        <div class="field">
          <div class="toggle">
            <div class="toggle-info">
              <div class="toggle-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="10" r="1.5"/><path d="m5 17 4.5-4 3 2.5 2.5-2 4 3.5"/></svg>
              </div>
              <div><b>Image context</b><small>Optional</small></div>
            </div>
            <label class="switch"><input id="imageToggle" type="checkbox"><span class="slider"></span></label>
          </div>
          <div class="image-area" id="imageArea">
            <div class="upload" id="upload">
              <input id="imageInput" type="file" accept="image/*">
              <div>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 16V5m0 0-4 4m4-4 4 4"/><path d="M5 15v4h14v-4"/></svg>
                <b>Upload image</b>
                <span>Preview stays local</span>
              </div>
            </div>
            <div class="preview" id="preview">
              <img id="previewImg" alt="">
              <button class="btn sm" id="removeImg" type="button">Remove</button>
            </div>
            <input class="input image-note" id="imageNotes" placeholder="Describe anything important in the image">
          </div>
        </div>

        <div class="actions">
          <button class="btn dark main" id="analyzeBtn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M5 19V9m5 10V5m5 14v-7m4 7V8"/></svg>
            <span id="analyzeText">Analyze</span>
          </button>
          <button class="btn" id="demoBtn">Demo</button>
          <button class="btn icon" id="clearBtn" title="Clear">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 7h16M9 7V4h6v3M8 10v8m4-8v8m4-8v8M6 7l1 14h10l1-14"/></svg>
          </button>
        </div>
      </div>
    </section>

    <section class="card dark-card">
      <div class="empty" id="empty">
        <div>
          <div class="empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 16V9m4 7V5m4 11v-4m4 4V7m4 9v-6"/>
              <path d="M3 19h18"/>
            </svg>
          </div>
          <h3>Ready</h3>
          <p>Analyze a post to see its signals.</p>
        </div>
      </div>

      <div class="results" id="results">
        <div class="result-top">
          <div class="result-row">
            <div class="gauge" id="gauge" style="--p:0">
              <div class="gauge-inner"><strong id="scoreNum">0</strong><span>potential</span></div>
            </div>
            <div class="verdict">
              <h2 id="verdict">—</h2>
              <p id="verdictText">—</p>
              <div class="chips">
                <span class="chip" id="intentChip">Intent · —</span>
                <span class="chip" id="driverChip">Driver · —</span>
                <span class="chip" id="confidenceChip">Confidence · —</span>
              </div>
            </div>
          </div>
        </div>

        <div class="result-section">
          <div class="section-title"><b>Signals</b></div>
          <div class="metric"><span>Title</span><div class="track"><div class="fill" id="titleBar"></div></div><b id="titleVal">0%</b></div>
          <div class="metric"><span>Discussion</span><div class="track"><div class="fill" id="discussionBar"></div></div><b id="discussionVal">0%</b></div>
          <div class="metric"><span>Audience fit</span><div class="track"><div class="fill" id="relevanceBar"></div></div><b id="relevanceVal">0%</b></div>
        </div>

        <div class="result-section">
          <div class="section-title"><b>Intent</b></div>
          <div class="probs" id="intentProbs"></div>
        </div>

        <div class="result-section">
          <div class="section-title"><b>Risk</b></div>
          <div class="risks">
            <div class="risk"><span>Promotion</span><b id="promoVal">0%</b></div>
            <div class="risk"><span>Clickbait</span><b id="clickVal">0%</b></div>
            <div class="risk"><span>Moderation</span><b id="modVal">0%</b></div>
          </div>
        </div>

        <div class="improve-box">
          <div class="copy">
            <div class="improve-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="m12 3 1.2 4.2L17 9l-3.8 1.8L12 15l-1.2-4.2L7 9l3.8-1.8L12 3Z"/><path d="m18.5 14 .7 2.3 2.3.7-2.3.7-.7 2.3-.7-2.3-2.3-.7 2.3-.7.7-2.3Z"/></svg>
            </div>
            <div><b>Improve this post</b><span>Generate candidates, let TypeSafe rank them.</span></div>
          </div>
          <button class="btn lime sm" id="improveBtn">Improve</button>
        </div>

        <div class="result-section">
          <button class="btn sm" style="background:#1a1f17;border-color:#30362b;color:#cdd4c6" id="rawBtn">Raw JSON</button>
          <div class="raw" id="raw"><div style="height:8px"></div><pre id="rawJson"></pre></div>
        </div>
      </div>
    </section>
  </main>
</div>

<div class="overlay" id="overlay"></div>
<aside class="drawer" id="drawer">
  <div class="drawer-top">
    <div class="drawer-title">
      <div class="improve-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="m12 3 1.2 4.2L17 9l-3.8 1.8L12 15l-1.2-4.2L7 9l3.8-1.8L12 3Z"/><path d="m18.5 14 .7 2.3 2.3.7-2.3.7-.7 2.3-.7-2.3-2.3-.7 2.3-.7.7-2.3Z"/></svg>
      </div>
      <div><b>Improved version</b><span>Signal-guided + TypeSafe re-ranked</span></div>
    </div>
    <button class="btn icon" id="closeDrawer">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="m6 6 12 12M18 6 6 18"/></svg>
    </button>
  </div>
  <div class="drawer-body">
    <div class="loader" id="loader">
      <div class="loader-ring"></div>
      <b>Testing rewrite candidates</b>
      <span>TypeSafe is scoring each version.</span>
    </div>

    <div class="improved" id="improved">
      <div class="delta">
        <div class="delta-box"><span>Before</span><strong id="beforeScore">—</strong></div>
        <div class="delta-arrow">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 12h14m-5-5 5 5-5 5"/></svg>
        </div>
        <div class="delta-box"><span>After</span><strong><span id="afterScore">—</span><span class="delta-gain" id="gain">—</span></strong></div>
      </div>

      <div class="why" id="why"></div>

      <div class="rewrite-card">
        <div class="rewrite-head"><b>Title</b><span id="winnerLabel">Best candidate</span></div>
        <div class="rewrite-content"><div class="rewrite-title" id="improvedTitle"></div></div>
      </div>

      <div class="rewrite-card">
        <div class="rewrite-head"><b>Description</b><span>Preserves supplied facts</span></div>
        <div class="rewrite-content"><div class="rewrite-body" id="improvedBody"></div></div>
      </div>

      <div class="compare">
        <div class="compare-card"><b>Original</b><p id="originalPreview"></p></div>
        <div class="compare-card"><b>Improved</b><p id="improvedPreview"></p></div>
      </div>

      <div class="drawer-actions">
        <button class="btn dark main" id="applyBtn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m5 12 4 4L19 6"/></svg>
          Apply to editor
        </button>
        <button class="btn" id="copyImprovedBtn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="8" y="8" width="11" height="11" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></svg>
          Copy
        </button>
      </div>
    </div>
  </div>
</aside>

<div class="toast" id="toast"><b id="toastTitle"></b><span id="toastText"></span></div>

<script>
const $=id=>document.getElementById(id);
let lastResponse=null,lastState=null,lastScores=null,lastImproved=null;

const analysisQuestions={
  post_intent:{
    type:"choice",
    instructions:"What is the primary intent of this Reddit post?",
    criteria:{
      question:"Primarily asks a factual or open question.",
      discussion:"Primarily invites opinions, experiences, debate, or conversation.",
      showcase:"Primarily shares something the author made, achieved, found, or experienced.",
      help_advice:"Primarily asks for practical help, troubleshooting, or advice.",
      information:"Primarily shares useful information, news, a guide, or explanation.",
      promotion:"Primarily promotes, sells, recruits, solicits, or drives traffic.",
      other:"None of the other categories fit well."
    }
  },
  engagement_driver:{
    type:"choice",
    instructions:"Which single factor most naturally gives readers a reason to engage with this Reddit post?",
    criteria:{
      utility:"Practical usefulness or learning value.",
      curiosity:"A genuine information gap.",
      community_relevance:"Strong relevance to the stated subreddit or audience.",
      novelty:"Something notably new, unusual, or original.",
      emotion:"A relatable emotional experience.",
      controversy:"Likely disagreement or debate.",
      weak_none:"No clear engagement driver."
    }
  },
  title_strength:{
    type:"score",
    instructions:"Judge the Reddit title for clarity, specificity, accuracy, and natural reader interest. Do not reward empty clickbait.",
    criteria:[
      "Weak, vague, confusing, generic, or misleading.",
      "Understandable but ordinary or missing useful specificity.",
      "Clear, specific, accurate, and naturally interesting.",
      "Exceptionally crisp and compelling while accurately setting expectations."
    ]
  },
  discussion_potential:{
    type:"score",
    instructions:"How much genuine discussion or useful response does this post naturally invite?",
    criteria:[
      "Little reason for readers to reply.",
      "Some readers may have something useful to add.",
      "Clear openings for useful replies or conversation.",
      "Many relevant readers are likely to have substantive experiences, opinions, or follow-up questions."
    ]
  },
  community_relevance:{
    type:"score",
    instructions:"How well is this post targeted to the stated subreddit or audience? If none is provided, judge whether it still has a clear audience.",
    criteria:[
      "Poorly targeted or audience unclear.",
      "Somewhat relevant but broad.",
      "Clearly relevant to a recognizable audience.",
      "Highly specific and naturally suited to the stated community."
    ]
  },
  self_promotion:{type:"noul",instructions:"Does this post primarily read as self-promotion, solicitation, advertising, or traffic acquisition rather than contribution?"},
  clickbait:{type:"noul",instructions:"Is the title meaningfully clickbait, misleading, manipulative, or disproportionately hyped compared with the content?"},
  moderation_risk:{type:"noul",instructions:"Based only on the supplied content, is there a clear common subreddit moderation risk such as spam, solicitation, low effort, unclear relevance, misleading framing, or excessive self-promotion?"}
};

function getState(){
  return{
    subreddit_or_audience:$("subreddit").value.trim()||"not provided",
    post_context:$("authorContext").value,
    title:$("title").value.trim(),
    body:$("body").value.trim()||"not provided",
    image_context:$("imageToggle").checked?($("imageNotes").value.trim()||"image enabled but no written description provided"):"not used"
  };
}
function toast(title,text){
  $("toastTitle").textContent=title;$("toastText").textContent=text;$("toast").classList.add("show");
  clearTimeout(window.__toast);window.__toast=setTimeout(()=>$("toast").classList.remove("show"),2400)
}
function setStatus(kind,text){$("apiDot").className="dot "+kind;$("apiText").textContent=text}
async function api(payload){
  const key=$("apiKey").value.trim();if(!key)throw new Error("Add your TypeSafe API key.");
  const res=await fetch("/api/typesafe",{method:"POST",headers:{"Content-Type":"application/json","X-TypeSafe-Key":key},body:JSON.stringify(payload)});
  const data=await res.json().catch(()=>({}));
  if(!res.ok)throw new Error(data.error||data.detail?.message||data.detail||"Request failed.");
  return data;
}
$("testBtn").onclick=async()=>{
  if(!$("apiKey").value.trim()){toast("API key needed","Paste your TypeSafe API key first.");return}
  setStatus("busy","Testing…");$("testBtn").disabled=true;
  try{
    await api({state:"ThreadPulse API connection test",model:"jev-latest",questions:{ok:{type:"noul",instructions:"Is this text clearly an API connection test?"}}});
    setStatus("ok","Connected");toast("Connected","TypeSafe is working.")
  }catch(e){setStatus("bad","Failed");toast("Connection failed",e.message)}
  finally{$("testBtn").disabled=false}
};

$("title").oninput=()=>$("titleCount").textContent=$("title").value.length+" / 300";
$("body").oninput=()=>$("bodyCount").textContent=$("body").value.length.toLocaleString();
$("imageToggle").onchange=()=>$("imageArea").classList.toggle("show",$("imageToggle").checked);
$("imageInput").onchange=e=>{
  const file=e.target.files?.[0];if(!file)return;
  const reader=new FileReader();reader.onload=ev=>{$("previewImg").src=ev.target.result;$("preview").classList.add("show");$("upload").style.display="none"};reader.readAsDataURL(file)
};
$("removeImg").onclick=()=>{$("imageInput").value="";$("previewImg").src="";$("preview").classList.remove("show");$("upload").style.display="grid"};
$("sampleBtn").onclick=()=>{
  $("subreddit").value="r/SideProject";$("authorContext").value="creator_founder";
  $("title").value="I built a free PDF reader for research papers — what should I add next?";
  $("body").value="I wanted a cleaner way to read research papers, so I built a small open-source desktop PDF reader with fast search and simple annotations. It is free. I would love feedback from people who read papers often: what is the one feature you wish your current PDF workflow had?";
  $("title").oninput();$("body").oninput()
};
$("clearBtn").onclick=()=>{
  ["subreddit","title","body","imageNotes"].forEach(id=>$(id).value="");$("authorContext").value="not_provided";
  $("title").oninput();$("body").oninput();$("imageToggle").checked=false;$("imageArea").classList.remove("show");$("removeImg").click();
  $("results").classList.remove("show");$("empty").style.display="grid";lastResponse=lastState=lastScores=lastImproved=null
};

const clamp=x=>Math.max(0,Math.min(1,Number(x)||0));
const pct=x=>Math.round(clamp(x)*100);
const pretty=s=>String(s||"—").replaceAll("_"," ").replace(/\b\w/g,m=>m.toUpperCase());
function scorePct(a){if(!a)return 0;const n=Object.keys(a.legend||{}).length||4;return n>1?clamp(Number(a.score)/(n-1)):0}
function compose(a){
  const title=scorePct(a.title_strength),discussion=scorePct(a.discussion_potential),relevance=scorePct(a.community_relevance);
  const promo=clamp(a.self_promotion?.noul),click=clamp(a.clickbait?.noul),mod=clamp(a.moderation_risk?.noul);
  const quality=.34*title+.34*discussion+.32*relevance;
  const risk=.42*promo+.25*click+.33*mod;
  return{title,discussion,relevance,promo,click,mod,potential:clamp(quality*.82+(1-risk)*.18)}
}
function verdict(s){
  if(s.mod>.68||s.promo>.78)return["High friction","Promotion or moderation risk is dominating the signal."];
  if(s.potential>=.78)return["Strong","Clear value, good fit, and a strong reason to engage."];
  if(s.potential>=.62)return["Promising","Good foundation with a few signals that can still improve."];
  if(s.potential>=.45)return["Mixed","Readable, but the reason to engage is not yet strong enough."];
  return["Weak","The post needs a clearer value proposition or conversation hook."]
}
function riskClass(v){return v<.34?"good":v<.67?"warn":"danger"}
function render(r,stateObj){
  lastResponse=r;lastState=stateObj;
  const a=r.answers||{},s=compose(a),v=verdict(s);lastScores=s;
  $("empty").style.display="none";$("results").classList.add("show");
  $("gauge").style.setProperty("--p",pct(s.potential));$("scoreNum").textContent=pct(s.potential);
  $("verdict").textContent=v[0];$("verdictText").textContent=v[1];
  $("intentChip").textContent="Intent · "+pretty(a.post_intent?.choice);
  $("driverChip").textContent="Driver · "+pretty(a.engagement_driver?.choice);
  const conf=(Number(a.post_intent?.confidence||0)+Number(a.engagement_driver?.confidence||0))/2;
  $("confidenceChip").textContent="Confidence · "+pct(conf)+"%";
  [["title",s.title],["discussion",s.discussion],["relevance",s.relevance]].forEach(([k,v])=>{$(k+"Bar").style.width=pct(v)+"%";$(k+"Val").textContent=pct(v)+"%"});
  [["promoVal",s.promo],["clickVal",s.click],["modVal",s.mod]].forEach(([id,v])=>{$(id).textContent=pct(v)+"%";$(id).className=riskClass(v)});
  const probs=a.post_intent?.probabilities||{};
  $("intentProbs").innerHTML=Object.entries(probs).sort((x,y)=>y[1]-x[1]).slice(0,6).map(([k,v])=>'<div class="prob"><span>'+pretty(k)+'</span><div class="track"><div class="fill" style="width:'+pct(v)+'%"></div></div><b>'+pct(v)+'%</b></div>').join("");
  $("rawJson").textContent=JSON.stringify(r,null,2)
}
$("rawBtn").onclick=()=>$("raw").classList.toggle("show");

$("analyzeBtn").onclick=async()=>{
  const st=getState();if(!st.title){toast("Title needed","Paste a Reddit title first.");return}
  if(!$("apiKey").value.trim()){toast("API key needed","Paste your TypeSafe key, or use Demo.");return}
  $("analyzeBtn").disabled=true;$("analyzeText").textContent="Analyzing…";
  try{const r=await api({state:st,model:"jev-latest",questions:analysisQuestions});render(r,st);setStatus("ok","Connected")}
  catch(e){setStatus("bad","Failed");toast("Analysis failed",e.message)}
  finally{$("analyzeBtn").disabled=false;$("analyzeText").textContent="Analyze"}
};

/* local demo */
$("demoBtn").onclick=()=>{
  if(!$("title").value.trim())$("sampleBtn").click();
  const st=getState(),t=(st.title+" "+st.body).toLowerCase(),q=/\?|what|how|why|feedback|thoughts|advice/.test(t);
  const promoWords=(t.match(/\b(buy|sale|discount|sign up|subscribe|download my|check out my)\b/g)||[]).length;
  const hype=(t.match(/\b(shocking|insane|game changer|secret|you won't believe|guaranteed)\b/g)||[]).length;
  const title=clamp(.42+(st.title.length>30?.28:.06)+(hype?-.18:.1)),discussion=clamp(.3+(q?.42:.08)+(st.body.length>140?.16:.04)),relevance=st.subreddit_or_audience!=="not provided"?.78:.5;
  const promo=clamp(.08+promoWords*.2+(st.post_context==="creator_founder"?.08:0)),click=clamp(.05+hype*.24),mod=clamp(.1+promo*.45+click*.3);
  const scoreAns=v=>({type:"score",score:v*3,legend:{"0":"Low","1":"Fair","2":"Strong","3":"Excellent"},confidence:.8});
  const probs={discussion:q?.34:.16,showcase:/i built|i made|my project/.test(t)?.36:.16,question:q?.19:.08,information:.13,promotion:promo*.22,other:.06};
  const total=Object.values(probs).reduce((a,b)=>a+b,0);Object.keys(probs).forEach(k=>probs[k]/=total);
  const choice=Object.entries(probs).sort((a,b)=>b[1]-a[1])[0][0];
  render({model:"demo",answers:{
    post_intent:{type:"choice",choice,probabilities:probs,confidence:.82},
    engagement_driver:{type:"choice",choice:q?"community_relevance":"utility",probabilities:{utility:.42,community_relevance:.31,curiosity:.11,novelty:.08,emotion:.03,controversy:.02,weak_none:.03},confidence:.72},
    title_strength:scoreAns(title),discussion_potential:scoreAns(discussion),community_relevance:scoreAns(relevance),
    self_promotion:{type:"noul",noul:promo},clickbait:{type:"noul",noul:click},moderation_risk:{type:"noul",noul:mod}
  }},st);toast("Demo","Local sample result.")
};

/* ---------------- Improvement engine ---------------- */
function normalizeSpace(s){return String(s||"").replace(/\s+/g," ").trim()}
function cleanTitle(s){
  return normalizeSpace(s)
    .replace(/[🔥🚀💥‼️]+/g,"")
    .replace(/!{2,}/g,"!")
    .replace(/\?{2,}/g,"?")
    .replace(/\s+([?!.,])/g,"$1")
    .replace(/^\[(?:update|launch|promo|announcement)\]\s*/i,"")
    .trim()
}
function sentenceSplit(text){
  return normalizeSpace(text).split(/(?<=[.!?])\s+/).filter(Boolean)
}
function unique(arr){return [...new Set(arr.map(x=>normalizeSpace(x)).filter(Boolean))]}
function stripPromo(text){
  return normalizeSpace(text)
    .replace(/\b(check it out|go check it out|please check it out|sign up now|buy now|subscribe now|don't miss out)\b[.!]?/gi,"")
    .replace(/\s{2,}/g," ").trim()
}
function existingQuestion(body){
  const qs=sentenceSplit(body).filter(s=>s.includes("?"));
  return qs[qs.length-1]||""
}
function buildCandidates(st,scores){
  const title=cleanTitle(st.title);
  const rawBody=st.body==="not provided"?"":st.body;
  const cleanBody=stripPromo(rawBody);
  const sentences=sentenceSplit(cleanBody);
  const question=existingQuestion(cleanBody);
  const noQ=title.replace(/[?]+$/,"").trim();
  const lead=sentences[0]||cleanBody;
  const rest=sentences.slice(1).join(" ");
  const feedbackLine=question || "What would you improve or change?";
  const valueLead=lead.length>180?lead.slice(0,177).trim()+"…":lead;

  let titleDiscussion=title;
  if(!title.includes("?")) titleDiscussion=(noQ+" — what would you improve?").slice(0,300);

  let titleValue=title;
  if(/^i (built|made|created|launched)\b/i.test(title)){
    titleValue=title.replace(/\s*[—-]\s*what.*$/i,"").trim();
    if(!/[.!?]$/.test(titleValue)) titleValue += " — looking for feedback";
  } else if(valueLead && valueLead.length<115){
    titleValue=(valueLead.replace(/[.!?]+$/,"")+" — thoughts?").slice(0,300);
  }

  let conciseBody=sentences.slice(0,Math.min(4,sentences.length)).join(" ");
  if(question && !conciseBody.includes(question)) conciseBody=(conciseBody+"\\n\\n"+question).trim();
  else if(!question) conciseBody=(conciseBody+"\\n\\n"+feedbackLine).trim();

  let discussionBody=cleanBody;
  if(!question) discussionBody=(discussionBody+"\\n\\n"+feedbackLine).trim();

  let structuredBody="";
  if(sentences.length){
    structuredBody=valueLead;
    const middle=sentences.slice(1,-1).join(" ");
    if(middle) structuredBody+="\\n\\n"+middle;
    const ending=question||sentences[sentences.length-1]||"";
    if(ending && ending!==valueLead && !structuredBody.includes(ending)) structuredBody+="\\n\\n"+ending;
    if(!question) structuredBody+="\\n\\n"+feedbackLine;
  } else structuredBody=cleanBody;

  let lowPromo=stripPromo(cleanBody)
    .replace(/\b(my app|my product|my startup)\b/gi,m=>m.toLowerCase())
    .trim();
  if(!existingQuestion(lowPromo)) lowPromo=(lowPromo+"\\n\\n"+feedbackLine).trim();

  return[
    {id:"focused",label:"Focused",title,body:structuredBody||cleanBody},
    {id:"discussion",label:"Discussion-first",title:titleDiscussion,body:discussionBody||cleanBody},
    {id:"concise",label:"Concise",title:titleValue,body:conciseBody||cleanBody},
    {id:"low_promo",label:"Low-promo",title,body:lowPromo||cleanBody}
  ].filter((c,i,arr)=>arr.findIndex(x=>x.title===c.title&&x.body===c.body)===i)
}
function improvementQuestions(candidates){
  const q={};
  candidates.forEach((c,i)=>{
    const p="candidate_"+i;
    q[p+"_title"]={type:"score",instructions:"Judge candidates["+i+"].title as a Reddit title for clarity, specificity, accuracy, and natural interest. Do not reward empty clickbait.",criteria:["Weak or vague.","Usable but ordinary.","Clear, specific, and naturally interesting.","Exceptionally crisp while accurate."]};
    q[p+"_discussion"]={type:"score",instructions:"Considering only candidates["+i+"].title and candidates["+i+"].body, how much genuine discussion or useful response does this version invite?",criteria:["Little reason to reply.","Some reply potential.","Clear openings for useful replies.","Strong substantive discussion potential."]};
    q[p+"_relevance"]={type:"score",instructions:"How well does candidates["+i+"] appear targeted to subreddit_or_audience? If audience is not provided, judge whether it has a clear audience.",criteria:["Poorly targeted.","Somewhat relevant.","Clearly relevant.","Highly specific and naturally suited."]};
    q[p+"_promo"]={type:"noul",instructions:"Does candidates["+i+"] primarily read as self-promotion, solicitation, advertising, or traffic acquisition rather than contribution?"};
    q[p+"_click"]={type:"noul",instructions:"Is candidates["+i+"].title meaningfully clickbait, misleading, manipulative, or disproportionately hyped?"};
    q[p+"_mod"]={type:"noul",instructions:"Based only on candidates["+i+"], is there a clear common subreddit moderation risk such as spam, solicitation, low effort, unclear relevance, misleading framing, or excessive self-promotion?"}
  });
  return q
}
function candidateScore(a,i){
  const p="candidate_"+i;
  const s={
    title:scorePct(a[p+"_title"]),discussion:scorePct(a[p+"_discussion"]),relevance:scorePct(a[p+"_relevance"]),
    promo:clamp(a[p+"_promo"]?.noul),click:clamp(a[p+"_click"]?.noul),mod:clamp(a[p+"_mod"]?.noul)
  };
  const quality=.34*s.title+.34*s.discussion+.32*s.relevance,risk=.42*s.promo+.25*s.click+.33*s.mod;
  s.potential=clamp(quality*.82+(1-risk)*.18);return s
}
function weakestReasons(before,after){
  const out=[];
  const labels={title:"Title clarity",discussion:"Discussion",relevance:"Audience fit"};
  ["title","discussion","relevance"].forEach(k=>{if(after[k]-before[k]>.05)out.push(labels[k]+" +"+Math.round((after[k]-before[k])*100))});
  if(before.promo-after.promo>.05)out.push("Promotion −"+Math.round((before.promo-after.promo)*100));
  if(before.click-after.click>.05)out.push("Clickbait −"+Math.round((before.click-after.click)*100));
  if(before.mod-after.mod>.05)out.push("Moderation −"+Math.round((before.mod-after.mod)*100));
  if(!out.length)out.push("Best balanced candidate");
  return out.slice(0,4)
}
function openDrawer(){$("overlay").classList.add("show");$("drawer").classList.add("show")}
function closeDrawer(){$("overlay").classList.remove("show");$("drawer").classList.remove("show")}
$("overlay").onclick=closeDrawer;$("closeDrawer").onclick=closeDrawer;

$("improveBtn").onclick=async()=>{
  if(!lastState||!lastScores){toast("Analyze first","Run an analysis before improving.");return}
  if(!$("apiKey").value.trim()){toast("API key needed","Improvement ranking uses TypeSafe.");return}
  openDrawer();$("loader").classList.add("show");$("improved").classList.remove("show");
  const candidates=buildCandidates(lastState,lastScores);
  try{
    const st={subreddit_or_audience:lastState.subreddit_or_audience,original:{title:lastState.title,body:lastState.body},candidates};
    const r=await api({state:st,model:"jev-latest",questions:improvementQuestions(candidates)});
    const scored=candidates.map((c,i)=>({...c,scores:candidateScore(r.answers||{},i)})).sort((a,b)=>b.scores.potential-a.scores.potential);
    const best=scored[0];
    lastImproved=best;
    $("beforeScore").textContent=pct(lastScores.potential);
    $("afterScore").textContent=pct(best.scores.potential);
    const gain=pct(best.scores.potential)-pct(lastScores.potential);
    $("gain").textContent=(gain>=0?"+":"")+gain;
    $("winnerLabel").textContent=best.label+" candidate";
    $("improvedTitle").textContent=best.title;
    $("improvedBody").textContent=best.body;
    $("originalPreview").textContent=lastState.title+" — "+lastState.body;
    $("improvedPreview").textContent=best.title+" — "+best.body;
    $("why").innerHTML=weakestReasons(lastScores,best.scores).map(x=>'<span class="why-chip">'+x+'</span>').join("");
    $("loader").classList.remove("show");$("improved").classList.add("show")
  }catch(e){
    $("loader").classList.remove("show");closeDrawer();toast("Could not improve",e.message)
  }
};

$("applyBtn").onclick=()=>{
  if(!lastImproved)return;
  $("title").value=lastImproved.title;$("body").value=lastImproved.body;$("title").oninput();$("body").oninput();
  closeDrawer();toast("Applied","Improved version is now in the editor.")
};
$("copyImprovedBtn").onclick=async()=>{
  if(!lastImproved)return;
  const text=lastImproved.title+"\\n\\n"+lastImproved.body;
  try{await navigator.clipboard.writeText(text);toast("Copied","Improved post copied.")}
  catch{toast("Copy blocked","Select and copy the text manually.")}
};
</script>
</body>
</html>`;

function send(res,status,body,type="application/json; charset=utf-8"){
  res.writeHead(status,{"Content-Type":type,"Cache-Control":"no-store","X-Content-Type-Options":"nosniff","Referrer-Policy":"no-referrer"});
  res.end(body)
}

const server=http.createServer(async(req,res)=>{
  if(req.method==="GET"&&req.url==="/")return send(res,200,html,"text/html; charset=utf-8");
  if(req.method==="GET"&&req.url==="/health")return send(res,200,JSON.stringify({ok:true}));

  if(req.method==="POST"&&req.url==="/api/typesafe"){
    const key=String(req.headers["x-typesafe-key"]||"").trim();
    if(!key)return send(res,400,JSON.stringify({error:"Missing TypeSafe API key."}));

    let raw="";
    for await(const chunk of req){
      raw+=chunk;
      if(raw.length>2_000_000)return send(res,413,JSON.stringify({error:"Request too large."}))
    }
    let payload;
    try{payload=JSON.parse(raw)}catch{return send(res,400,JSON.stringify({error:"Invalid JSON request."}))}

    try{
      const upstream=await fetch("https://api.typesafe.ai/v1/systemone",{
        method:"POST",
        headers:{"Authorization":`Bearer ${key}`,"Content-Type":"application/json"},
        body:JSON.stringify(payload)
      });
      const text=await upstream.text();
      res.writeHead(upstream.status,{"Content-Type":upstream.headers.get("content-type")||"application/json; charset=utf-8","Cache-Control":"no-store","X-Content-Type-Options":"nosniff"});
      return res.end(text)
    }catch(err){
      return send(res,502,JSON.stringify({error:`Could not reach TypeSafe: ${err?.message||err}`}))
    }
  }

  return send(res,404,JSON.stringify({error:"Not found"}))
});

server.listen(PORT,"127.0.0.1",()=>{
  console.log("");
  console.log("  ThreadPulse v3");
  console.log(`  http://localhost:${PORT}`);
  console.log("");
  console.log("  Keep this terminal open while using the app.");
  console.log("")
});
