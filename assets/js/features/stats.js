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


let currentRange = 7;
function rangeKeys() {
const keys = [];
const today = window.Calendar.todayKey();
if (currentRange === "year") {
const jy = window.Calendar.getToday("fa").jy;
let cursor = window.Calendar.toKey(jy, 1, 1, "fa");
let guard = 0;
while (cursor <= today && guard < 400) {
keys.push(cursor);
cursor = window.Calendar.keyShift(1, cursor);
guard += 1;
}
return keys;
}
const count = Math.min(365, Math.max(7, currentRange));
for (let i = count - 1; i >= 0; i -= 1) {
keys.push(window.Calendar.keyShift(-i));
}
return keys;
}
function renderRangeBar() {
const bar = el("statsRange");
if (!bar) return;
const options = [
{ value: "7", label: L("۷ روز", "7 days") },
{ value: "30", label: L("۳۰ روز", "30 days") },
{ value: "90", label: L("۹۰ روز", "90 days") },
{ value: "year", label: L("امسال", "This year") }
];
bar.innerHTML = options
.map(function (opt) {
const active = String(currentRange) === opt.value;
return (
'<button class="filter-chip' + (active ? " active" : "") + '" data-range="' + opt.value + '" aria-pressed="' + active + '">' + opt.label + "</button>"
);
})
.join("");
}
function renderInsights() {
const wrap = el("statsInsights");
if (!wrap) return;
const keys = rangeKeys();
const insights = [];
let bestKey = null;
let bestPct = -1;
keys.forEach(function (key) {
const score = window.Store.dayScore(key);
if (score.total > 0 && score.pct > bestPct) {
bestPct = score.pct;
bestKey = key;
}
});
if (bestKey) {
insights.push({
icon: "🏆",
text:
L("بهترین روز بازه: ", "Best day in range: ") +
window.Calendar.keyToJalaliFull(bestKey) +
L(" با ", " with ") +
window.I18N.percent(Math.round(bestPct * 100)) +
L(" تکمیل", " done")
});
}
const last7 = [];
const prev7 = [];
for (let i = 0; i < 7; i += 1) last7.push(window.Calendar.keyShift(-i));
for (let i = 7; i < 14; i += 1) prev7.push(window.Calendar.keyShift(-i));
const avgOf = function (list) {
return (
list.reduce(function (sum, key) {
return sum + window.Store.dayScore(key).pct;
}, 0) / list.length
);
};
const diff = Math.round((avgOf(last7) - avgOf(prev7)) * 100);
insights.push({
icon: diff >= 0 ? "📈" : "📉",
text:
L("این هفته نسبت به هفتهٔ قبل: ", "This week vs last week: ") +
(diff >= 0 ? "+" : "") +
window.I18N.faNum(diff) +
L(" درصد", " points")
});
let topHabit = null;
let topRate = -1;
window.Store.state.habits.forEach(function (habit) {
let active = 0;
let done = 0;
keys.forEach(function (key) {
if (!window.Store.habitExistedOn(habit, key)) return;
if (window.Store.habitActiveOn && !window.Store.habitActiveOn(habit, key)) return;
active += 1;
if (window.Store.habitDone(habit, key)) done += 1;
});
if (active >= 3) {
const rate = done / active;
if (rate > topRate) {
topRate = rate;
topHabit = habit;
}
}
});
if (topHabit) {
insights.push({
icon: "🔥",
text:
L("منظم‌ترین عادت بازه: ", "Most consistent habit: ") +
topHabit.name +
L(" با ", " with ") +
window.I18N.percent(Math.round(topRate * 100)) +
L(" انجام", " completion")
});
}
const overdue = window.Store.state.tasks.filter(function (task) {
return !task.done && task.date < window.Calendar.keyShift(-5);
}).length;
if (overdue) {
insights.push({
icon: "⚠️",
text:
window.I18N.faNum(overdue) +
L(" وظیفه بیش از ۵ روز عقب افتاده‌اند — چند تا را حذف کن یا زمان دوباره بده.", " tasks are over 5 days late — consider rescheduling or deleting some.")
});
}
wrap.innerHTML = insights.length
? '<div class="modal-section-title">💡 ' + L("بینش‌های این بازه", "Insights for this range") + "</div>" +
insights
.map(function (item) {
return (
'<div class="insight-card"><span class="insight-icon">' + item.icon + "</span><span>" +
window.Utils.escapeHtml(item.text) +
"</span></div>"
);
})
.join("")
: "";
}
   
