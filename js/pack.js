// The "knowledge pack": short Wikipedia introductions of school topics (text under CC BY-SA 4.0),
// prepared in advance and hosted with Friend. Once downloaded, Friend can answer those
// questions without internet. Nothing personal is sent to get it: it is one fixed file.
import { LANG } from "./i18n.js";

const KEY = "friend.pack";
const PACK_LANGS = ["fr", "en", "es"];
export const packAvailable = () => PACK_LANGS.includes(LANG.code);

let cache;
function read() {
  if (cache === undefined) { try { cache = JSON.parse(localStorage.getItem(KEY)) || null; } catch { cache = null; } }
  return cache;
}
export function packInfo() { const p = read(); return p && p.lang === LANG.code && p.items?.length ? { count: p.items.length } : null; }
export function removePack() { cache = null; try { localStorage.removeItem(KEY); } catch {} }

const norm = s => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
const clean = s => String(s || "").replace(/[​‎‏﻿]/g, "").replace(/\s+/g, " ").trim();

// Downloads the pack for the app's language and keeps it on the device. Resolves to the number of topics.
export async function downloadPack() {
  if (!packAvailable()) throw new Error("no_pack");
  const r = await fetch(`packs/pack-${LANG.code}.json`, { cache: "no-cache" });
  if (!r.ok) throw new Error("pack_" + r.status);
  const d = await r.json();
  // The file is checked like any outside data before it is kept.
  const items = (Array.isArray(d?.items) ? d.items : [])
    .filter(i => i && typeof i.t === "string" && typeof i.x === "string" && Array.isArray(i.k))
    .map(i => ({ t: clean(i.t).slice(0, 120), x: clean(i.x).slice(0, 1000), k: i.k.map(norm).filter(k => k.length > 1).slice(0, 6) }))
    .filter(i => i.t && i.x.length > 60 && i.k.length);
  if (items.length < 20) throw new Error("pack_empty");
  const base = `https://${LANG.code}.wikipedia.org/wiki/`;
  cache = { lang: LANG.code, base, items };
  localStorage.setItem(KEY, JSON.stringify(cache));    // throws when the device has no room left
  return items.length;
}

// The topic of the pack a question is about, if any: the longest topic name found in the question wins.
export function packFind(query) {
  const p = read();
  if (!p || p.lang !== LANG.code) return null;
  const q = " " + norm(query) + " ", words = q.trim().split(" ").length;
  let best = null, bestLen = 0;
  for (const item of p.items) {
    for (const k of item.k) {
      if (k.length <= bestLen) continue;
      // Very short names ("pi", "son", "eau") only count in very short questions.
      if (k.length <= 3 && words > 3) continue;
      const at = q.indexOf(" " + k);
      if (at < 0) continue;
      const rest = q.slice(at + 1 + k.length);
      if (/^(s|es|x)? /.test(rest)) { best = item; bestLen = k.length; }
    }
  }
  return best ? { title: best.t, extract: best.x, url: p.base + encodeURIComponent(best.t.replace(/ /g, "_")), pack: true } : null;
}

// The first sentences of a text, for Friend's answers without any AI.
export function firstSentences(text, maxChars = 360) {
  const parts = String(text || "").split(/(?<=[.!?])\s+(?=[A-ZÀ-ÝÉ«"¿¡0-9])/);
  let out = "";
  for (const s of parts) { if (out && (out + " " + s).length > maxChars) break; out = out ? out + " " + s : s; if (out.length > maxChars * 0.6) break; }
  return out.length > maxChars + 80 ? out.slice(0, maxChars).replace(/\s+\S*$/, "") + "…" : out;
}
