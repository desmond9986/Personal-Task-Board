# Integration Roadmap

The v1 app intentionally does not integrate with company tools.

## V1

- static HTML/CSS/JS
- local JSON source of truth
- direct file-mode viewer: open `index.html`, then load `data/tasks.json`
- read-only board, filters, sort, and task detail
- agents edit `data/tasks.json` directly
- Node validation with config/schema drift checks
- optional Node update import with stale overwrite detection
- no external ticket sync
- no MCP
- no browser automation
- no browser create/edit/save/export

## Current Next Phase: Agent Workflow Layer

Before adding integrations, make the JSON workflow useful with:

- messy task intake playbook
- task update playbook
- blocked/waiting review
- context-switch resume pack
- weekly manager update
- evidence capture

## Later: Ticket System Discovery

After company tooling is known:

1. Identify the ticket system.
2. Check whether an approved MCP exists.
3. If approved MCP exists, prefer MCP.
4. If no MCP exists, evaluate browser fallback.
5. If neither is safe, keep manual reference fields only.

## Later: Sync Rules

Sync must be config-driven:

- provider
- frequency
- source of truth
- field mapping
- allowed directions
- dry-run behavior
- manual confirmation behavior

External sync must still require Desmond's explicit current-session command.

## Later: Runtime Agent Helpers

Possible additions after the manual JSON workflow is useful:

- small local task-list and summary CLI
- warning-only audit script
- duplicate/stale/evidence reports
- evidence capture agent
- review preparation agent
- ticket context summarizer
- safe codebase understanding workflow
- import/update assistant

Do not add MCP, browser automation, background sync, reminders, or ticket-system sync until the basic JSON workflow is useful and the company tooling boundary is known.
