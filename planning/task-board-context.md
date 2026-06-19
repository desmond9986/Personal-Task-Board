# Personal Task Board · Planning Context

> Created: 2026-06-17  
> Owner: Desmond / Yi How  
> Current phase: v1 implementation  
> Implementation status: started from locked Design 1  
> Hard gate: opened on 2026-06-18 after Desmond locked the design and asked to start working on the repo.

## 1. Why This Exists

Desmond is preparing to join Ryt Bank as a mainly React Native frontend engineer, likely around payments or adjacent mobile banking flows.

The existing `ryt-performance-strategy` Vercel site is a strategy guideline for pre-joining, first 90 days, year-end review preparation, safe AI usage, payments readiness, visibility, and agent workflow planning.

This new project is a separate local-first task board tool.

The task board is part of the work mentioned in the strategy site, but it must not be mixed with the public strategy site.

The task board should help Desmond and agents see task status clearly.

The task board should track not only work tickets, but also personal tasks, learning tasks, career review tasks, and agent workflow tasks.

The task board should be generic enough to reuse beyond Ryt.

The task board may later be uploaded to Desmond's GitHub and installed on a company laptop.

The tool should start simple and local.

The tool should avoid premature plugin/MCP complexity.

## 2. Product Boundary

There are two related products.

### 2.1 Vercel Strategy Site

The strategy site is for high-level clarity.

It can show:

- task board concept
- plugin build status
- plugin repo link later
- high-level workflow explanation
- safety notes
- roadmap status

It must not store:

- actual work tickets
- private task data
- internal Ryt details
- customer data
- secrets
- internal logs
- proprietary code

### 2.2 Local Task Board

The local task board is the actual working tool.

It should live in:

```text
/Users/desmond/Desktop/projects/personal-task-board
```

It should be a separate repo/folder from the Vercel strategy site.

It should be local-first.

It should use JSON as the source of truth.

It should be readable and editable by both humans and agents.

It should support future Codex, Claude, MCP, browser automation, and ticket-system integration without requiring those in v1.

## 3. Research Notes

The agent instruction approach was checked against official/current documentation.

References:

- OpenAI Codex `AGENTS.md` guide: https://developers.openai.com/codex/guides/agents-md
- OpenAI Codex best practices and MCP guidance: https://developers.openai.com/codex/learn/best-practices
- OpenAI Codex subagents guidance: https://developers.openai.com/codex/subagents
- Claude Code memory and `CLAUDE.md` guidance: https://code.claude.com/docs/en/memory
- Anthropic Claude Code use cases PDF: https://www-cdn.anthropic.com/58284b19e702b49db9302d5b6f135ad8871e7658.pdf

Important research conclusions:

- Codex reads `AGENTS.md` files before work and layers global/project/nested guidance.
- `AGENTS.md` should be the canonical shared instruction file for Codex and agent workflows.
- Claude Code uses `CLAUDE.md` and can import shared instructions.
- `CLAUDE.md` should import `@AGENTS.md` and add only Claude-specific notes.
- Long workflow details should live in `docs/`, not be duplicated across agent instruction files.
- MCP is appropriate later when context lives outside the repo and changes frequently.
- Do not wire external tools early. Add integrations only when they remove a real manual loop.

## 4. Locked Architecture

The v1 tool should be plain static HTML, CSS, and JavaScript.

The v1 tool should not use React.

The v1 tool should not use Next.js.

The v1 tool should not use Vite.

The v1 tool should not have a build step.

The v1 tool may include Node scripts for validation and import.

The v1 tool should use `ajv` for JSON Schema validation.

The v1 tool should include `package.json` only for scripts such as:

```bash
npm run validate
npm run import-update
```

The future implementation structure should be:

```text
personal-task-board/
  AGENTS.md
  CLAUDE.md
  README.md
  index.html
  style.css
  app.js
  package.json
  data/
    config.json
    tasks.json
  schemas/
    task-board.schema.json
    config.schema.json
  updates/
    .gitkeep
  backups/
    .gitkeep
  scripts/
    validate.mjs
    import-update.mjs
  docs/
    task-schema.md
    agent-operating-guide.md
    integration-roadmap.md
```

