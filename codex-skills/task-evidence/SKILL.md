---
name: task-evidence
description: Capture sanitized performance-review evidence for a Personal Task Board task. Use when Desmond says task evidence, add evidence, impact, review proof, or manager evidence.
---

# Task Evidence

Use this plugin command to update task evidence after useful work, risk reduction, learning, or impact.

Use remaining user prompt text as the command input. In Codex, that is the text around the skill mention.

Operate from the real Personal Task Board repo root, normally `/Users/desmond/Desktop/projects/personal-task-board`. Before reading or writing, verify the root contains `package.json`, `.codex-plugin/plugin.json`, `.claude-plugin/plugin.json`, and `data/tasks.json`. Reject paths under `.claude`, `.codex`, or any plugin cache; if uncertain, ask Desmond for the repo path.

From the repo root, follow `docs/agent-workflows.md` section `task evidence <id or title>: <what happened / impact>`.

Required workflow:

1. From the repo root, read `AGENTS.md`, `docs/agent-workflows.md`, `data/config.json`, and `data/tasks.json`.
2. Locate the task by ID or title.
3. Keep evidence sanitized and impact-focused.
4. Update `evidence.summary`, `evidence.impact`, `evidence.reviewCategory`, and `evidence.links` when provided.
5. Set `evidence.state` to `later` if incomplete or `captured` when useful evidence is complete.
6. Add an `activity[]` entry.
7. Run `npm run validate`.

Final response must include changed task IDs and validation result.
