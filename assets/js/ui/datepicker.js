/* ================================================================
ROUTINE — UI / DATEPICKER.JS
Custom Jalali date picker.
Internal value remains Gregorian YYYY-MM-DD.
================================================================ */
(function () {
"use strict";

let pickerEl = null;
let activeInput = null;
let view = {
jy: 1404,
jm: 1
};
let initialized = false;

function normalizeDigits(value) {
return String(value == null ? "" : value)
.replace(/[۰-۹]/g, function (d) {
return "۰۱۲۳۴۵۶۷۸۹".indexOf(d);
})
.replace(/[٠-٩]/g, function (d) {
return "٠١٢٣٤٥٦٧٨٩".indexOf(d);
});
}

function validateJalali(jy, jm, jd) {
jy = Number(jy);
jm = Number(jm);
jd = Number(jd);

if (!jy || !jm || !jd) return null;
if (jm < 1 || jm > 12) return null;

try {
const days = window.Calendar.getDaysInMonth(jy, jm, "fa");
if (jd < 1 || jd > days) return null;
} catch (error) {
return null;
}

return {
jy: jy,
jm: jm,
jd: jd
};
}

function parseTypedJalali(text) {
text = normalizeDigits(String(text || "")).trim();

if (!text) return null;

if (text === "امروز" || text.toLowerCase() === "today") {
const today = window.Calendar.getToday("fa");
return {
jy: today.jy,
jm: today.jm,
jd: today.jd
};
}

const months = window.Calendar.PERSIAN_MONTHS;

for (let i = 0; i < months.length; i += 1) {
if (text.indexOf(months[i]) !== -1) {
const yearMatch = text.match(/\d{4}/);
const dayMatch = text.replace(/\d{4}/, " ").match(/\d{1,2}/);

if (yearMatch && dayMatch) {
return validateJalali(
Number(yearMatch[0]),
i + 1,
Number(dayMatch[0])
);
}
}
}

const parts = text
.split(/[\/\-\.]/)
.map(function (part) {
return part.trim();
})
.filter(Boolean);

if (parts.length !== 3) return null;

const a = Number(parts[0]);
const b = Number(parts[1]);
const c = Number(parts[2]);

if ([a, b, c].some(isNaN)) return null;

/* 1404/11/19 */
if (String(parts[0]).length === 4) {
if (a > 1500) {
try {
const j = window.Calendar.gregorianToJalali(a, b, c);
return validateJalali(j[0], j[1], j[2]);
} catch (error) {
return null;
}
}

return validateJalali(a, b, c);
}

/* 19/11/1404 */
if (String(parts[2]).length === 4) {
if (c > 1500) {
try {
const j = window.Calendar.gregorianToJalali(c, b, a);
return validateJalali(j[0], j[1], j[2]);
} catch (error) {
return null;
}
}

return validateJalali(c, b, a);
}

return null;
}

function ensurePicker() {
if (pickerEl) return pickerEl;

pickerEl = document.createElement("div");
pickerEl.className = "datepicker-popup";
pickerEl.style.display = "none";

pickerEl.innerHTML =
'<div class="dp-header">' +
'<button type="button" class="dp-nav" data-dp="prev" aria-label="' +
window.I18N.t("calendar.prevMonth") +
'">▶</button>' +
'<div class="dp-title"></div>' +
'<button type="button" class="dp-nav" data-dp="next" aria-label="' +
window.I18N.t("calendar.nextMonth") +
'">◀</button>' +
"</div>" +
'<div class="dp-weekdays"></div>' +
'<div class="dp-days"></div>' +
'<div class="dp-footer">' +
'<button type="button" class="btn btn-ghost btn-sm" data-dp="today">' +
window.I18N.t("datepicker.today") +
"</button>" +
'<button type="button" class="btn btn-ghost btn-sm" data-dp="clear">' +
window.I18N.t("datepicker.clear") +
"</button>" +
"</div>";

document.body.appendChild(pickerEl);

pickerEl.addEventListener("click", function (event) {
const button = event.target.closest("[data-dp]");
if (!button) return;

const action = button.dataset.dp;

if (action === "prev") {
changeMonth(-1);
return;
}

if (action === "next") {
changeMonth(1);
return;
}

if (action === "today") {
const today = window.Calendar.getToday("fa");
const key = window.Calendar.toKey(today.jy, today.jm, today.jd, "fa");
selectDate(key);
return;
}

if (action === "clear") {
clearInput();
return;
}

if (action.indexOf("day-") === 0) {
selectDate(action.slice(4));
}
});

return pickerEl;
}

function render() {
if (!pickerEl) return;

pickerEl.querySelector(".dp-title").textContent =
window.Calendar.formatMonthYear(view.jy, view.jm, "fa");

const weekdays = window.Calendar.getWeekdays("fa");
pickerEl.querySelector(".dp-weekdays").innerHTML = weekdays
.map(function (weekday) {
return '<div class="dp-wd">' + window.Utils.escapeHtml(weekday.slice(0, 3)) + "</div>";
})
.join("");

const daysInMonth = window.Calendar.getDaysInMonth(view.jy, view.jm, "fa");
const firstWeekday = window.Calendar.getFirstWeekday(view.jy, view.jm, "fa");
const selectedKey = activeInput ? activeInput.dataset.value : "";
const todayKey = window.Calendar.todayKey();

let html = "";

for (let i = 0; i < firstWeekday; i += 1) {
html += '<div class="dp-day empty"></div>';
}

for (let day = 1; day <= daysInMonth; day += 1) {
const key = window.Calendar.toKey(view.jy, view.jm, day, "fa");

let classes = "dp-day";

if (key === todayKey) {
classes += " today";
}

if (key === selectedKey) {
classes += " selected";
}

html +=
'<button type="button" class="' + classes + '" data-dp="day-' + key + '">' +
window.I18N.faNum(day) +
"</button>";
}

pickerEl.querySelector(".dp-days").innerHTML = html;
}

function changeMonth(delta) {
view.jm += delta;

while (view.jm > 12) {
view.jm -= 12;
view.jy += 1;
}

while (view.jm < 1) {
view.jm += 12;
view.jy -= 1;
}

render();
}

function positionPicker(input) {
if (!pickerEl) return;

const isSmall = window.matchMedia("(max-width: 640px)").matches;

if (isSmall) {
pickerEl.classList.add("is-bottom");
pickerEl.style.top = "";
pickerEl.style.left = "";
return;
}

pickerEl.classList.remove("is-bottom");

const rect = input.getBoundingClientRect();
const pickerWidth = pickerEl.offsetWidth || 300;
let left = rect.left + window.scrollX;

if (document.documentElement.getAttribute("dir") === "rtl") {
left = rect.right + window.scrollX - pickerWidth;
}

left = Math.max(8, left);
left = Math.min(
left,
window.scrollX + document.documentElement.clientWidth - pickerWidth - 8
);

pickerEl.style.top = rect.bottom + window.scrollY + 8 + "px";
pickerEl.style.left = left + "px";
}

function open(input) {
activeInput = input;

const el = ensurePicker();

let key = input.dataset.value;

if (!window.Utils.isValidDateKey(key)) {
const parsed = parseTypedJalali(input.value);

if (parsed) {
try {
key = window.Calendar.toKey(parsed.jy, parsed.jm, parsed.jd, "fa");
input.dataset.value = key;
} catch (error) {
key = "";
}
}
}

if (window.Utils.isValidDateKey(key)) {
try {
const parts = key.split("-").map(Number);
const j = window.Calendar.gregorianToJalali(parts[0], parts[1], parts[2]);

view = {
jy: j[0],
jm: j[1]
};
} catch (error) {
const today = window.Calendar.getToday("fa");
view = {
jy: today.jy,
jm: today.jm
};
}
} else {
const today = window.Calendar.getToday("fa");
view = {
jy: today.jy,
jm: today.jm
};
}

render();

el.style.display = "block";
positionPicker(input);
}

function close() {
if (pickerEl) {
pickerEl.style.display = "none";
}

activeInput = null;
}

function selectDate(key) {
if (!activeInput) return;

activeInput.dataset.skipParse = "1";
activeInput.dataset.value = key;
activeInput.value = window.Calendar.keyToJalaliFull(key);
activeInput.dispatchEvent(new Event("change", { bubbles: true }));

close();
}

function clearInput() {
if (!activeInput) return;

activeInput.dataset.skipParse = "1";
activeInput.dataset.value = "";
activeInput.value = "";
activeInput.dispatchEvent(new Event("change", { bubbles: true }));

close();
}

function parseInput(input) {
if (!input) return;

const raw = input.value;
const parsed = parseTypedJalali(raw);

if (parsed) {
try {
const key = window.Calendar.toKey(parsed.jy, parsed.jm, parsed.jd, "fa");

input.dataset.skipParse = "1";
input.dataset.value = key;
input.value = window.Calendar.keyToJalaliFull(key);
input.dispatchEvent(new Event("change", { bubbles: true }));
return;
} catch (error) {
// fallback below
}
}

if (input.dataset.value) {
input.dataset.skipParse = "1";
input.value = window.Calendar.keyToJalaliFull(input.dataset.value);
input.dispatchEvent(new Event("change", { bubbles: true }));
return;
}

if (raw && window.UI && window.UI.toast) {
window.UI.toast(window.I18N.t("datepicker.invalid"), "error");
}

input.dataset.skipParse = "1";
input.value = "";
input.dispatchEvent(new Event("change", { bubbles: true }));
}

function bind() {
if (initialized) return;

initialized = true;

document.addEventListener("click", function (event) {
const input = event.target.closest("[data-datepicker]");

if (input) {
event.preventDefault();
open(input);
return;
}

if (
pickerEl &&
pickerEl.style.display === "block" &&
!pickerEl.contains(event.target)
) {
close();
}
});

document.addEventListener("change", function (event) {
const input = event.target.closest("[data-datepicker]");
if (!input) return;

if (input.dataset.skipParse === "1") {
delete input.dataset.skipParse;
return;
}

parseInput(input);
});

document.addEventListener("keydown", function (event) {
if (!pickerEl || pickerEl.style.display !== "block") return;

if (event.key === "Escape") {
close();
return;
}

if (event.key === "Enter" && event.target === activeInput) {
event.preventDefault();
parseInput(activeInput);
close();
}
});

window.addEventListener("resize", close);
window.addEventListener("scroll", close, true);
}

window.DatePicker = {
init: bind,
open: open,
close: close,
parse: parseInput
};

window.Utils.onDomReady(bind);
})();
