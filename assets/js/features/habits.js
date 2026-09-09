/* ================================================================
   ROUTINE — FEATURES / HABITS.JS
================================================================ */

(function () {
  "use strict";

  let initialized = false;
  let tickHandle = null;
  let currentDayKey = window.Calendar ? window.Calendar.todayKey() : "";

  const state = {
    cat: "all",
    query: ""
  };

   let newHabitActiveDays = [0, 1, 2, 3, 4, 5, 6];

const WEEKDAY_SHORT_FA = ["ش", "ی", "د", "س", "چ", "پ", "ج"];
const WEEKDAY_SHORT_EN = ["Sa", "Su", "Mo", "Tu", "We", "Th", "Fr"];

const WEEKDAY_FULL_FA = [
"شنبه",
"یکشنبه",
"دوشنبه",
"سه‌شنبه",
"چهارشنبه",
"پنجشنبه",
"جمعه"
];

const WEEKDAY_FULL_EN = [
"Saturday",
"Sunday",
"Monday",
"Tuesday",
"Wednesday",
"Thursday",
"Friday"
];

  const CATEGORIES = [
    "health",
    "fitness",
    "learning",
    "work",
    "personal",
    "finance",
    "art",
    "home"
  ];

  const DEFAULT_ICON = "target";

  const ICONS = {
    droplet:
      '<path d="M12 3.1c0 0 5.7 6 5.7 9.8A5.7 5.7 0 0 1 12 18.6 5.7 5.7 0 0 1 6.3 12.9C6.3 9.1 12 3.1 12 3.1Z"/><path d="M9.4 13.2a2.7 2.7 0 0 0 2.6 2.7"/>',
    run:
      '<circle cx="15.3" cy="4.7" r="2"/><path d="m7 21 2.9-4.9.6-3.9-2.8 1.7L6.2 18"/><path d="m10.5 12.2 3-3.4 2.4 3.1 3.1 1"/><path d="m6.4 9.7 3.7-2.1 3.4 1.2"/>',
    book:
      '<path d="M4.6 5A2 2 0 0 1 6.6 3H19.4v13.4H6.6a2 2 0 0 0-2 2Z"/><path d="M4.6 18.4a2 2 0 0 0 2 2h12.8"/><path d="M8.4 7.4h7"/><path d="M8.4 10.6h4.6"/>',
    lotus:
      '<path d="M12 4.6c1.9 1.9 2.9 3.9 2.9 6.2 0 2-.9 3.9-2.9 5.5-2-1.6-2.9-3.5-2.9-5.5 0-2.3 1-4.3 2.9-6.2Z"/><path d="M9.1 11.4c-1.9-1.2-3.7-1.6-5.4-1 .4 3.4 3.1 6 8.3 6.6"/><path d="M14.9 11.4c1.9-1.2 3.7-1.6 5.4-1-.4 3.4-3.1 6-8.3 6.6"/>',
    dumbbell:
      '<path d="M4 9.4v5.2"/><path d="M7.2 6.9v10.2"/><path d="M16.8 6.9v10.2"/><path d="M20 9.4v5.2"/><path d="M7.2 12h9.6"/>',
    music:
      '<path d="M9.2 17.4V5.9l10-2v11.5"/><circle cx="6.7" cy="17.6" r="2.6"/><circle cx="16.7" cy="15.6" r="2.6"/>',
    code:
      '<path d="m8.2 8.4-4 3.6 4 3.6"/><path d="m15.8 8.4 4 3.6-4 3.6"/><path d="M13.6 4.6 10.4 19.4"/>',
    food:
      '<path d="M12 8.2c-.9-1.5-2.4-2.3-3.9-2.1C6 6.4 4.6 8.3 4.6 11c0 3.6 2.6 8 4.6 8 .9 0 1.4-.5 2.8-.5s1.9.5 2.8.5c2 0 4.6-4.4 4.6-8 0-2.7-1.4-4.6-3.5-4.9-1.5-.2-3 .6-3.9 2.1Z"/><path d="M12 5.6c0-1.6 1.2-2.9 2.9-3"/>',
    moon:
      '<path d="M20.1 14.6A8.6 8.6 0 0 1 9.4 3.9a8.6 8.6 0 1 0 10.7 10.7Z"/>',
    nosmoke:
      '<circle cx="12" cy="12" r="8.6"/><path d="m6.4 17.6 11.2-11.2"/><path d="M8.4 13.4h7.2"/>',
    wallet:
      '<path d="M4 8.4A2.4 2.4 0 0 1 6.4 6h11a2 2 0 0 1 2 2v.9"/><path d="M4 8.4V16a2.6 2.6 0 0 0 2.6 2.6h10.8a2 2 0 0 0 2-2v-2.1"/><path d="M19.6 10.3h-3.4a1.9 1.9 0 0 0 0 3.8h3.4Z"/>',
    palette:
      '<path d="M12 3.6a8.4 8.4 0 0 0 0 16.8c1.2 0 1.9-.8 1.9-1.7 0-.5-.2-.8-.5-1.1-.3-.3-.5-.7-.5-1.1 0-.9.8-1.7 1.8-1.7h1.7a3.9 3.9 0 0 0 3.9-3.9c0-4-3.8-7.3-8.3-7.3Z"/><circle cx="8.2" cy="10.2" r="1"/><circle cx="11.4" cy="7.3" r="1"/><circle cx="15.3" cy="9.1" r="1"/>',
    broom:
      '<path d="M18.2 4.6 11 11.8"/><path d="M14.4 9.2 6.9 16.7a3.6 3.6 0 0 0-.9 3.6h8.4a3.6 3.6 0 0 0-.9-3.6Z"/><path d="M9.4 14.2v6.1"/><path d="M12.4 14.2v6.1"/>',
    pen:
      '<path d="M4.4 19.6h4L19.9 8.1a2.2 2.2 0 0 0-3.2-3.1L5.2 16.4Z"/><path d="m14.6 6.5 3.2 3.2"/>',
    target:
      '<circle cx="12" cy="12" r="8.4"/><circle cx="12" cy="12" r="4.6"/><circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none"/>',
    sun:
      '<circle cx="12" cy="12" r="4.1"/><path d="M12 2.9v2M12 19.1v2M2.9 12h2M19.1 12h2M5.6 5.6 7 7M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4"/>',
    walk:
      '<circle cx="13.4" cy="4.6" r="2"/><path d="m10 20.4 1.4-5.2 2.2-1.9"/><path d="M11.4 15.2 9.6 11l1.1-3.3 3 1.3 1.4 2.7 2.3.8"/><path d="m14.8 14.4 1.6 6"/>',
    brain:
      '<path d="M12 5.1a2.9 2.9 0 0 0-5.5-1.3A2.7 2.7 0 0 0 4.2 8a3 3 0 0 0 .5 4.4A3 3 0 0 0 6.4 17a2.9 2.9 0 0 0 5.6-.9Z"/><path d="M12 5.1a2.9 2.9 0 0 1 5.5-1.3A2.7 2.7 0 0 1 19.8 8a3 3 0 0 1-.5 4.4A3 3 0 0 1 17.6 17a2.9 2.9 0 0 1-5.6-.9Z"/><path d="M12 16.1v4.3"/>',
    nophone:
      '<rect x="7.4" y="3" width="9.2" height="18" rx="2.4"/><path d="M11 17.9h2"/><path d="m4.8 19.6 14.4-15.2"/>',
    sprout:
      '<path d="M12 20.4v-6.6"/><path d="M12 13.8C12 10.6 9.6 8.2 6.2 8.2c0 3.2 2.4 5.6 5.8 5.6Z"/><path d="M12.4 13.4c0-3.5 2.4-6.1 5.6-6.1 0 3.5-2.4 6.1-5.6 6.1Z"/><path d="M8.4 20.4h7.2"/>',
    bike:
      '<circle cx="5.6" cy="16.4" r="3.5"/><circle cx="18.4" cy="16.4" r="3.5"/><path d="m5.6 16.4 4.2-7h4.4l4.2 7"/><path d="M9.8 9.4 12 16.4"/><path d="M8.6 6.4h3"/>',
    heart:
      '<path d="M12 20.1s-7.6-4.5-7.6-9.6a4.3 4.3 0 0 1 7.6-2.8 4.3 4.3 0 0 1 7.6 2.8c0 5.1-7.6 9.6-7.6 9.6Z"/>',
    coffee:
      '<path d="M4.6 8.4h12v5.8a4.4 4.4 0 0 1-4.4 4.4H9a4.4 4.4 0 0 1-4.4-4.4Z"/><path d="M16.6 10.1h1.5a2.4 2.4 0 0 1 0 4.8h-1.5"/><path d="M7.6 3.4v2.2M11 3.4v2.2M14.4 3.4v2.2"/><path d="M3.4 21h14.4"/>',
    chat:
      '<path d="M20.4 12.4a7.6 7.6 0 0 1-8 7.6 8.7 8.7 0 0 1-3-.5L4.2 21l1.5-4.7a7.4 7.4 0 0 1-1.1-3.9 7.6 7.6 0 0 1 7.8-7.6 7.6 7.6 0 0 1 8 7.6Z"/>',
    star:
      '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
    camera:
      '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2Z"/><circle cx="12" cy="13" r="4"/>',
    film:
      '<rect x="2" y="2" width="20" height="20" rx="2.18"/><path d="M7 2v20"/><path d="M17 2v20"/><path d="M2 12h20"/><path d="M2 7h5"/><path d="M2 17h5"/><path d="M17 17h5"/><path d="M17 7h5"/>',
    zap:
      '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
    smile:
      '<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><path d="M9 9h.01"/><path d="M15 9h.01"/>',
    gift:
      '<path d="M20 12v10H4V12"/><rect x="2" y="7" width="20" height="5"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7Z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7Z"/>',
    globe:
      '<circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z"/>',
    award:
      '<circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>',
    headphones:
      '<path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3ZM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3Z"/>',
    mic:
      '<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><path d="M12 19v4"/><path d="M8 23h8"/>',
    trend:
      '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>',
    users:
      '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    video:
      '<polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>',
    wind:
      '<path d="M9.59 4.59A2 2 0 1 1 11 8H2"/><path d="M17.73 7.73A2.5 2.5 0 1 1 19.5 12H2"/><path d="M12.59 19.41A2 2 0 1 0 14 16H2"/>',
    sunrise:
      '<path d="M17 18a5 5 0 0 0-10 0"/><path d="M12 2v7"/><path d="m4.22 10.22 1.42 1.42"/><path d="M1 18h2"/><path d="M21 18h2"/><path d="m18.36 11.64 1.42-1.42"/><path d="M23 22H1"/><path d="m8 6 4-4 4 4"/>',
    map:
      '<polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><path d="M8 2v16"/><path d="M16 6v16"/>'
  };

  const ICON_LIST = [
    ["droplet", "آب"],
    ["run", "دویدن"],
    ["book", "مطالعه"],
    ["lotus", "مراقبه"],
    ["dumbbell", "وزنه"],
    ["music", "موسیقی"],
    ["code", "کدنویسی"],
    ["food", "تغذیه"],
    ["moon", "خواب"],
    ["nosmoke", "ترک سیگار"],
    ["wallet", "پس‌انداز"],
    ["palette", "نقاشی"],
    ["broom", "نظافت"],
    ["pen", "نوشتن"],
    ["target", "هدف"],
    ["sun", "صبح زود"],
    ["walk", "پیاده‌روی"],
    ["brain", "تمرکز"],
    ["nophone", "بی‌گوشی"],
    ["sprout", "گیاه"],
    ["bike", "دوچرخه"],
    ["heart", "سلامتی"],
    ["coffee", "قهوه"],
    ["chat", "ارتباط"],
    ["star", "ستاره"],
    ["camera", "عکاسی"],
    ["film", "فیلم"],
    ["zap", "انرژی"],
    ["smile", "حال خوب"],
    ["gift", "بخشش"],
    ["globe", "زبان خارجی"],
    ["award", "موفقیت"],
    ["headphones", "پادکست"],
    ["mic", "ضبط صدا"],
    ["trend", "رشد"],
    ["users", "دوستان"],
    ["video", "ویدیو"],
    ["wind", "تنفس عمیق"],
    ["sunrise", "طلوع"],
    ["map", "سفر"]
  ];

  const LEGACY_ICON_MAP = {
    "💧": "droplet",
    "🏃": "run",
    "📖": "book",
    "📚": "book",
    "🧘": "lotus",
    "🙏": "lotus",
    "💪": "dumbbell",
    "🎸": "music",
    "🎧": "music",
    "💻": "code",
    "🍎": "food",
    "🥗": "food",
    "😴": "moon",
    "🛏️": "moon",
    "🛏": "moon",
    "🚭": "nosmoke",
    "💰": "wallet",
    "🎨": "palette",
    "🧹": "broom",
    "📝": "pen",
    "✍️": "pen",
    "✍": "pen",
    "🎯": "target",
    "☀️": "sun",
    "☀": "sun",
    "🚶": "walk",
    "🧠": "brain",
    "📵": "nophone",
    "🌱": "sprout",
    "🚴": "bike",
    "❤️": "heart",
    "❤": "heart",
    "☕": "coffee",
    "💬": "chat"
  };

  function el(id) {
    return document.getElementById(id);
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
      renderHome();
      renderToday();
      renderCatFilters();
    }
  }

  function categoryLabel(cat) {
    return window.I18N.t("category." + cat);
  }

  function normalizeIcon(value) {
    if (ICONS[value]) return value;
    if (LEGACY_ICON_MAP[value]) return LEGACY_ICON_MAP[value];
    return DEFAULT_ICON;
  }

  function iconHTML(value, size) {
    size = size || 22;
    const key = normalizeIcon(value);

    if (ICONS[key]) {
      return (
        '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        ICONS[key] +
        "</svg>"
      );
    }

    return (
      '<span style="font-size:' + Math.round(size * 1.08) + 'px;line-height:1">' +
      window.Utils.escapeHtml(value || "") +
      "</span>"
    );
  }

  function buildCategoryOptions() {
    const select = el("habitCategory");
    if (!select) return;

    select.innerHTML = CATEGORIES.map(function (cat) {
      return '<option value="' + cat + '">' + categoryLabel(cat) + "</option>";
    }).join("");

    select.value = "health";
  }

   function weekdayShort(index) {
return window.I18N.lang === "en"
? WEEKDAY_SHORT_EN[index]
: WEEKDAY_SHORT_FA[index];
}

function fullWeekdayLabel(index) {
return window.I18N.lang === "en"
? WEEKDAY_FULL_EN[index]
: WEEKDAY_FULL_FA[index];
}

function activeDaysMetaHTML(habit) {
if (
!Array.isArray(habit.activeDays) ||
habit.activeDays.length === 0 ||
habit.activeDays.length === 7
) {
return "";
}

const separator = window.I18N.lang === "fa" ? "، " : ", ";

const labels = habit.activeDays
.map(function (day) {
return weekdayShort(day);
})
.join(separator);

return "<span>🗓️ " + window.Utils.escapeHtml(labels) + "</span>";
}

function renderNewActiveDays() {
const box = el("habitActiveDays");
if (!box) return;

box.innerHTML = [0, 1, 2, 3, 4, 5, 6]
.map(function (day) {
const active = newHabitActiveDays.indexOf(day) !== -1;

return (
'<button type="button" class="weekday-chip' +
(active ? " active" : "") +
'" data-day="' + day +
'" aria-pressed="' + active +
'" title="' + window.Utils.escapeHtml(fullWeekdayLabel(day)) + '">' +
window.Utils.escapeHtml(weekdayShort(day)) +
"</button>"
);
})
.join("");
}

function toggleNewActiveDay(day) {
const index = newHabitActiveDays.indexOf(day);

if (index === -1) {
newHabitActiveDays.push(day);
newHabitActiveDays.sort(function (a, b) {
return a - b;
});
} else {
if (newHabitActiveDays.length === 1) {
return;
}

newHabitActiveDays.splice(index, 1);
}

renderNewActiveDays();
}

function initActiveDaysPicker() {
const form = el("habitForm");

if (!form || el("habitActiveDays")) return;

const block = document.createElement("div");
block.className = "active-days-block";

block.innerHTML =
"<label>" + window.I18N.t("habits.activeDaysTitle") + "</label>" +
'<div id="habitActiveDays" class="weekday-picker" role="group" aria-label="' +
window.I18N.t("habits.activeDaysTitle") +
'"></div>' +
'<p class="form-hint">' +
window.I18N.t("habits.activeDaysHint") +
"</p>";

form.insertAdjacentElement("afterend", block);

const box = el("habitActiveDays");

if (box) {
box.addEventListener("click", function (event) {
const chip = event.target.closest(".weekday-chip");
if (!chip) return;

toggleNewActiveDay(Number(chip.dataset.day));
});
}

renderNewActiveDays();
}

  function initIconPicker() {
    const btn = el("habitIconBtn");
    const pop = el("habitIconPop");
    const hidden = el("habitEmoji");

    if (!btn || !pop || !hidden) return;

    hidden.value = normalizeIcon(hidden.value || DEFAULT_ICON);

    pop.innerHTML = ICON_LIST.map(function (item) {
      const id = item[0];
      const label = item[1];

      return (
        '<button type="button" class="icon-opt" role="option" data-icon="' + id + '" aria-selected="false" title="' + label + '">' +
        iconHTML(id, 19) +
        "</button>"
      );
    }).join("");

    function paint() {
      btn.innerHTML = iconHTML(hidden.value, 22);

      pop.querySelectorAll(".icon-opt").forEach(function (option) {
        option.setAttribute(
          "aria-selected",
          option.dataset.icon === hidden.value ? "true" : "false"
        );
      });
    }

    function close() {
      pop.classList.remove("open");
      btn.setAttribute("aria-expanded", "false");
    }

    btn.addEventListener("click", function (event) {
      event.stopPropagation();

      const isOpen = pop.classList.toggle("open");
      btn.setAttribute("aria-expanded", isOpen ? "true" : "false");

      if (isOpen) {
        const selected =
          pop.querySelector('[aria-selected="true"]') || pop.firstElementChild;

        if (selected) selected.focus();
      }
    });

    pop.addEventListener("click", function (event) {
      const option = event.target.closest(".icon-opt");
      if (!option) return;

      hidden.value = option.dataset.icon;
      paint();
      close();
      btn.focus();
    });

    pop.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        event.stopPropagation();
        close();
        btn.focus();
      }
    });

    document.addEventListener("click", function (event) {
      if (!event.target.closest("#habitIconPicker")) {
        close();
      }
    });

    window.resetHabitIconPicker = function () {
      hidden.value = DEFAULT_ICON;
      paint();
    };

    paint();
  }

