---
name: task-handoff
description: Explicitly hand a Personal Task Board task to the current agent. Use only when Desmond asks an agent to pick up, hand off, or work on a specific task.
---

# Task Handoff

Use this plugin command only when Desmond explicitly asks an agent to work on a task.

Use remaining user prompt text as the command input. In Codex, that is the text around the skill mention.

Operate from the real Personal Task Board repo root, normally `/Users/desmond/Desktop/projects/personal-task-board`. Before reading or writing, verify the root contains `package.json`, `.codex-plugin/plugin.json`, `.claude-plugin/plugin.json`, and `data/tasks.json`. Reject paths under `.claude`, `.codex`, or any plugin cache; if uncertain, ask Desmond for the repo path.

From the repo root, follow `docs/agent-workflows.md` section `task handoff <id or title> to agent`.

Required workflow:

1. From the repo root, read `AGENTS.md`, `docs/agent-workflows.md`, `data/config.json`, and `data/tasks.json`.
2. Locate the task by ID or title.
3. Add or update the current agent in `agents[]`.
4. Use a sensible role such as `worker`, `reviewer`, `researcher`, or `tester`.
5. Add `pickedUpAt`, `status: active`, and an `activity[]` entry.
6. Keep scope to the assigned task.
7. Run `npm run validate`.

Do not self-assign just because `agentHelp.wanted` is true.

Final response must include task ID, agent role, scope, and validation result.
