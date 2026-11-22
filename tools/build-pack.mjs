// Builds Friend's "knowledge pack": short introductions of school topics, taken from Wikipedia
// (text under the CC BY-SA 4.0 licence) so the app can answer them without internet.
// Run by the GitHub workflow in .github/workflows/pack.yml; writes packs/pack-<lang>.json.
import fs from "node:fs";

const topics = JSON.parse(fs.readFileSync(new URL("./pack-topics.json", import.meta.url), "utf8"));
const UA = "FriendKnowledgePack/1.0 (https://github.com/leonoutsa-ux/friend)";
const sleep = ms => new Promise(r => setTimeout(r, ms));
const MAX = 900;

// "Alias1,Alias2=Title" or just "Title".
function parse(entry) {
  const i = entry.indexOf("=");
  if (i < 0) return { title: entry, keys: [entry] };
  return { title: entry.slice(i + 1), keys: entry.slice(0, i).split(",").map(s => s.trim()).filter(Boolean) };
}
// Keeps whole sentences, up to MAX characters, and drops pronunciation brackets.
function shorten(text) {
  let t = String(text || "").replace(/\s*\([^()]*(?:\/|API|prononc|pronunci|écouter|listen)[^()]*\)/gi, "").replace(/\[[^\]]*\]/g, "").replace(/\s+/g, " ").trim();
  if (t.length <= MAX) return t;
  const cut = t.slice(0, MAX), end = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("! "), cut.lastIndexOf("? "));
  return end > 200 ? cut.slice(0, end + 1) : cut.replace(/\s+\S*$/, "") + "…";
}
async function api(lang, titles) {
  const url = `https://${lang}.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(titles.join("|"))}&redirects=1&prop=extracts%7Cpageprops&exintro=1&explaintext=1&exlimit=20&ppprop=disambiguation&format=json&formatversion=2`;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const r = await fetch(url, { headers: { "user-agent": UA, accept: "application/json" } });
      if (r.ok) return await r.json();
      console.warn(lang, "HTTP", r.status);
    } catch (e) { console.warn(lang, String(e)); }
    await sleep(3000 * (attempt + 1));
  }
  return null;
}

fs.mkdirSync(new URL("../packs/", import.meta.url), { recursive: true });
const report = {};
for (const [lang, list] of Object.entries(topics)) {
  const wanted = list.map(parse), items = [], rep = { asked: wanted.length, got: 0, missing: [], disambiguation: [], short: [], failed: 0 };
  for (let i = 0; i < wanted.length; i += 20) {
    const group = wanted.slice(i, i + 20);
    const data = await api(lang, group.map(g => g.title));
    await sleep(1200);
    if (!data?.query) { rep.failed += group.length; continue; }
    // Follow "normalized" and "redirects" to know which page answers which requested title.
    const hop = {};
    for (const n of data.query.normalized || []) hop[n.from] = n.to;
    for (const r of data.query.redirects || []) hop[r.from] = r.to;
    const pages = Object.fromEntries((data.query.pages || []).map(p => [p.title, p]));
    for (const g of group) {
      let t = g.title; for (let k = 0; k < 4 && hop[t]; k++) t = hop[t];
      const p = pages[t];
      if (!p || p.missing) { rep.missing.push(g.title); continue; }
      if (p.pageprops && "disambiguation" in p.pageprops) { rep.disambiguation.push(g.title); continue; }
      const x = shorten(p.extract);
      if (x.length < 80) { rep.short.push(g.title); continue; }
      const strip = s => s.replace(/\s*\([^)]*\)\s*$/, "");
      const keys = [...new Set([...g.keys.map(strip), strip(p.title)])];
      items.push({ t: p.title, k: keys, x });
    }
  }
  rep.got = items.length;
  report[lang] = rep;
  // An empty or tiny result means Wikipedia could not be reached: keep the previous pack.
  if (items.length >= wanted.length * 0.6) {
    fs.writeFileSync(new URL(`../packs/pack-${lang}.json`, import.meta.url), JSON.stringify({ v: 1, lang, source: "Wikipedia", licence: "CC BY-SA 4.0", url: `https://${lang}.wikipedia.org/wiki/`, items }));
  }
  console.log(lang, JSON.stringify(rep));
}
fs.writeFileSync(new URL("../packs/report.json", import.meta.url), JSON.stringify(report, null, 1));
