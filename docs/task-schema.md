# Task Schema Notes

The canonical schema is `schemas/task-board.schema.json`. This note explains the intended meaning of the main fields.

## Board Shape

```json
{
  "meta": {
    "version": 1,
    "updatedAt": "2026-06-18T12:30:00+08:00",
    "syncState": {
      "lastSyncAt": "",
      "lastSyncSource": "manual",
      "lastSyncStatus": "never",
      "lastSyncSummary": ""
    }
  },
  "tasks": []
}
```

## Required Task Fields

Every task has:

- `id`: stable task id such as `PTB-001`
- `title`: short task title
- `type`: one of `personal`, `work_ticket`, `learning`, `agent_workflow`, `career_review`, `admin`
- `status`: one of the locked statuses in config
- `priority`: `low`, `medium`, `high`, or `urgent`
- `energy`: `low`, `medium`, or `high`
- `targetDate`: optional preferred work date
- `dueDate`: optional real deadline
- `nextAction`: optional next step when known
- `externalRefs`: ticket, PR, document, design, branch, or other references
- `questions`: discussion items separate from messy notes
- `agentHelp`: whether Desmond wants possible agent help
- `agents`: agents explicitly assigned by Desmond
- `evidence`: performance review evidence state and notes
- `activity`: local audit trail

## Next Action Rule

`nextAction` is useful but optional. Some tasks start as unknown, blocked, or discussion-first. Leave it empty when the next step is unclear, then use `questions`, `status`, and `notes` to capture what is missing.

## External References

Use structured `externalRefs`:

```json
{
  "type": "ticket",
  "system": "unknown",
  "id": "RYT-123",
  "url": "",
  "label": "Payment timeout ticket"
}
```

Keep real company links sanitized until the allowed tooling and data policy are known.

## Evidence

Evidence supports December review and manager updates.

`evidence.state` values:

- `missing`
- `later`
- `not_due`
- `captured`

Use `summary`, `impact`, `links`, and `reviewCategory` when a completed task has useful performance evidence.

Allowed review categories:

- `shipped_work`
- `quality_improvement`
- `risk_reduction`
- `cross_team_impact`
- `documentation`
- `mentoring_helping`
- `bug_handling`
- `ai_workflow`
- `learning`

## Update Files

The HTML viewer no longer exports update files. `scripts/import-update.mjs` remains available as an optional utility if an agent or external process creates a changed-task-only update file:

```json
{
  "meta": {
    "updateFormatVersion": 1,
    "exportedAt": "2026-06-18T12:30:00.000Z",
    "sourceFile": "data/tasks.json",
    "sourceBoardUpdatedAt": "2026-06-18T12:30:00+08:00",
    "baseTaskUpdatedAt": {
      "PTB-001": "2026-06-18T12:30:00+08:00"
    }
  },
  "taskUpdates": []
}
```

`scripts/import-update.mjs` uses `baseTaskUpdatedAt` to prevent stale updates from overwriting newer task edits. Existing-task updates and deletes must include a matching `meta.baseTaskUpdatedAt[id]`; this applies to both `taskUpdates[]` and full `tasks[]` imports unless `--force` is explicitly used.

The import script also rejects duplicate incoming task IDs and obvious sensitive data before it writes a backup or changes `data/tasks.json`.
