// "My journal": a private diary. Pages stay on this device only, in their own storage:
// they are never part of what is sent to an AI, and opening the journal asks for the
// 4-digit code when one is set.
import { LANG } from "./i18n.js";
import { isSevere } from "./safety.js";

const KEY = "friend.journal", MAX_PAGES = 500, MAX_CHARS = 4000;
const J = {
  fr: {
    tile: ["📔", "Mon journal", "Écris pour toi. Rien ne quitte ton téléphone"], title: "Mon journal",
    lead: "Ton journal reste sur cet appareil. Aucune IA ne le lit, et rien n'est envoyé sur internet.",
    noPin: "Ton journal n'est pas protégé par un code.", setPin: "Choisir un code",
    ph: "Écris ce que tu veux : ta journée, ce que tu ressens, une idée…", idea: "Une idée pour commencer", mood: "Mon humeur (si tu veux)",
    save: "Enregistrer la page", update: "Enregistrer les changements", cancel: "Annuler", need: "Écris quelques mots d'abord.",
    saved: "C'est écrit. Merci de t'être confié à ton journal.", full: "Ton journal est plein. Supprime d'anciennes pages pour continuer.",
    pages: n => n > 1 ? `${n} pages` : n === 1 ? "1 page" : "Aucune page pour l'instant", empty: "Ta première page t'attend.",
    search: "Chercher dans mon journal", none: "Aucune page ne contient ces mots.",
    edit: "Modifier", del: "Supprimer", sure: "Supprimer pour toujours ?", yes: "Oui, supprimer", more: "Lire la suite",
    know: n => `Journal : ${n > 1 ? n + " pages" : n + " page"}, sur cet appareil seulement. Aucune IA ne le lit.`,
    backup: "La sauvegarde contient aussi ton journal : garde ce fichier dans un endroit sûr.",
    ideas: ["Un moment de ma journée que je veux garder…", "Aujourd'hui, j'ai ressenti…", "Une chose qui m'a fait sourire…", "Ce qui me trotte dans la tête en ce moment…", "Si je pouvais dire une chose à quelqu'un, ce serait…", "Une chose dont je suis fier cette semaine…", "Demain, j'aimerais…", "Un endroit où je me sens bien, et pourquoi…"]
  },
  en: {
    tile: ["📔", "My journal", "Write for yourself. Nothing leaves your phone"], title: "My journal",
    lead: "Your journal stays on this device. No AI reads it, and nothing is sent over the internet.",
    noPin: "Your journal isn't protected by a code.", setPin: "Choose a code",
    ph: "Write whatever you want: your day, how you feel, an idea…", idea: "An idea to get started", mood: "My mood (if you like)",
    save: "Save the page", update: "Save changes", cancel: "Cancel", need: "Write a few words first.",
    saved: "It's written. Thanks for confiding in your journal.", full: "Your journal is full. Delete older pages to keep going.",
    pages: n => n > 1 ? `${n} pages` : n === 1 ? "1 page" : "No pages yet", empty: "Your first page is waiting.",
    search: "Search my journal", none: "No page contains those words.",
    edit: "Edit", del: "Delete", sure: "Delete forever?", yes: "Yes, delete", more: "Read more",
    know: n => `Journal: ${n} page${n > 1 ? "s" : ""}, on this device only. No AI reads it.`,
    backup: "The backup also contains your journal: keep that file somewhere safe.",
    ideas: ["A moment from today I want to keep…", "Today, I felt…", "Something that made me smile…", "What's on my mind right now…", "If I could tell someone one thing, it would be…", "Something I'm proud of this week…", "Tomorrow, I'd like to…", "A place where I feel good, and why…"]
  },
  es: {
    tile: ["📔", "Mi diario", "Escribe para ti. Nada sale de tu teléfono"], title: "Mi diario",
    lead: "Tu diario se queda en este dispositivo. Ninguna IA lo lee y nada se envía por internet.",
    noPin: "Tu diario no está protegido con un código.", setPin: "Elegir un código",
    ph: "Escribe lo que quieras: tu día, lo que sientes, una idea…", idea: "Una idea para empezar", mood: "Mi ánimo (si quieres)",
    save: "Guardar la página", update: "Guardar los cambios", cancel: "Cancelar", need: "Escribe unas palabras primero.",
    saved: "Ya está escrito. Gracias por confiar en tu diario.", full: "Tu diario está lleno. Borra páginas antiguas para seguir.",
    pages: n => n > 1 ? `${n} páginas` : n === 1 ? "1 página" : "Todavía no hay páginas", empty: "Tu primera página te espera.",
    search: "Buscar en mi diario", none: "Ninguna página contiene esas palabras.",
    edit: "Editar", del: "Eliminar", sure: "¿Eliminar para siempre?", yes: "Sí, eliminar", more: "Leer más",
    know: n => `Diario: ${n} página${n > 1 ? "s" : ""}, solo en este dispositivo. Ninguna IA lo lee.`,
    backup: "La copia de seguridad también contiene tu diario: guarda ese archivo en un lugar seguro.",
    ideas: ["Un momento de hoy que quiero guardar…", "Hoy sentí…", "Algo que me hizo sonreír…", "Lo que me ronda la cabeza ahora…", "Si pudiera decirle una cosa a alguien, sería…", "Algo de lo que estoy orgulloso esta semana…", "Mañana me gustaría…", "Un lugar donde me siento bien, y por qué…"]
  }
};
export const JW = () => J[LANG.code] || J.en;
const MOODS = ["😢", "😟", "😐", "🙂", "😄"];

