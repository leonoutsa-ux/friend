// Live mode: the phone listens (speech-to-text) and Friend talks back.
// Friend's voice: a free, natural open-source voice (Piper) downloaded once and run on the
// phone, or the phone's built-in voice while the natural one isn't ready.

import { ears } from "./ears.js";
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
const synth = window.speechSynthesis;
const PIPER_URL = "https://cdn.jsdelivr.net/npm/@diffusionstudio/vits-web@1.0.3/+esm";
const SILENT_WAV = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";

let piper = null;
const audio = typeof Audio !== "undefined" ? new Audio() : null;
if (audio) audio.preload = "auto";

export const voice = {
  canListen: !!SR || ears.supported,
  hasSystem: !!SR,
  privateEars: false,     // the person chose "private hearing": the voice never leaves the device
  netDown: false,         // the phone's speech service just failed for lack of internet
  // True when the next sentence will be written down on the device by Friend's own hearing.
  usesEars() { return ears.state === "ready" && (this.privateEars || !SR || ((this.netDown || !navigator.onLine) && !this.local)); },
  // True when listening is impossible until the private hearing is downloaded.
  needsEars() { return ears.supported && ears.state !== "ready" && (!SR || this.privateEars || ((this.netDown || !navigator.onLine) && !this.local)); },
  canSpeak: !!(synth && window.SpeechSynthesisUtterance) || !!audio,
  local: false,
  natural: { state: "idle", voiceId: "", progress: 0 },   // idle | loading | ready | error
  listeners: new Set(),
  on(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); },
  emit() { for (const f of this.listeners) { try { f(this); } catch {} } },

  async prepareLocal(lang) {
    if (!SR) return false;
    try {
      if (typeof SR.available === "function") {
        const st = await SR.available({ langs: [lang], processLocally: true });
        if (st === "available") this.local = true;
        else if ((st === "downloadable" || st === "downloading") && typeof SR.install === "function") {
          this.local = !!(await SR.install({ langs: [lang], processLocally: true }));
        }
      }
    } catch { this.local = false; }
    return this.local;
  },
  systemVoices(lang) {
    if (!synth) return [];
    const want = lang.slice(0, 2).toLowerCase();
    return synth.getVoices().filter(v => v.lang.toLowerCase().startsWith(want));
  },
  // Must be called inside a tap: phones only allow sound after the person touches the screen.
  warmUp() {
    try { if (synth) { const u = new SpeechSynthesisUtterance(" "); u.volume = 0; synth.speak(u); } } catch {}
    try { if (audio) { audio.src = SILENT_WAV; audio.play().catch(() => {}); } } catch {}
  },
  async isNaturalStored(voiceId) {
    try { piper ||= await import(PIPER_URL); return (await piper.stored()).includes(voiceId); } catch { return false; }
  },
  async loadNatural(voiceId) {
    if (!voiceId) return;
    if (this.natural.voiceId === voiceId && (this.natural.state === "ready" || this.natural.state === "loading")) return;
    this.natural = { state: "loading", voiceId, progress: 0 }; this.emit();
    try {
      piper ||= await import(PIPER_URL);
      const stored = await piper.stored();
      if (!stored.includes(voiceId)) {
        await piper.download(voiceId, p => {
          if (p && p.total) { this.natural.progress = Math.min(1, p.loaded / p.total); this.emit(); }
        });
      }
      if (this.natural.voiceId !== voiceId) return;
      // A first, short sentence warms the voice up so the real answers come faster.
      await piper.predict({ text: ".", voiceId }).catch(() => {});
      this.natural.state = "ready"; this.natural.progress = 1; this.emit();
    } catch (e) {
      console.warn("natural voice", e);
      if (this.natural.voiceId === voiceId) { this.natural.state = "error"; this.emit(); }
    }
  },
  listen, speaker, stopSpeaking() { try { synth?.cancel(); } catch {} try { audio?.pause(); } catch {} }
};
if (synth) { try { synth.getVoices(); } catch {} }

