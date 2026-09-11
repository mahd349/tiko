/* ================================================================
   ROUTINE — SERVICE WORKER
   Offline support + stale-while-revalidate caching
================================================================ */

const CACHE = "routine-v9";

const CORE = [
  "/",
  "/index.html",
  "/404.html",
  "/manifest.json",
  "/assets/css/main.css",
  "/assets/css/components.css",
  "/assets/js/core/utils.js",
  "/assets/js/core/calendar.js",
  "/assets/js/core/i18n.js",
 "/assets/js/core/store.js",
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
  "/assets/js/ui/modal.js",
  "/assets/js/ui/toast.js",
  "/assets/js/app.js",
   "/assets/js/features/wave-bg.js",
   "/assets/js/features/animated-bg.js",
   "/assets/js/features/notes.js",
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

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches
      .open(CACHE)
      .then(function (cache) {
        return Promise.all(
          CORE.map(function (url) {
            return cache.add(url).catch(function () {});
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
        return Promise.all(
          keys
            .filter(function (key) {
              return key !== CACHE;
            })
            .map(function (key) {
              return caches.delete(key);
            })
        );
      })
      .then(function () {
        return self.clients.claim();
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

  /* Navigation: network-first, offline fallback */
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then(function (res) {
          const copy = res.clone();

          caches.open(CACHE).then(function (cache) {
            cache.put(req, copy);
          });

          return res;
        })
        .catch(function () {
          return caches.match(req).then(function (cached) {
            return cached || caches.match("/index.html");
          });
        })
    );
    return;
  }

  /* Static assets & fonts: stale-while-revalidate */
  if (sameOrigin || isCacheableHost(url.hostname)) {
    event.respondWith(
      caches.match(req).then(function (cached) {
        const network = fetch(req)
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
            return cached;
          });

        return cached || network;
      })
    );
  }
});
