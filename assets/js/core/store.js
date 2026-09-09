/* ================================================================
   ROUTINE — CORE / STORE.JS
   Central data store:
   - tasks
   - habits
   - logs
   - settings
   - trash
   - backup / restore
   - timers
   - streak / score selectors
================================================================ */

(function () {
  "use strict";

  const KEYS = {
    tasks: "pd_tasks",
    habits: "pd_habits",
    logs: "pd_habitLogs",
    settings: "pd_settings",
    meta: "pd_meta",
    trash: "pd_trash"
  };

  const memory = new Map();

  const storage = (function () {
    try {
      const probe = "__pd_probe__";
      window.localStorage.setItem(probe, "1");
      window.localStorage.removeItem(probe);

      return {
        persistent: true,
        get: function (key) {
          return window.localStorage.getItem(key);
        },
        set: function (key, value) {
          window.localStorage.setItem(key, value);
        },
        del: function (key) {
          window.localStorage.removeItem(key);
        }
      };
    } catch (error) {
      return {
        persistent: false,
        get: function (key) {
          return memory.has(key) ? memory.get(key) : null;
        },
        set: function (key, value) {
          memory.set(key, String(value));
        },
        del: function (key) {
          memory.delete(key);
        }
      };
    }
  })();

  const listeners = new Set();

  const state = {
    tasks: [],
    habits: [],
    logs: {},
settings: {
theme: "aurora",
lang: "fa",
animations: true,
sounds: false,
density: "comfortable",
reminder: {
enabled: false,
time: "20:00"
}
},
    trash: {
      tasks: [],
      habits: []
    },
    meta: {
      schemaVersion: 3,
      createdAt: new Date().toISOString(),
      lastBackupAt: null,
      appId: "routine"
    }
  };

  /* ------------------------------
     Helpers
  ------------------------------ */

  function loadJson(key, fallback) {
    try {
      const raw = storage.get(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      console.warn("Failed to read storage key:", key, error);
      return fallback;
    }
  }

  function saveJson(key, value) {
    try {
      storage.set(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error("Failed to save storage key:", key, error);

      document.dispatchEvent(
        new CustomEvent("store:error", {
          detail: {
            type: "quota",
            key: key,
            error: error
          }
        })
      );

      return false;
    }
  }

  function notify(action) {
    listeners.forEach(function (fn) {
      try {
        fn(action, state);
      } catch (error) {
        console.error(error);
      }
    });
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function normalizeDateKey(value) {
    if (window.Utils.isValidDateKey(value)) return value;
    return window.Calendar.todayKey();
  }

  function normalizePriority(value) {
    if (value === "high" || value === "med" || value === "low") return value;
    return "med";
  }

  function normalizeCategory(value) {
    const map = {
      "سلامت": "health",
      "ورزش": "fitness",
      "یادگیری": "learning",
      "کار": "work",
      "شخصی": "personal",
      "مالی": "finance",
      "هنر": "art",
      "خانه": "home",
      health: "health",
      fitness: "fitness",
      learning: "learning",
      work: "work",
      personal: "personal",
      finance: "finance",
      art: "art",
      home: "home"
    };

    return map[value] || "personal";
  }
function normalizeActiveDays(raw) {
const allDays = [0, 1, 2, 3, 4, 5, 6];

if (!Array.isArray(raw)) {
return allDays;
}

const days = [];

raw.forEach(function (day) {
const n = Number(day);

if (n >= 0 && n <= 6 && days.indexOf(n) === -1) {
days.push(n);
}
});

days.sort(function (a, b) {
return a - b;
});

return days.length ? days : allDays;
}
   
function normalizeHabit(raw) {
raw = raw || {};

return {
id: raw.id != null ? String(raw.id) : window.Utils.uid("habit"),
name: window.Utils.sanitizeText(raw.name, 80),
emoji: window.Utils.sanitizeText(raw.emoji || "target", 50),
category: normalizeCategory(raw.category),
type: normalizeHabitType(raw.type),
color: window.Utils.sanitizeText(raw.color || "#8b5cf6", 20),
goal: Math.max(0, parseFloat(raw.goal) || 0),
activeDays: normalizeActiveDays(raw.activeDays),
created: raw.created || new Date().toISOString()
};
}
  function normalizeTheme(value) {
    const map = {
      aurora: "aurora",
      dark: "aurora",
      midnight: "midnight",
      blue: "midnight",
      rose: "rose",
      pink: "rose",
      light: "light"
    };

    return map[value] || "aurora";
  }

  /* ------------------------------
     Normalizers
  ------------------------------ */
function normalizeRecurrence(raw) {
raw = raw || {};

var freqOptions = ["none", "daily", "weekly", "monthly"];
var freq = freqOptions.indexOf(raw.freq) !== -1 ? raw.freq : "none";

var days = [0, 1, 2, 3, 4, 5, 6];
if (Array.isArray(raw.days) && raw.days.length) {
days = raw.days.filter(function (d) {
return d >= 0 && d <= 6;
});
if (!days.length) days = [0, 1, 2, 3, 4, 5, 6];
}

var interval = Math.max(1, parseInt(raw.interval) || 1);
var endDate = raw.endDate && window.Utils.isValidDateKey(raw.endDate)
? raw.endDate
: null;

return {
freq: freq,
days: days,
interval: interval,
endDate: endDate
};
}
   
 function normalizeTask(raw) {
raw = raw || {};
return {
id: raw.id != null ? String(raw.id) : window.Utils.uid("task"),
name: window.Utils.sanitizeText(raw.name, 160),
date: normalizeDateKey(raw.date),
priority: normalizePriority(raw.priority),
done: !!raw.done,
created: raw.created || new Date().toISOString(),
recurrence: normalizeRecurrence(raw.recurrence),
occurrences: raw.occurrences && window.Utils.isPlainObject(raw.occurrences)
? raw.occurrences
: {}
};
}

  function normalizeHabit(raw) {
    raw = raw || {};

    return {
      id: raw.id != null ? String(raw.id) : window.Utils.uid("habit"),
      name: window.Utils.sanitizeText(raw.name, 80),
      emoji: window.Utils.sanitizeText(raw.emoji || "target", 50),
      category: normalizeCategory(raw.category),
      type: normalizeHabitType(raw.type),
      color: window.Utils.sanitizeText(raw.color || "#8b5cf6", 20),
      goal: Math.max(0, parseFloat(raw.goal) || 0),
      created: raw.created || new Date().toISOString()
    };
  }

  function normalizeLogEntry(raw) {
    raw = raw || {};

    return {
      value: Math.max(0, parseFloat(raw.value) || 0),
      checked: !!raw.checked,
      seconds: Math.max(0, Math.floor(parseFloat(raw.seconds) || 0)),
      startedAt: null
    };
  }

  function normalizeLogs(raw) {
    const result = {};

    if (!window.Utils.isPlainObject(raw)) return result;

    Object.keys(raw).forEach(function (dateKey) {
      if (!window.Utils.isValidDateKey(dateKey)) return;

      const day = raw[dateKey];
      if (!window.Utils.isPlainObject(day)) return;

      result[dateKey] = {};

      Object.keys(day).forEach(function (habitId) {
        result[dateKey][habitId] = normalizeLogEntry(day[habitId]);
      });

      if (!Object.keys(result[dateKey]).length) {
        delete result[dateKey];
      }
    });

    return result;
  }
function normalizeReminder(raw) {
raw = raw || {};

const time = String(raw.time || "");
const validTime = /^([01]?\d|2[0-3]):[0-5]\d$/.test(time);

let normalizedTime = validTime ? time : "20:00";

if (normalizedTime.length === 4) {
normalizedTime = "0" + normalizedTime;
}

return {
enabled: !!raw.enabled,
time: normalizedTime
};
}
function normalizeSettings(raw) {
raw = raw || {};

return {
theme: normalizeTheme(raw.theme),
lang: raw.lang === "en" ? "en" : "fa",
animations: raw.animations !== false,
sounds: !!raw.sounds,
density: raw.density === "compact" ? "compact" : "comfortable",
reminder: normalizeReminder(raw.reminder)
};
}
   function normalizeReminder(raw) {
raw = raw || {};
const timeStr = String(raw.time || "");
const validTime = /^([01]?\d|2[0-3]):[0-5]\d$/.test(timeStr);

return {
enabled: !!raw.enabled,
time: validTime ? (timeStr.length === 4 ? "0" + timeStr : timeStr) : "20:00"
};
}
   function normalizeReminder(raw) {
raw = raw || {};
const timeStr = String(raw.time || "");
const validTime = /^([01]?\d|2[0-3]):[0-5]\d$/.test(timeStr);

return {
enabled: !!raw.enabled,
time: validTime ? (timeStr.length === 4 ? "0" + timeStr : timeStr) : "20:00"
};
}

  function normalizeTrash(raw) {
    raw = raw || {};

    return {
      tasks: Array.isArray(raw.tasks)
        ? raw.tasks.map(function (item) {
            const task = normalizeTask(item);
            task.deletedAt = item.deletedAt || new Date().toISOString();
            return task;
          })
        : [],
      habits: Array.isArray(raw.habits)
        ? raw.habits.map(function (item) {
            const habit = normalizeHabit(item);
            habit.deletedAt = item.deletedAt || new Date().toISOString();
            return habit;
          })
        : []
    };
  }

  function normalizeMeta(raw) {
raw = raw || {};
     return {
        schemaVersion: 3,
createdAt: raw.createdAt || new Date().toISOString(),
lastBackupAt: raw.lastBackupAt || null,
lastBackupType: raw.lastBackupType || null,
appId: raw.appId || "routine",
migratedAt: raw.migratedAt || null
};
}

   /* ------------------------------
Schema migrations
------------------------------ */
function migrateV1toV2() {
if (!window.Utils.isPlainObject(state.trash)) {
state.trash = {
tasks: [],
habits: []
};
}
}

function migrateV2toV3() {
if (!state.meta.lastBackupType) {
state.meta.lastBackupType = null;
}
if (!state.meta.migratedAt) {
state.meta.migratedAt = null;
}
}

function runMigrations(oldVersion) {
let version = Number(oldVersion) || 1;

while (version < 3) {
if (version === 1) {
migrateV1toV2();
} else if (version === 2) {
migrateV2toV3();
} else {
break;
}
version += 1;
}

state.meta.schemaVersion = 3;
state.meta.migratedAt = new Date().toISOString();
saveState();
notify("meta:migrated");
}

/* ------------------------------
Trash maintenance
------------------------------ */
function purgeExpiredTrash(maxDays = 30) {
const cutoff = Date.now() - maxDays * 24 * 60 * 60 * 1000;
let changed = false;
const expiredHabitIds = new Set();

state.trash.tasks = state.trash.tasks.filter(function (task) {
const ts = Date.parse(task.deletedAt);
if (!task.deletedAt || isNaN(ts) || ts >= cutoff) {
return true;
}
changed = true;
return false;
});

state.trash.habits = state.trash.habits.filter(function (habit) {
const ts = Date.parse(habit.deletedAt);
if (!habit.deletedAt || isNaN(ts) || ts >= cutoff) {
return true;
}
changed = true;
expiredHabitIds.add(String(habit.id));
return false;
});

if (expiredHabitIds.size) {
Object.keys(state.logs).forEach(function (dateKey) {
const day = state.logs[dateKey];
if (!window.Utils.isPlainObject(day)) return;

expiredHabitIds.forEach(function (habitId) {
if (day[habitId]) {
delete day[habitId];
changed = true;
}
});

if (!Object.keys(day).length) {
delete state.logs[dateKey];
}
});
}

if (changed) {
saveState();
notify("trash:purged");
}

return changed;
}

function getTrashSummary() {
return {
tasks: state.trash.tasks.length,
habits: state.trash.habits.length,
total: state.trash.tasks.length + state.trash.habits.length
};
}

/* ------------------------------
Backup helpers
------------------------------ */
function daysSinceLastBackup() {
if (!state.meta.lastBackupAt) return Infinity;
const ts = Date.parse(state.meta.lastBackupAt);
if (isNaN(ts)) return Infinity;
return Math.floor((Date.now() - ts) / (24 * 60 * 60 * 1000));
}

function backupDue(thresholdDays = 7) {
const days = daysSinceLastBackup();
return days >= thresholdDays;
}

function previewImport(raw) {
const normalized = validateBackup(raw);

return {
normalized: normalized,
file: {
tasks: normalized.tasks.length,
habits: normalized.habits.length,
days: Object.keys(normalized.logs).length,
trashTasks: normalized.trash.tasks.length,
trashHabits: normalized.trash.habits.length
},
current: {
tasks: state.tasks.length,
habits: state.habits.length,
days: Object.keys(state.logs).length,
trashTasks: state.trash.tasks.length,
trashHabits: state.trash.habits.length
}
};
}

function commitImport(normalized) {
state.tasks = clone(normalized.tasks);
state.habits = clone(normalized.habits);
state.logs = clone(normalized.logs);
state.settings = clone(normalized.settings);
state.trash = clone(normalized.trash);
state.meta = normalizeMeta(normalized.meta);

saveState();

if (window.I18N) {
window.I18N.setLang(state.settings.lang, false);
}

document.documentElement.setAttribute("data-theme", state.settings.theme);
notify("import");

return {
tasks: state.tasks.length,
habits: state.habits.length,
days: Object.keys(state.logs).length
};
}
  /* ------------------------------
     Load / Save
  ------------------------------ */

function loadState() {
const rawMeta = loadJson(KEYS.meta, {});
const oldSchemaVersion = Number(rawMeta.schemaVersion) || 1;

state.tasks = (loadJson(KEYS.tasks, []) || [])
.filter(function (item) {
return item && window.Utils.sanitizeText(item.name, 1).length > 0;
})
.map(normalizeTask);

state.habits = (loadJson(KEYS.habits, []) || [])
.filter(function (item) {
return item && window.Utils.sanitizeText(item.name, 1).length > 0;
})
.map(normalizeHabit);

state.logs = normalizeLogs(loadJson(KEYS.logs, {}));
state.settings = normalizeSettings(loadJson(KEYS.settings, {}));
state.trash = normalizeTrash(loadJson(KEYS.trash, {}));
state.meta = normalizeMeta(rawMeta);

if (oldSchemaVersion < 3) {
runMigrations(oldSchemaVersion);
}

if (!storage.get(KEYS.settings)) {
saveState();
}
}

  function saveState() {
    saveJson(KEYS.tasks, state.tasks);
    saveJson(KEYS.habits, state.habits);
    saveJson(KEYS.logs, state.logs);
    saveJson(KEYS.settings, state.settings);
    saveJson(KEYS.trash, state.trash);
    saveJson(KEYS.meta, state.meta);
  }

  function subscribe(fn) {
    listeners.add(fn);

    return function () {
      listeners.delete(fn);
    };
  }

  /* ------------------------------
     Snapshots / Undo
  ------------------------------ */

  function snapshot() {
    return clone({
      tasks: state.tasks,
      habits: state.habits,
      logs: state.logs,
      trash: state.trash
    });
  }

  function restoreSnapshot(snap) {
    if (!snap) return;

    state.tasks = Array.isArray(snap.tasks) ? clone(snap.tasks) : [];
    state.habits = Array.isArray(snap.habits) ? clone(snap.habits) : [];
    state.logs = normalizeLogs(snap.logs);
    state.trash = normalizeTrash(snap.trash);

    saveState();
    notify("snapshot:restore");
  }

  /* ------------------------------
     Tasks
  ------------------------------ */

  function addTask(data) {
    const task = normalizeTask(data);

    if (!task.name) return null;

    state.tasks.push(task);
    saveState();
    notify("task:add");

    return task;
  }

  function updateTask(id, patch) {
    const task = state.tasks.find(function (item) {
      return String(item.id) === String(id);
    });

    if (!task) return null;

    Object.assign(task, normalizeTask(Object.assign({}, task, patch, { id: task.id })));
    saveState();
    notify("task:update");

    return task;
  }

  function toggleTask(id) {
    const task = state.tasks.find(function (item) {
      return String(item.id) === String(id);
    });

    if (!task) return false;

    task.done = !task.done;
    saveState();
    notify("task:toggle");

    return task.done;
  }

  function deleteTask(id) {
    const index = state.tasks.findIndex(function (item) {
      return String(item.id) === String(id);
    });

    if (index === -1) return false;

    const task = state.tasks.splice(index, 1)[0];
    task.deletedAt = new Date().toISOString();

    state.trash.tasks.push(task);
    saveState();
    notify("task:delete");

    return true;
  }

  function restoreTask(id) {
    const index = state.trash.tasks.findIndex(function (item) {
      return String(item.id) === String(id);
    });

    if (index === -1) return false;

    const task = state.trash.tasks.splice(index, 1)[0];
    delete task.deletedAt;

    state.tasks.push(task);
    saveState();
    notify("task:restore");

    return true;
  }

 function clearDoneTasks() {
var doneTasks = state.tasks.filter(function (task) {
if (isTaskRecurring(task)) return false;
return task.done;
});
if (!doneTasks.length) return 0;
state.tasks = state.tasks.filter(function (task) {
if (isTaskRecurring(task)) return true;
return !task.done;
});
doneTasks.forEach(function (task) {
task.deletedAt = new Date().toISOString();
state.trash.tasks.push(task);
});
saveState();
notify("tasks:clearDone");
return doneTasks.length;
}

/* ------------------------------
Task Recurrence
------------------------------ */
function isTaskRecurring(task) {
return !!(task.recurrence && task.recurrence.freq !== "none");
}

function isTaskActiveOn(task, dateKey) {
if (!isTaskRecurring(task)) {
return task.date === dateKey;
}

if (dateKey < task.date) {
return false;
}

if (task.recurrence.endDate && dateKey > task.recurrence.endDate) {
return false;
}

var date = window.Calendar.keyToDate(dateKey);
var startDate = window.Calendar.keyToDate(task.date);
var diffMs = date.getTime() - startDate.getTime();
var diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

if (task.recurrence.freq === "daily") {
return diffDays >= 0 && diffDays % task.recurrence.interval === 0;
}

if (task.recurrence.freq === "weekly") {
var weekday = window.Calendar.getDayOfWeek(date, "fa");
if (task.recurrence.days.indexOf(weekday) === -1) {
return false;
}
if (task.recurrence.interval > 1) {
var diffWeeks = Math.floor(diffDays / 7);
return diffWeeks % task.recurrence.interval === 0;
}
return true;
}

if (task.recurrence.freq === "monthly") {
if (date.getDate() !== startDate.getDate()) {
return false;
}
if (task.recurrence.interval > 1) {
var monthDiff =
(date.getFullYear() - startDate.getFullYear()) * 12 +
(date.getMonth() - startDate.getMonth());
return monthDiff >= 0 && monthDiff % task.recurrence.interval === 0;
}
return true;
}

return false;
}

function getTasksForDate(dateKey) {
return state.tasks.filter(function (task) {
return isTaskActiveOn(task, dateKey);
});
}

function isTaskDoneOnDate(task, dateKey) {
if (!isTaskRecurring(task)) {
return task.done;
}
return !!(
task.occurrences &&
task.occurrences[dateKey] &&
task.occurrences[dateKey].done
);
}

function toggleTaskOnDate(taskId, dateKey) {
var task = state.tasks.find(function (item) {
return String(item.id) === String(taskId);
});
if (!task) return false;

if (!isTaskRecurring(task)) {
return toggleTask(taskId);
}

if (!task.occurrences) {
task.occurrences = {};
}
if (!task.occurrences[dateKey]) {
task.occurrences[dateKey] = { done: false };
}

task.occurrences[dateKey].done = !task.occurrences[dateKey].done;
saveState();
notify("task:toggle");
return task.occurrences[dateKey].done;
}

function recurrenceLabel(task) {
if (!isTaskRecurring(task)) return "";
var freq = task.recurrence.freq;
if (freq === "daily") return window.I18N.t("tasks.recDaily");
if (freq === "weekly") return window.I18N.t("tasks.recWeekly");
if (freq === "monthly") return window.I18N.t("tasks.recMonthly");
return "";
}

   
  /* ------------------------------
     Habits
  ------------------------------ */

  function addHabit(data) {
    const habit = normalizeHabit(data);

    if (!habit.name) return null;

    state.habits.push(habit);
    saveState();
    notify("habit:add");

    return habit;
  }

  function updateHabit(id, patch) {
    const habit = state.habits.find(function (item) {
      return String(item.id) === String(id);
    });

    if (!habit) return null;

    Object.assign(habit, normalizeHabit(Object.assign({}, habit, patch, { id: habit.id })));
    saveState();
    notify("habit:update");

    return habit;
  }

  function deleteHabit(id) {
    const index = state.habits.findIndex(function (item) {
      return String(item.id) === String(id);
    });

    if (index === -1) return false;

    if (isRunning(id)) {
      stopTimer(id, true);
    }

    const habit = state.habits.splice(index, 1)[0];
    habit.deletedAt = new Date().toISOString();

    state.trash.habits.push(habit);
    saveState();
    notify("habit:delete");

    return true;
  }

  function restoreHabit(id) {
    const index = state.trash.habits.findIndex(function (item) {
      return String(item.id) === String(id);
    });

    if (index === -1) return false;

    const habit = state.trash.habits.splice(index, 1)[0];
    delete habit.deletedAt;

    state.habits.push(habit);
    saveState();
    notify("habit:restore");

    return true;
  }

  function emptyTrash() {
    const deletedHabitIds = state.trash.habits.map(function (habit) {
      return String(habit.id);
    });

    state.trash.tasks = [];
    state.trash.habits = [];

    deletedHabitIds.forEach(function (habitId) {
      Object.keys(state.logs).forEach(function (dateKey) {
        if (state.logs[dateKey] && state.logs[dateKey][habitId]) {
          delete state.logs[dateKey][habitId];
        }

        if (state.logs[dateKey] && !Object.keys(state.logs[dateKey]).length) {
          delete state.logs[dateKey];
        }
      });
    });

    saveState();
    notify("trash:empty");
  }

  /* ------------------------------
     Logs
  ------------------------------ */

  function getLog(habitId, dateKey) {
    const key = dateKey || window.Calendar.todayKey();
    const day = state.logs[key];
    const log = day ? day[habitId] : null;

    return {
      value: log ? Number(log.value) || 0 : 0,
      checked: !!(log && log.checked),
      seconds: log ? Math.max(0, Math.floor(Number(log.seconds) || 0)) : 0,
      startedAt: log && log.startedAt ? log.startedAt : null
    };
  }

  function setLog(habitId, patch, dateKey) {
    const key = dateKey || window.Calendar.todayKey();

    if (!state.logs[key]) {
      state.logs[key] = {};
    }

    state.logs[key][habitId] = Object.assign(
      getLog(habitId, key),
      patch || {}
    );

    if (state.logs[key][habitId].startedAt) {
      state.logs[key][habitId].startedAt = Number(
        state.logs[key][habitId].startedAt
      );
    }

    saveState();
    notify("log:set");

    return state.logs[key][habitId];
  }

  function toggleHabitCheck(habitId, dateKey) {
    const log = getLog(habitId, dateKey);
    const nextChecked = !log.checked;

    setLog(
      habitId,
      {
        checked: nextChecked,
        value: nextChecked ? 1 : 0
      },
      dateKey
    );

    return nextChecked;
  }

  function setHabitValue(habitId, value, dateKey) {
    setLog(
      habitId,
      {
        value: Math.max(0, parseFloat(value) || 0)
      },
      dateKey
    );
  }

  function bumpHabit(habitId, delta, dateKey) {
    const habit = state.habits.find(function (item) {
      return String(item.id) === String(habitId);
    });

    if (!habit) return;

    const step = habit.goal > 0 ? Math.max(1, Math.round(habit.goal / 8)) : 1;
    const current = getLog(habitId, dateKey).value;

    setHabitValue(habitId, current + delta * step, dateKey);
  }

  /* ------------------------------
     Timers
  ------------------------------ */

  function liveSeconds(habitId, log) {
    const entry = log || getLog(habitId);

    if (!entry.startedAt) {
      return entry.seconds;
    }

    return (
      entry.seconds +
      Math.max(0, Math.floor((Date.now() - entry.startedAt) / 1000))
    );
  }

  function isRunning(habitId) {
    return !!getLog(habitId).startedAt;
  }

  function startTimer(habitId) {
    state.habits.forEach(function (habit) {
      if (String(habit.id) !== String(habitId) && isRunning(habit.id)) {
        stopTimer(habit.id, true);
      }
    });

    setLog(habitId, {
      startedAt: Date.now()
    });

    notify("timer:start");
  }

  function stopTimer(habitId, quiet = false) {
    const log = getLog(habitId);

    if (!log.startedAt) return 0;

    const total = liveSeconds(habitId, log);

    setLog(habitId, {
      startedAt: null,
      seconds: total,
      value: total
    });

    if (!quiet) {
      notify("timer:stop");
    }

    return total;
  }

  /* ------------------------------
     Habit selectors
  ------------------------------ */

  function habitDone(habit, dateKey) {
    const key = dateKey || window.Calendar.todayKey();
    const log = getLog(habit.id, key);

    if (habit.type === "checkbox") {
      return log.checked;
    }

    if (habit.type === "number") {
      return habit.goal > 0 ? log.value >= habit.goal : log.value > 0;
    }

    if (habit.type === "timer") {
      const seconds = liveSeconds(habit.id, log);
      return habit.goal > 0 ? seconds >= habit.goal * 60 : seconds > 0;
    }

    return false;
  }

  function habitProgress(habit, dateKey) {
    const key = dateKey || window.Calendar.todayKey();
    const log = getLog(habit.id, key);

    if (habit.type === "checkbox") {
      return log.checked ? 1 : 0;
    }

    if (habit.type === "number") {
      if (habit.goal > 0) {
        return Math.min(1, log.value / habit.goal);
      }

      return log.value > 0 ? 1 : 0;
    }

    if (habit.type === "timer") {
      const seconds = liveSeconds(habit.id, log);

      if (habit.goal > 0) {
        return Math.min(1, seconds / (habit.goal * 60));
      }

      return seconds > 0 ? 1 : 0;
    }

    return 0;
  }

  function habitExistedOn(habit, dateKey) {
    if (!habit.created) return true;

    try {
      const createdKey = window.Calendar.keyOf(new Date(habit.created));
      return createdKey <= dateKey;
    } catch (error) {
      return true;
    }
  }

   function habitActiveOn(habit, dateKey) {
if (!habit) return false;

if (!Array.isArray(habit.activeDays) || !habit.activeDays.length) {
return true;
}

try {
const date = window.Calendar.keyToDate(dateKey);
const weekday = window.Calendar.getDayOfWeek(date, "fa");

return habit.activeDays.indexOf(weekday) !== -1;
} catch (error) {
return true;
}
}

 function habitStreaks(habit) {
let current = 0;
let best = 0;
let run = 0;

const startKey = habit.created
? window.Calendar.keyOf(new Date(habit.created))
: window.Calendar.todayKey();

const d = new Date();
d.setHours(12, 0, 0, 0);

const keys = [];

for (let i = 0; i < 730; i += 1) {
const key = window.Calendar.keyOf(d);

if (key < startKey) break;

keys.push(key);
d.setDate(d.getDate() - 1);
}

/* Best streak: oldest to newest */
for (let i = keys.length - 1; i >= 0; i -= 1) {
const key = keys[i];

if (!habitExistedOn(habit, key) || !habitActiveOn(habit, key)) {
continue;
}

if (habitDone(habit, key)) {
run += 1;
best = Math.max(best, run);
} else {
run = 0;
}
}

/* Current streak: newest to oldest */
for (let i = 0; i < keys.length; i += 1) {
const key = keys[i];

if (!habitExistedOn(habit, key) || !habitActiveOn(habit, key)) {
continue;
}

if (habitDone(habit, key)) {
current += 1;
} else {
break;
}
}

return {
current: current,
best: best
};
}

function dayScore(dateKey) {
var key = dateKey || window.Calendar.todayKey();
var today = window.Calendar.todayKey();
var future = key > today;

var dayTasks = getTasksForDate(key);

var dayHabits = future
? []
: state.habits.filter(function (habit) {
return habitExistedOn(habit, key) && habitActiveOn(habit, key);
});

var total = dayTasks.length + dayHabits.length;

if (!total) {
return { pct: 0, done: 0, total: 0, future: future };
}

var done = dayTasks.filter(function (task) {
return isTaskDoneOnDate(task, key);
}).length;

dayHabits.forEach(function (habit) {
done += habitProgress(habit, key);
});

return {
pct: Math.min(1, done / total),
done: done,
total: total,
future: future
};
}
  function focusSeconds(habitId, days = 30) {
    let total = 0;

    for (let i = 0; i < days; i += 1) {
      const key = window.Calendar.keyShift(-i);
      const day = state.logs[key];
      const log = day ? day[habitId] : null;

      if (!log) continue;

      if (i === 0 && log.startedAt) {
        total += liveSeconds(habitId, log);
      } else {
        total += log.seconds || 0;
      }
    }

    return total;
  }

  /* ------------------------------
     Backup / Import / Reset
  ------------------------------ */

  function exportData() {
    return {
      app: "routine",
      schemaVersion: 3,
      exportedAt: new Date().toISOString(),
      tasks: state.tasks,
      habits: state.habits,
      logs: state.logs,
      settings: state.settings,
      trash: state.trash,
      meta: state.meta
    };
  }

  function validateBackup(raw) {
    if (!window.Utils.isPlainObject(raw)) {
      throw new Error("Invalid backup: root must be an object");
    }

    const tasksRaw = Array.isArray(raw.tasks) ? raw.tasks : [];
    const habitsRaw = Array.isArray(raw.habits) ? raw.habits : [];
    const logsRaw = raw.logs || raw.habitLogs || {};
    const settingsRaw = raw.settings || {};
    const trashRaw = raw.trash || {};

    if (tasksRaw.length > 20000) {
      throw new Error("Too many tasks in backup");
    }

    if (habitsRaw.length > 5000) {
      throw new Error("Too many habits in backup");
    }

    return {
      tasks: tasksRaw
        .filter(function (item) {
          return item && window.Utils.sanitizeText(item.name, 1).length > 0;
        })
        .map(normalizeTask),
      habits: habitsRaw
        .filter(function (item) {
          return item && window.Utils.sanitizeText(item.name, 1).length > 0;
        })
        .map(normalizeHabit),
      logs: normalizeLogs(logsRaw),
      settings: normalizeSettings(settingsRaw),
      trash: normalizeTrash(trashRaw),
      meta: normalizeMeta(raw.meta)
    };
  }

 function importData(raw) {
const normalized = validateBackup(raw);
return commitImport(normalized);
}

    state.tasks = normalized.tasks;
    state.habits = normalized.habits;
    state.logs = normalized.logs;
    state.settings = normalized.settings;
    state.trash = normalized.trash;
    state.meta = normalized.meta;

    saveState();

    if (window.I18N) {
      window.I18N.setLang(state.settings.lang, false);
    }

    document.documentElement.setAttribute("data-theme", state.settings.theme);

    notify("import");

    return {
      tasks: state.tasks.length,
      habits: state.habits.length,
      days: Object.keys(state.logs).length
    };
  }

  function resetAll() {
    state.tasks = [];
    state.habits = [];
    state.logs = {};
    state.trash = {
      tasks: [],
      habits: []
    };

    saveState();
    notify("reset");
  }

 function updateSettings(patch) {
patch = patch || {};

const merged = Object.assign({}, state.settings, patch);

if (window.Utils.isPlainObject(patch.reminder)) {
merged.reminder = Object.assign(
{},
state.settings.reminder || {},
patch.reminder
);
}

state.settings = normalizeSettings(merged);

saveState();

if (window.I18N && patch.lang) {
window.I18N.setLang(state.settings.lang, false);
}

if (patch.theme) {
document.documentElement.setAttribute("data-theme", state.settings.theme);
}

notify("settings:update");
}

    saveState();

    if (window.I18N && patch && patch.lang) {
      window.I18N.setLang(state.settings.lang, false);
    }

    if (patch && patch.theme) {
      document.documentElement.setAttribute("data-theme", state.settings.theme);
    }

    notify("settings:update");
  }

 function markBackup(type = "manual") {
state.meta.lastBackupAt = new Date().toISOString();
state.meta.lastBackupType = type;
saveState();
notify("meta:backup");
}

  function storageSize() {
    let bytes = 0;

    Object.values(KEYS).forEach(function (key) {
      const value = storage.get(key);
      if (value) bytes += value.length * 2;
    });

    return bytes;
  }

  function pruneOrphanLogs() {
    const activeIds = new Set(
      state.habits.map(function (habit) {
        return String(habit.id);
      })
    );

    const trashIds = new Set(
      state.trash.habits.map(function (habit) {
        return String(habit.id);
      })
    );

    let changed = false;

    Object.keys(state.logs).forEach(function (dateKey) {
      const day = state.logs[dateKey];

      if (!window.Utils.isPlainObject(day)) {
        delete state.logs[dateKey];
        changed = true;
        return;
      }

      Object.keys(day).forEach(function (habitId) {
        if (!activeIds.has(String(habitId)) && !trashIds.has(String(habitId))) {
          delete day[habitId];
          changed = true;
        }
      });

      if (!Object.keys(day).length) {
        delete state.logs[dateKey];
        changed = true;
      }
    });

    if (changed) {
      saveState();
    }
  }

  /* ------------------------------
     Init + expose
  ------------------------------ */

  loadState();
pruneOrphanLogs();
purgeExpiredTrash();

document.documentElement.setAttribute("data-theme", state.settings.theme);

if (window.I18N) {
window.I18N.setLang(state.settings.lang, false);
}

window.setInterval(function () {
purgeExpiredTrash();
}, 6 * 60 * 60 * 1000);
  if (window.I18N) {
    window.I18N.setLang(state.settings.lang, false);
  }

  window.Store = {
KEYS,
state,
storagePersistent: storage.persistent,
subscribe,
notify,
saveState,
snapshot,
restoreSnapshot,
addTask,
updateTask,
toggleTask,
deleteTask,
restoreTask,
clearDoneTasks,
normalizeRecurrence,
isTaskRecurring,
isTaskActiveOn,
getTasksForDate,
isTaskDoneOnDate,
toggleTaskOnDate,
recurrenceLabel,
addHabit,
updateHabit,
deleteHabit,
restoreHabit,
emptyTrash,
getLog,
setLog,
toggleHabitCheck,
setHabitValue,
bumpHabit,
liveSeconds,
isRunning,
startTimer,
stopTimer,
habitDone,
habitProgress,
habitExistedOn,
habitStreaks,
dayScore,
focusSeconds,
exportData,
validateBackup,
importData,
previewImport,
commitImport,
resetAll,
updateSettings,
markBackup,
backupDue,
daysSinceLastBackup,
storageSize,
habitActiveOn,
pruneOrphanLogs,
purgeExpiredTrash,
getTrashSummary
};
