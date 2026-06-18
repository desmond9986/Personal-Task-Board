import Ajv from "ajv";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const activeStatuses = new Set(["backlog", "todo", "in_progress", "need_discussion", "blocked", "waiting", "review"]);

async function readJson(relativeOrAbsolutePath) {
  const filePath = path.isAbsolute(relativeOrAbsolutePath)
    ? relativeOrAbsolutePath
    : path.join(root, relativeOrAbsolutePath);
  return JSON.parse(await readFile(filePath, "utf8"));
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

function formatAjvErrors(label, errors = []) {
  return errors.map((error) => {
    const location = error.instancePath || "/";
    return `${label} ${location} ${error.message}`;
  });
}

function validateCustomBoard(board) {
  const errors = [];
  const ids = new Set();

  board.tasks.forEach((task, index) => {
    if (ids.has(task.id)) errors.push(`tasks[${index}] duplicates task id "${task.id}"`);
    ids.add(task.id);
    if (activeStatuses.has(task.status) && !task.nextAction.trim()) {
      errors.push(`${task.id} is active (${task.status}) but nextAction is empty`);
    }
  });

  return errors;
}

function updateTasksFromFile(updateFile) {
  if (Array.isArray(updateFile.taskUpdates)) {
    return {
      tasks: updateFile.taskUpdates,
      partial: true,
      baseTaskUpdatedAt: updateFile.meta?.baseTaskUpdatedAt || {}
    };
  }
  if (Array.isArray(updateFile.tasks)) {
    return {
      tasks: updateFile.tasks,
      partial: false,
      baseTaskUpdatedAt: updateFile.meta?.baseTaskUpdatedAt || {}
    };
  }
  throw new Error("Update file must contain a tasks[] or taskUpdates[] array.");
}

const updatePath = process.argv[2];
const force = process.argv.includes("--force");
if (!updatePath) {
  console.error("Usage: npm run import-update -- updates/tasks-update-YYYYMMDD-HHmmss.json");
  console.error("Use --force only when you intentionally want to overwrite conflict warnings.");
  process.exit(1);
}

const ajv = new Ajv({ allErrors: true });
const boardSchema = await readJson("schemas/task-board.schema.json");
const validateBoard = ajv.compile(boardSchema);
const validateTask = ajv.compile({
  ...boardSchema.$defs.task,
  $defs: boardSchema.$defs
});

const existing = await readJson("data/tasks.json");
if (!validateBoard(existing)) {
  console.error("Existing data/tasks.json is invalid:");
  formatAjvErrors("data/tasks.json", validateBoard.errors).forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

const updateFile = await readJson(updatePath);
const update = updateTasksFromFile(updateFile);
const incomingTasks = update.tasks;
const updateErrors = [];

incomingTasks.forEach((task, index) => {
  if (task && task.deleted === true && typeof task.id === "string" && task.id.trim()) return;
  if (!validateTask(task)) {
    updateErrors.push(...formatAjvErrors(`update.tasks[${index}]`, validateTask.errors));
  }
});

if (updateErrors.length > 0) {
  console.error("Update file is invalid:");
  updateErrors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

await mkdir(path.join(root, "backups"), { recursive: true });
const backupPath = path.join(root, "backups", `tasks-backup-${timestampForFile()}.json`);
await writeFile(backupPath, stableJson(existing), "utf8");

const byId = new Map(existing.tasks.map((task) => [task.id, task]));
let added = 0;
let updated = 0;
let deleted = 0;
const conflicts = [];

incomingTasks.forEach((task) => {
  const existingTask = byId.get(task.id);
  if (!existingTask) return;
  if (!update.partial) return;

  const baseUpdatedAt = update.baseTaskUpdatedAt[task.id];
  if (typeof baseUpdatedAt !== "string") {
    conflicts.push(`${task.id}: update is missing base updatedAt for existing task`);
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

incomingTasks.forEach((task) => {
  if (task.deleted === true) {
    if (byId.delete(task.id)) deleted += 1;
    return;
  }
  if (byId.has(task.id)) updated += 1;
  else added += 1;
  byId.set(task.id, task);
});

const merged = {
  ...existing,
  meta: {
    ...existing.meta,
    updatedAt: nowIso(),
    syncState: {
      ...existing.meta.syncState,
      lastSyncAt: nowIso(),
      lastSyncSource: "import-update",
      lastSyncStatus: "success",
      lastSyncSummary: `Imported ${added} added, ${updated} updated, ${deleted} deleted from ${path.basename(updatePath)}.`
    }
  },
  tasks: Array.from(byId.values()).sort((a, b) => a.id.localeCompare(b.id))
};

const mergedErrors = [];
if (!validateBoard(merged)) mergedErrors.push(...formatAjvErrors("merged", validateBoard.errors));
mergedErrors.push(...validateCustomBoard(merged));

if (mergedErrors.length > 0) {
  console.error("Merged data is invalid; original data was backed up but not overwritten:");
  mergedErrors.forEach((error) => console.error(`- ${error}`));
  console.error(`Backup written to ${backupPath}`);
  process.exit(1);
}

await writeFile(path.join(root, "data", "tasks.json"), stableJson(merged), "utf8");

console.log(`Imported update: ${added} added, ${updated} updated, ${deleted} deleted.`);
console.log(`Backup written: ${backupPath}`);
