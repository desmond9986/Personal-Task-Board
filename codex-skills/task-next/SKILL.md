---
name: task-next
description: Recommend what Desmond should do next from the Personal Task Board. Use when Desmond asks what next, what should I do, prioritize, triage, or help me focus.
---

# Task Next

Use this plugin command to recommend the next useful work from `data/tasks.json`.

Use remaining user prompt text as optional focus constraints. In Codex, that is the text around the skill mention.

Operate from the real Personal Task Board repo root, normally `/Users/desmond/Desktop/projects/personal-task-board`. Before reading or writing, verify the root contains `package.json`, `.codex-plugin/plugin.json`, `.claude-plugin/plugin.json`, and `data/tasks.json`. Reject paths under `.claude`, `.codex`, or any plugin cache; if uncertain, ask Desmond for the repo path.

From the repo root, follow `docs/agent-workflows.md` section `task next`.

Required workflow:

1. From the repo root, read `AGENTS.md`, `docs/agent-workflows.md`, `data/config.json`, and `data/tasks.json`.
2. Consider priority, energy, target date, due date, status, open questions, blockers, and evidence gaps.
3. Return up to 3 options by default:
   - highest-impact task
   - low-energy quick win
   - unblock/discussion task
4. Include a compact resume pack for the recommended task.
5. Recommend one option for now with a short reason.

Do not edit JSON unless Desmond explicitly asks.
