import Ajv from "ajv";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import {
  assertProjectRoot,
  collectSensitiveDataFindings,
  formatAjvErrors,
  readJson,
  validateBoardIntegrity
} from "./lib/hardening.mjs";

let root;
try {
  root = await assertProjectRoot(process.cwd());
} catch (error) {
  console.error(`Import refused: ${error.message}`);
  process.exit(1);
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function timestampForFile() {
  const date = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    "-",
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds())
  ].join("");
}

function nowIso() {
  return new Date().toISOString();
}

function updateTasksFromFile(updateFile) {
  if (Array.isArray(updateFile.taskUpdates)) {
    return {
      tasks: updateFile.taskUpdates,
      label: "taskUpdates",
      baseTaskUpdatedAt: updateFile.meta?.baseTaskUpdatedAt || {}
    };
  }
  if (Array.isArray(updateFile.tasks)) {
    return {
      tasks: updateFile.tasks,
      label: "tasks",
      baseTaskUpdatedAt: updateFile.meta?.baseTaskUpdatedAt || {}
    };
  }
  throw new Error("Update file must contain a taskUpdates[] array. Full tasks[] imports are accepted only when every existing task includes meta.baseTaskUpdatedAt.");
}

function validateIncomingIds(tasks, label) {
  const errors = [];
  const seen = new Map();
  tasks.forEach((task, index) => {
    const id = typeof task?.id === "string" ? task.id.trim() : "";
    if (!id) return;
    if (seen.has(id)) {
      errors.push(`${label}[${index}] duplicates ${label}[${seen.get(id)}] id "${id}"`);
      return;
    }
    seen.set(id, index);
  });
  return errors;
}

const updatePath = process.argv[2];
const force = process.argv.includes("--force");
if (!updatePath) {
  console.error("Usage: npm run import-update -- updates/tasks-update-YYYYMMDD-HHmmss.json");
  console.error("Use --force only when you intentionally want to overwrite conflict warnings.");
  process.exit(1);
}

const ajv = new Ajv({ allErrors: true });
const boardSchema = await readJson(root, "schemas/task-board.schema.json");
const validateBoard = ajv.compile(boardSchema);
const validateTask = ajv.compile({
  ...boardSchema.$defs.task,
  $defs: boardSchema.$defs
});

const existing = await readJson(root, "data/tasks.json");
if (!validateBoard(existing)) {
  console.error("Existing data/tasks.json is invalid:");
  formatAjvErrors("data/tasks.json", validateBoard.errors).forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

const updateFile = await readJson(root, updatePath);
let update;
try {
  update = updateTasksFromFile(updateFile);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

const incomingTasks = update.tasks;
const updateErrors = [
  ...validateIncomingIds(incomingTasks, update.label),
  ...collectSensitiveDataFindings({ [update.label]: incomingTasks }, "update file")
];

incomingTasks.forEach((task, index) => {
  if (task && task.deleted === true && typeof task.id === "string" && task.id.trim()) return;
  if (!validateTask(task)) {
    updateErrors.push(...formatAjvErrors(`${update.label}[${index}]`, validateTask.errors));
  }
});

if (updateErrors.length > 0) {
  console.error("Update file is invalid:");
  updateErrors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

const byId = new Map(existing.tasks.map((task) => [task.id, task]));
let added = 0;
let updated = 0;
let deleted = 0;
const conflicts = [];

incomingTasks.forEach((task) => {
  const existingTask = byId.get(task.id);
  if (!existingTask) return;

  const baseUpdatedAt = update.baseTaskUpdatedAt[task.id];
  if (typeof baseUpdatedAt !== "string") {
    conflicts.push(`${task.id}: update is missing meta.baseTaskUpdatedAt for existing task`);
    return;
  }
  if ((existingTask.updatedAt || "") !== baseUpdatedAt) {
    conflicts.push(`${task.id}: current updatedAt ${existingTask.updatedAt || "(empty)"} differs from update base ${baseUpdatedAt || "(new task)"}`);
  }
});

if (conflicts.length > 0 && !force) {
  console.error("Import conflicts detected; data/tasks.json was not changed:");
  conflicts.forEach((conflict) => console.error(`- ${conflict}`));
  console.error("Re-open the latest tasks.json and export again, or rerun with --force if overwrite is intentional.");
  process.exit(1);
}

if (conflicts.length > 0 && force) {
  console.warn("Import conflicts ignored because --force was provided:");
  conflicts.forEach((conflict) => console.warn(`- ${conflict}`));
}

incomingTasks.forEach((task) => {
  if (task.deleted === true) {
    if (byId.delete(task.id)) deleted += 1;
    return;
  }
  if (byId.has(task.id)) updated += 1;
  else added += 1;
  byId.set(task.id, task);
});

const mergeTime = nowIso();
const merged = {
  ...existing,
  meta: {
    ...existing.meta,
    updatedAt: mergeTime,
    syncState: {
      ...existing.meta.syncState,
      lastSyncAt: mergeTime,
      lastSyncSource: "import-update",
      lastSyncStatus: "success",
      lastSyncSummary: `Imported ${added} added, ${updated} updated, ${deleted} deleted from ${path.basename(updatePath)}.`
    }
  },
  tasks: Array.from(byId.values()).sort((a, b) => a.id.localeCompare(b.id))
};

const mergedErrors = [];
if (!validateBoard(merged)) mergedErrors.push(...formatAjvErrors("merged", validateBoard.errors));
mergedErrors.push(...validateBoardIntegrity(merged));
mergedErrors.push(...collectSensitiveDataFindings(merged, "merged data"));

if (mergedErrors.length > 0) {
  console.error("Merged data is invalid; data/tasks.json was not changed:");
  mergedErrors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

await mkdir(path.join(root, "backups"), { recursive: true });
const backupPath = path.join(root, "backups", `tasks-backup-${timestampForFile()}.json`);
await writeFile(backupPath, stableJson(existing), "utf8");
await writeFile(path.join(root, "data", "tasks.json"), stableJson(merged), "utf8");

console.log(`Imported update: ${added} added, ${updated} updated, ${deleted} deleted.`);
console.log(`Task board written: ${path.join(root, "data", "tasks.json")}`);
console.log(`Backup written: ${backupPath}`);
