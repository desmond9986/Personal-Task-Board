---
name: task-weekly
description: Generate a weekly Personal Task Board review or manager update. Use when Desmond asks for weekly summary, manager update, review evidence, or this week's progress.
disable-model-invocation: true
---

# Task Weekly

Use this plugin command for weekly review, manager update preparation, and review-evidence hygiene.

If the user provides arguments, treat `$ARGUMENTS` as focus constraints.

Operate on the project/worktree that contains `data/tasks.json`. If it is missing, ask Desmond for the task-board repo path before writing; do not use Claude's plugin cache as task storage.

Follow `docs/agent-workflows.md` section `task weekly`.

Required workflow:

1. Read `AGENTS.md`, `docs/agent-workflows.md`, `data/config.json`, and `data/tasks.json`.
2. Summarize done/review tasks, blocked/waiting tasks, evidence missing, and next-week focus.
3. Keep the summary manager-readable and sanitized.
4. Group evidence by review category when useful.
5. Recommend at most 3 priorities for next week.

Do not edit JSON unless Desmond explicitly asks.
