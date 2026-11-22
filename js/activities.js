// "For you": the mood garden, time capsules, focus mode and quick quizzes.
// Everything is kept on the phone, inside Friend's profile.
import { LANG, T, label } from "./i18n.js";
import { A_WORDS } from "./activities-i18n.js";
import { avatarSVG, UNLOCKS } from "./avatar.js";
import { CHALLENGES, CH_WORDS } from "./challenges.js";
import { surpriseQuiz } from "./quizbank.js";
import { GAME_KEYS, gameTile, gameTitle, renderGame } from "./games.js";
import { X, EXTRA_KEYS, extraTile, extraTitle, renderExtra, gratitudeDone } from "./extras.js";
const CW = () => CH_WORDS[LANG.code] || CH_WORDS.en;
const isoDay = d => { const x = new Date(d); return x.getFullYear() + "-" + String(x.getMonth() + 1).padStart(2, "0") + "-" + String(x.getDate()).padStart(2, "0"); };
export const challengeDone = P => !!P?.challenges?.[isoDay(Date.now())];
// Give stars (Focus, quiz, daily challenge) and report a newly unlocked accessory.
function addStars(P, n) { P.focus ||= { stars: 0, sessions: 0 }; const before = P.focus.stars; P.focus.stars += n; return UNLOCKS.find(u => before < u.stars && P.focus.stars >= u.stars)?.acc; }

export const W = () => A_WORDS[LANG.code] || A_WORDS.en;
const el = (tag, cls, text) => { const x = document.createElement(tag); if (cls) x.className = cls; if (text != null) x.textContent = text; return x; };
const btn = (text, cls, fn) => { const b = el("button", cls, text); b.type = "button"; b.onclick = fn; return b; };
const dayStart = d => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const fmtDate = t => new Date(t).toLocaleDateString(LANG.speech, { day: "numeric", month: "long", year: "numeric" });

/* ---------- Capsules ---------- */
export function readyCapsules(P) {
  const now = Date.now();
  return (P?.capsules || []).filter(c => !c.opened && c.openAt <= now);
}

/* ---------- Main sheet ---------- */
// ctx: { P, save, brain, toast, openGarden, close, paintLook }
export function renderActivities(root, ctx, view = "home") {
  const w = W(); root.innerHTML = "";
  const head = el("div", "sheet-head");
  if (view !== "home") head.append(btn(w.back, "ghost", () => { stopFocus(); stopBreathe(); renderActivities(root, ctx, "home"); }));
  head.append(el("h2", "", view === "home" ? w.title : view === "capsule" ? w.capTitle : view === "focus" ? w.focTitle : view === "challenge" ? CW().title : view === "breathe" ? w.brTitle : gameTitle(view) || extraTitle(view) || w.quizTitle));
  head.append(btn(T.close, "ghost", () => { stopFocus(); stopBreathe(); ctx.close(); }));
  root.append(head);
  if (view === "home") home(root, ctx, w);
  else if (view === "capsule") capsule(root, ctx, w);
  else if (view === "focus") focus(root, ctx, w);
  else if (view === "quiz") quiz(root, ctx, w);
  else if (view === "challenge") challenge(root, ctx, w);
  else if (view === "breathe") breathe(root, ctx, w);
  else if (GAME_KEYS.includes(view)) renderGame(view, root, ctx, n => addStars(ctx.P, n));
  else renderExtra(view, root, ctx);
}

const WEEK = {
  fr: { title: "Ta semaine", plants: "plantes", challenges: "défis", focus: "min de focus", stars: "⭐ au total" },
  en: { title: "Your week", plants: "plants", challenges: "challenges", focus: "focus min", stars: "⭐ in total" },
  es: { title: "Tu semana", plants: "plantas", challenges: "retos", focus: "min de focus", stars: "⭐ en total" }
};
function weekStrip(P) {
  const k = WEEK[LANG.code] || WEEK.en;
  const days = []; const d = new Date(); const back = (d.getDay() + 6) % 7;
  for (let i = 0; i <= back; i++) { const x = new Date(); x.setDate(x.getDate() - i); days.push(isoDay(x)); }
  const plants = days.filter(x => P.garden?.[x]).length;
  const ch = days.filter(x => P.challenges?.[x]).length;
  const mins = days.reduce((a, x) => a + (P.focus?.days?.[x] || 0), 0);
  const box = el("section", "sec week"); box.append(el("h3", "", k.title));
  const g = el("div", "gstats");
  for (const [n, l] of [[plants, k.plants], [ch, k.challenges], [mins, k.focus], [P.focus?.stars || 0, k.stars]]) {
    const s = el("div", "gstat"); s.append(el("b", "", String(n)), el("span", "", l)); g.append(s);
  }
  box.append(g); return box;
}

