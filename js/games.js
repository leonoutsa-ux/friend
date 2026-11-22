// Two small games that work without internet and without any AI:
// "Paires" (find the matching cards) and "Mot mystère" (guess a 5-letter word in 6 tries).
import { LANG } from "./i18n.js";

const G = {
  fr: {
    memTile: ["🃏", "Paires", "Retrouve les cartes jumelles"], memTitle: "Paires", memLead: "Retourne deux cartes. Si elles sont pareilles, elles restent visibles. Un petit jeu pour se vider la tête.",
    moves: n => `${n} coup${n > 1 ? "s" : ""}`, best: n => `Ton record : ${n} coups`, won: n => `Bravo ! Toutes les paires en ${n} coups.`, record: "Nouveau record !",
    again: "Rejouer", star: "+1 ⭐", hidden: n => `Carte ${n}, cachée`, found: "trouvée",
    wordTile: ["🔤", "Mot mystère", "Devine le mot en 6 essais"], wordTitle: "Mot mystère",
    wordLead: "Trouve le mot de 5 lettres. Vert : bonne lettre, bonne place. Jaune : bonne lettre, mauvaise place. Gris : pas dans le mot.",
    wordPh: "5 lettres", wordTry: "Essayer", wordNeed: "Il faut exactement 5 lettres (sans accent).", wordWin: n => `Trouvé en ${n} essai${n > 1 ? "s" : ""} !`,
    wordLose: w => `Le mot était « ${w.toUpperCase()} ». Tu feras mieux au prochain !`, tries: (n, t) => `Essai ${n} sur ${t}`,
    state: { ok: "bonne place", near: "mauvaise place", no: "absente" }
  },
  en: {
    memTile: ["🃏", "Pairs", "Find the matching cards"], memTitle: "Pairs", memLead: "Flip two cards. If they match, they stay face up. A little game to clear your head.",
    moves: n => `${n} move${n > 1 ? "s" : ""}`, best: n => `Your best: ${n} moves`, won: n => `Well done! All pairs in ${n} moves.`, record: "New record!",
    again: "Play again", star: "+1 ⭐", hidden: n => `Card ${n}, face down`, found: "found",
    wordTile: ["🔤", "Mystery word", "Guess the word in 6 tries"], wordTitle: "Mystery word",
    wordLead: "Find the 5-letter word. Green: right letter, right spot. Yellow: right letter, wrong spot. Grey: not in the word.",
    wordPh: "5 letters", wordTry: "Try", wordNeed: "It needs exactly 5 letters.", wordWin: n => `Got it in ${n} ${n > 1 ? "tries" : "try"}!`,
    wordLose: w => `The word was "${w.toUpperCase()}". You'll get the next one!`, tries: (n, t) => `Try ${n} of ${t}`,
    state: { ok: "right spot", near: "wrong spot", no: "not in the word" }
  },
  es: {
    memTile: ["🃏", "Parejas", "Encuentra las cartas iguales"], memTitle: "Parejas", memLead: "Gira dos cartas. Si son iguales, se quedan a la vista. Un jueguito para despejar la cabeza.",
    moves: n => `${n} jugada${n > 1 ? "s" : ""}`, best: n => `Tu récord: ${n} jugadas`, won: n => `¡Bravo! Todas las parejas en ${n} jugadas.`, record: "¡Nuevo récord!",
    again: "Jugar otra vez", star: "+1 ⭐", hidden: n => `Carta ${n}, oculta`, found: "encontrada",
    wordTile: ["🔤", "Palabra misteriosa", "Adivina la palabra en 6 intentos"], wordTitle: "Palabra misteriosa",
    wordLead: "Encuentra la palabra de 5 letras. Verde: letra correcta en su sitio. Amarillo: letra correcta en otro sitio. Gris: no está en la palabra.",
    wordPh: "5 letras", wordTry: "Probar", wordNeed: "Hacen falta exactamente 5 letras (sin acentos).", wordWin: n => `¡Acertaste en ${n} intento${n > 1 ? "s" : ""}!`,
    wordLose: w => `La palabra era «${w.toUpperCase()}». ¡La próxima será tuya!`, tries: (n, t) => `Intento ${n} de ${t}`,
    state: { ok: "en su sitio", near: "en otro sitio", no: "no está" }
  }
};
export const GW = () => G[LANG.code] || G.en;
export const GAME_KEYS = ["memory", "word"];
export const gameTile = key => key === "memory" ? GW().memTile : GW().wordTile;
export const gameTitle = view => ({ memory: GW().memTitle, word: GW().wordTitle }[view]);

