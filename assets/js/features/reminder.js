/* ================================================================
ROUTINE — FEATURES / REMINDER.JS
Daily reminder engine.
Works while the app is open. Uses Notification API when permitted,
otherwise falls back to an in-app toast.
================================================================ */
(function () {
"use strict";

const LAST_SHOWN_KEY = "pd_reminder_lastShown";

let timer = null;
let initialized = false;
let memoryLastShown = "";

function getSettings() {
const settings =
window.Store && window.Store.state
? window.Store.state.settings
: null;

if (settings && window.Utils.isPlainObject(settings.reminder)) {
return settings.reminder;
}

return {
enabled: false,
time: "20:00"
};
}

function todayKey() {
return window.Calendar ? window.Calendar.todayKey() : "";
}

function lastShown() {
try {
return localStorage.getItem(LAST_SHOWN_KEY) || memoryLastShown;
} catch (error) {
return memoryLastShown;
}
}

function markShown() {
memoryLastShown = todayKey();

try {
localStorage.setItem(LAST_SHOWN_KEY, memoryLastShown);
} catch (error) {
// ignore
}
}

function alreadyShownToday() {
return lastShown() === todayKey();
}

function nowHHMM() {
const d = new Date();
return window.Utils.pad2(d.getHours()) + ":" + window.Utils.pad2(d.getMinutes());
}

function remainingToday() {
if (!window.Store) {
return {
tasks: 0,
habits: 0
};
}

const today = todayKey();

const tasks = window.Store.state.tasks.filter(function (task) {
return task.date === today && !task.done;
}).length;

const habits = window.Store.state.habits.filter(function (habit) {
if (
window.Store.habitActiveOn &&
!window.Store.habitActiveOn(habit, today)
) {
return false;
}

return !window.Store.habitDone(habit);
}).length;

return {
tasks: tasks,
habits: habits
};
}

function buildMessage() {
const remaining = remainingToday();

return window.I18N.t("reminder.remaining", {
tasks: window.I18N.faNum(remaining.tasks),
habits: window.I18N.faNum(remaining.habits)
});
}

function showNotification(message) {
if (!("Notification" in window)) return false;
if (Notification.permission !== "granted") return false;

try {
new Notification(window.I18N.t("app.name"), {
body: message,
tag: "routine-daily-reminder"
});

return true;
} catch (error) {
return false;
}
}

function showToast(message) {
if (!window.UI || !window.UI.toast) return;

window.UI.toast(message, "info", {
duration: 8000,
action: {
label: window.I18N.t("reminder.openToday"),
onClick: function () {
if (window.App && window.App.switchTab) {
window.App.switchTab("today");
}
}
}
});
}

function fire() {
if (alreadyShownToday()) return;

const message = buildMessage();
const notified = showNotification(message);

if (!notified) {
showToast(message);
}

markShown();
}

function check() {
const settings = getSettings();

if (!settings.enabled) return;
if (alreadyShownToday()) return;
if (nowHHMM() < settings.time) return;

const remaining = remainingToday();

if (remaining.tasks + remaining.habits === 0) {
markShown();
return;
}

fire();
}

function start() {
if (timer) return;

timer = setInterval(check, 30000);
check();
}

function stop() {
if (timer) {
clearInterval(timer);
timer = null;
}
}

function permissionState() {
if (!("Notification" in window)) return "unsupported";
return Notification.permission;
}

function requestPermission(callback) {
if (!("Notification" in window)) {
if (callback) callback("unsupported");
return;
}

if (Notification.permission === "granted") {
if (callback) callback("granted");
return;
}

try {
const promise = Notification.requestPermission();

if (promise && typeof promise.then === "function") {
promise
.then(function (result) {
if (callback) callback(result);
})
.catch(function () {
if (callback) callback(Notification.permission);
});

return;
}

Notification.requestPermission(function (result) {
if (callback) callback(result);
});
} catch (error) {
if (callback) callback(Notification.permission);
}
}

function init() {
if (initialized) return;

initialized = true;

start();

document.addEventListener("visibilitychange", function () {
if (!document.hidden) {
check();
}
});
}

window.Reminder = {
init: init,
start: start,
stop: stop,
check: check,
requestPermission: requestPermission,
permissionState: permissionState
};

window.Utils.onDomReady(init);
})();
