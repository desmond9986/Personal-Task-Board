---
name: task-add
description: Add or normalize a messy Personal Task Board task into data/tasks.json. Use when Desmond says task add, add task, capture this, remember this, or gives a rough Ryt/onboarding/workflow task.
---

# Task Add

Use this plugin command to convert a messy request into a valid task in `data/tasks.json`.

Follow `docs/agent-workflows.md` section `task add: <rough task>`.

Required workflow:

1. Read `AGENTS.md`, `docs/agent-workflows.md`, `data/config.json`, and `data/tasks.json`.
2. Check for duplicate or similar existing tasks before adding.
3. Update an existing task if the request clearly matches it; otherwise create the next `PTB-###`.
4. Choose conservative `type`, `status`, `priority`, and `energy`.
5. Keep `nextAction` empty if the next step is unknown; put uncertainty in `questions` or `notes`.
6. Add a concise `activity[]` entry.
7. Run `npm run validate`.

Do not add sensitive company/customer data. Do not ask Desmond to use the HTML UI to create the task.

Final response must include changed task IDs and validation result.
