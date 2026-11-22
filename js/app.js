import { T, label, LANGS, LANG, setLang, isFR } from "./i18n.js";
import { avatarSVG, COLORS } from "./avatar.js";
import { isSevere, safeMemory } from "./safety.js";
import { brain, SIZE_GB, IS_MOBILE, FAST_ENOUGH, MAX_TOTAL_GB } from "./brain.js";
import { voice } from "./voice.js";
import { ears, EARS_MB } from "./ears.js";
import { heartReply, remember, recall, knownCount, forgetKnown } from "./offline.js";
import { gleanMemories, addMemories } from "./notes.js";
import { renderGarden, plantedToday } from "./garden.js";
import { renderActivities, readyCapsules, challengeDone, W } from "./activities.js";
import { UNLOCKS } from "./avatar.js";
import { searchQuery, lookup, searchNote } from "./search.js";
import { X, checkBadges, badgeToast } from "./extras.js";

const VERSION = "2.1.0";
const KEY = "friend.v1";
const $ = id => document.getElementById(id);
const el = (tag, cls, text) => { const x = document.createElement(tag); if (cls) x.className = cls; if (text != null) x.textContent = text; return x; };

/* ================= Profile (stays on this phone) ================= */
function fresh(prefs) {
  return {
    v: 1, prefs, look: { shape: "round", acc: "none", hue: "sun" },
    memories: [], archive: "", sessions: 0, since: Date.now(), tipShown: false,
    lang: LANG.code,
    brain: { mode: "auto", movedAuto: true, movedOnline: true, onlineAck: false, size: IS_MOBILE ? "small" : "medium", key: "", model: "claude-haiku-5-5", share: false, limit: 300, usage: { month: "", count: 0 }, consented: false },
    voice: { uri: "", rate: 1, auto: true, natural: true },
    pin: null
  };
}
function load() { try { return JSON.parse(localStorage.getItem(KEY)) || null; } catch { return null; } }
function save() { try { localStorage.setItem(KEY, JSON.stringify(P)); } catch {} }
function wipe() { try { localStorage.removeItem(KEY); } catch {} forgetKnown(); P = null; }
let P = load();
if (P?.lang) setLang(P.lang);
if (P && P.voice && P.voice.natural === undefined) P.voice.natural = true;
if (P && P.brain && !P.brain.movedOnline) { if (P.brain.mode === "local") P.brain.mode = "online"; P.brain.movedOnline = true; save(); }
// 1.8: "automatic" replaces "online" — same behaviour until the small AI is downloaded and fast enough.
if (P && P.brain && !P.brain.movedAuto) { if (P.brain.mode === "online") P.brain.mode = "auto"; if (P.brain.size === "medium" && IS_MOBILE) P.brain.size = "small"; P.brain.movedAuto = true; save(); }
const naturalId = () => (P?.voice?.naturalId && LANG.piper.includes(P.voice.naturalId)) ? P.voice.naturalId : LANG.piper[0];

/* ================= Look ================= */
// Friend's face reacts to the conversation: happy news, hard moments, thinking.
let expr = "smile", exprTimer = null;
const HAPPY = /\b(content|contente|heureux|heureuse|super|génial|genial|trop bien|réussi|reussi|gagné|gagne|merci|cool|yay|happy|great|awesome|won|passed|thanks|feliz|genial|gracias|guay)\b|😀|😄|😁|🥳|❤️|😊/i;
const HARD = /\b(triste|seul|seule|mal|peur|stress|stressé|pleure|pleurer|déprim|fatigué|nul|nulle|sad|lonely|alone|scared|afraid|cry|crying|tired|anxious|solo|sola|miedo|llorar|cansad)\w*/i;
function exprFor(text) { return isSevere(text) || HARD.test(text) ? "care" : HAPPY.test(text) ? "happy" : "smile"; }
function setExpr(e, holdMs = 0) {
  expr = e; paintLook();
  clearTimeout(exprTimer);
  if (holdMs) exprTimer = setTimeout(() => { expr = "smile"; paintLook(); }, holdMs);
}
function applyDisplay() {
  const d = P?.display || {};
  if (d.theme && d.theme !== "auto") document.documentElement.dataset.theme = d.theme; else delete document.documentElement.dataset.theme;
  if (d.text && d.text !== "normal") document.documentElement.dataset.text = d.text; else delete document.documentElement.dataset.text;
}
function paintLook() {
  applyDisplay();
  const look = P?.look || { shape: "round", acc: "none", hue: "sun" };
  document.body.dataset.hue = look.hue;
  const svg = avatarSVG(look.shape, look.acc, true, expr);
  $("avTop").innerHTML = svg;
  document.querySelectorAll("[data-avatar]").forEach(n => { n.innerHTML = svg; });
  const meta = document.querySelector('meta[name="theme-color"]'); if (meta) meta.content = COLORS[look.hue] || COLORS.sun;
}

function show(id) {
  for (const v of ["vOnb", "vPinAsk", "vPin", "vDirect", "vChat"]) $(v).hidden = v !== id;
  const main = id === "vDirect" || id === "vChat";
  $("top").hidden = !main; $("helpbar").hidden = !main;
  if (!main) $("gate").hidden = true;
}

let toastTimer;
// Lets people pass Friend on to a friend: the phone's share sheet, or a copied link.
// The address people share is wherever this copy of Friend is hosted.
const SHARE_URL = /^https?:/.test(location.protocol) ? new URL("./", location.href).href : "https://leonoutsa-ux.github.io/friend/";
async function shareFriend() {
  const data = { title: "Friend", text: T.shareText, url: SHARE_URL };
  if (navigator.share) { try { await navigator.share(data); return; } catch (e) { if (e?.name === "AbortError") return; } }
  try { await navigator.clipboard.writeText(T.shareText + " " + SHARE_URL); toast(T.shareCopied); }
  catch { toast(SHARE_URL); }
}
function toast(msg) {
  let t = document.querySelector(".toast");
  if (!t) { t = el("div", "toast"); t.setAttribute("role", "status"); document.body.append(t); }
  t.textContent = msg; t.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, 4200);
}

/* ================= Questionnaire ================= */
const STEPS = ["intro", "name", "style", "help", "topics", "len"];
let draft, step;
function startOnboarding() {
  stopDirect();
  draft = P ? JSON.parse(JSON.stringify(P.prefs)) : { name: "", style: "", help: "", topics: [], len: "" };
  step = 0; paintLook(); show("vOnb"); renderStep();
}
function opt(text, sub, pressed, onclick) {
  const b = el("button", "opt"); b.type = "button"; b.setAttribute("aria-pressed", String(pressed));
  const s = el("span", "", text); if (sub) s.append(el("small", "", sub));
  b.append(s, el("i", "tick")); b.onclick = onclick; return b;
}
function renderStep() {
  const o = $("vOnb"); o.innerHTML = "";
  const id = STEPS[step];
  if (id === "intro") {
    const w = el("div", "intro");
    const av = el("div", "avatar lg"); av.innerHTML = avatarSVG(P?.look?.shape, P?.look?.acc);
    const langs = el("div", "chips");
    for (const l of LANGS) {
      const b = el("button", "chip" + (l.code === LANG.code ? " on" : ""), l.name); b.type = "button";
      b.setAttribute("aria-pressed", String(l.code === LANG.code));
      b.onclick = () => { setLang(l.code); if (P) { P.lang = l.code; save(); } refreshStatic(); renderStep(); };
      langs.append(b);
    }
    w.append(av, langs, el("h2", "q", T.introTitle), el("p", "", T.intro), el("p", "fine", T.notPro));
    const nav = el("div", "nav"); const go = el("button", "primary", T.introGo); go.type = "button";
    go.onclick = () => { step++; renderStep(); };
    nav.append(el("span"), go); o.append(w, nav); return;
  }
  const bar = el("div", "steps");
  for (let i = 1; i < STEPS.length; i++) { const d = el("i"); if (i <= step) d.className = "on"; bar.append(d); }
  const q = el("h2", "q"); o.append(bar, q);
  let ok = () => true, optional = false;
  const body = el("div", "opts");
  const single = (key, list, title) => {
    q.textContent = title;
    for (const [v, l, s] of list) body.append(opt(l, s, draft[key] === v, () => { draft[key] = v; renderStep(); }));
    ok = () => !!draft[key];
  };
  if (id === "name") {
    q.textContent = T.qName; o.append(el("p", "hint", T.qNameHint));
    const inp = el("input", "field"); inp.id = "nameField"; inp.maxLength = 30; inp.placeholder = T.namePh; inp.autocomplete = "off"; inp.value = draft.name;
    inp.oninput = () => { draft.name = inp.value.trim(); paint(); };
    inp.onkeydown = e => { if (e.key === "Enter") { e.preventDefault(); step++; renderStep(); } };
    body.append(inp); optional = true; setTimeout(() => inp.focus(), 60);
  } else if (id === "style") single("style", T.styles, T.qStyle);
  else if (id === "help") single("help", T.helps, T.qHelp);
  else if (id === "len") single("len", T.lens, T.qLen);
  else if (id === "topics") {
    q.textContent = T.qTopics; o.append(el("p", "hint", T.qTopicsHint));
    body.style.gridTemplateColumns = "repeat(auto-fill, minmax(140px, 1fr))";
    for (const t of T.topics) {
      const on = draft.topics.includes(t);
      body.append(opt(t, "", on, () => { draft.topics = on ? draft.topics.filter(x => x !== t) : [...draft.topics, t]; renderStep(); }));
    }
    optional = true;
  }
  o.append(body);
  const nav = el("div", "nav");
  const back = el("button", "link", T.back); back.type = "button"; back.onclick = () => { step--; renderStep(); };
  const last = step === STEPS.length - 1;
  const nx = el("button", "primary"); nx.type = "button";
  function paint() { nx.textContent = last ? T.done : optional && (id === "name" ? !draft.name : !draft.topics.length) ? T.skip : T.next; }
  paint(); nx.disabled = !ok();
  nx.onclick = () => { if (last) finishOnboarding(); else { step++; renderStep(); } };
  nav.append(back, nx); o.append(nav);
}
function finishOnboarding() {
  const first = !P;
  if (first) P = fresh(draft); else P.prefs = draft;
  P.lang = LANG.code;
  save();
  if (first) { paintLook(); show("vPinAsk"); }
  else enterMain();
}

