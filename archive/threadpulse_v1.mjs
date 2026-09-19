// ThreadPulse — single-file local app
// Requires Node.js 18+
// Run: node threadpulse.mjs
// Open: http://localhost:8787

import http from "node:http";

const PORT = Number(process.env.PORT || 8787);

const html = String.raw`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>ThreadPulse</title>
<style>
:root{
  --bg:#f3f1eb;
  --surface:#fbfaf6;
  --ink:#171916;
  --muted:#767b73;
  --line:#deddd6;
  --accent:#b9e769;
  --accent-strong:#93c93f;
  --danger:#d95c4d;
  --warning:#d9a441;
  --blue:#6ea8c8;
  --shadow:0 18px 60px rgba(24,27,23,.08);
}
*{box-sizing:border-box}
body{
  margin:0;
  min-height:100vh;
  background:
    radial-gradient(850px 480px at 92% -10%,rgba(185,231,105,.24),transparent 65%),
    var(--bg);
  color:var(--ink);
  font-family:Inter,ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
  letter-spacing:-.015em;
}
button,input,textarea,select{font:inherit}
button{cursor:pointer}
.app{width:min(1240px,calc(100% - 32px));margin:0 auto;padding:22px 0 44px}
.topbar{
  height:58px;display:flex;align-items:center;justify-content:space-between;
  border-bottom:1px solid rgba(23,25,22,.08);
}
.brand{display:flex;align-items:center;gap:10px;font-weight:760;font-size:15px}
.mark{
  width:31px;height:31px;border-radius:10px;background:var(--ink);display:grid;place-items:center
}
.mark svg{width:18px;height:18px;color:var(--accent)}
.top-actions{display:flex;align-items:center;gap:8px}
.key-wrap{
  width:min(330px,38vw);height:38px;border:1px solid var(--line);background:rgba(251,250,246,.78);
  border-radius:11px;display:flex;align-items:center;padding:0 10px;gap:8px
}
.key-wrap input{width:100%;border:0;outline:0;background:transparent;font-size:12px;color:var(--ink)}
.key-wrap svg{width:14px;color:var(--muted)}
.btn{
  height:38px;border:1px solid var(--line);background:var(--surface);color:var(--ink);
  border-radius:11px;padding:0 13px;font-size:11px;font-weight:720;
  display:inline-flex;align-items:center;justify-content:center;gap:7px;transition:.18s ease
}
.btn:hover{transform:translateY(-1px);border-color:#c9c8c0}
.btn.primary{background:var(--ink);border-color:var(--ink);color:#fff}
.btn.primary:hover{background:#242722}
.btn svg{width:14px;height:14px}
.api-state{
  display:flex;align-items:center;gap:6px;font-size:10px;color:var(--muted);padding-left:3px
}
.dot{width:7px;height:7px;border-radius:50%;background:#a9ada7}
.dot.ok{background:var(--accent-strong)}
.dot.bad{background:var(--danger)}
.dot.busy{background:var(--warning);animation:pulse .9s infinite}
@keyframes pulse{50%{opacity:.35}}

.titlebar{padding:44px 0 24px;display:flex;align-items:end;justify-content:space-between;gap:30px}
.titlebar h1{margin:0;font-size:clamp(36px,5vw,62px);line-height:.98;letter-spacing:-.06em;font-weight:740}
.titlebar p{margin:0 0 4px;color:var(--muted);font-size:12px;max-width:310px;line-height:1.55;text-align:right}

.grid{display:grid;grid-template-columns:minmax(0,1.08fr) minmax(390px,.92fr);gap:14px}
.card{background:rgba(251,250,246,.86);border:1px solid var(--line);border-radius:18px;box-shadow:var(--shadow);overflow:hidden}
.card-head{height:54px;padding:0 17px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--line)}
.card-head strong{font-size:12px}
.card-head span{font-size:10px;color:var(--muted)}
.body{padding:17px}
.field{margin-bottom:14px}.field:last-child{margin-bottom:0}
.labelrow{display:flex;align-items:center;justify-content:space-between;margin-bottom:7px}
label{font-size:10px;font-weight:730}.counter{font-size:9px;color:var(--muted)}
.text{
  width:100%;border:1px solid var(--line);background:#fffefb;color:var(--ink);outline:0;
  border-radius:12px;padding:11px 12px;font-size:12px;transition:.18s ease
}
.text:focus{border-color:#b9c69d;box-shadow:0 0 0 4px rgba(185,231,105,.13)}
textarea.text{min-height:190px;resize:vertical;line-height:1.55}
.row2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.togglebox{
  min-height:48px;border:1px solid var(--line);border-radius:12px;background:#fffefb;
  display:flex;align-items:center;justify-content:space-between;padding:0 12px
}
.togglebox b{font-size:10px}.togglebox small{display:block;color:var(--muted);font-size:9px;margin-top:2px}
.switch{position:relative;width:38px;height:22px}
.switch input{display:none}
.slider{position:absolute;inset:0;background:#dddcd5;border-radius:99px;transition:.2s}
.slider:after{content:"";position:absolute;left:3px;top:3px;width:16px;height:16px;background:white;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,.16);transition:.2s}
.switch input:checked + .slider{background:var(--ink)}
.switch input:checked + .slider:after{transform:translateX(16px);background:var(--accent)}
.image-area{display:none;margin-top:10px}.image-area.show{display:block}
.upload{
  min-height:112px;border:1px dashed #c9c9c1;border-radius:12px;background:#fffefb;position:relative;
  display:grid;place-items:center;text-align:center;padding:14px;overflow:hidden
}
.upload input{position:absolute;inset:0;opacity:0;cursor:pointer}
.upload svg{width:20px;color:var(--muted);margin-bottom:5px}
.upload b{font-size:10px;display:block}.upload span{font-size:9px;color:var(--muted);display:block;margin-top:3px}
.preview{display:none;position:relative;border-radius:12px;overflow:hidden;border:1px solid var(--line);background:white}
.preview.show{display:block}
.preview img{display:block;width:100%;height:210px;object-fit:cover}
.preview button{position:absolute;right:8px;top:8px}
.image-note{margin-top:9px}
.actions{display:flex;gap:8px;margin-top:16px}
.actions .primary{flex:1}

.empty{min-height:590px;display:grid;place-items:center;text-align:center;padding:30px}
.empty-inner{max-width:290px}
.empty-icon{
  width:62px;height:62px;border-radius:18px;border:1px solid var(--line);background:#fffefb;
  display:grid;place-items:center;margin:0 auto 12px
}
.empty-icon svg{width:25px;color:var(--muted)}
.empty h3{font-size:14px;margin:0 0 5px}.empty p{font-size:10px;color:var(--muted);line-height:1.55;margin:0}
.results{display:none}.results.show{display:block}
.score-head{padding:18px;border-bottom:1px solid var(--line)}
.score-row{display:grid;grid-template-columns:112px 1fr;gap:16px;align-items:center}
.score{
  --p:70;width:104px;height:104px;border-radius:50%;display:grid;place-items:center;position:relative;
  background:conic-gradient(var(--ink) calc(var(--p)*1%),#e8e7e0 0)
}
.score:after{content:"";position:absolute;inset:7px;background:var(--surface);border-radius:50%}
.score-inner{position:relative;z-index:1;text-align:center}
.score-inner strong{font-size:29px;line-height:1;letter-spacing:-.06em}
.score-inner span{display:block;font-size:8px;color:var(--muted);text-transform:uppercase;letter-spacing:.1em;margin-top:4px}
.verdict h2{font-size:18px;margin:0 0 5px;letter-spacing:-.035em}
.verdict p{font-size:10px;line-height:1.5;color:var(--muted);margin:0}
.chips{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}
.chip{padding:5px 7px;border-radius:8px;background:#eeeDE7;border:1px solid #e0dfd8;font-size:9px;color:#545a52}
.section{padding:15px 18px;border-bottom:1px solid var(--line)}
.section:last-child{border-bottom:0}
.section-title{font-size:10px;font-weight:760;margin-bottom:12px}
.metric{display:grid;grid-template-columns:120px 1fr 36px;gap:8px;align-items:center;margin-bottom:9px}
.metric:last-child{margin-bottom:0}
.metric span{font-size:9px;color:#4f554e}.metric b{font:650 9px ui-monospace,SFMono-Regular,Menlo,monospace;text-align:right}
.track{height:6px;background:#e7e6df;border-radius:999px;overflow:hidden}
.fill{height:100%;background:var(--ink);border-radius:999px;width:0;transition:width .45s ease}
.risks{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.risk{padding:10px;border-radius:11px;border:1px solid var(--line);background:#fffefb}
.risk span{font-size:9px;color:var(--muted);display:block}.risk b{font-size:16px;display:block;margin-top:4px}
.good{color:#6e9a34}.warn{color:#b88426}.bad{color:var(--danger)}
.probs{display:grid;gap:8px}
.prob{display:grid;grid-template-columns:105px 1fr 34px;gap:8px;align-items:center}
.prob span{font-size:9px}.prob b{font:650 9px ui-monospace,SFMono-Regular,Menlo,monospace;text-align:right}
.raw{display:none}.raw.show{display:block}
pre{margin:0;max-height:270px;overflow:auto;background:#171916;color:#dde4d8;border-radius:12px;padding:12px;font:9px/1.55 ui-monospace,SFMono-Regular,Menlo,monospace;white-space:pre-wrap;word-break:break-word}
.smallbtn{height:31px;padding:0 9px;font-size:9px;border-radius:9px}
.toast{
  position:fixed;right:20px;bottom:20px;background:var(--ink);color:#fff;border-radius:12px;
  padding:11px 13px;box-shadow:0 18px 50px rgba(0,0,0,.18);font-size:10px;
  transform:translateY(18px);opacity:0;transition:.2s;pointer-events:none;max-width:330px
}
.toast.show{opacity:1;transform:translateY(0)}
.toast b{display:block;font-size:10px;margin-bottom:2px}.toast span{color:#c8ccc5}
@media(max-width:940px){
  .grid{grid-template-columns:1fr}.titlebar{align-items:flex-start;flex-direction:column}.titlebar p{text-align:left}
  .empty{min-height:340px}
}
@media(max-width:680px){
  .app{width:min(100% - 20px,1240px)}
  .topbar{height:auto;padding:12px 0;align-items:flex-start;gap:12px}.top-actions{flex-wrap:wrap;justify-content:flex-end}
  .key-wrap{width:100%;order:3}.api-state{display:none}.titlebar{padding-top:30px}.titlebar h1{font-size:42px}
  .row2{grid-template-columns:1fr}.score-row{grid-template-columns:1fr;text-align:center}.score{margin:0 auto}
  .chips{justify-content:center}.risks{grid-template-columns:1fr}.metric{grid-template-columns:105px 1fr 34px}
}
</style>
</head>
<body>
<div class="app">
  <div class="topbar">
    <div class="brand">
      <div class="mark">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 17 9 7l3 7 3-5 4 8"/><path d="M5 17h14"/></svg>
      </div>
      ThreadPulse
    </div>
    <div class="top-actions">
      <div class="key-wrap">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="8" cy="12" r="4"/><path d="M12 12h9m-3 0v3m-3-3v2"/></svg>
        <input id="apiKey" type="password" placeholder="TypeSafe API key" autocomplete="off">
      </div>
      <button class="btn" id="testBtn">Test</button>
      <div class="api-state"><span class="dot" id="apiDot"></span><span id="apiText">Not tested</span></div>
    </div>
  </div>

  <div class="titlebar">
    <h1>Reddit post<br>intelligence.</h1>
    <p>Paste a post. Get a clean classification and signal-based performance estimate.</p>
  </div>

  <div class="grid">
    <section class="card">
      <div class="card-head">
        <strong>Post</strong>
        <button class="btn smallbtn" id="sampleBtn">Sample</button>
      </div>
      <div class="body">
        <div class="row2">
          <div class="field">
            <div class="labelrow"><label>Subreddit</label></div>
            <input class="text" id="subreddit" placeholder="r/SideProject">
          </div>
          <div class="field">
            <div class="labelrow"><label>Post type</label></div>
            <select class="text" id="authorContext">
              <option value="not_provided">Not specified</option>
              <option value="creator_founder">My own project</option>
              <option value="regular_member">Community post</option>
              <option value="question">Question</option>
              <option value="news">News / information</option>
            </select>
          </div>
        </div>

        <div class="field">
          <div class="labelrow"><label>Title</label><span class="counter" id="titleCount">0 / 300</span></div>
          <input class="text" id="title" maxlength="300" placeholder="Paste Reddit title">
        </div>

        <div class="field">
          <div class="labelrow"><label>Description</label><span class="counter" id="bodyCount">0</span></div>
          <textarea class="text" id="body" placeholder="Paste post description"></textarea>
        </div>

        <div class="field">
          <div class="togglebox">
            <div><b>Image</b><small>Optional context</small></div>
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
              <button class="btn smallbtn" id="removeImg" type="button">Remove</button>
            </div>
            <input class="text image-note" id="imageNotes" placeholder="Optional image description for analysis">
          </div>
        </div>

        <div class="actions">
          <button class="btn primary" id="analyzeBtn">
            <svg id="runIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M8 5v14l11-7Z"/></svg>
            <span id="analyzeText">Analyze</span>
          </button>
          <button class="btn" id="demoBtn">Demo</button>
          <button class="btn" id="clearBtn">Clear</button>
        </div>
      </div>
    </section>

    <section class="card">
      <div class="empty" id="empty">
        <div class="empty-inner">
          <div class="empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 17V9m5 8V5m5 12v-7m4 7V7"/></svg>
          </div>
          <h3>Ready to analyze</h3>
          <p>Your result will appear here.</p>
        </div>
      </div>

      <div class="results" id="results">
        <div class="score-head">
          <div class="score-row">
            <div class="score" id="score" style="--p:0">
              <div class="score-inner"><strong id="scoreNum">0</strong><span>potential</span></div>
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

        <div class="section">
          <div class="section-title">Signals</div>
          <div class="metric"><span>Title strength</span><div class="track"><div class="fill" id="titleBar"></div></div><b id="titleVal">0%</b></div>
          <div class="metric"><span>Discussion</span><div class="track"><div class="fill" id="discussionBar"></div></div><b id="discussionVal">0%</b></div>
          <div class="metric"><span>Audience fit</span><div class="track"><div class="fill" id="relevanceBar"></div></div><b id="relevanceVal">0%</b></div>
        </div>

        <div class="section">
          <div class="section-title">Intent</div>
          <div class="probs" id="intentProbs"></div>
        </div>

        <div class="section">
          <div class="section-title">Risk</div>
          <div class="risks">
            <div class="risk"><span>Promotion</span><b id="promoVal">0%</b></div>
            <div class="risk"><span>Clickbait</span><b id="clickVal">0%</b></div>
            <div class="risk"><span>Moderation</span><b id="modVal">0%</b></div>
          </div>
        </div>

        <div class="section">
          <button class="btn smallbtn" id="rawBtn">Raw JSON</button>
          <div class="raw" id="raw"><div style="height:8px"></div><pre id="rawJson"></pre></div>
        </div>
      </div>
    </section>
  </div>
</div>

<div class="toast" id="toast"><b id="toastTitle"></b><span id="toastText"></span></div>

<script>
const $ = id => document.getElementById(id);
let last = null;

const questions = {
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
  self_promotion:{
    type:"noul",
    instructions:"Does this post primarily read as self-promotion, solicitation, advertising, or traffic acquisition rather than contribution?"
  },
  clickbait:{
    type:"noul",
    instructions:"Is the title meaningfully clickbait, misleading, manipulative, or disproportionately hyped compared with the content?"
  },
  moderation_risk:{
    type:"noul",
    instructions:"Based only on the supplied content, is there a clear common subreddit moderation risk such as spam, solicitation, low effort, unclear relevance, misleading framing, or excessive self-promotion?"
  }
};

function state(){
  return {
    subreddit_or_audience:$("subreddit").value.trim() || "not provided",
    post_type:$("authorContext").value,
    title:$("title").value.trim(),
    body:$("body").value.trim() || "not provided",
    image_context:$("imageToggle").checked ? ($("imageNotes").value.trim() || "image attached locally, no text description provided") : "not used"
  };
}

function toast(title,text){
  $("toastTitle").textContent=title;$("toastText").textContent=text;$("toast").classList.add("show");
  clearTimeout(window.__t);window.__t=setTimeout(()=>$("toast").classList.remove("show"),2400);
}

function apiState(type,text){
  $("apiDot").className="dot "+type;$("apiText").textContent=text;
}

async function callApi(payload){
  const key=$("apiKey").value.trim();
  if(!key) throw new Error("Add your TypeSafe API key.");
  const res=await fetch("/api/typesafe",{
    method:"POST",
    headers:{"Content-Type":"application/json","X-TypeSafe-Key":key},
    body:JSON.stringify(payload)
  });
  const data=await res.json().catch(()=>({}));
  if(!res.ok) throw new Error(data.error || "Request failed.");
  return data;
}

$("testBtn").onclick=async()=>{
  if(!$("apiKey").value.trim()){toast("API key needed","Paste your TypeSafe API key first.");return}
  apiState("busy","Testing…");$("testBtn").disabled=true;
  try{
    await callApi({
      state:"ThreadPulse connection test",
      model:"jev-latest",
      questions:{ok:{type:"noul",instructions:"Is this text clearly a connection test?"}}
    });
    apiState("ok","Connected");toast("Connected","TypeSafe is working.");
  }catch(e){apiState("bad","Failed");toast("Connection failed",e.message)}
  finally{$("testBtn").disabled=false}
};

$("title").oninput=()=>{$("titleCount").textContent=$("title").value.length+" / 300"};
$("body").oninput=()=>{$("bodyCount").textContent=$("body").value.length.toLocaleString()};
$("imageToggle").onchange=()=>$("imageArea").classList.toggle("show",$("imageToggle").checked);

$("imageInput").onchange=e=>{
  const f=e.target.files?.[0];if(!f)return;
  const r=new FileReader();r.onload=ev=>{
    $("previewImg").src=ev.target.result;$("preview").classList.add("show");$("upload").style.display="none";
  };r.readAsDataURL(f);
};
$("removeImg").onclick=()=>{
  $("imageInput").value="";$("previewImg").src="";$("preview").classList.remove("show");$("upload").style.display="grid";
};

$("sampleBtn").onclick=()=>{
  $("subreddit").value="r/SideProject";$("authorContext").value="creator_founder";
  $("title").value="I built a free PDF reader for research papers — what should I add next?";
  $("body").value="I wanted a cleaner way to read research papers, so I built a small open-source desktop PDF reader with fast search and simple annotations. It is free. I would love feedback from people who read papers often: what is the one feature you wish your current PDF workflow had?";
  $("title").oninput();$("body").oninput();
};

$("clearBtn").onclick=()=>{
  ["subreddit","title","body","imageNotes"].forEach(x=>$(x).value="");$("authorContext").value="not_provided";
  $("title").oninput();$("body").oninput();$("imageToggle").checked=false;$("imageArea").classList.remove("show");
  $("removeImg").click();$("results").classList.remove("show");$("empty").style.display="grid";
};

const clamp=x=>Math.max(0,Math.min(1,Number(x)||0));
const pct=x=>Math.round(clamp(x)*100);
const pretty=s=>String(s||"—").replaceAll("_"," ").replace(/\b\w/g,m=>m.toUpperCase());
function scorePct(a){
  if(!a)return 0;
  const levels=Object.keys(a.legend||{}).length||4;
  return levels>1?clamp(Number(a.score)/(levels-1)):0;
}
function calc(r){
  const a=r.answers||{};
  const title=scorePct(a.title_strength),discussion=scorePct(a.discussion_potential),relevance=scorePct(a.community_relevance);
  const promo=clamp(a.self_promotion?.noul),click=clamp(a.clickbait?.noul),mod=clamp(a.moderation_risk?.noul);
  const quality=.34*title+.34*discussion+.32*relevance;
  const risk=.42*promo+.25*click+.33*mod;
  return {title,discussion,relevance,promo,click,mod,potential:clamp(quality*.82+(1-risk)*.18)};
}
function verdict(s){
  if(s.mod>.68||s.promo>.78)return["High friction","Promotion or moderation risk is dominating the signal."];
  if(s.potential>=.78)return["Strong","Clear value, good fit, and a strong reason to engage."];
  if(s.potential>=.62)return["Promising","Good foundation with a few signals that can still improve."];
  if(s.potential>=.45)return["Mixed","Readable, but the reason to engage is not yet strong enough."];
  return["Weak","The post needs a clearer value proposition or conversation hook."];
}
function riskClass(v){return v<.34?"good":v<.67?"warn":"bad"}

function render(r){
  last=r;const a=r.answers||{},s=calc(r),v=verdict(s);
  $("empty").style.display="none";$("results").classList.add("show");
  $("score").style.setProperty("--p",pct(s.potential));$("scoreNum").textContent=pct(s.potential);
  $("verdict").textContent=v[0];$("verdictText").textContent=v[1];
  $("intentChip").textContent="Intent · "+pretty(a.post_intent?.choice);
  $("driverChip").textContent="Driver · "+pretty(a.engagement_driver?.choice);
  const conf=((Number(a.post_intent?.confidence||0)+Number(a.engagement_driver?.confidence||0))/2);
  $("confidenceChip").textContent="Confidence · "+pct(conf)+"%";
  [["title",s.title],["discussion",s.discussion],["relevance",s.relevance]].forEach(([k,x])=>{
    $(k+"Bar").style.width=pct(x)+"%";$(k+"Val").textContent=pct(x)+"%";
  });
  [["promoVal",s.promo],["clickVal",s.click],["modVal",s.mod]].forEach(([id,x])=>{
    $(id).textContent=pct(x)+"%";$(id).className=riskClass(x);
  });
  const probs=a.post_intent?.probabilities||{};
  $("intentProbs").innerHTML=Object.entries(probs).sort((x,y)=>y[1]-x[1]).slice(0,6).map(([k,x])=>
    '<div class="prob"><span>'+pretty(k)+'</span><div class="track"><div class="fill" style="width:'+pct(x)+'%"></div></div><b>'+pct(x)+'%</b></div>'
  ).join("");
  $("rawJson").textContent=JSON.stringify(r,null,2);
}
$("rawBtn").onclick=()=>$("raw").classList.toggle("show");

$("analyzeBtn").onclick=async()=>{
  const s=state();
  if(!s.title){toast("Title needed","Paste a Reddit title first.");return}
  if(!$("apiKey").value.trim()){toast("API key needed","Paste your TypeSafe API key, or use Demo.");return}
  $("analyzeBtn").disabled=true;$("analyzeText").textContent="Analyzing…";
  try{
    const r=await callApi({state:s,model:"jev-latest",questions});render(r);apiState("ok","Connected");
  }catch(e){toast("Analysis failed",e.message);apiState("bad","Failed")}
  finally{$("analyzeBtn").disabled=false;$("analyzeText").textContent="Analyze"}
};

$("demoBtn").onclick=()=>{
  if(!$("title").value.trim())$("sampleBtn").click();
  const t=($("title").value+" "+$("body").value).toLowerCase();
  const q=/\?|what|how|why|feedback|thoughts|advice/.test(t);
  const promoWords=(t.match(/\b(buy|sale|discount|sign up|subscribe|download my|check out my)\b/g)||[]).length;
  const hype=(t.match(/\b(shocking|insane|game changer|secret|you won't believe|guaranteed)\b/g)||[]).length;
  const title=clamp(.42+($("title").value.length>30?.28:.06)+(hype?-.18:.1));
  const discussion=clamp(.3+(q?.42:.08)+($("body").value.length>140?.16:.04));
  const relevance=$("subreddit").value.trim()?.78:.5;
  const promo=clamp(.08+promoWords*.2+($("authorContext").value==="creator_founder"?.08:0));
  const click=clamp(.05+hype*.24);
  const mod=clamp(.1+promo*.45+click*.3);
  const scoreAns=v=>({type:"score",score:v*3,legend:{"0":"Low","1":"Fair","2":"Strong","3":"Excellent"},confidence:.8});
  const probs={discussion:q?.34:.16,showcase:/i built|i made|my project/.test(t)?.36:.16,question:q?.19:.08,information:.13,promotion:promo*.22,other:.06};
  const total=Object.values(probs).reduce((a,b)=>a+b,0);Object.keys(probs).forEach(k=>probs[k]/=total);
  const choice=Object.entries(probs).sort((a,b)=>b[1]-a[1])[0][0];
  render({model:"demo",answers:{
    post_intent:{type:"choice",choice,probabilities:probs,confidence:.82},
    engagement_driver:{type:"choice",choice:q?"community_relevance":"utility",probabilities:{utility:.42,community_relevance:.31,curiosity:.11,novelty:.08,emotion:.03,controversy:.02,weak_none:.03},confidence:.72},
    title_strength:scoreAns(title),discussion_potential:scoreAns(discussion),community_relevance:scoreAns(relevance),
    self_promotion:{type:"noul",noul:promo},clickbait:{type:"noul",noul:click},moderation_risk:{type:"noul",noul:mod}
  },usage:{input_tokens:"demo",output_tokens:"demo"}});
  toast("Demo","Local sample result.");
};
</script>
</body>
</html>`;

