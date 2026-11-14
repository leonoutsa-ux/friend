// Friend's brain: a small AI that runs on the phone (WebLLM, through WebGPU),
// or the person's own Claude account when they connect one.

// 0.2 = the latest 0.2.x release, so bug fixes arrive without breaking changes.
const WEBLLM_URL = "https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@0.2/+esm";

// Preferred models for each size, best first. The first one found in WebLLM's catalog wins.
// Smaller = much faster on phones. Qwen 0.5B answers several times faster than a 2B model.
const CANDIDATES = {
  small: ["Qwen2.5-0.5B-Instruct", "Llama-3.2-1B-Instruct"],
  medium: ["Llama-3.2-1B-Instruct", "Qwen2.5-1.5B-Instruct"],
  large: ["Qwen2.5-1.5B-Instruct", "gemma-2-2b-it"],
  xl: ["Qwen2.5-3B-Instruct", "Llama-3.2-3B-Instruct"],
  max: ["Qwen2.5-7B-Instruct", "Llama-3.1-8B-Instruct"]
};
export const SIZE_GB = { small: 0.4, medium: 0.7, large: 1.1, xl: 1.9, max: 4.6 };
export const SIZES = Object.keys(SIZE_GB);
// The two big sizes understand long instructions: they get Friend's full personality and a longer memory.
export const BIG = new Set(["xl", "max"]);
// Everything Friend keeps on the device (AI, voices, hearing) stays under this weight.
export const MAX_TOTAL_GB = 10;
// A short memory makes the small AI faster and lighter (2048 tokens ≈ a few pages of chat).
const chatOpts = size => ({ context_window_size: BIG.has(size) ? 4096 : 2048 });
// Words per second below which an answer feels too slow: "auto" then prefers the online AI.
export const FAST_ENOUGH = 6;

let lib = null, engine = null, loadedId = null, liveSize = null, f16 = null;
export const IS_MOBILE = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
let cfg = { mode: "auto", key: "", model: "claude-haiku-5-5", size: IS_MOBILE ? "small" : "medium" };
const listeners = new Set();

export const brain = {
  state: "idle",          // idle | loading | ready | nogpu | nospace | error
  progress: 0, progressText: "", firstDownload: false,
  configure(c) { cfg = { ...cfg, ...c }; },
  get config() { return { ...cfg }; },
  on(fn) { listeners.add(fn); return () => listeners.delete(fn); },
  usesClaude() { return cfg.mode === "claude" && !!cfg.key; },
  usesOnline() { return cfg.mode === "online" || cfg.mode === "auto"; },
  speed: 0,               // measured words (tokens) per second of the small AI, 0 = not measured
  stalled: false,         // the speed test got no answer at all: this device cannot really run the small AI
  firstWordMs: 0,
  // In "auto": the private small AI answers when it is ready and fast enough, or when there is no internet.
  prefersLocal() {
    if (cfg.mode === "local") return true;
    if (cfg.mode !== "auto" || this.state !== "ready") return false;
    return !navigator.onLine || this.speed >= FAST_ENOUGH;
  },
  benchmark,
  // The size that is awake right now, and whether it is one of the big ones.
  get loadedSize() { return brain.state === "ready" ? liveSize : null; },
  isBig() { return brain.state === "ready" && BIG.has(liveSize); },
  // Sizes this device can reasonably run. The biggest one needs a computer with a real graphics card.
  sizesFor() { return SIZES.filter(k => k !== "max" || (!IS_MOBILE && (navigator.deviceMemory || 8) >= 8)); },
  async cachedSizes() {
    const out = [];
    try { await ensureLib(); for (const k of SIZES) { const id = await pickModel(k); if (id && await lib.hasModelInCache?.(id).catch(() => false)) out.push(k); } } catch {}
    return out;
  },
  // Frees the space of one downloaded size.
  async remove(size) {
    try {
      await ensureLib(); const id = await pickModel(size); if (!id) return false;
      if (loadedId === id) { try { await engine?.unload?.(); } catch {} loadedId = null; setState("idle", { speed: 0 }); }
      await lib.deleteModelAllInfoInCache(id);
      return true;
    } catch (e) { console.warn("remove", e); return false; }
  },
  space,
  canAnswer() { return !!window.__friendMock?.chat || this.usesClaude() || this.usesOnline() || this.state === "ready"; },
  async supported() {
    if (window.__friendMock?.chat) return true;
    try { return !!(navigator.gpu && await navigator.gpu.requestAdapter()); } catch { return false; }
  },
  async isCached(size = cfg.size) {
    try { await ensureLib(); const id = await pickModel(size); return id ? !!(await lib.hasModelInCache?.(id)) : false; } catch { return false; }
  },
  load, chat
};

