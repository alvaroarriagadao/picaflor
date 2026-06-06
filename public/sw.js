const SHELL_CACHE = "picaflor-shell-v1";
const ASSET_CACHE = "picaflor-assets-v1";

// On install: cache the critical shell
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) =>
      cache.addAll(["/practica"]).catch(() => {})
    )
  );
});

// On activate: remove stale caches
self.addEventListener("activate", (event) => {
  const keep = [SHELL_CACHE, ASSET_CACHE];
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => !keep.includes(k)).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET, same origin
  if (request.method !== "GET") return;
  if (url.origin !== self.location.origin) return;

  // Skip API, auth, and Supabase
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/auth/") ||
    url.pathname.startsWith("/supabase")
  )
    return;

  // Next.js static assets — cache-first (they have content hashes)
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((res) => {
          if (res.ok) {
            caches
              .open(ASSET_CACHE)
              .then((c) => c.put(request, res.clone()));
          }
          return res;
        });
      })
    );
    return;
  }

  // Navigation — network-first, fall back to cached version
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) {
            caches.open(SHELL_CACHE).then((c) => c.put(request, res.clone()));
          }
          return res;
        })
        .catch(() =>
          caches
            .match(request)
            .then((c) => c || caches.match("/practica") || new Response("Sin conexión", { status: 503 }))
        )
    );
  }
});
