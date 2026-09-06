/* ================================================================
   ROUTINE — UI / MODAL.JS
================================================================ */

(function () {
  "use strict";

  let lastFocused = null;
  let bound = false;

  function overlay() {
    return document.getElementById("modalOverlay");
  }

  function content() {
    return document.getElementById("modalContent");
  }

  function titleEl() {
    return document.getElementById("modalTitle");
  }

  function open(title, html) {
    const o = overlay();
    const c = content();
    const t = titleEl();

    if (!o || !c || !t) return null;

    lastFocused = document.activeElement;

    t.textContent = title || "";
    c.innerHTML = html || "";

    o.classList.add("active");
    o.removeAttribute("aria-hidden");
    document.body.style.overflow = "hidden";

    setTimeout(function () {
      const focusable = o.querySelector(
        "input, select, textarea, button:not(.modal-close), [href], [tabindex]:not([tabindex='-1'])"
      );

      if (focusable) {
        focusable.focus();
      } else {
        const closeBtn = document.getElementById("modalCloseBtn");
        if (closeBtn) closeBtn.focus();
      }
    }, 40);

    return c;
  }

  function close() {
    const o = overlay();
    if (!o) return;

    o.classList.remove("active");
    o.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";

    if (lastFocused && typeof lastFocused.focus === "function") {
      lastFocused.focus();
    }
  }

  function focusables() {
    const o = overlay();
    if (!o) return [];

    return Array.prototype.slice
      .call(
        o.querySelectorAll(
          "button, input, select, textarea, [href], [tabindex]:not([tabindex='-1'])"
        )
      )
      .filter(function (el) {
        return !el.disabled && el.offsetParent !== null;
      });
  }

  function bind() {
    if (bound) return;
    bound = true;

    const closeBtn = document.getElementById("modalCloseBtn");

    if (closeBtn) {
      closeBtn.addEventListener("click", close);
    }

    document.addEventListener("mousedown", function (event) {
      const o = overlay();

      if (o && o.classList.contains("active") && event.target === o) {
        close();
      }
    });

    document.addEventListener("keydown", function (event) {
      const o = overlay();

      if (!o || !o.classList.contains("active")) return;

      if (event.key === "Escape") {
        close();
        return;
      }

      if (event.key !== "Tab") return;

      const items = focusables();
      if (!items.length) return;

      const first = items[0];
      const last = items[items.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
  }

  window.UI = window.UI || {};

  window.UI.modal = {
    open: open,
    close: close
  };

  window.Utils.onDomReady(bind);
})();