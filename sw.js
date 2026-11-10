// 오프라인 실행용 서비스 워커. 온라인이면 항상 새 파일을 먼저 받고, 오프라인이면 저장해 둔 파일로 연다.
const V = "mallang-v1";
const CORE = ["./", "index.html", "manifest.webmanifest", "icons/icon-180.png", "icons/icon-192.png", "icons/icon-512.png"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET") return;
  const u = new URL(r.url);
  const font = /fonts\.(googleapis|gstatic)\.com$/.test(u.hostname);
  if (u.origin !== location.origin && !font) return;
  if (font) {
    e.respondWith(caches.open(V).then(c => c.match(r).then(hit => hit || fetch(r).then(n => { c.put(r, n.clone()); return n; }))));
    return;
  }
  e.respondWith(
    fetch(r).then(n => {
      if (n.ok) { const cp = n.clone(); caches.open(V).then(c => c.put(r, cp)); }
      return n;
    }).catch(() => caches.match(r, { ignoreSearch: true }).then(hit => hit || caches.match("index.html")))
  );
});
