---
name: task-review-board
description: Review Personal Task Board hygiene without editing by default. Use when Desmond asks to review board, find duplicates, stale tasks, unclear blockers, evidence gaps, or drop candidates.
disable-model-invocation: true
---

# Task Review Board

Use this plugin command for a non-mutating board hygiene review.

If the user provides arguments, treat `$ARGUMENTS` as focus constraints.

Operate on the project/worktree that contains `data/tasks.json`. If it is missing, ask Desmond for the task-board repo path before writing; do not use Claude's plugin cache as task storage.

Follow `docs/agent-workflows.md` section `task review-board`.

Required workflow:

1. Read `AGENTS.md`, `docs/agent-workflows.md`, `data/config.json`, and `data/tasks.json`.
2. Find duplicate-looking tasks.
3. Find stale `in_progress` tasks.
4. Find tasks with unclear blockers.
5. Find tasks with missing evidence after completion/review.
6. Find tasks that should probably be dropped.

Do not edit JSON unless Desmond explicitly asks.

Prefer short, ranked findings over a long report.