/* ================= Code (PIN) ================= */
async function hashPin(pin, salt) {
  const data = new TextEncoder().encode(salt + ":" + pin);
  if (crypto.subtle) {
    const buf = await crypto.subtle.digest("SHA-256", data);
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
  }
  let h = 2166136261; for (const b of data) { h ^= b; h = Math.imul(h, 16777619); } return (h >>> 0).toString(16);
}
function newSalt() { const a = new Uint8Array(12); crypto.getRandomValues(a); return [...a].map(b => b.toString(16).padStart(2, "0")).join(""); }

// mode: "unlock" | "set"; done(): called on success; cancel(): optional
function pinFlow(mode, done, cancel) {
  show("vPin"); paintLook();
  let entry = "", first = null;
  const title = $("pinTitle"), msg = $("pinMsg"), dots = $("pinDots"), extra = $("pinExtra");
  title.textContent = mode === "unlock" ? T.pinEnter : T.pinNew; msg.textContent = "";
  const paintDots = () => [...dots.children].forEach((d, i) => d.classList.toggle("on", i < entry.length));
  const fail = text => { msg.textContent = text; dots.classList.remove("shake"); void dots.offsetWidth; dots.classList.add("shake"); entry = ""; paintDots(); };
  async function full() {
    if (mode === "unlock") {
      if ((await hashPin(entry, P.pin.salt)) === P.pin.hash) { entry = ""; done(); } else fail(T.pinWrong);
    } else if (first === null) { first = entry; entry = ""; paintDots(); title.textContent = T.pinConfirm; msg.textContent = ""; }
    else if (first === entry) { const salt = newSalt(); P.pin = { salt, hash: await hashPin(entry, salt) }; save(); done(); }
    else { first = null; title.textContent = T.pinNew; fail(T.pinMismatch); }
  }
  const pad = $("pad"); pad.innerHTML = "";
  for (const k of ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"]) {
    const b = el("button", "key" + (k ? "" : " blank"), k); b.type = "button";
    if (k === "⌫") b.setAttribute("aria-label", T.del);
    b.onclick = () => {
      if (!k) return;
      if (k === "⌫") { entry = entry.slice(0, -1); paintDots(); return; }
      if (entry.length < 4) { entry += k; paintDots(); if (entry.length === 4) setTimeout(full, 120); }
    };
    pad.append(b);
  }
  extra.innerHTML = "";
  if (mode === "unlock") {
    const forgot = el("button", "link", T.pinForgot); forgot.type = "button";
    forgot.onclick = () => {
      extra.innerHTML = "";
      const p = el("p", "", T.pinForgotText);
      const w = el("button", "ghost danger", T.pinWipe); w.type = "button";
      w.onclick = () => { wipe(); startOnboarding(); };
      const c = el("button", "link", T.cancel); c.type = "button"; c.onclick = () => pinFlow(mode, done, cancel);
      const r = el("div", "btnrow"); r.style.justifyContent = "center"; r.append(w, c);
      extra.append(p, r);
    };
    extra.append(forgot);
  } else if (cancel) {
    const c = el("button", "link", T.cancel); c.type = "button"; c.onclick = cancel; extra.append(c);
  }
  paintDots();
}
window.addEventListener("keydown", e => {
  if ($("vPin").hidden) return;
  const k = /^[0-9]$/.test(e.key) ? e.key : e.key === "Backspace" ? "⌫" : null;
  if (k) [...$("pad").children].find(b => b.textContent === k)?.click();
});

/* ================= Main ================= */
let mode = "chat", turns = [], userCount = 0, ctl = null, busy = false;

function enterMain(first = false) {
  paintLook();
  P.sessions = (P.sessions || 0) + 1; save();
  $("bond").textContent = T.bond(P.sessions);
  $("setBtn").textContent = T.settings;
  $("helpToggle").textContent = T.helpToggle;
  paintGardenBtn();
  turns = []; userCount = 0;
  brain.configure({ mode: P.brain.mode, key: P.brain.key, model: P.brain.model, size: P.brain.size });
  resetChatLog(first || P.sessions <= 1);
  setMode(P.voice.auto && voice.canListen ? "direct" : "chat");
  if (!P.tipShown) { P.tipShown = true; save(); setTimeout(() => toast(T.lookTip), 1500); }
  prepareBrain();
  prepareEars();
  if ((P.brain.mode === "online" || P.brain.mode === "auto") && !P.brain.onlineAck) showOnlineNotice();
  else if (!offlineInvite()) morningGarden();
  if (readyCapsules(P).length) setTimeout(() => toast(W().capReady), 2500);
  setTimeout(announceBadges, 5000);
}

function setMode(m) {
  mode = m;
  if (m === "direct") { show("vDirect"); resetDirect(); }
  else { stopDirect(); show("vChat"); syncChatFromTurns(); }
  $("modeBtn").textContent = m === "direct" ? T.toChat : T.toDirect;
  $("modeBtn").hidden = !voice.canListen && m === "chat";
  updateGate();
}
$("modeBtn").onclick = () => setMode(mode === "direct" ? "chat" : "direct");
$("setBtn").onclick = () => openSettings();
$("helpToggle").onclick = () => openHelp(false);

/* ---------- Ready without internet ---------- */
const gbText = gb => isFR() || LANG.code === "es" ? String(gb).replace(".", ",") + (isFR() ? " Go" : " GB") : gb + " GB";
// Private hearing wakes up by itself when it was chosen, or when it is the only way to listen here.
async function prepareEars() {
  voice.privateEars = !!P.voice.ears;
  if (!ears.supported || ears.state !== "idle") return;
  if ((P.voice.ears || !voice.hasSystem || !navigator.onLine) && await ears.isStored()) ears.load();
}
window.addEventListener("offline", () => { prepareEars(); });
// After a few visits, Friend offers once to become independent from the internet.
function offlineInvite() {
  if (P.brain.mode !== "auto" || P.brain.offlineAsked || P.brain.consented || (P.sessions || 0) < 3 || !navigator.onLine) return false;
  P.brain.offlineAsked = true; save();
  brain.supported().then(async ok => {
    if (!ok || await brain.isCached(P.brain.size) || !$("sheetSet").hidden || !$("sheetHelp").hidden || !$("sheetGarden").hidden) { morningGarden(); return; }
    openNotice(X().inviteT, X().invite(gbText(SIZE_GB[P.brain.size] || 0.4)), X().inviteYes,
      () => { P.brain.consented = true; save(); brain.load(P.brain.size); toast(X().inviteGo); },
      { label: X().inviteNo, fn: () => {}, note: X().inviteNote });
  });
  return true;
}

/* ---------- Brain gate ---------- */
async function prepareBrain() {
  if (brain.usesClaude()) { updateGate(); return; }
  if (brain.usesOnline()) {
    // Automatic: wake the small AI in the background only if it was already downloaded or asked for.
    if (P.brain.mode === "auto" && (await brain.supported()) && (P.brain.consented || await brain.isCached(P.brain.size))) brain.load(P.brain.size);
    updateGate(); return;
  }
  if (!(await brain.supported())) { brain.state = "nogpu"; updateGate(); return; }
  if (P.brain.consented || await brain.isCached(P.brain.size)) brain.load(P.brain.size);
  updateGate();
}
brain.on(() => updateGate());
function updateGate() {
  const g = $("gate");
  if ($("vDirect").hidden && $("vChat").hidden) { g.hidden = true; return; }
  if (brain.canAnswer()) { g.hidden = true; return; }
  g.hidden = false; g.innerHTML = "";
  const btn = (text, fn, cls = "primary") => { const b = el("button", cls, text); b.type = "button"; b.onclick = fn; return b; };
  const row = el("div", "row");
  if (brain.state === "loading") {
    g.append(el("h2", "", brain.firstDownload ? T.brainLoadingFirst : T.brainLoading));
    const bar = el("div", "bar"), i = el("i"); i.style.width = Math.round((brain.progress || 0) * 100) + "%"; bar.append(i);
    g.append(bar, el("p", "", Math.round((brain.progress || 0) * 100) + " %"));
  } else if (brain.state === "nogpu") {
    g.append(el("p", "", T.brainNoGpu)); row.append(btn(T.openSettings, () => openSettings("brain"))); g.append(row);
  } else if (brain.state === "nospace") {
    g.append(el("p", "", X().noSpace)); row.append(btn(T.openSettings, () => openSettings("offline"))); g.append(row);
  } else if (brain.state === "error") {
    g.append(el("p", "", T.brainError)); row.append(btn(T.brainRetry, () => brain.load(P.brain.size))); g.append(row);
  } else {
    g.append(el("h2", "", T.brainNeedTitle), el("p", "", T.brainNeedText(gbText(SIZE_GB[P.brain.size] || 1.2))));
    row.append(btn(T.brainGo, () => { P.brain.consented = true; save(); brain.load(P.brain.size); }));
    g.append(row);
  }
}

/* ---------- The prompt ---------- */
const STYLE_FR = { soft: "doux, calme et posé", pal: "comme un pote : simple, détendu, familier", fun: "avec un humour léger pour alléger les choses, jamais sur ce qui fait mal", straight: "direct et franc, sans détour, mais toujours gentil" };
const STYLE_EN = { soft: "soft, calm and gentle", pal: "like a buddy: simple, relaxed, casual", fun: "with light humor to lighten things up, never about what hurts", straight: "direct and honest, no beating around the bush, but always kind" };
const HELP_FR = { listen: "qu'on l'écoute : écoute surtout, donne peu de conseils", advice: "des idées et des conseils concrets, après l'avoir écoutée", distract: "se changer les idées : propose parfois de parler d'autre chose", mix: "un peu de tout, selon le moment" };
const HELP_EN = { listen: "being listened to: mostly listen, give little advice", advice: "concrete ideas and advice, after listening", distract: "taking their mind off things: sometimes offer to talk about something else", mix: "a bit of everything, depending on the moment" };

