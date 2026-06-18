# Integration Roadmap

The v1 app intentionally does not integrate with company tools.

## V1

- static HTML/CSS/JS
- local JSON source of truth
- file picker open/save
- timestamped changed-task update export
- Node validation with config/schema drift checks
- Node update import with stale overwrite detection
- no external ticket sync
- no MCP
- no browser automation

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

## Later: Agent Workflow

Possible additions after v1 is stable:

- task organizer agent
- evidence capture agent
- review preparation agent
- ticket context summarizer
- safe codebase understanding workflow
- import/export assistant

Do not add these until the basic JSON workflow is useful.