function emit() { for (const fn of listeners) { try { fn(brain); } catch {} } }
function setState(s, extra = {}) { Object.assign(brain, { state: s }, extra); emit(); }

async function ensureLib() {
  if (!lib) lib = await import(WEBLLM_URL);
  if (f16 === null) {
    try { const a = await navigator.gpu?.requestAdapter(); f16 = !!a?.features?.has("shader-f16"); } catch { f16 = false; }
  }
  return lib;
}

async function pickModel(size) {
  const ids = (lib.prebuiltAppConfig?.model_list || []).map(m => m.model_id);
  const quant = f16 ? "q4f16_1" : "q4f32_1";
  const ok = id => id.includes(quant) && !/-1k\b/.test(id);
  for (const base of CANDIDATES[size] || CANDIDATES.medium) {
    const id = ids.find(x => x.startsWith(base) && ok(x)) || ids.find(x => x.startsWith(base));
    if (id) return id;
  }
  return ids.find(x => ok(x) && /instruct|-it-/i.test(x)) || null;
}

// How much room Friend takes on the device, and how much is left under its 10 GB limit.
async function space() {
  let used = 0, quota = 0, persisted = false;
  try { const e = await navigator.storage.estimate(); used = e.usage || 0; quota = e.quota || 0; } catch {}
  try { persisted = !!(await navigator.storage.persisted?.()); } catch {}
  const GB = 1024 ** 3, cap = MAX_TOTAL_GB * GB;
  return { used, quota, persisted, cap, free: Math.max(0, Math.min(cap - used, quota ? quota - used : cap)) };
}
// Asks the browser to never erase Friend's downloads by itself when the device runs low on space.
export async function keepSafe() { try { return !!(await navigator.storage.persist?.()); } catch { return false; } }

async function load(size = cfg.size) {
  if (window.__friendMock?.chat) { cfg.size = liveSize = size; setState("ready"); return; }
  if (brain.state === "loading") return;
  if (!(await brain.supported())) { setState("nogpu"); return; }
  setState("loading", { progress: 0, progressText: "" });
  try {
    await ensureLib();
    const id = await pickModel(size);
    if (!id) throw new Error("no_model");
    if (engine && loadedId === id) { setState("ready"); return; }
    brain.firstDownload = !(await lib.hasModelInCache?.(id).catch(() => false));
    if (brain.firstDownload) {
      // Never start a download that would not fit: on the device, or under Friend's own limit.
      const room = await space();
      if ((room.quota || window.__friendMock?.space) && room.free < (SIZE_GB[size] || 1) * 1.05 * 1024 ** 3) { setState("nospace"); return; }
      keepSafe();
    }
    const report = r => { brain.progress = r.progress || 0; brain.progressText = r.text || ""; emit(); };
    const CHAT_OPTS = chatOpts(size);
    if (engine) { engine.setInitProgressCallback?.(report); await engine.reload(id, CHAT_OPTS); }
    else {
      try {
        const worker = new Worker(new URL("./llm-worker.js", import.meta.url), { type: "module" });
        engine = await lib.CreateWebWorkerMLCEngine(worker, id, { initProgressCallback: report }, CHAT_OPTS);
      } catch (err) {
        console.warn("worker engine failed, using the page", err);
        engine = await lib.CreateMLCEngine(id, { initProgressCallback: report }, CHAT_OPTS);
      }
    }
    loadedId = id; cfg.size = liveSize = size;
    brain.stalled = false; brain.speed = 0;
    setState("ready", { progress: 1 });
    benchmark().catch(() => {});
  } catch (e) {
    console.error("Friend brain:", e);
    setState(navigator.gpu ? "error" : "nogpu");
  }
}

