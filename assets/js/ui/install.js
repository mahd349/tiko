/* ================================================================
ROUTINE — UI / INSTALL.JS
PWA install prompt handling (deferred, polite, browser-aware).
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
return (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) || window.navigator.standalone === true;
}
function browserInfo() {
var ua = navigator.userAgent || "";
return {
isFirefox: /firefox|fxios/i.test(ua),
isAndroid: /android/i.test(ua),
isIOS: /iphone|ipad|ipod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
};
}
function installSupported() {
var b = browserInfo();
if (b.isIOS) return true;
if (b.isFirefox) return b.isAndroid;
return true;
}
function installHint() {
var b = browserInfo();
if (b.isIOS) return L("در iOS/Safari: دکمهٔ Share و سپس «Add to Home Screen» را بزن.", "On iOS/Safari: tap Share → “Add to Home Screen”.");
if (b.isFirefox && !b.isAndroid) return L("فایرفاکسِ دسکتاپ از نصب PWA پشتیبانی نمی‌کند. با کروم، اج یا فایرفاکسِ اندروید نصب کن؛ داده‌هایت هم با انتقال QR/فایل قابل جابه‌جایی است.", "Firefox desktop doesn't support PWA installs. Use Chrome, Edge or Firefox for Android; your data moves via QR/file transfer.");
if (b.isFirefox && b.isAndroid) return L("در فایرفاکس اندروید: منو → «Install» یا «Add to Home screen».", "On Firefox for Android: menu → Install / Add to Home screen.");
return L("از منوی مرورگر گزینهٔ «Install app» یا آیکن نصب در نوار آدرس را بزن.", "Use browser menu → “Install app”, or the install icon in the address bar.");
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
if (dismissed() || isStandalone() || !installSupported() || document.getElementById("installBanner")) return;
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
bar.querySelector("#installBannerBtn").addEventListener("click", promptInstall);
bar.querySelector("#installBannerClose").addEventListener("click", function () {
dismiss();
removeBanner();
});
}
function promptInstall() {
if (deferred) {
deferred.prompt();
deferred.userChoice.then(function (choice) {
if (choice && choice.outcome === "accepted") removeBanner();
deferred = null;
});
return;
}
toast(installHint(), "info", { duration: 9000 });
}
function injectIntoToolsModal(content) {
if (!content || content.querySelector("#installToolsRow")) return;
var supported = installSupported();
var wrap = document.createElement("div");
wrap.id = "installToolsRow";
wrap.className = "modal-item";
wrap.innerHTML =
'<div class="item-left"><span>📲</span><span class="item-name">' + L("نصب به‌عنوان اپ", "Install as app") + "</span></div>" +
'<button class="btn btn-ghost btn-sm" id="installToolsBtn">' +
(isStandalone() ? L("نصب شده ✔", "Installed ✔") : supported ? L("نصب", "Install") : L("راهنما", "Guide")) +
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
installSupported: installSupported,
injectIntoToolsModal: injectIntoToolsModal
};
window.Utils.onDomReady(init);
})();
