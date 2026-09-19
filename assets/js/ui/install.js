/* ================================================================
ROUTINE — UI / INSTALL.JS
PWA install prompt handling (deferred, polite, dismissible).
================================================================ */
(function () {
"use strict";
var deferred = null;
var DISMISS_KEY = "pd_install_dismissed";
function L(fa, en) {
return window.I18N && window.I18N.lang === "en" ? en : fa;
}
function toast(msg, type, options) {
if (window.UI && window.UI.toast) window.UI.toast(msg, type, options);
}
function isStandalone() {
return (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) ||
window.navigator.standalone === true;
}
function isIOS() {
return /iphone|ipad|ipod/i.test(navigator.userAgent || "");
}
function dismissed() {
try { return localStorage.getItem(DISMISS_KEY) === "1"; } catch (e) { return false; }
}
function dismiss() {
try { localStorage.setItem(DISMISS_KEY, "1"); } catch (e) {}
}
function removeBanner() {
var b = document.getElementById("installBanner");
if (b) b.remove();
}
function showBanner() {
if (dismissed() || isStandalone() || document.getElementById("installBanner")) return;
var bar = document.createElement("div");
bar.id = "installBanner";
bar.className = "install-banner";
bar.innerHTML =
'<span class="install-banner-icon" aria-hidden="true">📲</span>' +
'<div class="install-banner-text"><strong>' + L("تیکوچی را نصب کن", "Install TikoChi") + "</strong><span>" +
L("مثل یک اپ واقعی، آفلاین و تمام‌صفحه.", "Like a real app: offline & full-screen.") +
"</span></div>" +
'<button class="btn btn-primary btn-sm" id="installBannerBtn">' + L("نصب", "Install") + "</button>" +
'<button class="btn-icon" id="installBannerClose" aria-label="' + L("بعداً", "Later") + '">✕</button>';
document.body.appendChild(bar);
bar.querySelector("#installBannerBtn").addEventListener("click", function () {
promptInstall();
});
bar.querySelector("#installBannerClose").addEventListener("click", function () {
dismiss();
removeBanner();
});
}
function iosHint() {
toast(L("در iOS: از دکمهٔ Share گزینهٔ «Add to Home Screen» را بزن.", "On iOS: tap Share → Add to Home Screen."), "info", { duration: 9000 });
}
function promptInstall() {
if (!deferred) {
if (isIOS()) iosHint();
else toast(L("برای نصب، از منوی مرورگر گزینهٔ «Install app» را بزن.", "To install, use browser menu → Install app."), "info", { duration: 7000 });
return;
}
deferred.prompt();
deferred.userChoice.then(function (choice) {
if (choice && choice.outcome === "accepted") removeBanner();
deferred = null;
});
}
function injectIntoToolsModal(content) {
if (!content || content.querySelector("#installToolsRow")) return;
var wrap = document.createElement("div");
wrap.id = "installToolsRow";
wrap.className = "modal-item";
wrap.innerHTML =
'<div class="item-left"><span>📲</span><span class="item-name">' + L("نصب به‌عنوان اپ", "Install as app") + "</span></div>" +
'<button class="btn btn-ghost btn-sm" id="installToolsBtn">' +
(isStandalone() ? L("نصب شده ✔", "Installed ✔") : L("نصب", "Install")) +
"</button>";
var first = content.querySelector(".modal-section-title");
if (first && first.parentNode) first.parentNode.insertBefore(wrap, first);
else content.insertBefore(wrap, content.firstChild);
wrap.querySelector("#installToolsBtn").addEventListener("click", promptInstall);
}
function init() {
if (isStandalone()) return;
window.addEventListener("beforeinstallprompt", function (event) {
event.preventDefault();
deferred = event;
});
window.addEventListener("appinstalled", function () {
deferred = null;
removeBanner();
toast(L("🎉 تیکوچی نصب شد!", "🎉 TikoChi installed!"), "success");
});
}
window.InstallPrompt = {
init: init,
maybeShow: showBanner,
promptInstall: promptInstall,
isStandalone: isStandalone,
injectIntoToolsModal: injectIntoToolsModal
};
window.Utils.onDomReady(init);
})();