// Short instructions for the small AI on the phone: small models follow a few clear rules
// better than a long list, and a short text is read much faster.
// The small AI can only read a few memories: the ones closest to what was just said come first.
const wordsOf = t => new Set(String(t || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").match(/[a-z0-9]{4,}/g) || []);
function closestMemories(text, max = 5) {
  const list = P.memories || [];
  if (list.length <= max) return list;
  const said = wordsOf(text);
  return list.map((m, i) => { let hit = 0; for (const w of wordsOf(m)) if (said.has(w)) hit++; return { m, i, hit }; })
    .sort((a, b) => b.hit - a.hit || b.i - a.i).slice(0, max).sort((a, b) => a.i - b.i).map(x => x.m);
}
function localPrompt({ voiceMode, severe, text }) {
  const p = P.prefs, mem = closestMemories(text).join("; ");
  const name = p.name ? (isFR() ? `Elle s'appelle ${p.name}. ` : `Their name is ${p.name}. `) : "";
  if (isFR()) return `Tu es Friend, un ami gentil qui écoute. Tu tutoies. ${name}Réponds en français, en ${voiceMode ? "1 ou 2" : p.len === "long" ? "3 à 5" : "1 à 3"} phrases simples.
Écoute d'abord, montre que tu comprends, puis pose une question douce. Ne juge pas, ne fais pas la morale.
${mem ? "Tu te souviens : " + mem + "." : ""}
${severe ? `C'est très grave : dis-lui avec douceur qu'elle n'est pas seule et d'appeler ${T.crisisText}.` : "Ne parle pas de sujets tristes si la personne ne les aborde pas."}`.trim();
  return `You are Friend, a kind friend who listens. ${name}Reply in ${T.aiReplyLang}, in ${voiceMode ? "1 or 2" : p.len === "long" ? "3 to 5" : "1 to 3"} simple sentences.
Listen first, show you understand, then ask a gentle question. Don't judge or lecture.
${mem ? "You remember: " + mem + "." : ""}
${severe ? `This is very serious: gently tell them they are not alone and to reach out to ${T.crisisText}.` : "Don't bring up sad topics unless they do."}`.trim();
}

function systemPrompt({ voiceMode, severe, personal }) {
  const p = P.prefs, long = p.len === "long";
  const mem = (P.memories || []).map(m => "- " + m).join("\n");
  if (isFR()) return [
    "Tu es Friend, un ami confident, chaleureux et bienveillant, dans une appli sur le téléphone de la personne. Tu la tutoies et tu réponds en français.",
    personal ? [
      "La personne :",
      p.name ? `- Prénom : ${p.name}` : "- Elle n'a pas donné de prénom : n'en invente pas.",
      `- Elle veut que tu lui parles ${STYLE_FR[p.style] || STYLE_FR.pal}.`,
      `- Quand ça va mal, ce qui l'aide : ${HELP_FR[p.help] || HELP_FR.mix}.`,
      p.topics.length ? `- Sujets dont elle pourrait parler : ${p.topics.join(", ")}.` : "",
      mem ? "Ce dont tu te souviens (utilise-le naturellement, sans le réciter) :\n" + mem : "",
      P.archive ? "Résumé plus ancien : " + P.archive : ""
    ].filter(Boolean).join("\n") : "Parle de façon simple, détendue et gentille.",
    "Comment tu parles :",
    "- Écoute d'abord : reformule ce qu'elle ressent et valide-le avant tout le reste.",
    "- Pose une question douce et ouverte pour mieux comprendre.",
    "- Ne fais pas la morale. Ne dis pas « parles-en à tes parents ou à un adulte » par réflexe.",
    "- Ne juge jamais, ne minimise jamais, ne pose jamais de diagnostic.",
    long ? "- Réponses de 2 à 6 phrases." : "- Réponses courtes : 1 à 3 phrases, comme un texto.",
    "- Si on te le demande, dis honnêtement que tu es une IA.",
    "Sujets sensibles : ne lance JAMAIS toi-même un sujet sensible (famille, amour, deuil, harcèlement, apparence, santé, argent, ou quelque chose de douloureux déjà confié). Si la personne en parle, suis-la naturellement et sans malaise, aussi longtemps qu'elle veut.",
    severe
      ? `ATTENTION : la personne vient de dire quelque chose de très grave. Reste très chaleureux, prends-le au sérieux, dis-lui qu'elle n'est pas seule, et encourage-la doucement à contacter maintenant ${T.crisisText}. Puis continue de l'écouter.`
      : "Ne donne pas de numéros d'aide, sauf si la personne parle de danger, de suicide, de se faire du mal ou d'abus.",
    voiceMode ? "Tu parles à voix haute : phrases simples et naturelles, pas d'émojis, pas de listes, pas de symboles." : "Pas de listes ni de titres. Un émoji au maximum, rarement.",
    "Ne donne jamais d'information qui pourrait aider quelqu'un à se faire du mal ou à faire du mal."
  ].filter(Boolean).join("\n");
  return [
    `You are Friend, a warm, caring confidant inside an app on the person's phone. Always reply in ${T.aiReplyLang}, unless they clearly switch to another language.`,
    personal ? [
      "About them:",
      p.name ? `- Name: ${p.name}` : "- They gave no name: don't make one up.",
      `- They want you to talk ${STYLE_EN[p.style] || STYLE_EN.pal}.`,
      `- What helps them when things are hard: ${HELP_EN[p.help] || HELP_EN.mix}.`,
      p.topics.length ? `- Topics they may bring up: ${p.topics.join(", ")}.` : "",
      mem ? "What you remember (use it naturally, don't recite it):\n" + mem : "",
      P.archive ? "Older summary: " + P.archive : ""
    ].filter(Boolean).join("\n") : "Talk in a simple, relaxed, kind way.",
    "How you talk:",
    "- Listen first: reflect what they feel and validate it before anything else.",
    "- Ask a gentle, open question to understand better.",
    "- Don't lecture. Don't reflexively say \"talk to your parents or an adult\".",
    "- Never judge, never minimize, never diagnose.",
    long ? "- Replies of 2 to 6 sentences." : "- Short replies: 1 to 3 sentences, like a text.",
    "- If asked, be honest that you're an AI.",
    "Sensitive topics: NEVER be the one to bring up a sensitive topic (family, love, grief, bullying, looks, health, money, or something painful they shared before). If they bring it up, follow them naturally, without awkwardness, as long as they want.",
    severe
      ? `IMPORTANT: they just said something very serious. Stay very warm, take it seriously, tell them they're not alone, and gently encourage them to reach out now: ${T.crisisText}. Then keep listening.`
      : "Don't give help-line numbers unless they talk about danger, suicide, self-harm or abuse.",
    voiceMode ? "You are speaking out loud: simple, natural sentences, no emojis, no lists, no symbols." : "No lists or headings. At most one emoji, rarely.",
    "Never give information that could help someone hurt themselves or others."
  ].filter(Boolean).join("\n");
}

/* ---------- One exchange ---------- */
function monthKey() { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"); }
function claudeAllowed() {
  if (!brain.usesClaude()) return false;
  const u = P.brain.usage; if (u.month !== monthKey()) { u.month = monthKey(); u.count = 0; }
  return u.count < (P.brain.limit || 300);
}

async function respond(text, { onText, voiceMode, onStatus }) {
  const reaction = exprFor(text);
  setExpr("think");
  try { return await respondInner(text, { onText, voiceMode, onStatus }); }
  finally { setExpr(reaction, reaction === "smile" ? 0 : 20000); }
}
// Online search is on by default, except when the person chose the fully private AI.
const searchOn = () => P.search ?? (P.brain.mode !== "local");
async function respondInner(text, { onText, voiceMode, onStatus }) {
  clearTimeout(learnTimer);
  const severe = isSevere(text);
  if (severe) openHelp(true);
  let useClaude = brain.usesClaude();
  if (useClaude && !claudeAllowed()) {
    useClaude = false; toast(T.quota);
  }
  if (!useClaude && !brain.canAnswer()) { updateGate(); return { error: T.brainNeedTitle }; }
  turns.push({ role: "user", content: text }); userCount++;
  const personal = !useClaude || P.brain.share;
  const keep = useClaude ? 30 : 12;
  let recent = turns.slice(-keep); while (recent.length && recent[0].role !== "user") recent = recent.slice(1);
  ctl = new AbortController();
  // A general-knowledge question: look it up first, then answer with what was found.
  let found = null;
  const query = !severe && searchOn() ? searchQuery(text) : null;
  if (query && navigator.onLine) { onStatus?.(X().searching); found = await lookup(query, ctl.signal); if (found) remember(query, found); }
  // Without internet (or when the search fails), the notebook of earlier searches still answers.
  if (query && !found) found = recall(query);
  const fromMemory = query && !found && !navigator.onLine;
  const note = found ? "\n\n" + searchNote(found, isFR())
    : fromMemory ? "\n\n" + (isFR() ? "Il n'y a pas d'internet : réponds avec ce que tu sais, simplement, et dis-le honnêtement si tu n'es pas sûr." : "There is no internet: answer with what you know, simply, and say so honestly if you are not sure.") : "";
  const messages = [{ role: "system", content: systemPrompt({ voiceMode, severe, personal }) + note }, ...recent];
  try {
    const reply = await brain.chat(messages, {
      onText, signal: ctl.signal, localOnly: P.brain.mode === "local", localSystem: localPrompt({ voiceMode, severe, text }) + note,
      onStatus: st => onStatus?.(st === "waking" ? X().waking : st),
      maxTokens: (voiceMode ? 170 : P.prefs.len === "long" ? 380 : 220) + (found ? 120 : 0)
    });
    if (useClaude) { P.brain.usage.count++; save(); }
    const final = (reply || "").trim();
    if (!final) { turns.pop(); return { error: T.thinkingFail }; }
    turns.push({ role: "assistant", content: final });
    if (userCount % 4 === 0) learnDue = true;
    scheduleLearn();
    return { text: final, source: found ? { title: found.title, url: found.url, saved: !!found.saved } : null };
  } catch (e) {
    if (e?.name === "AbortError") { turns.pop(); return { aborted: true }; }
    if (e?.code === "key") { turns.pop(); return { error: T.keyBad }; }
    if (e?.code === "slow") { turns.pop(); return { error: T.tooSlow }; }
    if (e?.code === "notready" && P.brain.mode === "local") { turns.pop(); updateGate(); return { error: T.brainNeedTitle }; }
    // No internet, no AI awake, or the free service is down: Friend still answers, with its
    // backup sentences, and says so honestly.
    if (e?.code !== "busy" && e?.code !== "notready" && navigator.onLine) console.error(e);
    const simple = heartReply(text, { name: P.prefs.name, n: userCount, severe, crisis: T.crisisText });
    turns.push({ role: "assistant", content: simple });
    onText?.(simple);
    // With no AI to write memories, Friend still notes the simple things it is told.
    const learned = !severe && addMemories(P.memories ||= [], gleanMemories(text), MAX_MEM) > 0;
    if (learned) { save(); if (mode !== "chat") toast(T.learned); }
    return { text: simple, simple: true, learned, why: navigator.onLine ? "busy" : "offline" };
  } finally { ctl = null; }
}

/* ---------- Friend grows: memories + compression ---------- */
// The free online AI answers one request every 15 seconds or so. Memories are therefore written
// only once the person has paused, so that learning never slows down their next message.
let learnDue = false, learnTimer = null;
function scheduleLearn() {
  clearTimeout(learnTimer);
  if (!learnDue) return;
  learnTimer = setTimeout(() => { if (busy || ctl) { scheduleLearn(); return; } learnDue = false; learn(); }, brain.usesOnline() && !brain.prefersLocal() ? 45000 : 4000);
}
let learning = false;
const MAX_MEM = 10, FOLD = 4, MAX_ARCHIVE = 600;
function parseLines(t) {
  return (t || "").split("\n").map(l => l.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").trim())
    .filter(l => l && l.length < 140 && !/^(voici|here)/i.test(l) && safeMemory(l));
}
function learnBrain() {
  // Memories are written by the phone's AI. Claude only does it if the person chose to share their context.
  if (brain.usesClaude() && P.brain.share && claudeAllowed()) return { localOnly: false, claude: true };
  if (P.brain.mode === "online" || P.brain.mode === "auto") return { localOnly: false, claude: false };
  if (brain.state === "ready" || window.__friendMock) return { localOnly: true, claude: false };
  return null;
}
async function learn() {
  const how = learnBrain();
  if (learning || !how || turns.length < 2) return;
  learning = true;
  try {
    if ((P.memories || []).length >= MAX_MEM) await compress(how);
    const convo = turns.slice(-12).map(t => (t.role === "user" ? (isFR() ? "PERSONNE : " : "PERSON: ") : "FRIEND: ") + t.content).join("\n");
    const cur = (P.memories || []).map(m => "- " + m).join("\n") || (isFR() ? "(aucun)" : "(none)");
    const prompt = isFR()
      ? `Souvenirs actuels de Friend sur la personne :\n${cur}\n\nConversation récente :\n${convo}\n\nÉcris la liste mise à jour des souvenirs utiles pour être un meilleur ami : passions, prénoms des proches, ce qui la réconforte, ses projets, ce qu'elle vit en général. Maximum ${MAX_MEM} lignes. Chaque ligne commence par "- ", fait moins de 12 mots, et parle de la personne à la 3e personne (exemple : "- Aime dessiner des mangas"). Garde les anciens souvenirs encore utiles. N'écris JAMAIS rien sur : suicide, se faire du mal, abus, violence, santé, drogue, sexualité, adresses, numéros, mots de passe, ou ce qu'elle a demandé de garder secret. Écris seulement la liste.`
      : `Friend's current memories about the person:\n${cur}\n\nRecent conversation:\n${convo}\n\nWrite the updated list of memories that help be a better friend: interests, names of people close to them, what comforts them, their plans, what they're going through in general. At most ${MAX_MEM} lines. Each line starts with "- ", is under 12 words, and talks about the person in the third person, written in ${T.aiReplyLang} (example: "- Loves drawing manga"). Keep older memories that are still useful. NEVER write anything about: suicide, self-harm, abuse, violence, health, drugs, sexuality, addresses, numbers, passwords, or anything they asked to keep secret. Write only the list.`;
    const out = await brain.chat([{ role: "user", content: prompt }], { localOnly: how.localOnly, maxTokens: 260, temperature: 0.2 });
    if (how.claude) { P.brain.usage.count++; }
    const list = parseLines(out).slice(0, MAX_MEM);
    if (list.length) {
      const before = JSON.stringify(P.memories);
      P.memories = list; save();
      if (JSON.stringify(list) !== before) { if (mode === "chat") note(T.learned, "learned"); else toast(T.learned); }
    }
  } catch (e) { console.warn("learn", e); } finally { learning = false; }
}
async function compress(how) {
  const old = P.memories.slice(0, FOLD);
  const prompt = isFR()
    ? `Résume en 2 phrases courtes, à la 3e personne, ces souvenirs sur une personne et l'ancien résumé. Garde seulement ce qui aide à être un bon ami.\nAncien résumé : ${P.archive || "(aucun)"}\nSouvenirs :\n${old.map(m => "- " + m).join("\n")}\nÉcris seulement le résumé.`
    : `Summarize in 2 short sentences, in the third person, these memories about a person and the older summary. Keep only what helps be a good friend.\nOlder summary: ${P.archive || "(none)"}\nMemories:\n${old.map(m => "- " + m).join("\n")}\nWrite only the summary.`;
  const out = await brain.chat([{ role: "user", content: prompt }], { localOnly: how.localOnly, maxTokens: 140, temperature: 0.2 });
  const sentences = (out || "").replace(/\s+/g, " ").split(/(?<=[.!?])\s+/).filter(s => safeMemory(s));
  let summary = sentences.join(" ").trim();
  if (summary.length > MAX_ARCHIVE) summary = summary.slice(summary.length - MAX_ARCHIVE).replace(/^\S*\s/, "");
  if (summary) { P.archive = summary; P.memories = P.memories.slice(FOLD); save(); }
}

/* ================= Chat (typing) ================= */
const log = $("log"), box = $("box"), send = $("send");
box.placeholder = T.placeholder;
function bubble(cls, text) { const d = el("div", "msg " + cls, text); log.append(d); log.scrollTop = log.scrollHeight; return d; }
// A small button under Friend's answer reads it out loud (and stops when tapped again).
let reading = null;
function stopReading() { if (reading) { reading.spk.cancel(); voice.stopSpeaking(); reading.btn.classList.remove("on"); reading.btn.setAttribute("aria-pressed", "false"); reading = null; } }
function addReadAloud(out, text) {
  if (!voice.canSpeak || !text) return;
  const b = el("button", "say", "🔊"); b.type = "button"; b.title = X().readAloud; b.setAttribute("aria-label", X().readAloud); b.setAttribute("aria-pressed", "false");
  b.onclick = () => {
    const mine = reading?.btn === b; stopReading(); if (mine) return;
    voice.warmUp(); wakeVoice();
    const spk = voice.speaker({ lang: T.lang, uri: P.voice.uri, rate: P.voice.rate, natural: P.voice.natural, onDone: () => { if (reading?.btn === b) { b.classList.remove("on"); b.setAttribute("aria-pressed", "false"); reading = null; } } });
    reading = { btn: b, spk }; b.classList.add("on"); b.setAttribute("aria-pressed", "true");
    spk.finish(text);
  };
  out.after(b); log.scrollTop = log.scrollHeight;
}
function note(text, cls = "note") { const d = el("div", cls, text); log.append(d); log.scrollTop = log.scrollHeight; return d; }
function resetChatLog(first) {
  log.innerHTML = "";
  bubble("ami welcome", (first ? T.welcome : T.welcomeBack)(P.prefs.name));
  if (!first) {
    const q = el("div", "quick");
    for (const [view, text] of T.quick) { const b = el("button", "chip", text); b.type = "button"; b.onclick = () => openActivities(view); q.append(b); }
    log.append(q);
  }
  if (first || !P.memories?.length) {
    const chips = el("div", "chips"); chips.id = "chips";
    for (const c of T.chips) { const b = el("button", "chip", c); b.type = "button"; b.onclick = () => talk(c); chips.append(b); }
    log.append(chips);
  }
}
function syncChatFromTurns() {
  // Show in the typed chat what was said in live mode.
  const shown = log.querySelectorAll(".msg.me, .msg.ami:not(.welcome)").length;
  for (const t of turns.slice(shown)) bubble(t.role === "user" ? "me" : "ami", t.content);
}
async function talk(text) {
  text = text.trim(); if (!text || busy) return;
  stopReading();
  busy = true; send.disabled = true; $("chips")?.remove();
  bubble("me", text);
  const out = bubble("ami", ""); out.innerHTML = '<span class="typing"><i></i><i></i><i></i></span>';
  const status = t => { out.innerHTML = '<span class="typing"><i></i><i></i><i></i></span> '; out.append(el("em", "status-line", t)); log.scrollTop = log.scrollHeight; };
  let got = false;
  const patience = setTimeout(() => { if (!got && brain.usesOnline()) status(X().patient); }, 9000);
  const r = await respond(text, {
    onText: t => { got = true; out.textContent = t; log.scrollTop = log.scrollHeight; },
    onStatus: status
  });
  clearTimeout(patience);
  if (r.text) {
    out.textContent = r.text;
    addReadAloud(out, r.text);
    if (r.source) {
      const a = el("a", "src", `${r.source.saved ? X().sourceSaved : X().source} · ${r.source.title}`); a.href = r.source.url; a.target = "_blank"; a.rel = "noopener";
      log.append(a); log.scrollTop = log.scrollHeight;
    }
    if (r.simple) simpleNotice(r.why);
    if (r.learned) note(T.learned, "learned");
  }
  else { out.remove(); if (r.error) note(r.error); }
  busy = false; send.disabled = false;
}
// Said once per visit: Friend is answering with its backup sentences, and how to get real answers offline.
let simpleTold = false;
function simpleNotice(why) {
  if (simpleTold) return; simpleTold = true;
  const text = why === "busy" ? X().simpleBusy : X().simpleNote;
  if (mode === "chat") {
    const n = note(text, "note simple");
    brain.supported().then(ok => {
      if (!ok || why === "busy" || P.brain.mode === "claude") return;
      const b = el("button", "chip", X().simpleGet); b.type = "button"; b.onclick = () => openSettings("offline"); n.append(" ", b);
    });
  } else $("vnote").textContent = text;
}
$("form").addEventListener("submit", e => { e.preventDefault(); const v = box.value; box.value = ""; grow(); talk(v); });
box.addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey && !e.isComposing && matchMedia("(pointer: fine)").matches) { e.preventDefault(); $("form").requestSubmit(); }
});
function grow() { box.style.height = "auto"; box.style.height = Math.min(box.scrollHeight, 140) + "px"; }
box.addEventListener("input", grow);

/* ================= Live mode ================= */
let dstate = "off", rec = null, spk = null, muted = false, silences = 0, wakeLock = null, started = false;
const stage = $("stage"), statusEl = $("status"), heard = $("heard"), said = $("said"), micBtn = $("micBtn");

function setD(s) {
  dstate = s; stage.dataset.state = s;
  statusEl.textContent = { off: T.tapToStart, idle: T.sIdle, listening: T.sListening, thinking: T.sThinking, speaking: T.sSpeaking, paused: T.sPaused }[s] || "";
  stage.setAttribute("aria-label", statusEl.textContent);
  micBtn.classList.toggle("off", muted);
  micBtn.setAttribute("aria-label", muted ? T.micOff : T.micOn); micBtn.title = micBtn.getAttribute("aria-label");
  if (s === "listening") keepAwake(true); else if (s === "off" || s === "idle" || s === "paused") keepAwake(false);
}
async function keepAwake(on) {
  try {
    if (on && !wakeLock && navigator.wakeLock) { wakeLock = await navigator.wakeLock.request("screen"); wakeLock.addEventListener?.("release", () => { wakeLock = null; }); }
    if (!on && wakeLock) { await wakeLock.release(); wakeLock = null; }
  } catch { wakeLock = null; }
}
function resetDirect() {
  heard.textContent = "";
  const last = [...turns].reverse().find(t => t.role === "assistant");
  said.textContent = last ? last.content : (P.sessions <= 1 ? T.welcome : T.welcomeBack)(P.prefs.name);
  $("vnote").textContent = listenNote();
  micBtn.hidden = !voice.canListen;
  setD(started ? "idle" : "off");
}
const listenNote = () => !voice.canListen ? T.noMic : voice.usesEars() ? X().earsNote : voice.needsEars() ? X().earsNeed(EARS_MB) : voice.local ? T.voiceLocal : T.voiceNote;
// Friend's own hearing has to be downloaded once before it can listen without the phone's speech service.
function askEars() {
  if (ears.state === "loading") { $("vnote").textContent = X().earsLoading(Math.round(ears.progress * 100)); return; }
  openNotice(X().earsH, X().earsAsk(EARS_MB), X().earsGet,
    () => { $("vnote").textContent = X().earsLoading(0); ears.load().then(ok => { if (!ok) $("vnote").textContent = X().earsFail; }); },
    { label: X().earsLater, fn: () => setMode("chat") });
}
ears.on(() => {
  if (mode !== "direct") return;
  if (ears.state === "loading") $("vnote").textContent = X().earsLoading(Math.round(ears.progress * 100));
  else if (ears.state === "ready") { $("vnote").textContent = X().earsNote; if (started && !muted && (dstate === "idle" || dstate === "off")) listenNow(); }
  else if (ears.state === "error") $("vnote").textContent = X().earsFail;
});
function stopDirect() {
  rec?.stop(); rec = null; spk?.cancel(); spk = null; ctl?.abort();
  if (dstate !== "off") setD(started ? "idle" : "off");
  keepAwake(false);
}
function listenNow() {
  if (mode !== "direct" || muted || document.hidden) return;
  if (!voice.canListen) { $("vnote").textContent = T.noMic; return; }
  if (voice.needsEars()) { setD("idle"); askEars(); return; }
  rec?.stop();
  setD("listening"); heard.textContent = "";
  rec = voice.listen({
    lang: T.lang,
    onPartial: t => { heard.textContent = t; },
    onFinal: t => { rec = null; silences = 0; handleUtterance(t); },
    onEnd: reason => {
      rec = null;
      if (mode !== "direct" || dstate !== "listening") return;
      if (reason === "denied") { $("vnote").textContent = T.micDenied; setD("idle"); return; }
      if (reason === "aborted") return;
      if (reason === "needears") { setD("idle"); askEars(); return; }
      // The phone's speech service needs internet: Friend's own hearing takes over when it is there.
      if (reason === "offline") {
        if (voice.usesEars()) { $("vnote").textContent = X().earsNote; setTimeout(listenNow, 250); return; }
        setD("idle");
        if (ears.supported) ears.isStored().then(ok => { if (ok) ears.load(); else askEars(); }); else $("vnote").textContent = T.offline;
        return;
      }
      silences++;
      if (silences >= 3) { silences = 0; setD("idle"); return; }   // nobody is talking: rest the mic
      setTimeout(listenNow, 250);
    }
  });
}
async function handleUtterance(text) {
  heard.textContent = text;
  if (!brain.canAnswer()) { wakeBrain(); setD("idle"); return; }
  setD("thinking");
  spk = voice.speaker({
    lang: T.lang, uri: P.voice.uri, rate: P.voice.rate, natural: P.voice.natural,
    onStart: () => { if (dstate === "thinking") setD("speaking"); },
    onDone: () => { spk = null; if (mode === "direct" && (dstate === "speaking" || dstate === "thinking")) listenNow(); }
  });
  const mySpk = spk;
  let gotVoice = false;
  const patience = setTimeout(() => { if (!gotVoice && brain.usesOnline() && dstate === "thinking") said.textContent = X().patient; }, 9000);
  const r = await respond(text, { voiceMode: true, onText: t => { gotVoice = true; said.textContent = t; mySpk.feed(t); }, onStatus: t => { said.textContent = t; } });
  clearTimeout(patience);
  if (r.aborted) return;
  if (r.text) { said.textContent = r.text; mySpk.finish(r.text); if (!voice.canSpeak) setD("idle"); }
  else { mySpk.cancel(); spk = null; said.textContent = r.error || T.thinkingFail; setD("idle"); }
}
// In live mode, a tap is enough: Friend fetches its brain and its natural voice by itself.
function wakeBrain() {
  if (brain.usesClaude() || brain.usesOnline() || brain.state === "ready") return;
  if (brain.state === "nogpu") { said.textContent = T.brainNoGpu; return; }
  if (brain.state !== "loading") { P.brain.consented = true; save(); brain.load(P.brain.size); }
  showBrainProgress();
}
function showBrainProgress() {
  if (mode !== "direct" || brain.state !== "loading") return;
  statusEl.textContent = brain.firstDownload ? T.dlBrain(Math.round((brain.progress || 0) * 100)) : T.wakeBrain;
}
brain.on(() => {
  if (mode !== "direct") return;
  if (brain.state === "loading") showBrainProgress();
  else if (brain.state === "ready" && (dstate === "idle" || dstate === "off") && started && !muted) listenNow();
  else if (brain.state === "nogpu" || brain.state === "error") { said.textContent = brain.state === "nogpu" ? T.brainNoGpu : T.brainError; setD("idle"); }
});
function wakeVoice() {
  if (P.voice.natural && voice.natural.state !== "ready" && voice.natural.state !== "loading") voice.loadNatural(naturalId());
}
stage.onclick = () => {
  voice.warmUp();
  if (!started) { started = true; voice.prepareLocal(T.lang).then(ok => { if (ok && !voice.usesEars()) $("vnote").textContent = T.voiceLocal; }); }
  wakeVoice();
  if (!brain.canAnswer()) { wakeBrain(); return; }
  if (dstate === "speaking" || dstate === "thinking") { spk?.cancel(); spk = null; ctl?.abort(); listenNow(); return; }
  if (dstate === "listening") return;
  muted = false; listenNow();
};
micBtn.onclick = () => {
  voice.warmUp(); started = true;
  muted = !muted;
  if (muted) { rec?.stop(); rec = null; spk?.cancel(); spk = null; setD("paused"); }
  else listenNow();
};
document.addEventListener("visibilitychange", () => {
  if (document.hidden && mode === "direct") { rec?.stop(); rec = null; spk?.cancel(); spk = null; if (dstate !== "off") setD("idle"); }
});

/* ================= Install + keyboard ================= */
let installEvent = null;
window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); installEvent = e; });
window.addEventListener("appinstalled", () => { installEvent = null; toast(X().installDone); });
// Escape closes whatever is open, like the Close button would.
window.addEventListener("keydown", e => {
  if (e.key !== "Escape") return;
  if (!$("sheetHelp").hidden) { if ($("helpBody").querySelector(".sheet-head .ghost")) $("sheetHelp").hidden = true; }
  else if (!$("sheetGarden").hidden) $("gardenBody").querySelector(".sheet-head .ghost:last-child")?.click();
  else if (!$("sheetSet").hidden) closeSettings();
});

