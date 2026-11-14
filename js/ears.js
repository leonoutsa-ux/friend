// Private hearing: Friend listens with the microphone and turns the voice into text
// on the device itself, without internet. Used when the phone's own speech service is
// missing, offline, or when the person prefers that their voice never leaves the device.

const MOBILE = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
// A lighter model on phones, a more accurate one on computers.
const MODEL = MOBILE ? "onnx-community/whisper-tiny" : "onnx-community/whisper-base";
export const EARS_MB = MOBILE ? 41 : 77;
const CACHE_NAME = "transformers-cache";
const AC = window.AudioContext || window.webkitAudioContext;

let worker = null, jobId = 0;
const jobs = new Map();
let readyWait = null;

export const ears = {
  supported: !!(navigator.mediaDevices?.getUserMedia && AC && window.WebAssembly && window.Worker),
  state: "idle",            // idle | loading | ready | error
  progress: 0,
  listeners: new Set(),
  on(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); },
  emit() { for (const f of this.listeners) { try { f(this); } catch {} } },
  async isStored() {
    if (window.__friendMock?.ears) return !!window.__friendMock.earsStored;
    try {
      const c = await caches.open(CACHE_NAME);
      return (await c.keys()).some(r => r.url.includes(MODEL) && r.url.endsWith(".onnx"));
    } catch { return false; }
  },
  // Downloads (the first time) and wakes the hearing model.
  load() {
    if (this.state === "ready") return Promise.resolve(true);
    if (readyWait) return readyWait;
    this.state = "loading"; this.progress = 0; this.emit();
    if (window.__friendMock?.ears) { this.state = "ready"; this.progress = 1; this.emit(); return Promise.resolve(true); }
    readyWait = new Promise(resolve => {
      try {
        worker ||= new Worker(new URL("./ears-worker.js", import.meta.url), { type: "module" });
      } catch { this.state = "error"; this.emit(); readyWait = null; resolve(false); return; }
      worker.onmessage = e => {
        const m = e.data;
        if (m.type === "progress") { this.progress = m.value; this.emit(); }
        else if (m.type === "ready") { this.state = "ready"; this.progress = 1; this.emit(); readyWait = null; resolve(true); }
        else if (m.type === "text") { jobs.get(m.id)?.(m.text); jobs.delete(m.id); }
        else if (m.type === "error") {
          if (m.id != null && jobs.has(m.id)) { jobs.get(m.id)(""); jobs.delete(m.id); }
          else { console.warn("ears", m.message); this.state = "error"; this.emit(); readyWait = null; resolve(false); }
        }
      };
      worker.onerror = () => { this.state = "error"; this.emit(); readyWait = null; resolve(false); };
      worker.postMessage({ type: "load", model: MODEL });
    });
    return readyWait;
  },
  async remove() {
    try { worker?.terminate(); } catch {}
    worker = null; readyWait = null; this.state = "idle"; this.progress = 0;
    try {
      const c = await caches.open(CACHE_NAME);
      for (const r of await c.keys()) if (r.url.includes(MODEL)) await c.delete(r);
    } catch {}
    this.emit();
  },
  listen
};

function transcribe(audio, lang) {
  if (window.__friendMock?.ears) return Promise.resolve(window.__friendMock.ears(audio, lang));
  return new Promise(resolve => {
    const id = ++jobId; jobs.set(id, resolve);
    worker.postMessage({ type: "run", id, audio, lang }, [audio.buffer]);
  });
}

// Whisper sometimes "hears" these when there is only noise.
const GHOST = /sous-titres|amara\.org|merci d'avoir regard|thanks? for watching|thank you for watching|subt[ií]tulos|suscr[ií]bete|subscribe|abonnez-vous/i;
export function cleanHeard(t) {
  t = String(t || "").replace(/\[[^\]]*\]|\([^)]*\)|♪/g, " ").replace(/\s+/g, " ").trim();
  if (!t || GHOST.test(t) || /^[\s.,!?…-]*$/.test(t)) return "";
  return t;
}