const WORDS = {
  fr: "pomme livre plage monde chien fleur arbre neige sable jouer danse table porte lampe route ville champ nuage pluie soupe sucre fruit poire tigre lapin singe piano rouge blanc jaune calme amour sport glace ombre vague terre magie reine herbe melon photo radio stylo crabe train avion jeudi lundi matin hiver pizza salut merci bravo super".split(" "),
  en: "apple beach bread chair cloud dance dream earth flame grape happy heart house juice light lemon magic music night ocean party peace piano pizza plant queen river robot shark smile snack space storm sunny tiger train water whale world zebra brave candy honey mango panda sweet laugh fresh green".split(" "),
  es: "playa libro perro mundo nieve arena jugar baile calle campo nubes fruta tigre piano verde negro calma hielo magia reina radio lunes tarde noche pizza feliz dulce panda cielo amigo fuego mango queso leche salsa coche barco globo gatos bravo".split(" ")
};
const FACES = ["🐶", "🐱", "🦊", "🐼", "🐸", "🦋", "🌸", "🌈", "⭐", "🍓", "🍉", "🎈", "🎸", "⚽", "🚀", "🌙", "🍀", "🐢"];

const el = (tag, cls, text) => { const x = document.createElement(tag); if (cls) x.className = cls; if (text != null) x.textContent = text; return x; };
const btn = (text, cls, fn) => { const b = el("button", cls, text); b.type = "button"; b.onclick = fn; return b; };
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const today = () => { const d = new Date(); return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate(); };

// One star a day for playing, whichever game is won first. `award(n)` is given by the activities sheet.
function dailyStar(ctx, award) {
  const st = (ctx.P.stats ||= {});
  if (st.gameDay === today()) return false;
  st.gameDay = today(); award(1); return true;
}

export function renderGame(view, root, ctx, award) {
  if (view === "memory") memory(root, ctx, award); else mystery(root, ctx, award);
}

/* ---------- Pairs ---------- */
function memory(root, ctx, award) {
  const g = GW(), st = (ctx.P.stats ||= {});
  root.append(el("p", "fine", g.memLead));
  const card = el("section", "sec"); root.append(card);
  start();
  function start() {
    card.innerHTML = "";
    const faces = shuffle([...FACES]).slice(0, 6), deck = shuffle([...faces, ...faces]);
    const info = el("p", "sub", st.memBest ? g.best(st.memBest) : g.moves(0)); info.setAttribute("aria-live", "polite");
    const grid = el("div", "mem-grid");
    let open = [], found = 0, moves = 0, lock = false;
    const cards = deck.map((face, i) => {
      const b = el("button", "mem-card"); b.type = "button"; b.setAttribute("aria-label", g.hidden(i + 1));
      b.onclick = () => {
        if (lock || b.classList.contains("up")) return;
        b.classList.add("up"); b.textContent = face; b.setAttribute("aria-label", face);
        open.push(b);
        if (open.length < 2) return;
        moves++; info.textContent = g.moves(moves);
        const [a, c] = open; open = [];
        if (a.textContent === c.textContent) {
          a.classList.add("done"); c.classList.add("done");
          a.setAttribute("aria-label", `${face}, ${g.found}`); c.setAttribute("aria-label", `${face}, ${g.found}`);
          if (++found === faces.length) finish();
        } else {
          lock = true;
          setTimeout(() => { for (const x of [a, c]) { x.classList.remove("up"); x.textContent = ""; x.setAttribute("aria-label", g.hidden(cards.indexOf(x) + 1)); } lock = false; }, 800);
        }
      };
      grid.append(b); return b;
    });
    card.append(info, grid);
    function finish() {
      const record = !st.memBest || moves < st.memBest;
      if (record) st.memBest = moves;
      st.memWins = (st.memWins || 0) + 1;
      const star = dailyStar(ctx, award);
      ctx.save();
      const end = el("p", "gwin", g.won(moves)); end.setAttribute("aria-live", "polite");
      card.append(end);
      if (record || star) card.append(el("p", "", [record ? g.record : "", star ? g.star : ""].filter(Boolean).join(" ")));
      const row = el("div", "btnrow"); row.append(btn(g.again, "primary", start)); card.append(row);
    }
  }
}

