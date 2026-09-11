/* ================================================================
   ROUTINE — APP.JS
   Main bootstrap:
   - tabs
   - sidebar / mobile nav
   - themes
   - i18n static bindings
   - home dashboard
   - today
   - calendar
   - heatmap
   - tools/help modals
   - keyboard shortcuts
================================================================ */

(function () {
  "use strict";

  let activeTab = "home";
  let clockTimer = null;

  const calView = {
    jy: null,
    jm: null,
    lang: null
  };

  const THEMES = ["aurora", "midnight", "rose", "light"];

  const THEME_ICONS = {
    aurora: "🌌",
    midnight: "🌙",
    rose: "🌸",
    light: "☀️"
  };

  const TABS = ["home", "tasks", "habits", "today", "calendar", "stats"];

  const PRI_KEY = {
    high: "tasks.priorityHigh",
    med: "tasks.priorityMed",
    low: "tasks.priorityLow"
  };

  const PRI_COLOR = {
    high: "var(--danger)",
    med: "var(--warning)",
    low: "var(--text-muted)"
  };

  const PRI_ORDER = {
    high: 0,
    med: 1,
    low: 2
  };
const FEATURE_SCRIPTS = {
pomodoro: "assets/js/features/pomodoro.js",
transfer: "assets/js/features/transfer.js",
share: "assets/js/features/share-card.js",
notes: "assets/js/features/notes.js",
report: "assets/js/features/report-card.js",
game: "assets/js/features/game.js",
wave: "assets/js/features/wave-bg.js",
animated: "assets/js/features/animated-bg.js"
};
let notesRequested = false;
function ensureFeature(key) {
return window.Utils.loadScript(FEATURE_SCRIPTS[key]);
}
function ensureNotes() {
notesRequested = true;
return ensureFeature("notes");
}
function featureLoadFailed() {
if (window.UI && window.UI.toast) {
window.UI.toast(L("بارگذاری ماژول ناموفق بود؛ اتصال اینترنت را بررسی کن.", "Failed to load the module; check your connection."), "error");
}
}
  function el(id) {
    return document.getElementById(id);
  }

  function L(faText, enText) {
    return window.I18N.lang === "en" ? enText : faText;
  }

  function currentTheme() {
    return document.documentElement.getAttribute("data-theme") || "aurora";
  }

  /* ------------------------------
     Theme
  ------------------------------ */

  function updateThemeButtons() {
    const theme = currentTheme();
    const icon = THEME_ICONS[theme] || "🎨";

    const sidebarTheme = el("themeToggle");
    const mobileTheme = el("mobileThemeBtn");

    if (sidebarTheme) {
      const iconEl = sidebarTheme.querySelector(".nav-icon");

      if (iconEl) {
        iconEl.textContent = icon;
      }
    }

    if (mobileTheme) {
      mobileTheme.textContent = icon;
    }

    const meta = document.getElementById("themeColorMeta");

    if (meta) {
      meta.setAttribute(
        "content",
        window.Utils.getCssVar("--theme-color", "#060a14")
      );
    }
  }
function applyAnimationsPref() {
const on = !window.Store || window.Store.state.settings.animations !== false;
document.documentElement.setAttribute("data-animations", on ? "on" : "off");
}
  function applyTheme(theme) {
    if (THEMES.indexOf(theme) === -1) {
      theme = "aurora";
    }

    window.Store.updateSettings({ theme: theme });
    updateThemeButtons();
  }

  function cycleTheme() {
    const current = currentTheme();
    const index = THEMES.indexOf(current);
    const next = THEMES[(index + 1) % THEMES.length];

    applyTheme(next);
  }

  /* ------------------------------
     Sidebar / mobile
  ------------------------------ */

  function sidebarOpen() {
    const sidebar = el("sidebar");
    return !!(sidebar && sidebar.classList.contains("open"));
  }

  function setSidebar(open) {
    const sidebar = el("sidebar");
    const overlay = el("sidebarOverlay");
    const menuBtn = el("mobileMenuBtn");

    if (!sidebar) return;

    sidebar.classList.toggle("open", open);

    if (overlay) {
      overlay.classList.toggle("show", open);
    }

    if (menuBtn) {
      menuBtn.classList.toggle("open", open);
      menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
    }

    document.body.style.overflow = open ? "hidden" : "";
  }

  function closeSidebar() {
    setSidebar(false);
  }

  function toggleSidebar() {
    setSidebar(!sidebarOpen());
  }

  /* ------------------------------
     Tabs
  ------------------------------ */

  function switchTab(tab) {
    if (TABS.indexOf(tab) === -1) {
      tab = "home";
    }

    activeTab = tab;

    document.querySelectorAll(".tab-content").forEach(function (section) {
      section.classList.toggle("active", section.id === "tab-" + tab);
    });

    document.querySelectorAll("[data-tab]").forEach(function (btn) {
      const isActive = btn.dataset.tab === tab;

      btn.classList.toggle("active", isActive);

      if (btn.hasAttribute("aria-selected")) {
        btn.setAttribute("aria-selected", isActive ? "true" : "false");
      }
    });

    const panel = el("tab-" + tab);

    if (panel && typeof panel.focus === "function") {
      panel.focus({ preventScroll: true });
    }

    if (tab === "home") renderHome();
    if (tab === "today") renderToday();
    if (tab === "calendar") renderCalendar();
    if (tab === "stats" && window.Stats) window.Stats.render();
    if (tab === "tasks" && window.Tasks) window.Tasks.render();
    if (tab === "habits" && window.Habits) window.Habits.render();

    closeSidebar();

    try {
      history.replaceState(null, "", "#" + tab);
    } catch (error) {
      // ignore
    }
  }

  /* ------------------------------
     Clock / hero
  ------------------------------ */

  function renderClock() {
    const now = new Date();
    const hour = now.getHours();

    const dateEl = el("heroDate");
    const titleEl = el("heroTitle");
    const subtitleEl = el("heroSubtitle");
    const clockEl = el("heroClock");

    if (dateEl) {
      dateEl.textContent =
        window.Calendar.formatWeekday(now) +
        "، " +
        window.Calendar.formatDate(now);
    }

    if (titleEl) {
      titleEl.textContent = window.I18N.t("hero.greeting") + " 👋";
    }

    if (subtitleEl) {
      if (hour < 5) {
        subtitleEl.textContent = L(
          "🌙 شب‌بخیر — کمی استراحت هم لازم است",
          "🌙 Still up? A little rest helps too"
        );
      } else if (hour < 12) {
        subtitleEl.textContent = L(
          "☀️ صبح‌بخیر — بهترین وقت برای شروع",
          "☀️ Good morning — the best time to start"
        );
      } else if (hour < 17) {
        subtitleEl.textContent = L(
          "🌤️ ظهر بخیر — ادامه بده",
          "🌤️ Good afternoon — keep going"
        );
      } else if (hour < 21) {
        subtitleEl.textContent = L(
          "🌆 عصر بخیر — جمع‌بندی روز",
          "🌆 Good evening — time to wrap up"
        );
      } else {
        subtitleEl.textContent = L(
          "🌙 شب بخیر — یک قدم دیگر مانده",
          "🌙 Good night — one more step to go"
        );
      }
    }

    if (clockEl) {
      const seconds =
        now.getHours() * 3600 +
        now.getMinutes() * 60 +
        now.getSeconds();

      clockEl.textContent = window.Utils.formatTime(seconds);
    }
  }

  /* ------------------------------
     Home dashboard
  ------------------------------ */

  function renderHomeSummary() {
    const box = el("homeSummary");
    if (!box) return;

    const today = window.Calendar.todayKey();

  var todayTasks = window.Store.getTasksForDate(today);
var doneTasks = todayTasks.filter(function (task) {
return window.Store.isTaskDoneOnDate(task, today);
}).length;

   const activeHabits = window.Store.state.habits.filter(function (habit) {
return !window.Store.habitActiveOn || window.Store.habitActiveOn(habit, today);
});

const doneHabits = activeHabits.filter(function (habit) {
return window.Store.habitDone(habit);
}).length;
    const focusSeconds = window.Store.state.habits
      .filter(function (habit) {
        return habit.type === "timer";
      })
      .reduce(function (sum, habit) {
        return sum + window.Store.focusSeconds(habit.id, 1);
      }, 0);

    const bestCurrent = window.Store.state.habits.reduce(function (max, habit) {
      return Math.max(max, window.Store.habitStreaks(habit).current);
    }, 0);

    const items = [
      {
        icon: "✅",
        label: window.I18N.t("nav.tasks"),
        value: window.I18N.faNum(doneTasks) + " / " + window.I18N.faNum(todayTasks.length),
        sub: window.I18N.t("common.today")
      },
      {
        icon: "🔥",
        label: window.I18N.t("nav.habits"),
       value: window.I18N.faNum(doneHabits) + " / " + window.I18N.faNum(activeHabits.length),
        sub: window.I18N.t("common.today")
      },
      {
        icon: "⏱️",
        label: L("زمان تمرکز", "Focus time"),
        value: window.Utils.formatTime(focusSeconds),
        sub: L("امروز", "Today")
      },
      {
        icon: "🏆",
        label: L("استریک فعلی", "Current streak"),
        value: window.I18N.days(bestCurrent),
        sub: L("بهترینِ فعلی", "Current best")
      }
    ];

    box.innerHTML = items
      .map(function (item) {
        return (
          '<div class="summary-card">' +
          '<div class="summary-icon">' + item.icon + "</div>" +
          "<div>" +
          '<div class="summary-label">' + item.label + "</div>" +
          '<div class="summary-value">' + item.value + "</div>" +
          '<div class="summary-sub">' + item.sub + "</div>" +
          "</div>" +
          "</div>"
        );
      })
      .join("");
  }

function renderHomeTaskList() {
var box = el("homeTaskList");
if (!box) return;

var today = window.Calendar.todayKey();
var items = window.Store.getTasksForDate(today).sort(function (a, b) {
var aDone = window.Store.isTaskDoneOnDate(a, today) ? 1 : 0;
var bDone = window.Store.isTaskDoneOnDate(b, today) ? 1 : 0;
return (
(aDone - bDone) ||
((PRI_ORDER[a.priority] == null ? 1 : PRI_ORDER[a.priority]) -
(PRI_ORDER[b.priority] == null ? 1 : PRI_ORDER[b.priority]))
);
}).slice(0, 6);

if (!items.length) {
box.innerHTML =
'<div class="empty-state">' +
'<div class="empty-state-icon">📭</div>' +
'<div class="empty-state-text">' + window.I18N.t("today.tasksEmptyTitle") + "</div>" +
"</div>";
return;
}

box.innerHTML =
'<div class="home-list">' +
items.map(function (task) {
var done = window.Store.isTaskDoneOnDate(task, today);
return (
'<div class="home-row">' +
'<input type="checkbox" class="task-checkbox" data-task-id="' + task.id + '" data-task-date="' + today + '"' +
(done ? " checked" : "") +
' aria-label="' + window.Utils.escapeHtml(task.name) + '">' +
'<span class="main">' + window.Utils.escapeHtml(task.name) + "</span>" +
'<span class="meta">' +
(done ? window.I18N.t("common.done") : window.I18N.t("common.open")) +
"</span>" +
"</div>"
);
}).join("") +
"</div>";
}

  function renderHomeHabitList() {
    const box = el("homeHabitList");
    if (!box) return;

    const habits = window.Store.state.habits.slice(0, 6);

    if (!habits.length) {
      box.innerHTML =
        '<div class="empty-state">' +
        '<div class="empty-state-icon">🔥</div>' +
        '<div class="empty-state-text">' +
        window.I18N.t("habits.emptyTitle") +
        "</div>" +
        "</div>";
      return;
    }

    box.innerHTML =
      '<div class="home-list">' +
      habits
        .map(function (habit) {
          const log = window.Store.getLog(habit.id);
          let value = "";

          if (habit.type === "checkbox") {
            value = log.checked ? "✓" : "○";
          } else if (habit.type === "number") {
            value = window.I18N.faNum(log.value);
          } else {
            value = window.Utils.formatTime(
              window.Store.liveSeconds(habit.id, log)
            );
          }

          return (
            '<div class="home-row">' +
            '<span class="home-habit-icon" style="color:' + habit.color + '">' +
            window.Habits.iconHTML(habit.emoji, 18) +
            "</span>" +
            '<span class="main">' + window.Utils.escapeHtml(habit.name) + "</span>" +
            '<span class="home-pill">' + value + "</span>" +
            "</div>"
          );
        })
        .join("") +
      "</div>";
  }

function renderHomeBars() {
const box = el("homeBars");
if (!box) return;
const week = [];
for (let i = 6; i >= 0; i -= 1) {
week.push(window.Calendar.keyShift(-i));
}
const scores = week.map(function (dateKey) {
return window.Store.dayScore(dateKey);
});
box.innerHTML = week
.map(function (dateKey, index) {
const score = scores[index];
return (
'<div class="home-bar-col">' +
'<div class="home-bar" style="height:' + Math.max(6, Math.round(score.pct * 150)) + 'px"></div>' +
'<div class="home-bar-label">' + window.Calendar.keyToJalaliShort(dateKey) + "</div>" +
"</div>"
);
})
.join("");
const barsSummary = el("homeBarsSummary");
if (barsSummary) {
const avg = Math.round(
(scores.reduce(function (sum, score) {
return sum + score.pct;
}, 0) /
scores.length) *
100
);
barsSummary.textContent = L(
"میانگین تکمیل ۷ روز اخیر: " + window.I18N.percent(avg) + ".",
"Average completion over the last 7 days: " + avg + "%."
);
}
}

  function renderHomeMiniWeek() {
    const box = el("homeMiniWeek");
    if (!box) return;

    const today = window.Calendar.todayKey();
    const week = [];

    for (let i = 6; i >= 0; i -= 1) {
      week.push(window.Calendar.keyShift(-i));
    }

    box.innerHTML = week
      .map(function (dateKey) {
        const score = window.Store.dayScore(dateKey);
        const percent = Math.round(score.pct * 100);
        const isToday = dateKey === today;

        let tone = "";

        if (score.total && !score.future) {
          if (score.pct >= 0.7) tone = "high";
          else if (score.pct >= 0.3) tone = "mid";
          else tone = "low";
        }

        return (
          '<button type="button" class="mini-day' + (isToday ? " today" : "") + '" data-date="' + dateKey + '">' +
          '<span class="mini-day-dot ' + tone + '">' + window.Calendar.keyToJalaliShort(dateKey) + "</span>" +
          "<span>" + window.I18N.percent(percent) + "</span>" +
          "</button>"
        );
      })
      .join("");
  }

  function renderFocusDonut() {
    const box = el("focusDonut");
    if (!box) return;

    const data = window.Store.state.habits
      .filter(function (habit) {
        return habit.type === "timer";
      })
      .map(function (habit) {
        return {
          habit: habit,
          seconds: window.Store.focusSeconds(habit.id, 30)
        };
      })
      .filter(function (item) {
        return item.seconds > 0;
      })
      .sort(function (a, b) {
        return b.seconds - a.seconds;
      });

    const total = data.reduce(function (sum, item) {
      return sum + item.seconds;
    }, 0);

    if (!total) {
      box.innerHTML =
        '<div class="empty-state">' +
        '<div class="empty-state-icon">⏱️</div>' +
        '<div class="empty-state-text">' +
        L("هنوز زمانی ثبت نشده", "No time logged yet") +
        "</div>" +
        '<div class="empty-state-sub">' +
        L(
          "تایمر یک عادت را شروع کن تا نمودار تمرکز ساخته شود.",
          "Start a habit timer to build the focus chart."
        ) +
        "</div>" +
        "</div>";
      return;
    }

    const R = 70;
    const C = 2 * Math.PI * R;

    let offset = 0;
    let segments = "";

    data.forEach(function (item) {
      const fraction = item.seconds / total;

      segments +=
        '<circle cx="90" cy="90" r="' + R + '" fill="none" stroke="' + item.habit.color + '" stroke-width="26" stroke-dasharray="' +
        (fraction * C).toFixed(1) + " " + C.toFixed(1) +
        '" stroke-dashoffset="' + (-offset * C).toFixed(1) + '" transform="rotate(-90 90 90)"></circle>';

      offset += fraction;
    });

    const legend = data
      .map(function (item) {
        return (
          '<div class="fd-item">' +
          '<span class="fd-dot" style="background:' + item.habit.color + '"></span>' +
          '<span class="fd-name">' + window.Utils.escapeHtml(item.habit.name) + "</span>" +
          '<span class="fd-val">' +
          window.I18N.percent(Math.round((item.seconds / total) * 100)) +
          " · " +
          window.I18N.faNum(Math.round(item.seconds / 60)) +
          L(" دقیقه", " min") +
          "</span>" +
          "</div>"
        );
      })
      .join("");

    box.innerHTML =
      '<svg width="180" height="180" viewBox="0 0 180 180" role="img" aria-label="' +
      L("توزیع زمان تمرکز", "Focus time breakdown") +
      '">' +
      segments +
      '<text x="90" y="86" text-anchor="middle" class="progress-text" style="font-size:24px">' +
      window.I18N.faNum((total / 3600).toFixed(1)) +
      "</text>" +
      '<text x="90" y="112" text-anchor="middle" class="progress-label">' +
      L("ساعت در ۳۰ روز", "Hours in 30 days") +
      "</text>" +
      "</svg>" +
'<div class="fd-legend">' + legend + "</div>";
const donutSummary = el("focusDonutSummary");
if (donutSummary) {
donutSummary.textContent = L(
"توزیع زمان تمرکز در ۳۰ روز اخیر: " +
data
.map(function (item) {
return item.habit.name + " " + window.I18N.percent(Math.round((item.seconds / total) * 100));
})
.join("، ") +
"؛ مجموع " +
window.I18N.faNum((total / 3600).toFixed(1)) +
" ساعت.",
"Focus time split over the last 30 days: " +
data
.map(function (item) {
return item.habit.name + " " + Math.round((item.seconds / total) * 100) + "%";
})
.join(", ") +
"; total " +
(total / 3600).toFixed(1) +
" hours."
);
}
}

  function nextStepItem() {
const today = window.Calendar.todayKey();
const openTasks = window.Store.getTasksForDate(today).filter(function (task) {
return !window.Store.isTaskDoneOnDate(task, today);
});
if (openTasks.length) {
return { type: "task", id: openTasks[0].id, name: openTasks[0].name };
}
const openHabits = window.Store.state.habits.filter(function (habit) {
if (window.Store.habitActiveOn && !window.Store.habitActiveOn(habit, today)) return false;
return !window.Store.habitDone(habit);
});
if (openHabits.length) {
return { type: "habit", id: openHabits[0].id, name: openHabits[0].name };
}
return null;
}
function renderNextStep() {
const card = el("nextStepCard");
const label = el("nextStepLabel");
const text = el("nextStepText");
const btn = el("nextStepBtn");
if (!card || !text) return;
if (label) {
label.textContent = L("قدم بعدی", "Next step");
}
const item = nextStepItem();
if (!item) {
card.classList.add("is-done");
text.textContent = L("همهٔ کارهای امروز انجام شد! 🎉", "All done for today! 🎉");
if (btn) btn.style.display = "none";
return;
}
card.classList.remove("is-done");
text.textContent = item.name;
if (btn) {
btn.style.display = "";
btn.dataset.id = item.id;
btn.dataset.type = item.type;
}
}
   
  function renderHome() {
renderNextStep();
renderHomeSummary();
    renderHomeTaskList();
    renderHomeHabitList();
    renderHomeBars();
    renderHomeMiniWeek();
    renderFocusDonut();
  }

  /* ------------------------------
     Today
  ------------------------------ */

  function renderTodayStats() {
    const circle = el("progressCircle");
    const percentText = el("progressPercent");
    const statsBox = el("todayStats");

    if (!circle || !percentText || !statsBox) return;

    const today = window.Calendar.todayKey();
    const score = window.Store.dayScore(today);
    const percent = Math.round(score.pct * 100);

    const circumference = 2 * Math.PI * 60;

    circle.style.strokeDashoffset =
      circumference - (percent / 100) * circumference;

    percentText.textContent = window.I18N.percent(percent);

 var todayTasks = window.Store.getTasksForDate(today);
var doneTasks = todayTasks.filter(function (task) {
return window.Store.isTaskDoneOnDate(task, today);
}).length;

   const activeHabits = window.Store.state.habits.filter(function (habit) {
return !window.Store.habitActiveOn || window.Store.habitActiveOn(habit, today);
});

const doneHabits = activeHabits.filter(function (habit) {
return window.Store.habitDone(habit);
}).length;
    const focusMinutes = Math.round(
      window.Store.state.habits
        .filter(function (habit) {
          return habit.type === "timer";
        })
        .reduce(function (sum, habit) {
          return sum + window.Store.focusSeconds(habit.id, 1);
        }, 0) / 60
    );

    const items = [
      {
        emoji: "📋",
        value: window.I18N.faNum(todayTasks.length),
        label: window.I18N.t("nav.tasks")
      },
      {
        emoji: "✅",
        value: window.I18N.faNum(doneTasks) + " / " + window.I18N.faNum(todayTasks.length),
        label: window.I18N.t("common.done"),
        ok: todayTasks.length > 0 && doneTasks === todayTasks.length
      },
      {
        emoji: "🔥",
        value: window.I18N.faNum(activeHabits.length),
        label: window.I18N.t("nav.habits")
      },
      {
        emoji: "🎯",
        value: window.I18N.faNum(doneHabits) + " / " + window.I18N.faNum(activeHabits.length),
        label: L("کامل شده", "Completed"),
        ok: activeHabits.length > 0 && doneHabits === activeHabits.length
      },
      {
        emoji: "⏱️",
        value: window.I18N.faNum(focusMinutes),
        label: L("دقیقه تمرکز", "Focus minutes")
      }
    ];

    statsBox.innerHTML = items
      .map(function (item) {
        return (
          '<div class="today-stat">' +
          '<div class="today-stat-emoji">' + item.emoji + "</div>" +
          '<div class="today-stat-value' + (item.ok ? " checked" : "") + '">' + item.value + "</div>" +
          '<div class="today-stat-label">' + item.label + "</div>" +
          "</div>"
        );
      })
      .join("");
  }

  function renderToday() {
  renderTodayStats();
  if (window.Tasks) window.Tasks.renderToday();
  if (window.Habits) window.Habits.renderToday();
  if (window.Notes) {
window.Notes.renderToday();
} else if (!notesRequested) {
ensureNotes().then(function () {
if (window.Notes && activeTab === "today") window.Notes.renderToday();
}).catch(function () {});
}
}

  /* ------------------------------
     Calendar
  ------------------------------ */

  function renderCalendar() {
    const grid = el("calendarGrid");
    const monthYear = el("calendarMonthYear");

    if (!grid || !monthYear) return;

    if (calView.jy === null || calView.lang !== window.I18N.lang) {
      const today = window.Calendar.getToday();

      calView.jy = today.jy;
      calView.jm = today.jm;
      calView.lang = window.I18N.lang;
    }

    const jy = calView.jy;
    const jm = calView.jm;

    monthYear.textContent = window.Calendar.formatMonthYear(jy, jm, window.I18N.lang);

    const days = window.Calendar.getDaysInMonth(jy, jm, window.I18N.lang);
    const firstWeekday = window.Calendar.getFirstWeekday(jy, jm, window.I18N.lang);
    const weekdays = window.Calendar.getWeekdays(window.I18N.lang);
    const todayKey = window.Calendar.todayKey();

    let html = weekdays
      .map(function (weekday) {
        return (
          '<div class="weekday-header">' +
          window.Utils.escapeHtml(weekday.slice(0, 3)) +
          "</div>"
        );
      })
      .join("");

    for (let i = 0; i < firstWeekday; i += 1) {
      html += '<div class="calendar-day empty"></div>';
    }

    for (let day = 1; day <= days; day += 1) {
      const dateKey = window.Calendar.toKey(jy, jm, day, window.I18N.lang);
      const score = window.Store.dayScore(dateKey);
      const future = dateKey > todayKey;

      const classes = ["calendar-day"];

      if (future) {
        classes.push("future");
      } else {
        classes.push("work-none");
      }

      if (dateKey === todayKey) {
        classes.push("today");
      }

      if (!future && window.Calendar.isHoliday(jy, jm, day, window.I18N.lang) && score.total === 0) {
        classes.push("holiday");
      }

      const hasHabit =
        !future &&
        window.Store.state.habits.some(function (habit) {
          return (
            window.Store.habitExistedOn(habit, dateKey) &&
            window.Store.habitDone(habit, dateKey)
          );
        });

      const hasTask = window.Store.state.tasks.some(function (task) {
        return task.date === dateKey && task.done;
      });

      html +=
        '<button type="button" class="' + classes.join(" ") + '" data-date="' + dateKey + '" aria-label="' +
        window.Calendar.formatDay(jy, jm, day, window.I18N.lang) +
        '">' +
        "<span>" + window.I18N.faNum(day) + "</span>" +
        '<span class="cd-dots">' +
        (hasHabit ? '<i class="cd-dot" style="background:#38bdf8"></i>' : "") +
        (hasTask ? '<i class="cd-dot" style="background:#fbbf24"></i>' : "") +
        "</span>" +
        "</button>";
    }

    grid.innerHTML = html;

    renderHeatmap();
  }

  function renderHeatmap() {
    const box = el("heatmap");
    if (!box) return;

let html = "";
let activeDays = 0;
let pctSum = 0;
let pctDays = 0;
for (let i = 181; i >= 0; i -= 1) {
const dateKey = window.Calendar.keyShift(-i);
const score = window.Store.dayScore(dateKey);
if (score.total && !score.future) {
pctSum += score.pct;
pctDays += 1;
if (score.pct > 0) activeDays += 1;
}
let style = "";

      if (score.total && !score.future && score.pct > 0) {
        style =
          "background:var(--accent);opacity:" +
          (0.18 + score.pct * 0.82).toFixed(2) +
          ";border-color:transparent";
      }

      html +=
        '<div class="hm-cell" data-date="' + dateKey + '" title="' +
        window.Calendar.keyToJalaliFull(dateKey) +
        " — " +
        window.I18N.percent(Math.round(score.pct * 100)) +
        '"' +
        (style ? ' style="' + style + '"' : "") +
        "></div>";
    }

box.innerHTML = html;
const heatSummary = el("heatmapSummary");
if (heatSummary) {
const avg = pctDays ? Math.round((pctSum / pctDays) * 100) : 0;
heatSummary.textContent = L(
"خلاصهٔ نقشهٔ حرارتی ۶ ماه اخیر: " +
window.I18N.faNum(activeDays) +
" روز فعال؛ میانگین تکمیل روزهای دارای برنامه " +
window.I18N.percent(avg) +
".",
"Heatmap summary for the last 6 months: " +
activeDays +
" active days; average completion on planned days " +
avg +
"%."
);
}
}

  function changeMonth(delta) {
    if (calView.jy === null || calView.lang !== window.I18N.lang) {
      const today = window.Calendar.getToday();

      calView.jy = today.jy;
      calView.jm = today.jm;
      calView.lang = window.I18N.lang;
    }

    calView.jm += delta;

    while (calView.jm > 12) {
      calView.jm -= 12;
      calView.jy += 1;
    }

    while (calView.jm < 1) {
      calView.jm += 12;
      calView.jy -= 1;
    }

    renderCalendar();
  }

  function goToday() {
    const today = window.Calendar.getToday();

    calView.jy = today.jy;
    calView.jm = today.jm;
    calView.lang = window.I18N.lang;

    renderCalendar();
  }

  function openDayModal(dateKey) {
    if (!window.UI || !window.UI.modal) return;

 var dayTasks = window.Store.getTasksForDate(dateKey);

    const dayHabits = window.Store.state.habits
      .filter(function (habit) {
        return window.Store.habitExistedOn(habit, dateKey);
      })
      .map(function (habit) {
        return {
          habit: habit,
          log: window.Store.getLog(habit.id, dateKey)
        };
      })
      .filter(function (item) {
        return (
          item.log.checked ||
          item.log.value > 0 ||
          item.log.seconds > 0 ||
          window.Store.habitDone(item.habit, dateKey)
        );
      });

    const score = window.Store.dayScore(dateKey);

    let html =
      '<div style="text-align:center;margin-bottom:10px">' +
      '<span class="chip">' +
      window.I18N.percent(Math.round(score.pct * 100)) +
      " " +
      L("تکمیل", "done") +
      "</span>" +
      "</div>";

    if (dayTasks.length) {
      html += '<div class="modal-section-title">📋 ' + window.I18N.t("nav.tasks") + "</div>";

      html += dayTasks
.map(function (task) {
var taskDone = window.Store.isTaskDoneOnDate(task, dateKey);
return (
'<div class="modal-item">' +
'<div class="item-left">' +
"<span>" + (taskDone ? "✅" : "⬜") + "</span>" +
            '<span class="item-name' + (task.done ? " done" : "") + '">' +
            window.Utils.escapeHtml(task.name) +
            "</span>" +
            "</div>" +
            '<span class="modal-tag' + (taskDone ? " done" : "") + '">' +
            window.I18N.t(PRI_KEY[task.priority || "med"]) +
            "</span>" +
            "</div>"
          );
        })
        .join("");
    }

    if (dayHabits.length) {
      html += '<div class="modal-section-title">🔥 ' + window.I18N.t("nav.habits") + "</div>";

      html += dayHabits
        .map(function (item) {
          let value = "";

          if (item.habit.type === "checkbox") {
            value = item.log.checked
              ? window.I18N.t("common.done")
              : window.I18N.t("common.pending");
          } else if (item.habit.type === "number") {
            value = window.I18N.faNum(item.log.value);

            if (item.habit.goal > 0) {
              value += " " + window.I18N.t("habits.of") + " " + window.I18N.faNum(item.habit.goal);
            }
          } else {
            value = window.Utils.formatTime(item.log.seconds);
          }

          return (
            '<div class="modal-item">' +
            '<div class="item-left">' +
            '<span style="display:flex;color:' + item.habit.color + '">' +
            window.Habits.iconHTML(item.habit.emoji, 19) +
            "</span>" +
            '<span class="item-name">' + window.Utils.escapeHtml(item.habit.name) + "</span>" +
            "</div>" +
            '<span class="modal-tag' + (window.Store.habitDone(item.habit, dateKey) ? " done" : "") + '">' +
            value +
            "</span>" +
            "</div>"
          );
        })
        .join("");
    }

   if (!dayTasks.length && !dayHabits.length) {
  html +=
    '<div class="empty-state">' +
    '<div class="empty-state-icon">😴</div>' +
    '<div class="empty-state-text">' +
    window.I18N.t("calendar.emptyDay") +
    "</div>" +
    "</div>";
}
html += '<div class="modal-section-title">📝 ' + L("یادداشت", "Note") + "</div>";
html += '<div id="calendarNoteView"></div>';
window.UI.modal.open(window.Calendar.keyToJalaliFull(dateKey), html);
if (window.Notes) {
window.Notes.renderCalendarNote(dateKey);
} else {
ensureNotes().then(function () {
if (window.Notes) window.Notes.renderCalendarNote(dateKey);
}).catch(function () {});
}
  }

  /* ------------------------------
     Tools / Help
  ------------------------------ */

function reminderPermLabel(state) {
if (state === "granted") return window.I18N.t("reminder.permGranted");
if (state === "denied") return window.I18N.t("reminder.permDenied");
if (state === "default") return window.I18N.t("reminder.permDefault");
if (state === "unsupported") return window.I18N.t("reminder.permUnsupported");
return window.I18N.t("reminder.permUnknown");
}
function openToolsModal() {
if (!window.UI || !window.UI.modal) return;
const lang = window.I18N.lang;
const reminder =
window.Store.state.settings.reminder || { enabled: false, time: "20:00" };
const trashSummary = window.Store.getTrashSummary
? window.Store.getTrashSummary()
: { total: 0 };
const trashLabel =
window.I18N.t("trash.title") +
(trashSummary.total ? " (" + window.I18N.faNum(trashSummary.total) + ")" : "");
const permState = window.Reminder ? window.Reminder.permissionState() : "unsupported";
const html =
'<div class="modal-section-title">🌐 ' + window.I18N.t("common.language") + "</div>" +
'<div style="display:flex;gap:8px;margin-bottom:18px">' +
'<button class="btn ' + (lang === "fa" ? "btn-primary" : "btn-ghost") + '" data-action="set-lang" data-lang="fa" style="flex:1">فارسی</button>' +
'<button class="btn ' + (lang === "en" ? "btn-primary" : "btn-ghost") + '" data-action="set-lang" data-lang="en" style="flex:1">English</button>' +
"</div>" +
'<div class="modal-section-title">🔔 ' + window.I18N.t("reminder.title") + "</div>" +
'<div class="modal-item">' +
'<div class="item-left"><label for="reminderToggle" style="cursor:pointer">' + window.I18N.t("reminder.enable") + "</label></div>" +
'<input type="checkbox" id="reminderToggle"' + (reminder.enabled ? " checked" : "") + ' style="width:22px;height:22px;accent-color:var(--accent);cursor:pointer">' +
"</div>" +
'<div class="modal-item">' +
'<div class="item-left"><label for="reminderTime">' + window.I18N.t("reminder.time") + "</label></div>" +
'<input type="time" id="reminderTime" class="input" value="' + reminder.time + '" style="min-height:40px;width:130px">' +
"</div>" +
'<div class="modal-item">' +
'<div class="item-left"><span style="font-size:13px;font-weight:700">' + window.I18N.t("reminder.notification") + "</span></div>" +
'<span id="reminderPermStatus" style="font-size:12px;color:var(--text-3);font-weight:700">' + reminderPermLabel(permState) + "</span>" +
"</div>" +
'<button class="btn btn-ghost btn-sm" data-action="reminder-permission" style="width:100%;margin:4px 0 14px">' + window.I18N.t("reminder.enableNotification") + "</button>" +
'<div class="modal-section-title">⚙️ ' + window.I18N.t("common.tools") + "</div>" +
'<div style="display:grid;gap:8px">' +
'<button class="btn btn-ghost" data-action="open-share">🔥 ' + window.I18N.t("common.streakCard") + "</button>" +
'<button class="btn btn-ghost" data-action="open-trash">🗑️ ' + trashLabel + "</button>" +
'<button class="btn btn-ghost" data-action="backup">📥 ' + window.I18N.t("common.backup") + "</button>" +
'<button class="btn btn-ghost" data-action="restore">📤 ' + window.I18N.t("common.restore") + "</button>" +
'<button class="btn btn-danger" data-action="reset">🗑️ ' + window.I18N.t("common.reset") + "</button>" +
'<button class="btn btn-ghost" data-action="open-transfer">🔗 ' + window.I18N.t("transfer.title") + "</button>" +
'<button class="btn btn-ghost" data-action="open-pomodoro">🍅 ' + window.I18N.t("pomodoro.title") + "</button>" +
'<button class="btn btn-ghost" data-action="open-help">❓ ' + window.I18N.t("common.help") + "</button>" +
'<a class="btn btn-ghost" href="rahnama/">📚 ' + window.I18N.t("common.articles") + "</a>" +
"</div>";
const content = window.UI.modal.open(window.I18N.t("common.tools"), html);
if (!content) return;
const toggle = content.querySelector("#reminderToggle");
const timeInput = content.querySelector("#reminderTime");
if (toggle) {
toggle.addEventListener("change", function () {
const current =
window.Store.state.settings.reminder || { enabled: false, time: "20:00" };
window.Store.updateSettings({
reminder: { enabled: toggle.checked, time: current.time }
});
if (toggle.checked && window.Reminder) {
window.Reminder.requestPermission(function (result) {
const statusEl = document.getElementById("reminderPermStatus");
if (statusEl) statusEl.textContent = reminderPermLabel(result);
});
}
});
ensureFeature("wave").then(function () {
if (window.WaveBg && window.WaveBg.injectIntoToolsModal && document.body.contains(content)) {
window.WaveBg.injectIntoToolsModal(content);
}
}).catch(function () {});
ensureFeature("animated").then(function () {
if (window.AnimatedBg && window.AnimatedBg.injectIntoToolsModal && document.body.contains(content)) {
window.AnimatedBg.injectIntoToolsModal(content);
}
}).catch(function () {});
}
if (timeInput) {
timeInput.addEventListener("change", function () {
const current =
window.Store.state.settings.reminder || { enabled: false, time: "20:00" };
window.Store.updateSettings({
reminder: { enabled: current.enabled, time: timeInput.value || "20:00" }
});
});
}
}
function openHelpModal() {
if (!window.UI || !window.UI.modal) return;
const rows = [
["N", L("وظیفهٔ جدید", "New task")],
["H", L("تب عادت‌ها", "Habits tab")],
["T", L("تغییر پوسته", "Cycle theme")],
["S", L("کارت استریک", "Streak card")],
["L", L("تغییر زبان", "Toggle language")],
["M", L("ابزارها", "Tools")],
["/", L("جستجو", "Search")],
["1-6", L("رفتن به تب‌ها", "Switch tabs")]
];
const html =
'<div class="modal-section-title">⌨️ ' + L("کلیدهای میان‌بر", "Keyboard shortcuts") + "</div>" +
rows.map(function (row) {
return (
'<div class="modal-item">' +
'<div class="item-left"><span class="modal-tag">' + row[0] + "</span></div>" +
'<span class="item-name">' + row[1] + "</span>" +
"</div>"
);
}).join("") +
'<div class="sc-actions" style="margin-top:18px">' +
'<button class="btn btn-ghost" data-action="close-modal">' + window.I18N.t("common.close") + "</button>" +
"</div>";
const content = window.UI.modal.open(window.I18N.t("common.help"), html);
if (!content) return;
const closeBtn = content.querySelector('[data-action="close-modal"]');
if (closeBtn) {
closeBtn.addEventListener("click", function () {
window.UI.modal.close();
});
}
}

/* ------------------------------
Mobile FAB
------------------------------ */
function toggleFabMenu() {
  const fab = el("mobileFab");
  const menu = el("fabMenu");
  if (!fab || !menu) return;
  const isOpen = fab.classList.toggle("open");
  fab.setAttribute("aria-expanded", isOpen ? "true" : "false");
  menu.hidden = !isOpen;
  menu.classList.toggle("open", isOpen);
}

function closeFabMenu() {
  const fab = el("mobileFab");
  const menu = el("fabMenu");
  if (!fab || !menu) return;
  fab.classList.remove("open");
  fab.setAttribute("aria-expanded", "false");
  menu.hidden = true;
  menu.classList.remove("open");
}

function openMobileTaskForm() {
  const formCard = document.querySelector("#tab-tasks .form-card");
  if (formCard) {
    formCard.classList.add("open");
    document.body.style.overflow = "hidden";
    const input = el("taskInput");
    if (input) {
      setTimeout(function () { input.focus(); }, 100);
    }
  }
}

function closeMobileTaskForm() {
  const formCard = document.querySelector("#tab-tasks .form-card");
  if (formCard) {
    formCard.classList.remove("open");
    document.body.style.overflow = "";
  }
}

function openMobileHabitForm() {
  const formCard = document.querySelector("#tab-habits .form-card");
  if (formCard) {
    formCard.classList.add("open");
    document.body.style.overflow = "hidden";
    const input = el("habitName");
    if (input) {
      setTimeout(function () { input.focus(); }, 100);
    }
  }
}

function closeMobileHabitForm() {
  const formCard = document.querySelector("#tab-habits .form-card");
  if (formCard) {
    formCard.classList.remove("open");
    document.body.style.overflow = "";
  }
}
 
  /* ------------------------------
     Render all
  ------------------------------ */

  function renderAll() {
    renderClock();
    renderHome();

    if (window.Tasks) {
      window.Tasks.render();
      window.Tasks.renderHome();
      window.Tasks.renderToday();
    }

    if (window.Habits) {
      window.Habits.renderCatFilters();
      window.Habits.render();
      window.Habits.renderHome();
      window.Habits.renderToday();
    }

    renderToday();

    if (activeTab === "calendar") {
      renderCalendar();
    }

    if (activeTab === "stats" && window.Stats) {
      window.Stats.render();
    }
  }

  /* ------------------------------
     Static translations
  ------------------------------ */

  function setText(selector, key) {
    document.querySelectorAll(selector).forEach(function (node) {
      node.textContent = window.I18N.t(key);
    });
  }

  function setPlaceholder(selector, key) {
    document.querySelectorAll(selector).forEach(function (node) {
      node.setAttribute("placeholder", window.I18N.t(key));
    });
  }

  function setAria(selector, key) {
    document.querySelectorAll(selector).forEach(function (node) {
      node.setAttribute("aria-label", window.I18N.t(key));
    });
  }

  function setOptionText(selectId, value, key) {
    const select = el(selectId);
    if (!select) return;

    const option = select.querySelector('option[value="' + value + '"]');

    if (option) {
      option.textContent = window.I18N.t(key);
    }
  }

  function setHeadingPreserve(selector, key, preserveSelector) {
    document.querySelectorAll(selector).forEach(function (heading) {
      const preserved = preserveSelector
        ? heading.querySelector(preserveSelector)
        : null;

      heading.textContent = window.I18N.t(key) + " ";

      if (preserved) {
        heading.appendChild(preserved);
      }
    });
  }

  function applyStaticTranslations() {
    TABS.forEach(function (tab) {
      setText(
        '[data-tab="' + tab + '"] .nav-label',
        "nav." + tab
      );
    });

    setText("#themeToggle .nav-label", "nav.theme");
    setText('[data-action="menu"] .nav-label', "nav.tools");

    setText(".clock-label", "hero.time");

    /* Tasks */
    setText("#tab-tasks .page-header h2", "tasks.title");
    setText("#tab-tasks .page-header p", "tasks.subtitle");
    setText("#focusTaskInput", "tasks.newBtn");
    setText("#tab-tasks .form-title", "tasks.formTitle");

    setPlaceholder("#taskInput", "tasks.namePlaceholder");
    setAria("#taskInput", "tasks.namePlaceholder");
    setAria("#taskDate", "common.date");
    setAria("#taskPriority", "common.priority");
    setPlaceholder("#taskSearch", "tasks.searchPlaceholder");
    setAria("#taskSearch", "tasks.searchPlaceholder");

    setOptionText("taskPriority", "high", "tasks.priorityHigh");
    setOptionText("taskPriority", "med", "tasks.priorityMed");
    setOptionText("taskPriority", "low", "tasks.priorityLow");

    setText("#addTaskBtn", "common.add");
    setText("#clearDoneBtn", "tasks.clearDone");

    setHeadingPreserve("#tab-tasks .card-header h3", "tasks.listTitle", ".counter");

    const taskFilterKeys = {
      all: "common.all",
      today: "common.today",
      pending: "common.pending",
      overdue: "common.overdue",
      done: "common.done"
    };

    Object.keys(taskFilterKeys).forEach(function (filter) {
      setText(
        '#taskFilters .filter-chip[data-filter="' + filter + '"]',
        taskFilterKeys[filter]
      );
    });

    /* Habits */
    setText("#tab-habits .page-header h2", "habits.title");
    setText("#tab-habits .page-header p", "habits.subtitle");
    setText("#tab-habits .type-badge", "habits.typeNote");
    setText("#tab-habits .form-title", "habits.formTitle");

    setPlaceholder("#habitName", "habits.namePlaceholder");
    setAria("#habitName", "habits.namePlaceholder");
    setAria("#habitCategory", "common.category");
    setAria("#habitType", "common.type");
    setAria("#habitGoal", "common.goal");
    setAria("#habitColor", "common.color");
    setPlaceholder("#habitSearch", "habits.searchPlaceholder");
    setAria("#habitSearch", "habits.searchPlaceholder");

    setOptionText("habitType", "checkbox", "habits.typeCheckbox");
    setOptionText("habitType", "timer", "habits.typeTimer");
    setOptionText("habitType", "number", "habits.typeNumber");

    setText("#addHabitBtn", "common.add");

    const categorySelect = el("habitCategory");

    if (categorySelect) {
      const categories = [
        "health",
        "fitness",
        "learning",
        "work",
        "personal",
        "finance",
        "art",
        "home"
      ];

      const currentValue = categorySelect.value || "health";

      categorySelect.innerHTML = categories
        .map(function (category) {
          return (
            '<option value="' + category + '">' +
            window.I18N.t("category." + category) +
            "</option>"
          );
        })
        .join("");

      categorySelect.value = currentValue;
    }

    setHeadingPreserve("#tab-habits .card-header h3", "habits.myHabits", ".counter");

    /* Today */
    setText("#tab-today .page-header h2", "today.title");
    setText("#tab-today .page-header p", "today.subtitle");

    const todayTasksContainer = el("todayTasks");
    const todayHabitsContainer = el("todayHabits");

    if (todayTasksContainer) {
      const card = todayTasksContainer.closest(".card");

      if (card) {
        const heading = card.querySelector(".card-header h3");

        if (heading) {
          heading.textContent = window.I18N.t("today.tasks");
        }
      }
    }

    if (todayHabitsContainer) {
      const card = todayHabitsContainer.closest(".card");

      if (card) {
        const heading = card.querySelector(".card-header h3");

        if (heading) {
          heading.textContent = window.I18N.t("today.remainingHabits");
        }
      }
    }

    /* Calendar */
    setText("#tab-calendar .page-header h2", "calendar.title");
    setText("#tab-calendar .page-header p", "calendar.subtitle");

    const legend = document.querySelectorAll(".calendar-legend span");

    if (legend[0]) {
      legend[0].innerHTML =
        '<i class="legend-dot" style="background:#38bdf8"></i> ' +
        window.I18N.t("calendar.legendHabit");
    }

    if (legend[1]) {
      legend[1].innerHTML =
        '<i class="legend-dot" style="background:#fbbf24"></i> ' +
        window.I18N.t("calendar.legendTask");
    }

    /* Stats */
    setText("#tab-stats .page-header h2", "stats.title");
    setText("#tab-stats .page-header p", "stats.subtitle");
    setText("#exportBtn", "stats.export");
    setText("#importBtn", "stats.import");
    setText("#resetBtn", "stats.reset");

    const dataInfo = document.querySelector("#tab-stats .data-info");

    if (dataInfo) {
      const strong = dataInfo.querySelector("strong");

      dataInfo.textContent = window.I18N.t("stats.dataInfo") + " ";

      if (strong) {
        dataInfo.appendChild(strong);
      }

      dataInfo.appendChild(
        document.createTextNode(" " + window.I18N.t("stats.dataLocal"))
      );
    }

    /* Landing sections */
    setText(".feedback-section h2", "feedback.title");
    setText(".feedback-note", "feedback.note");

    setPlaceholder(".feedback-form input[type='email']", "feedback.emailPlaceholder");
    setPlaceholder(".feedback-form textarea", "feedback.messagePlaceholder");
    setAria(".feedback-form input[type='email']", "feedback.emailPlaceholder");
    setAria(".feedback-form textarea", "feedback.messagePlaceholder");

    const feedbackOptions = document.querySelectorAll(".feedback-form select option");

    if (feedbackOptions.length >= 3) {
      feedbackOptions[0].textContent = window.I18N.t("feedback.bug");
      feedbackOptions[1].textContent = window.I18N.t("feedback.feature");
      feedbackOptions[2].textContent = window.I18N.t("feedback.general");
    }

    setText(".features-section h2", "landing.features");
   setText(".faq-section h2", "landing.faq");

    /* Auth */
     if (window.WaveBg && window.WaveBg.injectIntoToolsModal) {
var modalContent = document.getElementById("modalContent");
if (modalContent && modalContent.offsetParent !== null) {
window.WaveBg.injectIntoToolsModal(modalContent);
}
}
    if (window.Auth && window.Auth.render) {
      window.Auth.render();
    }
  }

   /* ------------------------------
Trash + backup reminder
------------------------------ */
function maybeShowBackupReminder() {
if (!window.Store || !window.UI || !window.UI.toast) return;

if (!window.Store.backupDue || !window.Store.backupDue(7)) return;

const hasData =
window.Store.state.tasks.length ||
window.Store.state.habits.length ||
Object.keys(window.Store.state.logs || {}).length;

if (!hasData) return;

try {
if (sessionStorage.getItem("pd_backup_reminder_shown")) return;
sessionStorage.setItem("pd_backup_reminder_shown", "1");
} catch (error) {
// ignore
}

window.UI.toast(window.I18N.t("backup.reminder"), "info", {
duration: 7000,
action: {
label: window.I18N.t("backup.reminderAction"),
onClick: function () {
if (window.Stats && window.Stats.exportBackup) {
window.Stats.exportBackup();
}
}
}
});
}

function openHelpModal() {
if (!window.UI || !window.UI.modal) return;
const rows = [
["N", L("وظیفهٔ جدید", "New task")],
["H", L("تب عادت‌ها", "Habits tab")],
["T", L("تغییر پوسته", "Cycle theme")],
["S", L("کارت استریک", "Streak card")],
["L", L("تغییر زبان", "Toggle language")],
["M", L("ابزارها", "Tools")],
["/", L("جستجو", "Search")],
["1-6", L("رفتن به تب‌ها", "Switch tabs")]
];
const html =
'<div class="modal-section-title">⌨️ ' + L("کلیدهای میان‌بر", "Keyboard shortcuts") + "</div>" +
rows.map(function (row) {
return (
'<div class="modal-item">' +
'<div class="item-left"><span class="modal-tag">' + row[0] + "</span></div>" +
'<span class="item-name">' + row[1] + "</span>" +
"</div>"
);
}).join("") +
'<div class="sc-actions" style="margin-top:18px">' +
'<button class="btn btn-ghost" data-action="close-modal">' + window.I18N.t("common.close") + "</button>" +
"</div>";
const content = window.UI.modal.open(window.I18N.t("common.help"), html);
if (!content) return;
const closeBtn = content.querySelector('[data-action="close-modal"]');
if (closeBtn) {
closeBtn.addEventListener("click", function () {
window.UI.modal.close();
});
}
}
   
function openTrashModal() {
if (!window.UI || !window.UI.modal || !window.Store) return;

const trash = window.Store.state.trash || {
tasks: [],
habits: []
};

if (!trash.tasks.length && !trash.habits.length) {
const emptyHtml =
'<div class="empty-state">' +
'<div class="empty-state-icon">🗑️</div>' +
'<div class="empty-state-text">' + window.I18N.t("trash.empty") + "</div>" +
"</div>";

window.UI.modal.open(window.I18N.t("trash.title"), emptyHtml);
return;
}

let html = "";

if (trash.tasks.length) {
html += '<div class="modal-section-title">📋 ' + window.I18N.t("trash.tasks") + "</div>";

html += trash.tasks
.slice()
.sort(function (a, b) {
return (Date.parse(b.deletedAt) || 0) - (Date.parse(a.deletedAt) || 0);
})
.map(function (task) {
return (
'<div class="modal-item">' +
'<div class="item-left">' +
"<span>📋</span>" +
'<span class="item-name">' + window.Utils.escapeHtml(task.name) + "</span>" +
"</div>" +
'<button class="btn btn-ghost btn-sm" data-action="restore-trash-task" data-id="' + task.id + '">' +
window.I18N.t("trash.restore") +
"</button>" +
"</div>"
);
})
.join("");
}

if (trash.habits.length) {
html += '<div class="modal-section-title">🔥 ' + window.I18N.t("trash.habits") + "</div>";

html += trash.habits
.slice()
.sort(function (a, b) {
return (Date.parse(b.deletedAt) || 0) - (Date.parse(a.deletedAt) || 0);
})
.map(function (habit) {
const icon =
window.Habits && window.Habits.iconHTML
? window.Habits.iconHTML(habit.emoji, 18)
: "🔥";

return (
'<div class="modal-item">' +
'<div class="item-left">' +
'<span style="display:flex;color:' + habit.color + '">' + icon + "</span>" +
'<span class="item-name">' + window.Utils.escapeHtml(habit.name) + "</span>" +
"</div>" +
'<button class="btn btn-ghost btn-sm" data-action="restore-trash-habit" data-id="' + habit.id + '">' +
window.I18N.t("trash.restore") +
"</button>" +
"</div>"
);
})
.join("");
}

html +=
'<div class="sc-actions" style="margin-top:18px">' +
'<button class="btn btn-danger" data-action="empty-trash">' +
window.I18N.t("trash.emptyTrash") +
"</button>" +
'<button class="btn btn-ghost" data-action="close-modal">' +
window.I18N.t("common.close") +
"</button>" +
"</div>";

window.UI.modal.open(window.I18N.t("trash.title"), html);
}

function confirmEmptyTrash() {
if (!window.UI || !window.UI.modal) return;

const html =
'<p style="text-align:center;color:var(--text-2);line-height:2">' +
window.I18N.t("trash.confirmEmpty") +
"</p>" +
'<div class="sc-actions" style="margin-top:18px">' +
'<button class="btn btn-danger" data-action="confirm-empty-trash">' +
window.I18N.t("trash.emptyTrash") +
"</button>" +
'<button class="btn btn-ghost" data-action="close-modal">' +
window.I18N.t("common.cancel") +
"</button>" +
"</div>";

window.UI.modal.open(window.I18N.t("trash.emptyTrash"), html);
}
  /* ------------------------------
     Events
  ------------------------------ */

  function bindGlobalClicks() {
    document.addEventListener("click", function (event) {
      const fabMenu = el("fabMenu");
if (
  fabMenu &&
  fabMenu.classList.contains("open") &&
  !event.target.closest("#mobileFab") &&
  !event.target.closest("#fabMenu")
) {
  closeFabMenu();
  return;
}
      const dateTarget = event.target.closest("[data-date]");

      if (
        dateTarget &&
        !event.target.closest("input, select, textarea") &&
        !event.target.closest(".task-checkbox")
      ) {
        openDayModal(dateTarget.dataset.date);
        return;
      }

      const tabButton = event.target.closest("[data-tab]");

      if (tabButton) {
        switchTab(tabButton.dataset.tab);
        return;
      }

      const gotoButton = event.target.closest("[data-goto]");

      if (gotoButton) {
        switchTab(gotoButton.dataset.goto);
        return;
      }

      const actionButton = event.target.closest("[data-action]");

      if (!actionButton) return;

      const action = actionButton.dataset.action;

      if (action === "theme") {
        cycleTheme();
      }

     if (action === "next-step") {
const id = actionButton.dataset.id;
const type = actionButton.dataset.type;
if (type === "task") {
window.Store.toggleTask(id);
} else if (type === "habit") {
const habit = window.Store.state.habits.find(function (item) {
return String(item.id) === String(id);
});
if (habit) {
if (habit.type === "checkbox") {
window.Store.toggleHabitCheck(id);
} else if (habit.type === "number") {
window.Store.bumpHabit(id, 1);
} else {
window.Store.startTimer(id);
}
}
}
renderAll();
return;
}
       
      if (action === "menu") {
        openToolsModal();
      }

      if (action === "set-lang") {
        window.UI.modal.close();
        window.I18N.setLang(actionButton.dataset.lang);
      }

if (action === "open-share") {
window.UI.modal.close();
ensureFeature("share").then(function () {
if (window.ShareCard) window.ShareCard.open();
}).catch(featureLoadFailed);
}
if (action === "open-transfer") {
ensureFeature("transfer").then(function () {
if (window.Transfer && window.Transfer.open) window.Transfer.open();
}).catch(featureLoadFailed);
}
if (action === "open-pomodoro") {
window.UI.modal.close();
ensureFeature("pomodoro").then(function () {
if (window.Pomodoro && window.Pomodoro.open) window.Pomodoro.open();
}).catch(featureLoadFailed);
}
if (action === "search-notes") {
ensureNotes().then(function () {
if (window.Notes) window.Notes.openSearchModal();
}).catch(featureLoadFailed);
}
      if (action === "open-help") {
        window.UI.modal.close();
        openHelpModal();
      }

       if (action === "reminder-permission") {
if (window.Reminder) {
window.Reminder.requestPermission(function (result) {
const statusEl = document.getElementById("reminderPermStatus");
if (statusEl) statusEl.textContent = reminderPermLabel(result);
});
}
}
       
      if (action === "backup") {
        window.UI.modal.close();

        if (window.Stats) {
          window.Stats.exportBackup();
        }
      }

      if (action === "restore") {
        window.UI.modal.close();

        const importFile = el("importFile");

        if (importFile) {
          importFile.click();
        }
      }

      if (action === "reset") {
        window.UI.modal.close();

        const resetBtn = el("resetBtn");

        if (resetBtn) {
          resetBtn.click();
        }
      }

       if (action === "open-trash") {
window.UI.modal.close();
openTrashModal();
return;
}

if (action === "restore-trash-task") {
const id = actionButton.dataset.id;
if (window.Store.restoreTask) {
window.Store.restoreTask(id);
window.UI.modal.close();
openTrashModal();
if (window.UI && window.UI.toast) {
window.UI.toast(window.I18N.t("toast.restored"), "success");
}
if (window.App && window.App.renderAll) {
window.App.renderAll();
}
}
return;
}
if (action === "restore-trash-habit") {
const id = actionButton.dataset.id;
if (window.Store.restoreHabit) {
window.Store.restoreHabit(id);
window.UI.modal.close();
openTrashModal();
if (window.UI && window.UI.toast) {
window.UI.toast(window.I18N.t("toast.restored"), "success");
}
if (window.App && window.App.renderAll) {
window.App.renderAll();
}
}
return;
}

if (action === "empty-trash") {
window.UI.modal.close();
confirmEmptyTrash();
return;
}

if (action === "confirm-empty-trash") {
if (window.Store.emptyTrash) {
window.Store.emptyTrash();
window.UI.modal.close();
openTrashModal();

if (window.UI && window.UI.toast) {
window.UI.toast(window.I18N.t("trash.empty"), "info");
}

if (window.App && window.App.renderAll) {
window.App.renderAll();
}
}
return;
}

      if (action === "close-modal") {
        window.UI.modal.close();
      }
if (action === "fab-toggle") {
  toggleFabMenu();
}
if (action === "fab-task") {
  closeFabMenu();
  openMobileTaskForm();
}
if (action === "fab-habit") {
  closeFabMenu();
  openMobileHabitForm();
}
       if (action === "fab-pomodoro") {
  closeFabMenu();
  if (window.Pomodoro && window.Pomodoro.open) window.Pomodoro.open();
}
    });
  }

  function bindSidebar() {
    const menuBtn = el("mobileMenuBtn");
    const overlay = el("sidebarOverlay");

    if (menuBtn) {
      menuBtn.addEventListener("click", toggleSidebar);
    }

    if (overlay) {
      overlay.addEventListener("click", closeSidebar);
    }
  }

  function bindCalendarToolbar() {
    const prev = el("calPrev");
    const next = el("calNext");
    const todayBtn = el("calToday");

    if (prev) {
      prev.addEventListener("click", function () {
        changeMonth(-1);
      });
    }

    if (next) {
      next.addEventListener("click", function () {
        changeMonth(1);
      });
    }

    if (todayBtn) {
      todayBtn.addEventListener("click", goToday);
    }
  }

  function bindKeyboard() {
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        if (sidebarOpen()) {
          closeSidebar();
        }
        return;
      }

      const modalOverlay = el("modalOverlay");

      if (modalOverlay && modalOverlay.classList.contains("active")) {
        return;
      }

      const target = event.target;

      const typing =
        target &&
        ((target.tagName === "INPUT" &&
          target.type !== "checkbox" &&
          target.type !== "button") ||
          target.tagName === "SELECT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);

      if (typing) return;

      const key = event.key.toLowerCase();

      if (key === "n") {
        event.preventDefault();
        switchTab("tasks");

        const input = el("taskInput");

        if (input) input.focus();
        return;
      }

      if (key === "h") {
        switchTab("habits");
        return;
      }

      if (key === "t") {
        cycleTheme();
        return;
      }

if (key === "s") {
ensureFeature("share").then(function () {
if (window.ShareCard) window.ShareCard.open();
}).catch(featureLoadFailed);
return;
}

      if (key === "l") {
        window.I18N.toggleLang();
        return;
      }

      if (key === "m") {
        openToolsModal();
        return;
      }

      if (key === "/") {
        event.preventDefault();

        const search =
          activeTab === "habits" ? el("habitSearch") : el("taskSearch");

        if (search) search.focus();
        return;
      }

      if (event.key === "?" || event.key === "؟") {
        openHelpModal();
        return;
      }

      if (/^[1-6]$/.test(event.key)) {
        switchTab(TABS[Number(event.key) - 1]);
      }
    });
  }

  function bindLanguageEvents() {
    document.addEventListener("i18n:changed", function (event) {
      const lang = event.detail && event.detail.lang ? event.detail.lang : "fa";

      window.Store.updateSettings({ lang: lang });

      applyStaticTranslations();
      renderAll();

      if (window.Auth && window.Auth.render) {
        window.Auth.render();
      }
    });
  }

  /* ------------------------------
     Init
  ------------------------------ */
