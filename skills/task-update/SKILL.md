---
name: task-update
description: Update an existing Personal Task Board task after new information, progress, decisions, or blockers. Use when Desmond says task update, update task, mark progress, or gives new info for a task.
---

# Task Update

Use this plugin command to make a scoped update to an existing task in `data/tasks.json`.

Follow `docs/agent-workflows.md` section `task update <id or title>: <new info>`.

Required workflow:

1. Read `AGENTS.md`, `docs/agent-workflows.md`, `data/config.json`, and `data/tasks.json`.
2. Locate the task by ID first; if no ID is provided, match by title and ask at most one clarifying question if ambiguous.
3. Preserve unrelated fields.
4. Update only fields implied by the new information.
5. Add `questions`, `refs`, `notes`, `activity`, or `evidence` when useful.
6. Change status only when the update clearly implies it.
7. Run `npm run validate`.

Do not invent `nextAction`; leave it empty when unknown.

Final response must include changed fields, changed task IDs, and validation result.