// One request at a time: the phone's AI can only think about one thing at once.
let chain = Promise.resolve();
function exclusive(fn) { const run = chain.then(fn, fn); chain = run.catch(() => {}); return run; }

// Measures how fast the small AI writes, with a tiny fixed question.
async function benchmark() {
  if (!engine || brain.state !== "ready") return 0;
  return exclusive(async () => {
    const t0 = performance.now(); let first = 0, n = 0, timedOut = false;
    // Some graphics chips stall and never answer: after 30 s the test gives up by itself,
    // so that nothing else has to wait behind it, and the small AI counts as too slow.
    let giveUp; const gaveUp = new Promise(res => { giveUp = res; });
    const guard = setTimeout(() => { timedOut = true; try { engine.interruptGenerate(); } catch {} giveUp(); }, 30000);
    const run = (async () => {
      const s = await engine.chat.completions.create({ messages: [{ role: "user", content: "Say hello in one short sentence." }], stream: true, max_tokens: 24, temperature: 0 });
      for await (const c of s) { if (timedOut) break; if (c.choices?.[0]?.delta?.content) { n++; if (!first) first = performance.now(); } }
    })();
    run.catch(() => {});
    try { await Promise.race([run, gaveUp]); } catch {} finally { clearTimeout(guard); }
    const end = performance.now();
    brain.stalled = timedOut && n < 2;
    if (brain.stalled) { brain.speed = 0.1; brain.firstWordMs = Math.round(end - t0); emit(); return brain.speed; }
    brain.firstWordMs = Math.round((first || end) - t0);
    brain.speed = n > 1 && end > first ? Math.round(10 * (n - 1) / ((end - first) / 1000)) / 10 : 0;
    try { await engine.resetChat?.(); } catch {}
    emit();
    return brain.speed;
  });
}

// The small AI reads a shorter version of the instructions (it is faster to read)
// and only the last few messages.
function forLocal(messages, opts) {
  let m = messages;
  const big = BIG.has(liveSize);
  // The big sizes keep the full instructions; the small ones read the short version.
  if (!big && opts.localSystem && m[0]?.role === "system") m = [{ role: "system", content: opts.localSystem }, ...m.slice(1)];
  const sys = m[0]?.role === "system" ? [m[0]] : [];
  let rest = m.slice(sys.length).slice(big ? -12 : -6);
  while (rest.length && rest[0].role !== "user") rest = rest.slice(1);
  return [...sys, ...rest];
}

async function chat(messages, opts = {}) {
  if (window.__friendMock?.chat) return window.__friendMock.chat(messages, opts);
  if (brain.usesClaude() && !opts.localOnly) return claudeChat(messages, opts);
  if (!opts.localOnly && brain.prefersLocal()) {
    try { return await exclusive(() => localChat(forLocal(messages, opts), opts)); }
    catch (e) { if (e?.name === "AbortError" || !navigator.onLine) throw e; /* too slow: the online AI takes over */ }
  }
  if (brain.usesOnline() && !opts.localOnly) {
    try { return await onlineChat(messages, opts); }
    catch (e) {
      if (e?.name === "AbortError") throw e;
      // No internet or the free service is busy: the phone's small AI answers.
      // If it was downloaded but is still asleep, it is woken up first.
      if (brain.state !== "ready" && brain.state !== "loading" && brain.state !== "nogpu" && await brain.isCached(cfg.size)) {
        opts.onStatus?.("waking");
        await load(cfg.size);
      }
      // A small AI that never answered its speed test is not worth waiting for.
      if (brain.state === "ready" && !brain.stalled) return exclusive(() => localChat(forLocal(messages, opts), opts));
      throw e;
    }
  }
  if (brain.state !== "ready") { const e = new Error("not_ready"); e.code = "notready"; throw e; }
  return exclusive(() => localChat(forLocal(messages, opts), opts));
}

