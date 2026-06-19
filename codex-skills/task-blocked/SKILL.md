---
name: task-blocked
description: Review blocked, waiting, and need-discussion tasks. Use when Desmond asks what is blocked, what to ask, what is waiting, or how to unblock tasks.
---

# Task Blocked

Use this plugin command to find and explain blocked or unclear work.

Use remaining user prompt text as optional focus constraints. In Codex, that is the text around the skill mention.

Operate from the real Personal Task Board repo root, normally `/Users/desmond/Desktop/projects/personal-task-board`. Before reading or writing, verify the root contains `package.json`, `.codex-plugin/plugin.json`, `.claude-plugin/plugin.json`, and `data/tasks.json`. Reject paths under `.claude`, `.codex`, or any plugin cache; if uncertain, ask Desmond for the repo path.

From the repo root, follow `docs/agent-workflows.md` section `task blocked`.

Required workflow:

1. From the repo root, read `AGENTS.md`, `docs/agent-workflows.md`, `data/config.json`, and `data/tasks.json`.
2. List tasks with status `blocked`, `waiting`, or `need_discussion`.
3. Group by what is needed: manager, BE, QA, policy, self, or unknown.
4. Surface open questions, latest activity, and useful externalRefs or references.
5. Draft short message snippets when useful.

Do not edit JSON unless Desmond explicitly asks.
