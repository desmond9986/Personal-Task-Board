---
name: task-next
description: Recommend what Desmond should do next from the Personal Task Board. Use when Desmond asks what next, what should I do, prioritize, triage, or help me focus.
---

# Task Next

Use this plugin command to recommend the next useful work from `data/tasks.json`.

Follow `docs/agent-workflows.md` section `task next`.

Required workflow:

1. Read `AGENTS.md`, `docs/agent-workflows.md`, `data/config.json`, and `data/tasks.json`.
2. Consider priority, energy, target date, due date, status, open questions, blockers, and evidence gaps.
3. Return exactly 3 options by default:
   - highest-impact task
   - low-energy quick win
   - unblock/discussion task
4. Recommend one option for now with a short reason.

Do not edit JSON unless Desmond explicitly asks.
