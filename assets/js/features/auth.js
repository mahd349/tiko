/* ================================================================
   ROUTINE — FEATURES / AUTH.JS
   Google sign-in with Firebase Auth (compat SDK).

   ⚠️ Replace FIREBASE_CONFIG with your Firebase project config.
   Firebase Console → Project Settings → Your apps → Web app.
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

  function toast(message, type) {
    if (window.UI && window.UI.toast) {
      window.UI.toast(message, type);
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

      if (icon) icon.textContent = "👤";

      btn.title = currentUser.email || currentUser.displayName || "";
    } else {
      label.textContent = window.I18N.t("auth.login");

      if (icon) icon.textContent = "👤";

      btn.title = window.I18N.t("auth.login");
    }
  }

  function openSetupModal() {
    if (!window.UI || !window.UI.modal) return;

    const html =
      '<div style="line-height:2.1;font-size:14px;color:var(--text-2)">' +
      "<p>برای فعال‌کردن ورود با گوگل:</p>" +
      "<ol style=\"padding-inline-start:18px;display:grid;gap:6px\">" +
      "<li>برو به <strong>console.firebase.google.com</strong></li>" +
      "<li>یک پروژه بساز.</li>" +
      "<li>از منوی <strong>Authentication</strong> گزینهٔ <strong>Sign-in method</strong> را باز کن و <strong>Google</strong> را فعال کن.</li>" +
      "<li>از <strong>Project Settings → General → Your apps</strong> یک Web app اضافه کن.</li>" +
      "<li>مقادیر کانفیگ را در فایل <code>assets/js/features/auth.js</code> جایگزین کن.</li>" +
      "<li>دامنهٔ سایتت را در Firebase در بخش <strong>Authorized domains</strong> اضافه کن.</li>" +
      "</ol>" +
      "<p style=\"margin-top:12px\">بعد از ذخیره، صفحه را رفرش کن.</p>" +
      "</div>";

    window.UI.modal.open("🔐 " + window.I18N.t("auth.login"), html);
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

  function login() {
    if (!ensureFirebase()) return;

    const provider = new firebase.auth.GoogleAuthProvider();

    provider.setCustomParameters({
      prompt: "select_account"
    });

    auth
      .signInWithPopup(provider)
      .then(function (result) {
        currentUser = result.user;
        render();
        toast(window.I18N.t("auth.connected"), "success");
      })
      .catch(function (error) {
        console.error(error);

        if (error && error.code === "auth/popup-closed-by-user") {
          return;
        }

        toast(window.I18N.t("auth.error"), "error");
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
        toast(window.I18N.t("auth.error"), "error");
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

  function init() {
    const btn = buttonEl();
    if (!btn) return;

    btn.addEventListener("click", onAuthClick);

    if (window.firebase && isConfigured()) {
      ensureFirebase();
    }

    render();
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