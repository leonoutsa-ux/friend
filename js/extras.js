// More "For you" activities: 3 good things, badges and the weekly letter.
// Everything is kept on the phone, inside Friend's profile.
import { LANG, T, label } from "./i18n.js";
import { X_WORDS } from "./extras-i18n.js";
import { UNLOCKS } from "./avatar.js";
import { isSevere } from "./safety.js";

export const X = () => X_WORDS[LANG.code] || X_WORDS.en;
const el = (tag, cls, text) => { const x = document.createElement(tag); if (cls) x.className = cls; if (text != null) x.textContent = text; return x; };
const btn = (text, cls, fn) => { const b = el("button", cls, text); b.type = "button"; b.onclick = fn; return b; };
const isoDay = d => { const x = new Date(d); return x.getFullYear() + "-" + String(x.getMonth() + 1).padStart(2, "0") + "-" + String(x.getDate()).padStart(2, "0"); };
const monday = d => { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - (x.getDay() + 6) % 7); return x; };
const shortDate = k => new Date(k + "T12:00").toLocaleDateString(LANG.speech, { day: "numeric", month: "long" });
function addStars(P, n) { P.focus ||= { stars: 0, sessions: 0 }; const before = P.focus.stars; P.focus.stars += n; return UNLOCKS.find(u => before < u.stars && P.focus.stars >= u.stars)?.acc; }

export const EXTRA_KEYS = ["gratitude", "badges"];
export const extraTile = key => key === "gratitude" ? X().grTile : X().bdTile;
export const extraTitle = view => ({ gratitude: X().grTitle, badges: X().bdTitle, letter: X().ltTitle }[view]);
export const gratitudeDone = P => !!P?.gratitude?.[isoDay(Date.now())];
export function renderExtra(view, root, ctx) {
  if (view === "gratitude") gratitude(root, ctx);
  else if (view === "badges") badges(root, ctx);
  else if (view === "letter") letter(root, ctx);
}

/* ---------- 3 good things ---------- */
function gratitude(root, ctx) {
  const x = X(), P = ctx.P; P.gratitude ||= {};
  const today = isoDay(Date.now());
  root.append(el("p", "fine", x.grLead));
  const card = el("section", "sec");
  const inputs = x.grPh.map((ph, i) => {
    const inp = el("input", "input gr"); inp.id = "gr" + i; inp.maxLength = 120; inp.placeholder = ph; inp.value = P.gratitude[today]?.[i] || "";
    inp.setAttribute("aria-label", ph); card.append(inp); return inp;
  });
  const msg = el("p", "fine"); msg.setAttribute("aria-live", "polite");
  const saveBtn = btn(P.gratitude[today] ? x.grUpdate : x.grSave, "primary", () => {
    const vals = inputs.map(i => i.value.trim().slice(0, 120));
    if (!vals.some(Boolean)) { msg.textContent = x.grNeed; inputs[0].focus(); return; }
    const first = !P.gratitude[today];
    P.gratitude[today] = vals;
    let unlocked = null;
    if (first) { unlocked = addStars(P, 1); ctx.toast(x.grSaved); }
    ctx.save();
    msg.textContent = (first ? x.grSaved : x.grUpdated) + (unlocked ? ` · ${label(T.accs, unlocked)} 🔓` : "");
    saveBtn.textContent = x.grUpdate; paintHist();
  });
  const row = el("div", "btnrow"); row.append(saveBtn); card.append(row, msg); root.append(card);

  const hist = el("section", "sec"); root.append(hist);
  function paintHist() {
    hist.innerHTML = ""; hist.append(el("h3", "", x.grHistory));
    const days = Object.keys(P.gratitude).sort().reverse();
    if (!days.length) { hist.append(el("p", "empty", x.grNone)); return; }
    const all = days.flatMap(k => P.gratitude[k].filter(Boolean).map(t => ({ k, t })));
    const pickLine = el("p", "gr-pick"); pickLine.setAttribute("aria-live", "polite");
    if (all.length > 3) {
      const r = el("div", "btnrow");
      r.append(btn(x.grRandom, "ghost", () => { const p = all[Math.floor(Math.random() * all.length)]; pickLine.textContent = `« ${p.t} » · ${shortDate(p.k)}`; }));
      hist.append(r, pickLine);
    }
    for (const k of days.slice(0, 14)) {
      const box = el("div", "gr-day"); box.append(el("b", "", shortDate(k)));
      const ul = el("ul"); for (const t of P.gratitude[k].filter(Boolean)) ul.append(el("li", "", t));
      box.append(ul); hist.append(box);
    }
  }
  paintHist();
}