function renderStatsGrid() {
const grid = el("statsGrid");
if (!grid) return;
const keys = rangeKeys();
const keySet = {};
keys.forEach(function (key) {
keySet[key] = true;
});
const habits = window.Store.state.habits;
const tasks = window.Store.state.tasks.filter(function (task) {
return keySet[task.date];
});
const doneTasks = tasks.filter(function (task) {
return task.done;
}).length;
const completionRate = keys.length
? Math.round(
(keys.reduce(function (sum, key) {
return sum + window.Store.dayScore(key).pct;
}, 0) /
keys.length) *
100
)
: 0;
const activeDays = keys.filter(function (key) {
const day = window.Store.state.logs[key];
return day && Object.keys(day).length;
}).length;
const bestStreak = habits.reduce(function (max, habit) {
return Math.max(max, window.Store.habitStreaks(habit).best);
}, 0);
const timerIds = {};
habits.forEach(function (habit) {
if (habit.type === "timer") timerIds[String(habit.id)] = true;
});
let seconds = 0;
const today = window.Calendar.todayKey();
keys.forEach(function (key) {
const day = window.Store.state.logs[key];
if (!day) return;
Object.keys(day).forEach(function (habitId) {
if (!timerIds[String(habitId)]) return;
const log = day[habitId];
if (key === today && log.startedAt) {
seconds += window.Store.liveSeconds(habitId, log);
} else {
seconds += log.seconds || 0;
}
});
});
grid.innerHTML =
box(window.I18N.faNum(tasks.length), window.I18N.t("stats.totalTasks")) +
box(window.I18N.faNum(doneTasks), window.I18N.t("stats.doneTasks")) +
box(window.I18N.percent(completionRate), window.I18N.t("stats.completion")) +
box(window.I18N.faNum(habits.length), window.I18N.t("stats.totalHabits")) +
box(window.I18N.faNum(activeDays), window.I18N.t("stats.activeDays")) +
box("🔥 " + window.I18N.faNum(bestStreak), window.I18N.t("stats.bestStreak")) +
box(window.I18N.faNum((seconds / 3600).toFixed(1)), window.I18N.t("stats.focusHours"));
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
const avg = Math.round(
values.reduce(function (a, b) {
return a + b;
}, 0) / 7
);
if (totalEl) {
totalEl.textContent = window.I18N.faNum(avg);
}
const weeklySummary = el("weeklyChartSummary");
if (weeklySummary) {
let bestIndex = 0;
values.forEach(function (value, index) {
if (value > values[bestIndex]) bestIndex = index;
});
weeklySummary.textContent = L(
"خلاصهٔ نمودار هفتگی: میانگین تکمیل " + window.I18N.percent(avg) +
"؛ بهترین روز " + window.Calendar.keyToJalaliFull(week[bestIndex]) +
" با " + window.I18N.percent(values[bestIndex]) + " تکمیل. روزها: " +
week.map(function (key, index) {
return window.Calendar.keyToJalaliShort(key) + " " + window.I18N.percent(values[index]);
}).join("، ") + ".",
"Weekly chart summary: average completion " + avg + "%; best day " +
window.Calendar.keyToJalaliFull(week[bestIndex], "en") + " at " + values[bestIndex] +
"%. Days: " +
week.map(function (key, index) {
return window.Calendar.keyToJalaliShort(key, "en") + " " + values[index] + "%";
}).join(", ") + "."
);
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
const keys = rangeKeys();
const values = keys.map(function (dateKey) {
return window.Store.dayScore(dateKey).pct * 100;
});
drawTrend(keys, values);
const trendSummary = el("trendChartSummary");
if (trendSummary && keys.length) {
const avg = Math.round(
values.reduce(function (a, b) {
return a + b;
}, 0) / values.length
);
let bestIndex = 0;
values.forEach(function (value, index) {
if (value > values[bestIndex]) bestIndex = index;
});
trendSummary.textContent = L(
"خلاصهٔ نمودار روند: بازهٔ " + window.I18N.faNum(keys.length) +
" روزه؛ میانگین تکمیل " + window.I18N.percent(avg) +
"؛ بهترین روز " + window.Calendar.keyToJalaliFull(keys[bestIndex]) +
" با " + window.I18N.percent(Math.round(values[bestIndex])) + ".",
"Trend chart summary: " + keys.length + "-day range; average completion " + avg +
"%; best day " + window.Calendar.keyToJalaliFull(keys[bestIndex], "en") +
" at " + Math.round(values[bestIndex]) + "%."
);
}
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
'<div class="chart-bar" aria-hidden="true">' +
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
'<p class="sr-only">' +
L(
"نمودار هفتگی " +
habit.name +
": مجموع " +
window.I18N.faNum(total.toFixed(habit.type === "checkbox" ? 0 : 1)) +
unit +
"؛ استریک فعلی " +
window.I18N.days(streaks.current) +
"؛ رکورد " +
window.I18N.days(streaks.best) +
".",
"Weekly chart for " +
habit.name +
": total " +
total.toFixed(habit.type === "checkbox" ? 0 : 1) +
unit +
"; current streak " +
streaks.current +
" days; best " +
streaks.best +
" days."
) +
"</p>" +
           '<p class="sr-only">' +
L(
"نمودار هفتگی " + habit.name + ": مجموع " +
window.I18N.faNum(total.toFixed(habit.type === "checkbox" ? 0 : 1)) + unit +
"؛ استریک فعلی " + window.I18N.days(streaks.current) +
"؛ رکورد " + window.I18N.days(streaks.best) + ".",
"Weekly chart for " + habit.name + ": total " +
total.toFixed(habit.type === "checkbox" ? 0 : 1) + unit +
"; current streak " + streaks.current + " days; best " + streaks.best + " days."
) +
"</p>" +
"</div>"
);
            })
            .join("") +
          "</div>" +
          "</div>"
      
      })
      .join("");
  }

  function renderStorageSize() {
    const sizeEl = el("storageSize");
    if (!sizeEl) return;

    sizeEl.textContent = window.Utils.formatBytes(window.Store.storageSize());
  }

   /* ------------------------------
Breakdown + CSV (P10-2)
------------------------------ */
function rangeKeysSafe() {
if (typeof rangeKeys === "function") return rangeKeys();
const keys = [];
for (let i = 29; i >= 0; i -= 1) {
keys.push(window.Calendar.keyShift(-i));
}
return keys;
}
function computeHabitBreakdown(groupFn) {
const keys = rangeKeysSafe();
const groups = {};
window.Store.state.habits.forEach(function (habit) {
groups[groupFn(habit)] = { done: 0, total: 0 };
});
window.Store.state.habits.forEach(function (habit) {
const g = groups[groupFn(habit)];
keys.forEach(function (key) {
if (!window.Store.habitExistedOn(habit, key)) return;
if (window.Store.habitActiveOn && !window.Store.habitActiveOn(habit, key)) return;
g.total += 1;
if (window.Store.habitDone(habit, key)) g.done += 1;
});
});
return groups;
}
function computeTaskBreakdown(groupFn) {
const keySet = {};
rangeKeysSafe().forEach(function (k) {
keySet[k] = true;
});
const groups = {};
window.Store.state.tasks.forEach(function (task) {
if (!keySet[task.date]) return;
const g = groupFn(task);
if (!groups[g]) groups[g] = { done: 0, total: 0 };
groups[g].total += 1;
if (window.Store.isTaskDoneOnDate(task, task.date)) groups[g].done += 1;
});
return groups;
}
function breakdownRowsHTML(title, groups) {
const entries = Object.keys(groups)
.map(function (name) {
return { name: name, done: groups[name].done, total: groups[name].total };
})
.filter(function (item) {
return item.total > 0;
})
.sort(function (a, b) {
return b.total - a.total;
});
if (!entries.length) return "";
return (
'<div class="bd-block">' +
'<div class="bd-title">' + title + "</div>" +
entries
.map(function (item) {
const pct = Math.round((item.done / item.total) * 100);
return (
'<div class="bd-row">' +
'<span class="bd-name">' + window.Utils.escapeHtml(item.name) + "</span>" +
'<div class="bd-bar"><span style="width:' + pct + '%"></span></div>' +
'<span class="bd-val">' + window.I18N.percent(pct) + " (" + window.I18N.faNum(item.done) + "/" + window.I18N.faNum(item.total) + ")</span>" +
"</div>"
);
})
.join("") +
"</div>"
);
}
function renderBreakdown() {
const wrap = el("statsBreakdown");
if (!wrap) return;
const habits = window.Store.state.habits;
const tasks = window.Store.state.tasks;
if (!habits.length && !tasks.length) {
wrap.innerHTML = "";
return;
}
let html = "";
if (habits.length) {
html += breakdownRowsHTML(
L("به تفکیک دستهٔ عادت", "By habit category"),
computeHabitBreakdown(function (h) {
return window.I18N.t("category." + h.category);
})
);
html += breakdownRowsHTML(
L("به تفکیک نوع عادت", "By habit type"),
computeHabitBreakdown(function (h) {
return window.I18N.t(h.type === "checkbox" ? "habits.typeCheckbox" : h.type === "timer" ? "habits.typeTimer" : "habits.typeNumber");
})
);
}
if (tasks.length) {
html += breakdownRowsHTML(
L("به تفکیک پروژه (وظایف)", "By project (tasks)"),
computeTaskBreakdown(function (task) {
const p = task.projectId && window.Store.getProjectById ? window.Store.getProjectById(task.projectId) : null;
return p ? p.name : L("بدون پروژه", "No project");
})
);
html += breakdownRowsHTML(
L("به تفکیک برچسب (وظایف)", "By tag (tasks)"),
computeTaskBreakdown(function (task) {
return task.tags && task.tags.length ? task.tags.join("، ") : L("بدون برچسب", "No tag");
})
);
}
wrap.innerHTML = html || '<p class="chart-total">' + L("داده‌ای برای تفکیک نیست", "No data to break down") + "</p>";
}
function csvEscape(value) {
const text = String(value == null ? "" : value);
if (/[",\n]/.test(text)) {
return '"' + text.split('"').join('""') + '"';
}
return text;
}
function exportCSV() {
const rows = [];
rows.push(["# ROUTINE CSV EXPORT", window.Calendar.todayKey()]);
rows.push([]);
rows.push(["[tasks]"]);
rows.push(["id", "name", "date", "priority", "done", "project", "tags"]);
window.Store.state.tasks.forEach(function (task) {
const p = task.projectId && window.Store.getProjectById ? window.Store.getProjectById(task.projectId) : null;
rows.push([task.id, task.name, task.date, task.priority, task.done ? 1 : 0, p ? p.name : "", (task.tags || []).join("|")]);
});
rows.push([]);
rows.push(["[habits]"]);
rows.push(["id", "name", "category", "type", "goal", "project", "tags"]);
window.Store.state.habits.forEach(function (habit) {
const p = habit.projectId && window.Store.getProjectById ? window.Store.getProjectById(habit.projectId) : null;
rows.push([habit.id, habit.name, habit.category, habit.type, habit.goal, p ? p.name : "", (habit.tags || []).join("|")]);
});
rows.push([]);
rows.push(["[logs]"]);
rows.push(["date", "habitId", "habitName", "checked", "value", "seconds"]);
Object.keys(window.Store.state.logs)
.sort()
.forEach(function (dateKey) {
const day = window.Store.state.logs[dateKey];
Object.keys(day).forEach(function (habitId) {
const log = day[habitId];
const habit = window.Store.state.habits.find(function (h) {
return String(h.id) === String(habitId);
});
rows.push([dateKey, habitId, habit ? habit.name : "", log.checked ? 1 : 0, log.value || 0, log.seconds || 0]);
});
});
const csv =
"\uFEFF" +
rows
.map(function (row) {
return row.map(csvEscape).join(",");
})
.join("\r\n");
window.Utils.downloadText("routine-export-" + window.Calendar.todayKey() + ".csv", csv, "text/csv");
toast(L("📄 خروجی CSV دانلود شد", "📄 CSV exported"), "success");
}
   
 function render() {
renderRangeBar();
renderStatsGrid();
renderInsights();
    renderBreakdown();
renderWeeklyChart();
renderTrendChart();
    renderIndividualCharts();
renderStorageSize();
renderReportButtons();
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

function exportBackup() {
  const filename = "routine-backup-" + window.Calendar.todayKey() + ".json";
  const data = JSON.stringify(window.Store.exportData(), null, 2);
  window.Utils.downloadText(filename, data, "application/json");
  window.Store.markBackup();
  toast(window.I18N.t("common.backup") + " ✅", "success");
}
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
/* ------------------------------
Print report (P10-3)
------------------------------ */
function renderReportButtons() {
const rc = el("reportCardBtn");
const pr = el("printReportBtn");
if (rc) rc.textContent = "🖼️ " + L("کارت گزارش", "Report card");
if (pr) pr.textContent = "🖨️ " + L("گزارش چاپی (PDF)", "Print report (PDF)");
}
function renderPrintReport() {
const wrap = el("printReport");
if (!wrap) return;
const keys = typeof rangeKeysSafe === "function"
? rangeKeysSafe()
: (function () {
const out = [];
for (let i = 29; i >= 0; i -= 1) out.push(window.Calendar.keyShift(-i));
return out;
})();
const keySet = {};
keys.forEach(function (k) {
keySet[k] = true;
});
const tasks = window.Store.state.tasks.filter(function (t) {
return keySet[t.date];
});
const doneTasks = tasks.filter(function (t) {
return window.Store.isTaskDoneOnDate(t, t.date);
}).length;
let pctSum = 0;
let pctDays = 0;
let activeDays = 0;
keys.forEach(function (key) {
const score = window.Store.dayScore(key);
if (score.total > 0) {
pctSum += score.pct;
pctDays += 1;
}
const day = window.Store.state.logs[key];
if (day && Object.keys(day).length) activeDays += 1;
});
const completion = pctDays ? Math.round((pctSum / pctDays) * 100) : 0;
let html =
"<h1>" + window.I18N.t("app.name") + " — " + L("گزارش بازه", "Range report") + "</h1>" +
"<p>" + L("بازه: ", "Range: ") + window.I18N.faNum(keys.length) + L(" روز تا ", " days up to ") + window.Calendar.keyToJalaliFull(window.Calendar.todayKey()) + "</p>" +
"<h2>" + L("خلاصه", "Summary") + "</h2>" +
"<ul>" +
"<li>" + L("نرخ تکمیل میانگین: ", "Average completion: ") + window.I18N.percent(completion) + "</li>" +
"<li>" + L("روزهای فعال: ", "Active days: ") + window.I18N.faNum(activeDays) + "</li>" +
"<li>" + L("وظایف انجام‌شده: ", "Tasks done: ") + window.I18N.faNum(doneTasks) + " / " + window.I18N.faNum(tasks.length) + "</li>" +
"</ul>" +
"<h2>" + L("عملکرد عادت‌ها", "Habit performance") + "</h2>" +
"<table><thead><tr>" +
"<th>" + window.I18N.t("common.name") + "</th>" +
"<th>" + window.I18N.t("common.category") + "</th>" +
"<th>" + L("انجام", "Done") + "</th>" +
"<th>" + L("روز فعال", "Active days") + "</th>" +
"<th>" + window.I18N.t("stats.completion") + "</th>" +
"</tr></thead><tbody>";
window.Store.state.habits.forEach(function (habit) {
let active = 0;
let done = 0;
keys.forEach(function (key) {
if (!window.Store.habitExistedOn(habit, key)) return;
if (window.Store.habitActiveOn && !window.Store.habitActiveOn(habit, key)) return;
active += 1;
if (window.Store.habitDone(habit, key)) done += 1;
});
if (!active) return;
html +=
"<tr><td>" + window.Utils.escapeHtml(habit.name) + "</td>" +
"<td>" + window.Utils.escapeHtml(window.I18N.t("category." + habit.category)) + "</td>" +
"<td>" + window.I18N.faNum(done) + "</td>" +
"<td>" + window.I18N.faNum(active) + "</td>" +
"<td>" + window.I18N.percent(Math.round((done / active) * 100)) + "</td></tr>";
});
html += "</tbody></table>";
wrap.innerHTML = html;
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
     const printBtn = el("printReportBtn");
if (printBtn) {
printBtn.addEventListener("click", function () {
renderPrintReport();
window.print();
});
}
     const csvBtn = el("csvBtn");
if (csvBtn) {
csvBtn.addEventListener("click", exportCSV);
}
     const reportCardBtn = el("reportCardBtn");
if (reportCardBtn) {
reportCardBtn.addEventListener("click", function () {
if (window.ReportCard) {
window.ReportCard.open();
return;
}
window.Utils.loadScript("assets/js/features/report-card.js").then(function () {
if (window.ReportCard) window.ReportCard.open();
}).catch(function () {
toast(L("بارگذاری ماژول ناموفق بود", "Failed to load the module"), "error");
});
});
}
     const rangeBar = el("statsRange");
if (rangeBar) {
rangeBar.addEventListener("click", function (event) {
const chip = event.target.closest("[data-range]");
if (!chip) return;
const value = chip.dataset.range;
currentRange = value === "year" ? "year" : Math.max(7, parseInt(value, 10) || 7);
render();
});
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
