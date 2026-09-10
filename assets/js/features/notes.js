/* ================================================================
ROUTINE — FEATURES / NOTES.JS
Daily notes/journal with simple Markdown support.
================================================================ */
(function () {
"use strict";

var STORAGE_KEY = "pd_notes";
var initialized = false;
var state = {
notes: {}
};

function el(id) {
return document.getElementById(id);
}

function toast(message, type, options) {
if (window.UI && window.UI.toast) {
window.UI.toast(message, type, options);
}
}

function L(fa, en) {
return window.I18N && window.I18N.lang === "en" ? en : fa;
}

function loadNotes() {
try {
var raw = localStorage.getItem(STORAGE_KEY);
state.notes = raw ? JSON.parse(raw) : {};
} catch (error) {
state.notes = {};
}
}

function saveNotes() {
try {
localStorage.setItem(STORAGE_KEY, JSON.stringify(state.notes));
} catch (error) {
toast(L("خطا در ذخیره یادداشت", "Failed to save note"), "error");
}
}

function getNote(dateKey) {
return state.notes[dateKey] || "";
}

function setNote(dateKey, text) {
text = String(text || "").trim();
if (!text) {
delete state.notes[dateKey];
} else {
state.notes[dateKey] = text;
}
saveNotes();
}

function escapeHtml(text) {
var div = document.createElement("div");
div.textContent = text;
return div.innerHTML;
}

function renderMarkdown(text) {
if (!text) return "";
var html = escapeHtml(text);
html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
html = html.replace(/`(.+?)`/g, "<code>$1</code>");
html = html.replace(/^\- (.+)$/gm, "• $1");
html = html.replace(/\n/g, "<br>");
return html;
}

function renderToday() {
var box = el("todayNote");
if (!box) return;
var today = window.Calendar.todayKey();
var note = getNote(today);
box.innerHTML =
'<div class="note-wrap">' +
'<textarea id="todayNoteInput" class="input note-input" placeholder="' +
L("یادداشت امروز را اینجا بنویس...", "Write today's note here...") +
'" rows="4">' + escapeHtml(note) + "</textarea>" +
'<div class="note-actions">' +
'<button class="btn btn-ghost btn-sm" id="todayNoteSave">💾 ' +
L("ذخیره", "Save") + "</button>" +
'<span class="note-hint">' +
L("**متن** → bold، *متن* → italic، - → لیست", "**text** → bold, *text* → italic, - → list") +
"</span>" +
"</div>" +
"</div>";
var input = el("todayNoteInput");
var saveBtn = el("todayNoteSave");
if (saveBtn) {
saveBtn.addEventListener("click", function () {
var text = input ? input.value : "";
setNote(today, text);
toast(L("✅ یادداشت ذخیره شد", "✅ Note saved"), "success");
});
}
if (input) {
input.addEventListener("keydown", function (event) {
if ((event.ctrlKey || event.metaKey) && event.key === "s") {
event.preventDefault();
setNote(today, input.value);
toast(L("✅ یادداشت ذخیره شد", "✅ Note saved"), "success");
}
});
}
}

function renderCalendarNote(dateKey) {
var box = el("calendarNoteView");
if (!box) return;
var note = getNote(dateKey);
box.innerHTML =
'<div class="note-wrap">' +
'<textarea id="calNoteInput" class="input note-input" placeholder="' +
L("یادداشت این روز...", "Note for this day...") +
'" rows="5">' + escapeHtml(note) + "</textarea>" +
'<button class="btn btn-ghost btn-sm" id="calNoteSave">💾 ' +
L("ذخیره", "Save") + "</button>" +
"</div>";
var input = el("calNoteInput");
var saveBtn = el("calNoteSave");
if (saveBtn) {
saveBtn.addEventListener("click", function () {
var text = input ? input.value : "";
setNote(dateKey, text);
toast(L("✅ یادداشت ذخیره شد", "✅ Note saved"), "success");
});
}
}

function searchNotes(query) {
query = String(query || "").toLowerCase().trim();
if (!query) return [];
var results = [];
Object.keys(state.notes).forEach(function (dateKey) {
var note = state.notes[dateKey];
if (note.toLowerCase().indexOf(query) !== -1) {
results.push({
date: dateKey,
text: note,
preview: note.slice(0, 80) + (note.length > 80 ? "..." : "")
});
}
});
return results.sort(function (a, b) {
return b.date.localeCompare(a.date);
});
}

function openSearchModal() {
if (!window.UI || !window.UI.modal) return;
var html =
'<input type="text" id="noteSearchInput" class="input" placeholder="' +
L("جستجو در یادداشت‌ها...", "Search notes...") +
'" autocomplete="off">' +
'<div id="noteSearchResults" style="margin-top:14px;max-height:400px;overflow:auto"></div>';
var content = window.UI.modal.open(L("📝 جستجوی یادداشت‌ها", "📝 Search notes"), html);
if (!content) return;
var input = el("noteSearchInput");
var resultsBox = el("noteSearchResults");
function update() {
var query = input ? input.value : "";
var results = searchNotes(query);
if (!results.length) {
resultsBox.innerHTML =
'<p style="text-align:center;color:var(--text-3);padding:20px">' +
L("یادداشتی یافت نشد", "No notes found") +
"</p>";
return;
}
resultsBox.innerHTML = results
.map(function (r) {
return (
'<div class="note-result" data-date="' + r.date + '">' +
'<div class="note-date">' + window.Calendar.keyToJalaliFull(r.date) + "</div>" +
'<div class="note-preview">' + escapeHtml(r.preview) + "</div>" +
"</div>"
);
})
.join("");
}
if (input) {
input.addEventListener("input", window.Utils.debounce(update, 200));
input.focus();
}
if (resultsBox) {
resultsBox.addEventListener("click", function (event) {
var item = event.target.closest(".note-result");
if (!item) return;
var dateKey = item.dataset.date;
window.UI.modal.close();
if (window.App && window.App.switchTab) {
window.App.switchTab("calendar");
setTimeout(function () {
if (window.App && window.App.openDayModal) {
window.App.openDayModal(dateKey);
}
}, 300);
}
});
}
update();
}

function bind() {
document.addEventListener("click", function (event) {
var btn = event.target.closest("[data-action]");
if (!btn) return;
var action = btn.dataset.action;
if (action === "search-notes") {
openSearchModal();
}
});
}

function init() {
if (initialized) return;
initialized = true;
loadNotes();
bind();
}

window.Notes = {
init: init,
getNote: getNote,
setNote: setNote,
renderToday: renderToday,
renderCalendarNote: renderCalendarNote,
openSearchModal: openSearchModal
};

window.Utils.onDomReady(init);
})();