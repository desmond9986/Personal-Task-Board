# Agent Instructions

This repo is Desmond's local-first Personal Task Board. It coordinates personal tasks, future work-ticket references, learning, agent workflows, and review evidence through JSON.

## Source Of Truth

- Read `data/config.json` before changing task behavior.
- Read `data/tasks.json` before changing tasks.
- `data/tasks.json` is the source of truth.
- `data/config.json` controls views, allowed states, sync settings, and safety policy.
- Run `npm run validate` after editing data, schemas, scripts, or app behavior that affects data shape.

## Hard Rules

- Do not self-assign to a task unless Desmond explicitly asks you to work on that task.
- `agentHelp.wanted: true` means help is welcome, not that an agent may claim the task.
- Do not sync an external ticket system unless Desmond explicitly asks in the current session.
- Do not add customer data, secrets, internal logs, proprietary code, confidential roadmap details, or sensitive screenshots.
- Keep v1 plain HTML/CSS/JS. Do not add React, Next.js, Vite, MCP, background sync, reminders, or calendar automation without a new explicit request.

## Task Updates

When Desmond assigns a task:

1. Confirm the task ID or title.
2. Add or update yourself in `agents[]` only if the assignment is explicit.
3. Add an `activity[]` entry.
4. Do the requested work.
5. Update `status`, `nextAction`, `questions`, `externalRefs`, `evidence`, or `notes` as relevant.
6. Run `npm run validate`.
7. Summarize changed task IDs and validation result.

For active tasks, keep `nextAction` non-empty. Active statuses are:

```text
backlog
todo
in_progress
need_discussion
blocked
waiting
review
```

`done` and `dropped` may have empty `nextAction`.

## JSON Merge Workflow

Preferred manual edit:

```bash
npm run validate
```

Fallback update import:

```bash
npm run import-update -- updates/tasks-update-YYYYMMDD-HHmmss.json
```

Merge behavior:

- same `id` updates an existing task
- new `id` adds a task
- missing tasks are not deleted
- deletion requires an update item with `deleted: true`
- import creates a backup in `backups/`
- app exports should use `taskUpdates[]`, not a full board snapshot
- import checks exported base timestamps and blocks stale overwrites
- use `--force` only when Desmond explicitly accepts overwriting conflicts

## UI Constraints

- Keep the locked Design 1 direction: table-first, dense, practical, filterable.
- Prioritize useful information over decorative polish.
- Preserve mobile usability.
- Keep the detail page as the main edit surface for title, description, next action, questions, refs, status, evidence summary/impact/links/categories, and agent-help state.
