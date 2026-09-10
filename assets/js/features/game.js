/* ================================================================
ROUTINE — FEATURES / GAME.JS
Gamification engine: points, levels, medals, challenges, celebration.
All scores are DERIVED from real history (no duplicated truth).
================================================================ */
(function () {
"use strict";
var POINTS = {
taskLow: 3,
taskMed: 5,
taskHigh: 10,
habit: 8,
perfectDay: 20,
challenge: 50,
pomodoro: 15
};
var HISTORY_DAYS = 730;
var cache = { dirty: true, data: null };
var TEMPLATES = [
{ id: "early7", icon: "sunrise", days: 7, cat: "health", fa: "چالش ۷ روز سحرخیزی", en: "7-day early rising" },
{ id: "read21", icon: "book", days: 21, cat: "learning", fa: "چالش ۲۱ روز مطالعه", en: "21-day reading" },
{ id: "fit30", icon: "run", days: 30, cat: "fitness", fa: "چالش ۳۰ روز ورزش", en: "30-day workout" },
{ id: "nophone14", icon: "nophone", days: 14, cat: "personal", fa: "چالش بدون گوشی", en: "No-phone challenge" }
];
function L(fa, en) {
return window.I18N.lang === "en" ? en : fa;
}
function toast(message, type, options) {
if (window.UI && window.UI.toast) window.UI.toast(message, type, options);
}
function el(id) {
return document.getElementById(id);
}
function game() {
if (!window.Store.state.game) {
window.Store.state.game = { medals: {}, challenges: [] };
}
return window.Store.state.game;
}
function save() {
window.Store.saveState();
window.Store.notify("game:update");
}
function findHabit(id) {
return window.Store.state.habits.find(function (h) {
return String(h.id) === String(id);
}) || null;
}
function findTemplate(id) {
return TEMPLATES.find(function (t) { return t.id === id; }) || null;
}
function iconHTML(key, size) {
if (window.Habits && window.Habits.iconHTML) {
return window.Habits.iconHTML(key, size);
}
return '<span style="font-size:' + size + 'px;line-height:1">🎯</span>';
}
function markDirty() {
cache.dirty = true;
}
/* ------------------------------
Derived scores (single source of truth)
------------------------------ */
function derive() {
if (!cache.dirty && cache.data) return cache.data;
var points = 0;
var bestStreak = 0;
var maxRun70 = 0;
var run70 = 0;
var perfectDays = 0;
for (var i = 0; i < HISTORY_DAYS; i += 1) {
var key = window.Calendar.keyShift(-i);
var score = window.Store.dayScore(key);
if (!score.total || score.future) {
run70 = 0;
continue;
}
window.Store.getTasksForDate(key).forEach(function (task) {
if (!window.Store.isTaskDoneOnDate(task, key)) return;
points += task.priority === "high" ? POINTS.taskHigh : task.priority === "low" ? POINTS.taskLow : POINTS.taskMed;
});
var habitsDone = 0;
window.Store.state.habits.forEach(function (habit) {
if (!window.Store.habitExistedOn(habit, key)) return;
if (window.Store.habitActiveOn && !window.Store.habitActiveOn(habit, key)) return;
if (window.Store.habitDone(habit, key)) habitsDone += 1;
});
points += habitsDone * POINTS.habit;
if (score.pct >= 1) {
points += POINTS.perfectDay;
perfectDays += 1;
}
run70 = score.pct >= 0.7 ? run70 + 1 : 0;
if (run70 > maxRun70) maxRun70 = run70;
}
window.Store.state.habits.forEach(function (habit) {
var s = window.Store.habitStreaks(habit);
if (s.best > bestStreak) bestStreak = s.best;
});
var pomoToday = 0;
try {
pomoToday = parseInt(sessionStorage.getItem("pd_pomo_day_" + window.Calendar.todayKey()) || "0", 10) || 0;
} catch (error) {
pomoToday = 0;
}
points += pomoToday * POINTS.pomodoro;
game().challenges.forEach(function (ch) {
if (ch.completedAt) points += POINTS.challenge;
});
var level = 1;
while (75 * (level + 1) * level <= points) level += 1;
var cumCur = 75 * level * (level - 1);
var cumNext = 75 * (level + 1) * level;
cache.data = {
points: points,
level: level,
levelPct: Math.min(1, (points - cumCur) / Math.max(1, cumNext - cumCur)),
toNext: Math.max(0, cumNext - points),
bestStreak: bestStreak,
maxRun70: maxRun70,
perfectDays: perfectDays
};
cache.dirty = false;
return cache.data;
}
function medalDefs() {
var d = derive();
function pr(v, max) {
return window.I18N.faNum(Math.min(v, max)) + "/" + window.I18N.faNum(max);
}
return [
{ id: "first_step", icon: "🌱", fa: "قدم اول", en: "First step", df: "اولین وظیفه یا عادت را کامل کن", de: "Complete your first task or habit", ok: d.points > 0, pr: null },
{ id: "streak_3", icon: "🔥", fa: "۳ روز پیاپی", en: "3-day streak", df: "به استریک ۳ روزهٔ یک عادت برس", de: "Reach a 3-day habit streak", ok: d.bestStreak >= 3, pr: pr(d.bestStreak, 3) },
{ id: "streak_7", icon: "⚡", fa: "۷ روز پیاپی", en: "7-day streak", df: "به استریک ۷ روزهٔ یک عادت برس", de: "Reach a 7-day habit streak", ok: d.bestStreak >= 7, pr: pr(d.bestStreak, 7) },
{ id: "streak_21", icon: "🏆", fa: "۲۱ روز پیاپی", en: "21-day streak", df: "به استریک ۲۱ روزهٔ یک عادت برس", de: "Reach a 21-day habit streak", ok: d.bestStreak >= 21, pr: pr(d.bestStreak, 21) },
{ id: "streak_66", icon: "💎", fa: "۶۶ روز پیاپی", en: "66-day streak", df: "به استریک ۶۶ روزهٔ یک عادت برس", de: "Reach a 66-day habit streak", ok: d.bestStreak >= 66, pr: pr(d.bestStreak, 66) },
{ id: "streak_100", icon: "👑", fa: "۱۰۰ روز پیاپی", en: "100-day streak", df: "به استریک ۱۰۰ روزهٔ یک عادت برس", de: "Reach a 100-day habit streak", ok: d.bestStreak >= 100, pr: pr(d.bestStreak, 100) },
{ id: "week_master", icon: "🎖", fa: "استاد هفته", en: "Week master", df: "۷ روز پیاپی با پیشرفت حداقل ۷۰٪", de: "7 consecutive days at 70%+ progress", ok: d.maxRun70 >= 7, pr: pr(d.maxRun70, 7) },
{ id: "perfect_month", icon: "🌕", fa: "ماه کامل", en: "Perfect month", df: "۳۰ روز پیاپی با پیشرفت حداقل ۷۰٪", de: "30 consecutive days at 70%+ progress", ok: d.maxRun70 >= 30, pr: pr(d.maxRun70, 30) }
];
}
function syncMedals() {
var g = game();
var changed = false;
medalDefs().forEach(function (m) {
if (m.ok && !g.medals[m.id]) {
g.medals[m.id] = window.Calendar.todayKey();
changed = true;
toast("🎖 " + L("مدال باز شد: ", "Medal unlocked: ") + L(m.fa, m.en), "success", { duration: 6000 });
}
});
if (changed) save();
}
/* ------------------------------
Challenges
------------------------------ */
function challengeDayCount(ch) {
var count = 0;
var today = window.Calendar.todayKey();
var habit = ch.habitId ? findHabit(ch.habitId) : null;
var cursor = ch.startDate;
var guard = 0;
while (cursor <= today && guard < ch.days) {
if (habit) {
if (window.Store.habitExistedOn(habit, cursor) && window.Store.habitDone(habit, cursor)) count += 1;
} else if (ch.cat) {
var done = window.Store.state.habits.some(function (h) {
return h.category === ch.cat &&
window.Store.habitExistedOn(h, cursor) &&
window.Store.habitDone(h, cursor);
});
if (done) count += 1;
}
cursor = window.Calendar.keyShift(1, cursor);
guard += 1;
}
return count;
}
function checkChallenges() {
var g = game();
var changed = false;
g.challenges.forEach(function (ch) {
if (ch.completedAt) return;
if (challengeDayCount(ch) >= ch.days) {
ch.completedAt = window.Calendar.todayKey();
changed = true;
toast("🏁 " + L("چالش کامل شد: ", "Challenge completed: ") + ch.name + " (+" + window.I18N.faNum(POINTS.challenge) + " ⚡)", "success", { duration: 8000 });
confetti();
playWin();
}
});
if (changed) save();
}
function startChallenge(tpl, habitId) {
game().challenges.push({
id: window.Utils.uid("ch"),
templateId: tpl.id,
name: L(tpl.fa, tpl.en),
icon: tpl.icon,
cat: tpl.cat,
habitId: habitId,
days: tpl.days,
startDate: window.Calendar.todayKey()
});
save();
window.UI.modal.close();
toast("🎯 " + L("چالش شروع شد! موفق باشی 💪", "Challenge started! Good luck 💪"), "success");
render();
}
function abandonChallenge(id) {
var g = game();
g.challenges = g.challenges.filter(function (ch) { return String(ch.id) !== String(id); });
save();
toast(L("چالش رها شد", "Challenge abandoned"), "info");
render();
}
/* ------------------------------
Celebration (confetti + sound)
------------------------------ */
function confetti() {
if (window.Store.state.settings.animations === false) return;
if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
var canvas = document.createElement("canvas");
canvas.className = "confetti-canvas";
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
document.body.appendChild(canvas);
var ctx = canvas.getContext("2d");
var colors = ["#8b5cf6", "#6366f1", "#38bdf8", "#22c55e", "#f59e0b", "#ec4899"];
var parts = [];
for (var i = 0; i < 140; i += 1) {
parts.push({
x: Math.random() * canvas.width,
y: -20 - Math.random() * canvas.height * 0.3,
r: 4 + Math.random() * 6,
c: colors[i % colors.length],
vy: 2 + Math.random() * 3,
vx: -1.5 + Math.random() * 3,
rot: Math.random() * Math.PI,
vr: -0.1 + Math.random() * 0.2
});
}
var start = Date.now();
(function frame() {
var t = Date.now() - start;
ctx.clearRect(0, 0, canvas.width, canvas.height);
parts.forEach(function (p) {
p.y += p.vy;
p.x += p.vx;
p.rot += p.vr;
ctx.save();
ctx.translate(p.x, p.y);
ctx.rotate(p.rot);
ctx.fillStyle = p.c;
ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 0.6);
ctx.restore();
});
if (t < 2600) {
requestAnimationFrame(frame);
} else {
canvas.remove();
}
})();
}
function playWin() {
if (!window.Store.state.settings.sounds) return;
try {
var AC = window.AudioContext || window.webkitAudioContext;
if (!AC) return;
var ctx = new AC();
[523.25, 659.25, 783.99].forEach(function (freq, i) {
var osc = ctx.createOscillator();
var gain = ctx.createGain();
osc.type = "sine";
osc.frequency.value = freq;
gain.gain.setValueAtTime(0.0001, ctx.currentTime + i * 0.12);
gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + i * 0.12 + 0.02);
gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.12 + 0.3);
osc.connect(gain);
gain.connect(ctx.destination);
osc.start(ctx.currentTime + i * 0.12);
osc.stop(ctx.currentTime + i * 0.12 + 0.32);
});
} catch (error) {
// audio is best-effort
}
}
function checkCelebration() {
var score = window.Store.dayScore(window.Calendar.todayKey());
if (!score.total || score.pct < 1) return;
var flag = "pd_celebrated_" + window.Calendar.todayKey();
try {
if (sessionStorage.getItem(flag)) return;
sessionStorage.setItem(flag, "1");
} catch (error) {
return;
}
confetti();
playWin();
toast(L("🎉 فوق‌العاده! امروز ۱۰۰٪ کامل شد — ۲۰ امتیاز پاداش", "🎉 Amazing! Today is 100% done — +20 bonus points"), "success", { duration: 8000 });
}
/* ------------------------------
UI: home card
------------------------------ */
function render() {
var card = el("gameCard");
if (!card || !window.Store) return;
var d = derive();
var g = game();
var unlocked = medalDefs().filter(function (m) { return g.medals[m.id]; });
var active = g.challenges.filter(function (ch) { return !ch.completedAt; });
var html =
'<div class="game-top">' +
'<div class="game-level" aria-label="' + L("سطح", "Level") + " " + window.I18N.faNum(d.level) + '">' +
'<span class="game-level-num">' + window.I18N.faNum(d.level) + "</span>" +
'<span class="game-level-label">' + L("سطح", "Level") + "</span>" +
"</div>" +
'<div class="game-xp">' +
'<div class="game-xp-head">' +
"<span>⚡ " + window.I18N.faNum(d.points) + " " + L("امتیاز", "points") + "</span>" +
"<span>" + window.I18N.faNum(d.toNext) + " " + L("امتیاز تا سطح بعد", "points to next level") + "</span>" +
"</div>" +
'<div class="xp-bar"><span style="width:' + Math.round(d.levelPct * 100) + '%"></span></div>' +
"</div>" +
'<div class="game-flame">🔥 <strong>' + window.I18N.days(d.bestStreak) + "</strong></div>" +
"</div>" +
'<div class="game-medals-strip">' +
(unlocked.length
? unlocked.slice(-10).map(function (m) {
return '<span class="game-medal-chip" title="' + L(m.fa, m.en) + '">' + m.icon + "</span>";
}).join("")
: '<span class="game-hint">' + L("اولین وظیفه یا عادت را کامل کن تا اولین مدال باز شود 🌱", "Complete your first task or habit to unlock your first medal 🌱") + "</span>") +
"</div>" +
active.map(function (ch) {
var count = challengeDayCount(ch);
var pct = Math.round((count / ch.days) * 100);
return (
'<div class="challenge-card">' +
'<div class="challenge-head">' +
"<span>" + iconHTML(ch.icon, 18) + " " + window.Utils.escapeHtml(ch.name) + "</span>" +
'<button class="btn-icon danger" data-action="game-abandon" data-id="' + ch.id + '" aria-label="' + L("رها کردن چالش", "Abandon challenge") + '">✕</button>' +
"</div>" +
'<div class="xp-bar"><span style="width:' + pct + '%"></span></div>' +
'<div class="challenge-meta">' + L("روز", "Day") + " " + window.I18N.faNum(count) + " " + L("از", "of") + " " + window.I18N.faNum(ch.days) + "</div>" +
"</div>"
);
}).join("") +
'<div class="game-actions">' +
'<button class="btn btn-ghost btn-sm" data-action="game-medals">🎖 ' + L("مدال‌ها", "Medals") + " (" + window.I18N.faNum(unlocked.length) + "/" + window.I18N.faNum(8) + ")</button>" +
'<button class="btn btn-ghost btn-sm" data-action="game-challenges">🎯 ' + L("چالش‌ها", "Challenges") + "</button>" +
"</div>";
card.innerHTML = html;
card.hidden = false;
}
var renderSoon = window.Utils.debounce(function () {
render();
}, 120);
/* ------------------------------
UI: modals
------------------------------ */
function openMedalsModal() {
var g = game();
var html =
'<div class="medal-grid">' +
medalDefs().map(function (m) {
var date = g.medals[m.id];
return (
'<div class="medal' + (date ? "" : " locked") + '">' +
'<div class="medal-icon">' + m.icon + "</div>" +
'<div class="medal-name">' + L(m.fa, m.en) + "</div>" +
'<div class="medal-desc">' +
(date
? L("باز شده در ", "Unlocked on ") + window.Calendar.keyToJalaliFull(date)
: L(m.df, m.de) + (m.pr ? " (" + m.pr + ")" : "")) +
"</div>" +
"</div>"
);
}).join("") +
"</div>";
window.UI.modal.open("🎖 " + L("مدال‌ها", "Medals"), html);
}
function openChallengesModal() {
var g = game();
var active = g.challenges.filter(function (ch) { return !ch.completedAt; });
var done = g.challenges.filter(function (ch) { return ch.completedAt; });
var html = "";
if (active.length) {
html += '<div class="modal-section-title">🏃 ' + L("چالش‌های فعال", "Active challenges") + "</div>";
html += active.map(function (ch) {
var count = challengeDayCount(ch);
return (
'<div class="modal-item">' +
'<div class="item-left"><span>' + iconHTML(ch.icon, 18) + '</span><span class="item-name">' + window.Utils.escapeHtml(ch.name) + "</span></div>" +
'<span class="modal-tag">' + window.I18N.faNum(count) + "/" + window.I18N.faNum(ch.days) + "</span>" +
"</div>"
);
}).join("");
}
if (done.length) {
html += '<div class="modal-section-title">🏁 ' + L("تمام‌شده‌ها", "Completed") + "</div>";
html += done.map(function (ch) {
return (
'<div class="modal-item">' +
'<div class="item-left"><span>' + iconHTML(ch.icon, 18) + '</span><span class="item-name done">' + window.Utils.escapeHtml(ch.name) + "</span></div>" +
'<span class="modal-tag done">+' + window.I18N.faNum(POINTS.challenge) + " ⚡</span>" +
"</div>"
);
}).join("");
}
html += '<div class="modal-section-title">🎯 ' + L("قالب‌های آماده", "Ready templates") + "</div>";
html += TEMPLATES.map(function (t) {
return (
'<div class="modal-item">' +
'<div class="item-left"><span>' + iconHTML(t.icon, 18) + '</span><span class="item-name">' + L(t.fa, t.en) + "</span></div>" +
'<button class="btn btn-primary btn-sm" data-action="game-start" data-id="' + t.id + '">' + L("شروع", "Start") + "</button>" +
"</div>"
);
}).join("");
window.UI.modal.open("🎯 " + L("چالش‌ها", "Challenges"), html);
}
function openBindModal(tpl) {
var habits = window.Store.state.habits.filter(function (h) { return h.category === tpl.cat; });
var options =
'<option value="">' + L("کل دستهٔ: ", "Whole category: ") + window.I18N.t("category." + tpl.cat) + "</option>" +
habits.map(function (h) {
return '<option value="' + h.id + '">' + window.Utils.escapeHtml(h.name) + "</option>";
}).join("");
var html =
'<p class="form-hint">' + L("این چالش چه چیزی را دنبال کند؟", "What should this challenge track?") + "</p>" +
'<select id="gameBindSelect" class="input">' + options + "</select>" +
'<button class="btn btn-primary" data-action="game-bind-confirm" data-id="' + tpl.id + '" style="width:100%;margin-top:12px">' +
L("شروع چالش", "Start challenge") +
"</button>";
window.UI.modal.open(L(tpl.fa, tpl.en), html);
}
/* ------------------------------
Events + init
------------------------------ */
function bindClicks() {
document.addEventListener("click", function (event) {
var btn = event.target.closest("[data-action]");
if (!btn) return;
var action = btn.dataset.action;
var id = btn.dataset.id;
if (action === "game-medals") {
openMedalsModal();
} else if (action === "game-challenges") {
openChallengesModal();
} else if (action === "game-start") {
var tpl = findTemplate(id);
if (tpl) openBindModal(tpl);
} else if (action === "game-bind-confirm") {
var tpl2 = findTemplate(id);
var sel = el("gameBindSelect");
var habitId = sel && sel.value ? sel.value : null;
if (tpl2) startChallenge(tpl2, habitId);
} else if (action === "game-abandon") {
abandonChallenge(id);
}
});
}
function init() {
if (!window.Store) return;
window.Store.subscribe(function () {
markDirty();
syncMedals();
checkChallenges();
checkCelebration();
renderSoon();
});
document.addEventListener("i18n:changed", function () {
renderSoon();
});
bindClicks();
syncMedals();
checkChallenges();
render();
}
window.Game = {
render: render,
derive: derive
};
window.Utils.onDomReady(init);
})();
