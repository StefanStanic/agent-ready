import type {
  AgentReadyCommandConfig,
  AgentReadyConfig,
  AgentReadyScaffoldConfig,
  CheckStatus,
  ConfigValidationResult,
  FrameworkName,
  OutputFormat,
  ScaffoldFeature
} from "./types";

const CHECK_STATUSES: CheckStatus[] = ["pass", "warn", "fail", "not_applicable", "error"];
const OUTPUT_FORMATS: OutputFormat[] = ["human", "json", "markdown"];
const FRAMEWORKS: FrameworkName[] = [
  "next",
  "nuxt",
  "astro",
  "vite-react",
  "vite-vue",
  "sveltekit",
  "express",
  "hono",
  "unknown"
];
const SCAFFOLD_FEATURES: ScaffoldFeature[] = [
  "api-catalog",
  "robots",
  "sitemap",
  "llms",
  "markdown",
  "mcp",
  "agent-card",
  "oauth-discovery",
  "oauth-protected-resource"
];
const PRESETS = ["content-site", "application"] as const;

export class AgentReadyConfigError extends Error {
  readonly issues: string[];

  constructor(issues: string[]) {
    super(`Invalid agent-ready config:\n${issues.map((issue) => `- ${issue}`).join("\n")}`);
    this.name = "AgentReadyConfigError";
    this.issues = issues;
  }
}

export function validateAgentReadyConfig(input: unknown): ConfigValidationResult {
  const errors: string[] = [];

  if (!isRecord(input)) {
    return {
      valid: false,
      errors: ["Config root must be an object."]
    };
  }

  validateCommandConfig(input.defaults, "defaults", errors);
  validateCommandConfig(input.scan, "scan", errors);
  validateCommandConfig(input.doctor, "doctor", errors);
  validateScaffoldConfig(input.init, "init", errors);

  return {
    valid: errors.length === 0,
    errors
  };
}

export function assertValidAgentReadyConfig(input: unknown): AgentReadyConfig {
  const validation = validateAgentReadyConfig(input);

  if (!validation.valid) {
    throw new AgentReadyConfigError(validation.errors);
  }

  return input as AgentReadyConfig;
}

function validateCommandConfig(
  input: unknown,
  path: string,
  errors: string[]
): asserts input is AgentReadyCommandConfig | undefined {
  if (input === undefined) {
    return;
  }

  if (!isRecord(input)) {
    errors.push(`${path} must be an object.`);
    return;
  }

  if (input.minScore !== undefined && !isFiniteNumber(input.minScore)) {
    errors.push(`${path}.minScore must be a finite number.`);
  }

  if (input.output !== undefined && !OUTPUT_FORMATS.includes(input.output as OutputFormat)) {
    errors.push(`${path}.output must be one of: ${OUTPUT_FORMATS.join(", ")}.`);
  }

  if (input.failOnStatuses !== undefined) {
    if (!Array.isArray(input.failOnStatuses)) {
      errors.push(`${path}.failOnStatuses must be an array.`);
    } else {
      for (const status of input.failOnStatuses) {
        if (!CHECK_STATUSES.includes(status as CheckStatus)) {
          errors.push(
            `${path}.failOnStatuses contains invalid value "${String(status)}".`
          );
        }
      }
    }
  }
}

function validateScaffoldConfig(
  input: unknown,
  path: string,
  errors: string[]
): asserts input is (AgentReadyScaffoldConfig & { output?: OutputFormat }) | undefined {
  if (input === undefined) {
    return;
  }

  if (!isRecord(input)) {
    errors.push(`${path} must be an object.`);
    return;
  }

  if (input.output !== undefined && !OUTPUT_FORMATS.includes(input.output as OutputFormat)) {
    errors.push(`${path}.output must be one of: ${OUTPUT_FORMATS.join(", ")}.`);
  }

  if (input.dryRun !== undefined && typeof input.dryRun !== "boolean") {
    errors.push(`${path}.dryRun must be a boolean.`);
  }

  if (input.framework !== undefined && !FRAMEWORKS.includes(input.framework as FrameworkName)) {
    errors.push(`${path}.framework contains invalid value "${String(input.framework)}".`);
  }

  if (input.preset !== undefined && !PRESETS.includes(input.preset as (typeof PRESETS)[number])) {
    errors.push(`${path}.preset must be one of: ${PRESETS.join(", ")}.`);
  }

  if (input.features !== undefined) {
    if (!Array.isArray(input.features)) {
      errors.push(`${path}.features must be an array.`);
    } else {
      for (const feature of input.features) {
        if (!SCAFFOLD_FEATURES.includes(feature as ScaffoldFeature)) {
          errors.push(`${path}.features contains invalid value "${String(feature)}".`);
        }
      }
    }
  }
}

function isRecord(input: unknown): input is Record<string, unknown> {
  return Boolean(input) && typeof input === "object" && !Array.isArray(input);
}

function isFiniteNumber(input: unknown): input is number {
  return typeof input === "number" && Number.isFinite(input);
}
