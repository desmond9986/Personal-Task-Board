# Agent Operating Guide

This guide is for Codex, Claude, and future local agents using the task board.

## Before Work

1. Read `AGENTS.md`.
2. Read `data/config.json`.
3. Read `data/tasks.json`.
4. Identify the task ID or title Desmond assigned.
5. Do not self-assign unless Desmond explicitly asked you to work on that task.

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

## External Systems

Do not sync external ticket systems by default.

Even if `data/config.json` enables future sync, agents still need an explicit current-session instruction from Desmond before touching external systems.
