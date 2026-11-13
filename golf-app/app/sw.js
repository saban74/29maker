// 오프라인용 저장(골프장은 전파가 약한 곳이 많아서 화면 파일을 폰에 보관)
const CACHE = "golf-v8";
const FILES = ["./", "index.html", "style.css", "app.js", "betting.js", "geo.js", "clubs.js", "voicepack.js", "sync.js", "config.js", "icon.svg", "img/hero.jpg", "manifest.webmanifest"];
self.addEventListener("install", (e) => e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES))));
self.addEventListener("activate", (e) =>
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))))
);
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== location.origin) return;
  // 새 버전 우선, 안 되면(전파 없음) 저장해둔 것
  e.respondWith(
    fetch(e.request)
      .then((r) => { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); return r; })
      .catch(() => caches.match(e.request))
  );
});
