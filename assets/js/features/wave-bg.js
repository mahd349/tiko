/* ================================================================
ROUTINE — FEATURES / WAVE-BG.JS
Full-screen animated wave arcs background.
- Activated by user (button + tools modal)
- Pauses when tab is hidden or canvas is out of viewport
- Preference stored in sessionStorage (resets on tab close)
================================================================ */
(function () {
"use strict";

var STORAGE_KEY = "pd_wave_bg";
var TWO_PI = 2 * Math.PI;
var container = null;
var canvas = null;
var ctx = null;
var animationId = 0;
var isVisible = false;
var isPageVisible = true;
var isActive = false;
var frameCount = 0;
var mouseTargetY = 0;
var mouseCurrentY = 0;
var resizeTimer = 0;
var width = 0;
var height = 0;
var dpr = 1;

/* ---------- helpers ---------- */
function L(fa, en) {
return window.I18N && window.I18N.lang === "en" ? en : fa;
}

function map(v, a, b, c, d) {
return ((v - a) / (b - a)) * (d - c) + c;
}

function parseRGB(str) {
if (!str) return { r: 139, g: 92, b: 246 };
var m = String(str).match(/rgba?\(([^)]+)\)/i);
if (m) {
var parts = m[1].split(",").map(function (n) {
return parseInt(n.trim(), 10);
});
return { r: parts[0] || 0, g: parts[1] || 0, b: parts[2] || 0 };
}
var hex = String(str).replace(/^#/, "");
if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
if (hex.length >= 6) {
return {
r: parseInt(hex.slice(0, 2), 16),
g: parseInt(hex.slice(2, 4), 16),
b: parseInt(hex.slice(4, 6), 16)
};
}
return { r: 139, g: 92, b: 246 };
}

function getThemeColors() {
var style = getComputedStyle(document.documentElement);
var accent = style.getPropertyValue("--accent").trim() || "#8b5cf6";
var accent2 = style.getPropertyValue("--accent-2").trim() || "#6366f1";
var bg = style.getPropertyValue("--bg").trim() || "#060a14";
return { accent: accent, accent2: accent2, bg: bg };
}

/* ---------- setup / resize ---------- */
function setup() {
if (!container || !canvas || !ctx) return;
dpr = Math.min(window.devicePixelRatio || 1, 2);
var rect = container.getBoundingClientRect();
width = rect.width;
height = rect.height;
canvas.width = Math.floor(width * dpr);
canvas.height = Math.floor(height * dpr);
canvas.style.width = width + "px";
canvas.style.height = height + "px";
ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
mouseTargetY = height / 2;
mouseCurrentY = height / 2;
}

/* ---------- draw ---------- */
function draw() {
if (!ctx) return;
var colors = getThemeColors();
var mouse = { y: mouseCurrentY, target: mouseTargetY };
mouseCurrentY += (mouse.target - mouseCurrentY) * 0.08;

ctx.fillStyle = colors.bg;
ctx.fillRect(0, 0, width, height);

var isMobile = width < 768;
var lineCount = isMobile ? 22 : 40;
var speed = 5;
var glow = 10;
var lineWidth = isMobile ? 1 : 1.4;

var accentRGB = parseRGB(colors.accent);
var accent2RGB = parseRGB(colors.accent2);

ctx.save();
ctx.lineWidth = lineWidth;
ctx.translate(width / 2, height + (isMobile ? 60 : 40));

var f = map(mouseCurrentY, 0, height, 1.0, -1.0);
var m = Math.max(320, Math.min(1440, width));
var rate = map(m, 320, 1440, 0.002, 0.0005) * (speed / 5);
var p = frameCount * rate;
var h = width / 2;
var u = 55000 / glow;

for (var k = 0; k < lineCount; k++) {
var ang = map(k, 0, lineCount, 0, Math.PI) + p;
ang %= Math.PI;
var l = (Math.tan(ang) - f) * height;
var a = Math.abs(l) / 2;
var yCenter = -height / 2 + l / 2;
var bright = Math.max(0, Math.min(255, map(Math.abs(l), 0, u, -20, 255))) / 255;
if (bright <= 0.02) continue;

var ratio = k / lineCount;
var r = Math.round(accentRGB.r * (1 - ratio) + accent2RGB.r * ratio);
var g = Math.round(accentRGB.g * (1 - ratio) + accent2RGB.g * ratio);
var b = Math.round(accentRGB.b * (1 - ratio) + accent2RGB.b * ratio);

ctx.strokeStyle = "rgba(" + r + ", " + g + ", " + b + ", " + bright + ")";

if (a > 499999.5) {
ctx.beginPath();
ctx.moveTo(-h, -height / 2);
ctx.lineTo(h, -height / 2);
ctx.stroke();
continue;
}

var c2 = Math.acos(Math.min(1, (h + 50) / a));
var segTotal = Math.max(Math.ceil(a / 140), 120);
var spans = [
[c2, Math.PI - c2],
[Math.PI + c2, TWO_PI - c2]
];
for (var s = 0; s < spans.length; s++) {
var start = spans[s][0];
var end = spans[s][1];
var span = end - start;
var n3 = Math.max(Math.ceil((span / TWO_PI) * segTotal), 50);
var step = span / n3;
ctx.beginPath();
for (var si = 0; si <= n3; si++) {
var aa = start + step * si;
var xx = Math.cos(aa) * a;
var yy = yCenter + Math.sin(aa) * a;
if (si === 0) ctx.moveTo(xx, yy);
else ctx.lineTo(xx, yy);
}
ctx.stroke();
}
}

ctx.restore();
}

/* ---------- loop ---------- */
function loop() {
if (!isActive) return;
if (!isVisible || !isPageVisible) {
animationId = 0;
return;
}
frameCount += 1;
draw();
animationId = requestAnimationFrame(loop);
}

function startLoop() {
if (!isActive || animationId) return;
if (!isVisible || !isPageVisible) return;
animationId = requestAnimationFrame(loop);
}

function stopLoop() {
if (animationId) {
cancelAnimationFrame(animationId);
animationId = 0;
}
}

/* ---------- activate / deactivate ---------- */
function activate(fromStorage) {
if (isActive) return;
if (!container || !canvas || !ctx) return;
isActive = true;
container.classList.add("wave-bg-active");
document.body.classList.add("wave-bg-active");
try {
sessionStorage.setItem(STORAGE_KEY, "1");
} catch (error) {
// ignore
}
updateToggleButton();
updateModalCheckbox();
setup();
startLoop();
}

function deactivate(savePref) {
if (!isActive && !container) return;
isActive = false;
stopLoop();
frameCount = 0;
if (container) container.classList.remove("wave-bg-active");
document.body.classList.remove("wave-bg-active");
if (savePref !== false) {
try {
sessionStorage.removeItem(STORAGE_KEY);
} catch (error) {
// ignore
}
}
updateToggleButton();
updateModalCheckbox();
if (ctx && canvas) {
var colors = getThemeColors();
ctx.fillStyle = colors.bg;
ctx.fillRect(0, 0, width, height);
}
}

function toggle() {
if (isActive) deactivate();
else activate();
}

/* ---------- observers ---------- */
function attachObservers() {
if (!container) return;

var io = new IntersectionObserver(function (entries) {
isVisible = entries[0] && entries[0].isIntersecting;
if (isActive) {
isVisible && isPageVisible ? startLoop() : stopLoop();
}
}, { threshold: 0 });
io.observe(container);

document.addEventListener("visibilitychange", function () {
isPageVisible = document.visibilityState === "visible";
if (isActive) {
isVisible && isPageVisible ? startLoop() : stopLoop();
}
});

window.addEventListener("resize", function () {
clearTimeout(resizeTimer);
resizeTimer = setTimeout(function () {
if (isActive) {
setup();
if (!animationId && isVisible && isPageVisible) {
draw();
}
}
}, 150);
}, { passive: true });

window.addEventListener("beforeunload", function () {
try {
sessionStorage.removeItem(STORAGE_KEY);
} catch (error) {
// ignore
}
});

document.addEventListener("mousemove", function (ev) {
if (!isActive || !isVisible) return;
var rect = container.getBoundingClientRect();
mouseTargetY = ev.clientY - rect.top;
}, { passive: true });
}

/* ---------- UI controls ---------- */
function ensureContainer() {
if (container) return container;
container = document.getElementById("waveBgContainer");
if (!container) {
container = document.createElement("div");
container.id = "waveBgContainer";
container.className = "wave-bg-container";
container.setAttribute("aria-hidden", "true");
canvas = document.createElement("canvas");
canvas.className = "wave-bg-canvas";
container.appendChild(canvas);
document.body.insertBefore(container, document.body.firstChild);
} else {
canvas = container.querySelector("canvas");
}
if (canvas && !ctx) {
ctx = canvas.getContext("2d", { alpha: false });
}
return container;
}

function updateToggleButton() {
var btn = document.getElementById("waveToggleBtn");
if (!btn) return;
var icon = btn.querySelector(".wave-toggle-icon");
var label = btn.querySelector(".wave-toggle-label");
if (icon) icon.textContent = isActive ? "✦" : "✨";
if (label) label.textContent = isActive
? L("پس‌زمینه متحرک: روشن", "Animated bg: on")
: L("پس‌زمینه متحرک: خاموش", "Animated bg: off");
btn.classList.toggle("is-active", isActive);
btn.setAttribute("aria-pressed", isActive ? "true" : "false");
}

function updateModalCheckbox() {
var cb = document.getElementById("waveModalCheck");
if (cb) cb.checked = isActive;
}

function createToggleButton() {
/* Floating toggle removed by design; the control lives inside the tools modal. */
}

/* ---------- tools modal integration ---------- */
function injectIntoToolsModal(content) {
if (!content) return;
var existing = content.querySelector("#waveModalCheck");
if (existing) {
existing.checked = isActive;
return;
}
var toolsTitle = content.querySelectorAll(".modal-section-title");
var insertAfter = null;
for (var i = 0; i < toolsTitle.length; i++) {
if (toolsTitle[i].textContent.indexOf(L("زبان", "Language")) !== -1 ||
toolsTitle[i].textContent.indexOf("🌐") !== -1) {
insertAfter = toolsTitle[i].nextElementSibling;
break;
}
}
var wrap = document.createElement("div");
wrap.className = "wave-modal-block";
wrap.innerHTML =
'<div class="modal-section-title">✨ ' + L("پس‌زمینه متحرک", "Animated background") + "</div>" +
'<div class="modal-item">' +
'<div class="item-left">' +
'<label for="waveModalCheck" style="cursor:pointer">' +
L("فعال‌سازی امواج متحرک در پس‌زمینه", "Enable animated waves in background") +
'<div style="font-size:11px;color:var(--text-3);font-weight:600;margin-top:4px">' +
L("با بستن تب، به حالت ثابت برمی‌گردد.", "Resets to static when you close the tab.") +
"</div>" +
"</label>" +
"</div>" +
'<input type="checkbox" id="waveModalCheck"' +
(isActive ? " checked" : "") +
' style="width:22px;height:22px;accent-color:var(--accent);cursor:pointer">' +
"</div>";
if (insertAfter && insertAfter.parentNode) {
insertAfter.parentNode.insertBefore(wrap, insertAfter.nextSibling);
} else {
content.insertBefore(wrap, content.firstChild);
}
var cb = wrap.querySelector("#waveModalCheck");
if (cb) {
cb.addEventListener("change", function () {
if (cb.checked) activate();
else deactivate();
});
}
}

/* ---------- init ---------- */
function init() {
ensureContainer();
createToggleButton();
attachObservers();
setup();

window.WaveBg = {
toggle: toggle,
activate: activate,
deactivate: deactivate,
isActive: function () { return isActive; },
injectIntoToolsModal: injectIntoToolsModal
};

var saved = null;
try {
saved = sessionStorage.getItem(STORAGE_KEY);
} catch (error) {
// ignore
}
if (saved === "1") {
setTimeout(function () {
activate(true);
}, 600);
}
}

if (document.readyState === "loading") {
document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
init();
}
})();