This structure is not implemented yet.

This structure should only be implemented after prototype selection.

## 5. Source Of Truth

The source of truth is `data/tasks.json`.

The config source is `data/config.json`.

Agents should read config before editing tasks.

Agents should validate after editing tasks.

HTML should be able to load task data.

HTML should be able to edit common fields.

HTML should not expose every advanced metadata field.

## 6. HTML Save Model

Preferred save path:

1. User opens `index.html` in Chrome or Edge.
2. User clicks `Open tasks.json`.
3. Browser asks permission through the File System Access API.
4. User selects `data/tasks.json`.
5. User edits tasks.
6. User clicks `Save`.
7. Browser writes directly back to the same local JSON file.

Fallback save path:

1. If direct file save is unavailable, user clicks `Export update`.
2. HTML creates a timestamped update JSON.
3. Preferred update location is `updates/`.
4. File name should be timestamped to avoid clashes.
5. Example:

```text
updates/tasks-update-2026-06-17-142530.json
```

Browser limitation:

- Plain HTML cannot silently save to a specific local folder without permission.
- Chrome/Edge can use File System Access API.
- Safari/Firefox may require download/export fallback.
- If the export lands in Downloads, user or agent can move it into `updates/`.

Import path:

```bash
npm run import-update updates/tasks-update-2026-06-17-142530.json
```

Import script behavior:

1. Validate the update file.
2. Validate existing `data/tasks.json`.
3. Backup current `data/tasks.json` to `backups/`.
4. Merge update into real tasks by task `id`.
5. Validate merged result.
6. Write merged result to `data/tasks.json`.
7. Print summary.

## 7. Merge Rules

Updates merge by task `id`.

Same `id` means update existing task.

New `id` means add new task.

Missing task in update file does not delete an existing task.

Deletion is only allowed when a task explicitly has:

```json
{
  "deleted": true
}
```

This protects against accidental overwrite when Desmond edits in HTML while an agent adds tasks separately.

## 8. Task Statuses

Locked statuses:

```text
backlog
todo
in_progress
need_discussion
blocked
waiting
review
done
dropped
```

Status meanings:

- `backlog`: captured but not ready or scheduled.
- `todo`: ready to work.
- `in_progress`: actively being worked on.
- `need_discussion`: requires conversation, clarification, or decision.
- `blocked`: cannot proceed due to missing dependency or unresolved blocker.
- `waiting`: waiting on someone or something, but not necessarily blocked.
- `review`: ready for review, QA, PR review, or final check.
- `done`: completed.
- `dropped`: intentionally abandoned.

No archive system in v1.

Done and dropped tasks can be hidden by filters later.

## 9. Task Types

Locked task types:

```text
personal
work_ticket
learning
agent_workflow
career_review
admin
```

Type meanings:

- `personal`: personal preparation, habits, private planning.
- `work_ticket`: future Ryt or work ticket reference.
- `learning`: codebase, domain, React Native, payments, onboarding learning.
- `agent_workflow`: building or refining personal agent systems.
- `career_review`: evidence, manager 1:1, review prep, increment/promotion prep.
- `admin`: setup, deploy, config, housekeeping.

## 10. Priority And Energy

Locked priority levels:

```text
low
medium
high
urgent
```

Locked energy levels:

```text
low
medium
high
```

Reason:

- Priority answers importance.
- Energy answers how much focus the task needs.
- This supports ADHD-friendly planning.

## 11. Dates

Tasks may include optional:

```json
{
  "targetDate": "2026-06-24",
  "dueDate": "2026-06-28"
}
```

`targetDate` means when Desmond wants to work on it.

`dueDate` means actual deadline.

Both are optional.

The UI should not force dates.

## 12. Next Action

`nextAction` is useful when known, but optional for every status.

The UI should make it easy to add a clear `nextAction`, but it must not block tasks where the next step is genuinely unknown.

Reason:

- some onboarding, discussion, and blocked tasks start with uncertainty
- `questions`, `notes`, and status can hold uncertainty until the next step becomes clear
- forcing a fake `nextAction` makes the board less honest