function home(root, ctx, w) {
  const strip = weekStrip(ctx.P);
  const lr = el("div", "btnrow"); lr.append(btn(X().ltBtn, "ghost", () => renderActivities(root, ctx, "letter"))); strip.append(lr);
  root.append(strip);
  const grid = el("div", "tiles");
  const ready = readyCapsules(ctx.P).length;
  for (const key of ["garden", "challenge", "gratitude", "capsule", "focus", "quiz", "memory", "word", "breathe", "badges"]) {
    const [icon, name, sub] = key === "challenge" ? CW().tile : key === "breathe" ? w.brTile : GAME_KEYS.includes(key) ? gameTile(key) : EXTRA_KEYS.includes(key) ? extraTile(key) : w.tiles[key];
    const t = el("button", "tile"); t.type = "button";
    const ic = el("span", "tile-ic", icon);
    const tx = el("span", "tile-tx"); tx.append(el("b", "", name), el("small", "", sub));
    t.append(ic, tx);
    if (key === "capsule" && ready) t.append(el("span", "badge", String(ready)));
    if (key === "challenge" && !challengeDone(ctx.P)) t.append(el("span", "badge", "!"));
    if (key === "gratitude" && !gratitudeDone(ctx.P) && new Date().getHours() >= 17) t.append(el("span", "badge", "!"));
    t.onclick = () => key === "garden" ? ctx.openGarden() : renderActivities(root, ctx, key);
    grid.append(t);
  }
  root.append(grid);
}

/* ---------- Time capsule ---------- */
function capsule(root, ctx, w) {
  const P = ctx.P; P.capsules ||= [];
  root.append(el("p", "fine", w.capLead));
  const card = el("section", "sec");
  const ta = el("textarea", "gnote"); ta.id = "capText"; ta.rows = 5; ta.maxLength = 2000; ta.placeholder = w.capPh;
  card.append(ta, el("p", "sub", w.capWhen));
  let days = 30, custom = "";
  const chips = el("div", "chips");
  const paintChips = () => [...chips.children].forEach(c => c.setAttribute("aria-pressed", String(!custom && c.dataset.d === String(days))));
  for (const [d, l] of w.capWhens) { const c = btn(l, "chip", () => { days = +d; custom = ""; date.value = ""; paintChips(); }); c.dataset.d = d; chips.append(c); }
  const date = el("input", "input"); date.type = "date"; date.id = "capDate";
  const tomorrow = dayStart(Date.now() + 864e5); date.min = tomorrow.toISOString().slice(0, 10);
  date.onchange = () => { custom = date.value; paintChips(); };
  card.append(chips, el("p", "fine", w.capDate), date);
  const msg = el("p", "fine"); msg.setAttribute("aria-live", "polite");
  const seal = btn(w.capSeal, "primary", () => {
    const text = ta.value.trim(); if (!text) { ta.focus(); return; }
    const openAt = custom ? dayStart(custom + "T00:00").getTime() : dayStart(Date.now() + days * 864e5).getTime();
    P.capsules.unshift({ id: Date.now().toString(36), text, created: Date.now(), openAt, opened: false });
    ctx.save(); ta.value = "";
    msg.textContent = `${w.capSealed} ${fmtDate(openAt)}.`;
    paintList();
  });
  const row = el("div", "btnrow"); row.append(seal); card.append(row, msg);
  root.append(card);
  paintChips();

  const listSec = el("section", "sec"); listSec.append(el("h3", "", w.capList));
  const list = el("div", "caps"); listSec.append(list); root.append(listSec);
  function paintList() {
    list.innerHTML = "";
    if (!P.capsules.length) { list.append(el("p", "empty", w.capNone)); return; }
    for (const c of P.capsules) {
      const item = el("div", "cap" + (c.opened ? " open" : ""));
      const locked = c.openAt > Date.now();
      const top = el("div", "cap-top");
      top.append(el("span", "cap-ic", locked ? "🔒" : c.opened ? "💌" : "✨"));
      const info = el("div", "cap-info");
      info.append(el("b", "", fmtDate(c.openAt)));
      const days = Math.ceil((c.openAt - Date.now()) / 864e5);
      info.append(el("small", "", locked ? w.capLocked(w.inDays(days)) : c.opened ? w.capOpened : w.capFrom(fmtDate(c.created))));
      top.append(info);
      if (!locked && !c.opened) top.append(btn(w.capOpen, "primary small", () => { c.opened = true; ctx.save(); paintList(); }));
      const del = btn(w.capDelete, "ghost danger small", () => {
        if (del.dataset.sure) { P.capsules = P.capsules.filter(x => x !== c); ctx.save(); paintList(); return; }
        del.dataset.sure = "1"; del.textContent = w.capSure;
      });
      top.append(del);
      item.append(top);
      if (c.opened) { item.append(el("p", "fine", w.capFrom(fmtDate(c.created))), el("p", "cap-text", c.text)); }
      list.append(item);
    }
  }
  paintList();
}

