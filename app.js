// 幸福教養工具箱｜模組1｜大人先穩 v1.0
// 穩定原則：事件委派 + 時間戳差值計時 + 回饋累積不打卡

const LS_KEY = "HP_TOOLBOX_M1_V1";
const nowISO = () => new Date().toISOString();

const TEXT = {
  m1: {
    inner: [
      "先讓自己穩定一點。",
      "有點撐，先緩一下。",
      "先深呼吸幾下就好。",
      "先讓情緒慢下來。",
      "事情等等再處理。",
      "先站穩，再想下一步。",
      "慢一點也沒關係。",
      "先停一下，腦子才跟得上。",
      "先喝口水、換口氣。",
      "先把聲音放小一點。",
      "先把肩膀放鬆。",
      "先讓心跳慢一點。",
      "先讓臉放鬆。",
      "先回到呼吸，下一句再說。",
      "先讓自己回來。",
      "先讓氣順一點。",
      "先給自己一點空間。",
      "先把速度放慢。",
      "先把重點放在當下。",
      "先把心穩定下來。"
    ],
    outer: [
      "先停一下，等等再說。",
      "需要先整理一下，等一下。",
      "有聽到，給一點時間。",
      "這件事晚一點再處理。",
      "先緩一緩。",
      "先安靜一下。",
      "先喝口水，等一下再談。",
      "先去洗把臉，等一下回來。",
      "先回房間一下，等一下再回來。",
      "先坐下來，慢一點。",
      "先把聲音放小一點再談。",
      "先讓呼吸慢下來，再講。",
      "先到這裡，等一下再接。",
      "先休息一下，等一下再繼續。",
      "先把手上的事放下來，等一下再說。"
    ],
    praise: [
      "剛剛有停一下，現場就改變了。",
      "願意先緩一緩，已經很有力量。",
      "有回來用工具，就很了不起。",
      "能讓自己穩定一點，孩子才有依靠。",
      "先照顧好狀態，後面才好說話。",
      "慢下來的那一刻，就是轉折點。"
    ],
    dailyPractice: [
      "今天有沒有先深呼吸再回應？",
      "今天有沒有把音量放小再說？",
      "今天有沒有先停三秒再講？",
      "今天有沒有先離開十秒再回來？",
      "今天有沒有先喝口水再處理？",
      "今天有沒有先把速度放慢？"
    ]
  }
};

function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

const state = loadState();

function defaultState(){
  return {
    version: "1.0",
    lastUsedAt: null,
    count: 0,
    history: [] // {t, kind}
  };
}
function loadState(){
  try{
    const raw = localStorage.getItem(LS_KEY);
    return raw ? { ...defaultState(), ...JSON.parse(raw) } : defaultState();
  }catch{ return defaultState(); }
}
function saveState(){ localStorage.setItem(LS_KEY, JSON.stringify(state)); }

// --- 回饋 UI ---
function updateRewardUI(){
  const badge = document.getElementById("presenceBadge");
  const text = document.getElementById("presenceText");
  const fill = document.getElementById("seedFill");
  const meta = document.getElementById("seedMeta");

  const now = Date.now();
  const last = state.lastUsedAt ? new Date(state.lastUsedAt).getTime() : null;
  const recent = last && (now - last <= 72*3600*1000);

  badge.textContent = recent ? "最近有回來" : "想起來就好";
  text.textContent = recent ? "願意回來，就在路上。" : "不用補作業，回來就好。";

  const pct = Math.min(100, Math.round((state.count/60)*100));
  fill.style.width = pct + "%";
  meta.textContent = `累積：${state.count}`;
}

function praise(msg){
  const out = document.getElementById("praiseOut");
  out.textContent = msg || pick(TEXT.m1.praise);
}

function logDone(kind){
  state.count += 1;
  state.lastUsedAt = nowISO();
  state.history.push({ t: state.lastUsedAt, kind });
  if(state.history.length > 200) state.history = state.history.slice(-200);
  saveState();
  praise();
  toast(pick(TEXT.m1.praise));
  updateRewardUI();
}

// --- Toast ---
let toastTimer = null;
function toast(msg){
  let el = document.getElementById("toast");
  if(!el){
    el = document.createElement("div");
    el.id = "toast";
    Object.assign(el.style, {
      position:"fixed", left:"50%", bottom:"20px", transform:"translateX(-50%)",
      background:"rgba(43,42,38,.92)", color:"#fff",
      padding:"10px 12px", borderRadius:"14px",
      fontWeight:"900", fontSize:"13px",
      boxShadow:"0 10px 25px rgba(0,0,0,.20)", zIndex:"9999",
      maxWidth:"92vw", textAlign:"center"
    });
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.style.display = "block";
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=> el.style.display="none", 2000);
}

