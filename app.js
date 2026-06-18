(() => {
  "use strict";

  const embeddedConfig = {
    version: 1,
    ownerName: "Desmond",
    options: {
      statuses: ["backlog", "todo", "in_progress", "need_discussion", "blocked", "waiting", "review", "done", "dropped"],
      types: ["personal", "work_ticket", "learning", "agent_workflow", "career_review", "admin"],
      priorities: ["low", "medium", "high", "urgent"],
      energies: ["low", "medium", "high"],
      evidenceStates: ["missing", "later", "not_due", "captured"]
    },
    sync: {
      externalTicketSyncEnabled: false,
      ticketSystemProvider: "unknown",
      mcpPreferred: true,
      browserFallback: true,
      frequency: "manual"
    },
    sensitiveDataPolicy: {
      defaultMode: "sanitized_by_default",
      localPrivateDetailsAllowed: false,
      warning: "Do not add customer data, secrets, tokens, logs, screenshots, proprietary code, or confidential roadmap unless this repo is confirmed private and excluded from deploy/git."
    },
    views: [
      { id: "all", label: "All tasks", filter: {} },
      { id: "target-soon", label: "Target soon", filter: { targetSoonDays: 14, excludeStatus: ["done", "dropped"] } },
      { id: "need-discussion", label: "Need discussion", filter: { status: ["need_discussion"] } },
      { id: "blocked-waiting", label: "Blocked / waiting", filter: { status: ["blocked", "waiting"] } },
      { id: "agent-help", label: "Agent help", filter: { agentHelpWanted: true } },
      { id: "review", label: "Review / QA", filter: { status: ["review"] } },
      { id: "evidence-missing", label: "Evidence missing", filter: { evidenceState: ["missing"] } },
      { id: "work-tickets", label: "Work tickets", filter: { type: ["work_ticket"] } },
      { id: "personal-prep", label: "Personal prep", filter: { type: ["personal", "learning", "career_review"] } }
    ]
  };

  const emptyBoard = {
    meta: {
      version: 1,
      updatedAt: "",
      syncState: {
        lastSyncAt: "",
        lastSyncSource: "manual",
        lastSyncStatus: "never",
        lastSyncSummary: ""
      }
    },
    tasks: []
  };

  const activeStatuses = new Set(["backlog", "todo", "in_progress", "need_discussion", "blocked", "waiting", "review"]);
  const allowedReviewCategories = new Set([
    "shipped_work",
    "quality_improvement",
    "risk_reduction",
    "cross_team_impact",
    "documentation",
    "mentoring_helping",
    "bug_handling",
    "ai_workflow",
    "learning"
  ]);
  const priorityRank = { low: 1, medium: 2, high: 3, urgent: 4 };
  const energyRank = { low: 1, medium: 2, high: 3 };
  const statusRank = { dropped: 0, done: 1, review: 2, waiting: 3, todo: 4, in_progress: 5, need_discussion: 6, blocked: 7, backlog: 8 };

  let board = structuredClone(emptyBoard);
  let config = embeddedConfig;
  let fileHandle = null;
  let fileLabel = "not opened";

  const state = {
    route: "board",
    selectedId: "",
    quick: "all",
    query: "",
    filters: { status: "all", type: "all", priority: "all", evidence: "all" },
    sortBy: "priority",
    sortDirection: "desc",
    dirty: false,
    sourceMode: "loading",
    console: "ready",
    changedTaskIds: new Set(),
    baseTaskUpdatedAt: new Map()
  };

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function stableJson(value) {
    return `${JSON.stringify(value, null, 2)}\n`;
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function todayDate() {
    return new Date().toISOString().slice(0, 10);
  }

  function timestampForFile() {
    const date = new Date();
    const pad = (value) => String(value).padStart(2, "0");
    return [
      date.getFullYear(),
      pad(date.getMonth() + 1),
      pad(date.getDate()),
      "-",
      pad(date.getHours()),
      pad(date.getMinutes()),
      pad(date.getSeconds())
    ].join("");
  }

  function hasWritableFile() {
    return Boolean(fileHandle && "createWritable" in fileHandle);
  }

  function getTasks() {
    return Array.isArray(board.tasks) ? board.tasks.filter((task) => !task.deleted) : [];
  }

  function selectedTask() {
    const tasks = getTasks();
    return tasks.find((task) => task.id === state.selectedId) || tasks[0] || null;
  }

  async function fetchJson(path) {
    const response = await fetch(path, { cache: "no-store" });
    if (!response.ok) throw new Error(`Unable to load ${path}`);
    return response.json();
  }

  async function loadInitialData() {
    try {
      config = await fetchJson("data/config.json");
    } catch {
      config = embeddedConfig;
    }

    try {
      board = await fetchJson("data/tasks.json");
      state.sourceMode = "read-only auto-load: data/tasks.json";
      fileLabel = "data/tasks.json";
      state.console = "Loaded read-only data/tasks.json. Click Open tasks.json for direct save permission, or use Export update.";
    } catch {
      board = structuredClone(emptyBoard);
      state.sourceMode = "empty until tasks.json is opened";
      state.console = "Could not auto-load data/tasks.json. Click Open tasks.json.";
    }

    ensureBoardShape();
    state.changedTaskIds.clear();
    rememberBaseTaskState();
    state.selectedId = selectedTask()?.id || "";
  }

  function ensureBoardShape() {
    if (!board || typeof board !== "object") board = structuredClone(emptyBoard);
    if (!board.meta) board.meta = structuredClone(emptyBoard.meta);
    if (!board.meta.syncState) board.meta.syncState = structuredClone(emptyBoard.meta.syncState);
    if (!Array.isArray(board.tasks)) board.tasks = [];
  }

  function rememberBaseTaskState() {
    state.baseTaskUpdatedAt = new Map(getTasks().map((task) => [task.id, task.updatedAt || ""]));
  }

  function touchBoard(summary) {
    ensureBoardShape();
    board.meta.updatedAt = nowIso();
    if (summary) state.console = summary;
  }

  function markDirty(summary, taskId = "") {
    state.dirty = true;
    if (taskId) state.changedTaskIds.add(taskId);
    touchBoard(summary);
  }

  function chipClass(value) {
    if (["urgent", "high", "missing", "blocked"].includes(value)) return "danger";
    if (["medium", "later", "need_discussion", "waiting"].includes(value)) return "warn";
    if (["captured", "done", "review"].includes(value)) return "good";
    return "";
  }

  function statusLabel(status) {
    return status.replaceAll("_", " ");
  }

  function taskRefsText(task) {
    return (task.externalRefs || [])
      .map((ref) => ref.id || ref.label || ref.url)
      .filter(Boolean)
      .join(", ");
  }

  function primaryRefText(task) {
    const ref = (task.externalRefs || []).find((item) => item.id || item.label || item.url);
    return ref ? ref.id || ref.label || ref.url : "";
  }

  function taskAgentsText(task) {
    return (task.agents || [])
      .map((agent) => `${agent.role}:${agent.name}${agent.status ? `/${agent.status}` : ""}`)
      .join(", ");
  }

  function nextActionLabel(task) {
    if (task.nextAction) return task.nextAction;
    if (["done", "dropped"].includes(task.status)) return "No next action";
    return "Add next action";
  }

  function targetDueLabel(task) {
    const target = task.targetDate || "none";
    const due = task.dueDate || "none";
    return `target: ${target}\ndue: ${due}`;
  }

  function taskSearchText(task) {
    return [
      task.id,
      task.title,
      task.type,
      task.description,
      task.status,
      task.priority,
      task.energy,
      task.nextAction,
      task.notes,
      task.evidence?.state,
      task.evidence?.summary,
      task.evidence?.impact,
      ...(task.evidence?.reviewCategory || []),
      ...(task.evidence?.links || []).flatMap((ref) => [ref.id, ref.label, ref.url, ref.system, ref.type]),
      ...(task.externalRefs || []).flatMap((ref) => [ref.id, ref.label, ref.url, ref.system, ref.type]),
      ...(task.questions || []).flatMap((question) => [question.text, question.answer, question.askedTo, question.status]),
      ...(task.agents || []).flatMap((agent) => [agent.name, agent.role, agent.status, agent.threadId, agent.agentId]),
      ...(task.activity || []).map((activity) => activity.text)
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
  }

  function taskMatchesView(task, viewId) {
    const view = config.views.find((item) => item.id === viewId);
    if (!view) return true;
    const filter = view.filter || {};

    if (filter.status && !filter.status.includes(task.status)) return false;
    if (filter.excludeStatus && filter.excludeStatus.includes(task.status)) return false;
    if (filter.type && !filter.type.includes(task.type)) return false;
    if (filter.priority && !filter.priority.includes(task.priority)) return false;
    if (filter.evidenceState && !filter.evidenceState.includes(task.evidence?.state)) return false;
    if (typeof filter.agentHelpWanted === "boolean" && Boolean(task.agentHelp?.wanted) !== filter.agentHelpWanted) return false;

    if (filter.targetSoonDays) {
      if (!task.targetDate) return false;
      const today = new Date(`${todayDate()}T00:00:00`);
      const target = new Date(`${task.targetDate}T00:00:00`);
      const days = (target.getTime() - today.getTime()) / 86400000;
      if (Number.isNaN(days) || days > filter.targetSoonDays) return false;
    }

    return true;
  }

  function filteredTasks() {
    const query = state.query.trim().toLowerCase();
    const filtered = getTasks()
      .filter((task) => taskMatchesView(task, state.quick))
      .filter((task) => state.filters.status === "all" || task.status === state.filters.status)
      .filter((task) => state.filters.type === "all" || task.type === state.filters.type)
      .filter((task) => state.filters.priority === "all" || task.priority === state.filters.priority)
      .filter((task) => state.filters.evidence === "all" || task.evidence?.state === state.filters.evidence)
      .filter((task) => !query || taskSearchText(task).includes(query));

    return filtered.sort((a, b) => compareTasks(a, b));
  }

  function compareTasks(a, b) {
    const direction = state.sortDirection === "asc" ? 1 : -1;
    let left;
    let right;

    if (state.sortBy === "priority") {
      left = priorityRank[a.priority] || 0;
      right = priorityRank[b.priority] || 0;
    } else if (state.sortBy === "energy") {
      left = energyRank[a.energy] || 0;
      right = energyRank[b.energy] || 0;
    } else if (state.sortBy === "status") {
      left = statusRank[a.status] || 0;
      right = statusRank[b.status] || 0;
    } else {
      left = a[state.sortBy] || "";
      right = b[state.sortBy] || "";
    }

    if (left < right) return -1 * direction;
    if (left > right) return 1 * direction;
    return a.id.localeCompare(b.id);
  }

  function fillSelect(selector, values, allLabel = "") {
    const select = $(selector);
    if (!select) return;
    select.innerHTML = "";
    if (allLabel) {
      const option = document.createElement("option");
      option.value = "all";
      option.textContent = allLabel;
      select.append(option);
    }
    values.forEach((value) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      select.append(option);
    });
  }

  function renderSelectOptions() {
    fillSelect("#statusFilter", config.options.statuses, "Any status");
    fillSelect("#typeFilter", config.options.types, "Any type");
    fillSelect("#priorityFilter", config.options.priorities, "Any priority");
    fillSelect("#evidenceFilter", config.options.evidenceStates, "Any evidence");
    fillSelect("#detailStatus", config.options.statuses);
    fillSelect("#detailEvidence", config.options.evidenceStates);
    fillSelect("#createType", config.options.types);
    fillSelect("#createStatus", config.options.statuses);
    fillSelect("#createPriority", config.options.priorities);
    fillSelect("#createEnergy", config.options.energies);

    $("#createType").value = "personal";
    $("#createStatus").value = "todo";
    $("#createPriority").value = "medium";
    $("#createEnergy").value = "medium";
  }

  function renderSourceState() {
    const dirtyText = state.dirty ? "unsaved changes" : "clean";
    const accessText = hasWritableFile() ? "writable file opened" : "read-only snapshot";
    const changedText = state.changedTaskIds.size ? `${state.changedTaskIds.size} changed task(s)` : "no changed tasks";
    $("#sourceLine").textContent = `${accessText} · ${state.sourceMode} · ${dirtyText} · ${changedText} · ${getTasks().length} tasks`;
    $("#fileStatus").textContent = `${fileLabel}; ${accessText}; ${dirtyText}; ${changedText}.`;
    $("#syncConsole").textContent = state.console;

    const sync = board.meta?.syncState || emptyBoard.meta.syncState;
    $("#syncPageLastSync").innerHTML = `${escapeHtml(sync.lastSyncStatus || "never")}<br />${escapeHtml(sync.lastSyncSummary || "Manual only until config says otherwise.")}`;
    $("#configSummary").textContent = `provider: ${config.sync.ticketSystemProvider}; frequency: ${config.sync.frequency}; enabled: ${config.sync.externalTicketSyncEnabled ? "yes" : "no"}`;
  }

  function renderSidebar() {
    const tasks = getTasks();
    const quickFilters = $("#quickFilters");
    if (quickFilters) {
      quickFilters.innerHTML = config.views
        .map((view) => {
          const count = tasks.filter((task) => taskMatchesView(task, view.id)).length;
          return `<button class="view-button ${state.quick === view.id ? "active" : ""}" type="button" data-quick="${escapeHtml(view.id)}"><strong>${escapeHtml(view.label)}</strong><span>${count}</span></button>`;
        })
        .join("");
    }

    const inlineQuickFilters = $("#inlineQuickFilters");
    if (inlineQuickFilters) {
      inlineQuickFilters.innerHTML = config.views
        .filter((view) => ["need-discussion", "blocked-waiting", "agent-help", "evidence-missing"].includes(view.id))
        .map((view) => `<button class="pill ${state.quick === view.id ? "active" : ""}" type="button" data-quick="${escapeHtml(view.id)}">${escapeHtml(view.label)}</button>`)
        .join("");
    }

    const statusCounts = Object.fromEntries(config.options.statuses.map((status) => [status, 0]));
    tasks.forEach((task) => {
      statusCounts[task.status] = (statusCounts[task.status] || 0) + 1;
    });

    const statusSummary = $("#statusSummary");
    if (statusSummary) {
      const nonZeroCounts = config.options.statuses
        .map((status) => [statusLabel(status), statusCounts[status] || 0])
        .filter(([, count]) => count > 0)
        .map(([label, count]) => `${label} ${count}`);
      statusSummary.textContent = nonZeroCounts.length ? `Status: ${nonZeroCounts.join(" · ")}` : "Status: no tasks";
    }

    const statusCountsPanel = $("#statusCounts");
    if (statusCountsPanel) {
      statusCountsPanel.innerHTML = [
        ["all", tasks.length],
        ...config.options.statuses.map((status) => [status, statusCounts[status] || 0])
      ]
        .map(([status, count]) => {
          const active = state.filters.status === status || (status === "all" && state.filters.status === "all");
          return `<button class="state-card ${active ? "active" : ""}" type="button" data-status-count="${escapeHtml(status)}"><strong>${count}</strong><span>${escapeHtml(statusLabel(status))}</span></button>`;
        })
        .join("");
    }

    const view = config.views.find((item) => item.id === state.quick);
    const filterParts = [view?.label || "All tasks"];
    Object.entries(state.filters).forEach(([key, value]) => {
      if (value !== "all") filterParts.push(`${key}: ${value}`);
    });
    if (state.query) filterParts.push(`search: "${state.query}"`);
    filterParts.push(`sort: ${state.sortBy} ${state.sortDirection}`);
    const filterSummary = $("#filterSummary");
    if (filterSummary) filterSummary.textContent = filterParts.join(" · ");
  }

  function renderSummary(filtered) {
    const summaryCards = $("#summaryCards");
    if (!summaryCards) return;
    const tasks = getTasks();
    const needDiscussion = tasks.filter((task) => task.status === "need_discussion").length;
    const missingEvidence = tasks.filter((task) => task.evidence?.state === "missing").length;
    const agentHelp = tasks.filter((task) => task.agentHelp?.wanted).length;

    summaryCards.innerHTML = [
      ["Visible tasks", filtered.length, "After current filters and search."],
      ["Need discussion", needDiscussion, "Requires manager, BE, QA, policy, or self clarification."],
      ["Evidence missing", missingEvidence, "Done/review tasks should eventually capture useful evidence."],
      ["Agent help", agentHelp, "Agents may help only after explicit assignment."]
    ]
      .map(([label, value, copy]) => `<div class="summary-card"><strong>${value}</strong><span>${label}<br />${copy}</span></div>`)
      .join("");
  }

  function flagsHtml(task) {
    const agents = taskAgentsText(task);
    const questionCount = task.questions?.length || 0;
    const evidenceState = task.evidence?.state || "missing";
    return [
      ["urgent", "high"].includes(task.priority) ? `<span class="chip ${chipClass(task.priority)}">${escapeHtml(task.priority)}</span>` : "",
      ["missing", "later"].includes(evidenceState) ? `<span class="chip ${chipClass(evidenceState)}">evidence: ${escapeHtml(evidenceState)}</span>` : "",
      task.agentHelp?.wanted ? '<span class="chip good">agent help</span>' : "",
      agents ? `<span class="chip" title="${escapeHtml(agents)}">agent assigned</span>` : "",
      questionCount ? `<span class="chip warn">${questionCount} question${questionCount === 1 ? "" : "s"}</span>` : ""
    ]
      .filter(Boolean)
      .join("") || '<span class="empty-flags">none</span>';
  }

  function renderTable(filtered) {
    $("#visibleCount").textContent = filtered.length;
    $("#totalCount").textContent = getTasks().length;
    $("#emptyState").classList.toggle("active", filtered.length === 0);
    $("#mobileEmptyState").classList.toggle("active", filtered.length === 0);
    $("#taskRows").innerHTML = filtered
      .map((task) => {
        const selected = task.id === state.selectedId ? "selected" : "";
        const primaryRef = primaryRefText(task);
        return `
          <tr class="${selected}" data-task-row="${escapeHtml(task.id)}">
            <td>
              <p class="task-title">${escapeHtml(task.title)}</p>
              <div class="task-sub">${escapeHtml(task.id)} · ${escapeHtml(task.type)}${primaryRef ? ` · ${escapeHtml(primaryRef)}` : ""}</div>
            </td>
            <td><span class="status"><span class="dot ${escapeHtml(task.status)}"></span>${escapeHtml(statusLabel(task.status))}</span></td>
            <td>${escapeHtml(nextActionLabel(task))}</td>
            <td><span class="mono">${escapeHtml(targetDueLabel(task)).replaceAll("\n", "<br />")}</span></td>
            <td><div class="chips compact">${flagsHtml(task)}</div></td>
            <td><button class="btn" type="button" data-open-detail="${escapeHtml(task.id)}">Open detail</button></td>
          </tr>
        `;
      })
      .join("");
    renderMobileCards(filtered);
  }

  function renderMobileCards(filtered) {
    $("#mobileTaskCards").innerHTML = filtered
      .map((task) => {
        const primaryRef = primaryRefText(task);
        return `
          <article class="mobile-task-card" data-task-row="${escapeHtml(task.id)}">
            <p class="task-title">${escapeHtml(task.title)}</p>
            <div class="task-sub">${escapeHtml(task.id)} · ${escapeHtml(task.type)}${primaryRef ? ` · ${escapeHtml(primaryRef)}` : ""}</div>
            <div class="chips">
              <span class="status"><span class="dot ${escapeHtml(task.status)}"></span>${escapeHtml(statusLabel(task.status))}</span>
              <span class="chip ${chipClass(task.priority)}">${escapeHtml(task.priority)}</span>
              <span class="chip ${chipClass(task.evidence?.state)}">${escapeHtml(task.evidence?.state || "missing")}</span>
              ${task.agentHelp?.wanted ? '<span class="chip good">agent help</span>' : ""}
            </div>
            <div class="mobile-task-meta">
              <div><strong>Next:</strong> ${escapeHtml(nextActionLabel(task))}</div>
              <div><strong>Date:</strong> <span class="mono">${escapeHtml(task.targetDate || "none")}</span> target · <span class="mono">${escapeHtml(task.dueDate || "none")}</span> due</div>
            </div>
            <div class="btn-row" style="margin-top: 10px;">
              <button class="btn" type="button" data-open-detail="${escapeHtml(task.id)}">Open detail</button>
            </div>
          </article>
        `;
      })
      .join("");
  }

  function setDetailDisabled(disabled) {
    [
      "#detailTitleInput",
      "#detailDescriptionInput",
      "#detailNextAction",
      "#detailQuestions",
      "#detailRefs",
      "#detailEvidenceSummary",
      "#detailEvidenceImpact",
      "#detailEvidenceCategories",
      "#detailEvidenceLinks",
      "#detailStatus",
      "#detailEvidence",
      "#detailAgentHelp"
    ].forEach((selector) => {
      const field = $(selector);
      if (field) field.disabled = disabled;
    });
  }

  function renderDetail() {
    const task = selectedTask();
    clearDetailErrors();

    if (!task) {
      setDetailDisabled(true);
      $("#detailTaskId").textContent = "No task";
      $("#detailTitleInput").value = "";
      $("#detailDescriptionInput").value = "";
      $("#detailNextAction").value = "";
      $("#detailQuestions").value = "";
      $("#detailRefs").value = "";
      $("#detailEvidenceSummary").value = "";
      $("#detailEvidenceImpact").value = "";
      $("#detailEvidenceCategories").value = "";
      $("#detailEvidenceLinks").value = "";
      $("#detailStatusBand").innerHTML = '<span class="chip">Open tasks.json or create a task</span>';
      $("#detailMetaSummary").innerHTML = "";
      $("#detailActivity").innerHTML = "";
      $("#agentCommand").textContent = "Select a task first.";
      return;
    }

    setDetailDisabled(false);
    state.selectedId = task.id;
    $("#detailTaskId").textContent = task.id;
    $("#detailTitleInput").value = task.title || "";
    $("#detailDescriptionInput").value = task.description || "";
    $("#detailNextAction").value = task.nextAction || "";
    $("#detailQuestions").value = (task.questions || []).map((question) => question.text).join("\n");
    $("#detailRefs").value = (task.externalRefs || []).map(formatRefForTextarea).join("\n");
    $("#detailEvidenceSummary").value = task.evidence?.summary || "";
    $("#detailEvidenceImpact").value = task.evidence?.impact || "";
    $("#detailEvidenceCategories").value = (task.evidence?.reviewCategory || []).join(", ");
    $("#detailEvidenceCategories").classList.remove("invalid");
    $("#detailEvidenceLinks").value = (task.evidence?.links || []).map(formatRefForTextarea).join("\n");
    $("#detailStatus").value = task.status;
    $("#detailEvidence").value = task.evidence?.state || "missing";
    $("#detailAgentHelp").value = String(Boolean(task.agentHelp?.wanted));

    $("#detailStatusBand").innerHTML = [
      `<span class="status"><span class="dot ${escapeHtml(task.status)}"></span>${escapeHtml(task.status)}</span>`,
      `<span class="chip ${chipClass(task.priority)}">${escapeHtml(task.priority)}</span>`,
      `<span class="chip">${escapeHtml(task.energy)} energy</span>`,
      `<span class="chip ${chipClass(task.evidence?.state)}">evidence: ${escapeHtml(task.evidence?.state || "missing")}</span>`,
      `<span class="chip">target: ${escapeHtml(task.targetDate || "none")}</span>`,
      `<span class="chip">due: ${escapeHtml(task.dueDate || "none")}</span>`
    ].join("");

    $("#detailStateHint").textContent =
      task.evidence?.state === "missing"
        ? "Evidence is still missing. Before review/done, capture impact, risk, decision, or a useful link."
        : "Evidence and agent help are saved with state.";

    $("#detailMetaSummary").innerHTML = [
      ["Type", task.type],
      ["Current agents", taskAgentsText(task) || "none"],
      ["Questions", task.questions?.length ? `${task.questions.length} open/known` : "none"],
      ["References", taskRefsText(task) || "none"],
      ["Due date", task.dueDate || "none"],
      ["Evidence categories", task.evidence?.reviewCategory?.join(", ") || "none"],
      ["Updated", task.updatedAt || "unknown"]
    ]
      .map(([label, value]) => `<li><strong>${escapeHtml(label)}</strong>${escapeHtml(value)}</li>`)
      .join("");

    $("#detailActivity").innerHTML = (task.activity || [])
      .slice(0, 8)
      .map((item) => `<li>${escapeHtml(item.text)}<br /><span class="mono">${escapeHtml(item.at)}</span></li>`)
      .join("");

    $("#agentCommand").textContent = `Ask Codex/Claude: please pick up ${task.id} as worker/reviewer. Read AGENTS.md first, update agents[], then run npm run validate.`;
  }

  function renderPages() {
    $$(".page").forEach((page) => page.classList.toggle("active", page.id === `page-${state.route}`));
    $$(".tab").forEach((tab) => tab.classList.toggle("active", tab.dataset.routeButton === state.route));
  }

  function renderControls() {
    $$("[data-search-input]").forEach((input) => {
      input.value = state.query;
    });
    $("#statusFilter").value = state.filters.status;
    $("#typeFilter").value = state.filters.type;
    $("#priorityFilter").value = state.filters.priority;
    $("#evidenceFilter").value = state.filters.evidence;
    $("#sortBy").value = state.sortBy;
    $("#sortDirection").value = state.sortDirection;
  }

  function renderAll() {
    if (!state.selectedId && selectedTask()) state.selectedId = selectedTask().id;
    const filtered = filteredTasks();
    renderSourceState();
    renderSidebar();
    renderSummary(filtered);
    renderTable(filtered);
    renderDetail();
    renderControls();
    renderPages();
  }

  function setRoute(route) {
    state.route = route;
    window.location.hash = route;
    renderAll();
  }

  function clearFilters() {
    state.quick = "all";
    state.filters = { status: "all", type: "all", priority: "all", evidence: "all" };
    state.query = "";
    renderAll();
  }

  function setCreateFieldError(field, message) {
    const error = document.getElementById(`${field.name}Error`);
    field.classList.toggle("invalid", Boolean(message));
    field.setAttribute("aria-invalid", message ? "true" : "false");
    if (error) {
      error.textContent = message || "";
      error.classList.toggle("active", Boolean(message));
    }
  }

  function clearCreateErrors(form) {
    $("#createFormError").classList.remove("active");
    ["title", "nextAction"].forEach((name) => setCreateFieldError(form.elements[name], ""));
  }

  function validateCreateForm(form) {
    clearCreateErrors(form);
    const requiredFields = [
      [form.elements.title, "Title is required."],
      [form.elements.nextAction, "Next action is required so the task is immediately actionable."]
    ];
    const invalid = requiredFields.filter(([field, message]) => {
      const missing = !field.value.trim();
      if (missing) setCreateFieldError(field, message);
      return missing;
    });
    $("#createFormError").classList.toggle("active", invalid.length > 0);
    if (invalid.length > 0) invalid[0][0].focus();
    return invalid.length === 0;
  }

  function setDetailFieldError(field, errorSelector, message) {
    const error = $(errorSelector);
    field.classList.toggle("invalid", Boolean(message));
    field.setAttribute("aria-invalid", message ? "true" : "false");
    if (error) {
      error.textContent = message || "";
      error.classList.toggle("active", Boolean(message));
    }
  }

  function clearDetailErrors() {
    $("#detailEditError").textContent = "Title is required. Active tasks also need a next action.";
    $("#detailEditError").classList.remove("active");
    setDetailFieldError($("#detailTitleInput"), "#detailTitleError", "");
    setDetailFieldError($("#detailNextAction"), "#detailNextActionError", "");
  }

  function validateDetailEdits(task) {
    clearDetailErrors();
    const invalid = [];
    if (!$("#detailTitleInput").value.trim()) {
      setDetailFieldError($("#detailTitleInput"), "#detailTitleError", "Title is required.");
      invalid.push($("#detailTitleInput"));
    }
    if (task && activeStatuses.has(task.status) && !$("#detailNextAction").value.trim()) {
      setDetailFieldError($("#detailNextAction"), "#detailNextActionError", "Active tasks need a next action.");
      invalid.push($("#detailNextAction"));
    }
    $("#detailEditError").classList.toggle("active", invalid.length > 0);
    if (invalid.length > 0) invalid[0].focus();
    return invalid.length === 0;
  }

  function validateStatusChange(task, nextStatus) {
    clearDetailErrors();
    const nextAction = $("#detailNextAction").value.trim();
    if (activeStatuses.has(nextStatus) && !nextAction) {
      setDetailFieldError($("#detailNextAction"), "#detailNextActionError", "Active tasks need a next action before saving this status.");
      $("#detailEditError").textContent = "Add a next action before moving this task into an active status.";
      $("#detailEditError").classList.add("active");
      $("#detailNextAction").focus();
      return false;
    }
    if (task.nextAction !== nextAction) task.nextAction = nextAction;
    return true;
  }

  function parseLineList(value) {
    return value
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function parseReviewCategories(value) {
    return Array.from(
      new Set(
        value
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      )
    );
  }

  function validateReviewCategories() {
    const field = $("#detailEvidenceCategories");
    const categories = parseReviewCategories(field.value);
    const invalid = categories.filter((category) => !allowedReviewCategories.has(category));
    field.classList.toggle("invalid", invalid.length > 0);
    if (invalid.length > 0) {
      state.console = `Invalid review categories: ${invalid.join(", ")}. Use schema categories like risk_reduction, quality_improvement, ai_workflow, learning.`;
      field.focus();
      renderSourceState();
      return false;
    }
    return true;
  }

  function parseRefLine(item) {
    const parts = item.split("|").map((part) => part.trim()).filter(Boolean);
    if (parts.length >= 2) {
      const url = parts.find((part) => part.startsWith("http")) || "";
      return {
        type: url ? "other" : "document",
        system: "manual",
        id: parts[0].startsWith("http") ? "" : parts[0],
        url,
        label: parts[0]
      };
    }
    if (/^https?:\/\//.test(item)) {
      return { type: "other", system: "manual", id: "", url: item, label: item };
    }
    return { type: "ticket", system: "unknown", id: item, url: "", label: item };
  }

  function parseRefList(value) {
    return value
      .split(/\n|,/)
      .map((item) => item.trim())
      .filter(Boolean)
      .map(parseRefLine);
  }

  function formatRefForTextarea(ref) {
    if (ref.url && (ref.id || ref.label)) return `${ref.id || ref.label} | ${ref.url}`;
    return ref.id || ref.url || ref.label || "";
  }

  function syncQuestions(task, rawText) {
    const existingByText = new Map((task.questions || []).map((question) => [question.text, question]));
    return parseLineList(rawText).map((text, index) => {
      if (task.questions?.[index]) return { ...task.questions[index], text };
      const existing = existingByText.get(text);
      if (existing) return existing;
      return {
        id: `${task.id}-q-${String(index + 1).padStart(3, "0")}-${Date.now()}`,
        text,
        status: "open",
        answer: "",
        askedTo: "",
        createdAt: nowIso()
      };
    });
  }

  function syncRefs(existingRefs = [], rawText) {
    return parseLineList(rawText).flatMap((line, index) => {
      const parsedRefs = parseRefList(line);
      return parsedRefs.map((parsed, offset) => {
        const existing = existingRefs[index + offset] || {};
        return {
          ...existing,
          ...parsed,
          type: parsed.type || existing.type || "other",
          system: parsed.system || existing.system || "manual",
          id: parsed.id || existing.id || "",
          url: parsed.url || existing.url || "",
          label: parsed.label || existing.label || parsed.id || parsed.url || ""
        };
      });
    });
  }

  function nextTaskId() {
    const max = getTasks().reduce((highest, task) => {
      const match = task.id.match(/^PTB-(\d+)$/);
      return match ? Math.max(highest, Number(match[1])) : highest;
    }, 0);
    return `PTB-${String(max + 1).padStart(3, "0")}`;
  }

  function activity(id, type, text, actor = config.ownerName || "Desmond") {
    return {
      id: `${id}-a-${Date.now()}`,
      type,
      text,
      actor,
      at: nowIso()
    };
  }

  function createTaskFromValues(values) {
    const id = nextTaskId();
    const createdAt = nowIso();
    return {
      id,
      title: values.title.trim(),
      type: values.type || "personal",
      description: values.description?.trim() || "",
      status: values.status || "todo",
      priority: values.priority || "medium",
      energy: values.energy || "medium",
      targetDate: values.targetDate || "",
      dueDate: values.dueDate || "",
      nextAction: values.nextAction?.trim() || "",
      notes: "",
      repeatHint: "none",
      owner: {
        type: "human",
        name: config.ownerName || "Desmond"
      },
      agentHelp: {
        wanted: values.agentHelp === "true",
        reason: values.agentHelp === "true" ? "Requested during task creation." : ""
      },
      agents: [],
      externalRefs: values.ref ? parseRefList(values.ref) : [],
      evidence: {
        state: "not_due",
        summary: "",
        impact: "",
        links: [],
        reviewCategory: []
      },
      questions: [],
      checklist: [],
      activity: [
        {
          id: `${id}-a-001`,
          type: "created",
          text: "Created in task board UI.",
          actor: config.ownerName || "Desmond",
          at: createdAt
        }
      ],
      createdAt,
      updatedAt: createdAt
    };
  }

  function addTaskFromForm(form) {
    if (!validateCreateForm(form)) return;
    const values = Object.fromEntries(new FormData(form).entries());
    const task = createTaskFromValues(values);
    board.tasks.unshift(task);
    state.selectedId = task.id;
    markDirty(`Created ${task.id}. Save or export update to persist.`, task.id);
    clearCreateErrors(form);
    form.reset();
    renderSelectOptions();
    setRoute("detail");
  }

  function quickAddTask() {
    const input = $("#quickAddInput");
    const title = input.value.trim();
    if (!title) {
      input.focus();
      return;
    }
    const task = createTaskFromValues({
      title,
      type: "personal",
      status: "backlog",
      priority: "medium",
      energy: "medium",
      targetDate: "",
      description: "",
      nextAction: "Clarify and normalize this rough task.",
      ref: "",
      agentHelp: "false"
    });
    task.activity[0].text = "Created from quick add.";
    board.tasks.unshift(task);
    input.value = "";
    state.selectedId = task.id;
    markDirty(`Quick-added ${task.id}. Save or export update to persist.`, task.id);
    renderAll();
  }

  function saveDetailEdits() {
    const task = selectedTask();
    if (!task || !validateDetailEdits(task)) return;
    task.title = $("#detailTitleInput").value.trim();
    task.description = $("#detailDescriptionInput").value.trim();
    task.nextAction = $("#detailNextAction").value.trim();
    task.questions = syncQuestions(task, $("#detailQuestions").value);
    task.externalRefs = syncRefs(task.externalRefs || [], $("#detailRefs").value);
    task.updatedAt = nowIso();
    task.activity.unshift(activity(task.id, "edited", "Task content and context updated."));
    markDirty(`Updated ${task.id}. Save or export update to persist.`, task.id);
    renderAll();
  }

  function saveDetailStatus() {
    const task = selectedTask();
    if (!task) return;
    const nextStatus = $("#detailStatus").value;
    if (!validateStatusChange(task, nextStatus)) return;
    if (!validateReviewCategories()) return;
    task.status = nextStatus;
    task.evidence.state = $("#detailEvidence").value;
    task.evidence.summary = $("#detailEvidenceSummary").value.trim();
    task.evidence.impact = $("#detailEvidenceImpact").value.trim();
    task.evidence.reviewCategory = parseReviewCategories($("#detailEvidenceCategories").value);
    task.evidence.links = syncRefs(task.evidence.links || [], $("#detailEvidenceLinks").value);
    task.agentHelp.wanted = $("#detailAgentHelp").value === "true";
    if (!task.agentHelp.wanted) task.agentHelp.reason = "";
    if (task.agentHelp.wanted && !task.agentHelp.reason) task.agentHelp.reason = "Requested from detail page.";
    task.updatedAt = nowIso();
    task.activity.unshift(activity(task.id, "status_changed", `State saved: ${task.status}, evidence ${task.evidence.state}.`));
    markDirty(`Saved state/evidence for ${task.id}. Save or export update to persist.`, task.id);
    renderAll();
  }

  function markDone() {
    const task = selectedTask();
    if (!task) return;
    if (!validateReviewCategories()) return;
    task.status = "done";
    task.evidence.state = $("#detailEvidence").value;
    task.evidence.summary = $("#detailEvidenceSummary").value.trim();
    task.evidence.impact = $("#detailEvidenceImpact").value.trim();
    task.evidence.reviewCategory = parseReviewCategories($("#detailEvidenceCategories").value);
    task.evidence.links = syncRefs(task.evidence.links || [], $("#detailEvidenceLinks").value);
    task.agentHelp.wanted = $("#detailAgentHelp").value === "true";
    task.updatedAt = nowIso();
    task.activity.unshift(activity(task.id, "done", task.evidence.state === "missing" ? "Marked done; evidence still missing." : "Marked done."));
    markDirty(`Marked ${task.id} done. Save or export update to persist.`, task.id);
    renderAll();
  }

  async function loadBoardFromText(text, sourceLabel, handle = null) {
    const parsed = JSON.parse(text);
    if (!parsed || !Array.isArray(parsed.tasks)) throw new Error("Selected file does not look like a task board JSON file.");
    board = parsed;
    ensureBoardShape();
    fileHandle = handle;
    fileLabel = sourceLabel;
    state.sourceMode = handle ? `writable open: ${sourceLabel}` : `read-only loaded: ${sourceLabel}`;
    state.dirty = false;
    state.changedTaskIds.clear();
    rememberBaseTaskState();
    state.selectedId = selectedTask()?.id || "";
    state.console = `Loaded ${sourceLabel}.`;
    renderAll();
  }

  async function openTasksFile() {
    try {
      if ("showOpenFilePicker" in window) {
        const [handle] = await window.showOpenFilePicker({
          types: [{ description: "JSON files", accept: { "application/json": [".json"] } }],
          multiple: false
        });
        const file = await handle.getFile();
        await loadBoardFromText(await file.text(), file.name, handle);
        return;
      }
      $("#tasksFileInput").click();
    } catch (error) {
      if (error?.name !== "AbortError") {
        state.console = `Open failed: ${error.message}`;
        renderAll();
      }
    }
  }

  async function saveBoard() {
    try {
      if (!fileHandle || !("createWritable" in fileHandle)) {
        state.console = "Save needs a writable file handle. Click Open tasks.json first, or use Export update.";
        renderAll();
        return;
      }
      touchBoard("Saving...");
      const writable = await fileHandle.createWritable();
      await writable.write(stableJson(board));
      await writable.close();
      state.dirty = false;
      state.changedTaskIds.clear();
      rememberBaseTaskState();
      state.console = `Saved ${fileLabel}.`;
      renderAll();
    } catch (error) {
      state.console = `Save failed: ${error.message}. Export update instead.`;
      renderAll();
    }
  }

  function exportUpdate() {
    if (state.changedTaskIds.size === 0) {
      state.console = "No changed tasks to export.";
      renderAll();
      return;
    }
    touchBoard("Exporting changed tasks...");
    const filename = `tasks-update-${timestampForFile()}.json`;
    const changedTasks = getTasks().filter((task) => state.changedTaskIds.has(task.id));
    const update = {
      meta: {
        updateFormatVersion: 1,
        exportedAt: nowIso(),
        sourceFile: fileLabel,
        sourceBoardUpdatedAt: board.meta.updatedAt || "",
        baseTaskUpdatedAt: Object.fromEntries(changedTasks.map((task) => [task.id, state.baseTaskUpdatedAt.get(task.id) || ""]))
      },
      taskUpdates: changedTasks
    };
    const blob = new Blob([stableJson(update)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    state.console = `Exported ${changedTasks.length} changed task(s) to ${filename}. Move it to updates/ then run npm run import-update -- updates/${filename}`;
    renderAll();
  }

  async function handleFallbackFileInput(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      await loadBoardFromText(await file.text(), file.name, null);
    } catch (error) {
      state.console = `File load failed: ${error.message}`;
      renderAll();
    } finally {
      event.target.value = "";
    }
  }

  async function handleAction(action) {
    if (action === "clear-filters") clearFilters();
    if (action === "quick-add") quickAddTask();
    if (action === "open-tasks-file") await openTasksFile();
    if (action === "save-board") await saveBoard();
    if (action === "export-update") exportUpdate();
    if (action === "save-detail-edits") saveDetailEdits();
    if (action === "save-detail-status") saveDetailStatus();
    if (action === "mark-done") markDone();
  }

  function bindEvents() {
    document.addEventListener("click", (event) => {
      const routeButton = event.target.closest("[data-route-button]");
      if (routeButton) {
        setRoute(routeButton.dataset.routeButton);
        return;
      }

      const quickButton = event.target.closest("[data-quick]");
      if (quickButton) {
        state.quick = quickButton.dataset.quick;
        renderAll();
        return;
      }

      const countButton = event.target.closest("[data-status-count]");
      if (countButton) {
        state.quick = "all";
        state.filters.status = countButton.dataset.statusCount;
        renderAll();
        return;
      }

      const detailButton = event.target.closest("[data-open-detail]");
      if (detailButton) {
        state.selectedId = detailButton.dataset.openDetail;
        setRoute("detail");
        return;
      }

      const row = event.target.closest("[data-task-row]");
      if (row && !event.target.closest("button,a,input,select,textarea,label")) {
        state.selectedId = row.dataset.taskRow;
        setRoute("detail");
        return;
      }

      const action = event.target.closest("[data-action]")?.dataset.action;
      if (action) void handleAction(action);
    });

    $$("[data-search-input]").forEach((input) => {
      input.addEventListener("input", (event) => {
        state.query = event.target.value;
        renderAll();
      });
    });

    ["status", "type", "priority", "evidence"].forEach((key) => {
      $(`#${key}Filter`).addEventListener("change", (event) => {
        state.filters[key] = event.target.value;
        renderAll();
      });
    });

    $("#sortBy").addEventListener("change", (event) => {
      state.sortBy = event.target.value;
      renderAll();
    });

    $("#sortDirection").addEventListener("change", (event) => {
      state.sortDirection = event.target.value;
      renderAll();
    });

    $("#tasksFileInput").addEventListener("change", (event) => {
      void handleFallbackFileInput(event);
    });

    $("#quickAddInput").addEventListener("keydown", (event) => {
      if (event.key === "Enter") quickAddTask();
    });

    $("#createForm").addEventListener("submit", (event) => {
      event.preventDefault();
      addTaskFromForm(event.currentTarget);
    });

    ["title", "nextAction"].forEach((name) => {
      $("#createForm").elements[name].addEventListener("input", (event) => {
        if (event.target.value.trim()) setCreateFieldError(event.target, "");
      });
    });

    [
      ["#detailTitleInput", "#detailTitleError"],
      ["#detailNextAction", "#detailNextActionError"]
    ].forEach(([fieldSelector, errorSelector]) => {
      $(fieldSelector).addEventListener("input", (event) => {
        if (event.target.value.trim()) setDetailFieldError(event.target, errorSelector, "");
        if ($("#detailTitleInput").value.trim() && $("#detailNextAction").value.trim()) {
          $("#detailEditError").classList.remove("active");
        }
      });
    });

    window.addEventListener("hashchange", () => {
      const nextRoute = window.location.hash.replace("#", "");
      if (["board", "detail", "create", "sync"].includes(nextRoute)) {
        state.route = nextRoute;
        renderAll();
      }
    });

    window.addEventListener("beforeunload", (event) => {
      if (!state.dirty) return;
      event.preventDefault();
      event.returnValue = "";
    });
  }

  async function init() {
    await loadInitialData();
    renderSelectOptions();
    bindEvents();
    const initialRoute = window.location.hash.replace("#", "");
    if (["board", "detail", "create", "sync"].includes(initialRoute)) state.route = initialRoute;
    renderAll();
  }

  init().catch((error) => {
    state.console = `Startup failed: ${error.message}`;
    renderAll();
  });
})();
