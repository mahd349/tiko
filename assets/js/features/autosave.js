/* ================================================================
ROUTINE — FEATURES / AUTOSAVE.JS
Reward-gated auto backup: rolling snapshots in IndexedDB (3 slots).
Off by default; the user opts in from Tools even after unlocking.
Cloud targets (zero-knowledge server / Drive) plug in later.
================================================================ */
(function () {
"use strict";
var UNLOCK_LEVEL = 4;
var DB_NAME = "tiko-autosave";
var STORE = "snapshots";
var MAX_SNAPSHOTS = 3;
var LAST_KEY = "pd_autosave_last";
var timer = null;
function L(fa, en) {
return window.I18N && window.I18N.lang === "en" ? en : fa;
}
function toast(msg, type, opts) {
if (window.UI && window.UI.toast) window.UI.toast(msg, type, opts);
}
function cfg() {
var s = window.Store && window.Store.state.settings;
return s && s.autoSave ? s.autoSave : { enabled: false, intervalHours: 24 };
}
function unlocked() {
return !!(window.Game && window.Game.derive && window.Game.derive().level >= UNLOCK_LEVEL);
}
function openDb() {
return new Promise(function (resolve, reject) {
var req = indexedDB.open(DB_NAME, 1);
req.onupgradeneeded = function () {
var d = req.result;
if (!d.objectStoreNames.contains(STORE)) d.createObjectStore(STORE, { keyPath: "id" });
};
req.onsuccess = function () { resolve(req.result); };
req.onerror = function () { reject(req.error); };
});
}
function putSnap(snap) {
return openDb().then(function (d) {
return new Promise(function (resolve, reject) {
var tx = d.transaction(STORE, "readwrite");
tx.objectStore(STORE).put(snap);
tx.oncomplete = function () { resolve(); };
tx.onerror = function () { reject(tx.error); };
});
});
}
function listSnaps() {
return openDb().then(function (d) {
return new Promise(function (resolve, reject) {
var req = d.transaction(STORE, "readonly").objectStore(STORE).getAll();
req.onsuccess = function () { resolve(req.result || []); };
req.onerror = function () { reject(req.error); };
});
});
}
function prune(list) {
var sorted = list.slice().sort(function (a, b) {
return String(b.at).localeCompare(String(a.at));
});
var extra = sorted.slice(MAX_SNAPSHOTS);
if (!extra.length) return Promise.resolve();
return openDb().then(function (d) {
return new Promise(function (resolve) {
var tx = d.transaction(STORE, "readwrite");
extra.forEach(function (s) { tx.objectStore(STORE).delete(s.id); });
tx.oncomplete = function () { resolve(); };
tx.onerror = function () { resolve(); };
});
});
}
function saveNow() {
if (!window.Store) return Promise.reject(new Error("no store"));
var snap = {
id: "snap-" + Date.now(),
at: new Date().toISOString(),
data: window.Store.exportData()
};
return putSnap(snap)
.then(listSnaps)
.then(prune)
.then(function () {
try { localStorage.setItem(LAST_KEY, String(Date.now())); } catch (e) {}
window.Store.notify("autosave:saved");
return true;
});
}
function latest() {
return listSnaps().then(function (list) {
list.sort(function (a, b) { return String(b.at).localeCompare(String(a.at)); });
return list[0] || null;
});
}
function restoreLatest() {
return latest().then(function (snap) {
if (!snap || !snap.data) throw new Error("empty");
var undo = window.Store.snapshot();
window.Store.importData(snap.data);
toast(L("از آخرین ذخیرهٔ خودکار بازیابی شد", "Restored from latest auto-save"), "undo", {
action: {
label: L("بازگشت", "Undo"),
onClick: function () {
window.Store.restoreSnapshot(undo);
if (window.App && window.App.renderAll) window.App.renderAll();
}
}
});
return true;
});
}
function due() {
var st = cfg();
if (!st.enabled || !unlocked()) return false;
var last = 0;
try { last = Number(localStorage.getItem(LAST_KEY) || 0); } catch (e) {}
var hours = Math.max(1, Number(st.intervalHours) || 24);
return Date.now() - last >= hours * 3600 * 1000;
}
function tick() {
if (!due()) return;
saveNow().catch(function () {});
}
function start() {
if (timer) return;
timer = setInterval(tick, 30 * 60 * 1000);
document.addEventListener("visibilitychange", function () {
if (!document.hidden) tick();
});
tick();
}
window.AutoSave = {
saveNow: saveNow,
latest: latest,
restoreLatest: restoreLatest,
unlocked: unlocked,
unlockLevel: UNLOCK_LEVEL,
start: start
};
window.Utils.onDomReady(function () {
if (window.Store) start();
});
})();
