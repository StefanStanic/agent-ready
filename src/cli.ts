import { explainCheck, scanProject, scanSite, scaffoldProject } from "./index";
import { evaluateScanFailure } from "./core/evaluate";
import type { CheckStatus, FrameworkName, ScaffoldFeature } from "./core/types";
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

  if (!url) {
    throw new Error("Usage: agent-ready scan <url>");
  }

  const report = await scanSite({ url });
  printOutput(report, hasFlag(args, "--json") ? "json" : "human");
  applyFailurePolicy(report, args);
}

async function runDoctor(args: string[]): Promise<void> {
  const cwd = readPositional(args, 0);
  const report = await scanProject({ cwd });
  printOutput(report, hasFlag(args, "--json") ? "json" : "human");
  applyFailurePolicy(report, args);
}

async function runInit(args: string[]): Promise<void> {
  const framework = readOption(args, "--framework") as FrameworkName | undefined;
  const dryRun = hasFlag(args, "--dry-run");
  const result = await scaffoldProject({
    framework,
    dryRun
  });
  printScaffoldOutput(result, hasFlag(args, "--json") ? "json" : "human");
}

async function runAdd(args: string[]): Promise<void> {
  const feature = readPositional(args, 0) as ScaffoldFeature | undefined;

  if (!feature) {
    throw new Error("Usage: agent-ready add <feature>");
  }

  const result = await scaffoldProject({
    features: [feature]
  });
  printScaffoldOutput(result, hasFlag(args, "--json") ? "json" : "human");
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
      "  agent-ready init [--framework <name>] [--dry-run] [--json]",
      "  agent-ready add <feature> [--json]",
      "  agent-ready doctor [cwd] [--json] [--min-score <n>] [--fail-on-status <list>]",
      "  agent-ready explain <check>"
    ].join("\n")
  );
}

function applyFailurePolicy(
  result: Parameters<typeof evaluateScanFailure>[0],
  args: string[]
): void {
  const minScore = readOption(args, "--min-score");
  const failOnStatus = readOption(args, "--fail-on-status");
  const evaluation = evaluateScanFailure(result, {
    minScore: minScore ? Number(minScore) : undefined,
    failOnStatuses: failOnStatus ? parseStatuses(failOnStatus) : undefined
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
  return name === "--framework" || name === "--min-score" || name === "--fail-on-status";
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
