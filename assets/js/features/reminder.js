/* ================================================================
ROUTINE — FEATURES / REMINDER.JS
Daily reminder engine.
Works while the app is open. Uses the Notification API when
permitted, otherwise falls back to an in-app toast.
================================================================ */
(function () {
"use strict";

const LAST_SHOWN_KEY = "pd_reminder_lastShown";

let checkTimer = null;
let initialized = false;

function getSettings() {
return (
(window.Store && window.Store.state.settings.reminder) || {
enabled: false,
time: "20:00"
}
);
}

function todayKey() {
return window.Calendar ? window.Calendar.todayKey() : "";
}

function lastShown() {
try {
return localStorage.getItem(LAST_SHOWN_KEY) || "";
} catch (error) {
return "";
}
}

function markShown() {
try {
localStorage.setItem(LAST_SHOWN_KEY, todayKey());
} catch (error) {
// ignore
}
}

function alreadyShownToday() {
return lastShown() === todayKey();
}

function nowHHMM() {
const d = new Date();
const h = String(d.getHours()).padStart(2, "0");
const m = String(d.getMinutes()).padStart(2, "0");
return h + ":" + m;
}

function remainingToday() {
if (!window.Store) {
return { tasks: 0, habits: 0 };
}

const today = todayKey();

const tasks = window.Store.state.tasks.filter(function (task) {
return task.date === today && !task.done;
}).length;

const habits = window.Store.state.habits.filter(function (habit) {
return !window.Store.habitDone(habit);
}).length;

return { tasks: tasks, habits: habits };
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

/* Fire once the clock passes the configured time (handles opening late). */
if (nowHHMM() >= settings.time) {
const remaining = remainingToday();

if (remaining.tasks + remaining.habits > 0) {
fire();
} else {
/* Nothing left to do; stay quiet but don't nag later. */
markShown();
}
}
}

function start() {
if (checkTimer) return;
checkTimer = setInterval(check, 30000);
}

function stop() {
if (checkTimer) {
clearInterval(checkTimer);
checkTimer = null;
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

Notification.requestPermission().then(function (permission) {
if (callback) callback(permission);
});
}

function init() {
if (initialized) return;
initialized = true;
start();
}

window.Reminder = {
init: init,
start: start,
stop: stop,
check: check,
fire: fire,
requestPermission: requestPermission,
permissionState: permissionState
};

window.Utils.onDomReady(init);
})();