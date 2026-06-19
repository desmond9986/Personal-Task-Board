---
name: task-resume
description: Build a context-switch resume pack for one Personal Task Board task. Use when Desmond says resume task, continue task, remind me where I left off, or pick this back up.
---

# Task Resume

Use this plugin command when Desmond is returning to a task after context switching.

Follow `docs/agent-workflows.md` section `task resume <id or title>`.

Required workflow:

1. Read `AGENTS.md`, `docs/agent-workflows.md`, `data/config.json`, and `data/tasks.json`.
2. Locate the task by ID or title.
3. Summarize state, known context, refs, questions, notes, evidence, latest activity, and current agents.
4. Highlight constraints or what not to touch.
5. Suggest one next useful action only if known.

Do not edit JSON unless Desmond explicitly asks.