/* ---------- Focus ---------- */
let F = null;   // the running session
function stopFocus() { rain(false); if (F) { clearInterval(F.timer); document.removeEventListener("visibilitychange", F.onVis); F = null; } }

// Soft rain made on the phone (filtered noise), no file to download.
let audioCtx = null, rainNode = null;
function rain(on) {
  try {
    if (!on) { if (rainNode) { rainNode.gain.gain.setTargetAtTime(0, audioCtx.currentTime, .3); const n = rainNode; setTimeout(() => { try { n.src.stop(); } catch {} }, 1200); rainNode = null; } return; }
    if (rainNode) return;
    audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
    audioCtx.resume?.();
    const len = audioCtx.sampleRate * 2, buf = audioCtx.createBuffer(1, len, audioCtx.sampleRate), d = buf.getChannelData(0);
    let last = 0; for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; last = (last + 0.04 * w) / 1.04; d[i] = last * 3.2 + w * 0.05; }
    const src = audioCtx.createBufferSource(); src.buffer = buf; src.loop = true;
    const lp = audioCtx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 1400;
    const gain = audioCtx.createGain(); gain.gain.value = 0; gain.gain.setTargetAtTime(0.35, audioCtx.currentTime, .8);
    src.connect(lp); lp.connect(gain); gain.connect(audioCtx.destination); src.start();
    rainNode = { src, gain };
  } catch (e) { console.warn("rain", e); }
}
function focus(root, ctx, w) {
  const P = ctx.P; P.focus ||= { stars: 0, sessions: 0 };
  root.append(el("p", "fine", w.focLead));
  const card = el("section", "sec");
  const map = el("div", "fmap");
  const path = el("div", "fpath"); const fill = el("div", "ffill"); path.append(fill);
  const walker = el("div", "avatar fwalker"); walker.innerHTML = avatarSVG(P.look.shape, P.look.acc);
  const flag = el("span", "fflag", "🏁");
  map.append(path, walker, flag);
  const clock = el("p", "fclock", "25:00");
  const status = el("p", "fine"); status.setAttribute("aria-live", "polite");
  card.append(map, clock, status);

  const todo = el("input", "input"); todo.id = "focusTodo"; todo.placeholder = w.focTodo; todo.maxLength = 80;
  card.append(todo, el("p", "sub", w.focLen));
  let minutes = 25;
  const chips = el("div", "chips");
  for (const m of [10, 25, 45]) { const c = btn(w.focMinutes(m), "chip", () => { if (F) return; minutes = m; paint(); }); c.dataset.m = m; chips.append(c); }
  card.append(chips);
  P.focus.rain ??= false;
  const rainRow = el("div", "setrow");
  const rl = el("label", "switch"); const ri = el("input"); ri.type = "checkbox"; ri.id = "focusRain"; ri.checked = P.focus.rain;
  ri.onchange = () => { P.focus.rain = ri.checked; ctx.save(); if (F) rain(ri.checked && !F.paused); };
  rl.append(ri, el("span")); rainRow.append(el("span", "", w.focSound), rl); card.append(rainRow);
  const row = el("div", "btnrow");
  const start = btn(w.focStart, "primary", () => begin());
  const pause = btn(w.focPause, "ghost", () => { if (!F) return; F.paused = !F.paused; pause.textContent = F.paused ? w.focResume : w.focPause; status.textContent = ""; rain(P.focus.rain && !F.paused); });
  const stop = btn(w.focStop, "ghost danger", () => { stopFocus(); paint(); status.textContent = ""; });
  row.append(start, pause, stop); card.append(row);
  root.append(card);

  const rewards = el("section", "sec"); root.append(rewards);
  function paintRewards(unlocked) {
    rewards.innerHTML = ""; rewards.append(el("h3", "", w.focStars(P.focus.stars)));
    if (unlocked) {
      const u = el("div", "unlock"); const a = el("div", "avatar lg"); a.innerHTML = avatarSVG(P.look.shape, unlocked);
      u.append(a, el("p", "", `${w.focUnlock} ${label(T.accs, unlocked)}`)); rewards.append(u);
    }
    const next = UNLOCKS.find(u => P.focus.stars < u.stars);
    rewards.append(el("p", "fine", next ? w.focNext(next.stars - P.focus.stars, label(T.accs, next.acc)) : w.focAll));
  }
  function paint() {
    const total = minutes * 60, left = F ? F.left : total;
    clock.textContent = `${String(Math.floor(left / 60)).padStart(2, "0")}:${String(left % 60).padStart(2, "0")}`;
    const pct = 1 - left / total;
    fill.style.width = (pct * 100) + "%"; walker.style.left = `calc(${pct * 100}% - ${pct * 44}px)`;
    walker.classList.toggle("walking", !!F && !F.paused && !F.away);
    [...chips.children].forEach(c => c.setAttribute("aria-pressed", String(+c.dataset.m === minutes)));
    start.hidden = !!F; pause.hidden = stop.hidden = !F;
  }
  function begin() {
    stopFocus();
    F = { left: minutes * 60, paused: false, away: false, todo: todo.value.trim() };
    F.onVis = () => { if (!F) return; F.away = document.hidden; if (!document.hidden && F.wasAway) status.textContent = ""; if (document.hidden) { F.wasAway = true; status.textContent = w.focWaiting; } paint(); };
    document.addEventListener("visibilitychange", F.onVis);
    rain(P.focus.rain);
    F.timer = setInterval(() => {
      if (!F || F.paused || F.away) return;
      F.left--;
      if (F.left <= 0) {
        const earned = Math.max(1, Math.round(minutes / 10));
        const before = P.focus.stars;
        P.focus.stars += earned; P.focus.sessions++;
        P.focus.totalMin = (P.focus.totalMin ?? Object.values(P.focus.days || {}).reduce((a, b) => a + b, 0)) + minutes;
        P.focus.days ||= {}; const dk = isoDay(Date.now()); P.focus.days[dk] = (P.focus.days[dk] || 0) + minutes;
        for (const k of Object.keys(P.focus.days)) if (Date.now() - new Date(k + "T12:00") > 60 * 864e5) delete P.focus.days[k];
        ctx.save();
        const unlocked = UNLOCKS.find(u => before < u.stars && P.focus.stars >= u.stars)?.acc;
        stopFocus(); paint();
        fill.style.width = "100%"; walker.style.left = "calc(100% - 44px)";
        status.textContent = w.focDone(earned);
        ctx.toast(w.focDone(earned));
        paintRewards(unlocked);
        return;
      }
      paint();
    }, 1000);
    paint();
  }
  paint(); paintRewards();
}