## 13. Checklist

Tasks may include a lightweight checklist.

Example:

```json
{
  "checklist": [
    {
      "id": "check-001",
      "title": "Draft 5 manager questions",
      "done": false
    }
  ]
}
```

No nested subtasks in v1.

No dependency graph in v1.

No estimates in v1.

## 14. External References

Tasks should support multiple external references.

Example:

```json
{
  "externalRefs": [
    {
      "type": "ticket",
      "system": "unknown",
      "id": "RYT-123",
      "url": "https://ticket-system.example/RYT-123",
      "label": "Main ticket"
    }
  ]
}
```

Reference types may include:

- ticket
- pull_request
- design
- slack_thread
- document
- branch
- other

Reason:

- One work item may connect to ticket, PR, Figma, Slack thread, docs, and branch.
- Personal tasks can have an empty array.

## 15. Owner And Agents

Tasks should distinguish human owner from assisting agents.

Recommended shape:

```json
{
  "owner": {
    "type": "human",
    "name": "Desmond"
  },
  "agents": [
    {
      "role": "worker",
      "name": "Codex",
      "threadId": "optional-thread-id",
      "agentId": "optional-agent-id",
      "status": "active",
      "pickedUpAt": "2026-06-17T14:30:00+08:00"
    }
  ]
}
```

Multiple agents are allowed.

Normal rule:

- one active worker agent is usually enough
- optional reviewer/researcher/architect/tester/sync agents may exist

Allowed agent roles:

```text
worker
reviewer
architect
researcher
tester
sync
```

Allowed agent statuses:

```text
active
paused
done
blocked
cancelled
```

## 16. Agent Help

Tasks may include:

```json
{
  "agentHelp": {
    "wanted": true,
    "reason": "Need help turning rough notes into manager questions"
  }
}
```

No `preferredRole` in v1.

Agent can infer role or ask if unclear.

Hard rule:

```text
Agents must not pick up or assign themselves to a task unless Desmond explicitly asks them to work on that task.
```

Agents may:

- list tasks needing help
- recommend next tasks
- ask clarification
- update tasks they were explicitly assigned

Agents may not:

- silently mark themselves active
- silently claim ownership
- silently sync external ticket systems

## 17. Evidence Fields

Tasks should support performance review evidence.

Example:

```json
{
  "evidence": {
    "summary": "Clarified timeout behavior before implementing payment status UI.",
    "impact": "Reduced risk of showing customers the wrong transfer status after a network timeout.",
    "links": [
      {
        "type": "ticket",
        "url": "https://ticket-system/RYT-123",
        "label": "Payment timeout ticket"
      }
    ],
    "reviewCategory": ["risk_reduction", "quality_improvement", "cross_team_impact"]
  }
}
```

Evidence is optional while a task is active.

When status is `done`, the dashboard should remind Desmond if evidence is empty.

Evidence supports December review and brag doc generation.

Allowed review categories:

```text
shipped_work
quality_improvement
risk_reduction
cross_team_impact
documentation
mentoring_helping
bug_handling
ai_workflow
learning
```

## 18. Notes And Questions

Tasks should support freeform notes.

Tasks should also support structured questions separately.

`notes` means messy thinking.

`questions[]` means things to ask PM, BE, QA, manager, or self.

Example question:

```json
{
  "id": "q-001",
  "text": "What should UI show when payment submit times out?",
  "status": "open",
  "answer": "",
  "askedTo": "Backend",
  "createdAt": "2026-06-17T14:30:00+08:00"
}
```

Question statuses:

```text
open
asked
answered
cancelled
```

Reason:

- This supports communication.
- This helps meeting prep.
- This keeps decisions visible.

## 19. Repeat Hint

Tasks may include:

```json
{
  "repeatHint": "weekly"
}
```

Allowed values:

```text
none
daily
weekly
monthly
custom
```

No automatic recurrence in v1.

Agents may suggest creating next recurrence task, but must ask before adding it.

## 20. Sync Config And Sync State

Config controls sync settings.

Tasks metadata records actual last sync state.

Config example:

