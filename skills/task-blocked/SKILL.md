---
name: task-blocked
description: Review blocked, waiting, and need-discussion tasks. Use when Desmond asks what is blocked, what to ask, what is waiting, or how to unblock tasks.
---

# Task Blocked

Use this plugin command to find and explain blocked or unclear work.

Follow `docs/agent-workflows.md` section `task blocked`.

Required workflow:

1. Read `AGENTS.md`, `docs/agent-workflows.md`, `data/config.json`, and `data/tasks.json`.
2. List tasks with status `blocked`, `waiting`, or `need_discussion`.
3. Group by what is needed: manager, BE, QA, policy, self, or unknown.
4. Surface open questions, latest activity, and useful refs.
5. Draft short message snippets when useful.

Do not edit JSON unless Desmond explicitly asks.
