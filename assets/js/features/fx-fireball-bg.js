/* ================================================================
ROUTINE — FEATURES / FX-FIREBALL-BG.JS
Reward background (level 3+): toon fireball with bloom.
Vanilla port (pure WebGL, no three.js) of the Originkit
"Toon fireball" component supplied by the user.
Original attribution kept — verify Originkit license before shipping.
================================================================ */
(function () {
"use strict";
var STORAGE_KEY = "pd_fx_bg";
var ID = "fireball";
var UNLOCK_LEVEL = 3;
var TEX_PERLIN =
"data:image/svg+xml;charset=utf-8," +
encodeURIComponent(
'<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="4" seed="11"/><feColorMatrix type="saturate" values="0"/></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>'
);
var TEX_SPARK =
"data:image/svg+xml;charset=utf-8," +
encodeURIComponent(
'<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".09" numOctaves="2" seed="23"/><feColorMatrix type="saturate" values="0"/></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>'
);
var TEX_WATER =
"data:image/svg+xml;charset=utf-8," +
encodeURIComponent(
'<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".025 .07" numOctaves="3" seed="37"/><feColorMatrix type="saturate" values="0"/></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>'
);
var REF_EYE = [3.4369982203815655, 3.5239085092722098, 2.994862383531814];
var REF_DIST = Math.hypot(REF_EYE[0], REF_EYE[1], REF_EYE[2]);
var SCENE_SCALE = 6 / REF_DIST;
var FOV = 75;
var NEAR = 0.1;
var FAR = 1000;
var BLOOM_THRESHOLD = 0;
var BLOOM_SMOOTH_WIDTH = 0.01;
var BLOOM_KERNELS = [3, 5, 7, 9, 11];
var BLOOM_FACTORS = [1.0, 0.8, 0.6, 0.4, 0.2];
var MAX_DPR = 2;
var ZOOM_STEP = 0.95;
var MIN_DISTANCE = 1.5;
var MAX_DISTANCE = 60;
var QUAD_VERT = [
"attribute vec2 aPos;",
"varying vec2 vUv;",
"void main() {",
"  vUv = aPos * 0.5 + 0.5;",
"  gl_Position = vec4(aPos, 0.0, 1.0);",
"}"
].join("\n");
var BALL_VERT = [
"attribute vec3 position;",
"attribute vec2 uv;",
"uniform mat4 projectionMatrix;",
"uniform mat4 modelViewMatrix;",
"varying vec2 vUv;",
"void main() {",
"  vUv = uv;",
"  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",
"}"
].join("\n");
var BALL_FRAG = [
"precision highp float;",
"varying vec2 vUv;",
"uniform sampler2D perlinnoise;",
"uniform sampler2D sparknoise;",
"uniform float time;",
"uniform vec3 color0;",
"uniform vec3 color1;",
"uniform vec3 color2;",
"uniform vec3 color5;",
"float setOpacity(float r, float g, float b, float tonethreshold) {",
"  float tone = (r + g + b) / 3.0;",
"  float alpha = 1.0;",
"  if (tone < tonethreshold) { alpha = 0.0; }",
"  return alpha;",
"}",
"vec3 rgbcol(vec3 col) { return col / 255.0; }",
"vec2 UnityPolarCoordinates(vec2 UV, vec2 Center, float RadialScale, float LengthScale) {",
"  vec2 delta = UV - Center;",
"  float radius = length(delta) * 2.0 * RadialScale;",
"  float angle = atan(delta.x, delta.y) * 1.0 / 6.28 * LengthScale;",
"  return vec2(radius, angle);",
"}",
"void main() {",
"  float pct = distance(vUv, vec2(0.5));",
"  vec3 c0 = rgbcol(color0);",
"  vec3 c1 = rgbcol(color1);",
"  vec3 c2 = rgbcol(color2);",
"  vec3 c5 = rgbcol(color5);",
"  float y = smoothstep(0.16, 0.525, pct);",
"  gl_FragColor = vec4(mix(c0, c5, y), 1.0);",
"  vec2 cor = UnityPolarCoordinates(vUv, vec2(0.5), 1.0, 1.0);",
"  vec2 newUv = vec2(cor.x + time, cor.x * 0.2 + cor.y);",
"  vec3 n1 = texture2D(perlinnoise, mod(newUv, 1.0)).rgb;",
"  vec3 n2 = texture2D(sparknoise, mod(newUv, 1.0)).rgb;",
"  float tone0 = 1.0 - smoothstep(0.3, 0.6, n1.r);",
"  float tone1 = smoothstep(0.3, 0.6, n2.r);",
"  float o0 = setOpacity(tone0, tone0, tone0, 0.29);",
"  float o1 = setOpacity(tone1, tone1, tone1, 0.49);",
"  if (o1 > 0.0) { gl_FragColor = vec4(c2, 0.0) * vec4(o1); }",
"  else if (o0 > 0.0) { gl_FragColor = vec4(c1, 0.0) * vec4(o0); }",
"}"
].join("\n");
var STEAM_VERT = [
"attribute vec3 position;",
"attribute vec2 uv;",
"uniform mat4 projectionMatrix;",
"uniform mat4 modelViewMatrix;",
"varying vec2 vUv;",
"void main() {",
"  vUv = uv;",
"  vec3 pos = position;",
"  if (pos.y >= 1.87) {",
"    pos = vec3(position.x * (sin((position.y - 0.6) * 1.27) - 0.16), position.y, position.z * (sin((position.y - 0.6) * 1.27) - 0.16));",
"  } else {",
"    pos = vec3(position.x * (sin((position.y / 2.0 - 0.01) * 0.11) + 0.75), position.y, position.z * (sin((position.y / 2.0 - 0.01) * 0.11) + 0.75));",
"  }",
"  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);",
"}"
].join("\n");
var STEAM_FRAG = [
"precision highp float;",
"varying vec2 vUv;",
"uniform sampler2D perlinnoise;",
"uniform vec3 color4;",
"uniform float time;",
"vec3 rgbcol(vec3 col) { return col / 255.0; }",
"void main() {",
"  vec3 n = texture2D(perlinnoise, mod(vec2(vUv.y - time * 2.0, vUv.x + time * 1.0), 1.0)).rgb;",
"  gl_FragColor = vec4(n.r);",
"  if (gl_FragColor.r >= 0.5) { gl_FragColor = vec4(rgbcol(color4), gl_FragColor.r); }",
"  else { gl_FragColor = vec4(0.0); }",
"  gl_FragColor *= vec4(sin(vUv.y) - 0.1);",
"  gl_FragColor *= vec4(smoothstep(0.3, 0.628, vUv.y));",
"}"
].join("\n");
var FLAME_VERT = [
"attribute vec3 position;",
"attribute vec2 uv;",
"uniform mat4 projectionMatrix;",
"uniform mat4 modelViewMatrix;",
"uniform sampler2D noise;",
"uniform float time;",
"varying vec2 vUv;",
"void main() {",
"  vUv = uv;",
"  vec3 pos = position;",
"  vec3 n = texture2D(noise, mod(vec2(vUv.y - time * 2.0, vUv.x + time * 1.0), 1.0)).rgb;",
"  if (pos.y >= 1.87) {",
"    pos = vec3(position.x * (sin((position.y - 0.64) * 1.27) - 0.12), position.y, position.z * (sin((position.y - 0.64) * 1.27) - 0.12));",
"  } else {",
"    pos = vec3(position.x * (sin((position.y / 2.0 - 0.01) * 0.11) + 0.79), position.y, position.z * (sin((position.y / 2.0 - 0.01) * 0.11) + 0.79));",
"  }",
"  pos.xz *= n.r;",
"  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);",
"}"
].join("\n");
var FLAME_FRAG = [
"precision highp float;",
"varying vec2 vUv;",
"uniform sampler2D noise;",
"uniform vec3 color4;",
"uniform float time;",
"vec3 rgbcol(vec3 col) { return col / 255.0; }",
"void main() {",
"  vec3 n = texture2D(noise, mod(vec2(vUv.y - time * 2.0, vUv.x + time * 1.0), 1.0)).rgb;",
"  gl_FragColor = vec4(n.r);",
"  if (gl_FragColor.r >= 0.44) { gl_FragColor = vec4(rgbcol(color4), gl_FragColor.r); }",
"  else { gl_FragColor = vec4(0.0); }",
"  gl_FragColor *= vec4(smoothstep(0.2, 0.628, vUv.y));",
"}"
].join("\n");
var HIGHPASS_FRAG = [
"precision highp float;",
"uniform sampler2D tDiffuse;",
"uniform vec3 defaultColor;",
"uniform float defaultOpacity;",
"uniform float luminosityThreshold;",
"uniform float smoothWidth;",
"varying vec2 vUv;",
"void main() {",
"  vec4 texel = texture2D(tDiffuse, vUv);",
"  vec3 luma = vec3(0.299, 0.587, 0.114);",
"  float v = dot(texel.xyz, luma);",
"  vec4 outColor = vec4(defaultColor.rgb, defaultOpacity);",
"  float alpha = smoothstep(luminosityThreshold, luminosityThreshold + smoothWidth, v);",
"  gl_FragColor = mix(outColor, texel, alpha);",
"}"
].join("\n");
function blurFrag(radius) {
return [
"precision highp float;",
"varying vec2 vUv;",
"uniform sampler2D colorTexture;",
"uniform vec2 texSize;",
"uniform vec2 direction;",
"#define KERNEL_RADIUS " + radius,
"#define SIGMA " + radius + ".0",
"float gaussianPdf(in float x, in float sigma) {",
"  return 0.39894 * exp(-0.5 * x * x / (sigma * sigma)) / sigma;",
"}",
"void main() {",
"  vec2 invSize = 1.0 / texSize;",
"  float fSigma = SIGMA;",
"  float weightSum = gaussianPdf(0.0, fSigma);",
"  vec3 diffuseSum = texture2D(colorTexture, vUv).rgb * weightSum;",
"  for (int i = 1; i < KERNEL_RADIUS; i++) {",
"    float x = float(i);",
"    float w = gaussianPdf(x, fSigma);",
"    vec2 uvOffset = direction * invSize * x;",
"    vec3 s1 = texture2D(colorTexture, vUv + uvOffset).rgb;",
"    vec3 s2 = texture2D(colorTexture, vUv - uvOffset).rgb;",
"    diffuseSum += (s1 + s2) * w;",
"    weightSum += 2.0 * w;",
"  }",
"  gl_FragColor = vec4(diffuseSum / weightSum, 1.0);",
"}"
].join("\n");
}
var COMPOSITE_FRAG = [
"precision highp float;",
"varying vec2 vUv;",
"uniform sampler2D blurTexture1;",
"uniform sampler2D blurTexture2;",
"uniform sampler2D blurTexture3;",
"uniform sampler2D blurTexture4;",
"uniform sampler2D blurTexture5;",
"uniform float bloomStrength;",
"uniform float bloomRadius;",
"uniform float bloomFactors[5];",
"float lerpBloomFactor(const in float factor) {",
"  float mirrorFactor = 1.2 - factor;",
"  return mix(factor, mirrorFactor, bloomRadius);",
"}",
"void main() {",
"  vec4 sum = bloomStrength * (",
"    lerpBloomFactor(bloomFactors[0]) * texture2D(blurTexture1, vUv) +",
"    lerpBloomFactor(bloomFactors[1]) * texture2D(blurTexture2, vUv) +",
"    lerpBloomFactor(bloomFactors[2]) * texture2D(blurTexture3, vUv) +",
"    lerpBloomFactor(bloomFactors[3]) * texture2D(blurTexture4, vUv) +",
"    lerpBloomFactor(bloomFactors[4]) * texture2D(blurTexture5, vUv)",
"  );",
"  gl_FragColor = vec4(clamp(sum.rgb, 0.0, 1.0), 1.0);",
"}"
].join("\n");
var COPY_FRAG = [
"precision highp float;",
"varying vec2 vUv;",
"uniform sampler2D tDiffuse;",
"void main() {",
"  vec3 rgb = texture2D(tDiffuse, vUv).rgb;",
"  gl_FragColor = vec4(rgb, max(rgb.r, max(rgb.g, rgb.b)));",
"}"
].join("\n");
function sphereGeometry(radius, wSeg, hSeg) {
var pos = [], uv = [], index = [], grid = [], n = 0, iy, ix;
for (iy = 0; iy <= hSeg; iy++) {
var row = [];
var v = iy / hSeg;
var uOffset = iy === 0 ? 0.5 / wSeg : iy === hSeg ? -0.5 / wSeg : 0;
for (ix = 0; ix <= wSeg; ix++) {
var u = ix / wSeg;
pos.push(
-radius * Math.cos(u * Math.PI * 2) * Math.sin(v * Math.PI),
radius * Math.cos(v * Math.PI),
radius * Math.sin(u * Math.PI * 2) * Math.sin(v * Math.PI)
);
uv.push(u + uOffset, 1 - v);
row.push(n++);
}
grid.push(row);
}
for (iy = 0; iy < hSeg; iy++) {
for (ix = 0; ix < wSeg; ix++) {
var a = grid[iy][ix + 1], b = grid[iy][ix], c = grid[iy + 1][ix], d = grid[iy + 1][ix + 1];
if (iy !== 0) index.push(a, b, d);
if (iy !== hSeg - 1) index.push(b, c, d);
}
}
return { pos: new Float32Array(pos), uv: new Float32Array(uv), index: new Uint16Array(index) };
}
function cylinderGeometry(rTop, rBottom, height, radialSeg, heightSeg) {
var pos = [], uv = [], index = [], grid = [], n = 0, half = height / 2, y, x;
for (y = 0; y <= heightSeg; y++) {
var row = [];
var v = y / heightSeg;
var r = v * (rBottom - rTop) + rTop;
for (x = 0; x <= radialSeg; x++) {
var u = x / radialSeg;
var theta = u * Math.PI * 2;
pos.push(r * Math.sin(theta), -v * height + half, r * Math.cos(theta));
uv.push(u, 1 - v);
row.push(n++);
}
grid.push(row);
}
for (x = 0; x < radialSeg; x++) {
for (y = 0; y < heightSeg; y++) {
var a = grid[y][x], b = grid[y + 1][x], c = grid[y + 1][x + 1], d = grid[y][x + 1];
if (rTop > 0 || y !== 0) index.push(a, b, d);
if (rBottom > 0 || y !== heightSeg - 1) index.push(b, c, d);
}
}
return { pos: new Float32Array(pos), uv: new Float32Array(uv), index: new Uint16Array(index) };
}
function perspective(fovDeg, aspect, near, far) {
var f = 1 / Math.tan((fovDeg * Math.PI) / 360);
var nf = 1 / (near - far);
var m = new Float32Array(16);
m[0] = f / aspect; m[5] = f; m[10] = (far + near) * nf; m[11] = -1; m[14] = 2 * far * near * nf;
return m;
}
function lookAt(eye, target, up) {
var zx = eye[0] - target[0], zy = eye[1] - target[1], zz = eye[2] - target[2];
var l = Math.hypot(zx, zy, zz) || 1;
zx /= l; zy /= l; zz /= l;
var xx = up[1] * zz - up[2] * zy;
var xy = up[2] * zx - up[0] * zz;
var xz = up[0] * zy - up[1] * zx;
l = Math.hypot(xx, xy, xz) || 1;
xx /= l; xy /= l; xz /= l;
var yx = zy * xz - zz * xy;
var yy = zz * xx - zx * xz;
var yz = zx * xy - zy * xx;
var m = new Float32Array(16);
m[0] = xx; m[4] = xy; m[8] = xz;
m[1] = yx; m[5] = yy; m[9] = yz;
m[2] = zx; m[6] = zy; m[10] = zz;
m[12] = -(xx * eye[0] + xy * eye[1] + xz * eye[2]);
m[13] = -(yx * eye[0] + yy * eye[1] + yz * eye[2]);
m[14] = -(zx * eye[0] + zy * eye[1] + zz * eye[2]);
m[15] = 1;
return m;
}
function compose(out, tx, ty, tz, roll, sx, sy, sz) {
var c = Math.cos(roll), s = Math.sin(roll);
out[0] = c * sx; out[1] = s * sx; out[2] = 0; out[3] = 0;
out[4] = -s * sy; out[5] = c * sy; out[6] = 0; out[7] = 0;
out[8] = 0; out[9] = 0; out[10] = sz; out[11] = 0;
out[12] = tx; out[13] = ty; out[14] = tz; out[15] = 1;
return out;
}
function multiply(out, a, b) {
for (var c = 0; c < 4; c++) {
var b0 = b[c * 4], b1 = b[c * 4 + 1], b2 = b[c * 4 + 2], b3 = b[c * 4 + 3];
out[c * 4] = a[0] * b0 + a[4] * b1 + a[8] * b2 + a[12] * b3;
out[c * 4 + 1] = a[1] * b0 + a[5] * b1 + a[9] * b2 + a[13] * b3;
out[c * 4 + 2] = a[2] * b0 + a[6] * b1 + a[10] * b2 + a[14] * b3;
out[c * 4 + 3] = a[3] * b0 + a[7] * b1 + a[11] * b2 + a[15] * b3;
}
return out;
}
function parseColor(input) {
if (!input) return [0, 0, 0];
var s = String(input).trim();
var token = s.match(/^var\(\s*--[^,)]+\s*,\s*(.+)\)\s*$/i);
if (token) s = token[1].trim();
var rgb = s.match(/rgba?\(([^)]+)\)/i);
if (rgb) {
var p = rgb[1].split(/[,\s/]+/).filter(Boolean).map(parseFloat);
return [p[0] || 0, p[1] || 0, p[2] || 0];
}
var hsl = s.match(/hsla?\(([^)]+)\)/i);
if (hsl) {
var q = hsl[1].split(/[,\s/]+/).filter(Boolean);
var h = (((parseFloat(q[0]) || 0) % 360) + 360) / 360;
var sat = (parseFloat(q[1]) || 0) / 100;
var li = (parseFloat(q[2]) || 0) / 100;
var qq = li < 0.5 ? li * (1 + sat) : li + sat - li * sat;
var pp = 2 * li - qq;
var chan = function (t) {
if (t < 0) t += 1;
if (t > 1) t -= 1;
if (t < 1 / 6) return pp + (qq - pp) * 6 * t;
if (t < 1 / 2) return qq;
if (t < 2 / 3) return pp + (qq - pp) * (2 / 3 - t) * 6;
return pp;
};
return [chan(h + 1 / 3) * 255, chan(h) * 255, chan(h - 1 / 3) * 255];
}
var hx = s.replace("#", "");
if (hx.length === 3 || hx.length === 4) {
hx = hx.split("").map(function (ch) { return ch + ch; }).join("");
}
hx = (hx + "000000").slice(0, 6);
var v = function (i) {
var n = parseInt(hx.slice(i, i + 2), 16);
return isFinite(n) ? n : 0;
};
return [v(0), v(2), v(4)];
}
function FireballScene(canvas, cfg) {
var gl = canvas.getContext("webgl2", { alpha: true, antialias: false, premultipliedAlpha: true }) ||
canvas.getContext("webgl", { alpha: true, antialias: false, premultipliedAlpha: true });
if (!gl) return null;
var disposed = false;
function compile(type, src) {
var sh = gl.createShader(type);
gl.shaderSource(sh, src);
gl.compileShader(sh);
return sh;
}
function program(vs, fs) {
var p = gl.createProgram();
var v = compile(gl.VERTEX_SHADER, vs);
var f = compile(gl.FRAGMENT_SHADER, fs);
gl.attachShader(p, v);
gl.attachShader(p, f);
gl.linkProgram(p);
gl.deleteShader(v);
gl.deleteShader(f);
return p;
}
function makeRT(w, h) {
var tex = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, tex);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
var fb = gl.createFramebuffer();
gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
return { fb: fb, tex: tex, w: w, h: h };
}
function mkMesh(g) {
var pos = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, pos);
gl.bufferData(gl.ARRAY_BUFFER, g.pos, gl.STATIC_DRAW);
var uv = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, uv);
gl.bufferData(gl.ARRAY_BUFFER, g.uv, gl.STATIC_DRAW);
var idx = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idx);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, g.index, gl.STATIC_DRAW);
return { pos: pos, uv: uv, idx: idx, count: g.index.length };
}
var mBall = mkMesh(sphereGeometry(1, 30, 30));
var mFlame = mkMesh(cylinderGeometry(1, 0, 5.3, 50, 50));
var mSteam = mkMesh(cylinderGeometry(1.11, 0, 5.3, 50, 50));
var quad = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, quad);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
var pBall = program(BALL_VERT, BALL_FRAG);
var pFlame = program(FLAME_VERT, FLAME_FRAG);
var pSteam = program(STEAM_VERT, STEAM_FRAG);
var pHigh = program(QUAD_VERT, HIGHPASS_FRAG);
var pBlur = BLOOM_KERNELS.map(function (k) { return program(QUAD_VERT, blurFrag(k)); });
var pComp = program(QUAD_VERT, COMPOSITE_FRAG);
var pCopy = program(QUAD_VERT, COPY_FRAG);
function loc(p, names) {
var o = {};
for (var i = 0; i < names.length; i++) o[names[i]] = gl.getUniformLocation(p, names[i]);
return o;
}
var uBall = loc(pBall, ["projectionMatrix", "modelViewMatrix", "perlinnoise", "sparknoise", "time", "color0", "color1", "color2", "color5"]);
var uFlame = loc(pFlame, ["projectionMatrix", "modelViewMatrix", "noise", "time", "color4"]);
var uSteam = loc(pSteam, ["projectionMatrix", "modelViewMatrix", "perlinnoise", "time", "color4"]);
var uHigh = loc(pHigh, ["tDiffuse", "defaultColor", "defaultOpacity", "luminosityThreshold", "smoothWidth"]);
var uBlur = pBlur.map(function (p) { return loc(p, ["colorTexture", "texSize", "direction"]); });
var uComp = loc(pComp, ["blurTexture1", "blurTexture2", "blurTexture3", "blurTexture4", "blurTexture5", "bloomStrength", "bloomRadius", "bloomFactors[0]"]);
var uCopy = loc(pCopy, ["tDiffuse"]);
function attrs(p) {
return { position: gl.getAttribLocation(p, "position"), uv: gl.getAttribLocation(p, "uv") };
}
var aBall = attrs(pBall);
var aFlame = attrs(pFlame);
var aSteam = attrs(pSteam);
var aQuadHigh = gl.getAttribLocation(pHigh, "aPos");
var aQuadBlur = pBlur.map(function (p) { return gl.getAttribLocation(p, "aPos"); });
var aQuadComp = gl.getAttribLocation(pComp, "aPos");
var aQuadCopy = gl.getAttribLocation(pCopy, "aPos");
function mkTex(src) {
var tex = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, tex);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([128, 128, 128, 255]));
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
var img = new Image();
img.onload = function () {
if (disposed) return;
gl.bindTexture(gl.TEXTURE_2D, tex);
gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
gl.generateMipmap(gl.TEXTURE_2D);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
};
img.src = src;
return tex;
}
var texPerlin = mkTex(TEX_PERLIN);
var texSpark = mkTex(TEX_SPARK);
var texWater = mkTex(TEX_WATER);
var rtScene = null, rtDepth = null, rtBright = null, rtH = [], rtV = [], blurSize = [];
var vw = 0, vh = 0;
function dropRT(rt) {
if (!rt) return;
gl.deleteFramebuffer(rt.fb);
gl.deleteTexture(rt.tex);
}
function dropAllRTs() {
dropRT(rtScene);
dropRT(rtBright);
rtH.forEach(dropRT);
rtV.forEach(dropRT);
if (rtDepth) gl.deleteRenderbuffer(rtDepth);
rtScene = null; rtBright = null; rtDepth = null;
rtH = []; rtV = []; blurSize = [];
}
function resize() {
var dpr = Math.min(MAX_DPR, window.devicePixelRatio || 1);
var w = Math.max(1, Math.round(canvas.clientWidth * dpr));
var h = Math.max(1, Math.round(canvas.clientHeight * dpr));
if (w === vw && h === vh) return;
vw = w; vh = h;
canvas.width = w;
canvas.height = h;
dropAllRTs();
rtScene = makeRT(w, h);
rtDepth = gl.createRenderbuffer();
gl.bindRenderbuffer(gl.RENDERBUFFER, rtDepth);
gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, w, h);
gl.bindFramebuffer(gl.FRAMEBUFFER, rtScene.fb);
gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, rtDepth);
var rx = Math.round(w / 2), ry = Math.round(h / 2);
rtBright = makeRT(Math.max(1, rx), Math.max(1, ry));
for (var i = 0; i < BLOOM_KERNELS.length; i++) {
rtH.push(makeRT(Math.max(1, rx), Math.max(1, ry)));
rtV.push(makeRT(Math.max(1, rx), Math.max(1, ry)));
blurSize.push([Math.max(1, rx), Math.max(1, ry)]);
rx = Math.round(rx / 2);
ry = Math.round(ry / 2);
}
gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}
var orbit = {
theta: Math.atan2(REF_EYE[0], REF_EYE[2]),
phi: Math.acos(REF_EYE[1] / REF_DIST),
radius: cfg.distance || 7
};
var dragging = false, lastX = 0, lastY = 0;
function onDown(e) {
if (e.button !== 0) return;
dragging = true;
lastX = e.clientX;
lastY = e.clientY;
}
function onMove(e) {
if (!dragging) return;
var h = canvas.clientHeight || 1;
var sens = cfg.dragSensitivity;
orbit.theta -= (2 * Math.PI * (e.clientX - lastX) * sens) / h;
orbit.phi -= (2 * Math.PI * (e.clientY - lastY) * sens) / h;
var EPS = 0.000001;
orbit.phi = Math.max(EPS, Math.min(Math.PI - EPS, orbit.phi));
lastX = e.clientX;
lastY = e.clientY;
}
function onUp() { dragging = false; }
function onWheel(e) {
e.preventDefault();
var base = e.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP;
var s = Math.pow(base, cfg.dragSensitivity);
orbit.radius = Math.max(MIN_DISTANCE, Math.min(MAX_DISTANCE, orbit.radius * s));
}
if (cfg.interaction !== false) {
canvas.addEventListener("pointerdown", onDown);
window.addEventListener("pointermove", onMove);
window.addEventListener("pointerup", onUp);
window.addEventListener("pointercancel", onUp);
canvas.addEventListener("wheel", onWheel, { passive: false });
}
var proj = new Float32Array(16);
var view = new Float32Array(16);
var model = new Float32Array(16);
var mv = new Float32Array(16);
var eye = [0, 0, 0];
function drawMesh(mesh, a) {
gl.bindBuffer(gl.ARRAY_BUFFER, mesh.pos);
gl.enableVertexAttribArray(a.position);
gl.vertexAttribPointer(a.position, 3, gl.FLOAT, false, 0, 0);
gl.bindBuffer(gl.ARRAY_BUFFER, mesh.uv);
gl.enableVertexAttribArray(a.uv);
gl.vertexAttribPointer(a.uv, 2, gl.FLOAT, false, 0, 0);
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.idx);
gl.drawElements(gl.TRIANGLES, mesh.count, gl.UNSIGNED_SHORT, 0);
gl.disableVertexAttribArray(a.position);
gl.disableVertexAttribArray(a.uv);
}
function fullscreen(attr) {
gl.bindBuffer(gl.ARRAY_BUFFER, quad);
gl.enableVertexAttribArray(attr);
gl.vertexAttribPointer(attr, 2, gl.FLOAT, false, 0, 0);
gl.drawArrays(gl.TRIANGLES, 0, 3);
gl.disableVertexAttribArray(attr);
}
var acc = 0, last = 0, raf = 0, paused = false;
function frame(now) {
raf = requestAnimationFrame(frame);
if (paused) return;
var dt = last ? Math.min(50, now - last) : 0;
last = now;
acc += dt * (cfg.speed / 50);
resize();
if (!rtScene || !rtBright) return;
var tBall = -acc / 2000;
var tCone = -acc / 6000;
var sp = Math.sin(orbit.phi);
eye[0] = orbit.radius * sp * Math.sin(orbit.theta);
eye[1] = orbit.radius * Math.cos(orbit.phi);
eye[2] = orbit.radius * sp * Math.cos(orbit.theta);
proj.set(perspective(FOV, vw / vh, NEAR, FAR));
view.set(lookAt(eye, [0, 0, 0], [0, 1, 0]));
gl.bindFramebuffer(gl.FRAMEBUFFER, rtScene.fb);
gl.viewport(0, 0, vw, vh);
gl.clearColor(0, 0, 0, 1);
gl.enable(gl.DEPTH_TEST);
gl.depthMask(true);
gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
gl.disable(gl.BLEND);
gl.enable(gl.CULL_FACE);
gl.cullFace(gl.BACK);
gl.frontFace(gl.CCW);
gl.useProgram(pBall);
compose(model, 1 * SCENE_SCALE, 0, 0, 0, 0.78 * SCENE_SCALE, 0.78 * SCENE_SCALE, 0.78 * SCENE_SCALE);
multiply(mv, view, model);
gl.uniformMatrix4fv(uBall.projectionMatrix, false, proj);
gl.uniformMatrix4fv(uBall.modelViewMatrix, false, mv);
gl.activeTexture(gl.TEXTURE0);
gl.bindTexture(gl.TEXTURE_2D, texPerlin);
gl.uniform1i(uBall.perlinnoise, 0);
gl.activeTexture(gl.TEXTURE1);
gl.bindTexture(gl.TEXTURE_2D, texSpark);
gl.uniform1i(uBall.sparknoise, 1);
gl.uniform1f(uBall.time, tBall);
gl.uniform3fv(uBall.color0, cfg.color0);
gl.uniform3fv(uBall.color1, cfg.color1);
gl.uniform3fv(uBall.color2, cfg.color2);
gl.uniform3fv(uBall.color5, cfg.color5);
drawMesh(mBall, aBall);
gl.disable(gl.CULL_FACE);
gl.depthMask(false);
gl.enable(gl.BLEND);
gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
function coneZ(x) { return view[2] * x + view[14]; }
var flameX = (1 - 4.78) * SCENE_SCALE;
var steamX = (1 - 4.05) * SCENE_SCALE;
function drawFlame() {
gl.useProgram(pFlame);
compose(model, flameX, 0, 0, -Math.PI / 2, 2 * SCENE_SCALE, 2 * SCENE_SCALE, 2 * SCENE_SCALE);
multiply(mv, view, model);
gl.uniformMatrix4fv(uFlame.projectionMatrix, false, proj);
gl.uniformMatrix4fv(uFlame.modelViewMatrix, false, mv);
gl.activeTexture(gl.TEXTURE0);
gl.bindTexture(gl.TEXTURE_2D, texPerlin);
gl.uniform1i(uFlame.noise, 0);
gl.uniform1f(uFlame.time, tCone);
gl.uniform3fv(uFlame.color4, cfg.color5);
drawMesh(mFlame, aFlame);
}
function drawSteam() {
gl.useProgram(pSteam);
compose(model, steamX, 0, 0, -Math.PI / 2, 1.5 * SCENE_SCALE, 1.7 * SCENE_SCALE, 1.5 * SCENE_SCALE);
multiply(mv, view, model);
gl.uniformMatrix4fv(uSteam.projectionMatrix, false, proj);
gl.uniformMatrix4fv(uSteam.modelViewMatrix, false, mv);
gl.activeTexture(gl.TEXTURE0);
gl.bindTexture(gl.TEXTURE_2D, texWater);
gl.uniform1i(uSteam.perlinnoise, 0);
gl.uniform1f(uSteam.time, tCone);
gl.uniform3fv(uSteam.color4, cfg.color4);
drawMesh(mSteam, aSteam);
}
if (coneZ(flameX) <= coneZ(steamX)) { drawFlame(); drawSteam(); }
else { drawSteam(); drawFlame(); }
gl.disable(gl.DEPTH_TEST);
gl.disable(gl.BLEND);
gl.bindFramebuffer(gl.FRAMEBUFFER, rtBright.fb);
gl.viewport(0, 0, rtBright.w, rtBright.h);
gl.useProgram(pHigh);
gl.activeTexture(gl.TEXTURE0);
gl.bindTexture(gl.TEXTURE_2D, rtScene.tex);
gl.uniform1i(uHigh.tDiffuse, 0);
gl.uniform3f(uHigh.defaultColor, 0, 0, 0);
gl.uniform1f(uHigh.defaultOpacity, 0);
gl.uniform1f(uHigh.luminosityThreshold, BLOOM_THRESHOLD);
gl.uniform1f(uHigh.smoothWidth, BLOOM_SMOOTH_WIDTH);
fullscreen(aQuadHigh);
var src = rtBright;
for (var i = 0; i < pBlur.length; i++) {
gl.useProgram(pBlur[i]);
gl.uniform2f(uBlur[i].texSize, blurSize[i][0], blurSize[i][1]);
gl.bindFramebuffer(gl.FRAMEBUFFER, rtH[i].fb);
gl.viewport(0, 0, rtH[i].w, rtH[i].h);
gl.activeTexture(gl.TEXTURE0);
gl.bindTexture(gl.TEXTURE_2D, src.tex);
gl.uniform1i(uBlur[i].colorTexture, 0);
gl.uniform2f(uBlur[i].direction, 1, 0);
fullscreen(aQuadBlur[i]);
gl.bindFramebuffer(gl.FRAMEBUFFER, rtV[i].fb);
gl.viewport(0, 0, rtV[i].w, rtV[i].h);
gl.activeTexture(gl.TEXTURE0);
gl.bindTexture(gl.TEXTURE_2D, rtH[i].tex);
gl.uniform1i(uBlur[i].colorTexture, 0);
gl.uniform2f(uBlur[i].direction, 0, 1);
fullscreen(aQuadBlur[i]);
src = rtV[i];
}
gl.bindFramebuffer(gl.FRAMEBUFFER, rtH[0].fb);
gl.viewport(0, 0, rtH[0].w, rtH[0].h);
gl.useProgram(pComp);
for (var j = 0; j < 5; j++) {
gl.activeTexture(gl.TEXTURE0 + j);
gl.bindTexture(gl.TEXTURE_2D, rtV[j].tex);
gl.uniform1i(uComp["blurTexture" + (j + 1)], j);
}
gl.uniform1f(uComp.bloomStrength, cfg.strength);
gl.uniform1f(uComp.bloomRadius, cfg.radius);
gl.uniform1fv(uComp["bloomFactors[0]"], BLOOM_FACTORS);
fullscreen(aQuadComp);
gl.bindFramebuffer(gl.FRAMEBUFFER, null);
gl.viewport(0, 0, vw, vh);
gl.clearColor(0, 0, 0, 0);
gl.clear(gl.COLOR_BUFFER_BIT);
gl.useProgram(pCopy);
gl.uniform1i(uCopy.tDiffuse, 0);
gl.activeTexture(gl.TEXTURE0);
gl.bindTexture(gl.TEXTURE_2D, rtScene.tex);
fullscreen(aQuadCopy);
gl.enable(gl.BLEND);
gl.blendFunc(gl.ONE, gl.ONE);
gl.bindTexture(gl.TEXTURE_2D, rtH[0].tex);
fullscreen(aQuadCopy);
gl.disable(gl.BLEND);
}
resize();
this.start = function () {
last = 0;
raf = requestAnimationFrame(frame);
};
this.setPaused = function (value) {
paused = !!value;
if (!paused) last = 0;
};
this.resize = resize;
this.dispose = function () {
disposed = true;
cancelAnimationFrame(raf);
if (cfg.interaction !== false) {
canvas.removeEventListener("pointerdown", onDown);
window.removeEventListener("pointermove", onMove);
window.removeEventListener("pointerup", onUp);
window.removeEventListener("pointercancel", onUp);
canvas.removeEventListener("wheel", onWheel);
}
dropAllRTs();
[mBall, mFlame, mSteam].forEach(function (m) {
gl.deleteBuffer(m.pos);
gl.deleteBuffer(m.uv);
gl.deleteBuffer(m.idx);
});
gl.deleteBuffer(quad);
[pBall, pFlame, pSteam, pHigh, pComp, pCopy].concat(pBlur).forEach(function (p) {
gl.deleteProgram(p);
});
gl.deleteTexture(texPerlin);
gl.deleteTexture(texSpark);
gl.deleteTexture(texWater);
};
}
/* ---------- wrapper ---------- */
var container = null;
var scene = null;
var isRunning = false;
var isStarting = false;
var PRESET = {
color0: parseColor("#000000"),
color1: parseColor("#510e05"),
color2: parseColor("#b59c18"),
color4: parseColor("#4f4f4f"),
color5: parseColor("#401b00"),
speed: 100,
strength: 3.5,
radius: 0.39,
distance: 7,
interaction: true,
dragSensitivity: 2
};
function L(fa, en) {
return window.I18N && window.I18N.lang === "en" ? en : fa;
}
function ensureContainer() {
if (container) return container;
container = document.createElement("div");
container.className = "fx-bg-canvas";
container.id = "fxFireballContainer";
container.setAttribute("aria-hidden", "true");
var canvas = document.createElement("canvas");
canvas.style.position = "absolute";
canvas.style.inset = "0";
canvas.style.width = "100%";
canvas.style.height = "100%";
canvas.style.display = "block";
canvas.style.touchAction = "none";
container.appendChild(canvas);
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
var cb = document.getElementById("fxFireballCheck");
if (!cb) return;
cb.disabled = !isUnlocked();
cb.checked = isRunning;
var hint = document.getElementById("fxFireballHint");
if (hint) {
hint.textContent = isUnlocked() ? "" : L(" (قفل — سطح ۳)", " (locked — level 3)");
}
}
function start() {
if (isRunning || isStarting || !isUnlocked() || !allowed()) return;
isStarting = true;
ensureContainer();
if (window.FxSaturnBg && window.FxSaturnBg.isActive && window.FxSaturnBg.isActive()) window.FxSaturnBg.stop();
if (window.AnimatedBg && window.AnimatedBg.stop) window.AnimatedBg.stop();
if (window.WaveBg && window.WaveBg.deactivate) window.WaveBg.deactivate();
var canvas = container.querySelector("canvas");
try {
scene = new FireballScene(canvas, PRESET);
} catch (error) {
scene = null;
}
isStarting = false;
if (!scene) return;
scene.start();
isRunning = true;
container.classList.add("fx-bg-active");
document.body.classList.add("fx-bg-active");
try {
localStorage.setItem(STORAGE_KEY, ID);
} catch (e) {}
updateRow();
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
if (!content || content.querySelector("#fxFireballCheck")) return;
var wrap = document.createElement("div");
wrap.className = "modal-item";
wrap.innerHTML =
'<div class="item-left"><label for="fxFireballCheck" style="cursor:pointer">' +
L("پس‌زمینهٔ گوی آتشین", "Fireball background") +
'<span id="fxFireballHint" style="color:var(--warning);font-size:11px;font-weight:800"></span>' +
"</label></div>" +
'<input type="checkbox" id="fxFireballCheck" style="width:22px;height:22px;accent-color:var(--accent);cursor:pointer">';
var firstSection = content.querySelector(".modal-section-title");
if (firstSection && firstSection.parentNode) {
firstSection.parentNode.insertBefore(wrap, firstSection);
} else {
content.insertBefore(wrap, content.firstChild);
}
var cb = wrap.querySelector("#fxFireballCheck");
if (cb) {
cb.addEventListener("change", function () {
if (cb.checked) start();
else stop();
});
}
updateRow();
if (!window.Game) window.Utils.onIdle(updateRow);
}
function init() {
document.addEventListener("visibilitychange", function () {
if (!scene) return;
scene.setPaused(document.hidden);
});
window.addEventListener("resize", function () {
if (scene) scene.resize();
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
window.FxFireballBg = {
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
