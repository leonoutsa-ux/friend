// Safety rules that live in the app itself, so they work even when the AI gets it wrong.
// They only react to VERY serious situations: thoughts of suicide or self-harm,
// abuse, or immediate danger. Sadness, stress or a bad day never trigger them.

const norm = t => (t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[’`]/g, "'");

const SEVERE = [
  // French: suicide and self-harm
  /\b(me|m')\s*(suicider|tuer|pendre)\b/, /\bsuicid/, /envie\s+de\s+(mourir|disparaitre\s+pour\s+toujours)/, /\bveux\s+mourir\b/,
  /\ben\s+finir\s+avec\s+(la|ma)\s+vie\b/, /\bje\s+veux\s+en\s+finir\b/, /plus\s+envie\s+de\s+vivre/, /\bmettre\s+fin\s+a\s+mes\s+jours\b/,
  /\bme\s+faire\s+du\s+mal\b/, /\bme\s+(couper|scarifier|mutiler|bruler)\b/, /\bscarif/, /\bautomutil/, /\boverdose\b/,
  /\bsauter\s+(du|d'un|par\s+la)\s+(pont|toit|fenetre|immeuble)/,
  // French: abuse and danger
  /\bme\s+(frappe|bat|battent|frappent)\b/, /\bm'a\s+(frappe|battu|abuse|viole|agresse)/, /\babus(e|ee)?\s+(de\s+)?moi\b/, /\battouchement/,
  /\bviol(e|ee|er)?\b/, /\bagress(e|ee|ion)\s+sexuel/, /\bje\s+suis\s+en\s+danger\b/, /\bva\s+me\s+tuer\b/, /\bpeur\s+qu'?(il|elle|ils)\s+me\s+(tue|frappe)/,
  // English
  /\bkill(ing)?\s+myself\b/, /\bend\s+(my\s+life|it\s+all)\b/, /\bwant\s+to\s+die\b/, /\bdon'?t\s+want\s+to\s+(live|be\s+alive)\b/,
  /\bhurt(ing)?\s+myself\b/, /\bself[-\s]?harm/, /\bcut(ting)?\s+myself\b/, /\b(hits|beats|beat|hit)\s+me\b/, /\babus(es|ed|ing)\s+me\b/,
  /\brap(e|ed)\b/, /\btouch(es|ed)\s+me\s+(inappropriately|there)\b/, /\bi'?m\s+in\s+danger\b/, /\bgoing\s+to\s+kill\s+me\b/
];

export function isSevere(text) {
  const t = norm(text);
  return SEVERE.some(r => r.test(t));
}

// Memories are never allowed to hold these, whatever the AI suggests.
const NEVER_KEEP = [
  /suicid/, /mourir/, /\bdie\b/, /scarif/, /mutil/, /self[-\s]?harm/, /\bcut\b.*\bmyself\b/, /\bcoup(e|er)\b.*\bme\b/,
  /\babus/, /\bviol(e|ee)?\b/, /\brap(e|ed)\b/, /attouchement/, /frapp/, /\bbat\b/, /\bbeat/, /\bhit\b/, /agress/, /\bcrime/, /police/,
  /drogue/, /\bdrug/, /alcool/, /alcohol/, /malad/, /diagnos/, /illness/, /disorder/, /trouble\s+(alimentaire|mental)/, /anorex/, /boulim/, /depress/,
  /sexe|sexuel|sexual/, /mot\s+de\s+passe|password/, /adresse|address/, /@/, /\d[\d\s-]{6,}\d/
];
export function safeMemory(line) {
  const t = norm(line);
  return line.trim().length > 2 && !NEVER_KEEP.some(r => r.test(t));
}
