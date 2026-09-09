/* ================================================================
   ROUTINE — FEATURES / STATS.JS
================================================================ */

(function () {
  "use strict";

  let initialized = false;
   let pendingImport = null;

  function el(id) {
    return document.getElementById(id);
  }

  function L(faText, enText) {
    return window.I18N.lang === "en" ? enText : faText;
  }

  function toast(message, type, options) {
    if (window.UI && window.UI.toast) {
      window.UI.toast(message, type, options);
    }
  }

  function refreshAll() {
    if (window.App && typeof window.App.renderAll === "function") {
      window.App.renderAll();
    } else {
      render();
    }
  }

  function box(value, label) {
    return (
      '<div class="stat-box">' +
      '<div class="stat-value">' + value + "</div>" +
      '<div class="stat-label">' + label + "</div>" +
      "</div>"
    );
  }

  function totalFocusSeconds() {
    const timerIds = new Set(
      window.Store.state.habits
        .filter(function (habit) {
          return habit.type === "timer";
        })
        .map(function (habit) {
          return String(habit.id);
        })
    );

    const todayKey = window.Calendar.todayKey();
    let total = 0;

    Object.keys(window.Store.state.logs).forEach(function (dateKey) {
      const day = window.Store.state.logs[dateKey];

      Object.keys(day).forEach(function (habitId) {
        if (!timerIds.has(String(habitId))) return;

        const log = day[habitId];

        if (dateKey === todayKey && log.startedAt) {
          total += window.Store.liveSeconds(habitId, log);
        } else {
          total += log.seconds || 0;
        }
      });
    });

    return total;
  }

  function renderStatsGrid() {
    const grid = el("statsGrid");
    if (!grid) return;

    const tasks = window.Store.state.tasks;
    const habits = window.Store.state.habits;

    const doneTasks = tasks.filter(function (task) {
      return task.done;
    }).length;

    const completionRate = tasks.length
      ? Math.round((doneTasks / tasks.length) * 100)
      : 0;

    const activeDays = Object.keys(window.Store.state.logs).filter(function (dateKey) {
      return Object.keys(window.Store.state.logs[dateKey] || {}).length;
    }).length;

    const bestStreak = habits.reduce(function (max, habit) {
      return Math.max(max, window.Store.habitStreaks(habit).best);
    }, 0);

    const focusHours = totalFocusSeconds() / 3600;

    grid.innerHTML =
      box(window.I18N.faNum(tasks.length), window.I18N.t("stats.totalTasks")) +
      box(window.I18N.faNum(doneTasks), window.I18N.t("stats.doneTasks")) +
      box(window.I18N.percent(completionRate), window.I18N.t("stats.completion")) +
      box(window.I18N.faNum(habits.length), window.I18N.t("stats.totalHabits")) +
      box(window.I18N.faNum(activeDays), window.I18N.t("stats.activeDays")) +
      box("🔥 " + window.I18N.faNum(bestStreak), window.I18N.t("stats.bestStreak")) +
      box(window.I18N.faNum(focusHours.toFixed(1)), window.I18N.t("stats.focusHours"));
  }

  function renderWeeklyChart() {
    const chart = el("weeklyChart");
    const totalEl = el("weeklyTotal");

    if (!chart) return;

    const week = [];

    for (let i = 6; i >= 0; i -= 1) {
      week.push(window.Calendar.keyShift(-i));
    }

    const values = week.map(function (dateKey) {
      return Math.round(window.Store.dayScore(dateKey).pct * 100);
    });

    chart.innerHTML = values
      .map(function (value, index) {
        return (
          '<div class="chart-col">' +
          '<div class="chart-bar-visual" style="height:' + Math.max(4, value * 1.5) + 'px" data-val="' +
          window.I18N.percent(value) + '"></div>' +
          '<span class="chart-label">' + window.Calendar.keyToJalaliShort(week[index]) + "</span>" +
          "</div>"
        );
      })
      .join("");

    if (totalEl) {
      const avg = Math.round(
        values.reduce(function (a, b) {
          return a + b;
        }, 0) / 7
      );

      totalEl.textContent = window.I18N.faNum(avg);
    }
  }

  function drawTrend(keys, values) {
    const svg = el("trendChart");
    if (!svg) return;

    const W = 800;
    const H = 240;
    const pad = {
      t: 18,
      r: 20,
      b: 30,
      l: 42
    };

    const cw = W - pad.l - pad.r;
    const ch = H - pad.t - pad.b;
    const max = 100;

    let grid = "";

    for (let i = 0; i <= 4; i += 1) {
      const y = pad.t + (ch * i) / 4;

      grid +=
        '<line x1="' + pad.l + '" y1="' + y + '" x2="' + (W - pad.r) + '" y2="' + y + '" class="line-chart-grid"></line>';

      grid +=
        '<text x="' + (pad.l - 8) + '" y="' + (y + 4) + '" class="line-chart-axis-text" text-anchor="end">' +
        window.I18N.faNum(Math.round((max * (4 - i)) / 4)) +
        "</text>";
    }

    function X(i) {
      return pad.l + (cw * i) / Math.max(1, keys.length - 1);
    }

    function Y(v) {
      return pad.t + ch - (v / max) * ch;
    }

    keys.forEach(function (key, index) {
      if (index % 5 === 0 || index === keys.length - 1) {
        grid +=
          '<text x="' + X(index) + '" y="' + (H - 8) + '" class="line-chart-axis-text">' +
          window.Calendar.keyToJalaliShort(key) +
          "</text>";
      }
    });

    let path = "";
    let area = "M " + pad.l + " " + (H - pad.b) + " ";

    values.forEach(function (value, index) {
      const x = X(index);
      const y = Y(value);

      if (index === 0) {
        path += "M " + x + " " + y;
        area += "L " + x + " " + y;
      } else {
        const px = X(index - 1);
        const py = Y(values[index - 1]);
        const seg =
          " C " + (px + (x - px) / 2) + " " + py +
          ", " + (px + (x - px) / 2) + " " + y +
          ", " + x + " " + y;

        path += seg;
        area += seg;
      }
    });

    area += " L " + X(keys.length - 1) + " " + (H - pad.b) + " Z";

    let dots = "";

    values.forEach(function (value, index) {
      dots +=
        '<circle cx="' + X(index) + '" cy="' + Y(value) + '" r="4" fill="var(--accent)" class="line-chart-dot" data-i="' + index + '" data-v="' + Math.round(value) + '" data-k="' + keys[index] + '"></circle>';
    });

    svg.innerHTML =
      '<path d="' + area + '" fill="var(--accent)" class="line-chart-area"></path>' +
      grid +
      '<path d="' + path + '" stroke="var(--accent)" class="line-chart-path"></path>' +
      dots;

    const tooltip = el("trendTooltip");
    const container = svg.parentElement;

    svg.querySelectorAll(".line-chart-dot").forEach(function (dot) {
      dot.addEventListener("mouseenter", function () {
        if (!tooltip || !container) return;

        tooltip.textContent =
          window.Calendar.keyToJalaliFull(dot.dataset.k) +
          " — " +
          window.I18N.percent(dot.dataset.v);

        const dotRect = dot.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        tooltip.style.left =
          Math.max(
            4,
            Math.min(
              containerRect.width - tooltip.offsetWidth - 4,
              dotRect.left - containerRect.left + dotRect.width / 2 - tooltip.offsetWidth / 2
            )
          ) + "px";

        tooltip.style.top = dotRect.top - containerRect.top - 42 + "px";
        tooltip.style.opacity = "1";
      });

      dot.addEventListener("mouseleave", function () {
        if (tooltip) tooltip.style.opacity = "0";
      });
    });
  }

  function renderTrendChart() {
    const month = [];

    for (let i = 29; i >= 0; i -= 1) {
      month.push(window.Calendar.keyShift(-i));
    }

    const values = month.map(function (dateKey) {
      return window.Store.dayScore(dateKey).pct * 100;
    });

    drawTrend(month, values);
  }

  function renderIndividualCharts() {
    const container = el("individualCharts");
    if (!container) return;

    const habits = window.Store.state.habits;

    if (!habits.length) {
      container.innerHTML =
        '<div class="empty-state">' +
        '<div class="empty-state-icon">📊</div>' +
        '<div class="empty-state-text">' + window.I18N.t("habits.emptyTitle") + "</div>" +
        '<div class="empty-state-sub">' + window.I18N.t("habits.emptySub") + "</div>" +
        "</div>";
      return;
    }

    const week = [];

    for (let i = 6; i >= 0; i -= 1) {
      week.push(window.Calendar.keyShift(-i));
    }

    container.innerHTML = habits
      .map(function (habit) {
        const values = week.map(function (dateKey, index) {
          const log = window.Store.getLog(habit.id, dateKey);

          if (habit.type === "checkbox") {
            return log.checked ? 1 : 0;
          }

          if (habit.type === "number") {
            return log.value;
          }

          let seconds = log.seconds || 0;

          if (index === 0 && log.startedAt) {
            seconds = window.Store.liveSeconds(habit.id, log);
          }

          return seconds / 60;
        });

        const unit = habit.type === "timer" ? L(" دقیقه", " min") : "";
        const max = Math.max.apply(
          null,
          values.concat([habit.type === "checkbox" ? 1 : habit.goal || 1, 1])
        );

        const total = values.reduce(function (a, b) {
          return a + b;
        }, 0);

        const streaks = window.Store.habitStreaks(habit);
        const icon = window.Habits && window.Habits.iconHTML
          ? window.Habits.iconHTML(habit.emoji, 21)
          : "🎯";

        return (
          '<div class="individual-chart">' +
          '<div class="individual-chart-header">' +
          '<span style="display:flex;color:' + habit.color + '">' + icon + "</span>" +
          '<span class="habit-name">' + window.Utils.escapeHtml(habit.name) + "</span>" +
          '<span class="chip">' + window.Utils.escapeHtml(window.I18N.t("category." + habit.category)) + "</span>" +
          '<span class="streak-badge' + (streaks.current ? "" : " cold") + '">🔥 ' + window.I18N.days(streaks.current) + "</span>" +
          '<span class="card-hint">' + L("مجموع ", "Total ") + window.I18N.faNum(total.toFixed(habit.type === "checkbox" ? 0 : 1)) + unit + "</span>" +
          "</div>" +
          '<div class="chart-bar">' +
          values
            .map(function (value, index) {
              return (
                '<div class="chart-col">' +
                '<div class="chart-bar-visual" style="height:' + Math.max(3, (value / max) * 80) + "px;background:" + habit.color + '" data-val="' +
                window.I18N.faNum(value.toFixed(habit.type === "checkbox" ? 0 : 1)) +
                '"></div>' +
                '<span class="chart-label">' + window.Calendar.keyToJalaliShort(week[index]) + "</span>" +
                "</div>"
              );
            })
            .join("") +
          "</div>" +
          "</div>"
        );
      })
      .join("");
  }

  function renderStorageSize() {
    const sizeEl = el("storageSize");
    if (!sizeEl) return;

    sizeEl.textContent = window.Utils.formatBytes(window.Store.storageSize());
  }

  function render() {
    renderStatsGrid();
    renderWeeklyChart();
    renderTrendChart();
    renderIndividualCharts();
    renderStorageSize();
  }

  function exportBackup() {
    const filename = "routine-backup-" + window.Calendar.todayKey() + ".json";
    const data = JSON.stringify(window.Store.exportData(), null, 2);

    window.Utils.downloadText(filename, data, "application/json");
    window.Store.markBackup();

    toast(window.I18N.t("common.backup") + " ✅", "success");
     function openBackupPreview(preview) {
if (!window.UI || !window.UI.modal) return;

const file = preview.file;
const current = preview.current;

function row(label, fileValue, currentValue) {
return (
'<div class="modal-item">' +
'<div style="min-width:0">' +
'<div style="font-weight:800">' + label + "</div>" +
'<div style="font-size:12px;color:var(--text-2);margin-top:4px">' +
window.I18N.t("backup.file") + ": " + window.I18N.faNum(fileValue) +
" · " +
window.I18N.t("backup.current") + ": " + window.I18N.faNum(currentValue) +
"</div>" +
"</div>" +
"</div>"
);
}

const html =
'<div class="modal-section-title">📤 ' + window.I18N.t("backup.previewTitle") + "</div>" +
row(window.I18N.t("backup.tasks"), file.tasks, current.tasks) +
row(window.I18N.t("backup.habits"), file.habits, current.habits) +
row(window.I18N.t("backup.days"), file.days, current.days) +
row(window.I18N.t("backup.trash"), file.trashTasks + file.trashHabits, current.trashTasks + current.trashHabits) +
'<p style="margin-top:14px;color:var(--warning);font-size:13px;font-weight:700;line-height:1.9">' +
"⚠️ " + window.I18N.t("backup.warning") +
"</p>" +
'<div class="sc-actions" style="margin-top:18px">' +
'<button class="btn btn-ghost" data-action="backup-preview-backup">' +
window.I18N.t("backup.backupFirst") +
"</button>" +
'<button class="btn btn-primary" data-action="backup-preview-restore">' +
window.I18N.t("backup.restoreNow") +
"</button>" +
'<button class="btn btn-ghost" data-action="close-modal">' +
window.I18N.t("common.cancel") +
"</button>" +
"</div>";

const content = window.UI.modal.open(window.I18N.t("backup.previewTitle"), html);
if (!content) return;

const backupFirstBtn = content.querySelector('[data-action="backup-preview-backup"]');
const restoreBtn = content.querySelector('[data-action="backup-preview-restore"]');
const cancelBtn = content.querySelector('[data-action="close-modal"]');

if (backupFirstBtn) {
backupFirstBtn.addEventListener("click", function () {
restoreFromPreview(true);
});
}

if (restoreBtn) {
restoreBtn.addEventListener("click", function () {
restoreFromPreview(false);
});
}

if (cancelBtn) {
cancelBtn.addEventListener("click", function () {
pendingImport = null;
window.UI.modal.close();
});
}
}

function restoreFromPreview(withBackup) {
if (!pendingImport) return;

const snap = window.Store.snapshot();

if (withBackup) {
exportBackup();
}

if (window.Store.commitImport) {
window.Store.commitImport(pendingImport);
} else {
window.Store.importData(pendingImport);
}

pendingImport = null;
window.UI.modal.close();
refreshAll();

toast(window.I18N.t("toast.dataRestored"), "success", {
action: {
label: window.I18N.t("common.restore"),
onClick: function () {
window.Store.restoreSnapshot(snap);
refreshAll();
toast(window.I18N.t("toast.restored"), "success");
}
}
});
}
  }

function handleImport(event) {
const file = event.target.files && event.target.files[0];
if (!file) return;

if (file.size > 10 * 1024 * 1024) {
toast(window.I18N.t("toast.invalidFile"), "error");
event.target.value = "";
return;
}

const reader = new FileReader();

reader.onload = function (loadEvent) {
let parsed = null;

try {
parsed = JSON.parse(loadEvent.target.result);
} catch (error) {
toast(window.I18N.t("toast.invalidFile"), "error");
return;
}

try {
if (window.Store.previewImport) {
const preview = window.Store.previewImport(parsed);
pendingImport = preview.normalized;
openBackupPreview(preview);
} else {
const snap = window.Store.snapshot();
window.Store.importData(parsed);
refreshAll();

toast(window.I18N.t("toast.dataRestored"), "success", {
action: {
label: window.I18N.t("common.restore"),
onClick: function () {
window.Store.restoreSnapshot(snap);
refreshAll();
toast(window.I18N.t("toast.restored"), "success");
}
}
});
}
} catch (error) {
toast(window.I18N.t("toast.invalidFile"), "error");
}
};

reader.readAsText(file);
event.target.value = "";
}

  function confirmReset() {
    if (!window.UI || !window.UI.modal) return;

    const html =
      '<p style="text-align:center;color:var(--text-2);line-height:2">' +
      window.I18N.t("modal.resetWarning") +
      "</p>" +
      '<div class="sc-actions" style="margin-top:18px">' +
      '<button class="btn btn-ghost" data-action="reset-backup-first">' +
      window.I18N.t("modal.backupFirst") +
      "</button>" +
      '<button class="btn btn-danger" data-action="reset-confirm">' +
      window.I18N.t("modal.yesReset") +
      "</button>" +
      '<button class="btn btn-ghost" data-action="close-modal">' +
      window.I18N.t("common.cancel") +
      "</button>" +
      "</div>";

    const content = window.UI.modal.open(window.I18N.t("modal.resetTitle"), html);
    if (!content) return;

    const backupBtn = content.querySelector('[data-action="reset-backup-first"]');
    const confirmBtn = content.querySelector('[data-action="reset-confirm"]');
    const cancelBtn = content.querySelector('[data-action="close-modal"]');

    if (backupBtn) {
      backupBtn.addEventListener("click", exportBackup);
    }

    if (cancelBtn) {
      cancelBtn.addEventListener("click", function () {
        window.UI.modal.close();
      });
    }

    if (confirmBtn) {
      confirmBtn.addEventListener("click", function () {
        const snap = window.Store.snapshot();

        window.Store.resetAll();
        window.UI.modal.close();
        refreshAll();

        toast(window.I18N.t("toast.dataReset"), "undo", {
          action: {
            label: window.I18N.t("common.restore"),
            onClick: function () {
              window.Store.restoreSnapshot(snap);
              refreshAll();
              toast(window.I18N.t("toast.restored"), "success");
            }
          }
        });
      });
    }
  }

  function bind() {
    const exportBtn = el("exportBtn");
    const importBtn = el("importBtn");
    const importFile = el("importFile");
    const resetBtn = el("resetBtn");

    if (exportBtn) {
      exportBtn.addEventListener("click", exportBackup);
    }

    if (importBtn) {
      importBtn.addEventListener("click", function () {
        if (importFile) importFile.click();
      });
    }

    if (importFile) {
      importFile.addEventListener("change", handleImport);
    }

    if (resetBtn) {
      resetBtn.addEventListener("click", confirmReset);
    }
  }

  function init() {
    if (initialized) return;
    initialized = true;

    bind();
  }

  window.Stats = {
    init: init,
    render: render,
    exportBackup: exportBackup
  };

  window.Utils.onDomReady(init);
})();
