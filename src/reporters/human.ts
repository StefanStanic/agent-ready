import type { CheckResult, ScanResult, ScaffoldProjectResult } from "../core/types";

export function renderScanResult(result: ScanResult): string {
  const lines = [
    `Schema Version: ${result.schemaVersion}`,
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
    `Schema Version: ${result.schemaVersion}`,
    `Project: ${result.cwd}`,
    `Framework: ${result.framework.framework}`,
    ""
  ];

  lines.push("Operations:");

  for (const operation of result.operations) {
    lines.push(`  ${operation.status.toUpperCase()} ${operation.path}`);
    lines.push(`    ${operation.reason}`);

    if (operation.status === "conflict") {
      if (operation.existingPreview) {
        lines.push("    Existing preview:");
        lines.push(indent(operation.existingPreview, 6));
      }

      if (operation.generatedPreview) {
        lines.push("    Generated preview:");
        lines.push(indent(operation.generatedPreview, 6));
      }
    }
  }

  return lines.join("\n");
}

function renderCheck(check: CheckResult): string {
  const lines = [
    `  [${check.status.toUpperCase()}] ${check.title}`,
    `    ${check.summary}`
  ];

  if (check.status !== "pass" && check.fixes.length > 0) {
    lines.push("    Suggested fixes:");

    for (const fix of check.fixes) {
      lines.push(`      - ${fix}`);
    }
  }

  return lines.join("\n");
}

function indent(input: string, spaces: number): string {
  const prefix = " ".repeat(spaces);
  return input
    .split("\n")
    .map((line) => `${prefix}${line}`)
    .join("\n");
}
