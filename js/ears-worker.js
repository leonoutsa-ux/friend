// Friend's private hearing: turns speech into text on the device (Whisper, open source),
// in the background so the screen stays smooth. Nothing is sent anywhere.
import { pipeline } from "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/+esm";

let asr = null, loaded = "";
self.onmessage = async e => {
  const m = e.data;
  try {
    if (m.type === "load") {
      if (asr && loaded === m.model) { self.postMessage({ type: "ready" }); return; }
      const sizes = {};
      asr = await pipeline("automatic-speech-recognition", m.model, {
        dtype: "q8", device: "wasm",
        progress_callback: p => {
          if (p.status !== "progress" || !p.total) return;
          sizes[p.file] = [p.loaded, p.total];
          let a = 0, b = 0; for (const [l, t] of Object.values(sizes)) { a += l; b += t; }
          self.postMessage({ type: "progress", value: b ? a / b : 0 });
        }
      });
      loaded = m.model;
      self.postMessage({ type: "ready" });
    } else if (m.type === "run") {
      if (!asr) throw new Error("not_loaded");
      const out = await asr(m.audio, { language: m.lang, task: "transcribe", chunk_length_s: 30, max_new_tokens: 160 });
      self.postMessage({ type: "text", id: m.id, text: (Array.isArray(out) ? out[0]?.text : out?.text) || "" });
    }
  } catch (err) {
    self.postMessage({ type: "error", id: m.id, message: String(err?.message || err) });
  }
};
