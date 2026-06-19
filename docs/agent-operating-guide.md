# Agent Operating Guide

This guide is for Codex, Claude, and future local agents using the task board.

## Before Work

1. Read `AGENTS.md`.
2. Read `data/config.json`.
3. Read `data/tasks.json`.
4. Identify the task ID or title Desmond assigned.
5. Do not self-assign unless Desmond explicitly asked you to work on that task.

## Task Intake

When Desmond gives a messy task in chat, normalize it into `data/tasks.json` instead of asking him to fill the HTML form.

- choose conservative defaults for type, status, priority, energy, dates, refs, and evidence state
- keep `nextAction` empty when the next step is unknown
- use `questions` or `notes` for uncertainty
- set `agentHelp.wanted` only when Desmond is asking an agent to help normalize or work on the task
- ask at most one clarifying question when the task cannot be represented safely
- run `npm run validate`

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

## Browser Update Files

The browser app exports only changed tasks in `taskUpdates[]`.

Import is conflict-checked against each task's base `updatedAt`. If a conflict appears, do not force it unless Desmond explicitly accepts the overwrite. The safer path is to re-open the latest `data/tasks.json`, reapply the browser edits, export again, and import the fresh update.

## External Systems

Do not sync external ticket systems by default.

Even if `data/config.json` enables future sync, agents still need an explicit current-session instruction from Desmond before touching external systems.
