# Personal Task Board

Local-first JSON task board for personal tasks, future work tickets, learning tasks, agent workflows, and review evidence.

This repo intentionally starts simple:

- plain `index.html`, `style.css`, and `app.js`
- JSON source of truth in `data/tasks.json`
- config in `data/config.json`
- schema validation with `npm run validate`
- update-file merge with `npm run import-update`
- no React, Next.js, Vite, MCP, ticket-system sync, or background automation in v1

## Use The App

Open the local HTML file directly:

```text
/Users/desmond/Desktop/projects/personal-task-board/index.html
```

Then click `Open tasks.json` and select:

```text
/Users/desmond/Desktop/projects/personal-task-board/data/tasks.json
```

The HTML app is view-only. Use it to load the JSON file, filter/sort tasks, and inspect task details. Do not add, edit, save, or export tasks from the browser.

Task changes should happen through an agent or a direct JSON edit:

```text
Please update /Users/desmond/Desktop/projects/personal-task-board/data/tasks.json for this task.
Read AGENTS.md and docs/agent-operating-guide.md first.
Run npm run validate before finishing.
```

After an agent changes JSON, refresh the page or click `Open tasks.json` again to view the latest file.

Localhost is optional. Use it only if you want browser auto-load of `data/tasks.json`:

```bash
npm install
npm run serve
```

Then open:

```text
http://localhost:4173
```

## Validate

```bash
npm run validate
```

Validation checks:

- schema shape for `data/tasks.json`
- schema shape for `data/config.json`
- duplicate task IDs
- duplicate question/activity IDs within a task
- required config options and view IDs
- config options drifting away from schema enums

## Important Files

- `index.html`: app shell
- `style.css`: locked Design 1 visual system
- `app.js`: view-only board UI, filtering, sorting, detail rendering, and JSON file loading
- `data/tasks.json`: task source of truth
- `data/config.json`: statuses, views, sync guardrails, sensitive-data policy
- `schemas/`: JSON Schema contracts
- `scripts/validate.mjs`: validation entry point
- `scripts/import-update.mjs`: timestamped update merge
- `docs/agent-operating-guide.md`: agent workflow rules
- `docs/agent-workflows.md`: command menu for asking agents to add, update, review, and summarize tasks
- `docs/task-schema.md`: task data notes
- `docs/integration-roadmap.md`: future sync/plugin plan

## Safety Boundary

Keep the default mode sanitized. Do not store customer data, secrets, logs, screenshots, proprietary code, or confidential roadmap details unless this repo is confirmed private and excluded from accidental deploy/git sharing.
