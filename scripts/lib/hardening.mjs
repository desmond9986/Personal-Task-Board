import { readFile, realpath } from "node:fs/promises";
import path from "node:path";

const PROJECT_NAME = "personal-task-board";

function toPosixPath(filePath) {
  return filePath.split(path.sep).join("/");
}

async function readJsonFile(filePath) {
  const text = await readFile(filePath, "utf8");
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`Invalid JSON in ${filePath}: ${error.message}`);
  }
}

export async function readJson(root, relativeOrAbsolutePath) {
  const filePath = path.isAbsolute(relativeOrAbsolutePath)
    ? relativeOrAbsolutePath
    : path.join(root, relativeOrAbsolutePath);
  return readJsonFile(filePath);
}

export async function assertProjectRoot(rootInput) {
  const root = await realpath(rootInput);
  const normalized = toPosixPath(root);
  const deniedMarkers = [
    "/.codex/plugins/",
    "/.codex/.tmp/plugins/",
    "/.claude/plugins/",
    "/.claude/plugins-cache/",
    "/Library/Application Support/Claude/",
    "/plugins/cache/"
  ];

  const deniedMarker = deniedMarkers.find((marker) => normalized.includes(marker));
  if (deniedMarker) {
    throw new Error(`Refusing to run from plugin/cache path: ${root}`);
  }

  const requiredFiles = [
    "package.json",
    ".codex-plugin/plugin.json",
    ".claude-plugin/plugin.json",
    "data/tasks.json"
  ];

  const missing = [];
  const readRequiredJson = async (relativePath) => {
    try {
      return await readJsonFile(path.join(root, relativePath));
    } catch {
      missing.push(relativePath);
      return null;
    }
  };

  const [packageJson, codexManifest, claudeManifest, board] = await Promise.all(
    requiredFiles.map(readRequiredJson)
  );

  if (missing.length > 0) {
    throw new Error(`Refusing to run outside the Personal Task Board repo. Missing: ${missing.join(", ")}`);
  }

  const nameChecks = [
    ["package.json", packageJson?.name],
    [".codex-plugin/plugin.json", codexManifest?.name],
    [".claude-plugin/plugin.json", claudeManifest?.name]
  ];

  nameChecks.forEach(([label, name]) => {
    if (name !== PROJECT_NAME) {
      throw new Error(`Refusing to run from unexpected project root. ${label} name is "${name || "(missing)"}", expected "${PROJECT_NAME}".`);
    }
  });

  if (!board?.meta || !Array.isArray(board.tasks)) {
    throw new Error("Refusing to run because data/tasks.json is not a Personal Task Board data file.");
  }

  return root;
}

export function formatAjvErrors(label, errors = []) {
  return errors.map((error) => {
    const location = error.instancePath || "/";
    return `${label} ${location} ${error.message}`;
  });
}

function assertIncludesAll(label, actual, expected, errors) {
  if (!Array.isArray(actual)) {
    errors.push(`${label} must be an array`);
    return;
  }
  const actualSet = new Set(actual);
  expected.forEach((value) => {
    if (!actualSet.has(value)) errors.push(`${label} is missing required value "${value}"`);
  });
}

function assertSameSet(label, actual, expected, errors) {
  if (!Array.isArray(actual)) {
    errors.push(`${label} must be an array`);
    return;
  }
  assertIncludesAll(label, actual, expected, errors);
  const expectedSet = new Set(expected);
  actual.forEach((value) => {
    if (!expectedSet.has(value)) errors.push(`${label} contains "${value}" but schema does not allow it`);
  });
}

function addDuplicateErrors(items, label, identityForItem, errors) {
  const seen = new Map();
  items.forEach((item, index) => {
    const identity = identityForItem(item);
    if (!identity) return;
    if (seen.has(identity)) {
      errors.push(`${label}[${index}] duplicates ${label}[${seen.get(identity)}] identity "${identity}"`);
      return;
    }
    seen.set(identity, index);
  });
}

function externalRefIdentity(ref) {
  if (!ref || typeof ref !== "object") return "";
  const parts = [ref.type, ref.system, ref.id, ref.url, ref.label]
    .map((value) => String(value || "").trim().toLowerCase());
  return parts.some(Boolean) ? parts.join("|") : "";
}

function agentIdentity(agent) {
  if (!agent || typeof agent !== "object") return "";
  const parts = [agent.role, agent.name, agent.threadId, agent.agentId]
    .map((value) => String(value || "").trim().toLowerCase());
  return parts.some(Boolean) ? parts.join("|") : "";
}

export function validateBoardIntegrity(board) {
  const errors = [];
  if (!Array.isArray(board?.tasks)) return errors;

  addDuplicateErrors(board.tasks, "tasks", (task) => task?.id, errors);

  board.tasks.forEach((task) => {
    if (!task || typeof task !== "object" || !task.id) return;
    addDuplicateErrors(task.questions || [], `${task.id}.questions`, (question) => question?.id, errors);
    addDuplicateErrors(task.activity || [], `${task.id}.activity`, (activity) => activity?.id, errors);
    addDuplicateErrors(task.checklist || [], `${task.id}.checklist`, (item) => item?.id, errors);
    addDuplicateErrors(task.externalRefs || [], `${task.id}.externalRefs`, externalRefIdentity, errors);
    addDuplicateErrors(task.evidence?.links || [], `${task.id}.evidence.links`, externalRefIdentity, errors);
    addDuplicateErrors(task.agents || [], `${task.id}.agents`, agentIdentity, errors);
  });

  return errors;
}