/* ---------- Quick quiz ---------- */
function quiz(root, ctx, w) {
  root.append(el("p", "fine", w.quizLead));
  const card = el("section", "sec"); root.append(card);
  let Q = null, i = 0, score = 0;
  showForm();
  function showForm() {
    card.innerHTML = "";
    const ta = el("textarea", "gnote"); ta.id = "quizTopic"; ta.rows = 3; ta.maxLength = 4000; ta.placeholder = w.quizPh;
    const msg = el("p", "fine"); msg.setAttribute("aria-live", "polite");
    const go = btn(w.quizGo, "primary", async () => {
      const topic = ta.value.trim(); if (!topic) { ta.focus(); return; }
      if (!ctx.brain.canAnswer()) { msg.textContent = X().quizOffline; return; }
      go.disabled = true; msg.textContent = w.quizMaking;
      try { Q = await makeQuiz(topic, ctx.brain); i = 0; score = 0; showQuestion(); }
      catch (e) { console.warn("quiz", e); msg.textContent = navigator.onLine ? w.quizFail : X().quizOffline; go.disabled = false; }
    });
    // A ready-made quiz that needs no AI and no internet.
    const surprise = btn(X().quizSurprise, "ghost", () => { Q = surpriseQuiz(LANG.code); i = 0; score = 0; showQuestion(); });
    surprise.id = "quizSurprise";
    const row = el("div", "btnrow"); row.append(go, surprise);
    card.append(ta, row, msg);
  }
  function showQuestion() {
    card.innerHTML = "";
    const q = Q[i];
    card.append(el("p", "sub", w.quizQ(i + 1, Q.length)), el("h3", "qtext", q.q));
    const opts = el("div", "choice");
    const feedback = el("p", "fine"); feedback.setAttribute("aria-live", "polite");
    const next = btn(i + 1 < Q.length ? w.quizNext : w.quizEnd, "primary", () => { i++; i < Q.length ? showQuestion() : showEnd(); });
    next.hidden = true;
    q.options.forEach((o, k) => {
      const b = btn(o, "opt", () => {
        [...opts.children].forEach((x, j) => { x.disabled = true; x.classList.toggle("right", j === q.answer); x.classList.toggle("wrong", j === k && k !== q.answer); });
        if (k === q.answer) score++;
        feedback.textContent = (k === q.answer ? w.quizGood : w.quizBad) + (q.why ? " " + q.why : "");
        next.hidden = false; next.focus();
      });
      opts.append(b);
    });
    const row = el("div", "btnrow"); row.append(next);
    card.append(opts, feedback, row);
  }
  function showEnd() {
    card.innerHTML = "";
    card.append(el("p", "qscore", w.quizScore(score, Q.length)), el("p", "", w.quizCheer(score)));
    const st = (ctx.P.stats ||= {}); st.quiz = (st.quiz || 0) + 1; if (score === Q.length) st.quizPerfect = (st.quizPerfect || 0) + 1; ctx.save();
    if (score >= Math.ceil(Q.length * 0.8)) {
      const unlocked = addStars(ctx.P, 1); ctx.save(); ctx.toast("+1 ⭐");
      if (unlocked) card.append(el("p", "", `${w.focUnlock} ${label(T.accs, unlocked)}`));
    }
    const row = el("div", "btnrow"); row.append(btn(w.quizAgain, "primary", showForm)); card.append(row);
  }
}