/* ================= One-time notice ================= */
function openNotice(title, text, ok, done, alt) {
  const b = $("helpBody"); b.innerHTML = "";
  const head = el("div", "sheet-head"); head.append(el("h2", "", title)); b.append(head);
  b.append(el("p", "", text));
  const r = el("div", "btnrow"); const x = el("button", "primary", ok); x.type = "button";
  x.onclick = () => { $("sheetHelp").hidden = true; done?.(); };
  r.append(x);
  if (alt) {
    const y = el("button", "ghost", alt.label); y.type = "button";
    y.onclick = () => { $("sheetHelp").hidden = true; alt.fn(); };
    r.append(y);
    if (alt.note) b.append(r, el("p", "fine", alt.note)); else b.append(r);
  } else b.append(r);
  $("sheetHelp").hidden = false;
}
// Before the first conversation: the person chooses between the online AI and, when this
// phone can run it, the private AI that keeps every message on the phone.
async function showOnlineNotice() {
  const ok = await brain.supported();
  const usePrivate = () => {
    Object.assign(P.brain, { mode: "local", consented: true, onlineAck: true, movedOnline: true }); save();
    brain.configure({ mode: "local" }); brain.load(P.brain.size); updateGate(); morningGarden();
  };
  openNotice(T.onlineTitle, T.onlineText, T.onlineOk, () => { P.brain.onlineAck = true; save(); morningGarden(); },
    ok ? { label: T.onlinePrivate, fn: usePrivate, note: T.onlinePrivateNote(SIZE_GB[P.brain.size] || 1) } : null);
}

