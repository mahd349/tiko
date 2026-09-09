/* ================================================================
ROUTINE — FEATURES / SHARE-CARD.JS
Creates a shareable streak card using Canvas.
================================================================ */
(function () {
"use strict";

let currentHabitId = null;

function L(faText, enText) {
return window.I18N.lang === "en" ? enText : faText;
}

function toast(message, type) {
if (window.UI && window.UI.toast) {
window.UI.toast(message, type);
}
}

function getHabits() {
return window.Store.state.habits.slice();
}

function findHabit(id) {
return getHabits().find(function (habit) {
return String(habit.id) === String(id);
});
}

function hexToRgb(hex) {
hex = String(hex || "").trim();
if (hex.charAt(0) === "#") {
hex = hex.slice(1);
}

if (hex.length === 3) {
hex = hex
.split("")
.map(function (char) {
return char + char;
})
.join("");
}

const int = parseInt(hex, 16);
if (isNaN(int)) {
return {
r: 139,
g: 92,
b: 246
};
}

return {
r: (int >> 16) & 255,
g: (int >> 8) & 255,
b: int & 255
};
}

function rgba(hex, alpha) {
const color = hexToRgb(hex);
return "rgba(" + color.r + "," + color.g + "," + color.b + "," + alpha + ")";
}

function roundRect(ctx, x, y, width, height, radius) {
ctx.beginPath();
ctx.moveTo(x + radius, y);
ctx.lineTo(x + width - radius, y);
ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
ctx.lineTo(x + width, y + height - radius);
ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
ctx.lineTo(x + radius, y + height);
ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
ctx.lineTo(x, y + radius);
ctx.quadraticCurveTo(x, y, x + radius, y);
ctx.closePath();
}

function drawOrb(ctx, x, y, radius, color) {
const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
gradient.addColorStop(0, color);
gradient.addColorStop(1, "rgba(0,0,0,0)");
ctx.fillStyle = gradient;
ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}

function wrapText(ctx, text, maxWidth) {
const words = String(text || "").split(/\s+/);
const lines = [];
let line = "";

for (let i = 0; i < words.length; i += 1) {
const word = words[i];
const test = line ? line + " " + word : word;

if (ctx.measureText(test).width > maxWidth && line) {
lines.push(line);
line = word;
} else {
line = test;
}
}

if (line) {
lines.push(line);
}

return lines;
}

async function ensureFonts() {
try {
if (document.fonts) {
await document.fonts.load('900 92px "Vazirmatn"', "روتین");
await document.fonts.load('800 46px "Vazirmatn"', "روتین");
await document.fonts.load('700 34px "Vazirmatn"', "روتین");
await document.fonts.ready;
}
} catch (error) {
// Font loading is best-effort.
}
}

function buildShareText(habit) {
const streaks = window.Store.habitStreaks(habit);
const value = streaks.current > 0 ? streaks.current : streaks.best;

return [
habit.name,
window.I18N.t("app.name"),
window.I18N.days(value),
window.I18N.t("habits.record") + " " + window.I18N.faNum(streaks.best),
window.Calendar.formatDate(new Date())
].join("\n");
}

async function drawCard(canvas, habit) {
if (!canvas || !habit) return;

await ensureFonts();

const ctx = canvas.getContext("2d");
const W = canvas.width;
const H = canvas.height;
const lang = window.I18N.lang;
const rtl = lang === "fa";
const color = habit.color || "#8b5cf6";
const streaks = window.Store.habitStreaks(habit);
const value = streaks.current > 0 ? streaks.current : streaks.best;

ctx.clearRect(0, 0, W, H);

/* Background */
const bg = ctx.createLinearGradient(0, 0, 0, H);
bg.addColorStop(0, "#04060d");
bg.addColorStop(0.55, "#091020");
bg.addColorStop(1, "#0c0a18");
ctx.fillStyle = bg;
ctx.fillRect(0, 0, W, H);

/* Glow orbs */
drawOrb(ctx, W * 0.18, H * 0.16, 320, rgba(color, 0.28));
drawOrb(ctx, W * 0.84, H * 0.20, 280, "rgba(56,189,248,0.16)");
drawOrb(ctx, W * 0.72, H * 0.86, 320, rgba(color, 0.20));

/* Main card */
const pad = 64;
roundRect(ctx, pad, pad, W - pad * 2, H - pad * 2, 58);

const card = ctx.createLinearGradient(0, pad, 0, H - pad);
card.addColorStop(0, rgba(color, 0.20));
card.addColorStop(0.45, "rgba(255,255,255,0.05)");
card.addColorStop(1, "rgba(255,255,255,0.02)");

ctx.fillStyle = card;
ctx.fill();
ctx.strokeStyle = rgba(color, 0.35);
ctx.lineWidth = 3;
ctx.stroke();

/* Inner border */
roundRect(ctx, pad + 18, pad + 18, W - (pad + 18) * 2, H - (pad + 18) * 2, 44);
ctx.strokeStyle = "rgba(255,255,255,0.08)";
ctx.lineWidth = 1;
ctx.stroke();

ctx.textAlign = "center";
ctx.textBaseline = "middle";

try {
ctx.direction = rtl ? "rtl" : "ltr";
} catch (error) {
// Some browsers may not support canvas direction.
}

/* Logo */
const logoY = pad + 96;
roundRect(ctx, W / 2 - 46, logoY - 46, 92, 92, 26);

const logoGrad = ctx.createLinearGradient(
W / 2 - 46,
logoY - 46,
W / 2 + 46,
logoY + 46
);
logoGrad.addColorStop(0, "#6366f1");
logoGrad.addColorStop(1, "#a855f7");

ctx.fillStyle = logoGrad;
ctx.fill();

ctx.fillStyle = "#ffffff";
ctx.font = '900 52px "Vazirmatn", Arial, sans-serif';
ctx.fillText("✓", W / 2, logoY + 4);

/* App name + date */
ctx.font = '800 34px "Vazirmatn", Arial, sans-serif';
ctx.fillStyle = "rgba(255,255,255,0.92)";
ctx.fillText(window.I18N.t("app.name"), W / 2, logoY + 96);

ctx.font = '600 28px "Vazirmatn", Arial, sans-serif';
ctx.fillStyle = "rgba(255,255,255,0.58)";
ctx.fillText(window.Calendar.formatDate(new Date()), W / 2, logoY + 146);

/* Habit name */
let y = H / 2 - 150;
ctx.font = '900 68px "Vazirmatn", Arial, sans-serif';
ctx.fillStyle = "#ffffff";

const nameLines = wrapText(ctx, habit.name, W - 300).slice(0, 2);
nameLines.forEach(function (line, index) {
ctx.fillText(line, W / 2, y + index * 88);
});

y += nameLines.length * 88 + 14;

/* Category chip */
const categoryText = window.I18N.t("category." + habit.category);
ctx.font = '700 30px "Vazirmatn", Arial, sans-serif';

const chipWidth = ctx.measureText(categoryText).width + 76;
roundRect(ctx, W / 2 - chipWidth / 2, y, chipWidth, 62, 999);

ctx.fillStyle = rgba(color, 0.18);
ctx.fill();
ctx.strokeStyle = rgba(color, 0.42);
ctx.lineWidth = 2;
ctx.stroke();

ctx.fillStyle = "#ffffff";
ctx.fillText(categoryText, W / 2, y + 32);

/* Streak circle */
const streakY = H / 2 + 180;

ctx.beginPath();
ctx.arc(W / 2, streakY, 185, 0, Math.PI * 2);
ctx.fillStyle = "rgba(255,255,255,0.08)";
ctx.fill();

ctx.beginPath();
ctx.arc(W / 2, streakY, 185, 0, Math.PI * 2);
ctx.strokeStyle = rgba(color, 0.30);
ctx.lineWidth = 3;
ctx.stroke();

/* Streak number */
ctx.font = '900 132px "Vazirmatn", Arial, sans-serif';

const textGradient = ctx.createLinearGradient(
W / 2 - 220,
streakY,
W / 2 + 220,
streakY
);
textGradient.addColorStop(0, "#ffffff");
textGradient.addColorStop(1, rgba(color, 0.92));

ctx.fillStyle = textGradient;
ctx.fillText("🔥 " + window.I18N.faNum(value), W / 2, streakY - 18);

/* Streak label */
ctx.font = '800 46px "Vazirmatn", Arial, sans-serif';
ctx.fillStyle = "rgba(255,255,255,0.84)";
ctx.fillText(window.I18N.days(value), W / 2, streakY + 106);

/* Best record */
if (streaks.best > 0) {
ctx.font = '700 34px "Vazirmatn", Arial, sans-serif';
ctx.fillStyle = "rgba(255,255,255,0.62)";
ctx.fillText(
window.I18N.t("habits.record") + " " + window.I18N.faNum(streaks.best),
W / 2,
streakY + 176
);
}

/* Footer */
ctx.font = '700 30px "Vazirmatn", Arial, sans-serif';
ctx.fillStyle = "rgba(255,255,255,0.58)";
ctx.fillText(window.I18N.t("app.tagline"), W / 2, H - pad - 66);
}

function downloadCanvas(canvas, habit) {
const filename =
"routine-streak-" +
window.Utils.sanitizeText(habit.name, 30).replace(/\s+/g, "-") +
"-" +
window.Calendar.todayKey() +
".png";

if (canvas.toBlob) {
canvas.toBlob(function (blob) {
if (!blob) {
toast(window.I18N.t("share.imageError"), "error");
return;
}

window.Utils.downloadBlob(filename, blob);
toast(window.I18N.t("toast.imageDownloaded"), "success");
}, "image/png");
return;
}

const link = document.createElement("a");
link.href = canvas.toDataURL("image/png");
link.download = filename;
document.body.appendChild(link);
link.click();
link.remove();
toast(window.I18N.t("toast.imageDownloaded"), "success");
}

function open() {
if (!window.UI || !window.UI.modal) return;

const habits = getHabits();

if (!habits.length) {
const emptyHtml =
'<div class="sc-empty">' +
'<div style="font-size:42px;margin-bottom:12px">🔥</div>' +
"<p>" +
window.I18N.t("share.noHabits") +
"</p>" +
"</div>";

window.UI.modal.open(window.I18N.t("share.title"), emptyHtml);
return;
}

if (!currentHabitId || !findHabit(currentHabitId)) {
currentHabitId = habits[0].id;
}

const options = habits
.map(function (habit) {
return (
'<option value="' +
habit.id +
'"' +
(String(habit.id) === String(currentHabitId) ? " selected" : "") +
">" +
window.Utils.escapeHtml(habit.name) +
"</option>"
);
})
.join("");

const html =
'<div class="sc-wrap">' +
'<select id="scHabitSelect" class="input sc-pick" aria-label="' +
window.I18N.t("share.selectHabit") +
'">' +
options +
"</select>" +
'<canvas id="scCanvas" class="sc-canvas" width="1080" height="1080" role="img" aria-label="' +
window.I18N.t("share.title") +
'"></canvas>' +
'<div class="sc-actions">' +
'<button class="btn btn-primary" data-action="sc-download">' +
window.I18N.t("share.download") +
"</button>" +
'<button class="btn btn-ghost" data-action="sc-copy">' +
window.I18N.t("share.copyText") +
"</button>" +
'<button class="btn btn-ghost" data-action="sc-share">' +
window.I18N.t("share.share") +
"</button>" +
'<button class="btn btn-ghost" data-action="close-modal">' +
window.I18N.t("common.close") +
"</button>" +
"</div>" +
"</div>";

const content = window.UI.modal.open(window.I18N.t("share.title"), html);
if (!content) return;

const select = content.querySelector("#scHabitSelect");
const canvas = content.querySelector("#scCanvas");
const downloadBtn = content.querySelector('[data-action="sc-download"]');
const copyBtn = content.querySelector('[data-action="sc-copy"]');
const shareBtn = content.querySelector('[data-action="sc-share"]');
const closeBtn = content.querySelector('[data-action="close-modal"]');

function render() {
const habit = findHabit(currentHabitId);
if (!habit || !canvas) return;
drawCard(canvas, habit).catch(function () {
toast(window.I18N.t("share.imageError"), "error");
});
}

if (select) {
select.addEventListener("change", function () {
currentHabitId = select.value;
render();
});
}

if (downloadBtn) {
downloadBtn.addEventListener("click", function () {
const habit = findHabit(currentHabitId);
if (!habit || !canvas) return;
downloadCanvas(canvas, habit);
});
}

if (copyBtn) {
copyBtn.addEventListener("click", function () {
const habit = findHabit(currentHabitId);
if (!habit) return;

window.Utils.copyText(buildShareText(habit))
.then(function () {
toast(window.I18N.t("toast.copyDone"), "success");
})
.catch(function () {
toast(window.I18N.t("toast.copyFail"), "error");
});
});
}

if (shareBtn) {
if (!navigator.share) {
shareBtn.style.display = "none";
} else {
shareBtn.addEventListener("click", function () {
const habit = findHabit(currentHabitId);
if (!habit) return;

navigator
.share({
title: window.I18N.t("app.name"),
text: buildShareText(habit)
})
.catch(function () {
// User closed share sheet.
});
});
}
}

if (closeBtn) {
closeBtn.addEventListener("click", function () {
window.UI.modal.close();
});
}

render();
}

window.ShareCard = {
open: open
};
})();