```json
{
  "sync": {
    "externalTicketSyncEnabled": false,
    "ticketSystemProvider": "unknown",
    "mcpPreferred": true,
    "browserFallback": true,
    "frequency": "manual"
  }
}
```

Supported sync frequency values:

```text
manual
startup_check
daily
weekly
disabled
```

Default:

```json
{
  "frequency": "manual"
}
```

Tasks metadata example:

```json
{
  "meta": {
    "version": 1,
    "updatedAt": "2026-06-17T15:00:00+08:00",
    "syncState": {
      "lastSyncAt": "",
      "lastSyncSource": "manual",
      "lastSyncStatus": "never",
      "lastSyncSummary": ""
    }
  },
  "tasks": []
}
```

HTML should display sync state.

HTML should not run external sync in v1.

External ticket sync is config-gated and explicit-session-gated.

Hard rule:

```text
Even if externalTicketSyncEnabled is true, agents must not sync unless Desmond explicitly asks in the current session.
```

Future sync strategy:

1. First check whether an MCP exists for the ticket system Ryt uses.
2. If MCP exists and is approved, prefer MCP.
3. If no MCP exists, consider browser fallback.
4. If neither is safe/allowed, keep manual references only.
5. Sync rules and provider details must live in config, not be hardcoded.

## 21. Views

The dashboard should support config-defined saved views.

A view is a saved filter.

Example:

```json
{
  "views": [
    {
      "id": "need-discussion",
      "label": "Need discussion",
      "filter": {
        "status": ["need_discussion"]
      }
    }
  ]
}
```

Default views should include:

- All
- Target soon
- Need discussion
- Blocked / waiting
- Agent help wanted
- Review / QA
- Evidence missing
- Work tickets
- Personal prep

Views should stay simple.

No advanced query language in v1.

## 22. Search

The dashboard should include a simple search box.

Search should cover:

- title
- description
- nextAction
- notes
- external ref id
- external ref label
- external ref url
- questions text
- questions answer

No advanced query syntax in v1.

## 23. Task Creation

Tasks can be created with structured form.

Tasks can also be created with quick-add.

Quick-add supports rough capture.

Example quick-add text:

```text
ask manager about above expectation first 90 days
```

Quick-add should create a rough task with:

- type: personal
- status: backlog
- priority: medium
- energy: medium

Agents can later normalize rough tasks if asked.

## 24. Sensitive Data Policy

Desmond said the task board will run locally.

Even local-only tools should be sanitized-by-default.

Reason:

- local files can accidentally be committed
- local files can be uploaded
- local files can be backed up
- local files can be screenshotted
- local files can be shared with agents
- the strategy site is deployed publicly

Recommended default:

```json
{
  "sensitiveDataPolicy": {
    "defaultMode": "sanitized_by_default",
    "localPrivateDetailsAllowed": false,
    "warning": "Do not add customer data, secrets, tokens, logs, screenshots, proprietary code, or confidential roadmap unless this repo is confirmed private and excluded from deploy/git."
  }
}
```

Later, if needed:

```json
{
  "localPrivateDetailsAllowed": true
}
```

This should be a deliberate config change, not v1 default.

## 25. AGENTS.md And CLAUDE.md Design

`AGENTS.md` is canonical.

`CLAUDE.md` should import `@AGENTS.md`.

`CLAUDE.md` should add only Claude-specific notes.

Do not duplicate all rules in both files.

Reason:

- duplicated rules drift
- one canonical protocol is easier to maintain
- Codex reads `AGENTS.md`
- Claude Code reads `CLAUDE.md`

Recommended `CLAUDE.md` concept:

```md
@AGENTS.md

## Claude Code Notes

- Use the same task-board protocol as AGENTS.md.
- Prefer editing data/tasks.json through scripts when possible.
- Before ending a session, summarize task updates.
- Suggest AGENTS.md improvements if workflow rules were unclear.
```

Detailed operating rules should live in:

```text
docs/agent-operating-guide.md
docs/task-schema.md
docs/integration-roadmap.md
```

## 26. Agent Pickup Protocol