/* ================= Help ================= */
function openHelp(severe) {
  const b = $("helpBody"); b.innerHTML = "";
  const head = el("div", "sheet-head"); head.append(el("h2", "", T.helpTitle));
  const close = el("button", "ghost", T.close); close.type = "button"; close.onclick = () => { $("sheetHelp").hidden = true; };
  head.append(close); b.append(head);
  if (severe) b.append(el("p", "severe", T.helpSevere));
  const lines = el("div", "lines");
  for (const [name, num, sub] of T.help) {
    const a = el("a", "line"); a.href = "tel:" + num.replace(/\D/g, "");
    const s = el("span", "", name); if (sub) s.append(el("small", "", sub));
    a.append(s, el("strong", "", num)); lines.append(a);
  }
  b.append(lines);
  $("sheetHelp").hidden = false;
}
$("sheetHelp").addEventListener("click", e => { if (e.target.id === "sheetHelp") $("sheetHelp").hidden = true; });

/* ================= Settings ================= */
let confirmForget = false;
function openSettings(focus) { confirmForget = false; renderSettings(); $("sheetSet").hidden = false; if (focus) $("sec-" + focus)?.scrollIntoView({ block: "start" }); }
function closeSettings() { $("sheetSet").hidden = true; brain.configure({ mode: P.brain.mode, key: P.brain.key, model: P.brain.model }); updateGate(); }
$("sheetSet").addEventListener("click", e => { if (e.target.id === "sheetSet") closeSettings(); });
brain.on(() => { if (!$("sheetSet").hidden) { const s = document.getElementById("brainStatus"); if (s) paintBrainStatus(s); } });

