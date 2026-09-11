/* ================================================================
   ROUTINE — FEATURES / TASKS.JS
================================================================ */

(function () {
  "use strict";

  let initialized = false;

  const state = {
    filter: "all",
    query: ""
  };

  const PRI_COLOR = {
    high: "var(--danger)",
    med: "var(--warning)",
    low: "var(--text-muted)"
  };

  const PRI_KEY = {
    high: "tasks.priorityHigh",
    med: "tasks.priorityMed",
    low: "tasks.priorityLow"
  };

  const PRI_ORDER = {
    high: 0,
    med: 1,
    low: 2
  };
let newTaskRecurrence = {
freq: "none",
days: [0, 1, 2, 3, 4, 5, 6],
interval: 1,
endDate: null
};

const WEEKDAY_SHORT_FA = ["ش", "ی", "د", "س", "چ", "پ", "ج"];
const WEEKDAY_SHORT_EN = ["Sa", "Su", "Mo", "Tu", "We", "Th", "Fr"];
   
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
    }
  }
   function getCurrentDateKey(parseFirst) {
const dateEl = el("taskDate");

if (!dateEl) {
return window.Calendar.todayKey();
}

if (parseFirst && window.DatePicker && window.DatePicker.parse) {
window.DatePicker.parse(dateEl);
}

const key = dateEl.dataset.value;

if (window.Utils.isValidDateKey(key)) {
return key;
}

if (window.Utils.isValidDateKey(dateEl.value)) {
return dateEl.value;
}

return window.Calendar.todayKey();
}

 function syncDateLabel() {
const dateEl = el("taskDate");
const labelEl = el("taskDateJalali");

if (!dateEl || !labelEl) return;

const key = dateEl.dataset.value;

if (window.Utils.isValidDateKey(key)) {
labelEl.textContent = window.Calendar.keyToJalaliFull(key);
return;
}

if (window.Utils.isValidDateKey(dateEl.value)) {
labelEl.textContent = window.Calendar.keyToJalaliFull(dateEl.value);
return;
}

labelEl.textContent = "—";
}
function add() {
var input = el("taskInput");
if (!input) return;

var name = window.Utils.sanitizeText(input.value, 160);
if (!name) {
toast(window.I18N.t("toast.enterTaskName"), "error");
input.focus();
return;
}

window.Store.addTask({
name: name,
date: getCurrentDateKey(true),
priority: el("taskPriority") ? el("taskPriority").value || "med" : "med",
recurrence: {
freq: newTaskRecurrence.freq,
days: newTaskRecurrence.days.slice(),
interval: newTaskRecurrence.interval,
endDate: newTaskRecurrence.endDate
}
});

input.value = "";
if (el("taskPriority")) {
el("taskPriority").value = "med";
}
resetRecurrence();
refreshAll();
toast(window.I18N.t("toast.taskAdded"), "success");
toast(window.I18N.t("toast.taskAdded"), "success");
if (window.App && window.App.closeMobileTaskForm) {
  window.App.closeMobileTaskForm();
}
input.focus();
}

function recurrenceFreqLabel() {
if (newTaskRecurrence.freq === "daily") {
return window.I18N.t("tasks.recEvery") + " " + window.I18N.faNum(newTaskRecurrence.interval) + " " + window.I18N.t("tasks.recDayUnit");
}
if (newTaskRecurrence.freq === "weekly") {
return window.I18N.t("tasks.recEvery") + " " + window.I18N.faNum(newTaskRecurrence.interval) + " " + window.I18N.t("tasks.recWeekUnit");
}
if (newTaskRecurrence.freq === "monthly") {
return window.I18N.t("tasks.recEvery") + " " + window.I18N.faNum(newTaskRecurrence.interval) + " " + window.I18N.t("tasks.recMonthUnit");
}
return "";
}