function add() {
const nameInput = el("habitName");
const name = window.Utils.sanitizeText(nameInput ? nameInput.value : "", 80);

if (!name) {
toast(window.I18N.t("toast.enterHabitName"), "error");
if (nameInput) nameInput.focus();
return;
}

window.Store.addHabit({
name: name,
emoji: el("habitEmoji") ? el("habitEmoji").value : DEFAULT_ICON,
category: el("habitCategory") ? el("habitCategory").value : "personal",
type: el("habitType") ? el("habitType").value : "checkbox",
goal: parseFloat(el("habitGoal") ? el("habitGoal").value : 0) || 0,
color: el("habitColor") ? el("habitColor").value : "#8b5cf6",
activeDays: newHabitActiveDays.slice()
});

if (nameInput) nameInput.value = "";
if (el("habitGoal")) el("habitGoal").value = "";

if (window.resetHabitIconPicker) {
window.resetHabitIconPicker();
}

newHabitActiveDays = [0, 1, 2, 3, 4, 5, 6];
renderNewActiveDays();

renderCatFilters();
refreshAll();

toast(window.I18N.t("toast.habitAdded"), "success");
toast(window.I18N.t("toast.habitAdded"), "success");
if (window.App && window.App.closeMobileHabitForm) {
  window.App.closeMobileHabitForm();
}
}

  function toggleCheck(id) {
    const checked = window.Store.toggleHabitCheck(id);
    refreshAll();

    if (checked) {
      toast(window.I18N.t("toast.nice"), "success");
    }
  }

  function setValue(id, value) {
    window.Store.setHabitValue(id, value);
    refreshAll();
  }

  function bump(id, delta) {
    window.Store.bumpHabit(id, delta);
    refreshAll();
  }

  function startTimer(id) {
    window.Store.startTimer(id);
    ensureTick();
    refreshAll();
    toast(window.I18N.t("toast.timerStarted"), "success");
  }

  function stopTimer(id) {
    window.Store.stopTimer(id);
    ensureTick();
    refreshAll();
    toast(window.I18N.t("toast.saved"), "success");
  }

  function remove(id) {
    const habit = window.Store.state.habits.find(function (item) {
      return String(item.id) === String(id);
    });

    if (!habit || !window.UI || !window.UI.modal) return;

    const html =
      '<p style="text-align:center;color:var(--text-2);line-height:2">' +
      "<strong>" + window.Utils.escapeHtml(habit.name) + "</strong><br>" +
      window.I18N.t("modal.deleteHabitDesc") +
      "</p>" +
      '<div class="sc-actions" style="margin-top:18px">' +
      '<button class="btn btn-danger" data-action="confirm-delete-habit" data-id="' + habit.id + '">' +
      window.I18N.t("modal.yesDelete") +
      "</button>" +
      '<button class="btn btn-ghost" data-action="close-modal">' +
      window.I18N.t("common.cancel") +
      "</button>" +
      "</div>";

    const content = window.UI.modal.open(window.I18N.t("modal.deleteHabit"), html);
    if (!content) return;

    const confirmBtn = content.querySelector('[data-action="confirm-delete-habit"]');
    const cancelBtn = content.querySelector('[data-action="close-modal"]');

    if (confirmBtn) {
      confirmBtn.addEventListener("click", function () {
        const snap = window.Store.snapshot();

        window.Store.deleteHabit(id);
        window.UI.modal.close();
        renderCatFilters();
        refreshAll();

        toast(window.I18N.t("toast.habitDeleted"), "undo", {
          action: {
            label: window.I18N.t("common.restore"),
            onClick: function () {
              window.Store.restoreSnapshot(snap);
              renderCatFilters();
              refreshAll();
              toast(window.I18N.t("toast.restored"), "success");
            }
          }
        });
      });
    }

    if (cancelBtn) {
      cancelBtn.addEventListener("click", function () {
        window.UI.modal.close();
      });
    }
  }

  function edit(id) {
    const habit = window.Store.state.habits.find(function (item) {
      return String(item.id) === String(id);
    });

    if (!habit || !window.UI || !window.UI.modal) return;

    const selectedIcon = normalizeIcon(habit.emoji);

    const html =
      '<div class="form-row">' +
      '<label for="ehName">' + window.I18N.t("common.name") + "</label>" +
      '<input id="ehName" class="input" maxlength="80" value="' + window.Utils.escapeHtml(habit.name) + '">' +
      "</div>" +
      '<div class="form-grid">' +
      '<div class="form-row">' +
      '<label for="ehCat">' + window.I18N.t("common.category") + "</label>" +
      '<select id="ehCat" class="input">' +
      CATEGORIES.map(function (cat) {
        return (
          '<option value="' + cat + '"' +
          (habit.category === cat ? " selected" : "") +
          ">" +
          categoryLabel(cat) +
          "</option>"
        );
      }).join("") +
      "</select>" +
      "</div>" +
      '<div class="form-row">' +
      '<label for="ehGoal">' +
      window.I18N.t("common.goal") +
      (habit.type === "timer" ? " (min)" : "") +
      "</label>" +
      '<input id="ehGoal" type="number" min="0" step="0.5" class="input" value="' +
      (habit.goal || "") +
      '" placeholder="' + window.I18N.t("common.optional") + '">' +
      "</div>" +
      '<div class="form-row">' +
      '<label for="ehColor">' + window.I18N.t("common.color") + "</label>" +
      '<input id="ehColor" type="color" class="input" value="' + habit.color + '">' +
      "</div>" +
      "</div>" +
      '<div class="form-row">' +
      "<label>" + window.I18N.t("common.icon") + "</label>" +
      '<div class="icon-picker-pop open" id="ehIcons" role="listbox" style="position:static;display:grid;width:100%;max-height:220px"></div>' +
      "</div>" +
       '<div class="form-row" style="flex-direction:column;align-items:stretch;gap:8px">' +
"<label>" + window.I18N.t("habits.activeDaysTitle") + "</label>" +
'<div id="ehActiveDays" class="weekday-picker" role="group" aria-label="' +
window.I18N.t("habits.activeDaysTitle") +
'"></div>' +
"</div>" +
      '<input type="hidden" id="ehEmoji" value="' + selectedIcon + '">' +
      '<button class="btn btn-primary" data-action="save-habit-edit" data-id="' + habit.id + '" style="width:100%;margin-top:12px">' +
      window.I18N.t("common.save") +
      "</button>";

    const content = window.UI.modal.open(window.I18N.t("modal.editHabit"), html);
    if (!content) return;

    const nameInput = content.querySelector("#ehName");
    const catSelect = content.querySelector("#ehCat");
    const goalInput = content.querySelector("#ehGoal");
    const colorInput = content.querySelector("#ehColor");
    const hiddenIcon = content.querySelector("#ehEmoji");
    const iconGrid = content.querySelector("#ehIcons");
    const saveBtn = content.querySelector('[data-action="save-habit-edit"]');

     let selectedDays =
Array.isArray(habit.activeDays) && habit.activeDays.length
? habit.activeDays.slice()
: [0, 1, 2, 3, 4, 5, 6];

function renderEditActiveDays() {
const grid = content.querySelector("#ehActiveDays");
if (!grid) return;

grid.innerHTML = [0, 1, 2, 3, 4, 5, 6]
.map(function (day) {
const active = selectedDays.indexOf(day) !== -1;

return (
'<button type="button" class="weekday-chip' +
(active ? " active" : "") +
'" data-day="' + day +
'" aria-pressed="' + active +
'" title="' + window.Utils.escapeHtml(fullWeekdayLabel(day)) + '">' +
window.Utils.escapeHtml(weekdayShort(day)) +
"</button>"
);
})
.join("");
}

const activeDaysGrid = content.querySelector("#ehActiveDays");

if (activeDaysGrid) {
activeDaysGrid.addEventListener("click", function (event) {
const chip = event.target.closest(".weekday-chip");
if (!chip) return;

const day = Number(chip.dataset.day);
const index = selectedDays.indexOf(day);

if (index === -1) {
selectedDays.push(day);
selectedDays.sort(function (a, b) {
return a - b;
});
} else {
if (selectedDays.length === 1) {
return;
}

selectedDays.splice(index, 1);
}

renderEditActiveDays();
});

renderEditActiveDays();
}

    if (iconGrid) {
      iconGrid.innerHTML = ICON_LIST.map(function (item) {
        const iconId = item[0];

        return (
          '<button type="button" class="icon-opt" role="option" data-icon="' + iconId + '" aria-selected="' +
          (iconId === selectedIcon ? "true" : "false") + '">' +
          iconHTML(iconId, 19) +
          "</button>"
        );
      }).join("");

      iconGrid.addEventListener("click", function (event) {
        const option = event.target.closest(".icon-opt");
        if (!option) return;

        hiddenIcon.value = option.dataset.icon;

        iconGrid.querySelectorAll(".icon-opt").forEach(function (item) {
          item.setAttribute("aria-selected", item === option ? "true" : "false");
        });
      });
    }

    if (nameInput) nameInput.focus();

    if (saveBtn) {
      saveBtn.addEventListener("click", function () {
        const name = window.Utils.sanitizeText(nameInput ? nameInput.value : "", 80);

        if (!name) {
          toast(window.I18N.t("toast.enterHabitName"), "error");
          if (nameInput) nameInput.focus();
          return;
        }

     window.Store.updateHabit(id, {
name: name,
category: catSelect ? catSelect.value : habit.category,
goal: parseFloat(goalInput ? goalInput.value : 0) || 0,
color: colorInput ? colorInput.value : habit.color,
emoji: hiddenIcon ? hiddenIcon.value : habit.emoji,
activeDays: selectedDays.slice()
});
        window.UI.modal.close();
        renderCatFilters();
        refreshAll();
        toast(window.I18N.t("toast.saved"), "success");
      });
    }
  }

  function habitRowHTML(habit) {
    const log = window.Store.getLog(habit.id);
    const running = window.Store.isRunning(habit.id);
    const streaks = window.Store.habitStreaks(habit);
    const progress = window.Store.habitProgress(habit);
    const doneToday = progress >= 1;

    let controls = "";

    if (habit.type === "checkbox") {
      controls =
        '<button class="habit-check-btn' + (log.checked ? " checked" : "") + '" data-action="toggle-habit-check" data-id="' + habit.id + '">' +
        (log.checked ? window.I18N.t("habits.done") : window.I18N.t("habits.notDone")) +
        "</button>";
    } else if (habit.type === "number") {
      controls =
        '<button class="btn-icon" data-action="bump-habit" data-id="' + habit.id + '" data-delta="-1" aria-label="−">−</button>' +
        '<input type="number" class="habit-input" data-habit-input data-id="' + habit.id + '" value="' + log.value + '" min="0" step="0.5" aria-label="' + window.Utils.escapeHtml(habit.name) + '">' +
        '<button class="btn-icon" data-action="bump-habit" data-id="' + habit.id + '" data-delta="1" aria-label="+">+</button>' +
        (habit.goal > 0
          ? '<span class="habit-label">' + window.I18N.t("habits.of") + " " + window.I18N.faNum(habit.goal) + "</span>"
          : "");
    } else {
      controls =
        '<div class="habit-timer-display' + (running ? " pulsing" : "") + '" data-timer-id="' + habit.id + '">' +
        window.Utils.formatTime(window.Store.liveSeconds(habit.id, log)) +
        "</div>" +
        '<button class="btn ' + (running ? "btn-danger" : "btn-success") + ' btn-sm" data-action="' +
        (running ? "stop-timer" : "start-timer") +
        '" data-id="' + habit.id + '">' +
        (running ? window.I18N.t("habits.stop") : window.I18N.t("habits.start")) +
        "</button>" +
        (habit.goal > 0
          ? '<span class="habit-label">' +
            window.I18N.t("habits.goalMinutes", { goal: window.I18N.faNum(habit.goal) }) +
            "</span>"
          : "");
    }

    const streakHTML =
      streaks.current > 0
        ? '<span class="streak-badge">🔥 ' + window.I18N.days(streaks.current) + "</span>"
        : '<span class="streak-badge cold">' + window.I18N.t("habits.streakStart") + "</span>";

    return (
      '<div class="habit-row' + (running ? " active" : "") + (doneToday ? " done-today" : "") + '" style="--habit-color:' + habit.color + '">' +
      '<div class="habit-info">' +
      '<div class="habit-icon" style="color:' + habit.color + '">' + iconHTML(habit.emoji, 24) + "</div>" +
      '<div style="flex:1;min-width:0">' +
      '<div class="habit-name">' + window.Utils.escapeHtml(habit.name) + "</div>" +
      '<div class="habit-meta">' +
      '<span style="color:' + habit.color + '">●</span> ' +
     window.Utils.escapeHtml(categoryLabel(habit.category)) +
activeDaysMetaHTML(habit) +
streakHTML +
      (streaks.best > 0
        ? "<span>" + window.I18N.t("habits.record") + " " + window.I18N.faNum(streaks.best) + "</span>"
        : "") +
      "</div>" +
      (habit.goal > 0
        ? '<div class="goal-bar"><span data-goalbar-id="' + habit.id + '" style="width:' +
          Math.round(progress * 100) +
          "%;background:" + habit.color + '"></span></div>'
        : "") +
      "</div>" +
      "</div>" +
      '<div class="habit-controls">' +
      controls +
      '<button class="btn-icon" data-action="edit-habit" data-id="' + habit.id + '" aria-label="' + window.I18N.t("common.edit") + '">✏️</button>' +
      '<button class="btn-icon danger" data-action="delete-habit" data-id="' + habit.id + '" aria-label="' + window.I18N.t("common.delete") + '">🗑️</button>' +
      "</div>" +
      "</div>"
    );
  }

  function renderCatFilters() {
    const bar = el("habitFilters");
    if (!bar) return;

    const cats = [];

    window.Store.state.habits.forEach(function (habit) {
      if (cats.indexOf(habit.category) === -1) {
        cats.push(habit.category);
      }
    });

    let html =
      '<button class="filter-chip' + (state.cat === "all" ? " active" : "") + '" data-cat="all">' +
      window.I18N.t("common.all") +
      "</button>";

    html += cats
      .map(function (cat) {
        return (
          '<button class="filter-chip' + (state.cat === cat ? " active" : "") + '" data-cat="' + cat + '">' +
          window.Utils.escapeHtml(categoryLabel(cat)) +
          "</button>"
        );
      })
      .join("");

    bar.innerHTML = html;
  }

  function render() {
    const list = el("habitList");
    if (!list) return;

    let items = window.Store.state.habits.slice();

    if (state.query) {
      items = items.filter(function (habit) {
        return habit.name.toLowerCase().includes(state.query);
      });
    }

    if (state.cat !== "all") {
      items = items.filter(function (habit) {
        return habit.category === state.cat;
      });
    }

   const activeHabits = window.Store.state.habits.filter(function (habit) {
return !window.Store.habitActiveOn || window.Store.habitActiveOn(habit, window.Calendar.todayKey());
});

const doneCount = activeHabits.filter(function (habit) {
return window.Store.habitDone(habit);
}).length;

const counter = el("habitCounter");

if (counter) {
counter.textContent =
window.I18N.faNum(doneCount) + " / " + window.I18N.faNum(activeHabits.length);
}

    if (!items.length) {
      list.innerHTML =
        '<div class="empty-state">' +
        '<div class="empty-state-icon">🔥</div>' +
        '<div class="empty-state-text">' + window.I18N.t("habits.emptyTitle") + "</div>" +
        '<div class="empty-state-sub">' + window.I18N.t("habits.emptySub") + "</div>" +
        "</div>";
      return;
    }

    list.innerHTML = items.map(habitRowHTML).join("");
    ensureTick();
  }

  function renderHome() {
    const box = el("homeHabitList");
    if (!box) return;

    const habits = window.Store.state.habits;

    if (!habits.length) {
      box.innerHTML =
        '<div class="empty-state">' +
        '<div class="empty-state-icon">🔥</div>' +
        '<div class="empty-state-text">' + window.I18N.t("habits.emptyTitle") + "</div>" +
        '<div class="empty-state-sub">' + window.I18N.t("habits.emptySub") + "</div>" +
        "</div>";
      return;
    }

    box.innerHTML =
      '<div class="home-list">' +
      habits
        .slice(0, 6)
        .map(function (habit) {
          const log = window.Store.getLog(habit.id);
          let value = "";

          if (habit.type === "checkbox") {
            value = log.checked ? "✓" : "○";
          } else if (habit.type === "number") {
            value = window.I18N.faNum(log.value);
          } else {
            value = window.Utils.formatTime(window.Store.liveSeconds(habit.id, log));
          }

          return (
            '<div class="home-row">' +
            '<span class="home-habit-icon" style="color:' + habit.color + '">' +
            iconHTML(habit.emoji, 18) +
            "</span>" +
            '<span class="main">' + window.Utils.escapeHtml(habit.name) + "</span>" +
            '<span class="home-pill">' + value + "</span>" +
            "</div>"
          );
        })
        .join("") +
      "</div>";
  }

  function renderToday() {
    const box = el("todayHabits");
    if (!box) return;

    const habits = window.Store.state.habits;

    if (!habits.length) {
      box.innerHTML =
        '<div class="empty-state">' +
        '<div class="empty-state-icon">🔥</div>' +
        '<div class="empty-state-text">' + window.I18N.t("today.noHabits") + "</div>" +
        "</div>";
      return;
    }

   const remaining = habits.filter(function (habit) {
if (
window.Store.habitActiveOn &&
!window.Store.habitActiveOn(habit, window.Calendar.todayKey())
) {
return false;
}

return !window.Store.habitDone(habit);
});
    if (!remaining.length) {
      box.innerHTML =
        '<div class="empty-state">' +
        '<div class="empty-state-icon">🏆</div>' +
        '<div class="empty-state-text">' + window.I18N.t("today.allHabitsDone") + "</div>" +
        "</div>";
      return;
    }

    box.innerHTML = remaining.map(habitRowHTML).join("");
    ensureTick();
  }

  function ensureTick() {
    if (tickHandle) return;

    tickHandle = setInterval(function () {
      let anyRunning = false;

      window.Store.state.habits.forEach(function (habit) {
        if (habit.type !== "timer") return;

        const running = window.Store.isRunning(habit.id);
        if (!running) return;

        anyRunning = true;

        const log = window.Store.getLog(habit.id);
        const timerEl = document.querySelector('[data-timer-id="' + habit.id + '"]');

        if (timerEl) {
          timerEl.textContent = window.Utils.formatTime(
            window.Store.liveSeconds(habit.id, log)
          );
        }

        const bar = document.querySelector('[data-goalbar-id="' + habit.id + '"]');

        if (bar && habit.goal > 0) {
          bar.style.width =
            Math.round(window.Store.habitProgress(habit) * 100) + "%";
        }
      });

      if (!anyRunning) {
        clearInterval(tickHandle);
        tickHandle = null;
      }
    }, 1000);
  }

  function startDayWatcher() {
    setInterval(function () {
      const today = window.Calendar.todayKey();

      if (today !== currentDayKey) {
        window.Store.state.habits.forEach(function (habit) {
          if (window.Store.isRunning(habit.id)) {
            window.Store.stopTimer(habit.id, true);
          }
        });

        currentDayKey = today;
        refreshAll();
        toast(window.I18N.t("toast.newDay"), "info");
      }
    }, 20000);
  }

  function bind() {
    const addBtn = el("addHabitBtn");
    const nameInput = el("habitName");
    const search = el("habitSearch");
    const filters = el("habitFilters");

    if (addBtn) {
      addBtn.addEventListener("click", add);
    }

    if (nameInput) {
      nameInput.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
          event.preventDefault();
          add();
        }
      });
    }

    if (search) {
      search.addEventListener(
        "input",
        window.Utils.debounce(function () {
          state.query = search.value.trim().toLowerCase();
          render();
        }, 180)
      );
    }

    if (filters) {
      filters.addEventListener("click", function (event) {
        const chip = event.target.closest(".filter-chip");
        if (!chip) return;

        state.cat = chip.dataset.cat || "all";
        renderCatFilters();
        render();
      });
    }

    document.addEventListener("click", function (event) {
      const actionEl = event.target.closest("[data-action]");
      if (!actionEl) return;

      const action = actionEl.dataset.action;
      const id = actionEl.dataset.id;

      if (action === "toggle-habit-check") {
        toggleCheck(id);
      }

      if (action === "bump-habit") {
        bump(id, Number(actionEl.dataset.delta || 0));
      }

      if (action === "start-timer") {
        startTimer(id);
      }

      if (action === "stop-timer") {
        stopTimer(id);
      }

      if (action === "edit-habit") {
        edit(id);
      }

      if (action === "delete-habit") {
        remove(id);
      }
    });

    document.addEventListener("change", function (event) {
      const input = event.target.closest("[data-habit-input]");
      if (!input) return;

      setValue(input.dataset.id, input.value);
    });
  }

function init() {
if (initialized) return;

initialized = true;

buildCategoryOptions();
initIconPicker();
initActiveDaysPicker();
bind();
renderCatFilters();
startDayWatcher();
ensureTick();

document.addEventListener("i18n:changed", function () {
renderNewActiveDays();
renderCatFilters();
render();
});
}

  window.Utils.onDomReady(init);
})();