function sw(id, checked, onchange) {
  const l = el("label", "switch"); const i = el("input"); i.type = "checkbox"; i.id = id; i.checked = checked;
  i.onchange = () => onchange(i.checked); l.append(i, el("span")); return l;
}
function setrow(text, sub, control) { const r = el("div", "setrow"); const s = el("span", "", text); if (sub) s.append(el("small", "", sub)); r.append(s, control); return r; }
function paintBrainStatus(n) {
  const st = brain.state;
  n.className = "state" + (st === "ready" ? " ready" : "");
  n.textContent = (T.brainState[st] || X().brainNoSpace) + (st === "loading" ? " " + Math.round((brain.progress || 0) * 100) + " %" : "");
}

function paintEars(n) {
  n.className = "fine state" + (ears.state === "ready" ? " ready" : "");
  n.textContent = ears.state === "ready" ? X().earsReady : ears.state === "loading" ? X().earsLoading(Math.round(ears.progress * 100)) : ears.state === "error" ? X().earsFail : "";
}
ears.on(() => { const n = $("earsState"); if (n && !$("sheetSet").hidden) { if (ears.state === "ready" || ears.state === "error") renderSettings(); else paintEars(n); } });

// "Without internet": what is ready on this device, how much room it takes, and what can be removed.
function renderOffline(s, button) {
  const x = X(), B = P.brain;
  s.append(el("p", "fine", x.offLead));
  const list = el("ul", "offlist"); s.append(list);
  const score = el("p", "sub"); s.append(score);
  const space = el("div", "space"); s.append(space);
  const dl = el("div", "dl"); s.append(dl);
  const again = () => { if (!$("sheetSet").hidden) { renderSettings(); $("sec-offline")?.scrollIntoView({ block: "start" }); } };
  const item = (ok, text, action) => {
    const li = el("li", ok ? "ok" : "");
    li.append(el("span", "tick", ok ? "✓" : "○"), el("span", "what", text));
    if (!ok && action) li.append(action);
    list.append(li); return ok ? 1 : 0;
  };
  (async () => {
    const gpu = await brain.supported();
    const cached = gpu ? await brain.cachedSizes() : [];
    const voiceOk = !!P.voice.natural && (voice.natural.state === "ready" || await voice.isNaturalStored(naturalId()));
    const earsOk = ears.state === "ready" || await ears.isStored();
    const appOk = !!navigator.serviceWorker?.controller || location.protocol === "file:";
    if (!s.isConnected) return;
    let n = 0, total = 3;
    n += item(appOk, x.offApp);
    n += item(true, x.offHeart);
    if (gpu) { total++; n += item(cached.length > 0, x.offBrain, cached.length ? null : button(x.offGet + " · " + gbText(SIZE_GB[B.size]), () => { B.consented = true; if (B.mode === "online") { B.mode = "auto"; brain.configure({ mode: "auto" }); } save(); brain.load(B.size); again(); }, "chip")); }
    else list.append(Object.assign(el("li", "na"), { textContent: "– " + x.offNoGpu }));
    n += item(voiceOk, x.offVoice, button(x.offGet, () => { P.voice.natural = true; save(); voice.loadNatural(naturalId()); again(); }, "chip"));
    if (ears.supported) { total++; n += item(earsOk, x.offEars, button(x.offGet + " · " + EARS_MB + (isFR() ? " Mo" : " MB"), () => { ears.load(); again(); }, "chip")); }
    if (brain.state === "loading") list.append(el("li", "na", "… " + T.brainState.loading + " " + Math.round((brain.progress || 0) * 100) + " %"));
    score.textContent = x.offScore(n, total);

    // Room taken on the device, against Friend's own limit.
    const sp = await brain.space();
    if (!s.isConnected) return;
    const GB = 1024 ** 3, used = sp.used / GB;
    space.append(el("p", "sub", x.spaceH));
    const bar = el("div", "bar"), i = el("i"); i.style.width = Math.min(100, Math.max(used > 0 ? 2 : 0, used / MAX_TOTAL_GB * 100)) + "%"; bar.append(i);
    space.append(bar, el("p", "fine", x.spaceVal(gbText(used < 0.1 ? Math.round(used * 100) / 100 : Math.round(used * 10) / 10), MAX_TOTAL_GB) + " " + (sp.persisted ? x.spaceSafe : x.spaceUnsafe)));

    // Downloaded AIs, each with its own "remove" button.
    if (cached.length) {
      dl.append(el("p", "sub", x.dlH));
      const names = Object.fromEntries([...T.sizes, ...x.bigSizes].map(([k, l]) => [k, l]));
      for (const k of cached) {
        const del = button(x.dlDel, async () => { del.disabled = true; await brain.remove(k); if (!(await brain.cachedSizes()).length) { B.consented = false; save(); } updateGate(); again(); }, "ghost danger");
        dl.append(setrow(`${names[k] || k} · ${gbText(SIZE_GB[k])}`, brain.loadedSize === k ? x.dlAwake : null, del));
      }
    }
    if (earsOk) dl.append(setrow(x.offEars + " · " + EARS_MB + (isFR() ? " Mo" : " MB"), null, button(x.dlDel, async () => { await ears.remove(); P.voice.ears = false; voice.privateEars = false; save(); again(); }, "ghost danger")));
    const k = knownCount();
    if (k) dl.append(setrow(x.offKnow(k), x.offKnowSub, button(x.knowClear, () => { forgetKnown(); again(); }, "ghost danger")));
  })();
}