// --- 急救計時（用時間戳差值，切背景也準） ---
let rescueTimerId = null;
let rescueEndAt = null;
const TOTAL_MS = 30 * 1000;

function setTimerUI(msLeft, phase){
  const t = document.getElementById("timerText");
  const p = document.getElementById("phaseText");
  const sec = Math.ceil(msLeft/1000);
  const mm = String(Math.floor(sec/60)).padStart(2,"0");
  const ss = String(sec%60).padStart(2,"0");
  t.textContent = `${mm}:${ss}`;
  p.textContent = phase;
}

function stopRescue(){
  if(rescueTimerId) clearInterval(rescueTimerId);
  rescueTimerId = null;
  rescueEndAt = null;
  setTimerUI(TOTAL_MS, "準備");
}

function startRescue(){
  // 開始前先給一句內在提示
  document.getElementById("rescueLine").textContent = pick(TEXT.m1.inner);

  if(rescueTimerId) clearInterval(rescueTimerId);
  const startAt = Date.now();
  rescueEndAt = startAt + TOTAL_MS;

  rescueTimerId = setInterval(()=>{
    const now = Date.now();
    const left = Math.max(0, rescueEndAt - now);

    // phase：吸 4 秒 / 吐 6 秒循環
    const elapsed = now - startAt;
    const cycle = 10 * 1000;
    const pos = elapsed % cycle;
    const phase = pos < 4*1000 ? "吸氣（4）" : "吐氣（6）";

    setTimerUI(left, phase);

    if(left <= 0){
      stopRescue();
      document.getElementById("rescueLine").textContent = pick(TEXT.m1.praise);
      logDone("rescue");
    }
  }, 200);
}

// --- 每日練功 ---
function loadDailyQ(){
  document.getElementById("dailyQ").textContent = pick(TEXT.m1.dailyPractice);
}
function dailyPick(choice){
  // choice: done / almost / next  都給回饋（避免內疚）
  const msg = choice === "done"
    ? "今天有做到，太好了。"
    : choice === "almost"
      ? "差一點也算練到了。"
      : "想起來就練一下，剛剛這一步就很好。";
  toast(msg);
  praise(msg);
  logDone("daily");
  loadDailyQ();
}

// --- 錦囊輸出 ---
function pickInner(){
  const s = pick(TEXT.m1.inner);
  document.getElementById("innerOut").textContent = s;
  praise("先讓心裡穩定一點，後面才好說話。");
}
function pickOuter(){
  const s = pick(TEXT.m1.outer);
  document.getElementById("outerOut").textContent = s;
  praise("有一句說得出口的話，現場就能撐住。");
}

// --- 輕清空 ---
function softReset(){
  state.count = 0;
  saveState();
  toast("已輕清空回饋（內容保留）");
  updateRewardUI();
}

// --- 安裝提示 ---
let deferredPrompt = null;
function setupInstall(){
  const helpBox = document.getElementById("helpBox");
  const btnInstall = document.getElementById("btnInstall");

  window.addEventListener("beforeinstallprompt", (e)=>{
    e.preventDefault();
    deferredPrompt = e;
    btnInstall.disabled = false;
  });

  btnInstall.addEventListener("click", async ()=>{
    if(!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    btnInstall.disabled = true;
  });

  // expose toggle
  window.__toggleHelp = () => helpBox.classList.toggle("hidden");
}

// --- 事件委派（按鈕一定會動） ---
document.addEventListener("click", (e)=>{
  const btn = e.target.closest("[data-action]");
  if(!btn) return;

  const act = btn.dataset.action;

  if(act === "startRescue") return startRescue();
  if(act === "stopRescue") return stopRescue();
  if(act === "pickInner") return pickInner();
  if(act === "pickOuter") return pickOuter();
  if(act === "softReset") return softReset();
  if(act === "toggleHelp") return window.__toggleHelp?.();

  if(act === "logDone") return logDone(btn.dataset.kind || "manual");

  if(act === "dailyPick") return dailyPick(btn.dataset.choice || "next");
});

// init
(function init(){
  setupInstall();
  updateRewardUI();
  loadDailyQ();
  setTimerUI(TOTAL_MS, "準備");
})();
