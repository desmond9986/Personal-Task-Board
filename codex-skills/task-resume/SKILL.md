---
name: task-resume
description: Build a context-switch resume pack for one Personal Task Board task. Use when Desmond says resume task, continue task, remind me where I left off, or pick this back up.
---

# Task Resume

Use this plugin command when Desmond is returning to a task after context switching.

Use remaining user prompt text as the command input. In Codex, that is the text around the skill mention.

Operate from the real Personal Task Board repo root, normally `/Users/desmond/Desktop/projects/personal-task-board`. Before reading or writing, verify the root contains `package.json`, `.codex-plugin/plugin.json`, `.claude-plugin/plugin.json`, and `data/tasks.json`. Reject paths under `.claude`, `.codex`, or any plugin cache; if uncertain, ask Desmond for the repo path.

From the repo root, follow `docs/agent-workflows.md` section `task resume <id or title>`.

Required workflow:

1. From the repo root, read `AGENTS.md`, `docs/agent-workflows.md`, `data/config.json`, and `data/tasks.json`.
2. Locate the task by ID or title.
3. Summarize state, known context, externalRefs, questions, notes, evidence, latest activity, and current agents.
4. Highlight constraints or what not to touch.
5. Suggest one next useful action only if known.

Do not edit JSON unless Desmond explicitly asks.