async function makeQuiz(topic, brain) {
  const lang = LANG.reply;
  const prompt = `Create a 5-question multiple-choice quiz in ${lang} for a teenager, about this topic or these notes:
"""${topic.slice(0, 3500)}"""
Rules: school-appropriate, facts must be correct, each question has exactly 4 short options and one correct answer, plus a one-sentence explanation.
Reply with ONLY a JSON array, no other text, like:
[{"q":"question?","options":["A","B","C","D"],"answer":0,"why":"short explanation"}]`;
  const out = await brain.chat([{ role: "user", content: prompt }], { maxTokens: 1200, temperature: 0.3, effort: "medium" });
  const m = (out || "").match(/\[[\s\S]*\]/);
  if (!m) throw new Error("no json");
  const arr = JSON.parse(m[0]);
  const qs = arr.filter(x => x && typeof x.q === "string" && Array.isArray(x.options) && x.options.length >= 2)
    .slice(0, 5)
    .map(x => ({ q: x.q.slice(0, 300), options: x.options.slice(0, 4).map(o => String(o).slice(0, 140)), answer: Math.min(Math.max(0, parseInt(x.answer, 10) || 0), Math.min(3, x.options.length - 1)), why: String(x.why || "").slice(0, 240) }));
  if (qs.length < 3) throw new Error("too few");
  return qs;
}

