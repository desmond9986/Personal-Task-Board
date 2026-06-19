# Agent Operating Guide

This guide is for Codex, Claude, and future local agents using the task board.

For plugin skills such as `personal-task-board:task-add`, `personal-task-board:task-next`, and `personal-task-board:task-weekly`, read `docs/agent-workflows.md`.

## Before Work

1. Read `AGENTS.md`.
2. Read `data/config.json`.
3. Read `data/tasks.json`.
4. Identify the task ID or title Desmond assigned.
5. Do not self-assign unless Desmond explicitly asked you to work on that task.

## Task Intake

When Desmond gives a messy task in chat, normalize it into `data/tasks.json` instead of asking him to use the HTML viewer.

- choose conservative defaults for type, status, priority, energy, dates, refs, and evidence state
- keep `nextAction` empty when the next step is unknown
- use `questions` or `notes` for uncertainty
- set `agentHelp.wanted` only when Desmond is asking an agent to help normalize or work on the task
- ask at most one clarifying question when the task cannot be represented safely
- run `npm run validate`

The HTML app is view-only. Do not ask Desmond to create or edit tasks through the browser UI.

## During Work

If explicitly assigned, update `agents[]` with:

- role
- name
- threadId or agentId when available
- status
- pickedUpAt

Add an `activity[]` entry when:

- picking up a task
- making meaningful progress
- getting blocked
- making something review-ready
- completing work

Keep updates small and clear. Do not rewrite unrelated tasks.

Do not invent a `nextAction` just to fill the field. Leave it empty when the next step is genuinely unknown, and capture the uncertainty in `questions` or `notes`.

## After Work

Update fields that changed:

- `status`
- `nextAction`
- `notes`
- `questions`
- `externalRefs`
- `evidence`
- `activity`
- `agents`

Run:

```bash
npm run validate
```

Then summarize:

- task IDs changed
- what changed
- validation result
- any next action Desmond needs

## HTML Viewer

The browser app is only for viewing, filtering, sorting, and opening task detail. It does not create, edit, save, export, or merge task data.

The normal user flow is direct file mode: open `index.html`, click `Open tasks.json`, then select `data/tasks.json`. Do not require localhost unless Desmond explicitly wants browser auto-load.

If Desmond asks to add or change a task, edit `data/tasks.json` directly as the agent, keep the change scoped to the requested task, and run `npm run validate`.

## External Systems

Do not sync external ticket systems by default.

Even if `data/config.json` enables future sync, agents still need an explicit current-session instruction from Desmond before touching external systems.