Agents should follow this protocol when explicitly assigned:

1. Read `data/config.json`.
2. Read `data/tasks.json`.
3. Confirm the task ID or task title assigned by Desmond.
4. Add or update self in `agents[]`.
5. Add `activity[]` entry with type `picked_up`.
6. Do the requested work.
7. Update task status, nextAction, notes, blockers, questions, externalRefs, or evidence as relevant.
8. Add `activity[]` entry with type `progress`, `blocked`, `review_ready`, or `done`.
9. Run validation.
10. Summarize changes.

Agents must not pick up tasks just because `agentHelp.wanted` is true.

## 27. Validation

Include JSON Schema.

Use `ajv`.

Schema files:

```text
schemas/task-board.schema.json
schemas/config.schema.json
```

Validation command:

```bash
npm run validate
```

Validation should check:

- `tasks.json` shape
- `config.json` shape
- unique task IDs
- allowed statuses
- allowed task types
- allowed priorities
- allowed energy values
- `nextAction` is a valid optional field
- externalRefs shape
- agents shape
- activity shape
- questions shape
- evidence shape
- config views shape
- sync settings shape

## 28. Not In V1

Do not include reminders in v1.

Do not include browser notifications in v1.

Do not include calendar automation in v1.

Do not include cron/background sync in v1.

Do not include daily focus panel in v1.

Do not include board-level activity log in v1.

Do not include archive system in v1.

Do not include real external ticket-system sync in v1.

Do not include MCP implementation in v1.

Do not include Codex plugin implementation in v1.

Do not include Claude plugin implementation in v1.

Do not include React, Next.js, or Vite in v1.

Do not include a full project management system.

## 29. UI Product Brief

Product definition:

Personal Task Board helps Desmond and agents coordinate personal tasks, future work tickets, learning, agent workflows, and review evidence through a local JSON source of truth.

Primary user:

Desmond.

Secondary users:

Codex, Claude, and future agents.

Primary task:

Open the board and immediately understand what needs action, what needs discussion, what is blocked/waiting, and what agents can help with.

Secondary task:

Edit tasks locally and keep task data valid for agent use.

Success metric:

Desmond can understand task status in under 2 minutes and update a task in under 30 seconds.

Design constraints:

- simple local HTML
- dense but readable
- no build step
- keyboard-friendly
- no AI slop
- no purple AI gradients
- no fake metrics
- no decorative icon spam
- no giant rounded cards everywhere
- must feel like a practical local tool
- must be clear on mobile and desktop

## 30. Prototype Requirements

The next deliverable is only five visual prototypes.

Prototype files are not the working product.

Prototype files may use hardcoded sample data.

Prototype files should help Desmond choose visual and interaction direction.

Prototype files should not create final schemas/scripts/app logic.

Prototype directions should explore different information architectures.

Each direction should show:

- status grouping
- quick add concept
- search
- saved views
- task cards
- agent help visibility
- external reference visibility
- evidence missing signal
- sync state display

## 31. Five Prototype Directions

The five proposed directions are:

### Direction 1: Operator Console

High-density command center.

Best for seeing many statuses at once.

Strong for agent coordination.

Risk: may feel too intense for daily personal use.

### Direction 2: Quiet Workbench

Calm personal productivity surface.

Best for ADHD-friendly daily use.

Strong for low-stress planning.

Risk: may hide too much if there are many work tickets.

### Direction 3: Ticket Ledger

Table-first operational board.

Best for auditability, references, and sync clarity.

Strong for work-ticket discipline.

Risk: can feel less friendly and more admin-heavy.

### Direction 4: Agent Dispatch

Agent-help queue and task status together.

Best if agent collaboration becomes the core workflow.

Strong for "what can an agent pick up after I ask?".

Risk: may overemphasize agents before the basic personal board habit is proven.

### Direction 5: Paper Board

Minimal document-like board.

Best for clarity, print, and low visual noise.

Strong for simple local HTML and future company laptop use.

Risk: less "app-like" and less visually exciting.

## 32. Implementation Gate

Do not implement the actual repo yet.

Do not create schemas yet.

Do not create scripts yet.