function resample(buf, from, to = 16000) {
  if (from === to) return buf;
  const n = Math.floor(buf.length * to / from), out = new Float32Array(n), k = from / to;
  for (let i = 0; i < n; i++) { const x = i * k, a = Math.floor(x), b = Math.min(a + 1, buf.length - 1); out[i] = buf[a] + (buf[b] - buf[a]) * (x - a); }
  return out;
}

// Listen to one sentence: starts recording, notices when the person stops talking,
// then writes down what was said. Same shape as the phone's own speech service.
const WAIT_SPEECH_MS = 8000, END_SILENCE_MS = 1300, MAX_MS = 28000;
function listen({ lang, onPartial, onFinal, onEnd }) {
  let stopped = false, done = false, stream = null, ctx = null, node = null, src = null;
  const finish = (fn, arg) => { if (done) return; done = true; cleanup(); fn?.(arg); };
  const cleanup = () => {
    try { node && (node.onaudioprocess = null); node?.disconnect(); src?.disconnect(); } catch {}
    try { stream?.getTracks().forEach(t => t.stop()); } catch {}
    try { ctx?.close(); } catch {}
  };
  (async () => {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 } });
    } catch (e) { finish(onEnd, e?.name === "NotAllowedError" || e?.name === "SecurityError" ? "denied" : "error"); return; }
    if (stopped) { finish(onEnd, "aborted"); return; }
    try {
      try { ctx = new AC({ sampleRate: 16000 }); } catch { ctx = new AC(); }
      await ctx.resume?.();
      src = ctx.createMediaStreamSource(stream);
      node = ctx.createScriptProcessor(2048, 1, 1);
      const rate = ctx.sampleRate, frameMs = 2048 / rate * 1000;
      const chunks = [], pre = [];
      let speaking = false, loud = 0, quietMs = 0, totalMs = 0, speechMs = 0, floor = 0.004, frames = 0;
      node.onaudioprocess = ev => {
        if (done) return;
        const d = new Float32Array(ev.inputBuffer.getChannelData(0));
        let s = 0; for (let i = 0; i < d.length; i++) s += d[i] * d[i];
        const rms = Math.sqrt(s / d.length);
        frames++; totalMs += frameMs;
        // The room's background noise is measured on the way, so a noisy room doesn't count as speech.
        if (!speaking && frames > 1) floor = floor * 0.9 + Math.min(rms, 0.05) * 0.1;
        const isLoud = rms > Math.max(0.012, floor * 2.8);
        if (!speaking) {
          pre.push(d); if (pre.length > 4) pre.shift();
          loud = isLoud ? loud + 1 : 0;
          if (loud >= 2) { speaking = true; chunks.push(...pre); onPartial?.("…"); }
          else if (totalMs > WAIT_SPEECH_MS) finish(onEnd, "silence");
          return;
        }
        chunks.push(d);
        if (isLoud) { quietMs = 0; speechMs += frameMs; } else quietMs += frameMs;
        if (quietMs >= END_SILENCE_MS || totalMs >= MAX_MS) {
          done = true; cleanup();
          if (speechMs < 250) { onEnd?.("silence"); return; }
          let n = 0; for (const c of chunks) n += c.length;
          const all = new Float32Array(n); let o = 0; for (const c of chunks) { all.set(c, o); o += c.length; }
          onPartial?.("… ✍️");
          transcribe(resample(all, rate), (lang || "en").slice(0, 2).toLowerCase()).then(t => {
            const text = cleanHeard(t);
            if (stopped) onEnd?.("aborted"); else if (text) onFinal?.(text); else onEnd?.("silence");
          }).catch(() => onEnd?.("error"));
        }
      };
      src.connect(node);
      // The recorder only runs when it is connected to an output; a silent one avoids any echo.
      const mute = ctx.createGain(); mute.gain.value = 0; node.connect(mute); mute.connect(ctx.destination);
    } catch { finish(onEnd, "error"); }
  })();
  return { stop() { stopped = true; finish(onEnd, "aborted"); } };
}
