import { explainCheck, scanProject, scanSite, scaffoldProject } from "./index";
import { loadAgentReadyConfig } from "./core/config";
import { evaluateScanFailure } from "./core/evaluate";
import type {
  AgentReadyCommandConfig,
  AgentReadyScaffoldConfig,
  CheckStatus,
  FrameworkName,
  OutputFormat,
  ScaffoldFeature
} from "./core/types";
import { renderScanResult, renderScaffoldResult } from "./reporters/human";

async function main(): Promise<void> {
  const [, , command, ...args] = process.argv;

  switch (command) {
    case "scan":
      await runScan(args);
      return;
    case "doctor":
      await runDoctor(args);
      return;
    case "init":
      await runInit(args);
      return;
    case "add":
      await runAdd(args);
      return;
    case "explain":
      runExplain(args);
      return;
    case "--help":
    case "-h":
    case undefined:
      printHelp();
      return;
    default:
      console.error(`Unknown command: ${command}`);
      printHelp();
      process.exitCode = 1;
  }
}

async function runScan(args: string[]): Promise<void> {
  const url = readPositional(args, 0);
  const config = await loadAgentReadyConfig(process.cwd());

  if (!url) {
    throw new Error("Usage: agent-ready scan <url>");
  }

  const report = await scanSite({ url });
  printOutput(report, resolveOutputFormat(args, config.scan, config.defaults));
  applyFailurePolicy(report, args, config.scan, config.defaults);
}

async function runDoctor(args: string[]): Promise<void> {
  const cwd = readPositional(args, 0);
  const config = await loadAgentReadyConfig(cwd ?? process.cwd());
  const report = await scanProject({ cwd });
  printOutput(report, resolveOutputFormat(args, config.doctor, config.defaults));
  applyFailurePolicy(report, args, config.doctor, config.defaults);
}

async function runInit(args: string[]): Promise<void> {
  const config = await loadAgentReadyConfig(process.cwd());
  const framework = (readOption(args, "--framework") as FrameworkName | undefined) ?? config.init?.framework;
  const preset =
    (readOption(args, "--preset") as "content-site" | "application" | undefined) ??
    config.init?.preset;
  const dryRun = hasFlag(args, "--dry-run") || config.init?.dryRun === true;
  const result = await scaffoldProject({
    features: config.init?.features,
    framework,
    preset,
    dryRun
  });
  printScaffoldOutput(result, resolveOutputFormat(args, config.init));
}

async function runAdd(args: string[]): Promise<void> {
  const feature = readPositional(args, 0) as ScaffoldFeature | undefined;
  const config = await loadAgentReadyConfig(process.cwd());

  if (!feature) {
    throw new Error("Usage: agent-ready add <feature>");
  }

  const result = await scaffoldProject({
    features: [feature]
  });
  printScaffoldOutput(result, resolveOutputFormat(args, config.init));
}

function runExplain(args: string[]): void {
  const id = args[0];

  if (!id) {
    throw new Error("Usage: agent-ready explain <check>");
  }

  const explanation = explainCheck(id);

  if (!explanation) {
    throw new Error(`Unknown check: ${id}`);
  }

  printJson(explanation);
}

function hasFlag(args: string[], flag: string): boolean {
  return args.includes(flag);
}

function readOption(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);

  if (index === -1) {
    return undefined;
  }

  return args[index + 1];
}

function readPositional(args: string[], position: number): string | undefined {
  const positionals: string[] = [];

  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];

    if (!value) {
      continue;
    }

    if (value.startsWith("--")) {
      const next = args[index + 1];

      if (next && !next.startsWith("--") && optionExpectsValue(value)) {
        index += 1;
      }

      continue;
    }

    positionals.push(value);
  }

  return positionals[position];
}

function printJson(value: unknown): void {
  console.log(JSON.stringify(value, null, 2));
}

function printOutput(
  value: Parameters<typeof renderScanResult>[0],
  format: "json" | "human"
): void {
  if (format === "json") {
    printJson(value);
    return;
  }

  console.log(renderScanResult(value));
}

function printScaffoldOutput(
  value: Parameters<typeof renderScaffoldResult>[0],
  format: "json" | "human"
): void {
  if (format === "json") {
    printJson(value);
    return;
  }

  console.log(renderScaffoldResult(value));
}

function printHelp(): void {
  console.log(
    [
      "agent-ready",
      "",
      "Commands:",
      "  agent-ready scan <url> [--json] [--min-score <n>] [--fail-on-status <list>]",
      "  agent-ready init [--framework <name>] [--preset <name>] [--dry-run] [--json]",
      "  agent-ready add <feature> [--json]",
      "  agent-ready doctor [cwd] [--json] [--min-score <n>] [--fail-on-status <list>]",
      "  agent-ready explain <check>"
    ].join("\n")
  );
}

function applyFailurePolicy(
  result: Parameters<typeof evaluateScanFailure>[0],
  args: string[],
  commandConfig?: AgentReadyCommandConfig,
  defaultConfig?: AgentReadyCommandConfig
): void {
  const minScore = readOption(args, "--min-score");
  const failOnStatus = readOption(args, "--fail-on-status");
  const evaluation = evaluateScanFailure(result, {
    minScore: minScore ? Number(minScore) : commandConfig?.minScore ?? defaultConfig?.minScore,
    failOnStatuses: failOnStatus
      ? parseStatuses(failOnStatus)
      : commandConfig?.failOnStatuses ?? defaultConfig?.failOnStatuses
  });

  if (!evaluation.failed) {
    return;
  }

  for (const reason of evaluation.reasons) {
    console.error(reason);
  }

  process.exitCode = 1;
}

function parseStatuses(input: string): CheckStatus[] {
  const allowedStatuses: CheckStatus[] = ["pass", "warn", "fail", "not_applicable", "error"];

  return input
    .split(",")
    .map((value) => value.trim())
    .filter((value): value is CheckStatus =>
      allowedStatuses.includes(value as CheckStatus)
    );
}

function optionExpectsValue(name: string): boolean {
  return (
    name === "--framework" ||
    name === "--preset" ||
    name === "--min-score" ||
    name === "--fail-on-status"
  );
}

function resolveOutputFormat(
  args: string[],
  commandConfig?: AgentReadyCommandConfig | (AgentReadyScaffoldConfig & { output?: OutputFormat }),
  defaultConfig?: AgentReadyCommandConfig
): OutputFormat {
  if (hasFlag(args, "--json")) {
    return "json";
  }

  return commandConfig?.output ?? defaultConfig?.output ?? "human";
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
