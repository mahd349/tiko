/* ================================================================
ROUTINE — UI / TOAST.JS
================================================================ */
(function () {
"use strict";
let timer = null;
function hide() {
const toast = document.getElementById("toast");
if (!toast) return;
toast.classList.remove("show");
}
function iconForType(type) {
if (type === "error") return "warn";
if (type === "info") return "info";
if (type === "undo") return "reset";
if (type === "success") return "check";
return "sparkle";
}
function toast(message, type, options) {
const el = document.getElementById("toast");
if (!el) return;
options = options || {};
type = type || "success";
clearTimeout(timer);
el.innerHTML = "";
el.className = "toast " + type;
const icon = document.createElement("span");
icon.className = "toast-icon";
icon.setAttribute("aria-hidden", "true");
icon.innerHTML = window.Icons ? window.Icons.svg(iconForType(type), 18) : "";
el.appendChild(icon);
const span = document.createElement("span");
span.textContent = message;
el.appendChild(span);
if (options.action && options.action.label && options.action.onClick) {
const btn = document.createElement("button");
btn.className = "btn btn-ghost btn-sm";
btn.textContent = options.action.label;
btn.addEventListener("click", function () {
try {
options.action.onClick();
} finally {
hide();
}
});
el.appendChild(btn);
}
void el.offsetWidth;
el.classList.add("show");
const duration =
options.duration ||
(options.action ? 6500 : 2600);
timer = setTimeout(hide, duration);
}
window.UI = window.UI || {};
window.UI.toast = toast;
})();