Do not create real data files yet.

Do not create AGENTS.md or CLAUDE.md yet.

Do create:

- this planning context file
- a prototype gallery HTML
- any prototype-only assets needed

After Desmond chooses a prototype and says to start, then implement the repo according to this planning file.

## 33. Latest Design Direction Feedback

Date: 2026-06-17.

Desmond prefers the earlier **03 Ticket Ledger** direction.

The visual style is less important than meaningful information.

The board must prioritize clarity, filtering, and operational usefulness.

The next prototype pass should not only show one board screen.

Each design direction should show multiple screens or states, including:

- main board / task list
- filters and saved views
- task detail page or detail panel
- create task screen or form
- sync/import/config state

The dashboard should make it easy to understand:

- task status
- type
- priority
- energy
- next action
- external references
- agent help wanted
- agent assignment
- questions needing discussion
- evidence missing
- last sync state
- JSON validity/import status

New prototypes should be closer to table/ledger/productivity-tool layouts than decorative dashboards.

Design should be simple and practical.

Do not overfocus on visual polish.

Do not implement actual repo logic yet.

## 34. Design 1 Refinement Feedback

Date: 2026-06-18.

Desmond said **Design 1 is good**.

Design 1 should be treated as the current base direction unless Desmond changes his mind.

The board must include:

- sorting
- filters
- visible number counts for different task states

The first board surface should make status counts obvious before the user scans rows.

Filtering should support quick saved views and more precise controls.

Sorting should be available directly on the task list, not hidden in configuration.

The design should stay simple and practical; do not overdo visual polish.

## 35. Standalone UI Test Page

Date: 2026-06-18.

Desmond asked to remove all design directions except Design 1.

The prototype file should now behave like a 1:1 UI test page, not a design gallery.

Current standalone prototype path:

- `prototypes/ledger-flow-options.html`

The page should include these main views:

- board
- task detail
- create task
- sync/config

The board should keep the Design 1 Review Ledger direction.

Important board information:

- status counts
- saved views
- search
- filters
- sorting
- visible task count
- task type
- priority
- energy
- target date
- next action
- external reference
- agent help
- assigned agents
- evidence state

The UI should stay useful and simple. Do not add decorative dashboard content that does not help Desmond manage tasks.

The prototype can use localStorage/in-memory behavior for UI testing, but this is not the final JSON filesystem implementation.

Desmond requested two subagent reviews:

- feature/product workflow review
- UI/UX/design review

## 36. Review Feedback Applied To Standalone Prototype

Date: 2026-06-18.

Two subagent reviews were completed:

- product/features review
- UI/UX/design review

Applied changes:

- mobile now shows the active workspace before the sidebar
- mobile board uses task cards instead of a clipped desktop table
- desktop summary cards reduced to the most important metrics
- board search added inside the main board, not only the sidebar
- search now covers questions, evidence, agents, activity, refs, and task text
- task detail page now has quick edits for next action, evidence, refs, questions, and agent help
- marking a task done no longer hides missing evidence
- focus-visible styling added for keyboard testing
- status counts include all locked statuses, including backlog and dropped

Deferred for later implementation:

- real JSON filesystem writes
- real import/export merge
- real external ticket sync
- structured external ref objects in the underlying data model
- structured multi-agent role/status model

## 37. Create Validation And Detail Redesign

Date: 2026-06-18.

Desmond requested:

- create task page should validate required fields
- task detail page should be redesigned

Applied to the standalone prototype:

- create task now treats `title` and `nextAction` as required
- create task shows a form-level validation banner
- create task shows inline field errors beside required fields
- invalid fields receive `aria-invalid`
- task detail now prioritizes status, priority, energy, evidence, and target date in a top status band
- task detail now makes next action the main focus
- task detail context is grouped into questions/blockers, references, agent help, review evidence, and metadata
- quick edit remains available for next action, evidence, references, questions, and agent help

Validation is prototype-only for now; final implementation should mirror the same rules in schema/custom validation.

## 38. Detail Page Editability Refinement

Date: 2026-06-18.

Desmond said the task detail page was still a bit hard to understand and asked whether the detail page should allow changing title and description.