// If the phone hasn't produced a single word after this long, it is too slow for this AI size.
const FIRST_WORD_LIMIT = 45000;
async function localChat(messages, { onText, signal, maxTokens = 220, temperature = 0.7 }) {
  if (signal?.aborted) return "";
  // Stops waiting if the first word takes too long, or if the person interrupts.
  let stop; const stopped = new Promise(res => { stop = res; });
  const timer = setTimeout(() => stop("slow"), FIRST_WORD_LIMIT);
  const onAbort = () => stop("abort");
  signal?.addEventListener("abort", onAbort);
  let text = "", outcome = null;
  try {
    // A light penalty on repeated words keeps the small AI from going round in circles.
    const first = await Promise.race([engine.chat.completions.create({ messages, stream: true, temperature, max_tokens: maxTokens, frequency_penalty: 0.35 }), stopped]);
    if (typeof first === "string") outcome = first;
    else {
      const it = first[Symbol.asyncIterator]();
      for (;;) {
        const step = await Promise.race([it.next(), stopped]);
        if (typeof step === "string") { outcome = step; break; }
        if (step.done) break;
        const d = step.value.choices?.[0]?.delta?.content || "";
        if (d) { if (!text) clearTimeout(timer); text += d; onText?.(text); }
      }
    }
  } finally { clearTimeout(timer); signal?.removeEventListener("abort", onAbort); }
  if (outcome) { try { engine.interruptGenerate(); } catch {} }
  if (outcome === "slow" && !text) { const e = new Error("too_slow"); e.code = "slow"; throw e; }
  return tidy(text);
}
// Small AIs sometimes stop in the middle of a sentence or repeat one: keep whole, different sentences.
export function tidy(text) {
  let t = String(text || "").replace(/<\|[^|>]*\|>/g, "").trim();
  const parts = t.match(/[^.!?…]+[.!?…]+["»”)]*\s*|[^.!?…]+$/g) || [];
  if (parts.length < 2) return t;
  const seen = new Set(), keep = [];
  for (const p of parts) { const k = p.trim().toLowerCase(); if (!k || seen.has(k)) continue; seen.add(k); keep.push(p); }
  // A last piece with no ending mark was cut off by the length limit.
  if (keep.length > 1 && !/(?:[.!?…]|\p{Extended_Pictographic}|\uFE0F)["»”)]*\s*$/u.test(keep[keep.length - 1])) keep.pop();
  return keep.join("").trim();
}

// Personal details that should never reach a third-party service: e-mails, phone numbers,
// postal codes and street addresses are replaced before a message leaves the phone.
const HIDDEN = "[•••]";
const PII = [
  /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g,                                                    // e-mail
  /\b[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z][ -]?\d[ABCEGHJ-NPRSTV-Z]\d\b/gi,          // Canadian postal code
  /\b\d{1,5}(?:\s*,)?\s+(?:rue|avenue|av\.?|boulevard|boul\.?|bd|chemin|ch\.|place|route|rang|impasse|all[ée]e|street|st\.|road|rd\.|ave\.?|drive|dr\.|lane|ln\.|court|ct\.|crescent|calle|avenida|carrera)\s+[^\n,.!?]{1,40}/gi, // street address
  /\b\d{1,5}\s+(?:[a-zà-ÿ'-]+\s+){1,3}(?:street|st\.?|road|rd\.?|avenue|ave\.?|drive|dr\.?|lane|ln\.?|boulevard|blvd\.?|court|ct\.?|crescent|way)(?![a-z])/gi, // English address
  /\+?\d(?:[\s.()-]*\d){6,}/g                                                          // phone and other long numbers
];
export function scrub(text) {
  let t = String(text || "");
  for (const r of PII) t = t.replace(r, HIDDEN);
  return t;
}

// Free online AI (Pollinations): no key, no account. Messages are sent to their servers,
// so the person's own words are scrubbed first.
const ONLINE_URL = "https://text.pollinations.ai/openai";
// The free model "thinks" before it writes, and that thinking counts in its length limit:
// a low effort keeps it quick, and the limit leaves room so the answer is never cut to nothing.
// The answer is streamed, so words appear (and are spoken) as soon as they are written.
async function onlineChat(messages, { onText, signal, maxTokens = 300, effort = "low" }) {
  const safe = messages.map(m => m.role === "system" ? m : { ...m, content: scrub(m.content) });
  const base = { model: "openai", messages: safe, max_tokens: maxTokens + 350, reasoning_effort: effort, private: true, referrer: "friend-confident" };
  const clean = t => (t || "").replace(/<think>[\s\S]*?<\/think>/g, "").replace(/<think>[\s\S]*$/, "").trim();
  const post = async stream => {
    let res;
    for (let attempt = 0; attempt < 2; attempt++) {
      res = await fetch(ONLINE_URL, { method: "POST", signal, headers: { "content-type": "application/json" }, body: JSON.stringify({ ...base, stream }) });
      if (res.status !== 429 && res.status < 500) break;
      await new Promise(r => setTimeout(r, 2500));
    }
    if (!res.ok) { const e = new Error("online_" + res.status); e.code = res.status === 429 ? "busy" : "net"; throw e; }
    return res;
  };
  const fromJSON = async res => clean((await res.json()).choices?.[0]?.message?.content);
  let text = "";
  try {
    const res = await post(true);
    if (res.body && (res.headers.get("content-type") || "").includes("event-stream")) {
      const reader = res.body.getReader(), dec = new TextDecoder();
      let buf = "", raw = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        let i;
        while ((i = buf.indexOf("\n")) >= 0) {
          const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
          if (!line.startsWith("data:")) continue;
          let ev; try { ev = JSON.parse(line.slice(5)); } catch { continue; }
          const d = ev.choices?.[0]?.delta?.content;
          if (d) { raw += d; const shown = clean(raw); if (shown) onText?.(shown); }
        }
      }
      text = clean(raw);
    } else text = await fromJSON(res);
  } catch (e) {
    if (e?.name === "AbortError" || e?.code || text) throw e;      // a real refusal or a stop: no second try
  }
  if (!text) text = await fromJSON(await post(false));               // the stream gave nothing: ask once more, plainly
  if (text) onText?.(text);
  return text;
}

async function claudeChat(messages, { onText, signal, maxTokens = 400 }) {
  const system = messages.filter(m => m.role === "system").map(m => m.content).join("\n\n");
  const turns = [];
  for (const m of messages.filter(m => m.role !== "system")) {
    const last = turns[turns.length - 1];
    if (last && last.role === m.role) last.content += "\n\n" + m.content;
    else turns.push({ role: m.role, content: m.content });
  }
  while (turns.length && turns[0].role !== "user") turns.shift();
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST", signal,
    headers: {
      "content-type": "application/json",
      "x-api-key": cfg.key,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true"
    },
    body: JSON.stringify({ model: cfg.model, max_tokens: maxTokens, system, messages: turns, stream: true })
  });
  if (!res.ok) {
    const e = new Error("claude_" + res.status);
    e.code = res.status === 401 || res.status === 403 ? "key" : res.status === 429 ? "rate" : "net";
    throw e;
  }
  const reader = res.body.getReader(), dec = new TextDecoder();
  let buf = "", text = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let i;
    while ((i = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
      if (!line.startsWith("data:")) continue;
      let ev; try { ev = JSON.parse(line.slice(5)); } catch { continue; }
      if (ev.type === "content_block_delta" && ev.delta?.type === "text_delta") { text += ev.delta.text; onText?.(text); }
      if (ev.type === "error") { const e = new Error(ev.error?.message || "claude_error"); e.code = "net"; throw e; }
    }
  }
  return text.trim();
}
