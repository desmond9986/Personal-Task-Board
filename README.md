# Personal Task Board

Local-first JSON task board for personal tasks, future work tickets, learning tasks, agent workflows, and review evidence.

This repo intentionally starts simple:

- plain `index.html`, `style.css`, and `app.js`
- JSON source of truth in `data/tasks.json`
- config in `data/config.json`
- schema validation with `npm run validate`
- update-file merge with `npm run import-update`
- no React, Next.js, Vite, MCP, ticket-system sync, or background automation in v1

## First Setup

Run this once after cloning or copying the repo to a new machine:

```bash
cd /Users/desmond/Desktop/projects/personal-task-board
npm install
npm run validate
```

`npm install` is needed for validation dependencies. Agents should not write task changes until `npm run validate` works.

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

## Agent Plugin Commands

This repo is both a Codex plugin and a Claude Code plugin. The workflow behavior is shared, but each platform has its own skill entrypoint folder:

- Codex plugin skills: `codex-skills/`
- Claude Code plugin skills: `skills/`

Daily command set:

- Primary: add/update a task, choose next focus, write weekly summary.
- Advanced: blocked-task review, resume pack, evidence polishing, board hygiene, and explicit agent handoff.

Claude Code daily use:

```bash
cd /Users/desmond/Desktop/projects/personal-task-board
claude --plugin-dir .
```

This keeps Claude working against the real task-board repo. If Claude is launched from another repo, explicitly give it `/Users/desmond/Desktop/projects/personal-task-board` before asking it to read or change tasks. Do not use Claude's plugin cache as task storage.

If Claude is launched from another repo, slash commands require the plugin to be loaded or installed. For a temporary session, start Claude with:

```bash
claude --plugin-dir /Users/desmond/Desktop/projects/personal-task-board --add-dir /Users/desmond/Desktop/projects/personal-task-board
```

Passing only the task-board path gives the agent file access, but it does not create slash commands.

Primary Claude commands:

```text
/personal-task-board:task-add ask manager what good ramp-up looks like in first 30 days
/personal-task-board:task-update PTB-001 manager said focus on payment edge cases first
/personal-task-board:task-next
/personal-task-board:task-weekly
```

Advanced Claude commands:

```text
/personal-task-board:task-blocked
/personal-task-board:task-resume PTB-001
/personal-task-board:task-evidence PTB-001 reduced timeout uncertainty by confirming source of truth
/personal-task-board:task-review-board
/personal-task-board:task-handoff PTB-001 to agent
```

After changing plugin files during a Claude Code session, run:

```text
/reload-plugins
```

Codex prompt syntax uses the skill names in normal text:

```text
personal-task-board:task-add
personal-task-board:task-update
personal-task-board:task-next
personal-task-board:task-weekly
```

Advanced Codex skills:

```text
personal-task-board:task-blocked
personal-task-board:task-resume
personal-task-board:task-evidence
personal-task-board:task-review-board
personal-task-board:task-handoff
```

Example:

```text
Use personal-task-board:task-add to capture this: ask manager what good ramp-up looks like in first 30 days
```

Codex plugin commands work only after the local plugin is installed or otherwise available in your Codex environment. If the plugin is not available yet, use the direct-agent prompt from the section above with the absolute repo path, then ask Codex to read `AGENTS.md` and `docs/agent-workflows.md`.

These skills operate on `data/tasks.json`; they are not buttons in the HTML viewer.
Run agents from the task-board repo, or explicitly tell the agent the task-board repo path. Do not read or write task data from a plugin cache.

Localhost is optional. Use it only if you want browser auto-load of `data/tasks.json`:

```bash
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
- `.codex-plugin/plugin.json`: Codex plugin manifest
- `.claude-plugin/plugin.json`: Claude Code plugin manifest
- `codex-skills/`: Codex plugin skills for task add/update/triage/summary/evidence workflows
- `skills/`: Claude Code plugin skills for task add/update/triage/summary/evidence workflows
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
