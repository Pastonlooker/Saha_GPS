// Saha GPS servis çalışanı — uygulama kabuğu + harita karoları önbelleği
const APP = "sahagps-app-v2", TILE = "sahagps-tiles-v1";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(APP).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith("sahagps-app") && k !== APP).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
const TILE_HOSTS = /(arcgisonline\.com|tile\.openstreetmap\.org|tile\.opentopomap\.org)/;
self.addEventListener("fetch", (e) => {
  const u = new URL(e.request.url);
  if (TILE_HOSTS.test(u.hostname)) {
    // Karolar: önce önbellek, yoksa ağ ve önbelleğe yaz
    e.respondWith(caches.open(TILE).then((c) => c.match(e.request.url).then((hit) => hit || fetch(e.request.url, { mode: "no-cors" }).then((r) => { c.put(e.request.url, r.clone()); return r; }).catch(() => new Response("", { status: 504 })))));
    return;
  }
  if (e.request.method !== "GET" || u.origin !== location.origin) return;
  // Uygulama: önce ağ (güncel sürüm), çevrimdışıysa önbellek
  e.respondWith(fetch(e.request).then((r) => { const cp = r.clone(); caches.open(APP).then((c) => c.put(e.request, cp)); return r; }).catch(() => caches.match(e.request).then((h) => h || caches.match("./index.html"))));
});
