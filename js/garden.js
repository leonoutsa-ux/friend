// Mood garden: each day the person says how they feel, and it becomes a plant.
// Everything stays on the phone (inside Friend's profile).
import { T, LANG } from "./i18n.js";
import { X } from "./extras.js";

const MOOD_COLORS = ["var(--m1)", "var(--m2)", "var(--m3)", "var(--m4)", "var(--m5)"];
const el = (tag, cls, text) => { const x = document.createElement(tag); if (cls) x.className = cls; if (text != null) x.textContent = text; return x; };
const iso = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
const monday = d => { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - (x.getDay() + 6) % 7); return x; };

function face(v) {
  const mouth = { 1: "M-6 6 Q0 1 6 6", 2: "M-6 5 L6 5", 3: "M-6 3 Q0 7 6 3", 4: "M-7 2 Q0 9 7 2", 5: "M-8 1 Q0 12 8 1 Z" }[v];
  return `<circle cx="-4.5" cy="-3" r="1.8" fill="#2a2a2a"/><circle cx="4.5" cy="-3" r="1.8" fill="#2a2a2a"/><path d="${mouth}" fill="${v === 5 ? "#2a2a2a" : "none"}" stroke="#2a2a2a" stroke-width="2" stroke-linecap="round"/>`;
}
const moodIcon = v => `<svg viewBox="-20 -20 40 40" aria-hidden="true"><circle r="17" fill="${MOOD_COLORS[v - 1]}"/>${face(v)}</svg>`;

// From a little mushroom (bad day) to a big sunflower (great day).
function plantSVG(v, grow) {
  const stem = h => `<path d="M50 120 Q48 ${120 - h / 2} 50 ${120 - h}" stroke="#3f9a52" stroke-width="5" fill="none" stroke-linecap="round"/>`;
  const leaf = (y, dir) => `<path d="M50 ${y} q${dir * 16} -10 ${dir * 22} 2 q${-dir * 12} 8 ${-dir * 22} -2Z" fill="#56b866"/>`;
  let s = "";
  if (v === 1) s = `<rect x="44" y="96" width="12" height="24" rx="5" fill="#efe3cf"/><path d="M28 98 Q50 70 72 98 Z" fill="var(--m1)"/><circle cx="41" cy="88" r="3" fill="#fff" opacity=".8"/><circle cx="57" cy="85" r="2.5" fill="#fff" opacity=".8"/>`;
  else if (v === 2) s = stem(34) + leaf(100, -1) + leaf(92, 1) + `<circle cx="50" cy="84" r="6" fill="var(--m2)"/>`;
  else if (v === 3) s = stem(54) + leaf(102, -1) + `<path d="M38 72 Q38 52 44 58 Q50 46 56 58 Q62 52 62 72 Q50 82 38 72Z" fill="var(--m3)"/>`;
  else if (v === 4) {
    s = stem(62) + leaf(104, 1) + leaf(94, -1);
    for (let i = 0; i < 10; i++) s += `<ellipse cx="50" cy="45" rx="5" ry="12" fill="#fff" transform="rotate(${i * 36} 50 58)"/>`;
    s += `<circle cx="50" cy="58" r="7" fill="var(--m4)"/>`;
  } else {
    s = stem(80) + leaf(106, -1) + leaf(96, 1) + leaf(84, -1);
    for (let i = 0; i < 14; i++) s += `<ellipse cx="50" cy="20" rx="6" ry="13" fill="var(--m3)" transform="rotate(${i * 25.7} 50 38)"/>`;
    s += `<circle cx="50" cy="38" r="11" fill="#7a4a1f"/><circle cx="50" cy="38" r="11" fill="var(--m5)" opacity=".35"/>`;
  }
  return `<svg viewBox="18 0 64 124" aria-hidden="true"><g class="${grow ? "grow" : "sway"}">${s}</g></svg>`;
}
const emptyPlot = () => `<svg viewBox="18 0 64 124" aria-hidden="true"><ellipse cx="50" cy="118" rx="16" ry="4" fill="var(--soil2)" opacity=".5"/></svg>`;

