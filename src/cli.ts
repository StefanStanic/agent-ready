import { explainCheck, scanProject, scanSite, scaffoldProject } from "./index";
import { loadAgentReadyConfig } from "./core/config";
import { evaluateScanFailure } from "./core/evaluate";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import type {
  AgentReadyCommandConfig,
  AgentReadyScaffoldConfig,
  CheckStatus,
  FrameworkName,
  OutputFormat,
  ScaffoldFeature
} from "./core/types";
import type { CheckDefinition } from "./core/types";
import { renderScanResult, renderScaffoldResult } from "./reporters/human";
import { renderScanResultMarkdown, renderScaffoldResultMarkdown } from "./reporters/markdown";
import { interactiveWizard } from "./scaffold/wizard";

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
    case "--list-features":
      printFeatures();
      return;
    case "--list-frameworks":
      printFrameworks();
      return;
    case "--list-checks":
      printChecks();
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
  printOutput(
    renderOutput(report, resolveOutputFormat(args, config.scan, config.defaults)),
    readOption(args, "--report-file")
  );
  applyFailurePolicy(report, args, config.scan, config.defaults);
}

async function runDoctor(args: string[]): Promise<void> {
  const cwd = readOption(args, "--cwd") ?? readPositional(args, 0);
  const config = await loadAgentReadyConfig(cwd ?? process.cwd());
  const report = await scanProject({ cwd });
  printOutput(
    renderOutput(report, resolveOutputFormat(args, config.doctor, config.defaults)),
    readOption(args, "--report-file")
  );
  applyFailurePolicy(report, args, config.doctor, config.defaults);
}

async function runInit(args: string[]): Promise<void> {
  const cwd = readOption(args, "--cwd") ?? process.cwd();
  const config = await loadAgentReadyConfig(cwd);
  const framework = (readOption(args, "--framework") as FrameworkName | undefined) ?? config.init?.framework;
  const preset =
    (readOption(args, "--preset") as "content-site" | "application" | undefined) ??
    config.init?.preset;
  const features = parseFeatures(readOption(args, "--features")) ?? config.init?.features;
  const dryRun = hasFlag(args, "--dry-run") || config.init?.dryRun === true;
  const interactive = hasFlag(args, "--interactive");

  const placeholders = interactive ? await interactiveWizard(cwd) : undefined;

  const result = await scaffoldProject({
    cwd,
    features,
    framework,
    preset,
    dryRun,
    placeholders
  });
  printOutput(
    renderScaffoldOutputText(result, resolveOutputFormat(args, config.init)),
    readOption(args, "--report-file")
  );
}

