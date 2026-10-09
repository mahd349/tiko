/* ================================================================
ROUTINE — FEATURES / FEEDBACK.JS
In-site feedback threads:
- user sends a message (Firestore thread + Formspree email copy)
- admin replies from the inbox modal
- user sees replies here and gets a toast on the next visit
Identity: Google account when signed in, otherwise anonymous uid.
================================================================ */
(function () {
"use strict";
var FORMSPREE_URL = "https://formspree.io/f/xnpaednv";
var TYPE_KEYS = ["bug", "feature", "general"];

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
function ensureIdentity() {
var firebaseAuth = auth();
if (!firebaseAuth) return Promise.reject(new Error("auth unavailable"));
if (firebaseAuth.currentUser) {
return Promise.resolve(firebaseAuth.currentUser);
}
return firebaseAuth.signInAnonymously().then(function (result) {
return result.user;
});
}
function typeLabel(key) {
if (key === "feature") return window.I18N.t("feedback.feature");
if (key === "general") return window.I18N.t("feedback.general");
return window.I18N.t("feedback.bug");
}
function formatDate(value) {
if (!value || !value.toDate) return "";
return window.Calendar.formatDate(value.toDate());
}
/* ------------------------------
Send
------------------------------ */
function sendToFormspree(form) {
try {
fetch(FORMSPREE_URL, {
method: "POST",
body: new FormData(form),
headers: { Accept: "application/json" }
}).catch(function () {});
} catch (error) {
// email copy is best-effort; the thread is the source of truth
}
}
function submitForm(form) {
var emailInput = form.querySelector("input[type='email']");
var typeSelect = form.querySelector("select");
var messageInput = form.querySelector("textarea[name='message']");
var gotcha = form.querySelector("input[name='_gotcha']");
var message = window.Utils.sanitizeText(messageInput ? messageInput.value : "", 2000);
if (message.length < 5) {
toast(window.I18N.t("feedback.tooShort"), "error");
if (messageInput) messageInput.focus();
return;
}
if (gotcha && gotcha.value) {
form.reset();
toast(window.I18N.t("feedback.sent"), "success");
return;
}
var typeIndex = typeSelect ? typeSelect.selectedIndex : 0;
var typeKey = TYPE_KEYS[typeIndex] || "bug";
var email = emailInput ? window.Utils.sanitizeText(emailInput.value, 120) : "";
var sendBtn = form.querySelector("button[type='submit']");
if (sendBtn) sendBtn.disabled = true;
sendToFormspree(form);
ensureIdentity()
.then(function (user) {
var db = firestore();
if (!db) throw new Error("firestore unavailable");
return db.collection("threads").add({
userId: user.uid,
userEmail: user.isAnonymous ? (email || null) : (user.email || email || null),
displayName: user.isAnonymous ? null : (user.displayName || null),
type: typeKey,
message: message,
lang: window.I18N.lang,
status: "open",
unreadUser: false,
unreadAdmin: true,
createdAt: stamp(),
lastActivityAt: stamp()
});
})
.then(function () {
form.reset();
toast(window.I18N.t("feedback.sent"), "success");
renderMyThreads();
})
.catch(function (error) {
console.error(error);
toast(window.I18N.t("feedback.sentEmailOnly"), "info");
})
.then(function () {
if (sendBtn) sendBtn.disabled = false;
});
}
/* ------------------------------
My threads
------------------------------ */
function threadRowHTML(doc) {
var data = doc.data();
var unread = data.unreadUser ? " ●" : "";
return (
'<button type="button" class="modal-item" data-thread-id="' + doc.id + '" style="width:100%;text-align:start;cursor:pointer">' +
'<span class="item-left"><span class="modal-tag">' + window.Utils.escapeHtml(typeLabel(data.type)) + "</span>" +
'<span class="item-name">' + window.Utils.escapeHtml(String(data.message || "").slice(0, 60)) + "</span></span>" +
'<span style="font-size:11px;color:var(--text-3);font-weight:700;white-space:nowrap">' +
(data.status === "answered" ? window.I18N.t("feedback.statusAnswered") : window.I18N.t("feedback.statusOpen")) +
unread + " · " + window.Utils.escapeHtml(formatDate(data.lastActivityAt || data.createdAt)) +
"</span></button>"
);
}
function renderMyThreads() {
var wrap = document.getElementById("myThreadsWrap");
var list = document.getElementById("myThreadsList");
if (!wrap || !list) return;
var firebaseAuth = auth();
var db = firestore();
if (!firebaseAuth || !firebaseAuth.currentUser || !db) {
wrap.hidden = true;
return;
}
wrap.hidden = false;
var title = document.getElementById("myThreadsTitle");
if (title) title.textContent = window.I18N.t("feedback.myThreads");
db.collection("threads")
.where("userId", "==", firebaseAuth.currentUser.uid)
.limit(50)
.get()
.then(function (snapshot) {
var docs = snapshot.docs.slice().sort(function (a, b) {
return millis(b.data().lastActivityAt || b.data().createdAt) - millis(a.data().lastActivityAt || a.data().createdAt);
});
if (!docs.length) {
list.innerHTML = '<p class="form-hint">' + window.I18N.t("feedback.threadEmpty") + "</p>";
return;
}
list.innerHTML = docs.map(threadRowHTML).join("");
})
.catch(function (error) {
console.error(error);
list.innerHTML = "";
wrap.hidden = true;
});
}
function openThreadModal(threadId) {
var db = firestore();
if (!db || !window.UI || !window.UI.modal) return;
var ref = db.collection("threads").doc(threadId);
ref.get().then(function (threadSnap) {
if (!threadSnap.exists) return;
var thread = threadSnap.data();
var html =
'<div class="modal-item" style="display:block">' +
'<div style="font-size:11px;color:var(--text-3);font-weight:700;margin-bottom:6px">' +
window.Utils.escapeHtml(typeLabel(thread.type)) + " · " + window.Utils.escapeHtml(formatDate(thread.createdAt)) +
"</div>" +
'<div style="line-height:2;white-space:pre-wrap">' + window.Utils.escapeHtml(thread.message) + "</div>" +
"</div>" +
'<div id="threadReplies" style="display:grid;gap:8px;margin:12px 0"></div>' +
'<textarea id="threadReplyText" class="input" rows="3" placeholder="' + window.I18N.t("feedback.replyPlaceholder") + '"></textarea>' +
'<button class="btn btn-primary btn-sm" id="threadReplySend" style="width:100%;margin-top:10px">' +
svgIcon("check", 15) + " " + window.I18N.t("feedback.sendReply") +
"</button>";
var content = window.UI.modal.open(window.I18N.t("feedback.myThreads"), html);
if (!content) return;
if (thread.unreadUser) {
ref.update({ unreadUser: false }).catch(function () {});
}
var repliesBox = content.querySelector("#threadReplies");
db.collection("threads").doc(threadId).collection("replies")
.orderBy("createdAt", "asc")
.get()
.then(function (snapshot) {
repliesBox.innerHTML = snapshot.docs
.map(function (doc) {
var reply = doc.data();
var isAdmin = reply.author === "admin";
return (
'<div class="modal-item" style="display:block;border-color:' + (isAdmin ? "var(--accent-line)" : "var(--border)") + '">' +
'<div style="font-size:11px;font-weight:800;color:' + (isAdmin ? "var(--accent)" : "var(--text-3)") + ';margin-bottom:4px">' +
(isAdmin ? window.I18N.t("app.name") : window.I18N.t("auth.login").replace(window.I18N.t("auth.login"), L("شما", "You"))) +
" · " + window.Utils.escapeHtml(formatDate(reply.createdAt)) + "</div>" +
'<div style="line-height:2;white-space:pre-wrap">' + window.Utils.escapeHtml(reply.text) + "</div>" +
"</div>"
);
})
.join("");
})
.catch(function () {
repliesBox.innerHTML = "";
});
var sendBtn = content.querySelector("#threadReplySend");
var replyText = content.querySelector("#threadReplyText");
if (sendBtn) {
sendBtn.addEventListener("click", function () {
var text = window.Utils.sanitizeText(replyText ? replyText.value : "", 2000);
if (text.length < 2) return;
sendBtn.disabled = true;
db.collection("threads").doc(threadId).collection("replies")
.add({ author: "user", text: text, createdAt: stamp() })
.then(function () {
return ref.update({ unreadAdmin: true, status: "open", lastActivityAt: stamp() });
})
.then(function () {
window.UI.modal.close();
toast(window.I18N.t("toast.saved"), "success");
renderMyThreads();
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
/* ------------------------------
Unread on open
------------------------------ */
function checkUnread() {
var firebaseAuth = auth();
var db = firestore();
if (!firebaseAuth || !firebaseAuth.currentUser || !db) return;
db.collection("threads")
.where("userId", "==", firebaseAuth.currentUser.uid)
.where("unreadUser", "==", true)
.limit(10)
.get()
.then(function (snapshot) {
if (snapshot.empty) return;
toast(window.I18N.t("feedback.newReply"), "info", {
duration: 9000,
action: {
label: window.I18N.t("feedback.viewThread"),
onClick: function () {
renderMyThreads();
var first = document.querySelector("#myThreadsList [data-thread-id]");
if (first) openThreadModal(first.dataset.threadId);
}
}
});
})
.catch(function () {});
}
/* ------------------------------
Init
------------------------------ */
function injectMyThreads() {
var card = document.querySelector(".feedback-section .card");
if (!card || document.getElementById("myThreadsWrap")) return;
var wrap = document.createElement("div");
wrap.id = "myThreadsWrap";
wrap.hidden = true;
wrap.innerHTML =
'<div class="card-header" style="margin-top:18px;margin-bottom:10px">' +
"<div>" + svgIcon("bell", 16) + ' <strong id="myThreadsTitle" style="font-size:14px"></strong></div>' +
'<button class="btn btn-ghost btn-sm" id="myThreadsRefresh">' + svgIcon("reset", 14) + "</button>" +
"</div>" +
'<div id="myThreadsList" style="display:grid;gap:8px"></div>';
card.appendChild(wrap);
var refresh = wrap.querySelector("#myThreadsRefresh");
if (refresh) {
refresh.addEventListener("click", renderMyThreads);
}
}
function bindForm() {
var form = document.querySelector(".feedback-form");
if (!form || form.dataset.threadBound) return;
form.dataset.threadBound = "1";
form.addEventListener("submit", function (event) {
event.preventDefault();
submitForm(form);
});
}
function bindThreadClicks() {
document.addEventListener("click", function (event) {
var row = event.target.closest("#myThreadsList [data-thread-id]");
if (!row) return;
openThreadModal(row.dataset.threadId);
});
}
function init() {
injectMyThreads();
bindForm();
bindThreadClicks();
var firebaseAuth = auth();
if (firebaseAuth) {
firebaseAuth.onAuthStateChanged(function () {
renderMyThreads();
checkUnread();
});
}
document.addEventListener("i18n:changed", function () {
renderMyThreads();
});
}
window.Feedback = {
renderMyThreads: renderMyThreads,
checkUnread: checkUnread
};
window.Utils.onDomReady(init);
})();
