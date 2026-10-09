/* ================================================================
ROUTINE — FEATURES / ADMIN-INBOX.JS
Admin-only inbox: read every feedback thread and reply in-app.
Visible only when the signed-in Google account is in ADMIN_EMAILS.
================================================================ */
(function () {
"use strict";
var ADMIN_EMAILS = ["hello.routine@outlook.com", "mahdimoslem349@gmail.com"];

function L(fa, en) {
return window.I18N && window.I18N.lang === "en" ? en : fa;
}
function toast(message, type, options) {
if (window.UI && window.UI.toast) window.UI.toast(message, type, options);
}
function svgIcon(name, size) {
return window.Icons ? window.Icons.svg(name, size || 16) : "";
}
function firestore() {
if (!window.firebase || !window.firebase.firestore) return null;
return window.firebase.firestore();
}
function auth() {
if (!window.firebase || !window.firebase.auth) return null;
return window.firebase.auth();
}
function stamp() {
return window.firebase.firestore.FieldValue.serverTimestamp();
}
function millis(value) {
return value && value.toMillis ? value.toMillis() : 0;
}
function isAdminUser(user) {
return !!(user && user.email && ADMIN_EMAILS.indexOf(user.email.toLowerCase()) !== -1);
}
function whoLabel(data) {
if (data.displayName) return data.displayName;
if (data.userEmail) return data.userEmail;
return L("کاربر مهمان", "Guest user");
}
/* ------------------------------
Sidebar entry + badge
------------------------------ */
function injectInboxButton() {
var footer = document.querySelector(".sidebar-footer");
if (!footer || document.getElementById("adminInboxBtn")) return;
var btn = document.createElement("button");
btn.className = "nav-item";
btn.id = "adminInboxBtn";
btn.setAttribute("data-action", "open-inbox");
btn.innerHTML =
'<span class="nav-icon" aria-hidden="true">' + svgIcon("inbox", 20) + "</span>" +
'<span class="nav-label">' + window.I18N.t("feedback.adminInbox") + "</span>" +
'<span class="counter" id="adminInboxBadge"></span>';
footer.insertBefore(btn, footer.firstElementChild);
refreshBadge();
}
function removeInboxButton() {
var btn = document.getElementById("adminInboxBtn");
if (btn) btn.remove();
}
function refreshBadge() {
var badge = document.getElementById("adminInboxBadge");
var db = firestore();
var firebaseAuth = auth();
if (!badge || !db || !isAdminUser(firebaseAuth && firebaseAuth.currentUser)) return;
db.collection("threads")
.where("unreadAdmin", "==", true)
.limit(50)
.get()
.then(function (snapshot) {
badge.textContent = snapshot.empty ? "" : window.I18N.faNum(snapshot.size);
})
.catch(function () {});
}
/* ------------------------------
Inbox modal
------------------------------ */
function inboxRowHTML(doc) {
var data = doc.data();
return (
'<button type="button" class="modal-item" data-admin-thread="' + doc.id + '" style="width:100%;text-align:start;cursor:pointer">' +
'<span class="item-left">' +
'<span class="modal-tag' + (data.status === "answered" ? " done" : "") + '">' +
(data.status === "answered" ? window.I18N.t("feedback.statusAnswered") : window.I18N.t("feedback.statusOpen")) +
"</span>" +
'<span class="item-name">' + window.Utils.escapeHtml(whoLabel(data)) + ": " +
window.Utils.escapeHtml(String(data.message || "").slice(0, 50)) + "</span></span>" +
'<span style="font-size:11px;color:var(--text-3);font-weight:700;white-space:nowrap">' +
(data.unreadAdmin ? "● " : "") + window.Utils.escapeHtml(data.userEmail || "guest") +
"</span></button>"
);
}
function renderInboxList(listEl, onlyOpen) {
var db = firestore();
if (!db) return;
db.collection("threads")
.limit(100)
.get()
.then(function (snapshot) {
var docs = snapshot.docs.slice().sort(function (a, b) {
return millis(b.data().lastActivityAt || b.data().createdAt) - millis(a.data().lastActivityAt || a.data().createdAt);
});
if (onlyOpen) {
docs = docs.filter(function (doc) {
return doc.data().status !== "answered";
});
}
listEl.innerHTML = docs.length
? docs.map(inboxRowHTML).join("")
: '<p class="form-hint">' + window.I18N.t("feedback.adminEmpty") + "</p>";
})
.catch(function (error) {
console.error(error);
listEl.innerHTML = '<p class="form-hint">' + window.I18N.t("feedback.adminEmpty") + "</p>";
});
}
function openAdminThread(threadId) {
var db = firestore();
if (!db || !window.UI || !window.UI.modal) return;
var ref = db.collection("threads").doc(threadId);
ref.get().then(function (snap) {
if (!snap.exists) return;
var thread = snap.data();
var html =
'<div class="modal-item" style="display:block">' +
'<div style="font-size:11px;color:var(--text-3);font-weight:700;margin-bottom:6px">' +
window.Utils.escapeHtml(whoLabel(thread)) + " · " + window.Utils.escapeHtml(thread.userEmail || "guest") +
"</div>" +
'<div style="line-height:2;white-space:pre-wrap">' + window.Utils.escapeHtml(thread.message) + "</div>" +
"</div>" +
'<div id="adminReplies" style="display:grid;gap:8px;margin:12px 0"></div>' +
'<textarea id="adminReplyText" class="input" rows="3" placeholder="' + window.I18N.t("feedback.replyPlaceholder") + '"></textarea>' +
'<button class="btn btn-primary btn-sm" id="adminReplySend" style="width:100%;margin-top:10px">' +
svgIcon("check", 15) + " " + window.I18N.t("feedback.sendReply") +
"</button>";
var content = window.UI.modal.open(window.I18N.t("feedback.adminInbox"), html);
if (!content) return;
if (thread.unreadAdmin) {
ref.update({ unreadAdmin: false }).then(refreshBadge).catch(function () {});
}
var repliesBox = content.querySelector("#adminReplies");
ref.collection("replies")
.orderBy("createdAt", "asc")
.get()
.then(function (snapshot) {
repliesBox.innerHTML = snapshot.docs
.map(function (doc) {
var reply = doc.data();
var isAdmin = reply.author === "admin";
return (
'<div class="modal-item" style="display:block">' +
'<div style="font-size:11px;font-weight:800;color:' + (isAdmin ? "var(--accent)" : "var(--text-3)") + ';margin-bottom:4px">' +
(isAdmin ? L("من (مدیر)", "Me (admin)") : L("کاربر", "User")) + "</div>" +
'<div style="line-height:2;white-space:pre-wrap">' + window.Utils.escapeHtml(reply.text) + "</div>" +
"</div>"
);
})
.join("");
})
.catch(function () {
repliesBox.innerHTML = "";
});
var sendBtn = content.querySelector("#adminReplySend");
var replyText = content.querySelector("#adminReplyText");
if (sendBtn) {
sendBtn.addEventListener("click", function () {
var text = window.Utils.sanitizeText(replyText ? replyText.value : "", 2000);
if (text.length < 2) return;
sendBtn.disabled = true;
ref.collection("replies")
.add({ author: "admin", text: text, createdAt: stamp() })
.then(function () {
return ref.update({ status: "answered", unreadUser: true, unreadAdmin: false, lastActivityAt: stamp() });
})
.then(function () {
window.UI.modal.close();
toast(window.I18N.t("feedback.adminReplySent"), "success");
refreshBadge();
})
.catch(function (error) {
console.error(error);
toast(window.I18N.t("auth.error"), "error");
sendBtn.disabled = false;
});
});
}
});
}
function open() {
if (!window.UI || !window.UI.modal) return;
var html =
'<div class="filter-bar" id="adminInboxFilters" style="margin-bottom:12px">' +
'<button class="filter-chip active" data-open="0">' + window.I18N.t("common.all") + "</button>" +
'<button class="filter-chip" data-open="1">' + window.I18N.t("feedback.statusOpen") + "</button>" +
"</div>" +
'<div id="adminInboxList" style="display:grid;gap:8px"></div>';
var content = window.UI.modal.open(window.I18N.t("feedback.adminInbox"), html);
if (!content) return;
var listEl = content.querySelector("#adminInboxList");
var filters = content.querySelector("#adminInboxFilters");
renderInboxList(listEl, false);
filters.addEventListener("click", function (event) {
var chip = event.target.closest(".filter-chip");
if (!chip) return;
filters.querySelectorAll(".filter-chip").forEach(function (item) {
item.classList.remove("active");
});
chip.classList.add("active");
renderInboxList(listEl, chip.dataset.open === "1");
});
content.addEventListener("click", function (event) {
var row = event.target.closest("[data-admin-thread]");
if (!row) return;
openAdminThread(row.dataset.adminThread);
});
}
/* ------------------------------
Init
------------------------------ */
function init() {
var firebaseAuth = auth();
if (!firebaseAuth) return;
firebaseAuth.onAuthStateChanged(function (user) {
if (isAdminUser(user)) {
injectInboxButton();
} else {
removeInboxButton();
}
});
document.addEventListener("i18n:changed", function () {
var btn = document.getElementById("adminInboxBtn");
if (btn) {
var label = btn.querySelector(".nav-label");
if (label) label.textContent = window.I18N.t("feedback.adminInbox");
}
});
}
window.AdminInbox = {
open: open,
refreshBadge: refreshBadge
};
window.Utils.onDomReady(init);
})();
