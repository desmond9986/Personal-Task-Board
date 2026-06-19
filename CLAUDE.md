@AGENTS.md

## Claude Code Notes

- These notes apply when this repository is opened as a Claude project. Plugin runtime behavior lives in `skills/*/SKILL.md`.
- When loaded as a Claude Code plugin, invoke workflows with slash skills such as `/personal-task-board:task-add`, `/personal-task-board:task-next`, and `/personal-task-board:task-weekly`.
- Use the same task-board protocol from `AGENTS.md` and `docs/agent-workflows.md`.
- Treat `index.html` as view-only. Edit `data/tasks.json` directly when Desmond asks to add or update tasks.
- Before ending a session, summarize task IDs changed and whether `npm run validate` passed.
- Suggest improvements to `AGENTS.md` only if workflow rules were unclear during the work.
