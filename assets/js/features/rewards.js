/* ================================================================
ROUTINE — FEATURES / REWARDS.JS
Level-gated rewards: backgrounds, the autosave feature and an
in-app library of originally-written key-idea book summaries.
All unlocks are DERIVED from Game level (single source of truth).
================================================================ */
(function () {
"use strict";
var SEEN_KEY = "pd_rewards_seen_level";
var BOOKS = {
atomic: {
fa: {
title: "عادت‌های اتمی",
author: "James Clear",
points: [
"رفتار با هویت عوض می‌شود: به‌جای «می‌خواهم بدوم» بگو «من یک دونده‌ام»؛ عادت‌های ماندگار روی خودِ تصویرِ ذهنی ساخته می‌شوند، نه فقط هدف.",
"حلقهٔ چهار مرحله‌ای: نشانه، میل، پاسخ، پاداش. برای ساختن عادت، نشانه را آشکار، میل را جذاب، پاسخ را آسان و پاداش را رضایت‌بخش کن.",
"قانون دو دقیقه: عادت تازه را به نسخهٔ دو دقیقه‌ای کوچک کن تا شروع‌کردن بی‌اصطکاک شود.",
"محیط بر اراده پیروز است: فضا را طوری بچین که نشانهٔ عادت خوب جلوی چشم و نشانهٔ عادت بد دور از دسترس باشد.",
"زنجیره را قطع نکن؛ اگر یک روز جا ماندی، هرگز دو روز پشت‌سرهم از دست نده.",
"پیشرفت یک‌درصدی روزانه در یک سال به تفاوتی بزرگ مرکب می‌شود."
]
},
en: {
title: "Atomic Habits",
author: "James Clear",
points: [
"Behavior changes with identity: say \"I am a runner\" instead of \"I want to run\"; lasting habits are built on self-image, not just goals.",
"The four-step loop: cue, craving, response, reward. Make the cue obvious, the craving attractive, the response easy and the reward satisfying.",
"The two-minute rule: shrink a new habit to a two-minute version so starting is effortless.",
"Environment beats willpower: design the space so good cues are in sight and bad cues are out of reach.",
"Never break the chain twice: missing one day is fine, missing two in a row restarts the identity.",
"Small 1% daily improvements compound into a large difference over a year."
]
}
},
deep: {
fa: {
title: "کار عمیق",
author: "Cal Newport",
points: [
"کار عمیق یعنی تمرکز بدون حواس‌پرتی روی کاری که از نظر شناختی سنگین است؛ این مهارت هم کمیاب‌تر شده هم ارزشمندتر.",
"کار کم‌عمق (ایمیل، جلسه، اعلان‌ها) ارزش ماندگار کمی می‌سازد؛ برایش سقف زمانی تعیین کن.",
"تمرکز مثل عضله تمرین می‌خواهد: blokهای زمانی ثابت، آیین شروع مشخص، و افزایش تدریجی طول جلسه‌ها.",
"با کسالت آشتی کن: در هر مکثی سراغ گوشی نرو؛ مغز برای بازیابی تمرکز به زمان خالی نیاز دارد.",
"آیین پایان روز: حلقه‌های باز را ببند و برنامهٔ فردا را بنویس تا ذهن واقعاً استراحت کند.",
"باقی‌ماندهٔ توجه: هر بار پریدن بین کارها بخشی از ذهن را اشغال می‌کند؛ سوئیچ کمتر یعنی عمق بیشتر."
]
},
en: {
title: "Deep Work",
author: "Cal Newport",
points: [
"Deep work is distraction-free focus on cognitively demanding tasks; it is becoming rarer and more valuable at the same time.",
"Shallow work (email, meetings, notifications) creates little lasting value; give it a hard time budget.",
"Focus is trained like a muscle: fixed time blocks, a clear starting ritual, and gradually longer sessions.",
"Embrace boredom: do not reach for the phone at every pause; the brain needs idle time to recover focus.",
"Keep a shutdown ritual: close open loops and write tomorrow's plan so the mind can truly rest.",
"Attention residue: every task switch leaves residue on the mind; fewer switches mean deeper work."
]
}
},
tiny: {
fa: {
title: "عادت‌های کوچک",
author: "BJ Fogg",
points: [
"رفتار = انگیزه + توانایی + تلنگر؛ برای بزرگ‌کردن یک عادت، به‌جای تکیه بر انگیزه، آن را آسان‌تر کن.",
"با رفتاری شروع کن که آن‌قدر کوچک است شکست خوردن نمی‌تواند، و آن را به یک روتین موجود گره بزن: «بعد از …، من …».",
"جشن فوری: یک حس مثبتِ کوچک بلافاصله بعد از رفتار، حلقهٔ عادت را محکم می‌کند.",
"طراحی مهم‌تر از اراده است: اگر عادتی جواب نداد، طراحی را اصلاح کن (تلنگر یا توانایی)، نه خودت را.",
"رشد تدریجی است: بگذار عادت از نسخهٔ کوچک به‌طور طبیعی بزرگ شود، نه با اجبار از روز اول."
]
},
en: {
title: "Tiny Habits",
author: "BJ Fogg",
points: [
"Behavior = motivation + ability + prompt; to grow a habit, make it easier instead of relying on motivation.",
"Start with a behavior too small to fail and anchor it to an existing routine: \"After I …, I will …\".",
"Celebrate immediately: a small positive feeling right after the behavior wires the habit loop.",
"Design over willpower: when a habit fails, fix the design (prompt or ability), not yourself.",
"Growth is gradual: let the habit expand naturally from its tiny version instead of forcing it on day one."
]
}
}
};
var REWARDS = [
{ id: "bg-saturn", level: 2, type: "background", icon: "sparkle", fa: "پس‌زمینهٔ سیاره ذره‌ای", en: "Particle Saturn background", dfa: "یک سیارهٔ حلقه‌دار ساخته‌شده از ذره‌ها پشت داشبوردت.", den: "A ringed planet made of particles behind your dashboard." },
{ id: "bg-fireball", level: 3, type: "background", icon: "flame", fa: "پس‌زمینهٔ گوی آتشین", en: "Toon fireball background", dfa: "گوی آتش سبک کارتونی با هالهٔ نور.", den: "A toon-shaded fireball with a bloom halo." },
{ id: "autosave", level: 4, type: "feature", icon: "save", fa: "ذخیرهٔ خودکار", en: "Auto-save", dfa: "اسنپ‌شات خودکار روی همین دستگاه؛ بعد از باز شدن، خودت روشنش کن (پیش‌فرض خاموش).", den: "Automatic snapshots on this device; after unlocking you turn it on yourself (off by default)." },
{ id: "book-atomic", level: 5, type: "book", book: "atomic", icon: "book", fa: "کتاب‌خانه: عادت‌های اتمی", en: "Library: Atomic Habits", dfa: "ایده‌های کلیدی کتاب، به قلم تیم تیکوچی.", den: "Key ideas of the book, written by the TikoChi team." },
{ id: "book-deep", level: 6, type: "book", book: "deep", icon: "book", fa: "کتاب‌خانه: کار عمیق", en: "Library: Deep Work", dfa: "ایده‌های کلیدی کتاب، به قلم تیم تیکوچی.", den: "Key ideas of the book, written by the TikoChi team." },
{ id: "book-tiny", level: 7, type: "book", book: "tiny", icon: "gem", fa: "کتاب‌خانه: عادت‌های کوچک", en: "Library: Tiny Habits", dfa: "ایده‌های کلیدی کتاب، به قلم تیم تیکوچی.", den: "Key ideas of the book, written by the TikoChi team." }
];
function L(fa, en) {
return window.I18N && window.I18N.lang === "en" ? en : fa;
}
function svgIcon(name, size) {
return window.Icons ? window.Icons.svg(name, size || 16) : "";
}
function toast(msg, type, opts) {
if (window.UI && window.UI.toast) window.UI.toast(msg, type, opts);
}
function level() {
return window.Game && window.Game.derive ? window.Game.derive().level : 1;
}
function find(id) {
for (var i = 0; i < REWARDS.length; i++) {
if (REWARDS[i].id === id) return REWARDS[i];
}
return null;
}
function isUnlocked(id) {
var r = find(id);
return !!r && level() >= r.level;
}
function name(r) { return L(r.fa, r.en); }
function desc(r) { return L(r.dfa, r.den); }
function seenLevel() {
try { return Number(localStorage.getItem(SEEN_KEY) || 0); } catch (e) { return 0; }
}
function setSeen(v) {
try { localStorage.setItem(SEEN_KEY, String(v)); } catch (e) {}
}
function checkUnlocks() {
var lv = level();
var seen = seenLevel();
if (!seen) { setSeen(lv); return; }
if (lv <= seen) return;
REWARDS.forEach(function (r) {
if (r.level > seen && r.level <= lv) {
toast(L("جایزهٔ جدید باز شد: ", "New reward unlocked: ") + name(r), "success", { duration: 8000 });
}
});
setSeen(lv);
}
function openBook(id) {
var r = find(id);
if (!r || r.type !== "book" || !isUnlocked(id) || !window.UI || !window.UI.modal) return;
var b = BOOKS[r.book];
if (!b) return;
var lang = window.I18N && window.I18N.lang === "en" ? "en" : "fa";
var data = b[lang];
var html =
'<p style="color:var(--text-3);font-size:12px;font-weight:700;margin-bottom:12px">' +
window.Utils.escapeHtml(data.author) +
"</p>" +
'<ul style="display:grid;gap:10px;list-style:disc;padding-inline-start:18px;line-height:1.9;color:var(--text-2);font-size:13.5px">' +
data.points.map(function (p) { return "<li>" + window.Utils.escapeHtml(p) + "</li>"; }).join("") +
"</ul>" +
'<p class="form-hint">' +
L("این خلاصه نگارش اصلی تیم تیکوچی است و جایگزین مطالعهٔ خود کتاب نیست.", "This summary is originally written by the TikoChi team and does not replace reading the book itself.") +
"</p>";
window.UI.modal.open(data.title, html);
}
function openLibrary() {
if (!window.UI || !window.UI.modal) return;
var html =
'<p class="form-hint" style="margin-top:0">' +
L("خلاصهٔ کلیدی کتاب‌ها فقط با بالا رفتن سطح باز می‌شود.", "Book key-ideas unlock only as your level grows.") +
"</p>" +
'<div class="library-list">' +
REWARDS.filter(function (r) { return r.type === "book"; }).map(function (r) {
var unlocked = isUnlocked(r.id);
var b = BOOKS[r.book];
var titleFa = b ? b.fa.title : name(r);
var titleEn = b ? b.en.title : name(r);
return (
'<div class="library-item' + (unlocked ? "" : " locked") + '">' +
'<span class="library-cover">' + (unlocked ? svgIcon("book", 20) : svgIcon("lock", 20)) + "</span>" +
'<div style="flex:1;min-width:0"><div class="library-title">' + window.Utils.escapeHtml(L(titleFa, titleEn)) + "</div>" +
'<div class="library-meta">' + (unlocked ? L("آمادهٔ مطالعه", "Ready to read") : L("قفل — سطح ", "Locked — level ") + window.I18N.faNum(r.level)) + "</div></div>" +
(unlocked ? '<button class="btn btn-ghost btn-sm" data-reward-book="' + r.id + '">' + L("مطالعه", "Read") + "</button>" : "") +
"</div>"
);
}).join("") +
"</div>";
var content = window.UI.modal.open(L("کتاب‌خانهٔ جوایز", "Rewards library"), html);
if (!content) return;
content.addEventListener("click", function (e) {
var btn = e.target.closest("[data-reward-book]");
if (btn) openBook(btn.getAttribute("data-reward-book"));
});
}
function open() {
if (!window.UI || !window.UI.modal) return;
var lv = level();
var html =
'<p class="form-hint" style="margin-top:0">' +
L("سطح فعلی: ", "Current level: ") + window.I18N.faNum(lv) + " — " +
L("با هر سطح، یک جایزهٔ واقعی باز می‌شود.", "Each level unlocks a real reward.") +
"</p>" +
'<div class="reward-grid">' +
REWARDS.map(function (r) {
var unlocked = lv >= r.level;
var action = "";
if (r.type === "book") {
action = unlocked
? '<button class="btn btn-ghost btn-sm" data-reward-book="' + r.id + '" style="width:100%;margin-top:10px">' + L("مطالعه", "Read") + "</button>"
: "";
} else if (r.type === "background") {
action = '<p class="form-hint" style="margin:10px 0 0">' + L("از ابزارها → پس‌زمینهٔ متحرک فعالش کن.", "Enable it from Tools → animated background.") + "</p>";
} else {
action = '<p class="form-hint" style="margin:10px 0 0">' + L("بعد از باز شدن، از ابزارها روشنش کن؛ پیش‌فرض خاموش است.", "After unlocking, turn it on from Tools; it stays off by default.") + "</p>";
}
return (
'<div class="reward-card' + (unlocked ? "" : " locked") + '">' +
'<span class="reward-level-chip">' + (unlocked ? L("باز شده", "Unlocked") : L("سطح ", "Level ") + window.I18N.faNum(r.level)) + "</span>" +
'<div class="reward-art">' + svgIcon(r.icon, 40) + "</div>" +
'<div class="reward-name">' + window.Utils.escapeHtml(name(r)) + "</div>" +
'<div class="reward-desc">' + window.Utils.escapeHtml(desc(r)) + "</div>" +
action +
"</div>"
);
}).join("") +
"</div>" +
'<div class="sc-actions" style="margin-top:16px">' +
'<button class="btn btn-ghost btn-sm" data-reward-library>' + svgIcon("book", 15) + " " + L("کتاب‌خانهٔ جوایز", "Rewards library") + "</button>" +
"</div>";
var content = window.UI.modal.open(L("جوایز سطح‌ها", "Level rewards"), html);
if (!content) return;
content.addEventListener("click", function (e) {
var bookBtn = e.target.closest("[data-reward-book]");
if (bookBtn) {
openBook(bookBtn.getAttribute("data-reward-book"));
return;
}
if (e.target.closest("[data-reward-library]")) openLibrary();
});
}
function init() {
checkUnlocks();
if (window.Store && window.Store.subscribe) {
window.Store.subscribe(function () {
checkUnlocks();
});
}
}
window.Rewards = {
open: open,
openLibrary: openLibrary,
openBook: openBook,
isUnlocked: isUnlocked,
level: level,
list: function () { return REWARDS.slice(); }
};
window.Utils.onDomReady(init);
})();
