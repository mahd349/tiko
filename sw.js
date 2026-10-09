/* ================================================================
ROUTINE — SERVICE WORKER
Offline support + stale-while-revalidate caching
v39: never return undefined from respondWith; re-warm empty cache;
bypass immutable HTTP cache when (re)caching same-origin assets;
force-reload open tabs once when an old cache is replaced
================================================================ */
const CACHE = "routine-v39";

const CORE = [
  "/",
  "/index.html",
  "/404.html",
  "/manifest.json",
  "/assets/css/main.css",
  "/assets/css/components.css",
  "/assets/js/ui/icons.js",
  "/assets/js/core/utils.js",
  "/assets/js/core/calendar.js",
  "/assets/js/core/i18n.js",
  "/assets/js/core/store.js",
  "/assets/js/core/updater.js",
  "/assets/js/ui/datepicker.js",
  "/assets/js/features/tasks.js",
  "/assets/js/features/habits.js",
  "/assets/js/features/stats.js",
  "/assets/js/features/share-card.js",
  "/assets/js/features/game.js",
  "/assets/js/features/pomodoro.js",
  "/assets/js/features/report-card.js",
  "/assets/js/features/auth.js",
  "/assets/js/features/reminder.js",
  "/assets/js/features/fx-fireball-bg.js",
  "/assets/js/features/rewards.js",
  "/assets/js/ui/modal.js",
  "/assets/js/ui/toast.js",
  "/assets/js/app.js",
  "/assets/js/ui/install.js",
  "/assets/icons/icon.svg",
  "/assets/icons/icon-192.png",
  "/assets/icons/icon-512.png",
  "/assets/icons/icon-maskable-192.png",
  "/assets/icons/icon-maskable-512.png",
  "/assets/js/features/wave-bg.js",
  "/assets/js/features/animated-bg.js",
  "/assets/js/features/notes.js",
  "/assets/js/features/fx-saturn-bg.js",
  "/assets/js/features/autosave.js",
  "/rahnama/styles.css",
  "/rahnama/index.html",
  "/rahnama/chand-rooz-adat/",
  "/rahnama/ghanoon-do-daghighe/",
  "/rahnama/esterik-chist/",
  "/rahnama/barnamerizi-rooz-shamsi/",
  "/rahnama/technique-pomodoro/",
  "/rahnama/si-ideh-adat/",
  "/rahnama/khab-e-zood/",
  "/rahnama/ahmal-kari/",
  "/rahnama/afzayesh-tamarkoz/",
  "/rahnama/kholase-adat-haye-atomi/",
  "/en/index.html"
];

function freshRequest(url) {
  return new Request(url, { cache: "no-store" });
}

function offlineResponse() {
  return new Response(
    '<!doctype html><meta charset="utf-8"><title>Offline</title>' +
      '<p style="font-family:sans-serif;text-align:center;padding:40px">آفلاین هستید و این صفحه در کش نیست.</p>',
    { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches
      .open(CACHE)
      .then(function (cache) {
        return Promise.all(
          CORE.map(function (url) {
            return cache.add(freshRequest(url)).catch(function () {});
          })
        );
      })
      .then(function () {
        return self.skipWaiting();
      })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches
      .keys()
      .then(function (keys) {
        const oldKeys = keys.filter(function (key) {
          return key !== CACHE;
        });
        return Promise.all(
          oldKeys.map(function (key) {
            return caches.delete(key);
          })
        ).then(function () {
          return oldKeys.length > 0;
        });
      })
      .then(function (hadOldCaches) {
        return caches
          .open(CACHE)
          .then(function (cache) {
            return cache.match("/index.html").then(function (hit) {
              if (!hit) {
                return Promise.all(
                  CORE.map(function (url) {
                    return cache.add(freshRequest(url)).catch(function () {});
                  })
                );
              }
            });
          })
          .then(function () {
            return self.clients.claim().then(function () {
              if (hadOldCaches && !self.__migrated) {
                self.__migrated = true;
                return self.clients
                  .matchAll({ type: "window", includeUncontrolled: true })
                  .then(function (clients) {
                    clients.forEach(function (client) {
                      client.postMessage({ type: "sw-update", version: CACHE });
                      client.navigate(client.url).catch(function () {});
                    });
                  });
              }
            });
          });
      })
  );
});

function isCacheableHost(hostname) {
  return (
    hostname === "fonts.googleapis.com" ||
    hostname === "fonts.gstatic.com" ||
    hostname === "www.gstatic.com"
  );
}

self.addEventListener("fetch", function (event) {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (!url.protocol.startsWith("http")) return;

  const sameOrigin = url.origin === self.location.origin;

  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then(function (res) {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then(function (cache) {
              cache.put(req, copy);
            });
          }
          return res;
        })
        .catch(function () {
          return caches.match(req).then(function (cached) {
            if (cached) return cached;
            return caches.match("/index.html").then(function (fallback) {
              if (fallback) return fallback;
              return offlineResponse();
            });
          });
        })
    );
    return;
  }

  if (sameOrigin || isCacheableHost(url.hostname)) {
    event.respondWith(
      caches.match(req).then(function (cached) {
        const networkRequest = sameOrigin ? freshRequest(req.url) : req;
        const network = fetch(networkRequest)
          .then(function (res) {
            if (res && (res.ok || res.type === "opaque")) {
              const copy = res.clone();
              caches.open(CACHE).then(function (cache) {
                cache.put(req, copy);
              });
            }
            return res;
          })
          .catch(function () {
            if (cached) return cached;
            return new Response("", { status: 503, statusText: "Offline" });
          });
        return cached || network;
      })
    );
  }
});