/* ---------- Daily challenge ---------- */
function challenge(root, ctx, w) {
  const P = ctx.P; P.challenges ||= {};
  const c = CW(), list = CHALLENGES[LANG.code] || CHALLENGES.en;
  const today = isoDay(Date.now());
  const n = Math.floor(new Date(today + "T12:00").getTime() / 864e5);
  const text = list[n % list.length];
  root.append(el("p", "fine", c.lead));
  const card = el("section", "sec challenge");
  card.append(el("p", "ch-text", text));
  const note = el("input", "input"); note.id = "chNote"; note.maxLength = 120; note.placeholder = c.note; note.value = P.challenges[today]?.note || "";
  const msg = el("p", "fine"); msg.setAttribute("aria-live", "polite");
  const row = el("div", "btnrow");
  const paint = () => {
    row.innerHTML = "";
    if (P.challenges[today]) { row.append(el("p", "state ready", c.doneAlready)); msg.textContent = c.tomorrow; }
    else row.append(btn(c.done, "primary", () => {
      P.challenges[today] = { text, note: note.value.trim().slice(0, 120) };
      const unlocked = addStars(P, 1); ctx.save(); ctx.toast(c.reward);
      if (unlocked) msg.textContent = `${w.focUnlock} ${label(T.accs, unlocked)}`;
      paint(); paintHist();
    }));
  };
  card.append(note, row, msg); root.append(card);
  // streak
  let streak = 0; const d = new Date(); if (!P.challenges[isoDay(d)]) d.setDate(d.getDate() - 1);
  while (P.challenges[isoDay(d)]) { streak++; d.setDate(d.getDate() - 1); }
  const hist = el("section", "sec"); root.append(hist);
  function paintHist() {
    hist.innerHTML = "";
    let s = 0; const x = new Date(); if (!P.challenges[isoDay(x)]) x.setDate(x.getDate() - 1);
    while (P.challenges[isoDay(x)]) { s++; x.setDate(x.getDate() - 1); }
    hist.append(el("h3", "", `${c.history} · ${c.streak(s)}`));
    const days = Object.keys(P.challenges).sort().reverse().slice(0, 10);
    if (!days.length) { hist.append(el("p", "empty", "—")); return; }
    const ul = el("ul");
    for (const k of days) { const e = P.challenges[k]; ul.append(el("li", "", `${new Date(k + "T12:00").toLocaleDateString(LANG.speech, { day: "numeric", month: "short" })} · ${e.text}${e.note ? ` — « ${e.note} »` : ""}`)); }
    hist.append(ul);
  }
  paint(); paintHist();
}

/* ---------- Breathing ---------- */
let BR = null;
function stopBreathe() { if (BR) { BR.forEach(clearTimeout); BR = null; } }
function breathe(root, ctx, w) {
  root.append(el("p", "fine", w.brLead));
  const card = el("section", "sec breathe");
  const circle = el("div", "bcircle"); const av = el("div", "avatar"); av.innerHTML = avatarSVG(ctx.P.look.shape, ctx.P.look.acc, false); circle.append(av);
  const phase = el("p", "bphase"); phase.setAttribute("aria-live", "polite");
  const row = el("div", "btnrow");
  card.append(circle, phase, row); root.append(card);
  const startBtn = btn(w.brStart, "primary", run); row.append(startBtn);
  function run() {
    stopBreathe(); BR = []; startBtn.hidden = true;
    const steps = []; // 4 s in, 4 s hold, 6 s out — about 1 minute
    for (let i = 0; i < 4; i++) steps.push(["in", w.brIn, 4000], ["hold", w.brHold, 4000], ["out", w.brOut, 6000]);
    let t = 0;
    for (const [cls, text, ms] of steps) { BR.push(setTimeout(() => { circle.className = "bcircle " + cls; phase.textContent = text; }, t)); t += ms; }
    BR.push(setTimeout(() => { const st = (ctx.P.stats ||= {}); st.breaths = (st.breaths || 0) + 1; ctx.save(); circle.className = "bcircle"; phase.textContent = w.brDone; startBtn.textContent = w.brAgain; startBtn.hidden = false; BR = null; }, t));
  }
}

export function openActivity(root, ctx, view) { renderActivities(root, ctx, view); }
