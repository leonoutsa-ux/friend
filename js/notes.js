// Friend learns without any AI: a few simple sentence shapes ("j'adore…", "mon chien s'appelle…")
// are turned into short memories. Used when no AI is there to write them (no internet, no small AI).
// Nothing sad or sensitive is ever kept: the same safety filter as the AI's memories applies.
import { LANG } from "./i18n.js";
import { isSevere, safeMemory } from "./safety.js";

const END = "(?=\\s*(?:[.,!?;:\\n]|$)|\\s+(?:mais|et|parce|car|quand|depuis|surtout|sauf|but|and|because|when|since|pero|porque|cuando|desde)\\b)";
const NAME = "([A-ZÀ-ÖØ-Þ][\\p{L}'-]{1,20})";
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const tidy = s => s.replace(/\s+/g, " ").replace(/^["«»“”' ]+|["«»“”' ]+$/g, "").trim();
const re = (src, flags = "iu") => new RegExp(src, flags);
// "mon chien" said by the person becomes "son chien" in Friend's notes.
const THIRD = {
  fr: s => s.replace(/^mon\b/i, "son").replace(/^ma\b/i, "sa").replace(/^mes\b/i, "ses"),
  en: s => s.replace(/^my\b/i, "their"),
  es: s => s.replace(/^mis\b/i, "sus").replace(/^mi\b/i, "su")
};

// Each rule: [pattern, function that writes the memory from the match].
const RULES = {
  fr: {
    skip: /^(pas|plus|ça|ca|quand|qu'|que|bien quand|lui|elle|toi|vous|le fait|trop quand|personne|rien)\b/i,
    list: [
      [re(`\\bj['e ]\\s?(?:adore|aime(?:\\s+(?:bien|beaucoup|trop|vraiment))?|kiffe)\\s+(.{3,40}?)${END}`), m => `Aime ${m[1]}`],
      [re(`\\bmon\\s+(chien|chat|lapin|hamster|cheval|poisson|perroquet|cochon d'inde)\\s+s'appelle\\s+${NAME}`), m => `A un ${m[1].toLowerCase()} nommé ${m[2]}`],
      [re(`\\bma\\s+(chienne|chatte|tortue|jument|perruche)\\s+s'appelle\\s+${NAME}`), m => `A une ${m[1].toLowerCase()} nommée ${m[2]}`],
      [re(`\\bmon\\s+(frère|meilleur ami|ami|copain|cousin|pote|grand-père|papi)\\s+s'appelle\\s+${NAME}`), m => `Son ${m[1].toLowerCase()} s'appelle ${m[2]}`],
      [re(`\\bma\\s+(sœur|soeur|meilleure amie|amie|copine|cousine|grand-mère|mamie)\\s+s'appelle\\s+${NAME}`), m => `Sa ${m[1].toLowerCase()} s'appelle ${m[2]}`],
      [re(`\\bje\\s+(?:fais|pratique)\\s+(du|de la|de l'|des)\\s*(.{3,25}?)${END}`), m => `Fait ${m[1].toLowerCase()}${m[1].endsWith("'") ? "" : " "}${m[2]}`],
      [re(`\\bje\\s+joue\\s+(au|à la|aux|du|de la|à)\\s+(.{3,25}?)${END}`), m => `Joue ${m[1].toLowerCase()} ${m[2]}`],
      [re(`\\bje\\s+(?:veux|voudrais|rêve de)\\s+(?:devenir|être)\\s+(.{3,30}?)${END}`), m => `Veut devenir ${m[1]}`],
      [re(`\\bmon\\s+(film|jeu|livre|manga|animé|anime|sport|plat|chanteur|groupe|youtubeur|dessin animé)\\s+préféré,?\\s+c'est\\s+(.{2,40}?)${END}`), m => `Son ${m[1].toLowerCase()} préféré : ${m[2]}`],
      [re(`\\bma\\s+(série|chanson|matière|couleur|chanteuse|saison)\\s+préférée,?\\s+c'est\\s+(.{2,40}?)${END}`), m => `Sa ${m[1].toLowerCase()} préférée : ${m[2]}`]
    ]
  },
  en: {
    skip: /^(him|her|them|you|it|that|this|when|how|to be|not|n't|nobody|nothing|anyone)\b/i,
    list: [
      [re(`\\bi\\s+(?:really\\s+)?(?:love|like|enjoy|adore)\\s+(.{3,40}?)${END}`), m => `Loves ${m[1]}`],
      [re(`\\bmy\\s+(dog|cat|rabbit|hamster|horse|fish|bird|parrot|turtle)(?:'s name)?\\s+is(?:\\s+(?:called|named))?\\s+${NAME}`), m => `Has a ${m[1].toLowerCase()} named ${m[2]}`],
      [re(`\\bmy\\s+(brother|sister|best friend|friend|cousin|boyfriend|girlfriend|grandma|grandpa)(?:\\s+is\\s+(?:called|named)|'s name is)\\s+${NAME}`), m => `Their ${m[1].toLowerCase()} is called ${m[2]}`],
      [re(`\\bi\\s+play\\s+(.{3,25}?)${END}`), m => `Plays ${m[1]}`],
      [re(`\\bi\\s+want\\s+to\\s+(?:be|become)\\s+(an?\\s+.{3,30}?)${END}`), m => `Wants to become ${m[1]}`],
      [re(`\\bmy\\s+fav(?:ou?rite)?\\s+(movie|game|book|show|sport|food|band|singer|subject|colou?r|anime|manga|song)\\s+is\\s+(.{2,40}?)${END}`), m => `Favorite ${m[1].toLowerCase()}: ${m[2]}`]
    ]
  },
  es: {
    skip: /^(él|ella|ellos|tú|ti|eso|esto|cuando|cómo|que|nada|nadie|no)\b/i,
    list: [
      [re(`\\bme\\s+(?:encantan?|gustan?(?:\\s+mucho)?)\\s+(.{3,40}?)${END}`), m => `Le gusta ${m[1]}`],
      [re(`\\bmi\\s+(perro|gato|conejo|hámster|caballo|pez|loro)\\s+se\\s+llama\\s+${NAME}`), m => `Tiene un ${m[1].toLowerCase()} llamado ${m[2]}`],
      [re(`\\bmi\\s+(perra|gata|tortuga|yegua)\\s+se\\s+llama\\s+${NAME}`), m => `Tiene una ${m[1].toLowerCase()} llamada ${m[2]}`],
      [re(`\\bmi\\s+(hermano|hermana|mejor amigo|mejor amiga|amigo|amiga|primo|prima|novio|novia|abuelo|abuela)\\s+se\\s+llama\\s+${NAME}`), m => `Su ${m[1].toLowerCase()} se llama ${m[2]}`],
      [re(`\\bjuego\\s+(al|a la|a)\\s+(.{3,25}?)${END}`), m => `Juega ${m[1].toLowerCase()} ${m[2]}`],
      [re(`\\bquiero\\s+ser\\s+(.{3,30}?)${END}`), m => `Quiere ser ${m[1]}`],
      [re(`\\bmi\\s+(película|juego|libro|serie|deporte|comida|grupo|cantante|materia|color|anime|manga|canción)\\s+favorit[oa]\\s+es\\s+(.{2,40}?)${END}`), m => `Favorito (${m[1].toLowerCase()}): ${m[2]}`]
    ]
  }
};

// Short memories found in one message. Empty when the message is serious or nothing fits.
export function gleanMemories(text) {
  const t = String(text || "");
  if (!t.trim() || t.length > 600 || isSevere(t)) return [];
  const R = RULES[LANG.code] || RULES.en, out = [];
  for (const [pattern, write] of R.list) {
    const m = t.match(pattern);
    if (!m) continue;
    const said = tidy(m[m.length - 1]);
    if (!said || R.skip.test(said)) continue;
    const third = THIRD[LANG.code] || THIRD.en;
    const parts = m.map(x => (x == null ? x : tidy(x))); parts[parts.length - 1] = third(parts[parts.length - 1]);
    const line = cap(tidy(write(parts)));
    if (line.length < 6 || line.length > 70 || !safeMemory(line)) continue;
    out.push(line);
  }
  return out.slice(0, 2);
}

// Adds new memories to the list, without doubles, and keeps the list short (oldest ones go first).
const key = s => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
export function addMemories(list, fresh, max = 10) {
  const have = new Set(list.map(key)); let added = 0;
  for (const line of fresh) { if (have.has(key(line))) continue; have.add(key(line)); list.push(line); added++; }
  while (list.length > max) list.shift();
  return added;
}