function applyAnimationsPref() {
const on = !window.Store || window.Store.state.settings.animations !== false;
document.documentElement.setAttribute("data-animations", on ? "on" : "off");
}
   
function init() {
applyAnimationsPref();
applyTheme(window.Store.state.settings.theme);
window.Store.subscribe(function (action) {
if (action === "settings:update" || action === "import") {
applyAnimationsPref();
}
});

    bindSidebar();
    bindGlobalClicks();
    bindCalendarToolbar();
    bindKeyboard();
    bindLanguageEvents();

    applyStaticTranslations();
    renderAll();
     maybeShowBackupReminder();
   window.Utils.onIdle(function () {
ensureFeature("game").catch(function () {});
ensureFeature("wave").catch(function () {});
ensureFeature("animated").catch(function () {});
});

    clockTimer = setInterval(renderClock, 1000);

  const hash = (location.hash || "").replace("#", "");
const isMobile = window.matchMedia("(max-width: 900px)").matches;
if (TABS.indexOf(hash) !== -1) {
  switchTab(hash);
} else if (isMobile) {
  switchTab("today");
} else {
  switchTab("home");
}
  }

  window.App = {
    renderAll: renderAll,
    switchTab: switchTab,
    renderToday: renderToday,
    renderHome: renderHome,
    openDayModal: openDayModal,
    openToolsModal: openToolsModal,
    openHelpModal: openHelpModal,
cycleTheme: cycleTheme,
toggleFabMenu: toggleFabMenu,
closeFabMenu: closeFabMenu,
openMobileTaskForm: openMobileTaskForm,
closeMobileTaskForm: closeMobileTaskForm,
openMobileHabitForm: openMobileHabitForm,
closeMobileHabitForm: closeMobileHabitForm,
  };

  window.Utils.onDomReady(init);
})();
