# Agent Workflows

This file is the command menu for agents working with Desmond's Personal Task Board.

The repo exposes these workflows as plugin skills for both Codex and Claude Code.

Primary commands:

- Add a task: `task-add`
- Update a task: `task-update`
- Choose next focus: `task-next`
- Write weekly summary: `task-weekly`

Advanced commands exist for blocked-task review, task resume, evidence polishing, board hygiene, and explicit agent handoff, but Desmond should not need to remember them for normal daily use.

Codex primary style:

```text
Use personal-task-board:task-add to capture this: ask manager how to ramp up fast
Use personal-task-board:task-update PTB-001 manager clarified the first-week expectation
Use personal-task-board:task-next
Use personal-task-board:task-weekly
```

Claude Code primary style:

```text
/personal-task-board:task-add ask manager how to ramp up fast
/personal-task-board:task-update PTB-001 manager clarified the first-week expectation
/personal-task-board:task-next
/personal-task-board:task-weekly
```

Plain phrases such as `task add: ...` are fallback language when the repo docs are already in context. For Claude plugin use, prefer the slash command.

These are not browser UI commands and not an MCP tool contract yet. They are low-friction plugin skills Desmond can send to Codex, Claude Code, or a future local orchestrator. The agent should operate on `data/tasks.json`, keep the HTML viewer read-only, and run validation after any write.

## Operating Rules

Before any command:

1. Read `AGENTS.md`.
2. Read `data/config.json`.
3. Read `data/tasks.json`.
4. Confirm the current project/worktree is the real Personal Task Board repo, normally `/Users/desmond/Desktop/projects/personal-task-board`.
5. Before reading or writing, verify the root contains `package.json`, `.codex-plugin/plugin.json`, `.claude-plugin/plugin.json`, and `data/tasks.json`.
6. Do not read or write task data from Claude's plugin cache, Codex's plugin cache, or another repo that merely has a `data/tasks.json` file.
7. Keep the change scoped to the requested task or workflow.
8. Do not self-assign unless Desmond explicitly asks you to work on the task.
9. Do not invent `nextAction`; leave it empty when the next step is unknown.
10. Do not add sensitive company/customer data.
11. Run `npm run validate` after editing JSON.

Default response style:

- Return the smallest useful answer.
- Prefer 3 recommendations over exhaustive lists.
- Ask at most one clarifying question when safe representation is impossible.
- Mention changed task IDs and validation result after writes.

## Command Menu

Actual plugin skills:

Primary:

- Codex: `personal-task-board:task-add`; Claude Code: `/personal-task-board:task-add`
- Codex: `personal-task-board:task-update`; Claude Code: `/personal-task-board:task-update`
- Codex: `personal-task-board:task-next`; Claude Code: `/personal-task-board:task-next`
- Codex: `personal-task-board:task-weekly`; Claude Code: `/personal-task-board:task-weekly`

Advanced:

- Codex: `personal-task-board:task-blocked`; Claude Code: `/personal-task-board:task-blocked`
- Codex: `personal-task-board:task-resume`; Claude Code: `/personal-task-board:task-resume`
- Codex: `personal-task-board:task-evidence`; Claude Code: `/personal-task-board:task-evidence`
- Codex: `personal-task-board:task-review-board`; Claude Code: `/personal-task-board:task-review-board`
- Codex: `personal-task-board:task-handoff`; Claude Code: `/personal-task-board:task-handoff`

### `task-add` / `task add: <rough task>`

Use when Desmond gives a messy task, idea, worry, or reminder.

Example:

```text
task add: ask manager how to ramp up fast and what above expectation means
```

Agent behavior:

- Check existing tasks for similar title, externalRefs, or intent.
- Update an existing task if it is clearly the same task.
- Otherwise create the next `PTB-###` task.
- Choose conservative `type`, `status`, `priority`, and `energy`.
- Put uncertainty in `questions` or `notes`.
- Leave `nextAction` empty if unclear.
- Set `evidence.state` to `later`, `not_due`, or `missing` depending on the task.
- Add an `activity[]` entry.
- Run `npm run validate`.

Output:

```text
Added PTB-###: <title>
Status: <status>, priority: <priority>, energy: <energy>
Why: <one sentence>
Validation: passed
```

### `task-update` / `task update <id or title>: <new info>`

Use after a conversation, progress update, decision, or new blocker.

Example:

```text
task update PTB-004: manager said focus on payments checkout edge cases first
```

Agent behavior:

- Locate the task by ID first, then title if no ID is provided.
- Preserve unrelated fields.
- Update only the fields implied by the new information.
- Add questions, externalRefs, notes, activity, or evidence as needed.
- Change status only when the update clearly implies it.
- Run `npm run validate`.

Output:

```text
Updated PTB-###.
Changed: <fields>
Validation: passed
```

### `task-next` / `task next`

Use when Desmond asks what to do next.

Agent behavior:

- Read current tasks.
- Consider `priority`, `energy`, `targetDate`, `dueDate`, `status`, open questions, and blocked/waiting items.
- Return up to 3 options by default:
  1. Highest-impact task.
  2. Low-energy quick win.
  3. Unblock/discussion task.
- Include a compact resume pack for the recommended task: state, key context, open questions, and one known next action if available.
- Do not edit JSON unless Desmond asks.