function send(res, status, body, type="application/json; charset=utf-8"){
  res.writeHead(status,{
    "Content-Type":type,
    "Cache-Control":"no-store",
    "X-Content-Type-Options":"nosniff",
    "Referrer-Policy":"no-referrer"
  });
  res.end(body);
}

const server=http.createServer(async(req,res)=>{
  if(req.method==="GET" && req.url==="/"){
    return send(res,200,html,"text/html; charset=utf-8");
  }

  if(req.method==="POST" && req.url==="/api/typesafe"){
    const key=String(req.headers["x-typesafe-key"]||"").trim();
    if(!key) return send(res,400,JSON.stringify({error:"Missing TypeSafe API key."}));

    let raw="";
    for await (const chunk of req){
      raw+=chunk;
      if(raw.length>1_000_000){
        return send(res,413,JSON.stringify({error:"Request too large."}));
      }
    }

    let payload;
    try{payload=JSON.parse(raw)}
    catch{return send(res,400,JSON.stringify({error:"Invalid JSON request."}))}

    try{
      const upstream=await fetch("https://api.typesafe.ai/v1/systemone",{
        method:"POST",
        headers:{
          "Authorization":`Bearer ${key}`,
          "Content-Type":"application/json"
        },
        body:JSON.stringify(payload)
      });

      const text=await upstream.text();
      res.writeHead(upstream.status,{
        "Content-Type":upstream.headers.get("content-type")||"application/json; charset=utf-8",
        "Cache-Control":"no-store",
        "X-Content-Type-Options":"nosniff"
      });
      return res.end(text);
    }catch(err){
      return send(res,502,JSON.stringify({error:`Could not reach TypeSafe: ${err?.message||err}`}));
    }
  }

  if(req.method==="GET" && req.url==="/health"){
    return send(res,200,JSON.stringify({ok:true}));
  }

  return send(res,404,JSON.stringify({error:"Not found"}));
});

server.listen(PORT,"127.0.0.1",()=>{
  console.log("");
  console.log("  ThreadPulse");
  console.log(`  http://localhost:${PORT}`);
  console.log("");
  console.log("  Keep this terminal open while using the app.");
  console.log("");
});
