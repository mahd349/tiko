/* ================================================================
ROUTINE — CORE / UPDATER.JS
Detects new deploys and politely asks the user to reload.
Also receives admin messages relayed by the service worker from
/admin-message.json (outside the app cache). Each message id is
shown once per browser via localStorage.
Keep MY_VERSION in sync with sw.js CACHE on every release.
================================================================ */
(function () {
  "use strict";
  var MY_VERSION = "routine-v40";
  var RELOAD_GUARD = "pd_update_reload_at";
  var SAW_UPDATE = "pd_saw_update";
  var SEEN_ADMIN_MSG = "tiko_last_seen_admin_msg";

  function L(fa, en) {
    return window.I18N && window.I18N.lang === "en" ? en : fa;
  }

  function toast(msg, type, opts) {
    if (window.UI && window.UI.toast) window.UI.toast(msg, type, opts);
  }

  function canReload() {
    try {
      var last = Number(sessionStorage.getItem(RELOAD_GUARD) || 0);
      return Date.now() - last > 10 * 60 * 1000;
    } catch (e) {
      return true;
    }
  }

  function markReload() {
    try { sessionStorage.setItem(RELOAD_GUARD, String(Date.now())); } catch (e) {}
  }

  function reloadOnce() {
    if (!canReload()) return;
    markReload();
    location.reload();
  }

  /* پاک‌سازی کامل حافظهٔ پنهان + گرفتن نسخهٔ جدید — فقط با کلیک کاربر */
  function bustUrl() {
    try {
      var url = new URL(location.href);
      url.searchParams.set("upd", Date.now().toString(36));
      return url.toString();
    } catch (e) {
      return location.href;
    }
  }

  function hardRefresh() {
    markReload();
    try { sessionStorage.removeItem(SAW_UPDATE); } catch (e) {}

    setTimeout(function () {
      toast(L("در حال پاک‌سازی حافظهٔ پنهان…", "Clearing cache…"), "info", { duration: 8000 });
    }, 0);

    var jobs = [];

    // ۱) حذف تمام Cache Storage های این دامنه
    if (window.caches && caches.keys) {
      jobs.push(
        caches.keys()
          .then(function (keys) {
            return Promise.all(keys.map(function (key) { return caches.delete(key); }));
          })
          .catch(function () {})
      );
    }

    // ۲) فعال‌کردن سرویس‌ورکر جدید و گرفتن آخرین sw.js
    if ("serviceWorker" in navigator) {
      jobs.push(
        navigator.serviceWorker.getRegistration()
          .then(function (reg) {
            if (!reg) return;
            if (reg.waiting) reg.waiting.postMessage({ type: "SKIP_WAITING" });
            return reg.update().catch(function () {});
          })
          .catch(function () {})
      );
    }

    var navigated = false;
    function go() {
      if (navigated) return;
      navigated = true;
      location.replace(bustUrl());
    }

    Promise.all(jobs).then(go, go);
    setTimeout(go, 4000); // اگر شبکه کند بود، کاربر معطل نماند
  }

  function notifyUpdate(version) {
    try { sessionStorage.setItem(SAW_UPDATE, version); } catch (e) {}
    toast(
      L("نسخهٔ جدید آماده است؛ برای اعمال، صفحه را تازه‌سازی کن.", "A new version is ready; reload to apply."),
      "info",
      {
        duration: 20000,
        action: { label: L("تازه‌سازی", "Reload"), onClick: hardRefresh }
      }
    );
  }

  function remoteVersion() {
    return fetch("/sw.js", { cache: "no-store" })
      .then(function (res) {
        if (!res.ok) throw new Error("bad status");
        return res.text();
      })
      .then(function (text) {
        var m = text.match(/const CACHE = "([^"]+)"/);
        return m ? m[1] : null;
      });
  }

  function check() {
    return remoteVersion()
      .then(function (v) {
        if (v && v !== MY_VERSION) notifyUpdate(v);
      })
      .catch(function () {});
  }

  function clearCachesAndReload() {
    var done = function () { location.reload(); };
    if ("caches" in window) {
      caches
        .keys()
        .then(function (keys) {
          return Promise.all(
            keys.map(function (key) { return caches.delete(key); })
          );
        })
        .then(done, done);
    } else {
      done();
    }
  }

  function notifyAdminMessage(d) {
    var seen = null;
    try { seen = localStorage.getItem(SEEN_ADMIN_MSG); } catch (e) {}
    if (seen === d.id) return;
    try { localStorage.setItem(SEEN_ADMIN_MSG, d.id); } catch (e) {}

    toast(d.text, "info", {
      duration: 20000,
      action: { label: L("تازه‌سازی", "Reload"), onClick: clearCachesAndReload }
    });

    if (d.force_update) {
      setTimeout(clearCachesAndReload, 5000);
    }
  }

  function requestAdminCheck() {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: "CHECK_ADMIN_MESSAGE" });
    }
  }

  function init() {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.addEventListener("message", function (event) {
      var d = event.data;
      if (d && d.type === "sw-update" && d.version && d.version !== MY_VERSION) {
        notifyUpdate(d.version);
      }
      if (d && d.type === "ADMIN_MESSAGE" && d.id && d.text) {
        notifyAdminMessage(d);
      }
    });

    navigator.serviceWorker.addEventListener("controllerchange", function () {
      var saw = null;
      try { saw = sessionStorage.getItem(SAW_UPDATE); } catch (e) {}
      if (saw) {
        try { sessionStorage.removeItem(SAW_UPDATE); } catch (e) {}
        reloadOnce();
      }
    });

    navigator.serviceWorker.ready
      .then(function (reg) {
        setInterval(function () {
          reg.update();
          check();
          requestAdminCheck();
        }, 6 * 60 * 60 * 1000);

        document.addEventListener("visibilitychange", function () {
          if (!document.hidden) {
            reg.update();
            check();
            requestAdminCheck();
          }
        });

        setTimeout(check, 15000);
        requestAdminCheck();
      })
      .catch(function () {});
  }

  window.Updater = { check: check, version: MY_VERSION };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
