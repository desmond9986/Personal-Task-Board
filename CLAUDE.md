@AGENTS.md

## Claude Code Notes

- This repo is also a Claude Code plugin. When loaded as a plugin, invoke workflows with slash skills such as `/personal-task-board:task-add`, `/personal-task-board:task-next`, and `/personal-task-board:task-weekly`.
- Use the same task-board protocol from `AGENTS.md` and `docs/agent-workflows.md`.
- Treat `index.html` as view-only. Edit `data/tasks.json` directly when Desmond asks to add or update tasks.
- Before ending a session, summarize task IDs changed and whether `npm run validate` passed.
- Suggest improvements to `AGENTS.md` only if workflow rules were unclear during the work.
