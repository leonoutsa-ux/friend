// Keeps Friend working offline. Friend's AI model is cached separately by the AI engine itself.
const CACHE = "friend-v2.0.0";
const SHELL = [
  "./", "index.html", "privacy.html", "manifest.webmanifest", "css/style.css",
  "js/app.js", "js/i18n.js", "js/i18n-es.js", "js/llm-worker.js", "js/avatar.js", "js/garden.js", "js/activities.js", "js/activities-i18n.js", "js/challenges.js", "js/extras.js", "js/extras-i18n.js", "js/search.js", "js/offline.js", "js/quizbank.js", "js/ears.js", "js/ears-worker.js", "js/safety.js", "js/brain.js", "js/voice.js",
  "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith("friend-") && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const own = url.origin === location.origin;
  const lib = ["cdn.jsdelivr.net", "cdnjs.cloudflare.com", "fonts.googleapis.com", "fonts.gstatic.com"].includes(url.hostname);
  if (!own && !lib) return; // AI model and voice files go straight to the network (they have their own cache).
  if (own) {
    // Friend's own files: newest version first, the saved copy when offline.
    e.respondWith(fetch(req).then(res => {
      if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req).then(hit => hit || caches.match("index.html"))));
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
    if (res && (res.ok || res.type === "opaque")) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  })));
});
