---
name: task-evidence
description: Capture sanitized performance-review evidence for a Personal Task Board task. Use when Desmond says task evidence, add evidence, impact, review proof, or manager evidence.
---

# Task Evidence

Use this plugin command to update task evidence after useful work, risk reduction, learning, or impact.

Follow `docs/agent-workflows.md` section `task evidence <id or title>: <what happened / impact>`.

Required workflow:

1. Read `AGENTS.md`, `docs/agent-workflows.md`, `data/config.json`, and `data/tasks.json`.
2. Locate the task by ID or title.
3. Keep evidence sanitized and impact-focused.
4. Update `evidence.summary`, `evidence.impact`, `evidence.reviewCategory`, and `evidence.links` when provided.
5. Set `evidence.state` to `later` if incomplete or `captured` when useful evidence is complete.
6. Add an `activity[]` entry.
7. Run `npm run validate`.

Final response must include changed task IDs and validation result.