/* ---------- Badges ---------- */
function gardenBestStreak(P) {
  const keys = Object.keys(P.garden || {}).sort(); let best = 0, run = 0, prev = null;
  for (const k of keys) {
    const t = new Date(k + "T12:00").getTime();
    run = prev !== null && Math.round((t - prev) / 864e5) === 1 ? run + 1 : 1;
    best = Math.max(best, run); prev = t;
  }
  return best;
}
export function focusMinutes(P) { return P.focus?.totalMin ?? Object.values(P.focus?.days || {}).reduce((a, b) => a + b, 0); }
function earned(P) {
  const plants = Object.keys(P.garden || {}).length, streak = gardenBestStreak(P);
  const ch = Object.keys(P.challenges || {}).length, mins = focusMinutes(P), st = P.stats || {};
  const caps = P.capsules || [], gr = Object.keys(P.gratitude || {}).length, stars = P.focus?.stars || 0, visits = P.sessions || 0;
  return {
    plant1: plants >= 1, plant7: plants >= 7, plant30: plants >= 30, streak3: streak >= 3, streak7: streak >= 7,
    ch1: ch >= 1, ch7: ch >= 7, ch20: ch >= 20,
    foc1: (P.focus?.sessions || 0) >= 1, foc100: mins >= 100, foc500: mins >= 500,
    quiz1: (st.quiz || 0) >= 1, quizPerfect: (st.quizPerfect || 0) >= 1,
    cap1: caps.length >= 1, capOpen: caps.some(c => c.opened),
    br1: (st.breaths || 0) >= 1, br10: (st.breaths || 0) >= 10,
    gr1: gr >= 1, gr7: gr >= 7, letter1: Object.keys(P.letters || {}).length >= 1,
    stars15: stars >= 15, stars50: stars >= 50, visits10: visits >= 10, visits30: visits >= 30
  };
}
// Records newly earned badges and returns them, so Friend can announce them once.
export function checkBadges(P) {
  if (!P) return [];
  const had = P.badges; P.badges ||= {};
  const now = earned(P), fresh = [];
  for (const [id, ok] of Object.entries(now)) if (ok && !P.badges[id]) { P.badges[id] = Date.now(); fresh.push(id); }
  return had ? fresh : [];          // the very first check only records what was already earned
}
export function badgeToast(ids) {
  if (!ids.length) return "";
  const [icon, name] = X().badges[ids[0]] || ["🏅", ids[0]];
  return `${X().bdNew} ${icon} ${name}${ids.length > 1 ? ` (+${ids.length - 1})` : ""}`;
}
function badges(root, ctx) {
  const x = X(), P = ctx.P; checkBadges(P); ctx.save();
  const ids = Object.keys(x.badges), got = ids.filter(id => P.badges[id]);
  root.append(el("p", "fine", x.bdLead));
  const sec = el("section", "sec"); sec.append(el("h3", "", x.bdCount(got.length, ids.length)));
  const bar = el("div", "bar"), fill = el("i"); fill.style.width = Math.round(100 * got.length / ids.length) + "%"; bar.append(fill); sec.append(bar);
  const grid = el("div", "badges");
  for (const id of [...got, ...ids.filter(i => !P.badges[i])]) {
    const [icon, name, how] = x.badges[id], has = !!P.badges[id];
    const b = el("div", "badge-card" + (has ? " got" : ""));
    b.append(el("span", "badge-ic", has ? icon : "🔒"), el("b", "", name), el("small", "", how));
    grid.append(b);
  }
  sec.append(grid); root.append(sec);
}

