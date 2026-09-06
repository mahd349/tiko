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

  function syncDateLabel() {
    const dateEl = el("taskDate");
    const labelEl = el("taskDateJalali");

    if (!dateEl || !labelEl) return;

    labelEl.textContent = dateEl.value
      ? window.Calendar.keyToJalaliFull(dateEl.value)
      : "—";
  }

  function add() {
    const input = el("taskInput");
    if (!input) return;

    const name = window.Utils.sanitizeText(input.value, 160);

    if (!name) {
      toast(window.I18N.t("toast.enterTaskName"), "error");
      input.focus();
      return;
    }

    window.Store.addTask({
      name: name,
      date: el("taskDate") ? el("taskDate").value || window.Calendar.todayKey() : window.Calendar.todayKey(),
      priority: el("taskPriority") ? el("taskPriority").value || "med" : "med"
    });

    input.value = "";

    if (el("taskPriority")) {
      el("taskPriority").value = "med";
    }

    refreshAll();
    toast(window.I18N.t("toast.taskAdded"), "success");
    input.focus();
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
    const task = window.Store.state.tasks.find(function (item) {
      return String(item.id) === String(id);
    });

    if (!task) return;

    if (!window.UI || !window.UI.modal) return;

    const html =
      '<div class="form-row">' +
      '<label for="etName">' + window.I18N.t("common.name") + "</label>" +
      '<input id="etName" class="input" maxlength="160" value="' + window.Utils.escapeHtml(task.name) + '">' +
      "</div>" +
      '<div class="form-grid">' +
      '<div class="form-row">' +
      '<label for="etDate">' + window.I18N.t("common.date") + "</label>" +
      '<input id="etDate" type="date" class="input" value="' + task.date + '">' +
      "</div>" +
      '<div class="form-row">' +
      '<label for="etPri">' + window.I18N.t("common.priority") + "</label>" +
      '<select id="etPri" class="input">' +
      ['high', 'med', 'low'].map(function (p) {
        return '<option value="' + p + '"' + (task.priority === p ? " selected" : "") + ">" +
          window.I18N.t(PRI_KEY[p]) +
          "</option>";
      }).join("") +
      "</select>" +
      "</div>" +
      "</div>" +
      '<button class="btn btn-primary" data-action="save-task-edit" data-id="' + task.id + '" style="width:100%;margin-top:12px">' +
      window.I18N.t("common.save") +
      "</button>";

    const content = window.UI.modal.open(window.I18N.t("modal.editTask"), html);

    if (!content) return;

    const nameInput = content.querySelector("#etName");
    const dateInput = content.querySelector("#etDate");
    const priorityInput = content.querySelector("#etPri");
    const saveBtn = content.querySelector('[data-action="save-task-edit"]');

    if (nameInput) nameInput.focus();

    if (saveBtn) {
      saveBtn.addEventListener("click", function () {
        const name = window.Utils.sanitizeText(nameInput ? nameInput.value : "", 160);

        if (!name) {
          toast(window.I18N.t("toast.enterTaskName"), "error");
          if (nameInput) nameInput.focus();
          return;
        }

        window.Store.updateTask(id, {
          name: name,
          date: dateInput && dateInput.value ? dateInput.value : task.date,
          priority: priorityInput ? priorityInput.value : task.priority
        });

        window.UI.modal.close();
        refreshAll();
        toast(window.I18N.t("toast.saved"), "success");
      });
    }
  }

  function taskRowHTML(task, compact) {
    const today = window.Calendar.todayKey();
    let chip = "";

    if (task.date < today && !task.done) {
      chip =
        '<span class="chip overdue">' +
        window.I18N.t("common.overdue") + " — " + window.Calendar.keyToJalaliFull(task.date) +
        "</span>";
    } else if (task.date === today) {
      chip = '<span class="chip today">' + window.I18N.t("common.today") + "</span>";
    } else {
      chip = '<span class="chip">' + window.Calendar.keyToJalaliFull(task.date) + "</span>";
    }

    return (
      '<div class="task-item" style="--pri:' + (PRI_COLOR[task.priority] || PRI_COLOR.med) + '">' +
      '<input type="checkbox" class="task-checkbox" data-task-id="' + task.id + '"' +
      (task.done ? " checked" : "") +
      ' aria-label="' + window.I18N.t("common.done") + " — " + window.Utils.escapeHtml(task.name) + '">' +
      '<span class="task-text' + (task.done ? " done" : "") + '">' + window.Utils.escapeHtml(task.name) + "</span>" +
      (compact
        ? ""
        : '<span class="chip pri-' + (task.priority || "med") + '">' + window.I18N.t(PRI_KEY[task.priority || "med"]) + "</span>") +
      chip +
      '<div class="task-actions">' +
      '<button class="btn-icon" data-action="edit-task" data-id="' + task.id + '" aria-label="' + window.I18N.t("common.edit") + '" title="' + window.I18N.t("common.edit") + '">✏️</button>' +
      '<button class="btn-icon danger" data-action="delete-task" data-id="' + task.id + '" aria-label="' + window.I18N.t("common.delete") + '" title="' + window.I18N.t("common.delete") + '">🗑️</button>' +
      "</div>" +
      "</div>"
    );
  }

  function render() {
    const list = el("taskList");
    if (!list) return;

    const today = window.Calendar.todayKey();
    let items = window.Store.state.tasks.slice().sort(function (a, b) {
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
        return !task.done;
      });
    }

    if (state.filter === "done") {
      items = items.filter(function (task) {
        return task.done;
      });
    }

    if (state.filter === "today") {
      items = items.filter(function (task) {
        return task.date === today;
      });
    }

    if (state.filter === "overdue") {
      items = items.filter(function (task) {
        return !task.done && task.date < today;
      });
    }

    const openCount = window.Store.state.tasks.filter(function (task) {
      return !task.done;
    }).length;

    const counter = el("taskCounter");

    if (counter) {
      counter.textContent =
        window.I18N.faNum(openCount) + " / " + window.I18N.faNum(window.Store.state.tasks.length);
    }

    if (!items.length) {
      list.innerHTML =
        '<div class="empty-state">' +
        '<div class="empty-state-icon">📭</div>' +
        '<div class="empty-state-text">' + window.I18N.t("tasks.emptyTitle") + "</div>" +
        '<div class="empty-state-sub">' + window.I18N.t("tasks.emptySub") + "</div>" +
        "</div>";
      return;
    }

    list.innerHTML = items
      .map(function (task) {
        return taskRowHTML(task, false);
      })
      .join("");
  }

  function renderHome() {
    const box = el("homeTaskList");
    if (!box) return;

    const today = window.Calendar.todayKey();

    const items = window.Store.state.tasks
      .filter(function (task) {
        return task.date === today;
      })
      .sort(function (a, b) {
        return (
          (a.done - b.done) ||
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
          return (
            '<div class="home-row">' +
            '<input type="checkbox" class="task-checkbox" data-task-id="' + task.id + '"' +
            (task.done ? " checked" : "") +
            ' aria-label="' + window.Utils.escapeHtml(task.name) + '">' +
            '<span class="main">' + window.Utils.escapeHtml(task.name) + "</span>" +
            '<span class="meta">' +
            (task.done ? window.I18N.t("common.done") : window.I18N.t("common.open")) +
            "</span>" +
            "</div>"
          );
        })
        .join("") +
      "</div>";
  }

  function renderToday() {
    const box = el("todayTasks");
    if (!box) return;

    const today = window.Calendar.todayKey();

    const items = window.Store.state.tasks
      .filter(function (task) {
        return task.date === today;
      })
      .sort(function (a, b) {
        return (
          (a.done - b.done) ||
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
        return taskRowHTML(task, true);
      })
      .join("");
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
      }

      if (action === "delete-task") {
        remove(id);
      }

      if (action === "clear-done") {
        clearDone();
      }
    });

    document.addEventListener("change", function (event) {
      if (event.target.classList.contains("task-checkbox")) {
        toggle(event.target.dataset.taskId);
      }
    });
  }

  function init() {
    if (initialized) return;
    initialized = true;

    bind();

    const dateEl = el("taskDate");

    if (dateEl && !dateEl.value) {
      dateEl.value = window.Calendar.todayKey();
    }

    syncDateLabel();
  }

  window.Tasks = {
    init: init,
    render: render,
    renderHome: renderHome,
    renderToday: renderToday,
    add: add,
    toggle: toggle,
    remove: remove,
    clearDone: clearDone,
    edit: edit
  };

  window.Utils.onDomReady(init);
})();