function renderRecurrencePicker() {
var container = el("recurrencePicker");
if (!container) return;

var freq = newTaskRecurrence.freq;

var html = '<select id="taskRecurrenceFreq" class="input input-sm" aria-label="' + window.I18N.t("tasks.recurrence") + '">';
html += '<option value="none"' + (freq === "none" ? " selected" : "") + '>' + window.I18N.t("tasks.recNone") + "</option>";
html += '<option value="daily"' + (freq === "daily" ? " selected" : "") + '>' + window.I18N.t("tasks.recDaily") + "</option>";
html += '<option value="weekly"' + (freq === "weekly" ? " selected" : "") + '>' + window.I18N.t("tasks.recWeekly") + "</option>";
html += '<option value="monthly"' + (freq === "monthly" ? " selected" : "") + '>' + window.I18N.t("tasks.recMonthly") + "</option>";
html += "</select>";

if (freq !== "none") {
html += '<div class="rec-options">';

if (freq === "weekly") {
html += '<div class="weekday-picker" id="recDays">';
for (var d = 0; d < 7; d++) {
var active = newTaskRecurrence.days.indexOf(d) !== -1;
html += '<button type="button" class="weekday-chip' + (active ? " active" : "") + '" data-day="' + d + '" aria-pressed="' + active + '">';
html += window.Utils.escapeHtml(window.I18N.lang === "en" ? WEEKDAY_SHORT_EN[d] : WEEKDAY_SHORT_FA[d]);
html += "</button>";
}
html += "</div>";
}

html += '<div class="rec-interval">';
html += '<label>' + window.I18N.t("tasks.recEvery") + '</label>';
html += '<input type="number" id="taskRecInterval" class="input input-sm" min="1" max="30" value="' + newTaskRecurrence.interval + '" style="width:70px">';
var unitLabel = freq === "daily" ? window.I18N.t("tasks.recDayUnit") : freq === "weekly" ? window.I18N.t("tasks.recWeekUnit") : window.I18N.t("tasks.recMonthUnit");
html += '<span>' + unitLabel + "</span>";
html += "</div>";

html += '<div class="rec-end">';
html += '<label>' + window.I18N.t("tasks.recEndDate") + '</label>';
html += '<input type="text" id="taskRecEndDate" class="input input-sm" data-datepicker placeholder="' + window.I18N.t("datepicker.placeholder") + '" value="' + (newTaskRecurrence.endDate ? window.Calendar.keyToJalaliFull(newTaskRecurrence.endDate) : "") + '" data-value="' + (newTaskRecurrence.endDate || "") + '">';
html += "</div>";

html += "</div>";
}

container.innerHTML = html;

var freqSelect = container.querySelector("#taskRecurrenceFreq");
if (freqSelect) {
freqSelect.addEventListener("change", function () {
newTaskRecurrence.freq = freqSelect.value;
renderRecurrencePicker();
});
}

var daysContainer = container.querySelector("#recDays");
if (daysContainer) {
daysContainer.addEventListener("click", function (event) {
var chip = event.target.closest(".weekday-chip");
if (!chip) return;
var day = Number(chip.dataset.day);
var idx = newTaskRecurrence.days.indexOf(day);
if (idx === -1) {
newTaskRecurrence.days.push(day);
newTaskRecurrence.days.sort(function (a, b) { return a - b; });
} else {
if (newTaskRecurrence.days.length === 1) return;
newTaskRecurrence.days.splice(idx, 1);
}
renderRecurrencePicker();
});
}

var intervalInput = container.querySelector("#taskRecInterval");
if (intervalInput) {
intervalInput.addEventListener("change", function () {
newTaskRecurrence.interval = Math.max(1, parseInt(intervalInput.value) || 1);
});
}

var endDateInput = container.querySelector("#taskRecEndDate");
if (endDateInput) {
endDateInput.addEventListener("change", function () {
var val = endDateInput.dataset.value || "";
newTaskRecurrence.endDate = window.Utils.isValidDateKey(val) ? val : null;
});
}
}

function initRecurrencePicker() {
var container = el("recurrencePicker");
if (!container) return;
renderRecurrencePicker();
}

