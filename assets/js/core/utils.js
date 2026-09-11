/* ================================================================
   ROUTINE — CORE / UTILS.JS
   Helper utilities: escaping, numbers, debounce, download, etc.
================================================================ */

(function () {
  "use strict";

  const FA_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

  function toFa(value) {
    return String(value == null ? "" : value).replace(/[0-9]/g, function (d) {
      return FA_DIGITS[Number(d)];
    });
  }

  function escapeHtml(value) {
    const div = document.createElement("div");
    div.textContent = value == null ? "" : String(value);
    return div.innerHTML;
  }

  function debounce(fn, wait = 220) {
    let timer = null;
    return function (...args) {
      const context = this;
      clearTimeout(timer);
      timer = setTimeout(function () {
        fn.apply(context, args);
      }, wait);
    };
  }

  function throttle(fn, wait = 220) {
    let last = 0;
    let timer = null;

    return function (...args) {
      const context = this;
      const now = Date.now();
      const remaining = wait - (now - last);

      if (remaining <= 0) {
        last = now;
        fn.apply(context, args);
      } else {
        clearTimeout(timer);
        timer = setTimeout(function () {
          last = Date.now();
          fn.apply(context, args);
        }, remaining);
      }
    };
  }

  function clamp(value, min, max) {
    const n = Number(value) || 0;
    return Math.min(max, Math.max(min, n));
  }

  function uid(prefix = "id") {
    return (
      prefix +
      "_" +
      Date.now().toString(36) +
      "_" +
      Math.random().toString(36).slice(2, 9)
    );
  }

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  function formatSeconds(totalSeconds, forceFa = null) {
    const sec = Math.max(0, Math.floor(Number(totalSeconds) || 0));
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.floor(sec % 60);
    const text = pad2(h) + ":" + pad2(m) + ":" + pad2(s);

    const useFa =
      forceFa === null
        ? !!(window.I18N && window.I18N.lang === "fa")
        : !!forceFa;

    return useFa ? toFa(text) : text;
  }

  function formatTime(totalSeconds) {
    return formatSeconds(totalSeconds, null);
  }

  function formatBytes(bytes) {
    const b = Math.max(0, Number(bytes) || 0);

    if (b < 1024) return b + " B";
    if (b < 1024 * 1024) return (b / 1024).toFixed(1) + " KB";
    if (b < 1024 * 1024 * 1024) {
      return (b / (1024 * 1024)).toFixed(1) + " MB";
    }

    return (b / (1024 * 1024 * 1024)).toFixed(1) + " GB";
  }

  function isValidDateKey(key) {
    return /^\d{4}-\d{2}-\d{2}$/.test(String(key || ""));
  }

  function safeJsonParse(text, fallback = null) {
    try {
      return JSON.parse(text);
    } catch (error) {
      return fallback;
    }
  }

  function isPlainObject(value) {
    return !!value && typeof value === "object" && !Array.isArray(value);
  }

  function sanitizeText(value, maxLength = 500) {
    return String(value == null ? "" : value).trim().slice(0, maxLength);
  }

  function downloadBlob(filename, blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();

    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 1000);
  }

  function downloadText(filename, text, mime = "text/plain") {
    const blob = new Blob([text], { type: mime + ";charset=utf-8" });
    downloadBlob(filename, blob);
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }

    return new Promise(function (resolve, reject) {
      try {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();

        const ok = document.execCommand("copy");
        textarea.remove();

        if (ok) resolve();
        else reject(new Error("copy failed"));
      } catch (error) {
        reject(error);
      }
    });
  }

  function getCssVar(name, fallback = "") {
    const value = getComputedStyle(document.documentElement)
      .getPropertyValue(name)
      .trim();

    return value || fallback;
  }

  function onDomReady(fn) {
    if (!fn) return;

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    } else {
      fn();
    }
  }
function makeSwipeable(element, handlers) {
  if (!element || !handlers) return;
  let startX = 0;
  let startY = 0;
  let isDragging = false;
  let isHorizontal = null;
  let currentX = 0;

  function reset() {
    isDragging = false;
    isHorizontal = null;
    currentX = 0;
    element.classList.remove("swiping-left", "swiping-right");
    element.style.transform = "";
  }

  element.addEventListener("touchstart", function (e) {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    isDragging = true;
    isHorizontal = null;
    currentX = 0;
  }, { passive: true });

  element.addEventListener("touchmove", function (e) {
    if (!isDragging) return;
    const dx = e.touches[0].clientX - startX;
    const dy = e.touches[0].clientY - startY;

    if (isHorizontal === null) {
      isHorizontal = Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10;
    }

    if (!isHorizontal) return;

    currentX = dx;
    const threshold = window.innerWidth * 0.35;
    const clampedX = Math.max(-threshold, Math.min(threshold, dx));
    element.style.transform = "translateX(" + clampedX + "px)";
    element.style.transition = "none";

    if (dx > 0) {
      element.classList.add("swiping-right");
      element.classList.remove("swiping-left");
    } else {
      element.classList.add("swiping-left");
      element.classList.remove("swiping-right");
    }
  }, { passive: true });

  element.addEventListener("touchend", function () {
    if (!isDragging) return;
    const threshold = 80;
    const wasSwiping = isHorizontal;
    
    if (wasSwiping && Math.abs(currentX) > threshold) {
      if (currentX > 0 && handlers.onSwipeRight) {
        handlers.onSwipeRight();
      } else if (currentX < 0 && handlers.onSwipeLeft) {
        handlers.onSwipeLeft();
      }
    }
    reset();
  }, { passive: true });

  element.addEventListener("touchcancel", reset, { passive: true });
}
   const scriptPromises = {};
function loadScript(src) {
if (scriptPromises[src]) return scriptPromises[src];
scriptPromises[src] = new Promise(function (resolve, reject) {
const script = document.createElement("script");
script.src = src;
script.defer = true;
script.onload = function () {
resolve(src);
};
script.onerror = function () {
delete scriptPromises[src];
reject(new Error("Failed to load " + src));
};
document.head.appendChild(script);
});
return scriptPromises[src];
}
function onIdle(fn) {
if (window.requestIdleCallback) {
window.requestIdleCallback(function () {
fn();
}, { timeout: 4000 });
} else {
setTimeout(fn, 1200);
}
}
  window.Utils = {
    FA_DIGITS,
    toFa,
    escapeHtml,
    debounce,
    throttle,
    clamp,
    uid,
    pad2,
    formatSeconds,
    formatTime,
    formatBytes,
    isValidDateKey,
    safeJsonParse,
    isPlainObject,
    sanitizeText,
    downloadBlob,
    downloadText,
    copyText,
    getCssVar,
   makeSwipeable,
    onDomReady,
     loadScript,
onIdle
  };
})();