async function runAdd(args: string[]): Promise<void> {
  const feature = readPositional(args, 0) as ScaffoldFeature | undefined;
  const cwd = readOption(args, "--cwd") ?? process.cwd();
  const config = await loadAgentReadyConfig(cwd);

  if (!feature) {
    throw new Error("Usage: agent-ready add <feature>");
  }

  const interactive = hasFlag(args, "--interactive");
  const placeholders = interactive ? await interactiveWizard(cwd) : undefined;

  const result = await scaffoldProject({
    cwd,
    features: [feature],
    placeholders
  });
  printOutput(
    renderScaffoldOutputText(result, resolveOutputFormat(args, config.init)),
    readOption(args, "--report-file")
  );
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

function printOutput(output: string, reportFile?: string): void {
  console.log(output);

  if (!reportFile) {
    return;
  }

  mkdirSync(dirname(reportFile), { recursive: true });
  writeFileSync(reportFile, `${output}\n`, "utf8");
}

function printHelp(): void {
  console.log(
    [
      "agent-ready",
      "",
      "Commands:",
      "  agent-ready scan <url> [--json] [--format human|json|markdown] [--report-file <path>] [--min-score <n>] [--fail-on-status <list>]",
      "  agent-ready init [--cwd <path>] [--framework <name>] [--preset <name>] [--features <list>] [--dry-run] [--interactive] [--json] [--format human|json|markdown] [--report-file <path>]",
      "  agent-ready add <feature> [--cwd <path>] [--interactive] [--json] [--format human|json|markdown] [--report-file <path>]",
      "  agent-ready doctor [cwd] [--cwd <path>] [--json] [--format human|json|markdown] [--report-file <path>] [--min-score <n>] [--fail-on-status <list>]",
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
    name === "--cwd" ||
    name === "--features" ||
    name === "--framework" ||
    name === "--preset" ||
    name === "--report-file" ||
    name === "--min-score" ||
    name === "--fail-on-status" ||
    name === "--format"
  );
}

function parseFeatures(input: string | undefined): ScaffoldFeature[] | undefined {
  if (!input) {
    return undefined;
  }

  return input
    .split(",")
    .map((value) => value.trim())
    .filter((value): value is ScaffoldFeature => value.length > 0);
}

function resolveOutputFormat(
  args: string[],
  commandConfig?: AgentReadyCommandConfig | (AgentReadyScaffoldConfig & { output?: OutputFormat }),
  defaultConfig?: AgentReadyCommandConfig
): OutputFormat {
  const format = readOption(args, "--format") as OutputFormat | undefined;

  if (format && isValidFormat(format)) {
    return format;
  }

  if (hasFlag(args, "--json")) {
    return "json";
  }

  return commandConfig?.output ?? defaultConfig?.output ?? "human";
}

function isValidFormat(value: string): value is OutputFormat {
  return value === "human" || value === "json" || value === "markdown";
}

function renderOutput(
  value: Parameters<typeof renderScanResult>[0],
  format: OutputFormat
): string {
  if (format === "json") {
    return JSON.stringify(value, null, 2);
  }

  if (format === "markdown") {
    return renderScanResultMarkdown(value);
  }

  return renderScanResult(value);
}

function renderScaffoldOutputText(
  value: Parameters<typeof renderScaffoldResult>[0],
  format: OutputFormat
): string {
  if (format === "json") {
    return JSON.stringify(value, null, 2);
  }

  if (format === "markdown") {
    return renderScaffoldResultMarkdown(value);
  }

  return renderScaffoldResult(value);
}

function printFeatures(): void {
  console.log(
    [
      "Scaffoldable features:",
      "",
      "  api-catalog              OpenAPI/Swagger document",
      "  robots                   robots.txt with AI bot rules",
      "  sitemap                  XML sitemap",
      "  llms                     llms.txt markdown file",
      "  markdown                 Markdown content negotiation route",
      "  mcp                      MCP server card (/.well-known/mcp.json)",
      "  agent-card               A2A agent card (/.well-known/agent.json)",
      "  oauth-discovery          OAuth authorization server metadata",
      "  oauth-protected-resource OAuth protected resource metadata"
    ].join("\n")
  );
}

function printFrameworks(): void {
  console.log(
    [
      "Supported frameworks:",
      "",
      "  next         Next.js (App Router)",
      "  nuxt         Nuxt 3 (Nitro server routes)",
      "  astro        Astro (pages + static)",
      "  sveltekit    SvelteKit (server routes)",
      "  vite-react   Vite + React (plugin-based dev server)",
      "  vite-vue     Vite + Vue (plugin-based dev server)",
      "  express      Express (sidecar modules)",
      "  hono         Hono (sidecar modules)"
    ].join("\n")
  );
}

function printChecks(): void {
  const check = explainCheck("robots-txt");

  if (!check) {
    return;
  }

  console.log(
    [
      "Checks (18 total):",
      "",
      "Discoverability:",
      "  robots-txt               /robots.txt existence and directives",
      "  sitemap                  Sitemap discoverability and parsing",
      "  link-headers             Discovery Link headers on homepage",
      "",
      "Content Accessibility:",
      "  markdown-negotiation     Accept: text/markdown support",
      "",
      "Bot Access Control:",
      "  ai-bot-rules             AI crawler directives in robots.txt",
      "  content-signals          Content-Signal policies",
      "  web-bot-auth             Web Bot Auth directory verification",
      "",
      "Discovery / API / Auth:",
      "  api-catalog              OpenAPI/Swagger document",
      "  mcp-server-card          MCP server card (/.well-known/mcp.json)",
      "  a2a-agent-card           A2A agent card (/.well-known/agent.json)",
      "  agent-skills             Agent Skills in llms.txt and HTML",
      "  webmcp                   WebMCP capability markers",
      "  oauth-discovery          OAuth authorization server metadata",
      "  oauth-protected-resource OAuth protected resource metadata",
      "",
      "Commerce:",
      "  x402                     x402 payment protocol",
      "  mpp                      Merchant Payment Protocol",
      "  ucp                      Universal Commerce Protocol",
      "  acp                      Agentic Commerce Protocol"
    ].join("\n")
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
