import type { CheckResult, ScanResult, ScaffoldProjectResult } from "../core/types";

const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
  inverse: "\x1b[7m"
};

const STATUS_COLORS: Record<string, string> = {
  pass: c.green,
  warn: c.yellow,
  fail: c.red,
  error: c.red,
  not_applicable: c.gray
};

const STATUS_ICONS: Record<string, string> = {
  pass: `${c.green}✔${c.reset}`,
  warn: `${c.yellow}⚠${c.reset}`,
  fail: `${c.red}✘${c.reset}`,
  error: `${c.red}✘${c.reset}`,
  not_applicable: `${c.gray}○${c.reset}`
};

export function renderScanResult(result: ScanResult): string {
  const lines: string[] = [];

  lines.push(`${c.bold}${c.cyan}${result.target}${c.reset}`);
  lines.push(`${c.dim}${result.mode === "site" ? "Live site scan" : "Local project scan"}  ·  ${c.reset}${scoreBar(result.score)}`);
  lines.push("");

  if (Object.keys(result.categoryScores).length > 0) {
    for (const [category, score] of Object.entries(result.categoryScores)) {
      const label = categoryName(category);
      const bar = categoryBar(score);
      lines.push(`  ${label.padEnd(22)} ${bar}`);
    }

    lines.push("");
  }

  const byCategory = groupByCategory(result.checks);

  for (const [category, checks] of Object.entries(byCategory)) {
    lines.push(`${c.bold}${categoryName(category)}${c.reset}`);

    for (const check of checks) {
      lines.push(renderCheck(check));
    }

    lines.push("");
  }

  return lines.join("\n");
}

export function renderScaffoldResult(result: ScaffoldProjectResult): string {
  const lines: string[] = [];

  lines.push(`${c.bold}${c.cyan}${result.cwd}${c.reset}`);
  lines.push(`${c.dim}Framework${c.reset} ${result.framework.framework}`);
  lines.push("");

  for (const operation of result.operations) {
    const icon =
      operation.status === "create"
        ? `${c.green}+${c.reset}`
        : operation.status === "skip"
          ? `${c.gray}·${c.reset}`
          : `${c.yellow}⚠${c.reset}`;

    lines.push(`  ${icon} ${operation.path}`);
    lines.push(`    ${c.dim}${operation.reason}${c.reset}`);

    if (operation.status === "conflict") {
      if (operation.existingPreview) {
        lines.push(`    ${c.dim}Existing:${c.reset}`);
        lines.push(indent(operation.existingPreview, 6));
      }

      if (operation.generatedPreview) {
        lines.push(`    ${c.dim}Generated:${c.reset}`);
        lines.push(indent(operation.generatedPreview, 6));
      }
    }
  }

  return lines.join("\n");
}

function renderCheck(check: CheckResult): string {
  const icon = STATUS_ICONS[check.status] ?? "";
  const color = STATUS_COLORS[check.status] ?? c.reset;
  const lines = [`  ${icon} ${color}${check.title}${c.reset}`, `    ${c.dim}${check.summary}${c.reset}`];

  if (check.status !== "pass" && check.fixes.length > 0) {
    for (const fix of check.fixes.slice(0, 2)) {
      lines.push(`    ${c.yellow}→ ${fix}${c.reset}`);
    }
  }

  return lines.join("\n");
}

function scoreBar(score: number): string {
  const color = score >= 80 ? c.green : score >= 50 ? c.yellow : c.red;
  const filled = Math.round(score / 10);
  const empty = 10 - filled;
  const bar = "█".repeat(filled) + "░".repeat(empty);

  return `${c.inverse} ${color}${c.inverse} ${c.reset}${color}${bar}${c.reset} ${c.bold}${score}/100${c.reset}`;
}

function categoryBar(score: number): string {
  const color = score >= 80 ? c.green : score >= 50 ? c.yellow : c.red;
  const filled = Math.round(score / 20);
  const empty = 5 - filled;
  const bar = "●".repeat(filled) + "○".repeat(empty);

  return `${c.bold}${String(score).padStart(3)}${c.reset}/100  ${color}${bar}${c.reset}`;
}

function categoryName(category: string): string {
  switch (category) {
    case "discoverability":
      return "Discoverability";
    case "content-accessibility":
      return "Content";
    case "bot-access-control":
      return "Bot Access";
    case "discovery":
      return "Discovery";
    case "commerce":
      return "Commerce";
    default:
      return category;
  }
}

function groupByCategory(checks: CheckResult[]): Record<string, CheckResult[]> {
  const order = ["discoverability", "content-accessibility", "bot-access-control", "discovery", "commerce"];
  const groups: Record<string, CheckResult[]> = {};

  for (const check of checks) {
    groups[check.category] = groups[check.category] ?? [];
    groups[check.category].push(check);
  }

  const sorted: Record<string, CheckResult[]> = {};

  for (const category of order) {
    if (groups[category]) {
      sorted[category] = groups[category];
    }
  }

  return sorted;
}

function indent(input: string, spaces: number): string {
  const prefix = " ".repeat(spaces);
  return input
    .split("\n")
    .map((line) => `${prefix}${line}`)
    .join("\n");
}
