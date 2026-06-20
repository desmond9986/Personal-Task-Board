import Ajv from "ajv";
import process from "node:process";
import {
  assertProjectRoot,
  collectSensitiveDataFindings,
  formatAjvErrors,
  readJson,
  validateBoardIntegrity,
  validateConfigPolicy
} from "./lib/hardening.mjs";

let root;
try {
  root = await assertProjectRoot(process.cwd());
} catch (error) {
  console.error(`Validation refused: ${error.message}`);
  process.exit(1);
}

const ajv = new Ajv({ allErrors: true });
const boardSchema = await readJson(root, "schemas/task-board.schema.json");
const configSchema = await readJson(root, "schemas/config.schema.json");
const board = await readJson(root, "data/tasks.json");
const config = await readJson(root, "data/config.json");

const validateBoard = ajv.compile(boardSchema);
const validateConfig = ajv.compile(configSchema);

const errors = [];
if (!validateBoard(board)) errors.push(...formatAjvErrors("data/tasks.json", validateBoard.errors));
if (!validateConfig(config)) errors.push(...formatAjvErrors("data/config.json", validateConfig.errors));
errors.push(...validateBoardIntegrity(board));
errors.push(...validateConfigPolicy(config, boardSchema));
errors.push(...collectSensitiveDataFindings(board, "data/tasks.json"));
errors.push(...collectSensitiveDataFindings({ sync: config.sync }, "data/config.json"));

if (errors.length > 0) {
  console.error("Validation failed:");
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`Validation passed: ${board.tasks.length} tasks, ${config.views.length} views.`);
