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
- `nextAction`: required while active
- `externalRefs`: ticket, PR, document, design, branch, or other references
- `questions`: discussion items separate from messy notes
- `agentHelp`: whether Desmond wants possible agent help
- `agents`: agents explicitly assigned by Desmond
- `evidence`: performance review evidence state and notes
- `activity`: local audit trail

## Active Next Action Rule

Active tasks must have `nextAction`.

Active statuses:

- `backlog`
- `todo`
- `in_progress`
- `need_discussion`
- `blocked`
- `waiting`
- `review`

`done` and `dropped` tasks may leave `nextAction` empty.

## External References

Use structured refs:

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
