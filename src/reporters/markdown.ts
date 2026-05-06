import type { CheckResult, ScanResult, ScaffoldProjectResult } from "../core/types";

export function renderScanResultMarkdown(result: ScanResult): string {
  const lines = [
    `# Agent Readiness Report`,
    ``,
    `| Field | Value |`,
    `| ----- | ----- |`,
    `| Schema Version | ${result.schemaVersion} |`,
    `| Target | ${result.target} |`,
    `| Mode | ${result.mode} |`,
    `| Score | **${result.score}/100** |`,
    ``
  ];

  if (Object.keys(result.categoryScores).length > 0) {
    lines.push(`## Category Scores`);
    lines.push(``);
    lines.push(`| Category | Score |`);
    lines.push(`| -------- | ----- |`);

    for (const [category, score] of Object.entries(result.categoryScores)) {
      lines.push(`| ${category} | ${score}/100 |`);
    }

    lines.push(``);
  }

  lines.push(`## Checks`);
  lines.push(``);

  for (const check of result.checks) {
    lines.push(renderCheckMarkdown(check));
  }

  if (result.warnings.length > 0) {
    lines.push(`## Warnings`);
    lines.push(``);

    for (const warning of result.warnings) {
      lines.push(`- ${warning}`);
    }

    lines.push(``);
  }

  return lines.join("\n");
}

export function renderScaffoldResultMarkdown(result: ScaffoldProjectResult): string {
  const lines = [
    `# Scaffold Report`,
    ``,
    `| Field | Value |`,
    `| ----- | ----- |`,
    `| Schema Version | ${result.schemaVersion} |`,
    `| Project | ${result.cwd} |`,
    `| Framework | ${result.framework.framework} |`,
    ``
  ];

  lines.push(`## Operations`);
  lines.push(``);
  lines.push(`| Status | Path | Reason |`);
  lines.push(`| ------ | ---- | ------ |`);

  for (const operation of result.operations) {
    lines.push(`| ${operation.status} | \`${operation.path}\` | ${operation.reason} |`);
  }

  lines.push(``);

  for (const operation of result.operations) {
    if (operation.status === "conflict") {
      lines.push(`### Conflict: \`${operation.path}\``);
      lines.push(``);

      if (operation.existingPreview) {
        lines.push(`<details>`);
        lines.push(`<summary>Existing content</summary>`);
        lines.push(``);
        lines.push("```");
        lines.push(operation.existingPreview);
        lines.push("```");
        lines.push(``);
        lines.push(`</details>`);
        lines.push(``);
      }

      if (operation.generatedPreview) {
        lines.push(`<details>`);
        lines.push(`<summary>Generated content</summary>`);
        lines.push(``);
        lines.push("```");
        lines.push(operation.generatedPreview);
        lines.push("```");
        lines.push(``);
        lines.push(`</details>`);
        lines.push(``);
      }
    }
  }

  return lines.join("\n");
}

function renderCheckMarkdown(check: CheckResult): string {
  const statusIcon = check.status === "pass" ? "✅" : check.status === "warn" ? "⚠️" : "❌";
  const lines = [`### ${statusIcon} ${check.title}`, ``, `**Status:** ${check.status}`, `**Summary:** ${check.summary}`];

  if (Object.keys(check.evidence).length > 0) {
    lines.push(``);
    lines.push(`**Evidence:**`);
    lines.push(``);

    for (const [key, value] of Object.entries(check.evidence)) {
      lines.push(`- **${key}:** ${String(value)}`);
    }
  }

  if (check.status !== "pass" && check.fixes.length > 0) {
    lines.push(``);
    lines.push(`**Suggested fixes:**`);
    lines.push(``);

    for (const fix of check.fixes) {
      lines.push(`- ${fix}`);
    }
  }

  if (check.docs.length > 0) {
    lines.push(``);
    lines.push(`**Documentation:**`);
    lines.push(``);

    for (const doc of check.docs) {
      lines.push(`- ${doc}`);
    }
  }

  lines.push(``);
  return lines.join("\n");
}