// Listen to one sentence. Ends by itself when the person stops talking.
function listen({ lang, onPartial, onFinal, onEnd }) {
  if (voice.usesEars()) return ears.listen({ lang, onPartial, onFinal, onEnd });
  if (!SR) { setTimeout(() => onEnd?.(ears.supported ? "needears" : "unsupported"), 0); return { stop() {} }; }
  let rec, finalText = "", reason = "ended", stopped = false;
  try { rec = new SR(); } catch { onEnd?.("unsupported"); return { stop() {} }; }
  rec.lang = lang; rec.interimResults = true; rec.continuous = false; rec.maxAlternatives = 1;
  if (voice.local) { try { rec.processLocally = true; } catch {} }
  rec.onresult = e => {
    let interim = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const r = e.results[i];
      if (r.isFinal) finalText += r[0].transcript; else interim += r[0].transcript;
    }
    onPartial?.((finalText + " " + interim).trim());
  };
  rec.onerror = e => {
    reason = e.error === "not-allowed" || e.error === "service-not-allowed" ? "denied"
      : e.error === "no-speech" ? "silence" : e.error === "aborted" ? "aborted" : e.error === "network" ? "offline" : "error";
    if (e.error === "network") voice.netDown = true;
  };
  rec.onend = () => {
    const t = finalText.trim();
    if (t) voice.netDown = false;
    if (t && !stopped) onFinal?.(t);
    else onEnd?.(stopped ? "aborted" : reason);
  };
  try { rec.start(); } catch { setTimeout(() => onEnd?.("error"), 0); }
  return { stop() { stopped = true; try { rec.abort(); } catch {} } };
}

function pickSystemVoice(lang, uri) {
  const list = voice.systemVoices(lang);
  return list.find(v => v.voiceURI === uri)
    || list.find(v => v.lang.replace("_", "-").toLowerCase() === lang.toLowerCase() && v.localService)
    || list.find(v => v.localService) || list[0] || null;
}

const clean = t => t.replace(/\p{Extended_Pictographic}|️/gu, "").replace(/[*_#`>~]/g, "").replace(/\s+/g, " ").trim();

// Speaks a reply while it is still being written: each finished sentence is spoken right away.
// natural: true to use the natural voice when it is ready.
function speaker({ lang, uri, rate = 1, natural = true, onStart, onDone }) {
  const useNatural = natural && voice.natural.state === "ready" && piper && audio;
  const voiceId = voice.natural.voiceId;
  let spoken = 0, finished = false, cancelled = false, started = false;
  const sysVoice = !useNatural && synth ? pickSystemVoice(lang, uri) : null;

  // Natural voice: sentences are turned into sound one after another and played in order.
  const queue = []; let synthChain = Promise.resolve(); let playing = false, pendingSynth = 0;
  const urls = [];
  const begin = () => { if (!started) { started = true; onStart?.(); } };
  const maybeDone = () => { if (finished && !playing && pendingSynth === 0 && queue.length === 0 && !cancelled) onDone?.(); };
  const playNext = () => {
    if (cancelled || playing) return;
    const url = queue.shift();
    if (!url) { maybeDone(); return; }
    playing = true; begin();
    audio.src = url; audio.playbackRate = rate;
    audio.onended = audio.onerror = () => { playing = false; playNext(); };
    audio.play().catch(() => { playing = false; playNext(); });
  };
  let sysPending = 0;
  const say = chunk => {
    chunk = clean(chunk);
    if (!chunk || cancelled) return;
    if (useNatural) {
      pendingSynth++;
      synthChain = synthChain.then(async () => {
        if (cancelled) return;
        try {
          const wav = await piper.predict({ text: chunk, voiceId });
          if (cancelled) return;
          const url = URL.createObjectURL(wav); urls.push(url); queue.push(url); playNext();
        } catch (e) { console.warn("tts", e); }
      }).finally(() => { pendingSynth--; maybeDone(); });
      return;
    }
    if (!synth) return;
    sysPending++;
    const u = new SpeechSynthesisUtterance(chunk);
    u.lang = lang; if (sysVoice) u.voice = sysVoice; u.rate = rate;
    u.onstart = begin;
    u.onend = u.onerror = () => { sysPending--; if (finished && sysPending === 0 && !cancelled) onDone?.(); };
    synth.speak(u);
  };
  return {
    natural: useNatural,
    feed(text) {
      const rest = text.slice(spoken);
      const re = /[.!?…]+["»)]?\s+/g; let m, idx = -1;
      while ((m = re.exec(rest))) idx = m.index + m[0].length;
      if (idx > 0) { say(rest.slice(0, idx)); spoken += idx; }
    },
    finish(text) {
      finished = true; const rest = text.slice(spoken); spoken = text.length; say(rest);
      if (useNatural) maybeDone(); else if (sysPending === 0 && !cancelled) onDone?.();
    },
    cancel() {
      cancelled = true;
      try { synth?.cancel(); } catch {}
      try { if (audio) { audio.pause(); audio.onended = audio.onerror = null; } } catch {}
      setTimeout(() => urls.forEach(u => URL.revokeObjectURL(u)), 1000);
    }
  };
}