function renderSettings() {
  const b = $("setBody"); b.innerHTML = "";
  const head = el("div", "sheet-head"); head.append(el("h2", "", T.setTitle));
  const close = el("button", "ghost", T.close); close.type = "button"; close.onclick = closeSettings; head.append(close); b.append(head);
  const sec = (id, title) => { const s = el("section", "sec"); s.id = "sec-" + id; s.append(el("h3", "", title)); b.append(s); return s; };
  const button = (text, fn, cls = "ghost") => { const x = el("button", cls, text); x.type = "button"; x.onclick = fn; return x; };

  /* --- Language --- */
  const s0 = sec("lang", T.langH);
  s0.append(el("p", "fine", T.langSub));
  const lg = el("div", "chips");
  for (const l of LANGS) {
    const x = el("button", "chip" + (l.code === LANG.code ? " on" : ""), l.name); x.type = "button"; x.setAttribute("aria-pressed", String(l.code === LANG.code));
    x.onclick = () => { if (l.code === LANG.code) return; P.lang = l.code; save(); location.reload(); };
    lg.append(x);
  }
  s0.append(lg);

  /* --- Look --- */
  const L = P.look, s1 = sec("look", T.lookH);
  const look = el("div", "look"); const prev = el("div", "avatar lg"); prev.innerHTML = avatarSVG(L.shape, L.acc);
  look.append(prev, el("p", "", T.lookSub)); s1.append(look);
  const setLook = patch => { Object.assign(P.look, patch); save(); paintLook(); renderSettings(); };
  const pick = (svg, text, on, fn) => { const x = el("button", "pick"); x.type = "button"; x.innerHTML = svg; x.title = text; x.setAttribute("aria-pressed", String(on)); x.append(el("span", "", text)); x.onclick = fn; return x; };
  s1.append(el("p", "sub", T.shapeH));
  const g1 = el("div", "pick-grid"); for (const [k, l] of T.shapes) g1.append(pick(avatarSVG(k, L.acc, false), l, L.shape === k, () => setLook({ shape: k }))); s1.append(g1);
  s1.append(el("p", "sub", T.colorH));
  const g2 = el("div", "swatches");
  for (const [k, l] of T.hues) { const x = el("button", "sw"); x.type = "button"; x.style.background = COLORS[k]; x.title = l; x.setAttribute("aria-label", l); x.setAttribute("aria-pressed", String(L.hue === k)); x.onclick = () => setLook({ hue: k }); g2.append(x); }
  s1.append(g2);
  s1.append(el("p", "sub", T.accH));
  const g3 = el("div", "pick-grid five");
  const stars = P.focus?.stars || 0;
  for (const [k, l] of T.accs) {
    const need = UNLOCKS.find(u => u.acc === k)?.stars || 0;
    const b = pick(avatarSVG(L.shape, k, false), stars >= need ? l : `🔒 ${need} ⭐`, L.acc === k, () => setLook({ acc: k }));
    if (stars < need) { b.disabled = true; b.classList.add("locked"); b.title = `${l} · ${need} ⭐`; }
    g3.append(b);
  }
  s1.append(g3);

  /* --- Brain --- */
  const B = P.brain, s2 = sec("brain", T.brainH);
  s2.append(setrow(X().searchH, X().searchSub, sw("searchOn", searchOn(), v => { P.search = v; save(); })));
  s2.append(el("p", "sub", T.brainWho));
  const who = el("div", "choice");
  const setBrainMode = m => { B.mode = m; save(); brain.configure({ mode: m }); if ((m === "local" || m === "auto") && brain.state === "idle" && B.consented) brain.load(B.size); renderSettings(); };
  who.append(opt(T.brainAuto, T.brainAutoSub, B.mode === "auto", () => setBrainMode("auto")), opt(T.brainOnline, T.brainOnlineSub, B.mode === "online", () => setBrainMode("online")), opt(T.brainLocal, T.brainLocalSub, B.mode === "local", () => setBrainMode("local")), opt(T.brainClaude, T.brainClaudeSub, B.mode === "claude", () => setBrainMode("claude")));
  s2.append(who);
  if (B.mode === "local" || B.mode === "auto") {
    if (B.mode === "auto") s2.append(el("p", "fine", T.localWhy));
    const status = el("span"); status.id = "brainStatus"; paintBrainStatus(status);
    s2.append(setrow(T.brainLocal, null, status));
    s2.append(el("p", "sub", T.sizeH));
    const sizes = el("div", "choice");
    const allowed = brain.sizesFor();
    for (const [k, l, sub] of [...T.sizes, ...X().bigSizes].filter(x => allowed.includes(x[0]) || B.size === x[0])) sizes.append(opt(`${l} · ${gbText(SIZE_GB[k])}`, sub, B.size === k, () => {
      B.size = k; save(); brain.configure({ size: k }); if (B.consented && brain.state !== "nogpu") brain.load(k); renderSettings();
    }));
    s2.append(sizes);
    if (brain.state === "nospace") s2.append(el("p", "fine", X().noSpace));
    if (brain.state === "idle" || brain.state === "error" || brain.state === "nospace") { const r = el("div", "btnrow"); r.append(button(B.mode === "auto" ? T.localGet : T.brainGo, () => { B.consented = true; save(); brain.load(B.size); renderSettings(); }, "primary")); s2.append(r); }
    if (brain.state === "ready") {
      s2.append(el("p", "sub", T.speedH));
      const sp = el("p", "fine"); sp.id = "speedLine";
      const paintSpeed = () => { sp.textContent = brain.speed ? `${T.speedVal(brain.speed, brain.firstWordMs)} — ${brain.speed >= FAST_ENOUGH ? T.speedFast : T.speedSlow}` : T.speedNone; };
      paintSpeed();
      const r = el("div", "btnrow");
      const tb = button(T.speedTest, async () => { tb.disabled = true; sp.textContent = T.speedTesting; try { await brain.benchmark(); } catch {} paintSpeed(); tb.disabled = false; });
      r.append(tb); s2.append(sp, r);
      // Advice from the measured speed: a lighter size when it struggles, a smarter one when it flies.
      const order = brain.sizesFor(), at = order.indexOf(brain.loadedSize), names = Object.fromEntries([...T.sizes, ...X().bigSizes].map(([k, l]) => [k, l]));
      const move = k => { B.size = k; save(); brain.configure({ size: k }); brain.load(k); renderSettings(); $("sec-brain")?.scrollIntoView({ block: "start" }); };
      if (brain.stalled) s2.append(el("p", "fine", X().advStalled));
      else if (brain.speed && brain.speed < FAST_ENOUGH && at > 0) { const a = el("div", "btnrow"); a.append(button(X().advLighter(names[order[at - 1]], gbText(SIZE_GB[order[at - 1]])), () => move(order[at - 1]))); s2.append(el("p", "fine", X().advSlow), a); }
      else if (brain.speed >= 20 && at >= 0 && at < order.length - 1) { const a = el("div", "btnrow"); a.append(button(X().advSmarter(names[order[at + 1]], gbText(SIZE_GB[order[at + 1]])), () => move(order[at + 1]))); s2.append(el("p", "fine", X().advFast), a); }
    }
    if (B.mode === "auto") s2.append(el("p", "fine", T.onlineText));
  } else if (B.mode === "online") {
    s2.append(el("p", "fine", T.onlineText));
  } else {
    s2.append(el("p", "sub", T.keyLabel));
    const key = el("input", "input"); key.type = "password"; key.id = "claudeKey"; key.placeholder = T.keyPh; key.autocomplete = "off"; key.value = B.key;
    s2.append(key);
    const br = el("div", "btnrow");
    br.append(button(T.keySave, () => { B.key = key.value.trim(); save(); brain.configure({ key: B.key }); toast(T.keySaved); renderSettings(); }, "primary"));
    if (B.key) br.append(button(T.keyRemove, () => { B.key = ""; save(); brain.configure({ key: "" }); renderSettings(); }, "ghost danger"));
    s2.append(br, el("p", "fine", T.keyHelp));
    const model = el("select"); model.id = "claudeModel";
    for (const [v, l] of [["claude-haiku-5-5", "Claude Haiku 5.5 · " + (isFR() ? "rapide et économique" : "fast and cheap")], ["claude-sonnet-5-5", "Claude Sonnet 5.5 · " + (isFR() ? "plus futé" : "smarter")]]) {
      const o = el("option", "", l); o.value = v; o.selected = B.model === v; model.append(o);
    }
    model.onchange = () => { B.model = model.value; save(); brain.configure({ model: B.model }); };
    s2.append(el("p", "sub", isFR() ? "Modèle" : "Model"), model);
    s2.append(setrow(T.shareCtx, T.shareCtxSub, sw("shareCtx", B.share, v => { B.share = v; save(); })));
    const lim = el("input", "input"); lim.type = "number"; lim.min = "10"; lim.max = "5000"; lim.id = "limit"; lim.value = B.limit;
    lim.onchange = () => { B.limit = Math.max(10, Math.min(5000, parseInt(lim.value, 10) || 300)); save(); renderSettings(); };
    s2.append(el("p", "sub", T.limitLabel), lim);
    const u = B.usage.month === monthKey() ? B.usage.count : 0;
    s2.append(el("p", "fine", T.usage(u, B.limit)));
  }

  /* --- Display --- */
  P.display ||= { theme: "auto", text: "normal" };
  const sd = sec("display", T.displayH);
  const seg = (lbl, list, key) => {
    sd.append(el("p", "sub", lbl)); const g = el("div", "seg");
    for (const [v, l] of list) { const c = el("button", "chip" + (P.display[key] === v ? " on" : ""), l); c.type = "button"; c.setAttribute("aria-pressed", String(P.display[key] === v)); c.onclick = () => { P.display[key] = v; save(); applyDisplay(); renderSettings(); }; g.append(c); }
    sd.append(g);
  };
  seg(T.themeL, T.themes, "theme"); seg(T.textL, T.texts, "text");

  /* --- Voice --- */
  const V = P.voice, s3 = sec("voice", T.voiceH);
  s3.append(setrow(T.autoDirect, null, sw("autoDirect", V.auto, v => { V.auto = v; save(); })));
  s3.append(setrow(T.gardenMorning, T.gardenMorningSub, sw("gardenMorning", P.gardenMorning !== false, v => { P.gardenMorning = v; save(); })));
  s3.append(setrow(T.naturalH, T.naturalSub, sw("natural", V.natural, v => { V.natural = v; save(); if (v) voice.loadNatural(naturalId()); renderSettings(); })));
  if (V.natural) {
    const ns = voice.natural;
    const stateText = ns.voiceId === naturalId() ? (ns.state === "ready" ? T.naturalOn : ns.state === "loading" ? T.naturalLoading + " " + Math.round(ns.progress * 100) + " %" : ns.state === "error" ? T.naturalFail : "") : "";
    const nsel = el("select"); nsel.id = "naturalPick";
    for (const id of LANG.piper) { const o = el("option", "", id.split("-")[1].replace(/_/g, " ").replace(/^./, c => c.toUpperCase()) + " · " + id.split("-")[0].replace("_", "-")); o.value = id; o.selected = id === naturalId(); nsel.append(o); }
    nsel.onchange = () => { V.naturalId = nsel.value; save(); voice.loadNatural(nsel.value); renderSettings(); };
    s3.append(el("p", "sub", T.voicePick), nsel);
    if (stateText) s3.append(el("p", "fine state" + (ns.state === "ready" ? " ready" : ""), stateText));
    if (!(ns.voiceId === naturalId() && (ns.state === "ready" || ns.state === "loading"))) { const r = el("div", "btnrow"); r.append(button(T.naturalGet, () => { voice.loadNatural(naturalId()); renderSettings(); }, "primary")); s3.append(r); }
  }
  if (voice.canSpeak) {
    const sel = el("select"); sel.id = "voicePick";
    const def = el("option", "", T.voiceDefault); def.value = ""; sel.append(def);
    for (const v of voice.systemVoices(T.lang)) { const o = el("option", "", v.name + (v.localService ? "" : " ☁")); o.value = v.voiceURI; o.selected = v.voiceURI === V.uri; sel.append(o); }
    sel.onchange = () => { V.uri = sel.value; save(); };
    const rate = el("input"); rate.type = "range"; rate.min = "0.8"; rate.max = "1.3"; rate.step = "0.05"; rate.value = V.rate; rate.id = "rate";
    rate.oninput = () => { V.rate = parseFloat(rate.value); save(); };
    const tr = el("div", "btnrow");
    tr.append(button(T.voiceTest, () => { voice.warmUp(); voice.stopSpeaking(); const s = voice.speaker({ lang: T.lang, uri: V.uri, rate: V.rate, natural: V.natural }); s.finish(T.voiceTestText); }));
    s3.append(el("p", "sub", T.sysVoice), sel, el("p", "sub", T.rate), rate, tr);
  }
  if (ears.supported) {
    const on = !!V.ears || !voice.hasSystem;
    const row = setrow(X().earsH, X().earsSub(EARS_MB), sw("earsOn", on, v => { V.ears = v; save(); voice.privateEars = v; if (v) ears.load(); renderSettings(); }));
    if (!voice.hasSystem) row.querySelector("input").disabled = true;      // it is the only way to listen here
    s3.append(row);
    const es = el("p", "fine state" + (ears.state === "ready" ? " ready" : "")); es.id = "earsState"; paintEars(es); s3.append(es);
    if (on && (ears.state === "idle" || ears.state === "error")) { const r = el("div", "btnrow"); r.append(button(X().earsGet, () => { ears.load(); renderSettings(); }, "primary")); s3.append(r); }
  }
  s3.append(el("p", "fine", voice.usesEars() ? X().earsNote : voice.local ? T.voiceLocal : T.voiceNote));

  /* --- Without internet --- */
  renderOffline(sec("offline", X().offH), button);

  /* --- Lock --- */
  const s4 = sec("lock", T.lockH);
  s4.append(setrow(P.pin ? T.lockOn : T.lockOff, null, el("span", "state" + (P.pin ? " ready" : ""), P.pin ? "🔒" : "🔓")));
  const lr = el("div", "btnrow");
  const backToMain = () => { show(mode === "direct" ? "vDirect" : "vChat"); updateGate(); openSettings("lock"); };
  lr.append(button(P.pin ? T.lockChange : T.lockSet, () => { $("sheetSet").hidden = true; stopDirect(); pinFlow("set", backToMain, backToMain); }));
  if (P.pin) lr.append(button(T.lockRemove, () => { P.pin = null; save(); renderSettings(); }, "ghost danger"));
  s4.append(lr);

  /* --- What Friend knows --- */
  const p = P.prefs, s5 = sec("me", T.meH);
  s5.append(el("p", "sub", T.prefsH));
  const ul = el("ul"); for (const line of [p.name, label(T.styles, p.style), label(T.helps, p.help), p.topics.join(", "), label(T.lens, p.len)].filter(Boolean)) ul.append(el("li", "", line));
  s5.append(ul, el("p", "sub", T.memH));
  if (P.memories?.length) {
    const m = el("ul", "memlist");
    P.memories.forEach((x, i) => {
      const li = el("li"); li.append(el("span", "", x));
      const del = el("button", "xbtn", "✕"); del.type = "button"; del.setAttribute("aria-label", `${T.memDelete} : ${x}`); del.title = T.memDelete;
      del.onclick = () => { P.memories.splice(i, 1); save(); renderSettings(); $("sec-me")?.scrollIntoView({ block: "center" }); };
      li.append(del); m.append(li);
    });
    s5.append(m);
  }
  else s5.append(el("p", "empty", T.memEmpty));
  if (P.archive) s5.append(el("p", "sub", T.archiveH), el("p", "empty", P.archive));
  s5.append(el("p", "fine", T.memPrivacy));
  const ar = el("div", "btnrow");
  ar.append(button(T.newChat, () => { closeSettings(); stopDirect(); turns = []; userCount = 0; resetChatLog(false); setMode(mode); }));
  ar.append(button(T.redo, () => { $("sheetSet").hidden = true; startOnboarding(); }));
  if (confirmForget) ar.append(button(T.forgetSure, () => { $("sheetSet").hidden = true; stopDirect(); wipe(); startOnboarding(); }, "ghost danger"));
  else ar.append(button(T.forget, () => { confirmForget = true; renderSettings(); $("sec-me")?.scrollIntoView({ block: "end" }); }, "ghost danger"));
  s5.append(ar);

  /* --- Backup --- */
  const s7 = sec("backup", T.backupH);
  s7.append(el("p", "fine", T.backupSub));
  const br2 = el("div", "btnrow");
  br2.append(button(T.backupSave, () => {
    const copy = JSON.parse(JSON.stringify(P));
    if (copy.brain) copy.brain.key = "";            // never put the Claude key in a file
    const blob = new Blob([JSON.stringify({ app: "friend", saved: new Date().toISOString(), profile: copy }, null, 1)], { type: "application/json" });
    const a2 = document.createElement("a"); a2.href = URL.createObjectURL(blob);
    a2.download = `friend-sauvegarde-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.append(a2); a2.click(); a2.remove(); setTimeout(() => URL.revokeObjectURL(a2.href), 4000);
    toast(T.backupDone);
  }, "primary"));
  const file = el("input"); file.type = "file"; file.accept = "application/json,.json"; file.hidden = true; file.id = "restoreFile";
  file.onchange = async () => {
    const f = file.files?.[0]; file.value = ""; if (!f) return;
    let data; try { data = JSON.parse(await f.text()); } catch { data = null; }
    const prof = data?.app === "friend" ? data.profile : null;
    if (!prof || !prof.prefs || !prof.look) { toast(T.backupBad); return; }
    const sure = button(T.backupYes, () => {
      const key = P.brain?.key || "";
      P = prof; if (P.brain) P.brain.key = key; save(); toast(T.backupOk);
      setTimeout(() => location.reload(), 900);
    }, "ghost danger");
    br2.append(el("span", "fine", T.backupSure), sure);
  };
  br2.append(button(T.backupLoad, () => file.click()), file);
  s7.append(br2);

  /* --- About --- */
  const s6 = sec("about", T.aboutH);
  s6.append(el("p", "fine", T.notPro));
  const a = el("a", "", T.privacyLink); a.href = "privacy.html"; a.target = "_blank"; a.rel = "noopener";
  const shareRow = el("div", "btnrow"); shareRow.append(button(T.shareBtn, shareFriend));
  const standalone = matchMedia("(display-mode: standalone)").matches || navigator.standalone;
  if (!standalone) {
    if (installEvent) shareRow.append(button(X().installBtn, async () => { const ev = installEvent; installEvent = null; try { ev.prompt(); await ev.userChoice; } catch {} renderSettings(); }, "primary"));
    else if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) s6.append(el("p", "fine", X().installIos));
  }
  s6.append(a, shareRow, el("p", "fine", `${T.version} ${VERSION}`));
}

/* ================= PIN ask after the questionnaire ================= */
/* ================= Mood garden ================= */
function paintGardenBtn() { const b = $("gardenBtn"); b.textContent = W().btn; b.classList.toggle("dot", !!P && (!plantedToday(P) || !challengeDone(P) || readyCapsules(P).length > 0)); }
function announceBadges() { const fresh = checkBadges(P); if (fresh.length) { save(); setTimeout(() => toast(badgeToast(fresh)), 600); } }
function closeActivities() { $("sheetGarden").hidden = true; paintGardenBtn(); paintLook(); announceBadges(); }
function openGarden() {
  renderGarden($("gardenBody"), P, save, closeActivities);
  $("sheetGarden").hidden = false;
}
function openActivities(view = "home") {
  renderActivities($("gardenBody"), { P, save, brain, toast, openGarden, close: closeActivities }, view);
  $("sheetGarden").hidden = false;
}
$("gardenBtn").onclick = () => openActivities();
// Every morning (5 h to midi), the garden opens by itself once, until today's plant is planted.
function morningGarden() {
  if (P.gardenMorning === false || plantedToday(P)) return;
  const now = new Date(), h = now.getHours();
  const day = now.toDateString();
  if (h < 5 || h >= 12 || P.gardenAsked === day) return;
  if ((P.brain.mode === "online" || P.brain.mode === "auto") && !P.brain.onlineAck) return;   // the one-time notice comes first
  P.gardenAsked = day; save();
  setTimeout(() => { if ($("sheetSet").hidden && $("sheetHelp").hidden) openGarden(); }, 700);
}
$("sheetGarden").addEventListener("click", e => { if (e.target.id === "sheetGarden") closeActivities(); });

function refreshStatic() {
  $("pinAskTitle").textContent = T.pinAskTitle; $("pinAskText").textContent = T.pinAskText;
  $("pinYes").textContent = T.pinYes; $("pinLater").textContent = T.pinLater;
  box.placeholder = T.placeholder; $("setBtn").textContent = T.settings; $("helpToggle").textContent = T.helpToggle;
  paintGardenBtn();
}
refreshStatic();
$("pinYes").onclick = () => pinFlow("set", () => enterMain(true), () => { show("vPinAsk"); });
$("pinLater").onclick = () => enterMain(true);

/* ================= Start ================= */
if ("serviceWorker" in navigator && location.protocol !== "file:") navigator.serviceWorker.register("sw.js").catch(() => {});
paintLook();
if (!P || !P.prefs?.style) startOnboarding();
else if (P.pin) pinFlow("unlock", () => enterMain(false));
else enterMain(false);
