/* ================================================================
ROUTINE — CORE / UPDATER.JS
Detects new deploys and politely asks the user to reload.
Only future versions can be notified; already-shipped builds get
updates automatically via SW skipWaiting + claim on next navigation.
Keep MY_VERSION in sync with sw.js CACHE on every release.
================================================================ */
(function () {
"use strict";
var MY_VERSION = "routine-v32";
var RELOAD_GUARD = "pd_update_reload_at";
var SAW_UPDATE = "pd_saw_update";
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
function notifyUpdate(version) {
try { sessionStorage.setItem(SAW_UPDATE, version); } catch (e) {}
toast(
L("نسخهٔ جدید آماده است؛ برای اعمال، صفحه را تازه‌سازی کن.", "A new version is ready; reload to apply."),
"info",
{
duration: 20000,
action: { label: L("تازه‌سازی", "Reload"), onClick: reloadOnce }
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
function init() {
if (!("serviceWorker" in navigator)) return;
navigator.serviceWorker.addEventListener("message", function (event) {
var d = event.data;
if (d && d.type === "sw-update" && d.version && d.version !== MY_VERSION) {
notifyUpdate(d.version);
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
}, 6 * 60 * 60 * 1000);
document.addEventListener("visibilitychange", function () {
if (!document.hidden) {
reg.update();
check();
}
});
setTimeout(check, 15000);
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
