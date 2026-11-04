// Guarda os arquivos do app para abrir sem internet (RNF02, parcial no protótipo).
const CACHE = "dosedupla-v2";
const ARQS = ["./", "index.html", "css/app.css", "js/app.js", "js/store.js", "js/dados.js", "icon.svg", "manifest.webmanifest", "dados/interacoes.json"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARQS))); self.skipWaiting(); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); return r; }).catch(() => caches.match(e.request)));
});
self.addEventListener("notificationclick", e => { e.notification.close(); e.waitUntil(self.clients.matchAll({ type: "window" }).then(cs => cs[0] ? cs[0].focus() : self.clients.openWindow("./#/hoje"))); });
