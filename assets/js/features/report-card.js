/* ================================================================
ROUTINE — FEATURES / REPORT-CARD.JS
Shareable visual report card (Canvas) with range select.
================================================================ */
(function () {
"use strict";
function L(fa, en) {
return window.I18N && window.I18N.lang === "en" ? en : fa;
}
function toast(message, type) {
if (window.UI && window.UI.toast) window.UI.toast(message, type);
}
function roundRect(ctx, x, y, w, h, r) {
ctx.beginPath();
ctx.moveTo(x + r, y);
ctx.lineTo(x + w - r, y);
ctx.quadraticCurveTo(x + w, y, x + w, y + r);
ctx.lineTo(x + w, y + h - r);
ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
ctx.lineTo(x + r, y + h);
ctx.quadraticCurveTo(x, y + h, x, y + h - r);
ctx.lineTo(x, y + r);
ctx.quadraticCurveTo(x, y, x + r, y);
ctx.closePath();
}
function rangeKeysFor(mode) {
const keys = [];
const today = window.Calendar.todayKey();
if (mode === "month") {
const t = window.Calendar.getToday("fa");
let cursor = window.Calendar.toKey(t.jy, t.jm, 1, "fa");
let guard = 0;
while (cursor <= today && guard < 31) {
keys.push(cursor);
cursor = window.Calendar.keyShift(1, cursor);
guard += 1;
}
return keys;
}
if (mode === "year") {
const t = window.Calendar.getToday("fa");
let cursor = window.Calendar.toKey(t.jy, 1, 1, "fa");
let guard = 0;
while (cursor <= today && guard < 366) {
keys.push(cursor);
cursor = window.Calendar.keyShift(1, cursor);
guard += 1;
}
return keys;
}
for (let i = 29; i >= 0; i -= 1) {
keys.push(window.Calendar.keyShift(-i));
}
return keys;
}
function rangeLabel(mode) {
if (mode === "month") {
const t = window.Calendar.getToday("fa");
return window.Calendar.formatMonthYear(t.jy, t.jm, window.I18N.lang);
}
if (mode === "year") {
const t = window.Calendar.getToday("fa");
return window.I18N.lang === "fa"
? "سال " + window.Utils.toFa(t.jy)
: "Year " + t.jy;
}
return L("۳۰ روز اخیر", "Last 30 days");
}
function computeStats(keys) {
const keySet = {};
keys.forEach(function (k) {
keySet[k] = true;
});
let pctSum = 0;
let pctDays = 0;
let activeDays = 0;
let focus = 0;
const timerIds = {};
window.Store.state.habits.forEach(function (h) {
if (h.type === "timer") timerIds[String(h.id)] = true;
});
const today = window.Calendar.todayKey();
keys.forEach(function (key) {
const score = window.Store.dayScore(key);
if (score.total > 0) {
pctSum += score.pct;
pctDays += 1;
}
const day = window.Store.state.logs[key];
if (day && Object.keys(day).length) activeDays += 1;
if (day) {
Object.keys(day).forEach(function (hid) {
if (!timerIds[String(hid)]) return;
const log = day[hid];
focus += key === today && log.startedAt
? window.Store.liveSeconds(hid, log)
: log.seconds || 0;
});
}
});
const tasks = window.Store.state.tasks.filter(function (t) {
return keySet[t.date];
});
const doneTasks = tasks.filter(function (t) {
return window.Store.isTaskDoneOnDate(t, t.date);
}).length;
let topHabit = null;
let topRate = -1;
window.Store.state.habits.forEach(function (habit) {
let active = 0;
let done = 0;
keys.forEach(function (key) {
if (!window.Store.habitExistedOn(habit, key)) return;
if (window.Store.habitActiveOn && !window.Store.habitActiveOn(habit, key)) return;
active += 1;
if (window.Store.habitDone(habit, key)) done += 1;
});
if (active >= 3) {
const rate = done / active;
if (rate > topRate) {
topRate = rate;
topHabit = habit;
}
}
});
const bestStreak = window.Store.state.habits.reduce(function (max, h) {
return Math.max(max, window.Store.habitStreaks(h).best);
}, 0);
return {
completion: pctDays ? Math.round((pctSum / pctDays) * 100) : 0,
activeDays: activeDays,
focusHours: focus / 3600,
tasksDone: doneTasks,
tasksTotal: tasks.length,
topHabit: topHabit,
topRate: topRate,
bestStreak: bestStreak,
days: keys.map(function (key) {
return Math.round(window.Store.dayScore(key).pct * 100);
})
};
}
async function ensureFonts() {
try {
if (document.fonts) {
await document.fonts.load('900 96px "Vazirmatn"', "روتین");
await document.fonts.load('800 40px "Vazirmatn"', "روتین");
await document.fonts.ready;
}
} catch (error) {
// best-effort
}
}
async function drawCard(canvas, mode) {
if (!canvas) return;
await ensureFonts();
const ctx = canvas.getContext("2d");
const W = canvas.width;
const H = canvas.height;
const keys = rangeKeysFor(mode);
const s = computeStats(keys);
try {
ctx.direction = window.I18N.lang === "fa" ? "rtl" : "ltr";
} catch (error) {
// ignore
}
ctx.clearRect(0, 0, W, H);
const bg = ctx.createLinearGradient(0, 0, 0, H);
bg.addColorStop(0, "#04060d");
bg.addColorStop(0.55, "#091020");
bg.addColorStop(1, "#0c0a18");
ctx.fillStyle = bg;
ctx.fillRect(0, 0, W, H);
const pad = 64;
roundRect(ctx, pad, pad, W - pad * 2, H - pad * 2, 58);
ctx.fillStyle = "rgba(255,255,255,0.05)";
ctx.fill();
ctx.strokeStyle = "rgba(139,92,246,0.35)";
ctx.lineWidth = 3;
ctx.stroke();
ctx.textAlign = "center";
ctx.textBaseline = "middle";
const logoY = pad + 92;
roundRect(ctx, W / 2 - 42, logoY - 42, 84, 84, 24);
const lg = ctx.createLinearGradient(W / 2 - 42, logoY - 42, W / 2 + 42, logoY + 42);
lg.addColorStop(0, "#6366f1");
lg.addColorStop(1, "#a855f7");
ctx.fillStyle = lg;
ctx.fill();
ctx.fillStyle = "#fff";
ctx.font = '900 46px "Vazirmatn", Arial, sans-serif';
ctx.fillText("✓", W / 2, logoY + 4);
ctx.font = '800 34px "Vazirmatn", Arial, sans-serif';
ctx.fillStyle = "rgba(255,255,255,0.92)";
ctx.fillText(window.I18N.t("app.name"), W / 2, logoY + 88);
ctx.font = '600 28px "Vazirmatn", Arial, sans-serif';
ctx.fillStyle = "rgba(255,255,255,0.58)";
ctx.fillText(rangeLabel(mode), W / 2, logoY + 136);
ctx.font = '900 150px "Vazirmatn", Arial, sans-serif';
const cg = ctx.createLinearGradient(W / 2 - 200, 0, W / 2 + 200, 0);
cg.addColorStop(0, "#ffffff");
cg.addColorStop(1, "#8b5cf6");
ctx.fillStyle = cg;
ctx.fillText(window.I18N.percent(s.completion), W / 2, H / 2 + 10);
ctx.font = '700 32px "Vazirmatn", Arial, sans-serif';
ctx.fillStyle = "rgba(255,255,255,0.66)";
ctx.fillText(L("میانگین تکمیل روزانه", "Average daily completion"), W / 2, H / 2 + 108);
const bars = s.days.slice(-31);
const bw = (W - pad * 2 - 120) / Math.max(1, bars.length);
const baseY = H - pad - 190;
bars.forEach(function (v, i) {
const h = Math.max(4, (v / 100) * 120);
ctx.fillStyle = v > 0 ? "rgba(139,92,246,0.85)" : "rgba(255,255,255,0.10)";
roundRect(ctx, pad + 60 + i * bw + bw * 0.15, baseY - h, bw * 0.7, h, 4);
ctx.fill();
});
const rowY = H - pad - 120;
ctx.font = '700 30px "Vazirmatn", Arial, sans-serif';
ctx.fillStyle = "rgba(255,255,255,0.80)";
ctx.fillText(
L("روز فعال: ", "Active days: ") + window.I18N.faNum(s.activeDays) +
"   ·   " +
L("تمرکز: ", "Focus: ") + window.I18N.faNum(s.focusHours.toFixed(1)) + L(" ساعت", " h") +
"   ·   " +
L("استریک برتر: ", "Best streak: ") + window.I18N.days(s.bestStreak),
W / 2,
rowY
);
ctx.fillText(
L("وظایف: ", "Tasks: ") + window.I18N.faNum(s.tasksDone) + "/" + window.I18N.faNum(s.tasksTotal) +
(s.topHabit
? "   ·   " + L("منظم‌ترین: ", "Most consistent: ") + s.topHabit.name + " " + window.I18N.percent(Math.round(s.topRate * 100))
: ""),
W / 2,
rowY + 48
);
ctx.font = '700 28px "Vazirmatn", Arial, sans-serif';
ctx.fillStyle = "rgba(255,255,255,0.55)";
ctx.fillText(window.I18N.t("app.tagline"), W / 2, H - pad - 40);
}
function open() {
if (!window.UI || !window.UI.modal) return;
const html =
'<div class="sc-wrap">' +
'<select id="rcRange" class="input sc-pick" aria-label="' + L("بازهٔ گزارش", "Report range") + '">' +
'<option value="month">' + L("این ماه", "This month") + "</option>" +
'<option value="30" selected>' + L("۳۰ روز اخیر", "Last 30 days") + "</option>" +
'<option value="year">' + L("امسال", "This year") + "</option>" +
"</select>" +
'<canvas id="rcCanvas" class="sc-canvas" width="1080" height="1080" role="img" aria-label="' + L("کارت گزارش", "Report card") + '"></canvas>' +
'<div class="sc-actions">' +
'<button class="btn btn-primary" id="rcDownload">' + L("📥 دانلود تصویر", "📥 Download image") + "</button>" +
'<button class="btn btn-ghost" data-action="close-modal">' + window.I18N.t("common.close") + "</button>" +
"</div>" +
"</div>";
const content = window.UI.modal.open(L("🖼️ کارت گزارش", "🖼️ Report card"), html);
if (!content) return;
const select = content.querySelector("#rcRange");
const canvas = content.querySelector("#rcCanvas");
const downloadBtn = content.querySelector("#rcDownload");
function render() {
drawCard(canvas, select ? select.value : "30").catch(function () {
toast(L("ساخت تصویر ناموفق بود", "Image generation failed"), "error");
});
}
if (select) select.addEventListener("change", render);
if (downloadBtn) {
downloadBtn.addEventListener("click", function () {
if (!canvas) return;
const filename = "routine-report-" + window.Calendar.todayKey() + ".png";
if (canvas.toBlob) {
canvas.toBlob(function (blob) {
if (!blob) {
toast(L("ساخت تصویر ناموفق بود", "Image generation failed"), "error");
return;
}
window.Utils.downloadBlob(filename, blob);
toast(window.I18N.t("toast.imageDownloaded"), "success");
}, "image/png");
} else {
const link = document.createElement("a");
link.href = canvas.toDataURL("image/png");
link.download = filename;
document.body.appendChild(link);
link.click();
link.remove();
}
});
}
const closeBtn = content.querySelector('[data-action="close-modal"]');
if (closeBtn) {
closeBtn.addEventListener("click", function () {
window.UI.modal.close();
});
}
render();
}
function init() {
const btn = document.getElementById("reportCardBtn");
if (btn) btn.addEventListener("click", open);
}
window.ReportCard = { open: open };
window.Utils.onDomReady(init);
})();