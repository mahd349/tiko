/* ================================================================
ROUTINE — FEATURES / AUTH.JS
Google sign-in with Firebase Auth (compat SDK).
Popup first; any popup failure falls back to full-page redirect.
Redirect result is consumed at script-eval time (before any router
can rewrite the URL), and real error codes are surfaced in toasts.
================================================================ */
(function () {
  "use strict";

  const FIREBASE_CONFIG = {
    apiKey: "AIzaSyCWvWs37fGaX1WvcFMB2vtuB74gQoL3Uq8",
    authDomain: "tiko-76324.firebaseapp.com",
    projectId: "tiko-76324",
    storageBucket: "tiko-76324.firebasestorage.app",
    messagingSenderId: "479329809396",
    appId: "1:479329809396:web:f116826b130704d79bbfa1"
  };

  let auth = null;
  let currentUser = null;
  let initialized = false;

  function isConfigured() {
    return !!(
      FIREBASE_CONFIG.apiKey &&
      FIREBASE_CONFIG.projectId &&
      FIREBASE_CONFIG.apiKey.indexOf("YOUR_") !== 0 &&
      FIREBASE_CONFIG.projectId.indexOf("YOUR_") !== 0
    );
  }

  function toast(message, type, opts) {
    if (window.UI && window.UI.toast) {
      window.UI.toast(message, type, opts);
    }
  }

  function labelEl() {
    return document.getElementById("authLabel");
  }

  function buttonEl() {
    return document.getElementById("authBtn");
  }

  function render() {
    const btn = buttonEl();
    const label = labelEl();
    if (!btn || !label) return;
    const icon = btn.querySelector(".nav-icon");
    if (currentUser) {
      label.textContent =
        currentUser.displayName ||
        currentUser.email ||
        window.I18N.t("auth.connected");
      if (icon) icon.innerHTML = window.Icons ? window.Icons.svg("user", 20) : "";
      btn.title = currentUser.email || currentUser.displayName || "";
    } else {
      label.textContent = window.I18N.t("auth.login");
      if (icon) icon.innerHTML = window.Icons ? window.Icons.svg("user", 20) : "";
      btn.title = window.I18N.t("auth.login");
    }
  }

  function openSetupModal() {
    if (!window.UI || !window.UI.modal) return;
    const html =
      '<div style="line-height:2.1;font-size:14px;color:var(--text-2)">' +
      "<p>برای فعال‌کردن ورود با گوگل:</p>" +
      '<ol style="padding-inline-start:18px;display:grid;gap:6px">' +
      "<li>برو به <strong>console.firebase.google.com</strong></li>" +
      "<li>یک پروژه بساز.</li>" +
      "<li>از منوی <strong>Authentication</strong> گزینهٔ <strong>Sign-in method</strong> را باز کن و <strong>Google</strong> را فعال کن.</li>" +
      "<li>از <strong>Project Settings → General → Your apps</strong> یک Web app اضافه کن.</li>" +
      "<li>مقادیر کانفیگ را در فایل <code>assets/js/features/auth.js</code> جایگزین کن.</li>" +
      "<li>دامنهٔ سایتت را در Firebase در بخش <strong>Authorized domains</strong> اضافه کن.</li>" +
      "</ol>" +
      '<p style="margin-top:12px">بعد از ذخیره، صفحه را رفرش کن.</p>' +
      "</div>";
    window.UI.modal.open(window.I18N.t("auth.login"), html);
  }

  function ensureFirebase() {
    if (!window.firebase) return false;
    if (!isConfigured()) {
      openSetupModal();
      return false;
    }
    if (!initialized) {
      try {
        if (!firebase.apps.length) {
          firebase.initializeApp(FIREBASE_CONFIG);
        }
        auth = firebase.auth();
        initialized = true;
        auth.onAuthStateChanged(function (user) {
          currentUser = user;
          render();
        });
      } catch (error) {
        console.error(error);
        toast(window.I18N.t("auth.error"), "error");
        return false;
      }
    }
    return true;
  }

  function errorCode(error) {
    return error && error.code ? error.code : "unknown";
  }

  function failToast(error) {
    toast(window.I18N.t("auth.error") + " (" + errorCode(error) + ")", "error", {
      duration: 9000
    });
  }

  function startRedirect(provider) {
    auth.signInWithRedirect(provider).catch(function (error) {
      console.error(error);
      failToast(error);
    });
  }

  function login() {
    if (!ensureFirebase()) return;
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    auth
      .signInWithPopup(provider)
      .then(function (result) {
        currentUser = result.user;
        render();
        toast(window.I18N.t("auth.connected"), "success");
      })
      .catch(function (error) {
        console.error(error);
        const code = errorCode(error);
        if (code === "auth/unauthorized-domain") {
          toast(
            window.I18N.lang === "en"
              ? "This domain is not authorized for sign-in. Add it in Firebase Console → Authentication → Settings → Authorized domains."
              : "این دامنه برای ورود مجاز نیست؛ آن را در Firebase Console → Authentication → Settings → Authorized domains اضافه کن.",
            "error",
            { duration: 12000 }
          );
          return;
        }
        if (code === "auth/network-request-failed") {
          toast(
            window.I18N.lang === "en"
              ? "Network error. Check your connection and try again."
              : "خطای شبکه؛ اتصال را بررسی کن و دوباره تلاش کن.",
            "error",
            { duration: 8000 }
          );
          return;
        }
        // Any popup failure (blocked, closed, COOP-broken, unsupported)
        // falls back to the full-page redirect without user interaction.
        startRedirect(provider);
      });
  }

  function logout() {
    if (!auth) return;
    auth
      .signOut()
      .then(function () {
        currentUser = null;
        render();
        toast(window.I18N.t("auth.logout"), "info");
      })
      .catch(function (error) {
        console.error(error);
        failToast(error);
      });
  }

  function onAuthClick() {
    if (!window.firebase || !isConfigured()) {
      openSetupModal();
      return;
    }
    if (currentUser) {
      logout();
    } else {
      login();
    }
  }

  function consumeRedirectResult() {
    if (!ensureFirebase() || !auth || !auth.getRedirectResult) return;
    auth
      .getRedirectResult()
      .then(function (result) {
        if (result && result.user) {
          currentUser = result.user;
          render();
          toast(window.I18N.t("auth.connected"), "success");
        }
      })
      .catch(function (error) {
        const code = errorCode(error);
        if (code === "auth/no-auth-event-was-triggered") return;
        console.error(error);
        failToast(error);
      });
  }

  function init() {
    const btn = buttonEl();
    if (!btn) return;
    btn.addEventListener("click", onAuthClick);
    render();
  }

  // Consume the redirect result as early as possible so no router
  // or history.replaceState can wipe the OAuth fragment first.
  if (window.firebase && isConfigured()) {
    consumeRedirectResult();
  }

  window.Auth = {
    init: init,
    render: render,
    get user() {
      return currentUser;
    }
  };

  window.Utils.onDomReady(init);
})();