/* ---------- Storage ---------- */
function read() { try { const a = JSON.parse(localStorage.getItem(KEY)); return Array.isArray(a) ? a : []; } catch { return []; } }
function write(list) { try { localStorage.setItem(KEY, JSON.stringify(list)); return true; } catch { return false; } }
// Only well-formed pages are kept, whatever file they come from.
const valid = p => p && typeof p.text === "string" && p.text.trim() && Number.isFinite(p.at);
const tidyPage = p => ({ id: String(p.id || p.at), at: p.at, text: p.text.slice(0, MAX_CHARS), mood: MOODS[p.mood - 1] ? p.mood : 0 });
export const journalCount = () => read().length;
export const wipeJournal = () => { try { localStorage.removeItem(KEY); } catch {} };
export const exportJournal = () => read();
export function importJournal(list) {
  if (!Array.isArray(list)) return 0;
  const pages = list.filter(valid).map(tidyPage).sort((a, b) => b.at - a.at).slice(0, MAX_PAGES);
  write(pages); return pages.length;
}

const el = (tag, cls, text) => { const x = document.createElement(tag); if (cls) x.className = cls; if (text != null) x.textContent = text; return x; };
const btn = (text, cls, fn) => { const b = el("button", cls, text); b.type = "button"; b.onclick = fn; return b; };
const when = t => new Date(t).toLocaleDateString(LANG.speech, { weekday: "long", day: "numeric", month: "long", year: "numeric" }) + " · " + new Date(t).toLocaleTimeString(LANG.speech, { hour: "2-digit", minute: "2-digit" });
const plain = s => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