function resetRecurrence() {
newTaskRecurrence = {
freq: "none",
days: [0, 1, 2, 3, 4, 5, 6],
interval: 1,
endDate: null
};
renderRecurrencePicker();
}
 
  function toggle(id) {
    const done = window.Store.toggleTask(id);
    refreshAll();

    if (done) {
      toast(window.I18N.t("toast.nice"), "success");
    }
  }

  function remove(id) {
    const snap = window.Store.snapshot();

    window.Store.deleteTask(id);
    refreshAll();

    toast(window.I18N.t("toast.taskDeleted"), "undo", {
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

  function clearDone() {
    const doneCount = window.Store.state.tasks.filter(function (task) {
      return task.done;
    }).length;

    if (!doneCount) {
      toast(window.I18N.t("toast.nothingToClear"), "error");
      return;
    }

    const snap = window.Store.snapshot();

    window.Store.clearDoneTasks();
    refreshAll();

    toast("🧹 " + window.I18N.faNum(doneCount), "undo", {
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

function edit(id) {
var task = window.Store.state.tasks.find(function (item) {
return String(item.id) === String(id);
});
if (!task) return;
if (!window.UI || !window.UI.modal) return;

var rec = task.recurrence || { freq: "none", days: [0,1,2,3,4,5,6], interval: 1, endDate: null };

var html =
'<div class="form-row">' +
'<label for="etName">' + window.I18N.t("common.name") + "</label>" +
'<input id="etName" class="input" maxlength="160" value="' + window.Utils.escapeHtml(task.name) + '">' +
"</div>" +
'<div class="form-grid">' +
'<div class="form-row">' +
'<label for="etDate">' + window.I18N.t("common.date") + "</label>" +
'<input id="etDate" type="text" class="input" data-datepicker autocomplete="off" value="' +
window.Utils.escapeHtml(window.Calendar.keyToJalaliFull(task.date)) +
'" data-value="' + task.date + '">' +
"</div>" +
'<div class="form-row">' +
'<label for="etPri">' + window.I18N.t("common.priority") + "</label>" +
'<select id="etPri" class="input">' +
["high", "med", "low"].map(function (p) {
return '<option value="' + p + '"' + (task.priority === p ? " selected" : "") + ">" +
window.I18N.t(PRI_KEY[p]) + "</option>";
}).join("") +
"</select>" +
"</div>" +
"</div>" +
'<div class="form-row">' +
'<label for="etRecFreq">' + window.I18N.t("tasks.recurrence") + "</label>" +
'<select id="etRecFreq" class="input">' +
'<option value="none"' + (rec.freq === "none" ? " selected" : "") + ">" + window.I18N.t("tasks.recNone") + "</option>" +
'<option value="daily"' + (rec.freq === "daily" ? " selected" : "") + ">" + window.I18N.t("tasks.recDaily") + "</option>" +
'<option value="weekly"' + (rec.freq === "weekly" ? " selected" : "") + ">" + window.I18N.t("tasks.recWeekly") + "</option>" +
'<option value="monthly"' + (rec.freq === "monthly" ? " selected" : "") + ">" + window.I18N.t("tasks.recMonthly") + "</option>" +
"</select>" +
"</div>" +
'<div id="etRecOptions"></div>' +
'<button class="btn btn-primary" data-action="save-task-edit" data-id="' + task.id + '" style="width:100%;margin-top:12px">' +
window.I18N.t("common.save") +
"</button>";

var content = window.UI.modal.open(window.I18N.t("modal.editTask"), html);
if (!content) return;

var nameInput = content.querySelector("#etName");
var dateInput = content.querySelector("#etDate");
var priorityInput = content.querySelector("#etPri");
var recFreqSelect = content.querySelector("#etRecFreq");
var recOptionsContainer = content.querySelector("#etRecOptions");
var saveBtn = content.querySelector('[data-action="save-task-edit"]');

var editRecurrence = {
freq: rec.freq,
days: rec.days ? rec.days.slice() : [0,1,2,3,4,5,6],
interval: rec.interval || 1,
endDate: rec.endDate || null
};

function renderEditRecOptions() {
if (!recOptionsContainer) return;
var freq = editRecurrence.freq;
if (freq === "none") {
recOptionsContainer.innerHTML = "";
return;
}

var h = '<div class="rec-options">';

if (freq === "weekly") {
h += '<div class="weekday-picker" id="etRecDays">';
for (var d = 0; d < 7; d++) {
var active = editRecurrence.days.indexOf(d) !== -1;
h += '<button type="button" class="weekday-chip' + (active ? " active" : "") + '" data-day="' + d + '">';
h += window.Utils.escapeHtml(window.I18N.lang === "en" ? WEEKDAY_SHORT_EN[d] : WEEKDAY_SHORT_FA[d]);
h += "</button>";
}
h += "</div>";
}

h += '<div class="rec-interval">';
h += '<label>' + window.I18N.t("tasks.recEvery") + '</label>';
h += '<input type="number" id="etRecInterval" class="input input-sm" min="1" max="30" value="' + editRecurrence.interval + '" style="width:70px">';
var unit = freq === "daily" ? window.I18N.t("tasks.recDayUnit") : freq === "weekly" ? window.I18N.t("tasks.recWeekUnit") : window.I18N.t("tasks.recMonthUnit");
h += '<span>' + unit + "</span>";
h += "</div>";

h += '<div class="rec-end">';
h += '<label>' + window.I18N.t("tasks.recEndDate") + '</label>';
h += '<input type="text" id="etRecEndDate" class="input input-sm" data-datepicker placeholder="' + window.I18N.t("datepicker.placeholder") + '" value="' + (editRecurrence.endDate ? window.Calendar.keyToJalaliFull(editRecurrence.endDate) : "") + '" data-value="' + (editRecurrence.endDate || "") + '">';
h += "</div>";

h += "</div>";
recOptionsContainer.innerHTML = h;

var daysEl = recOptionsContainer.querySelector("#etRecDays");
if (daysEl) {
daysEl.addEventListener("click", function (event) {
var chip = event.target.closest(".weekday-chip");
if (!chip) return;
var day = Number(chip.dataset.day);
var idx = editRecurrence.days.indexOf(day);
if (idx === -1) {
editRecurrence.days.push(day);
editRecurrence.days.sort(function (a, b) { return a - b; });
} else {
if (editRecurrence.days.length === 1) return;
editRecurrence.days.splice(idx, 1);
}
renderEditRecOptions();
});
}

var intervalEl = recOptionsContainer.querySelector("#etRecInterval");
if (intervalEl) {
intervalEl.addEventListener("change", function () {
editRecurrence.interval = Math.max(1, parseInt(intervalEl.value) || 1);
});
}

var endDateEl = recOptionsContainer.querySelector("#etRecEndDate");
if (endDateEl) {
endDateEl.addEventListener("change", function () {
var val = endDateEl.dataset.value || "";
editRecurrence.endDate = window.Utils.isValidDateKey(val) ? val : null;
});
}
}

renderEditRecOptions();

if (recFreqSelect) {
recFreqSelect.addEventListener("change", function () {
editRecurrence.freq = recFreqSelect.value;
renderEditRecOptions();
});
}

if (nameInput) nameInput.focus();

if (saveBtn) {
saveBtn.addEventListener("click", function () {
var name = window.Utils.sanitizeText(nameInput ? nameInput.value : "", 160);
if (!name) {
toast(window.I18N.t("toast.enterTaskName"), "error");
if (nameInput) nameInput.focus();
return;
}

if (dateInput && window.DatePicker && window.DatePicker.parse) {
window.DatePicker.parse(dateInput);
}

var dateValue = dateInput
? dateInput.dataset.value || dateInput.value
: task.date;

window.Store.updateTask(id, {
name: name,
date: window.Utils.isValidDateKey(dateValue) ? dateValue : task.date,
priority: priorityInput ? priorityInput.value : task.priority,
recurrence: {
freq: editRecurrence.freq,
days: editRecurrence.days.slice(),
interval: editRecurrence.interval,
endDate: editRecurrence.endDate
}
});

window.UI.modal.close();
refreshAll();
toast(window.I18N.t("toast.saved"), "success");
});
}
}

function taskRowHTML(task, compact, dateContext) {
  var today = window.Calendar.todayKey();
  var isRecurring = window.Store.isTaskRecurring(task);
  var contextDate = dateContext || (isRecurring ? today : task.date);
  var done = isRecurring
    ? window.Store.isTaskDoneOnDate(task, contextDate)
    : task.done;
  var chip = "";
  if (isRecurring) {
    chip = '<span class="chip recurring">🔄 ' + window.Store.recurrenceLabel(task) + "</span>";
  } else if (task.date < today && !done) {
    chip = '<span class="chip overdue">' + window.I18N.t("common.overdue") + " — " + window.Calendar.keyToJalaliFull(task.date) + "</span>";
  } else if (task.date === today) {
    chip = '<span class="chip today">' + window.I18N.t("common.today") + "</span>";
  } else {
    chip = '<span class="chip">' + window.Calendar.keyToJalaliFull(task.date) + "</span>";
  }

  var projectChip = "";
  if (task.projectId) {
    var proj = window.Store.getProjectById(task.projectId);
    if (proj) {
      projectChip = '<span class="chip project-chip" style="background:' + proj.color + '22;border-color:' + proj.color + '44;color:' + proj.color + '">' + window.Utils.escapeHtml(proj.name) + "</span>";
    }
  }

  var tagsHTML = "";
  if (task.tags && task.tags.length) {
    tagsHTML = '<span class="task-tags">' + task.tags.map(function (tag) {
      return '<span class="tag-chip">' + window.Utils.escapeHtml(tag) + "</span>";
    }).join("") + "</span>";
  }

  var subtasksHTML = "";
  if (!compact && task.subtasks && task.subtasks.length) {
    var doneCount = task.subtasks.filter(function (s) { return s.done; }).length;
    subtasksHTML =
      '<div class="subtasks-inline">' +
      '<span class="subtasks-progress">' + window.I18N.t("subtasks.progress", { done: window.I18N.faNum(doneCount), total: window.I18N.faNum(task.subtasks.length) }) + "</span>" +
      '<div class="goal-bar" style="flex:1"><span style="width:' + Math.round((doneCount / task.subtasks.length) * 100) + '%"></span></div>' +
      "</div>";
  }

  var checkboxAttrs = 'data-task-id="' + task.id + '"';
  if (isRecurring) {
    checkboxAttrs += ' data-task-date="' + contextDate + '"';
  }
  return (
    '<div class="task-item' + (isRecurring ? " recurring-task" : "") + '" style="--pri:' + (PRI_COLOR[task.priority] || PRI_COLOR.med) + '">' +
    '<input type="checkbox" class="task-checkbox" ' + checkboxAttrs + (done ? " checked" : "") +
    ' aria-label="' + window.I18N.t("common.done") + " — " + window.Utils.escapeHtml(task.name) + '">' +
    '<div class="task-content">' +
    '<span class="task-text' + (done ? " done" : "") + '">' + window.Utils.escapeHtml(task.name) + "</span>" +
    subtasksHTML +
    tagsHTML +
    "</div>" +
    (compact ? "" : '<span class="chip pri-' + (task.priority || "med") + '">' + window.I18N.t(PRI_KEY[task.priority || "med"]) + "</span>") +
    projectChip +
    chip +
    '<div class="task-actions">' +
    '<button class="btn-icon" data-action="expand-subtasks" data-id="' + task.id + '" aria-label="' + window.I18N.t("subtasks.title") + '" title="' + window.I18N.t("subtasks.title") + '">📋</button>' +
    '<button class="btn-icon" data-action="edit-task" data-id="' + task.id + '" aria-label="' + window.I18N.t("common.edit") + '" title="' + window.I18N.t("common.edit") + '">✏️</button>' +
    '<button class="btn-icon danger" data-action="delete-task" data-id="' + task.id + '" aria-label="' + window.I18N.t("common.delete") + '" title="' + window.I18N.t("common.delete") + '">🗑️</button>' +
    "</div>" +
    "</div>"
  );
}

function openSubtasksModal(taskId) {
  var task = window.Store.state.tasks.find(function (item) {
    return String(item.id) === String(taskId);
  });
  if (!task || !window.UI || !window.UI.modal) return;

  function buildSubtasksHTML() {
    if (!task.subtasks || !task.subtasks.length) {
      return '<p style="text-align:center;color:var(--text-3);padding:12px 0">' + window.I18N.t("subtasks.title") + " — " + window.I18N.t("projects.emptySub") + "</p>";
    }
    return task.subtasks.map(function (sub) {
      return (
        '<div class="modal-item">' +
        '<div class="item-left">' +
        '<input type="checkbox" class="task-checkbox" data-subtask-id="' + sub.id + '" data-task-id="' + task.id + '"' + (sub.done ? " checked" : "") + '>' +
        '<span class="item-name' + (sub.done ? " done" : "") + '">' + window.Utils.escapeHtml(sub.text) + "</span>" +
        "</div>" +
        '<button class="btn-icon danger" data-action="delete-subtask" data-id="' + sub.id + '" data-task-id="' + task.id + '">✕</button>' +
        "</div>"
      );
    }).join("");
  }

  var html =
    '<div class="modal-section-title">📋 ' + window.I18N.t("subtasks.title") + "</div>" +
    '<div id="subtasksList">' + buildSubtasksHTML() + "</div>" +
    '<div class="form-row" style="margin-top:14px">' +
    '<input type="text" id="newSubtaskInput" class="input" placeholder="' + window.I18N.t("subtasks.placeholder") + '" maxlength="140">' +
    '<button class="btn btn-primary btn-sm" data-action="add-subtask" data-id="' + task.id + '">' + window.I18N.t("subtasks.add") + "</button>" +
    "</div>";

  var content = window.UI.modal.open(window.I18N.t("subtasks.title"), html);
  if (!content) return;

  var listEl = content.querySelector("#subtasksList");
  var inputEl = content.querySelector("#newSubtaskInput");
  var addBtn = content.querySelector('[data-action="add-subtask"]');

  function refreshList() {
    if (listEl) listEl.innerHTML = buildSubtasksHTML();
  }

  if (addBtn) {
    addBtn.addEventListener("click", function () {
      var text = window.Utils.sanitizeText(inputEl ? inputEl.value : "", 140);
      if (!text) return;
      window.Store.addSubtask(taskId, text);
      if (inputEl) inputEl.value = "";
      refreshList();
      refreshAll();
    });
  }

  if (inputEl) {
    inputEl.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        addBtn.click();
      }
    });
  }

  if (content) {
    content.addEventListener("change", function (e) {
      if (e.target.dataset && e.target.dataset.subtaskId) {
        window.Store.toggleSubtask(e.target.dataset.taskId, e.target.dataset.subtaskId);
        refreshList();
        refreshAll();
      }
    });
    content.addEventListener("click", function (e) {
      var delBtn = e.target.closest('[data-action="delete-subtask"]');
      if (delBtn) {
        window.Store.removeSubtask(delBtn.dataset.taskId, delBtn.dataset.id);
        refreshList();
        refreshAll();
      }
    });
  }
}
function enableTaskSwipe(container) {
  if (!container || !window.Utils.makeSwipeable) return;
  const items = container.querySelectorAll(".task-item");
  items.forEach(function (item) {
    const taskId = item.querySelector('[data-action="edit-task"]');
    if (!taskId) return;
    const id = taskId.dataset.id;
    window.Utils.makeSwipeable(item, {
      onSwipeRight: function () {
        var dateContext = item.querySelector('.task-checkbox');
        if (dateContext && dateContext.dataset.taskDate) {
          window.Store.toggleTaskOnDate(id, dateContext.dataset.taskDate);
        } else {
          toggle(id);
        }
      },
      onSwipeLeft: function () {
        remove(id);
      }
    });
  });
}
   
function render() {
var list = el("taskList");
if (!list) return;

var today = window.Calendar.todayKey();
var items = window.Store.state.tasks.slice().sort(function (a, b) {
return (
(a.done - b.done) ||
a.date.localeCompare(b.date) ||
((PRI_ORDER[a.priority] == null ? 1 : PRI_ORDER[a.priority]) -
(PRI_ORDER[b.priority] == null ? 1 : PRI_ORDER[b.priority]))
);
});

if (state.query) {
items = items.filter(function (task) {
return task.name.toLowerCase().includes(state.query);
});
}

if (state.filter === "pending") {
items = items.filter(function (task) {
if (window.Store.isTaskRecurring(task)) {
return window.Store.isTaskActiveOn(task, today) && !window.Store.isTaskDoneOnDate(task, today);
}
return !task.done;
});
}

if (state.filter === "done") {
items = items.filter(function (task) {
if (window.Store.isTaskRecurring(task)) {
return window.Store.isTaskActiveOn(task, today) && window.Store.isTaskDoneOnDate(task, today);
}
return task.done;
});
}

if (state.filter === "today") {
items = items.filter(function (task) {
return window.Store.isTaskActiveOn(task, today);
});
}

if (state.filter === "overdue") {
items = items.filter(function (task) {
if (window.Store.isTaskRecurring(task)) return false;
return !task.done && task.date < today;
});
}

var openCount = window.Store.state.tasks.filter(function (task) {
return !task.done && !window.Store.isTaskRecurring(task);
}).length;

var counter = el("taskCounter");
if (counter) {
counter.textContent = window.I18N.faNum(openCount) + " / " + window.I18N.faNum(window.Store.state.tasks.length);
}

if (!items.length) {
list.innerHTML =
'<div class="empty-state">' +
'<div class="empty-state-icon">📭</div>' +
'<div class="empty-state-text">' + window.I18N.t("tasks.emptyTitle") + "</div>" +
'<div class="empty-state-sub">' + window.I18N.t("tasks.emptySub") + "</div>" +
'<button class="btn btn-primary btn-sm" data-action="focus-task-form">' + window.I18N.t("tasks.newBtn") + "</button>" +
"</div>";
return;
}

list.innerHTML = items
.map(function (task) {
return taskRowHTML(task, false, today);
})
.join("");
list.innerHTML = items
  .map(function (task) {
    return taskRowHTML(task, false, today);
  })
  .join("");
enableTaskSwipe(list);
}

function renderHome() {
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
});

if (!items.length) {
box.innerHTML =
'<div class="empty-state">' +
'<div class="empty-state-icon">📭</div>' +
'<div class="empty-state-text">' + window.I18N.t("today.tasksEmptyTitle") + "</div>" +
'<div class="empty-state-sub">' + window.I18N.t("today.tasksEmptySub") + "</div>" +
"</div>";
return;
}

box.innerHTML =
'<div class="home-list">' +
items
.slice(0, 6)
.map(function (task) {
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
})
.join("") +
"</div>";
}

function renderToday() {
var box = el("todayTasks");
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
});