Decision:

- yes, task detail should be the main place to edit an existing task
- title and description should be editable from the detail page
- next action, questions/blockers, and references should be grouped as task content/context
- status, evidence, and agent-help state should be grouped separately as review/state controls
- the page heading should stay predictable as `Task detail`; the task title should live inside the editable content form

Applied to the standalone prototype:

- task detail now has an obvious `Task content` section with editable title, description, and next action
- title and next action are required on detail save
- discussion questions and reference ids/links are editable in a separate context section
- status, evidence, and agent help save from the right-side `State and review` panel
- task snapshot now summarizes type, current agents, question count, refs, and last update
- activity remains visible but is secondary to the edit workflow

Future implementation note:

- the real JSON-backed app should preserve the same split: content/context save vs state/review save
- detail validation should be enforced in both UI and schema/custom validation, not only in the HTML prototype

## 39. Implementation Gate Opened

Date: 2026-06-18.

Desmond said the design is not perfect but should be locked first, then asked to start working on the repo.

This opens the implementation gate from section 32.

Initial v1 implementation should now create the real repo structure:

- `index.html`
- `style.css`
- `app.js`
- `package.json`
- `data/config.json`
- `data/tasks.json`
- `schemas/task-board.schema.json`
- `schemas/config.schema.json`
- `scripts/validate.mjs`
- `scripts/import-update.mjs`
- `AGENTS.md`
- `CLAUDE.md`
- `README.md`
- `docs/`
- `updates/`
- `backups/`

The locked implementation direction remains:

- plain HTML/CSS/JS
- no React
- no Next.js
- no Vite
- no MCP in v1
- no real external ticket sync in v1
- JSON source of truth
- local-first save/export/import flow
- table-first Design 1 UI

Historical note:

- sections before this implementation gate are retained for context and decision history
- when those older sections say implementation has not started, treat that as historical, not current state

## 40. First Review Fixes

Date: 2026-06-18.

After the initial GitHub push, Desmond asked to fix the review findings.

Applied direction:

- export changed tasks only, not the full board
- include base task `updatedAt` timestamps in exported update files
- make import block stale updates unless `--force` is intentionally used
- preserve existing structured refs/questions where possible when editing text fields
- add evidence summary, impact, links, and review categories to the detail page
- make read-only auto-load vs writable file-open state explicit
- prevent active statuses from being saved without a next action
- validate config options against schema enums to catch drift
- show due date beside target date
- include overdue target dates in `Target soon`
- add mobile empty state
- add an agent pickup prompt template without letting agents self-assign

## 41. Board UX Simplification

Date: 2026-06-18.

Desmond said the dashboard became too fancy, too dense, and hard to use. The board should feel like a simple local work surface, not a reporting dashboard.

Locked adjustment:

- remove the left sidebar from the board
- remove summary metric cards from the first screen
- keep one search field and one quick-add field at the top of the board
- keep saved-view counts, but present them as compact view buttons
- keep status counts as one plain text line, not a card grid
- collapse detailed status/type/priority/evidence/sort controls under `Filters and sort`
- reduce the table to task, status, next action, target/due, flags, and action
- show the primary real ticket/reference id in the task subtitle when present
- use flags only for attention signals such as urgent/high priority, missing/later evidence, agent help, assigned agent, and questions

Future agent guardrail:

- do not re-add dashboard cards, a sidebar, or repeated filter controls unless Desmond explicitly asks for a reporting dashboard view
- prefer fewer always-visible elements and move secondary metadata into task detail

## 42. Optional Next Action

Date: 2026-06-19.

Desmond said `nextAction` should not be necessary because some tasks begin with uncertainty and he may not know the next step yet.

Supersedes the earlier active-task next-action rule from section 40.

Locked adjustment:

- `nextAction` remains in the schema as a useful field, but it is optional
- create task can save with an empty next action
- detail edit can save with an empty next action
- status changes do not require next action
- quick add should not invent a fake next action
- validation and import validation must allow empty next action
- agents should capture uncertainty in `questions` or `notes` instead of forcing `nextAction`