/* ---------- Weekly letter ---------- */
function weekNotes(P) {
  const french = LANG.code === "fr", start = monday(new Date()), lines = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start); d.setDate(d.getDate() + i); if (d > new Date()) break;
    const k = isoDay(d), day = d.toLocaleDateString(LANG.speech, { weekday: "long" }), bits = [];
    const g = P.garden?.[k];
    if (g) bits.push((french ? "humeur " : "mood ") + T.garden.moods[g.v - 1] + (g.note && !isSevere(g.note) ? ` (« ${g.note} »)` : ""));
    const c = P.challenges?.[k]; if (c) bits.push((french ? "défi créatif relevé : " : "creative challenge done: ") + c.text);
    const f = P.focus?.days?.[k]; if (f) bits.push(`${f} min ${french ? "de concentration" : "of focus"}`);
    const gr = (P.gratitude?.[k] || []).filter(t => t && !isSevere(t)); if (gr.length) bits.push((french ? "bonnes choses : " : "good things: ") + gr.join(" ; "));
    if (bits.length) lines.push(`- ${day} : ${bits.join(", ")}`);
  }
  return lines;
}
// The week in numbers, for the letter Friend writes without any AI.
function weekFacts(P) {
  const start = monday(new Date()), f = { moods: 0, good: 0, hard: 0, challenges: 0, focus: 0, thanks: [] };
  for (let i = 0; i < 7; i++) {
    const d = new Date(start); d.setDate(d.getDate() + i); if (d > new Date()) break;
    const k = isoDay(d), g = P.garden?.[k];
    if (g) { f.moods++; if (g.v >= 4) f.good++; if (g.v <= 2) f.hard++; }
    if (P.challenges?.[k]) f.challenges++;
    f.focus += P.focus?.days?.[k] || 0;
    for (const t of P.gratitude?.[k] || []) if (t && !isSevere(t)) f.thanks.push(t);
  }
  return f;
}
export function simpleLetter(P) {
  const f = weekFacts(P), x = X(), name = P.prefs.name, parts = [x.slHello(name)];
  if (f.moods) parts.push(x.slMoods(f.moods));
  if (f.good) parts.push(x.slGood(f.good));
  if (f.hard) parts.push(x.slHard(f.hard));
  if (f.challenges) parts.push(x.slChallenges(f.challenges));
  if (f.focus) parts.push(x.slFocus(f.focus));
  if (f.thanks.length) parts.push(x.slThanks(f.thanks[f.thanks.length - 1].slice(0, 90)));
  parts.push(x.slEnd);
  return parts.join(" ");
}
function letter(root, ctx) {
  const x = X(), P = ctx.P; P.letters ||= {};
  const wk = isoDay(monday(new Date()));
  root.append(el("p", "fine", x.ltLead));
  const card = el("section", "sec letter"); root.append(card);
  const old = el("section", "sec"); root.append(old);
  function paint(status) {
    card.innerHTML = "";
    card.append(el("h3", "", x.ltWeek(shortDate(wk))));
    const cur = P.letters[wk];
    if (cur) card.append(el("p", "letter-text", cur.text));
    const msg = el("p", "fine", status || ""); msg.setAttribute("aria-live", "polite");
    const go = btn(cur ? x.ltAgain : x.ltWrite, cur ? "ghost" : "primary", async () => {
      const notes = weekNotes(P);
      if (!notes.length) { msg.textContent = x.ltEmpty; return; }
      go.disabled = true; msg.textContent = x.ltWriting;
      const keep = text => { P.letters[wk] = { text, at: Date.now() }; for (const k of Object.keys(P.letters).sort().reverse().slice(8)) delete P.letters[k]; ctx.save(); paint(); paintOld(); };
      // Without internet and without the small AI, Friend still writes: a simpler letter, from the week's numbers.
      if (!ctx.brain.canAnswer() || (!navigator.onLine && ctx.brain.state !== "ready")) { keep(simpleLetter(P)); return; }
      const french = LANG.code === "fr", name = P.prefs.name;
      const prompt = french
        ? `Tu es Friend, un ami chaleureux. Écris une courte lettre (5 à 7 phrases) à ${name || "ton ami"} sur sa semaine, à partir de ces notes. Tutoie. Remarque ses efforts et ses bons moments avec des détails précis, sois doux sur les jours difficiles sans dramatiser ni faire la morale, et termine par un encouragement pour la semaine qui vient. Phrases simples et naturelles. N'invente aucun détail qui n'est pas dans les notes. Pas de liste, pas de titre, pas de signature.\nNotes de la semaine :\n${notes.join("\n")}`
        : `You are Friend, a warm friend. Write a short letter (5 to 7 sentences) in ${LANG.reply} to ${name || "your friend"} about their week, from these notes. Notice their efforts and good moments with specific details, be gentle about hard days without dramatizing or lecturing, and end with encouragement for the coming week. Simple, natural sentences. Do not invent any detail that is not in the notes. No list, no title, no signature.\nNotes from the week:\n${notes.join("\n")}`;
      try {
        const text = (await ctx.brain.chat([{ role: "user", content: prompt }], { maxTokens: 520, temperature: 0.6, effort: "medium" }) || "").trim();
        if (!text) throw new Error("empty");
        keep(text);
      } catch (e) { console.warn("letter", e); keep(simpleLetter(P)); }
    });
    const row = el("div", "btnrow"); row.append(go); card.append(row, msg);
  }
  function paintOld() {
    const keys = Object.keys(P.letters).filter(k => k !== wk).sort().reverse();
    old.hidden = !keys.length; old.innerHTML = ""; if (!keys.length) return;
    old.append(el("h3", "", x.ltOld));
    for (const k of keys) { const d = el("details", "old-letter"); d.append(el("summary", "", x.ltWeek(shortDate(k))), el("p", "letter-text", P.letters[k].text)); old.append(d); }
  }
  paint(); paintOld();
}
