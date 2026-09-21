/* ================================================================
ROUTINE — UI / ICONS.JS
Single SVG icon registry (stroke style, 24px grid).
Usage:
  Icons.svg(name, size)        -> svg markup string
  Icons.path(name)             -> raw path markup (for canvas Path2D)
  Icons.hydrate(root)          -> fills every [data-icon] element
================================================================ */
(function () {
"use strict";
var ICONS = {
home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M9 21v-6h6v6"/>',
check: '<path d="m4.5 12.5 5 5 10-11"/>',
checkSquare: '<rect x="3.5" y="3.5" width="17" height="17" rx="4"/><path d="m8 12.5 3 3 5.5-6"/>',
flame: '<path d="M12 3c2.5 3 6 5.6 6 9.5A6 6 0 0 1 6 12.5C6 8.6 9.5 6 12 3Z"/><path d="M12 21a3 3 0 0 1-3-3c0-1.6 1.2-2.8 3-4.5 1.8 1.7 3 2.9 3 4.5a3 3 0 0 1-3 3Z"/>',
calendar: '<rect x="3.5" y="5" width="17" height="16" rx="3"/><path d="M8 3v4M16 3v4M3.5 10h17"/>',
calMonth: '<rect x="3.5" y="5" width="17" height="16" rx="3"/><path d="M8 3v4M16 3v4M3.5 10h17"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 17.5h.01M12 17.5h.01"/>',
chart: '<path d="M5 20v-7M10 20V6M15 20v-10M20 20v-4"/><path d="M3 20h18"/>',
moon: '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z"/>',
sun: '<circle cx="12" cy="12" r="4.1"/><path d="M12 2.9v2M12 19.1v2M2.9 12h2M19.1 12h2M5.6 5.6 7 7M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4"/>',
gear: '<path d="M12 8.8a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4Z"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.55-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34h.01a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55h.01a1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87v.01a1.7 1.7 0 0 0 1.55 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.55 1Z"/>',
user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5"/>',
plus: '<path d="M12 5v14M5 12h14"/>',
search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/>',
edit: '<path d="M4.4 19.6h4L19.9 8.1a2.2 2.2 0 0 0-3.2-3.1L5.2 16.4Z"/><path d="m14.6 6.5 3.2 3.2"/>',
copy: '<rect x="9" y="9" width="12" height="12" rx="2.5"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
download: '<path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>',
upload: '<path d="M12 21V9M7 14l5-5 5 5M4 3h16"/>',
share: '<circle cx="6" cy="12" r="2.5"/><circle cx="17" cy="6" r="2.5"/><circle cx="17" cy="18" r="2.5"/><path d="m8.3 10.8 6.4-3.6M8.3 13.2l6.4 3.6"/>',
timer: '<circle cx="12" cy="13.5" r="7.5"/><path d="M12 10v4l2.5 2.5M9 2.5h6M12 2.5v3.5"/>',
note: '<path d="M6 2.5h9l4 4V21.5H6Z"/><path d="M14.5 2.5v4.5h4.5M9 12h7M9 16h5"/>',
award: '<circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>',
trophy: '<path d="M8 21h8M12 17v4M7 4h10v6a5 5 0 0 1-10 0Z"/><path d="M7 6H4a2 2 0 0 0 2 4h1M17 6h3a2 2 0 0 1-2 4h-1"/>',
lock: '<rect x="4.5" y="10.5" width="15" height="10.5" rx="3"/><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5"/>',
gift: '<path d="M20 12v10H4V12"/><rect x="2" y="7" width="20" height="5"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7Z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7Z"/>',
book: '<path d="M4.6 5A2 2 0 0 1 6.6 3H19.4v13.4H6.6a2 2 0 0 0-2 2Z"/><path d="M4.6 18.4a2 2 0 0 0 2 2h12.8"/><path d="M8.4 7.4h7"/><path d="M8.4 10.6h4.6"/>',
sparkle: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9Z"/><path d="m18.5 15.5.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8Z"/>',
bell: '<path d="M6 9a6 6 0 0 1 12 0c0 5 2 6.5 2 6.5H4S6 14 6 9Z"/><path d="M10 19.5a2.2 2.2 0 0 0 4 0"/>',
globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z"/>',
help: '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.2a2.5 2.5 0 0 1 4.9.6c0 1.6-2.4 2.1-2.4 3.4M12 17h.01"/>',
close: '<path d="M6 6l12 12M18 6 6 18"/>',
chevronLeft: '<path d="m14 6-6 6 6 6"/>',
chevronDown: '<path d="m6 9 6 6 6-6"/>',
heart: '<path d="M12 20.1s-7.6-4.5-7.6-9.6a4.3 4.3 0 0 1 7.6-2.8 4.3 4.3 0 0 1 7.6 2.8c0 5.1-7.6 9.6-7.6 9.6Z"/>',
flower: '<circle cx="12" cy="12" r="2.4"/><path d="M12 9.6c-2.2-2.2-2.2-5 0-7.2 2.2 2.2 2.2 5 0 7.2Z"/><path d="M14.4 12c2.2-2.2 5-2.2 7.2 0-2.2 2.2-5 2.2-7.2 0Z"/><path d="M12 14.4c2.2 2.2 2.2 5 0 7.2-2.2-2.2-2.2-5 0-7.2Z"/><path d="M9.6 12c-2.2 2.2-5 2.2-7.2 0 2.2-2.2 5-2.2 7.2 0Z"/>',
keyboard: '<rect x="2.5" y="6" width="19" height="12" rx="2.5"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M6 14h.01M18 14h.01M9 14h6"/>',
square: '<rect x="4" y="4" width="16" height="16" rx="4"/>',
info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
chevronRight: '<path d="m10 6 6 6-6 6"/>',
print: '<path d="M7 8V3h10v5"/><rect x="4" y="8" width="16" height="8" rx="2"/><path d="M7 14h10v7H7Z"/>',
qr: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><path d="M13.5 13.5h3v3h-3ZM18 18h2.5v2.5H18Z"/>',
wave: '<path d="M3 8c3-3 6 3 9 0s6-3 9 0M3 13c3-3 6 3 9 0s6-3 9 0M3 18c3-3 6 3 9 0s6-3 9 0"/>',
grid: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
dots: '<circle cx="6" cy="6" r="1.6"/><circle cx="12" cy="6" r="1.6"/><circle cx="18" cy="6" r="1.6"/><circle cx="6" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="18" cy="12" r="1.6"/><circle cx="6" cy="18" r="1.6"/><circle cx="12" cy="18" r="1.6"/><circle cx="18" cy="18" r="1.6"/>',
phone: '<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/>',
pause: '<path d="M9 5v14M15 5v14"/>',
play: '<path d="M8 5.5v13l10-6.5Z"/>',
reset: '<path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5"/>',
sliders: '<path d="M5 21v-7M5 10V3M12 21v-9M12 8V3M19 21v-5M19 12V3"/><path d="M2.5 14h5M9.5 8h5M16.5 16h5"/>',
folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2.5h8A2 2 0 0 1 21 9.5V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/>',
tag: '<path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9Z"/><path d="M7.5 7.5h.01"/>',
repeat: '<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>',
clip: '<path d="M9 6h11M9 12h11M9 18h11"/><path d="M4 6h.01M4 12h.01M4 18h.01"/>',
trendUp: '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>',
trendDown: '<polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/>',
warn: '<path d="M12 3 2.5 20h19Z"/><path d="M12 9.5V14M12 17h.01"/>',
bulb: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 1 4 10.5c-.8.7-1 1.6-1 2.5h-6c0-.9-.2-1.8-1-2.5A6 6 0 0 1 12 3Z"/>',
gem: '<path d="M6 3h12l4 6-10 12L2 9Z"/><path d="M2 9h20M9 3l3 6 3-6"/>',
crown: '<path d="M3 8l4.5 4L12 5l4.5 7L21 8l-1.5 11h-15Z"/>',
leaf: '<path d="M4 20c0-9 5-14 16-16-1 11-6 16-13 16"/><path d="M4 20c2-5 6-9 11-11"/>',
coffee: '<path d="M4.6 8.4h12v5.8a4.4 4.4 0 0 1-4.4 4.4H9a4.4 4.4 0 0 1-4.4-4.4Z"/><path d="M16.6 10.1h1.5a2.4 2.4 0 0 1 0 4.8h-1.5"/><path d="M7.6 3.4v2.2M11 3.4v2.2M14.4 3.4v2.2"/><path d="M3.4 21h14.4"/>',
target: '<circle cx="12" cy="12" r="8.4"/><circle cx="12" cy="12" r="4.6"/><circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none"/>',
star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
zap: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
shield: '<path d="M12 2.5 4.5 5.5v6c0 5 3.2 8.4 7.5 10 4.3-1.6 7.5-5 7.5-10v-6Z"/>',
inbox: '<path d="M3 12 5.5 4h13L21 12v7H3Z"/><path d="M3 12h5l1.5 2.5h5L16 12h5"/>',
save: '<path d="M5 3h11l5 5v13H5Z"/><path d="M8 3v5h7V3M8 21v-7h8v7"/>'
};
function svg(name, size) {
size = Number(size) || 18;
var body = ICONS[name] || ICONS.sparkle;
return (
'<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
body +
"</svg>"
);
}
function path(name) {
return ICONS[name] || "";
}
function hydrate(root) {
var scope = root || document;
if (!scope.querySelectorAll) return;
scope.querySelectorAll("[data-icon]").forEach(function (node) {
var size = node.getAttribute("data-icon-size") || 18;
node.innerHTML = svg(node.getAttribute("data-icon"), size);
});
}
function init() {
hydrate(document);
}
if (document.readyState === "loading") {
document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
init();
}
window.Icons = {
svg: svg,
path: path,
hydrate: hydrate,
has: function (name) {
return Object.prototype.hasOwnProperty.call(ICONS, name);
}
};
})();
