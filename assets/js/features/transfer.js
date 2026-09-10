(function () {
  "use strict";

  var MAX_QR_BYTES = 2500;
  var qrLibLoaded = false;
  var scannerLibLoaded = false;
  var activeScanner = null;

  function L(fa, en) {
    return window.I18N && window.I18N.lang === "en" ? en : fa;
  }

  function toast(msg, type) {
    if (window.UI && window.UI.toast) window.UI.toast(msg, type);
  }

  function encodePayload() {
    var data = window.Store.exportData();
    var json = JSON.stringify(data);
    if (json.length > MAX_QR_BYTES) {
      var slim = JSON.parse(json);
      slim.logs = {};
      json = JSON.stringify(slim);
      if (json.length > MAX_QR_BYTES) {
        return { ok: false, tooBig: true, size: json.length };
      }
      return { ok: true, json: json, slim: true };
    }
    return { ok: true, json: json, slim: false };
  }

  function loadScript(src, onLoad, onError) {
    var script = document.createElement("script");
    script.src = src;
    script.onload = onLoad;
    script.onerror = onError;
    document.head.appendChild(script);
  }

  function ensureQRLib(callback) {
    if (qrLibLoaded && window.QRCode) { callback(); return; }
    loadScript(
      "https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js",
      function () { qrLibLoaded = true; callback(); },
      function () { toast(L("خطا در بارگذاری کتابخانه QR", "Failed to load QR library"), "error"); }
    );
  }

  function ensureScannerLib(callback) {
    if (scannerLibLoaded && window.Html5Qrcode) { callback(); return; }
    loadScript(
      "https://cdn.jsdelivr.net/npm/html5-qrcode@2.3.8/html5-qrcode.min.js",
      function () { scannerLibLoaded = true; callback(); },
      function () { toast(L("خطا در بارگذاری اسکنر", "Failed to load scanner"), "error"); }
    );
  }

  function renderQR(container, text) {
    ensureQRLib(function () {
      container.innerHTML = "";
      window.QRCode.toCanvas(
        text,
        { width: 280, margin: 2, errorCorrectionLevel: "M" },
        function (err, canvas) {
          if (err) {
            container.innerHTML = '<p style="color:var(--danger);text-align:center;padding:20px">' +
              L("خطا در ساخت QR", "QR generation failed") + "</p>";
            return;
          }
          canvas.style.maxWidth = "100%";
          canvas.style.height = "auto";
          canvas.style.borderRadius = "12px";
          canvas.style.background = "#fff";
          canvas.style.display = "block";
          canvas.style.margin = "0 auto";
          container.appendChild(canvas);
        }
      );
    });
  }

  function startScanner(container, onSuccess) {
    ensureScannerLib(function () {
      container.innerHTML = '<div id="qrReaderInner"></div>';
      try {
        var scanner = new window.Html5Qrcode("qrReaderInner");
        activeScanner = scanner;
        scanner
          .start(
            { facingMode: "environment" },
            { fps: 10, qrbox: { width: 240, height: 240 } },
            function (decoded) { onSuccess(decoded); },
            function () {}
          )
          .catch(function () {
            container.innerHTML =
              '<p style="color:var(--warning);text-align:center;padding:20px">' +
              L(
                "دسترسی به دوربین رد شد یا در دسترس نیست. لطفاً کد متنی را پیست کنید.",
                "Camera access denied or unavailable. Please paste the text code."
              ) +
              "</p>";
          });
      } catch (e) {
        container.innerHTML =
          '<p style="color:var(--warning);text-align:center;padding:20px">' +
          L("اسکنر پشتیبانی نمی‌شود", "Scanner not supported") +
          "</p>";
      }
    });
  }

  function stopScanner() {
    if (activeScanner) {
      try {
        activeScanner.stop().then(function () {
          try { activeScanner.clear(); } catch (e) {}
        });
      } catch (e) {}
      activeScanner = null;
    }
  }

  function applyIncoming(text) {
    try {
      var parsed = JSON.parse(text);
      if (!parsed.tasks && !parsed.habits) {
        toast(L("کد نامعتبر است", "Invalid code"), "error");
        return false;
      }
      var snap = window.Store.snapshot();
      window.Store.importData(parsed);
      if (window.App && window.App.renderAll) window.App.renderAll();
      toast(L("✅ داده‌ها با موفقیت دریافت شد", "✅ Data received successfully"), "success", {
        action: {
          label: L("بازگشت", "Undo"),
          onClick: function () {
            window.Store.restoreSnapshot(snap);
            if (window.App && window.App.renderAll) window.App.renderAll();
            toast(L("↩️ بازگردانی شد", "↩️ Undone"), "success");
          }
        }
      });
      return true;
    } catch (e) {
      toast(L("کد نامعتبر است", "Invalid code"), "error");
      return false;
    }
  }

  function openTransferModal() {
    if (!window.UI || !window.UI.modal) return;

    var html =
      '<div class="transfer-tabs">' +
      '<button class="transfer-tab active" data-tab="send">' + L("📤 ارسال", "📤 Send") + "</button>" +
      '<button class="transfer-tab" data-tab="receive">' + L("📥 دریافت", "📥 Receive") + "</button>" +
      "</div>" +
      '<div id="transferSendPane" class="transfer-pane">' +
      '<p class="transfer-hint">' +
      L(
        "این کد را در دستگاه دیگر اسکن کنید یا کد متنی را کپی و پیست کنید.",
        "Scan this code on another device or copy the text code."
      ) +
      "</p>" +
      '<div id="qrContainer" style="display:flex;justify-content:center;align-items:center;min-height:280px;background:#fff;border-radius:12px;padding:12px;margin-bottom:12px"><span style="color:#888">⏳</span></div>' +
      '<textarea id="transferCodeText" class="input" readonly rows="3" style="font-family:monospace;font-size:11px;resize:none"></textarea>' +
      '<button class="btn btn-ghost btn-sm" data-action="copy-transfer-code" style="width:100%;margin-top:10px">📋 ' +
      L("کپی کد", "Copy code") +
      "</button>" +
      "</div>" +
      '<div id="transferReceivePane" class="transfer-pane" hidden>' +
      '<p class="transfer-hint">' +
      L(
        "دوربین را به سمت QR دستگاه دیگر بگیرید یا کد متنی را اینجا پیست کنید.",
        "Point camera at the other device's QR or paste the text code below."
      ) +
      "</p>" +
      '<div id="qrScanner" style="border-radius:12px;overflow:hidden;margin-bottom:12px;background:var(--surface);min-height:60px"></div>' +
      '<button class="btn btn-ghost btn-sm" id="startScanBtn" style="width:100%;margin-bottom:10px">📷 ' +
      L("شروع اسکن با دوربین", "Start camera scan") +
      "</button>" +
      '<textarea id="pasteCodeText" class="input" rows="3" placeholder="' +
      L("یا کد متنی را اینجا پیست کنید…", "Or paste text code here…") +
      '" style="font-family:monospace;font-size:11px;resize:none"></textarea>' +
      '<button class="btn btn-primary btn-sm" id="applyCodeBtn" style="width:100%;margin-top:10px">✅ ' +
      L("اعمال کد", "Apply code") +
      "</button>" +
      "</div>";

    var content = window.UI.modal.open(L("🔗 انتقال به دستگاه دیگر", "🔗 Transfer to another device"), html);
    if (!content) return;

    var tabs = content.querySelectorAll(".transfer-tab");
    var sendPane = content.querySelector("#transferSendPane");
    var receivePane = content.querySelector("#transferReceivePane");

    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        tabs.forEach(function (t) { t.classList.remove("active"); });
        tab.classList.add("active");
        if (tab.dataset.tab === "send") {
          sendPane.hidden = false;
          receivePane.hidden = true;
          stopScanner();
        } else {
          sendPane.hidden = true;
          receivePane.hidden = false;
        }
      });
    });

    var payload = encodePayload();
    var codeTextEl = content.querySelector("#transferCodeText");
    var qrContainer = content.querySelector("#qrContainer");

    if (!payload.ok) {
      qrContainer.innerHTML =
        '<p style="color:var(--warning);text-align:center;padding:20px;line-height:1.8">' +
        L(
          "⚠️ داده‌های شما برای QR بزرگ‌تر از حد مجاز است.<br>لطفاً از پشتیبان فایل استفاده کنید.",
          "⚠️ Your data is too large for QR transfer.<br>Please use file backup instead."
        ) +
        "</p>";
      codeTextEl.value = "";
    } else {
      codeTextEl.value = payload.json;
      renderQR(qrContainer, payload.json);
      if (payload.slim) {
        var warn = document.createElement("p");
        warn.style.cssText = "color:var(--warning);font-size:12px;text-align:center;margin-top:8px";
        warn.textContent = L("⚠️ تاریخچه عادت‌ها به دلیل حجم حذف شد.", "⚠️ Habit history excluded due to size.");
        qrContainer.parentNode.insertBefore(warn, qrContainer.nextSibling);
      }
    }

    var copyBtn = content.querySelector('[data-action="copy-transfer-code"]');
    if (copyBtn) {
      copyBtn.addEventListener("click", function () {
        if (!codeTextEl.value) return;
        try {
          navigator.clipboard.writeText(codeTextEl.value);
          toast(L("📋 کد کپی شد", "📋 Code copied"), "success");
        } catch (e) {
          codeTextEl.select();
          try { document.execCommand("copy"); } catch (err) {}
          toast(L("📋 کد کپی شد", "📋 Code copied"), "success");
        }
      });
    }

    var startBtn = content.querySelector("#startScanBtn");
    var scannerEl = content.querySelector("#qrScanner");
    if (startBtn) {
      startBtn.addEventListener("click", function () {
        startBtn.disabled = true;
        startBtn.textContent = L("⏳ در حال راه‌اندازی…", "⏳ Starting…");
        startScanner(scannerEl, function (text) {
          stopScanner();
          var ok = applyIncoming(text);
          if (ok) window.UI.modal.close();
        });
      });
    }

    var applyBtn = content.querySelector("#applyCodeBtn");
    var pasteEl = content.querySelector("#pasteCodeText");
    if (applyBtn) {
      applyBtn.addEventListener("click", function () {
        var text = (pasteEl.value || "").trim();
        if (!text) {
          toast(L("کد خالی است", "Code is empty"), "error");
          return;
        }
        var ok = applyIncoming(text);
        if (ok) window.UI.modal.close();
      });
    }

    var observer = new MutationObserver(function () {
      if (!document.body.contains(content)) {
        stopScanner();
        observer.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  window.Transfer = { open: openTransferModal };
})();