/* ---------- Mystery word ---------- */
const plain = s => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z]/g, "");
// Colours for one guess, counting each letter of the secret word only once.
export function judge(guess, secret) {
  const res = Array(5).fill("no"), left = {};
  for (let i = 0; i < 5; i++) { if (guess[i] === secret[i]) res[i] = "ok"; else left[secret[i]] = (left[secret[i]] || 0) + 1; }
  for (let i = 0; i < 5; i++) { if (res[i] === "ok") continue; if (left[guess[i]] > 0) { res[i] = "near"; left[guess[i]]--; } }
  return res;
}
function mystery(root, ctx, award) {
  const g = GW(), st = (ctx.P.stats ||= {}), list = WORDS[LANG.code] || WORDS.en, MAX = 6;
  root.append(el("p", "fine", g.wordLead));
  const card = el("section", "sec"); root.append(card);
  start();
  function start() {
    card.innerHTML = "";
    let secret = list[Math.floor(Math.random() * list.length)];
    if (secret === st.lastWord) secret = list[(list.indexOf(secret) + 1) % list.length];
    st.lastWord = secret;
    if (window.__friendMock?.word) secret = window.__friendMock.word;
    let tries = 0;
    const board = el("div", "word-board"); board.setAttribute("role", "list");
    const info = el("p", "sub", g.tries(1, MAX)); info.setAttribute("aria-live", "polite");
    const form = el("form", "word-form");
    const input = el("input", "input"); input.type = "text"; input.id = "wordGuess"; input.maxLength = 8; input.placeholder = g.wordPh;
    input.autocomplete = "off"; input.autocapitalize = "characters"; input.spellcheck = false; input.setAttribute("aria-label", g.wordPh);
    const go = el("button", "primary", g.wordTry); go.type = "submit";
    const msg = el("p", "fine"); msg.setAttribute("aria-live", "polite");
    form.append(input, go);
    form.onsubmit = e => {
      e.preventDefault();
      const guess = plain(input.value);
      if (guess.length !== 5) { msg.textContent = g.wordNeed; return; }
      msg.textContent = ""; input.value = ""; tries++;
      const res = judge(guess, secret), row = el("div", "word-row"); row.setAttribute("role", "listitem");
      row.setAttribute("aria-label", [...guess].map((c, i) => `${c.toUpperCase()} ${g.state[res[i]]}`).join(", "));
      [...guess].forEach((c, i) => row.append(el("span", "word-cell " + res[i], c.toUpperCase())));
      board.append(row);
      const won = guess === secret;
      if (won || tries >= MAX) {
        form.remove();
        if (won) st.wordWins = (st.wordWins || 0) + 1;
        const star = won && dailyStar(ctx, award);
        ctx.save();
        info.textContent = won ? g.wordWin(tries) + (star ? " " + g.star : "") : g.wordLose(secret);
        info.className = "gwin";
        const r = el("div", "btnrow"); r.append(btn(g.again, "primary", start)); card.append(r);
      } else { info.textContent = g.tries(tries + 1, MAX); input.focus(); }
    };
    card.append(info, board, form, msg);
  }
}
