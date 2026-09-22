/* ================================================================
ROUTINE — FEATURES / FX-SATURN-BG.JS
Reward background (level 2+): particle ringed planet.
Vanilla port of the Originkit "Particle Saturn" component supplied
by the user. Original attribution kept — verify Originkit license
before shipping. Three.js is dynamic-imported only while active.
================================================================ */
(function () {
"use strict";
var THREE_URL = "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
var STORAGE_KEY = "pd_fx_bg";
var ID = "saturn";
var UNLOCK_LEVEL = 2;
var PERSPECTIVE = 0.15;
var VIEW_SPAN = 6.4;
var CORE_RADIUS = 1;
var MAX_MOTES = 90000;
var RING_THICKNESS = 0.011;
var RING_MOTE_FACTOR = 1.35;
var TAU = Math.PI * 2;
var PRESET = {
coreColor: "#997F00",
ringColor: "#FFD400",
density: 20,
particleSize: 14,
glow: 20,
tilt: 6,
roll: 7,
spinSpeed: 7,
ring: { innerRadius: 105, outerRadius: 262, gaps: 1, orbitSpeed: 9 },
dragSensitivity: 2,
sizePercent: 134
};
var container = null;
var scene = null;
var isRunning = false;
var isStarting = false;
var threePromise = null;
function L(fa, en) {
return window.I18N && window.I18N.lang === "en" ? en : fa;
}
function clamp(v, lo, hi, fb) {
var n = typeof v === "number" && isFinite(v) ? v : fb;
return Math.max(lo, Math.min(hi, n));
}
function settingsFor(cfg) {
var ring = cfg.ring;
var density = clamp(cfg.density, 1, 20, PRESET.density);
var baseMotes = 600 + density * density * 95;
var coreMotes = Math.min(MAX_MOTES, Math.round(baseMotes));
var ringMotes = Math.min(MAX_MOTES, Math.round(baseMotes * RING_MOTE_FACTOR));
var innerFraction = clamp(ring.innerRadius, 105, 200, PRESET.ring.innerRadius) / 100;
var outerFraction = clamp(ring.outerRadius, 110, 300, PRESET.ring.outerRadius) / 100;
return {
coreMotes: coreMotes,
ringMotes: ringMotes,
moteSize: 0.5 + clamp(cfg.particleSize, 1, 20, PRESET.particleSize) * 0.13,
glow: 0.15 + clamp(cfg.glow, 1, 20, PRESET.glow) * 0.055,
tiltRadians: (clamp(cfg.tilt, -80, 80, PRESET.tilt) * Math.PI) / 180,
rollRadians: (clamp(cfg.roll, -90, 90, PRESET.roll) * Math.PI) / 180,
spinRate: clamp(cfg.spinSpeed, 0, 20, PRESET.spinSpeed) * 0.05,
innerRadius: innerFraction * CORE_RADIUS,
outerRadius: Math.max(innerFraction + 0.08, outerFraction) * CORE_RADIUS,
gapCount: Math.round(clamp(ring.gaps, 0, 4, PRESET.ring.gaps)),
ringThickness: RING_THICKNESS,
orbitRate: clamp(ring.orbitSpeed, 0, 20, PRESET.ring.orbitSpeed) * 0.11
};
}
function insideGap(S, radius, span) {
for (var g = 0; g < S.gapCount; g++) {
var centre = S.innerRadius + span * ((g + 1) / (S.gapCount + 1));
var halfWidth = span * (0.075 - g * 0.011);
if (Math.abs(radius - centre) < halfWidth) return true;
}
return false;
}
function pickRingRadius(S, span) {
for (var attempt = 0; attempt < 10; attempt++) {
var u = Math.sqrt(Math.random());
var radius = S.innerRadius + u * span;
if (!insideGap(S, radius, span)) return radius;
}
return S.outerRadius;
}
function buildCloud(THREE, S) {
var count = S.coreMotes + S.ringMotes;
var position = new Float32Array(count * 3);
var kind = new Float32Array(count);
var along = new Float32Array(count);
var seed = new Float32Array(count);
var radius = new Float32Array(count);
var i, k;
for (i = 0; i < S.coreMotes; i++) {
kind[i] = 0;
along[i] = (i + 0.5) / S.coreMotes;
seed[i] = Math.random();
radius[i] = 0;
}
var span = S.outerRadius - S.innerRadius;
for (i = 0; i < S.ringMotes; i++) {
k = S.coreMotes + i;
kind[k] = 1;
along[k] = i / Math.max(1, S.ringMotes - 1);
seed[k] = Math.random();
radius[k] = pickRingRadius(S, span);
}
var geometry = new THREE.BufferGeometry();
geometry.setAttribute("position", new THREE.BufferAttribute(position, 3));
geometry.setAttribute("aKind", new THREE.BufferAttribute(kind, 1));
geometry.setAttribute("aAlong", new THREE.BufferAttribute(along, 1));
geometry.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
geometry.setAttribute("aRadius", new THREE.BufferAttribute(radius, 1));
return geometry;
}
var SATURN_VERTEX = [
"attribute float aKind;",
"attribute float aAlong;",
"attribute float aSeed;",
"attribute float aRadius;",
"uniform float uTime;",
"uniform float uMoteSize;",
"uniform float uOrbitRate;",
"uniform float uRingThickness;",
"uniform float uCoreRadius;",
"uniform float uPixelRatio;",
"varying float vKind;",
"varying float vBright;",
"const float TAU = 6.28318530718;",
"float hash11(float n) { return fract(sin(n * 78.233) * 43758.5453); }",
"void main() {",
"  vec3 modelPos;",
"  float bright = 1.0;",
"  if (aKind < 0.5) {",
"    float y = 1.0 - aAlong * 2.0;",
"    float ringRadius = sqrt(max(0.0, 1.0 - y * y));",
"    float theta = aAlong * 2399.96;",
"    modelPos = vec3(cos(theta) * ringRadius, y, sin(theta) * ringRadius) * uCoreRadius;",
"    modelPos *= 1.0 + (hash11(aSeed * 91.7) - 0.5) * 0.012;",
"    bright = 0.55 + hash11(aSeed * 13.1) * 0.6;",
"  } else {",
"    float orbitRadius = aRadius;",
"    float rate = uOrbitRate / pow(max(orbitRadius, 0.2), 1.5);",
"    float theta = aSeed * TAU + uTime * rate;",
"    float lift = (hash11(aSeed * 37.9) - 0.5) * 2.0 * uRingThickness;",
"    modelPos = vec3(cos(theta) * orbitRadius, lift, sin(theta) * orbitRadius);",
"    float lane = hash11(floor(orbitRadius * 46.0));",
"    bright = (0.35 + lane * 0.95) * (0.6 + hash11(aSeed * 5.3) * 0.7);",
"  }",
"  vec4 viewPos = modelViewMatrix * vec4(modelPos, 1.0);",
"  vec3 modelCentre = modelViewMatrix[3].xyz;",
"  vec3 fromCamera = viewPos.xyz;",
"  float rayLength = max(length(fromCamera), 1e-5);",
"  vec3 rayDir = fromCamera / rayLength;",
"  float alongRay = dot(modelCentre, rayDir);",
"  float offAxis = length(modelCentre - rayDir * alongRay);",
"  bool occluded;",
"  if (aKind < 0.5) {",
"    occluded = dot(viewPos.xyz - modelCentre, rayDir) > 0.0;",
"  } else {",
"    float inside = uCoreRadius * uCoreRadius - offAxis * offAxis;",
"    float nearHit = alongRay - sqrt(max(inside, 0.0));",
"    occluded = inside > 0.0 && rayLength > nearHit;",
"  }",
"  if (occluded) {",
"    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);",
"    gl_PointSize = 0.0;",
"    vKind = aKind;",
"    vBright = 0.0;",
"    return;",
"  }",
"  gl_Position = projectionMatrix * viewPos;",
"  gl_PointSize = uMoteSize * uPixelRatio * (9.0 / max(0.001, -viewPos.z));",
"  vKind = aKind;",
"  vBright = bright;",
"}"
].join("\n");
var SATURN_FRAGMENT = [
"precision highp float;",
"uniform vec3 uCoreColor;",
"uniform vec3 uRingColor;",
"uniform float uGlow;",
"varying float vKind;",
"varying float vBright;",
"void main() {",
"  float d = length(gl_PointCoord - 0.5) * 2.0;",
"  if (d > 1.0) discard;",
"  float fall = 1.0 - d;",
"  float shape = pow(fall, 5.0) + pow(fall, 1.6) * 0.3;",
"  vec3 col = vKind < 0.5 ? uCoreColor : uRingColor;",
"  float a = shape * vBright * (0.35 + uGlow);",
"  gl_FragColor = vec4(col * a, a);",
"}"
].join("\n");
function SaturnScene(THREE, host, cfg) {
this.THREE = THREE;
this.host = host;
this.cfg = cfg;
var S = settingsFor(cfg);
this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
var dpr = Math.min(window.devicePixelRatio || 1, 2);
this.renderer.setPixelRatio(dpr);
this.renderer.outputColorSpace = THREE.SRGBColorSpace;
this.renderer.setClearColor(0x000000, 0);
var el = this.renderer.domElement;
el.style.position = "absolute";
el.style.inset = "0";
el.style.width = "100%";
el.style.height = "100%";
el.style.cursor = "grab";
el.style.touchAction = "none";
host.appendChild(el);
this.material = new THREE.ShaderMaterial({
vertexShader: SATURN_VERTEX,
fragmentShader: SATURN_FRAGMENT,
uniforms: {
uTime: { value: 0 },
uMoteSize: { value: S.moteSize },
uOrbitRate: { value: S.orbitRate },
uRingThickness: { value: S.ringThickness },
uCoreRadius: { value: CORE_RADIUS },
uPixelRatio: { value: dpr },
uCoreColor: { value: new THREE.Color(cfg.coreColor) },
uRingColor: { value: new THREE.Color(cfg.ringColor) },
uGlow: { value: S.glow }
},
transparent: true,
blending: THREE.AdditiveBlending,
depthWrite: false,
depthTest: false
});
this.scene = new THREE.Scene();
this.camera = new THREE.PerspectiveCamera(30, 1, 0.1, 2000);
this.group = new THREE.Group();
this.geometry = buildCloud(THREE, S);
this.cloud = new THREE.Points(this.geometry, this.material);
this.cloud.frustumCulled = false;
this.group.add(this.cloud);
this.group.rotation.order = "ZXY";
this.scene.add(this.group);
this.time = 0;
this.spinAngle = 0;
this.dragYaw = 0;
this.dragPitch = 0;
this.velocityYaw = 0;
this.velocityPitch = 0;
this.isDragging = false;
this.lastX = 0;
this.lastY = 0;
this.width = 0;
this.height = 0;
this.frameId = 0;
this.lastT = 0;
this.disposed = false;
this.paused = false;
this.bindEvents();
}
SaturnScene.prototype.bindEvents = function () {
var self = this;
var el = this.renderer.domElement;
this.onDown = function (e) {
self.isDragging = true;
self.lastX = e.clientX;
self.lastY = e.clientY;
self.velocityYaw = 0;
self.velocityPitch = 0;
el.style.cursor = "grabbing";
};
this.onMove = function (e) {
if (!self.isDragging) return;
var dx = e.clientX - self.lastX;
var dy = e.clientY - self.lastY;
self.lastX = e.clientX;
self.lastY = e.clientY;
var s = clamp(self.cfg.dragSensitivity, 0, 10, 3) * 0.007;
self.dragYaw += dx * s;
self.dragPitch += dy * s;
self.velocityYaw = dx * s;
self.velocityPitch = dy * s;
};
this.onUp = function () {
self.isDragging = false;
el.style.cursor = "grab";
};
el.addEventListener("pointerdown", this.onDown);
window.addEventListener("pointermove", this.onMove);
window.addEventListener("pointerup", this.onUp);
window.addEventListener("pointercancel", this.onUp);
};
SaturnScene.prototype.setSize = function (width, height) {
if (this.disposed || width <= 0 || height <= 0) return;
this.width = width;
this.height = height;
this.renderer.setSize(width, height, false);
this.updateCamera();
};
SaturnScene.prototype.updateCamera = function () {
var w = Math.max(1, this.width);
var h = Math.max(1, this.height);
var aspect = w / h;
var distance = 1 / PERSPECTIVE;
var sizePct = clamp(this.cfg.sizePercent, 20, 200, 90);
var span = VIEW_SPAN * (100 / sizePct);
var visibleHeight = aspect < 1 ? span / aspect : span;
this.camera.aspect = aspect;
this.camera.position.set(0, 0, distance);
this.camera.lookAt(0, 0, 0);
this.camera.fov = (2 * Math.atan(visibleHeight / 2 / distance) * 180) / Math.PI;
this.camera.near = Math.max(0.1, distance - 20);
this.camera.far = distance + 20;
this.camera.updateProjectionMatrix();
};
SaturnScene.prototype.start = function () {
var self = this;
this.lastT = performance.now();
function loop() {
self.frameId = requestAnimationFrame(loop);
self.step();
}
loop();
};
SaturnScene.prototype.step = function () {
if (this.disposed || this.paused) return;
var now = performance.now();
var dt = (now - this.lastT) / 1000;
this.lastT = now;
if (!isFinite(dt) || dt < 0) dt = 0;
if (dt > 0.05) dt = 0.05;
var S = settingsFor(this.cfg);
this.time += dt;
if (!this.isDragging) {
var decay = Math.exp(-dt * 3);
this.dragYaw += this.velocityYaw;
this.dragPitch += this.velocityPitch;
this.velocityYaw *= decay;
this.velocityPitch *= decay;
this.spinAngle += S.spinRate * dt;
}
var pitch = Math.max(-1.2, Math.min(1.2, this.dragPitch));
this.group.rotation.set(S.tiltRadians + pitch, this.dragYaw + this.spinAngle, S.rollRadians);
this.material.uniforms.uTime.value = this.time;
this.renderer.render(this.scene, this.camera);
};
SaturnScene.prototype.dispose = function () {
this.disposed = true;
cancelAnimationFrame(this.frameId);
var el = this.renderer.domElement;
el.removeEventListener("pointerdown", this.onDown);
window.removeEventListener("pointermove", this.onMove);
window.removeEventListener("pointerup", this.onUp);
window.removeEventListener("pointercancel", this.onUp);
this.geometry.dispose();
this.material.dispose();
this.renderer.dispose();
if (el.parentNode === this.host) this.host.removeChild(el);
};
function ensureContainer() {
if (container) return container;
container = document.createElement("div");
container.className = "fx-bg-canvas";
container.id = "fxSaturnContainer";
container.setAttribute("aria-hidden", "true");
document.body.insertBefore(container, document.body.firstChild);
return container;
}
function currentLevel() {
return window.Game && window.Game.derive ? window.Game.derive().level : 1;
}
function isUnlocked() {
return currentLevel() >= UNLOCK_LEVEL;
}
function allowed() {
var animOk = !window.Store || window.Store.state.settings.animations !== false;
var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
return animOk && !reduced;
}
function updateRow() {
var cb = document.getElementById("fxSaturnCheck");
if (!cb) return;
cb.disabled = !isUnlocked();
cb.checked = isRunning;
var hint = document.getElementById("fxSaturnHint");
if (hint) {
hint.textContent = isUnlocked() ? "" : L(" (قفل — سطح ۲)", " (locked — level 2)");
}
}
function start() {
if (isRunning || isStarting || !isUnlocked() || !allowed()) return;
isStarting = true;
ensureContainer();
if (window.AnimatedBg && window.AnimatedBg.stop) window.AnimatedBg.stop();
if (window.WaveBg && window.WaveBg.deactivate) window.WaveBg.deactivate();
if (!threePromise) {
threePromise = import(THREE_URL).catch(function () {
threePromise = null;
return null;
});
}
threePromise.then(function (THREE) {
isStarting = false;
if (!THREE || isRunning) return;
try {
scene = new SaturnScene(THREE, container, PRESET);
} catch (error) {
return;
}
scene.setSize(container.clientWidth, container.clientHeight);
scene.start();
isRunning = true;
container.classList.add("fx-bg-active");
document.body.classList.add("fx-bg-active");
try {
localStorage.setItem(STORAGE_KEY, ID);
} catch (e) {}
updateRow();
});
}
function stop() {
if (scene) {
scene.dispose();
scene = null;
}
isRunning = false;
isStarting = false;
if (container) container.classList.remove("fx-bg-active");
document.body.classList.remove("fx-bg-active");
try {
localStorage.removeItem(STORAGE_KEY);
} catch (e) {}
updateRow();
}
function injectIntoToolsModal(content) {
if (!content || content.querySelector("#fxSaturnCheck")) return;
var wrap = document.createElement("div");
wrap.className = "modal-item";
wrap.innerHTML =
'<div class="item-left"><label for="fxSaturnCheck" style="cursor:pointer">' +
L("پس‌زمینهٔ سیاره ذره‌ای", "Particle Saturn background") +
'<span id="fxSaturnHint" style="color:var(--warning);font-size:11px;font-weight:800"></span>' +
"</label></div>" +
'<input type="checkbox" id="fxSaturnCheck" style="width:22px;height:22px;accent-color:var(--accent);cursor:pointer">';
var firstSection = content.querySelector(".modal-section-title");
if (firstSection && firstSection.parentNode) {
firstSection.parentNode.insertBefore(wrap, firstSection);
} else {
content.insertBefore(wrap, content.firstChild);
}
var cb = wrap.querySelector("#fxSaturnCheck");
if (cb) {
cb.addEventListener("change", function () {
if (cb.checked) start();
else stop();
});
}
updateRow();
if (!window.Game) {
window.Utils.onIdle(updateRow);
}
}
function init() {
document.addEventListener("visibilitychange", function () {
if (!scene) return;
scene.paused = document.hidden;
if (!document.hidden) scene.lastT = performance.now();
});
window.addEventListener("resize", function () {
if (scene && container) {
scene.setSize(container.clientWidth, container.clientHeight);
}
}, { passive: true });
var saved = null;
try {
saved = localStorage.getItem(STORAGE_KEY);
} catch (e) {}
if (saved === ID) {
window.Utils.onIdle(function () {
if (isUnlocked() && allowed()) start();
else {
try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
}
});
}
}
window.FxSaturnBg = {
id: ID,
unlockLevel: UNLOCK_LEVEL,
start: start,
stop: stop,
isActive: function () { return isRunning; },
injectIntoToolsModal: injectIntoToolsModal
};
if (document.readyState === "loading") {
document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
init();
}
})();
