// Cache minimal : l'application s'ouvre même sans réseau. Les données restent dans le téléphone.
const CACHE = "techgo-devis-v17";
const FILES = ["./", "index.html", "app.js", "engine.js", "packs.js", "metiers/commun.js", "metiers/peinture.js", "metiers/carrelage.js", "metiers/maconnerie.js", "metiers/plomberie.js", "metiers/electricite.js", "metiers/listes.js", "store.js", "ui-doc.js", "logo.js", "docx.js", "csv.js", "manifest.webmanifest", "icon-192.png", "icon-512.png", "apple-touch-icon.png"];
self.addEventListener("install", (e) => e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting())));
self.addEventListener("activate", (e) => e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(fetch(e.request).then((r) => { const cp = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, cp)); return r; }).catch(() => caches.match(e.request)));
});
