/* ================================================================
ROUTINE — FEATURES / ANIMATED-BG.JS
Lightweight animated backgrounds with two modes:
- Grid: subtle moving grid lines
- Dots: floating dots pattern
Both are GPU-accelerated and pause when tab is hidden.
================================================================ */
(function () {
"use strict";

var canvas = null;
var ctx = null;
var animationId = null;
var isRunning = false;
var mode = "grid"; // or "dots"
var isVisible = true;
var isPageVisible = true;
var frameCount = 0;
var dots = [];

/* ---------- helpers ---------- */
function getThemeColors() {
var style = getComputedStyle(document.documentElement);
return {
bg: style.getPropertyValue("--bg").trim() || "#060a14",
accent: style.getPropertyValue("--accent").trim() || "#8b5cf6",
accent2: style.getPropertyValue("--accent-2").trim() || "#6366f1",
gridLine: style.getPropertyValue("--grid-line").trim() || "rgba(148, 163, 184, 0.06)"
};
}

function hexToRgb(hex) {
hex = String(hex || "").replace("#", "");
if (hex.length === 3) {
hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
}
var int = parseInt(hex, 16);
if (isNaN(int)) return { r: 139, g: 92, b: 246 };
return {
r: (int >> 16) & 255,
g: (int >> 8) & 255,
b: int & 255
};
}

/* ---------- setup ---------- */
function setup() {
if (!canvas || !ctx) return;
var dpr = Math.min(window.devicePixelRatio || 1, 2);
var rect = canvas.getBoundingClientRect();
canvas.width = rect.width * dpr;
canvas.height = rect.height * dpr;
ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
if (mode === "dots") initDots(rect.width, rect.height);
}

function initDots(width, height) {
dots = [];
var isMobile = width < 768;
var count = isMobile ? 40 : 80;
for (var i = 0; i < count; i++) {
dots.push({
x: Math.random() * width,
y: Math.random() * height,
r: 1 + Math.random() * 2,
vx: (Math.random() - 0.5) * 0.3,
vy: (Math.random() - 0.5) * 0.3,
alpha: 0.2 + Math.random() * 0.4
});
}
}

/* ---------- draw modes ---------- */
function drawGrid() {
var colors = getThemeColors();
var width = canvas.getBoundingClientRect().width;
var height = canvas.getBoundingClientRect().height;
ctx.clearRect(0, 0, width, height);
var spacing = 60;
var offset = (frameCount * 0.3) % spacing;
ctx.strokeStyle = colors.gridLine;
ctx.lineWidth = 1;
for (var x = -spacing + offset; x < width + spacing; x += spacing) {
ctx.beginPath();
ctx.moveTo(x, 0);
ctx.lineTo(x, height);
ctx.stroke();
}
for (var y = -spacing + offset; y < height + spacing; y += spacing) {
ctx.beginPath();
ctx.moveTo(0, y);
ctx.lineTo(width, y);
ctx.stroke();
}
}

function drawDots() {
var colors = getThemeColors();
var width = canvas.getBoundingClientRect().width;
var height = canvas.getBoundingClientRect().height;
var rgb = hexToRgb(colors.accent);
ctx.clearRect(0, 0, width, height);
dots.forEach(function (dot) {
dot.x += dot.vx;
dot.y += dot.vy;
if (dot.x < 0 || dot.x > width) dot.vx *= -1;
if (dot.y < 0 || dot.y > height) dot.vy *= -1;
ctx.beginPath();
ctx.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2);
ctx.fillStyle = "rgba(" + rgb.r + ", " + rgb.g + ", " + rgb.b + ", " + dot.alpha + ")";
ctx.fill();
});
}

function draw() {
if (!ctx) return;
frameCount++;
if (mode === "grid") drawGrid();
else if (mode === "dots") drawDots();
}

/* ---------- loop ---------- */
function loop() {
if (!isRunning) return;
if (!isVisible || !isPageVisible) {
animationId = null;
return;
}
draw();
animationId = requestAnimationFrame(loop);
}

function start() {
if (isRunning) return;
isRunning = true;
setup();
loop();
updateButton();
try {
localStorage.setItem("pd_animated_bg", mode);
} catch (e) {}
}

function stop() {
isRunning = false;
if (animationId) {
cancelAnimationFrame(animationId);
animationId = null;
}
if (ctx && canvas) {
var width = canvas.getBoundingClientRect().width;
var height = canvas.getBoundingClientRect().height;
ctx.clearRect(0, 0, width, height);
}
updateButton();
try {
localStorage.removeItem("pd_animated_bg");
} catch (e) {}
}

function setMode(m) {
mode = m === "dots" ? "dots" : "grid";
if (isRunning) {
stop();
start();
}
}

function toggle() {
if (isRunning) stop();
else start();
}

/* ---------- observers ---------- */
function attachObservers() {
if (!canvas) return;
var io = new IntersectionObserver(function (entries) {
isVisible = entries[0] && entries[0].isIntersecting;
if (isRunning && isVisible && isPageVisible && !animationId) {
loop();
}
}, { threshold: 0 });
io.observe(canvas);

document.addEventListener("visibilitychange", function () {
isPageVisible = document.visibilityState === "visible";
if (isRunning && isVisible && isPageVisible && !animationId) {
loop();
}
});

window.addEventListener("resize", function () {
if (isRunning) setup();
}, { passive: true });
}

/* ---------- UI ---------- */
function createCanvas() {
if (canvas) return;
canvas = document.createElement("canvas");
canvas.id = "animatedBgCanvas";
canvas.className = "animated-bg-canvas";
canvas.setAttribute("aria-hidden", "true");
document.body.insertBefore(canvas, document.body.firstChild);
ctx = canvas.getContext("2d");
}

function createButton() {
if (document.getElementById("animBgBtn")) return;
var btn = document.createElement("button");
btn.id = "animBgBtn";
btn.className = "anim-bg-toggle";
btn.type = "button";
btn.setAttribute("aria-label", "تغییر پس‌زمینه متحرک");
btn.innerHTML =
'<span class="anim-bg-icon">✨</span>' +
'<span class="anim-bg-label">انیمیشن</span>';
btn.addEventListener("click", toggle);
document.body.appendChild(btn);
}

function updateButton() {
var btn = document.getElementById("animBgBtn");
if (!btn) return;
btn.classList.toggle("active", isRunning);
btn.setAttribute("aria-pressed", isRunning ? "true" : "false");
var label = btn.querySelector(".anim-bg-label");
if (label) {
label.textContent = isRunning
? (window.I18N ? window.I18N.t("bgAnim.on") : "انیمیشن روشن")
: (window.I18N ? window.I18N.t("bgAnim.off") : "انیمیشن خاموش");
}
}

function injectIntoToolsModal(content) {
if (!content) return;
var existing = content.querySelector("#animBgModalSelect");
if (existing) return;

var wrap = document.createElement("div");
wrap.className = "anim-bg-modal-block";
wrap.innerHTML =
'<div class="modal-section-title">✨ ' +
(window.I18N ? window.I18N.t("bgAnim.title") : "پس‌زمینه متحرک") +
"</div>" +
'<div class="modal-item">' +
'<div class="item-left">' +
'<label for="animBgModalSelect" style="cursor:pointer">' +
(window.I18N ? window.I18N.t("bgAnim.select") : "انتخاب سبک") +
"</label>" +
"</div>" +
'<select id="animBgModalSelect" class="input" style="width:140px">' +
'<option value="off"' + (!isRunning ? " selected" : "") + ">" +
(window.I18N ? window.I18N.t("bgAnim.off") : "خاموش") +
"</option>" +
'<option value="grid"' + (isRunning && mode === "grid" ? " selected" : "") + ">" +
(window.I18N ? window.I18N.t("bgAnim.grid") : "شبکه") +
"</option>" +
'<option value="dots"' + (isRunning && mode === "dots" ? " selected" : "") + ">" +
(window.I18N ? window.I18N.t("bgAnim.dots") : "نقطه‌ها") +
"</option>" +
"</select>" +
"</div>";

var firstSection = content.querySelector(".modal-section-title");
if (firstSection && firstSection.parentNode) {
firstSection.parentNode.insertBefore(wrap, firstSection);
} else {
content.insertBefore(wrap, content.firstChild);
}

var select = wrap.querySelector("#animBgModalSelect");
if (select) {
select.addEventListener("change", function () {
var val = select.value;
if (val === "off") {
stop();
} else {
setMode(val);
start();
}
});
}
}

/* ---------- init ---------- */
function init() {
createCanvas();
createButton();
attachObservers();
updateButton();

var saved = null;
try {
saved = localStorage.getItem("pd_animated_bg");
} catch (e) {}
if (saved === "grid" || saved === "dots") {
mode = saved;
setTimeout(start, 1000);
}

window.AnimatedBg = {
toggle: toggle,
start: start,
stop: stop,
setMode: setMode,
injectIntoToolsModal: injectIntoToolsModal
};
}

if (document.readyState === "loading") {
document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
init();
}
})();