function validateFilterValues(view, filterKey, allowedValues, errors) {
  const values = view.filter?.[filterKey];
  if (!Array.isArray(values) || !Array.isArray(allowedValues)) return;
  values.forEach((value) => {
    if (!allowedValues.includes(value)) {
      errors.push(`config.views.${view.id}.filter.${filterKey} contains unsupported value "${value}"`);
    }
  });
}

export function validateConfigPolicy(config, boardSchema) {
  const errors = [];
  const taskSchema = boardSchema.$defs.task;
  const schemaOptions = {
    statuses: taskSchema.properties.status.enum,
    types: taskSchema.properties.type.enum,
    priorities: taskSchema.properties.priority.enum,
    energies: taskSchema.properties.energy.enum,
    evidenceStates: taskSchema.properties.evidence.properties.state.enum
  };

  if (!config?.options || !config?.sync || !Array.isArray(config.views)) return errors;

  const viewIds = new Set();
  config.views.forEach((view) => {
    if (viewIds.has(view.id)) errors.push(`config.views duplicates view id "${view.id}"`);
    viewIds.add(view.id);

    validateFilterValues(view, "status", config.options.statuses, errors);
    validateFilterValues(view, "excludeStatus", config.options.statuses, errors);
    validateFilterValues(view, "type", config.options.types, errors);
    validateFilterValues(view, "priority", config.options.priorities, errors);
    validateFilterValues(view, "evidenceState", config.options.evidenceStates, errors);
  });

  assertSameSet("config.options.statuses", config.options.statuses, schemaOptions.statuses, errors);
  assertSameSet("config.options.types", config.options.types, schemaOptions.types, errors);
  assertSameSet("config.options.priorities", config.options.priorities, schemaOptions.priorities, errors);
  assertSameSet("config.options.energies", config.options.energies, schemaOptions.energies, errors);
  assertSameSet("config.options.evidenceStates", config.options.evidenceStates, schemaOptions.evidenceStates, errors);

  if (config.sync.externalTicketSyncEnabled === false) {
    if (config.sync.ticketSystemProvider !== "unknown") {
      errors.push('config.sync.ticketSystemProvider must be "unknown" when externalTicketSyncEnabled is false');
    }
    if (config.sync.mcpPreferred !== false) {
      errors.push("config.sync.mcpPreferred must be false when externalTicketSyncEnabled is false");
    }
    if (config.sync.browserFallback !== false) {
      errors.push("config.sync.browserFallback must be false when externalTicketSyncEnabled is false");
    }
    if (!["manual", "disabled"].includes(config.sync.frequency)) {
      errors.push('config.sync.frequency must be "manual" or "disabled" when externalTicketSyncEnabled is false');
    }
  }

  return errors;
}

const SENSITIVE_PATTERNS = [
  ["private key", /-----BEGIN [A-Z0-9 ]*PRIVATE KEY-----/i],
  ["AWS access key", /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/],
  ["GitHub token", /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{20,}\b/],
  ["Slack token", /\bxox[abprs]-[A-Za-z0-9-]{20,}\b/],
  ["Stripe key", /\b(?:sk|pk)_(?:live|test)_[A-Za-z0-9]{16,}\b/],
  ["JWT", /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/],
  ["credential assignment", /\b(?:password|passwd|pwd|secret|api[_ -]?key|access[_ -]?token|auth[_ -]?token)\b\s*[:=]\s*["']?[^\s"',;]{8,}/i],
  ["customer/account identifier", /\b(?:customer|account|card)\s*(?:id|number|no)\s*[:=]\s*[A-Za-z0-9_-]{4,}/i],
  ["raw log or screenshot artifact", /\b(?:stack trace|traceback \(most recent call last\)|raw log|request payload|response body|screenshot|screen shot|\.har\b|\.log\b|\.png\b|\.jpg\b|\.jpeg\b)\b/i],
  ["private/internal host", /\b(?:https?:\/\/)?[A-Za-z0-9.-]+\.(?:internal|corp|local)(?:[:/]\S*)?/i]
];

function formatJsonPath(segments) {
  return segments.reduce((memo, segment) => {
    if (typeof segment === "number") return `${memo}[${segment}]`;
    return memo ? `${memo}.${segment}` : segment;
  }, "");
}

function walkStrings(value, pathSegments, visit) {
  if (typeof value === "string") {
    visit(value, pathSegments);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => walkStrings(item, [...pathSegments, index], visit));
    return;
  }
  if (value && typeof value === "object") {
    Object.entries(value).forEach(([key, item]) => walkStrings(item, [...pathSegments, key], visit));
  }
}

export function collectSensitiveDataFindings(value, label) {
  const findings = [];
  walkStrings(value, [], (text, pathSegments) => {
    SENSITIVE_PATTERNS.forEach(([name, pattern]) => {
      if (pattern.test(text)) {
        findings.push(`${label}.${formatJsonPath(pathSegments)} contains possible ${name}; sanitize or remove this value`);
      }
    });
  });
  return findings;
}