Output:

```text
1. Highest impact: PTB-### ...
2. Low energy: PTB-### ...
3. Unblock: PTB-### ...

Recommended now: PTB-### because ...

Resume pack:
- State: ...
- Key context: ...
- Open questions: ...
- Known next action: ...
```

### `task-blocked` / `task blocked`

Use for urgent unblock messages. For normal reporting, prefer `task weekly`.

Agent behavior:

- List tasks with `status` of `blocked`, `waiting`, or `need_discussion`.
- Group by what is needed: manager, BE, QA, policy, self, unknown.
- Surface open questions and latest activity.
- Draft short message snippets when useful.
- Do not edit JSON unless Desmond asks.

Output:

```text
Blocked / waiting:
- PTB-### needs <person/source>: <question>

Suggested message:
"..."
```

### `task-resume` / `task resume <id or title>`

Use when Desmond is context-switching back into a task.

Agent behavior:

- Summarize task state, externalRefs, questions, notes, evidence, latest activity, and current agents.
- Highlight what not to touch if the task has constraints.
- Suggest one next useful action only if it is known.
- Do not edit JSON unless Desmond asks.

Output:

```text
Resume PTB-###:
- State: ...
- Known context: ...
- Open questions: ...
- Suggested next action: ...
- Do not touch: ...
```

### `task-weekly` / `task weekly`

Use as the default report for weekly summary, manager update prep, or review evidence hygiene.

Agent behavior:

- Summarize done/review tasks, blocked/waiting tasks, evidence missing, and next-week focus.
- Keep it manager-readable and sanitized.
- Group evidence by review category when available.
- Recommend at most 3 priorities for next week.
- If the board has no useful activity yet, say that briefly and recommend what to capture next instead of fabricating progress.
- Do not edit JSON unless Desmond asks.

Output:

```text
Weekly summary:
- Completed / moved forward:
- Blocked / waiting:
- Evidence to capture:
- Suggested next week focus:
```

### `task-evidence` / `task evidence <id or title>: <what happened / impact>`

Use when a task has performance-review value and `task update` did not already capture the evidence.

Agent behavior:

- Update `evidence.summary`, `evidence.impact`, `evidence.reviewCategory`, and `evidence.links` when provided.
- Keep evidence sanitized and impact-focused.
- If evidence is incomplete, set `evidence.state` to `later`.
- If useful evidence is complete, set `evidence.state` to `captured`.
- Add an activity entry.
- Run `npm run validate`.

Output:

```text
Updated evidence for PTB-###.
Category: <category>
Validation: passed
```

### `task-review-board` / `task review-board`

Use occasionally for a board hygiene pass. Do not run this as a daily report.

Agent behavior:

- Find duplicate-looking tasks.
- Find stale `in_progress` tasks.
- Find tasks with unclear blockers.
- Find tasks with missing evidence after completion/review.
- Find tasks that should probably be dropped.
- Do not edit JSON unless Desmond asks.

Output:

```text
Board review:
1. Duplicates / merge candidates:
2. Stale active tasks:
3. Blockers needing clarification:
4. Evidence gaps:
5. Drop candidates:
```

### `task-handoff` / `task handoff <id or title> to agent`

Advanced/internal command. Use when Desmond explicitly wants an agent to work on a task. In normal conversation, Desmond can just say "work on PTB-###."

Agent behavior:

- Only then add/update the current agent in `agents[]`.
- Use a sensible role such as `worker`, `reviewer`, `researcher`, or `tester`.
- Add `pickedUpAt`, `status: active`, and an activity entry.
- Keep scope to the assigned task.
- Run `npm run validate`.

Output:

```text
Picked up PTB-### as <role>.
Scope: <what I will do>
Validation: passed
```

## Ryt Performance Workflows

Use these command combinations during onboarding.

Keep onboarding on the four primary commands by default. Advanced commands are optional only when a specific need appears.

### First-week manager clarity

```text
task add: prepare first-week manager questions about expectations, ramp-up, payments focus, and what good performance looks like
task update <id>: after the conversation, capture manager expectations and open questions
task weekly: use near the end of the week, not on an empty board
```

Goal: reduce ambiguity and improve visibility early.

### Work ticket loop

```text
task add: work ticket <sanitized title/ref>
task update <id>: capture context, decision, blocker, or progress
task update <id>: capture impact once useful
task weekly
```

Goal: turn every ticket into delivery progress, learning, and review evidence.

### Payments / React Native learning loop

```text
task add: learn <payment/RN concept> because it affects <ticket/context>
task next
task weekly
```

Goal: keep learning attached to real work instead of creating a separate endless study backlog.

### Visibility and communication loop

```text
task add: draft update for manager about <topic>
task update <id>: capture what is blocked, waiting, or needs discussion
task weekly
```

Goal: make blockers, questions, and progress visible before they become performance problems.

## What Not To Turn Into Commands Yet

Do not add command support for:

- calendar reminders
- background sync
- external ticket sync
- browser automation
- task dependency graphs
- estimates or sprint planning
- automatic agent scheduling
- browser-side create/edit/save/export

If the same manual request happens more than twice, consider a small script or prompt snippet before considering MCP/plugin work.