/* ---------- Screen ---------- */
// ctx: { toast, hasPin(), setPin(), help() }
export function renderJournal(root, ctx) {
  const j = JW();
  root.append(el("p", "fine", j.lead));
  if (!ctx.hasPin()) {
    const warn = el("div", "jr-warn"); warn.append(el("span", "", "🔓 " + j.noPin), btn(j.setPin, "chip", () => ctx.setPin()));
    root.append(warn);
  }
  const writer = el("section", "sec"), listBox = el("section", "sec");
  root.append(writer, listBox);
  let editing = null, ideaAt = Math.floor(Math.random() * j.ideas.length), filter = "";

  function paintWriter() {
    writer.innerHTML = "";
    const page = editing ? read().find(p => p.id === editing) : null;
    const ta = el("textarea", "gnote jr-text"); ta.id = "jrText"; ta.rows = 6; ta.maxLength = MAX_CHARS; ta.placeholder = j.ph; ta.setAttribute("aria-label", j.title);
    if (page) ta.value = page.text;
    let mood = page?.mood || 0;
    const moods = el("div", "jr-moods"); moods.setAttribute("role", "group"); moods.setAttribute("aria-label", j.mood);
    MOODS.forEach((m, i) => {
      const b = el("button", "jr-mood" + (mood === i + 1 ? " on" : ""), m); b.type = "button"; b.setAttribute("aria-pressed", String(mood === i + 1));
      b.onclick = () => { mood = mood === i + 1 ? 0 : i + 1; [...moods.children].forEach((c, k) => { c.classList.toggle("on", mood === k + 1); c.setAttribute("aria-pressed", String(mood === k + 1)); }); };
      moods.append(b);
    });
    const msg = el("p", "fine"); msg.setAttribute("aria-live", "polite");
    const row = el("div", "btnrow");
    row.append(btn(page ? j.update : j.save, "primary", () => {
      const text = ta.value.trim();
      if (!text) { msg.textContent = j.need; ta.focus(); return; }
      const list = read();
      if (page) { const p = list.find(x => x.id === page.id); if (p) { p.text = text.slice(0, MAX_CHARS); p.mood = mood; } }
      else {
        if (list.length >= MAX_PAGES) { msg.textContent = j.full; return; }
        list.unshift({ id: String(Date.now()), at: Date.now(), text: text.slice(0, MAX_CHARS), mood });
      }
      if (!write(list)) { msg.textContent = j.full; return; }
      editing = null; paintWriter(); paintList(); ctx.toast(j.saved);
      // The app's own safety net works here too, without any AI: real help is shown when a page is very serious.
      if (isSevere(text)) ctx.help();
    }));
    if (page) row.append(btn(j.cancel, "ghost", () => { editing = null; paintWriter(); }));
    else row.append(btn(j.idea, "ghost", () => { ideaAt = (ideaAt + 1) % j.ideas.length; if (!ta.value.trim() || j.ideas.includes(ta.value.trim())) ta.value = j.ideas[ideaAt] + " "; ta.focus(); }));
    writer.append(ta, el("p", "sub", j.mood), moods, row, msg);
  }

  function paintList() {
    listBox.innerHTML = "";
    const all = read();
    listBox.append(el("h3", "", j.pages(all.length)));
    if (!all.length) { listBox.append(el("p", "empty", j.empty)); return; }
    if (all.length > 4) {
      const s = el("input", "input"); s.type = "search"; s.id = "jrSearch"; s.placeholder = j.search; s.setAttribute("aria-label", j.search); s.value = filter;
      s.oninput = () => { filter = s.value; paintPages(); };
      listBox.append(s);
    }
    const pagesBox = el("div", "jr-pages"); listBox.append(pagesBox);
    function paintPages() {
      pagesBox.innerHTML = "";
      const f = plain(filter.trim()), shown = f ? all.filter(p => plain(p.text).includes(f)) : all;
      if (!shown.length) { pagesBox.append(el("p", "empty", j.none)); return; }
      for (const p of shown.slice(0, 60)) {
        const card = el("article", "jr-page");
        card.append(el("p", "jr-date", (MOODS[p.mood - 1] ? MOODS[p.mood - 1] + " " : "") + when(p.at)));
        const body = el("p", "jr-body", p.text);
        if (p.text.length > 280) { body.classList.add("clip"); const more = btn(j.more, "link", () => { body.classList.remove("clip"); more.remove(); }); card.append(body, more); }
        else card.append(body);
        const row = el("div", "btnrow");
        row.append(btn(j.edit, "ghost", () => { editing = p.id; paintWriter(); writer.scrollIntoView({ block: "start" }); }));
        const del = btn(j.del, "ghost danger", () => {
          row.innerHTML = ""; row.append(el("span", "fine", j.sure), btn(j.yes, "ghost danger", () => { write(read().filter(x => x.id !== p.id)); if (editing === p.id) { editing = null; paintWriter(); } paintList(); }), btn(j.cancel, "ghost", paintPages));
        });
        row.append(del); card.append(row); pagesBox.append(card);
      }
    }
    paintPages();
  }
  paintWriter(); paintList();
}
