/* ================================================================
ROUTINE — FEATURES / POMODORO.JS
Pomodoro timer with optional habit attachment.
Calculates remaining time from an absolute endTime so it survives
tab switches, device sleep, and throttled background tabs.
================================================================ */
(function () {
"use strict";
var DEFAULT_SETTINGS = {
focus: 25,
short: 5,
long: 15,
autoStartBreak: true,
autoStartFocus: false
};
var rafHandle = null;
var endTime = 0;
var remaining = 0;
var running = false;
var mode = "focus";
var sessionsToday = 0;
var attachedHabitId = null;
var sessionStartedAt = 0;
var audioCtx = null;

function L(fa, en) {
return window.I18N && window.I18N.lang === "en" ? en : fa;
}
function el(id) {
return document.getElementById(id);
}
function toast(msg, type, options) {
if (window.UI && window.UI.toast) window.UI.toast(msg, type, options);
}
function settings() {
var s = window.Store && window.Store.state && window.Store.state.settings;
var p = s && window.Utils.isPlainObject(s.pomodoro) ? s.pomodoro : {};
return {
focus: Math.max(1, Math.min(120, parseInt(p.focus, 10) || DEFAULT_SETTINGS.focus)),
short: Math.max(1, Math.min(60, parseInt(p.short, 10) || DEFAULT_SETTINGS.short)),
long: Math.max(1, Math.min(120, parseInt(p.long, 10) || DEFAULT_SETTINGS.long)),
autoStartBreak: p.autoStartBreak !== false,
autoStartFocus: !!p.autoStartFocus
};
}
function saveSettings(patch) {
if (!window.Store || !window.Store.updateSettings) return;
var current = settings();
window.Store.updateSettings({
pomodoro: Object.assign({}, current, patch || {})
});
}
function lengthForMode(m) {
var s = settings();
if (m === "short") return s.short * 60;
if (m === "long") return s.long * 60;
return s.focus * 60;
}
function todayKey() {
return window.Calendar ? window.Calendar.todayKey() : "";
}
function resetDailyCounter() {
try {
var flag = "pd_pomo_day_" + todayKey();
if (sessionStorage.getItem(flag)) {
sessionsToday = parseInt(sessionStorage.getItem(flag), 10) || 0;
} else {
sessionsToday = 0;
}
} catch (error) {
sessionsToday = 0;
}
}
function bumpDailyCounter() {
sessionsToday += 1;
try {
sessionStorage.setItem("pd_pomo_day_" + todayKey(), String(sessionsToday));
} catch (error) {
// ignore
}
}
/* ------------------------------
Audio feedback
------------------------------ */
function playChime(kind) {
var s = window.Store && window.Store.state && window.Store.state.settings;
if (s && s.sounds === false) return;
try {
var AC = window.AudioContext || window.webkitAudioContext;
if (!AC) return;
if (!audioCtx) audioCtx = new AC();
var notes = kind === "end"
? [659.25, 783.99, 987.77, 1318.51]
: [523.25, 659.25, 783.99];
notes.forEach(function (freq, i) {
var osc = audioCtx.createOscillator();
var gain = audioCtx.createGain();
osc.type = "sine";
osc.frequency.value = freq;
var start = audioCtx.currentTime + i * 0.14;
gain.gain.setValueAtTime(0.0001, start);
gain.gain.exponentialRampToValueAtTime(0.22, start + 0.02);
gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.32);
osc.connect(gain);
gain.connect(audioCtx.destination);
osc.start(start);
osc.stop(start + 0.34);
});
} catch (error) {
// audio best-effort
}
}
/* ------------------------------
Notification
------------------------------ */
function fireNotification(title, body) {
if (!("Notification" in window)) return;
if (Notification.permission !== "granted") return;
try {
new Notification(title, {
body: body,
tag: "routine-pomodoro",
silent: false
});
} catch (error) {
// ignore
}
}
/* ------------------------------
Tick loop (rAF based)
------------------------------ */
function formatMMSS(totalSeconds) {
var sec = Math.max(0, Math.floor(totalSeconds));
var m = Math.floor(sec / 60);
var s = sec % 60;
return (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s;
}
function updateTitle() {
if (!running) {
document.title = window.I18N ? window.I18N.t("app.name") : "Routine";
return;
}
var label = mode === "focus"
? L("🍅 فوکوس", "🍅 Focus")
: mode === "short"
? L("☕ استراحت کوتاه", "☕ Short break")
: L("🌴 استراحت بلند", "🌴 Long break");
document.title = formatMMSS(remaining) + " — " + label;
}
function renderDialog() {
var timeEl = el("pomoTime");
var statusEl = el("pomoStatus");
var mainBtn = el("pomoMainBtn");
var resetBtn = el("pomoResetBtn");
var sessionsEl = el("pomoSessions");
var modeBtns = document.querySelectorAll("[data-pomo-mode]");
if (timeEl) {
timeEl.textContent = window.I18N && window.I18N.lang === "fa"
? window.Utils.toFa(formatMMSS(remaining))
: formatMMSS(remaining);
}
if (statusEl) {
var label = mode === "focus"
? L("حالت فوکوس", "Focus mode")
: mode === "short"
? L("استراحت کوتاه", "Short break")
: L("استراحت بلند", "Long break");
statusEl.textContent = running
? label + " — " + L("در حال اجرا", "running")
: label;
}
if (mainBtn) {
mainBtn.textContent = running
? "⏸ " + L("توقف", "Pause")
: "▶ " + L("شروع", "Start");
mainBtn.classList.toggle("btn-danger", running);
mainBtn.classList.toggle("btn-primary", !running);
}
if (resetBtn) {
resetBtn.style.display = running || remaining < lengthForMode(mode) ? "" : "none";
}
if (sessionsEl) {
sessionsEl.textContent = window.I18N.faNum(sessionsToday) + " " + L("سشن امروز", "sessions today");
}
modeBtns.forEach(function (btn) {
btn.classList.toggle("active", btn.dataset.pomoMode === mode);
btn.setAttribute("aria-pressed", btn.dataset.pomoMode === mode ? "true" : "false");
});
updateTitle();
}
function tick() {
if (!running) return;
var now = Date.now();
remaining = Math.max(0, Math.ceil((endTime - now) / 1000));
renderDialog();
if (remaining <= 0) {
onSessionEnd();
return;
}
rafHandle = requestAnimationFrame(tick);
}
function start() {
if (running) return;
if (remaining <= 0) remaining = lengthForMode(mode);
running = true;
endTime = Date.now() + remaining * 1000;
if (mode === "focus") sessionStartedAt = Date.now();
rafHandle = requestAnimationFrame(tick);
renderDialog();
}
function pause() {
if (!running) return;
running = false;
remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
if (rafHandle) cancelAnimationFrame(rafHandle);
renderDialog();
}
function reset() {
running = false;
if (rafHandle) cancelAnimationFrame(rafHandle);
remaining = lengthForMode(mode);
endTime = 0;
sessionStartedAt = 0;
renderDialog();
}
function setMode(m) {
if (m === mode && !running) return;
pause();
mode = m === "short" || m === "long" ? m : "focus";
remaining = lengthForMode(mode);
renderDialog();
}
function logFocusSeconds(seconds) {
if (!attachedHabitId || !window.Store || !window.Store.setLog) return;
var habit = window.Store.state.habits.find(function (h) {
return String(h.id) === String(attachedHabitId);
});
if (!habit || habit.type !== "timer") return;
var key = todayKey();
var log = window.Store.getLog(habit.id, key);
window.Store.setLog(habit.id, {
seconds: (log.seconds || 0) + seconds,
value: (log.value || 0) + seconds
}, key);
}
function awardPoints() {
if (!window.Game || !window.Game.derive) return;
try {
window.Store.notify("pomodoro:session");
} catch (error) {
// ignore
}
}
function onSessionEnd() {
running = false;
if (rafHandle) cancelAnimationFrame(rafHandle);
var finishedMode = mode;
if (finishedMode === "focus") {
var seconds = sessionStartedAt
? Math.max(0, Math.floor((Date.now() - sessionStartedAt) / 1000))
: lengthForMode("focus");
logFocusSeconds(seconds);
bumpDailyCounter();
awardPoints();
playChime("end");
fireNotification(
window.I18N.t("app.name"),
L("🍅 سشن فوکوس تمام شد! وقت استراحت است", "🍅 Focus session complete! Time for a break")
);
toast(
"🍅 " + L("سشن فوکوس تمام شد", "Focus session done") + " — +" + window.I18N.faNum(15) + " ⚡",
"success",
{ duration: 6000 }
);
var nextMode = sessionsToday % 4 === 0 ? "long" : "short";
mode = nextMode;
remaining = lengthForMode(nextMode);
renderDialog();
if (settings().autoStartBreak) {
setTimeout(start, 1200);
}
} else {
playChime("break");
fireNotification(
window.I18N.t("app.name"),
L("استراحت تمام شد! آمادهٔ فوکوس بعدی؟", "Break is over! Ready for the next focus?")
);
toast(
L("☕ استراحت تمام شد", "☕ Break is over"),
"info",
{ duration: 5000 }
);
mode = "focus";
remaining = lengthForMode("focus");
renderDialog();
if (settings().autoStartFocus) {
setTimeout(start, 1200);
}
}
sessionStartedAt = 0;
}
/* ------------------------------
Dialog
------------------------------ */
function buildHabitOptions() {
if (!window.Store || !window.Store.state) return "";
var habits = window.Store.state.habits.filter(function (h) {
return h.type === "timer";
});
if (!habits.length) {
return '<option value="">' + L("— عادتی برای اتصال وجود ندارد —", "— No timer habits available —") + "</option>";
}
var opts = '<option value="">' + L("بدون اتصال به عادت", "Not attached to any habit") + "</option>";
habits.forEach(function (h) {
var sel = attachedHabitId && String(h.id) === String(attachedHabitId) ? " selected" : "";
opts += '<option value="' + h.id + '"' + sel + ">" + window.Utils.escapeHtml(h.name) + "</option>";
});
return opts;
}
function open() {
if (!window.UI || !window.UI.modal) return;
resetDailyCounter();
if (!running && remaining <= 0) remaining = lengthForMode(mode);
var s = settings();
var html =
'<div class="pomo-wrap">' +
'<div class="pomo-modes" role="group" aria-label="' + L("انتخاب حالت", "Select mode") + '">' +
'<button class="pomo-mode' + (mode === "focus" ? " active" : "") + '" data-pomo-mode="focus" aria-pressed="' + (mode === "focus") + '">🍅 ' + L("فوکوس", "Focus") + '<br><small>' + window.I18N.faNum(s.focus) + " " + L("دقیقه", "min") + "</small></button>" +
'<button class="pomo-mode' + (mode === "short" ? " active" : "") + '" data-pomo-mode="short" aria-pressed="' + (mode === "short") + '">☕ ' + L("کوتاه", "Short") + '<br><small>' + window.I18N.faNum(s.short) + " " + L("دقیقه", "min") + "</small></button>" +
'<button class="pomo-mode' + (mode === "long" ? " active" : "") + '" data-pomo-mode="long" aria-pressed="' + (mode === "long") + '">🌴 ' + L("بلند", "Long") + '<br><small>' + window.I18N.faNum(s.long) + " " + L("دقیقه", "min") + "</small></button>" +
"</div>" +
'<div class="pomo-time" id="pomoTime">' + (window.I18N.lang === "fa" ? window.Utils.toFa(formatMMSS(remaining)) : formatMMSS(remaining)) + "</div>" +
'<div class="pomo-status" id="pomoStatus"></div>' +
'<div class="pomo-sessions" id="pomoSessions"></div>' +
'<div class="pomo-actions">' +
'<button class="btn btn-primary" id="pomoMainBtn">▶ ' + L("شروع", "Start") + "</button>" +
'<button class="btn btn-ghost" id="pomoResetBtn">↺ ' + L("بازنشانی", "Reset") + "</button>" +
"</div>" +
'<details class="pomo-options">' +
"<summary>⚙️ " + L("تنظیمات و اتصال", "Settings & attach") + "</summary>" +
'<div class="pomo-options-grid">' +
'<label>' + L("اتصال به عادت تایمری (اختیاری)", "Attach to a timer habit (optional)") +
'<select id="pomoAttach" class="input">' + buildHabitOptions() + "</select></label>" +
'<label>' + L("فوکوس (دقیقه)", "Focus (min)") +
'<input id="pomoFocusMin" type="number" min="1" max="120" class="input" value="' + s.focus + '"></label>' +
'<label>' + L("استراحت کوتاه (دقیقه)", "Short break (min)") +
'<input id="pomoShortMin" type="number" min="1" max="60" class="input" value="' + s.short + '"></label>' +
'<label>' + L("استراحت بلند (دقیقه)", "Long break (min)") +
'<input id="pomoLongMin" type="number" min="1" max="120" class="input" value="' + s.long + '"></label>' +
'<label class="pomo-check">' +
'<input type="checkbox" id="pomoAutoBreak"' + (s.autoStartBreak ? " checked" : "") + "> " +
L("شروع خودکار استراحت", "Auto-start break") +
"</label>" +
'<label class="pomo-check">' +
'<input type="checkbox" id="pomoAutoFocus"' + (s.autoStartFocus ? " checked" : "") + "> " +
L("شروع خودکار فوکوس بعد از استراحت", "Auto-start next focus after break") +
"</label>" +
'<button class="btn btn-ghost btn-sm" id="pomoPermBtn" style="grid-column:1/-1">🔔 ' +
L("فعال‌سازی اعلان مرورگر", "Enable browser notifications") +
"</button>" +
"</div>" +
"</details>" +
'<p class="pomo-hint">' + L("هر ۴ سشن فوکوس، یک استراحت بلند پیشنهاد می‌شود. سشن‌های فوکوس در گیمیفیکیشن امتیاز می‌گیرند.", "Every 4 focus sessions triggers a long break. Focus sessions earn gamification points.") + "</p>" +
"</div>";
var content = window.UI.modal.open("🍅 " + L("پومودورو", "Pomodoro"), html);
if (!content) return;
content.querySelectorAll("[data-pomo-mode]").forEach(function (btn) {
btn.addEventListener("click", function () {
setMode(btn.dataset.pomoMode);
});
});
var mainBtn = el("pomoMainBtn");
var resetBtn = el("pomoResetBtn");
if (mainBtn) {
mainBtn.addEventListener("click", function () {
if (running) pause();
else start();
});
}
if (resetBtn) {
resetBtn.addEventListener("click", function () {
reset();
});
}
var attachEl = el("pomoAttach");
if (attachEl) {
attachEl.addEventListener("change", function () {
attachedHabitId = attachEl.value || null;
});
}
["Focus", "Short", "Long"].forEach(function (name) {
var input = el("pomo" + name + "Min");
if (!input) return;
input.addEventListener("change", function () {
var v = Math.max(1, parseInt(input.value, 10) || 1);
input.value = v;
var patch = {};
patch[name.toLowerCase()] = v;
saveSettings(patch);
if (!running && ((name === "Focus" && mode === "focus") ||
(name === "Short" && mode === "short") ||
(name === "Long" && mode === "long"))) {
remaining = v * 60;
}
renderDialog();
updateModeLabels();
});
});
var autoBreak = el("pomoAutoBreak");
var autoFocus = el("pomoAutoFocus");
if (autoBreak) {
autoBreak.addEventListener("change", function () {
saveSettings({ autoStartBreak: autoBreak.checked });
});
}
if (autoFocus) {
autoFocus.addEventListener("change", function () {
saveSettings({ autoStartFocus: autoFocus.checked });
});
}
var permBtn = el("pomoPermBtn");
if (permBtn) {
permBtn.addEventListener("click", function () {
if (!("Notification" in window)) {
toast(L("این مرورگر از اعلان پشتیبانی نمی‌کند", "This browser does not support notifications"), "error");
return;
}
try {
Notification.requestPermission().then(function (result) {
if (result === "granted") {
toast(L("✅ اعلان فعال شد", "✅ Notifications enabled"), "success");
new Notification(window.I18N.t("app.name"), {
body: L("🔔 اعلان پومودورو فعال است", "🔔 Pomodoro notifications are active"),
tag: "routine-pomo-test"
});
} else {
toast(L("❌ اجازه داده نشد", "❌ Permission denied"), "error");
}
});
} catch (error) {
toast(L("خطا در درخواست اجازه", "Permission request failed"), "error");
}
});
}
renderDialog();
}
function updateModeLabels() {
var s = settings();
var map = { focus: s.focus, short: s.short, long: s.long };
document.querySelectorAll("[data-pomo-mode]").forEach(function (btn) {
var small = btn.querySelector("small");
if (small) {
small.textContent = window.I18N.faNum(map[btn.dataset.pomoMode]) + " " + L("دقیقه", "min");
}
});
}
function closeHandler() {
if (!running) {
updateTitle();
}
}
function init() {
resetDailyCounter();
remaining = lengthForMode(mode);
window.setInterval(function () {
resetDailyCounter();
if (!running) renderDialog();
}, 60000);
document.addEventListener("visibilitychange", function () {
if (!document.hidden && running) {
if (rafHandle) cancelAnimationFrame(rafHandle);
rafHandle = requestAnimationFrame(tick);
}
});
document.addEventListener("keydown", function (event) {
var overlay = el("modalOverlay");
if (!overlay || !overlay.classList.contains("active")) return;
var title = el("modalTitle");
if (!title || title.textContent.indexOf(L("پومودورو", "Pomodoro")) === -1) return;
if (event.code === "Space" &&
event.target.tagName !== "INPUT" &&
event.target.tagName !== "TEXTAREA" &&
event.target.tagName !== "SELECT") {
event.preventDefault();
if (running) pause();
else start();
}
});
}
window.Pomodoro = {
open: open,
close: closeHandler
};
window.Utils.onDomReady(init);
})();