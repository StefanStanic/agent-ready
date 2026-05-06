import type { CheckResult, ScanResult, ScaffoldProjectResult } from "../core/types";

export function renderScanResult(result: ScanResult): string {
  const lines = [
    `Target: ${result.target}`,
    `Mode: ${result.mode}`,
    `Score: ${result.score}/100`,
    ""
  ];

  if (Object.keys(result.categoryScores).length > 0) {
    lines.push("Category Scores:");

    for (const [category, score] of Object.entries(result.categoryScores)) {
      lines.push(`  ${category}: ${score}/100`);
    }

    lines.push("");
  }

  lines.push("Checks:");

  for (const check of result.checks) {
    lines.push(renderCheck(check));
  }

  if (result.warnings.length > 0) {
    lines.push("");
    lines.push("Warnings:");

    for (const warning of result.warnings) {
      lines.push(`  - ${warning}`);
    }
  }

  return lines.join("\n");
}

export function renderScaffoldResult(result: ScaffoldProjectResult): string {
  const lines = [
    `Project: ${result.cwd}`,
    `Framework: ${result.framework.framework}`,
    ""
  ];

  lines.push("Operations:");

  for (const operation of result.operations) {
    lines.push(`  ${operation.status.toUpperCase()} ${operation.path}`);
    lines.push(`    ${operation.reason}`);
  }

  return lines.join("\n");
}

function renderCheck(check: CheckResult): string {
  return [
    `  [${check.status.toUpperCase()}] ${check.title}`,
    `    ${check.summary}`
  ].join("\n");
}
