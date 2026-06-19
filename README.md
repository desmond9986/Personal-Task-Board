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

Install dependencies once:

```bash
npm install
```

Run a local static server:

```bash
npm run serve
```

Open:

```text
http://localhost:4173
```

The app tries to auto-load `data/tasks.json` when served locally. Auto-loaded data is a read-only snapshot. For direct file editing, click `Open tasks.json`, select `data/tasks.json`, then use `Save`.

If the browser cannot save back to the opened file, click `Export update`. Export creates a changed-task-only `taskUpdates[]` file with base timestamps for conflict detection. Move the exported file into `updates/`, then run:

```bash
npm run import-update -- updates/tasks-update-YYYYMMDD-HHmmss.json
```

If import reports a conflict, re-open the latest `data/tasks.json` in the app and export again. Use `--force` only when you intentionally want to overwrite the current task:

```bash
npm run import-update -- updates/tasks-update-YYYYMMDD-HHmmss.json --force
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
- `app.js`: board UI, filtering, create/detail edit, open/save/changed-task export flow
- `data/tasks.json`: task source of truth
- `data/config.json`: statuses, views, sync guardrails, sensitive-data policy
- `schemas/`: JSON Schema contracts
- `scripts/validate.mjs`: validation entry point
- `scripts/import-update.mjs`: timestamped update merge
- `docs/agent-operating-guide.md`: agent workflow rules
- `docs/task-schema.md`: task data notes
- `docs/integration-roadmap.md`: future sync/plugin plan

## Safety Boundary

Keep the default mode sanitized. Do not store customer data, secrets, logs, screenshots, proprietary code, or confidential roadmap details unless this repo is confirmed private and excluded from accidental deploy/git sharing.
