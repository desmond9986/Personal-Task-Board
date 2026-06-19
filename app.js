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

  const priorityRank = { low: 1, medium: 2, high: 3, urgent: 4 };
  const energyRank = { low: 1, medium: 2, high: 3 };
  const statusRank = { dropped: 0, done: 1, review: 2, waiting: 3, todo: 4, in_progress: 5, need_discussion: 6, blocked: 7, backlog: 8 };

  let board = structuredClone(emptyBoard);
  let config = embeddedConfig;
  let fileLabel = "not opened";

  const state = {
    route: "board",
    selectedId: "",
    quick: "all",
    query: "",
    filters: { status: "all", type: "all", priority: "all", evidence: "all" },
    sortBy: "priority",
    sortDirection: "desc",
    sourceMode: "loading",
    console: "ready"
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

  function todayDate() {
    return new Date().toISOString().slice(0, 10);
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
      state.console = "Loaded read-only data/tasks.json. Agents should update the JSON; refresh or open the file again to view changes.";
    } catch {
      board = structuredClone(emptyBoard);
      state.sourceMode = "empty until tasks.json is opened";
      state.console = "Could not auto-load data/tasks.json. Click Open tasks.json.";
    }

    ensureBoardShape();
    state.selectedId = selectedTask()?.id || "";
  }

  function ensureBoardShape() {
    if (!board || typeof board !== "object") board = structuredClone(emptyBoard);
    if (!board.meta) board.meta = structuredClone(emptyBoard.meta);
    if (!board.meta.syncState) board.meta.syncState = structuredClone(emptyBoard.meta.syncState);
    if (!Array.isArray(board.tasks)) board.tasks = [];
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
    return "Unknown yet";
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
  }

  function renderSourceState() {
    $("#sourceLine").textContent = `view-only · ${state.sourceMode} · ${getTasks().length} task(s)`;
    $("#fileStatus").textContent = `${fileLabel}; view-only; ${getTasks().length} task(s).`;
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

  function displayText(value, fallback = "none") {
    const text = String(value ?? "").trim();
    return text || fallback;
  }

  function emptyListHtml(label = "none") {
    return `<li>${escapeHtml(label)}</li>`;
  }

  function refLabel(ref) {
    return ref.id || ref.label || ref.url || "reference";
  }

  function refsListHtml(refs = [], emptyLabel = "none") {
    const visibleRefs = refs.filter((ref) => ref && (ref.id || ref.label || ref.url));
    if (!visibleRefs.length) return emptyListHtml(emptyLabel);
    return visibleRefs
      .map((ref) => {
        const label = refLabel(ref);
        const meta = [ref.system, ref.type].filter(Boolean).join(" · ");
        const content = ref.url
          ? `<a href="${escapeHtml(ref.url)}" target="_blank" rel="noreferrer">${escapeHtml(label)}</a>`
          : escapeHtml(label);
        return `<li>${content}${meta ? `<br /><span class="mono">${escapeHtml(meta)}</span>` : ""}</li>`;
      })
      .join("");
  }

  function keyValueListHtml(entries) {
    return entries
      .map(([label, value]) => `<li><strong>${escapeHtml(label)}</strong>${escapeHtml(displayText(value))}</li>`)
      .join("");
  }

  function renderEmptyDetail() {
    $("#detailTaskId").textContent = "No task";
    $("#detailTitleView").textContent = "No task selected.";
    $("#detailDescriptionView").textContent = "none";
    $("#detailNextActionView").textContent = "none";
    $("#detailQuestionsView").innerHTML = emptyListHtml();
    $("#detailRefsView").innerHTML = emptyListHtml();
    $("#detailEvidenceSummaryView").textContent = "none";
    $("#detailEvidenceImpactView").textContent = "none";
    $("#detailEvidenceCategoriesView").textContent = "none";
    $("#detailEvidenceLinksView").innerHTML = emptyListHtml();
    $("#detailStatusBand").innerHTML = '<span class="chip">Open tasks.json to view task detail</span>';
    $("#detailStateSummary").innerHTML = "";
    $("#detailMetaSummary").innerHTML = "";
    $("#detailActivity").innerHTML = emptyListHtml();
  }

  function renderDetail() {
    const task = selectedTask();

    if (!task) {
      renderEmptyDetail();
      return;
    }

    state.selectedId = task.id;
    $("#detailTaskId").textContent = task.id;
    $("#detailTitleView").textContent = displayText(task.title, "Untitled task");
    $("#detailDescriptionView").textContent = displayText(task.description);
    $("#detailNextActionView").textContent = displayText(task.nextAction, "unknown yet");

    const questions = (task.questions || []).filter((question) => question?.text || question?.answer);
    $("#detailQuestionsView").innerHTML = questions.length
      ? questions
          .map((question) => {
            const meta = [question.status || "open", question.askedTo ? `ask: ${question.askedTo}` : ""].filter(Boolean).join(" · ");
            return `<li>${escapeHtml(displayText(question.text, "Question"))}${meta ? `<br /><span class="mono">${escapeHtml(meta)}</span>` : ""}${question.answer ? `<br />${escapeHtml(question.answer)}` : ""}</li>`;
          })
          .join("")
      : emptyListHtml();

    $("#detailRefsView").innerHTML = refsListHtml(task.externalRefs || []);
    $("#detailEvidenceSummaryView").textContent = displayText(task.evidence?.summary);
    $("#detailEvidenceImpactView").textContent = displayText(task.evidence?.impact);
    $("#detailEvidenceCategoriesView").textContent = displayText((task.evidence?.reviewCategory || []).join(", "));
    $("#detailEvidenceLinksView").innerHTML = refsListHtml(task.evidence?.links || []);

    $("#detailStatusBand").innerHTML = [
      `<span class="status"><span class="dot ${escapeHtml(task.status)}"></span>${escapeHtml(statusLabel(task.status || "backlog"))}</span>`,
      `<span class="chip ${chipClass(task.priority)}">${escapeHtml(displayText(task.priority, "no priority"))}</span>`,
      `<span class="chip">${escapeHtml(displayText(task.energy, "unknown"))} energy</span>`,
      `<span class="chip ${chipClass(task.evidence?.state)}">evidence: ${escapeHtml(displayText(task.evidence?.state, "missing"))}</span>`,
      `<span class="chip">target: ${escapeHtml(displayText(task.targetDate))}</span>`,
      `<span class="chip">due: ${escapeHtml(displayText(task.dueDate))}</span>`
    ].join("");

    $("#detailStateSummary").innerHTML = keyValueListHtml([
      ["Status", statusLabel(task.status || "backlog")],
      ["Priority", task.priority],
      ["Energy", task.energy],
      ["Evidence", task.evidence?.state || "missing"],
      ["Agent help", task.agentHelp?.wanted ? task.agentHelp.reason || "wanted" : "not requested"]
    ]);

    $("#detailMetaSummary").innerHTML = keyValueListHtml([
      ["Type", task.type],
      ["Current agents", taskAgentsText(task) || "none"],
      ["Questions", task.questions?.length ? `${task.questions.length} open/known` : "none"],
      ["References", taskRefsText(task) || "none"],
      ["Target date", task.targetDate || "none"],
      ["Due date", task.dueDate || "none"],
      ["Updated", task.updatedAt || "unknown"]
    ]);

    const activity = (task.activity || []).slice(0, 8);
    $("#detailActivity").innerHTML = activity.length
      ? activity.map((item) => `<li>${escapeHtml(item.text)}<br /><span class="mono">${escapeHtml(item.at)}</span></li>`).join("")
      : emptyListHtml();
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

  async function loadBoardFromText(text, sourceLabel) {
    const parsed = JSON.parse(text);
    if (!parsed || !Array.isArray(parsed.tasks)) throw new Error("Selected file does not look like a task board JSON file.");
    board = parsed;
    ensureBoardShape();
    fileLabel = sourceLabel;
    state.sourceMode = `loaded: ${sourceLabel}`;
    state.selectedId = selectedTask()?.id || "";
    state.console = `Loaded ${sourceLabel} for viewing. Agents should edit the JSON source.`;
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
        await loadBoardFromText(await file.text(), file.name);
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
    if (action === "open-tasks-file") await openTasksFile();
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

    window.addEventListener("hashchange", () => {
      const nextRoute = window.location.hash.replace("#", "");
      if (["board", "detail", "sync"].includes(nextRoute)) {
        state.route = nextRoute;
        renderAll();
      }
    });
  }

  async function init() {
    await loadInitialData();
    renderSelectOptions();
    bindEvents();
    const initialRoute = window.location.hash.replace("#", "");
    if (["board", "detail", "sync"].includes(initialRoute)) state.route = initialRoute;
    renderAll();
  }

  init().catch((error) => {
    state.console = `Startup failed: ${error.message}`;
    renderAll();
  });
})();