if (!items.length) {
box.innerHTML =
'<div class="empty-state">' +
'<div class="empty-state-icon">📭</div>' +
'<div class="empty-state-text">' + window.I18N.t("today.tasksEmptyTitle") + "</div>" +
'<div class="empty-state-sub">' + window.I18N.t("today.tasksEmptySub") + "</div>" +
"</div>";
return;
}

box.innerHTML = items
.map(function (task) {
return taskRowHTML(task, true, today);
})
.join("");
box.innerHTML = items
  .map(function (task) {
    return taskRowHTML(task, true, today);
  })
  .join("");
enableTaskSwipe(box);
}

  function bind() {
    const addBtn = el("addTaskBtn");
    const input = el("taskInput");
    const search = el("taskSearch");
    const filters = el("taskFilters");
    const clearBtn = el("clearDoneBtn");
    const focusBtn = el("focusTaskInput");
    const dateEl = el("taskDate");

    if (addBtn) {
      addBtn.addEventListener("click", add);
    }

    if (input) {
      input.addEventListener("keydown", function (event) {
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

        state.filter = chip.dataset.filter || "all";

        filters.querySelectorAll(".filter-chip").forEach(function (item) {
          item.classList.toggle("active", item === chip);
        });

        render();
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener("click", clearDone);
    }

    if (focusBtn) {
      focusBtn.addEventListener("click", function () {
        if (window.App && window.App.switchTab) {
          window.App.switchTab("tasks");
        }

        if (input) {
          input.focus();
        }
      });
    }

    if (dateEl) {
      dateEl.addEventListener("change", syncDateLabel);
      dateEl.addEventListener("input", syncDateLabel);
    }

    document.addEventListener("click", function (event) {
      const actionEl = event.target.closest("[data-action]");
      if (!actionEl) return;

      const action = actionEl.dataset.action;
      const id = actionEl.dataset.id;

 if (action === "edit-task") {
  edit(id);
} else if (action === "expand-subtasks") {
  openSubtasksModal(id);
}

      if (action === "delete-task") {
        remove(id);
      }

      if (action === "focus-task-form") {
var taskInput = el("taskInput");
if (taskInput) taskInput.focus();
}
       
      if (action === "clear-done") {
        clearDone();
      }
    });

   document.addEventListener("change", function (event) {
if (event.target.classList.contains("task-checkbox")) {
var taskId = event.target.dataset.taskId;
var dateContext = event.target.dataset.taskDate;
if (dateContext) {
window.Store.toggleTaskOnDate(taskId, dateContext);
var done = window.Store.isTaskDoneOnDate(
window.Store.state.tasks.find(function (t) { return String(t.id) === String(taskId); }),
dateContext
);
refreshAll();
if (done) {
toast(window.I18N.t("toast.nice"), "success");
}
} else {
toggle(taskId);
}
}
});
}

function init() {
  if (initialized) return;
  initialized = true;
  bind();
  initRecurrencePicker();
  var dateEl = el("taskDate");
  if (dateEl && !dateEl.value) {
    dateEl.value = window.Calendar.todayKey();
  }
  syncDateLabel();
}

window.Tasks = {
  render: render,
  renderHome: renderHome,
  renderToday: renderToday
};
window.Utils.onDomReady(init);
})();