export function renderGarden(root, P, save, onClose) {
  P.garden ||= {};
  const data = P.garden;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayKey = iso(today);
  let weekStart = monday(today), picked = data[todayKey]?.v || 0, justPlanted = false;
  const G = T.garden;

  root.innerHTML = "";
  const head = el("div", "sheet-head"); head.append(el("h2", "", G.title));
  const close = el("button", "ghost", T.close); close.type = "button"; close.onclick = onClose; head.append(close);
  root.append(head, el("p", "fine", G.lead));

  // Today's check-in
  const card = el("section", "sec"); card.append(el("h3", "", G.question));
  const moods = el("div", "moods"); card.append(moods);
  const note = el("textarea", "gnote"); note.id = "gardenNote"; note.maxLength = 140; note.rows = 2; note.placeholder = G.notePh; note.value = data[todayKey]?.note || "";
  card.append(note);
  const row = el("div", "btnrow"); const plant = el("button", "primary"); plant.type = "button";
  const msg = el("p", "fine"); row.append(plant); card.append(row, msg);
  root.append(card);

  // Garden
  const gsec = el("section", "sec");
  const nav = el("div", "weeknav");
  const prev = el("button", "ghost", "‹ " + G.prev); prev.type = "button";
  const label = el("strong", "wlabel");
  const next = el("button", "ghost", G.next + " ›"); next.type = "button";
  nav.append(prev, label, next);
  const garden = el("div", "garden"); const plots = el("div", "plots"); const ground = el("div", "ground");
  const example = el("p", "example", G.example);
  garden.append(plots, ground, example);
  const detail = el("p", "fine", G.tapHint); detail.setAttribute("aria-live", "polite");
  gsec.append(nav, garden, detail);
  root.append(gsec);

  // Stats
  const ssec = el("section", "sec"); ssec.append(el("h3", "", G.statsTitle));
  const stats = el("div", "gstats"); ssec.append(stats); root.append(ssec);

  // Month: one dot per day, in the color of that day's mood
  const msec = el("section", "sec");
  const mnav = el("div", "weeknav");
  const mprev = el("button", "ghost", "‹"); mprev.type = "button"; mprev.setAttribute("aria-label", G.prev);
  const mlabel = el("strong", "wlabel");
  const mnext = el("button", "ghost", "›"); mnext.type = "button"; mnext.setAttribute("aria-label", G.next);
  mnav.append(mprev, mlabel, mnext);
  const mgrid = el("div", "month");
  const mdetail = el("p", "fine", X().monthLegend); mdetail.setAttribute("aria-live", "polite");
  msec.append(el("h3", "", X().monthH), mnav, mgrid, mdetail); root.append(msec);
  let monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  function paintMonth() {
    mlabel.textContent = monthStart.toLocaleDateString(LANG.speech, { month: "long", year: "numeric" });
    mnext.disabled = monthStart.getFullYear() === today.getFullYear() && monthStart.getMonth() === today.getMonth();
    mgrid.innerHTML = "";
    const ref = monday(today);
    for (let i = 0; i < 7; i++) { const d = new Date(ref); d.setDate(d.getDate() + i); mgrid.append(el("span", "mhead", d.toLocaleDateString(LANG.speech, { weekday: "narrow" }))); }
    for (let i = 0; i < (monthStart.getDay() + 6) % 7; i++) mgrid.append(el("span", "mblank"));
    const days = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate();
    for (let n = 1; n <= days; n++) {
      const d = new Date(monthStart.getFullYear(), monthStart.getMonth(), n), k = iso(d), e = data[k];
      const b = el("button", "mday" + (e ? " m" + e.v : "") + (k === todayKey ? " today" : ""), String(n)); b.type = "button";
      const long = d.toLocaleDateString(LANG.speech, { weekday: "long", day: "numeric", month: "long" });
      b.setAttribute("aria-label", `${long} : ${e ? G.moods[e.v - 1] : X().monthNone}`);
      b.disabled = d > today;
      b.onclick = () => { mdetail.textContent = e ? `${long} : ${G.moods[e.v - 1]}${e.note ? ` · « ${e.note} »` : ""}` : `${long} : ${G.nothing}`; };
      mgrid.append(b);
    }
  }
  mprev.onclick = () => { monthStart = new Date(monthStart.getFullYear(), monthStart.getMonth() - 1, 1); paintMonth(); };
  mnext.onclick = () => { monthStart = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1); paintMonth(); };

  function paintMoods() {
    moods.innerHTML = "";
    G.moods.forEach((name, i) => {
      const v = i + 1, b = el("button", "gmood"); b.type = "button"; b.setAttribute("aria-pressed", String(picked === v));
      b.innerHTML = moodIcon(v); b.append(el("span", "", name));
      b.onclick = () => { picked = v; paintMoods(); };
      moods.append(b);
    });
    plant.textContent = data[todayKey] ? G.update : G.plant;
    plant.disabled = !picked;
  }
  plant.onclick = () => {
    if (!picked) return;
    data[todayKey] = { v: picked, note: note.value.trim().slice(0, 140) };
    save(); justPlanted = true; weekStart = monday(today);
    msg.textContent = G.planted(G.plants[picked - 1]);
    paintMoods(); paintGarden(); paintStats(); paintMonth(); justPlanted = false;
  };
  const SAMPLE = [4, 3, 5, 2, 4, 5, 3];
  function paintGarden() {
    const isEmpty = Object.keys(data).length === 0;
    example.hidden = !isEmpty;
    const end = new Date(weekStart); end.setDate(end.getDate() + 6);
    const fmt = d => d.toLocaleDateString(LANG.speech, { day: "numeric", month: "short" });
    label.textContent = `${fmt(weekStart)} – ${fmt(end)}`;
    next.disabled = weekStart >= monday(today);
    plots.innerHTML = "";
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart); d.setDate(d.getDate() + i);
      const k = iso(d), e = isEmpty ? { v: SAMPLE[i] } : data[k];
      const plot = el("div", "plot" + (k === todayKey ? " today" : ""));
      const b = el("button"); b.type = "button";
      b.innerHTML = e ? plantSVG(e.v, justPlanted && k === todayKey) : emptyPlot();
      const dl = d.toLocaleDateString(LANG.speech, { weekday: "short" }).replace(".", "") + " " + d.getDate();
      b.setAttribute("aria-label", e ? `${dl} : ${G.moods[e.v - 1]}` : `${dl} : ${G.nothing}`);
      b.onclick = () => {
        if (isEmpty) { detail.textContent = G.exampleTap; return; }
        const long = d.toLocaleDateString(LANG.speech, { weekday: "long", day: "numeric", month: "long" });
        detail.textContent = e ? `${long} : ${G.moods[e.v - 1]} (${G.plants[e.v - 1]})${e.note ? ` · « ${e.note} »` : ""}` : `${long} : ${G.nothing}`;
      };
      b.append(el("span", "day", dl));
      plot.append(b); plots.append(plot);
    }
  }
  prev.onclick = () => { weekStart.setDate(weekStart.getDate() - 7); paintGarden(); };
  next.onclick = () => { weekStart.setDate(weekStart.getDate() + 7); paintGarden(); };
  function paintStats() {
    const keys = Object.keys(data);
    let streak = 0; const d = new Date(today);
    if (!data[iso(d)]) d.setDate(d.getDate() - 1);
    while (data[iso(d)]) { streak++; d.setDate(d.getDate() - 1); }
    const counts = {}; for (const k of keys) counts[data[k].v] = (counts[data[k].v] || 0) + 1;
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1] || b[0] - a[0])[0];
    stats.innerHTML = "";
    for (const [n, l] of [[keys.length, G.sPlants], [streak, G.sStreak], [top ? G.moods[top[0] - 1] : "–", G.sTop]]) {
      const s = el("div", "gstat"); s.append(el("b", "", String(n)), el("span", "", l)); stats.append(s);
    }
  }
  paintMoods(); paintGarden(); paintStats(); paintMonth();
}

// For the header button: has today's plant been planted yet?
export const plantedToday = P => { const d = new Date(); return !!P?.garden?.[iso(d)]; };
