import Ajv from "ajv";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const activeStatuses = new Set(["backlog", "todo", "in_progress", "need_discussion", "blocked", "waiting", "review"]);
const requiredStatuses = ["backlog", "todo", "in_progress", "need_discussion", "blocked", "waiting", "review", "done", "dropped"];
const requiredTypes = ["personal", "work_ticket", "learning", "agent_workflow", "career_review", "admin"];
const requiredEvidenceStates = ["missing", "later", "not_due", "captured"];

async function readJson(relativePath) {
  const filePath = path.join(root, relativePath);
  return JSON.parse(await readFile(filePath, "utf8"));
}

function formatAjvErrors(label, errors = []) {
  return errors.map((error) => {
    const location = error.instancePath || "/";
    return `${label} ${location} ${error.message}`;
  });
}

function assertIncludesAll(label, actual, expected, errors) {
  const actualSet = new Set(actual);
  expected.forEach((value) => {
    if (!actualSet.has(value)) errors.push(`${label} is missing required value "${value}"`);
  });
}

function validateCustom(board, config) {
  const errors = [];
  const ids = new Set();

  board.tasks.forEach((task, index) => {
    if (ids.has(task.id)) errors.push(`tasks[${index}] duplicates task id "${task.id}"`);
    ids.add(task.id);

    if (activeStatuses.has(task.status) && !task.nextAction.trim()) {
      errors.push(`${task.id} is active (${task.status}) but nextAction is empty`);
    }

    const questionIds = new Set();
    task.questions.forEach((question) => {
      if (questionIds.has(question.id)) errors.push(`${task.id} duplicates question id "${question.id}"`);
      questionIds.add(question.id);
    });

    const activityIds = new Set();
    task.activity.forEach((activity) => {
      if (activityIds.has(activity.id)) errors.push(`${task.id} duplicates activity id "${activity.id}"`);
      activityIds.add(activity.id);
    });
  });

  const viewIds = new Set();
  config.views.forEach((view) => {
    if (viewIds.has(view.id)) errors.push(`config.views duplicates view id "${view.id}"`);
    viewIds.add(view.id);
  });

  assertIncludesAll("config.options.statuses", config.options.statuses, requiredStatuses, errors);
  assertIncludesAll("config.options.types", config.options.types, requiredTypes, errors);
  assertIncludesAll("config.options.evidenceStates", config.options.evidenceStates, requiredEvidenceStates, errors);

  return errors;
}

const ajv = new Ajv({ allErrors: true });
const boardSchema = await readJson("schemas/task-board.schema.json");
const configSchema = await readJson("schemas/config.schema.json");
const board = await readJson("data/tasks.json");
const config = await readJson("data/config.json");

const validateBoard = ajv.compile(boardSchema);
const validateConfig = ajv.compile(configSchema);

const errors = [];
if (!validateBoard(board)) errors.push(...formatAjvErrors("data/tasks.json", validateBoard.errors));
if (!validateConfig(config)) errors.push(...formatAjvErrors("data/config.json", validateConfig.errors));
errors.push(...validateCustom(board, config));

if (errors.length > 0) {
  console.error("Validation failed:");
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`Validation passed: ${board.tasks.length} tasks, ${config.views.length} views.`);
