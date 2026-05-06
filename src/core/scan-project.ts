import { existsSync } from "node:fs";
import { join } from "node:path";
import { summarizeScores } from "./checks";
import type { CheckResult, ScanProjectOptions, ScanProjectResult } from "./types";
import { detectFramework } from "../frameworks/detect";

export async function scanProject(options: ScanProjectOptions = {}): Promise<ScanProjectResult> {
  const cwd = options.cwd ?? process.cwd();
  const framework = detectFramework({ cwd });
  const checks: CheckResult[] = [
    localFileCheck({
      id: "robots-txt",
      title: "robots.txt",
      category: "discoverability",
      scoreWeight: 5,
      expectedPath: resolveStaticPath(cwd, framework.framework, "robots.txt")
    }),
    localFileCheck({
      id: "mcp-server-card",
      title: "MCP Server Card",
      category: "discovery",
      scoreWeight: 8,
      expectedPath: resolveStaticPath(cwd, framework.framework, ".well-known/mcp.json")
    })
  ];
  const summary = summarizeScores(checks);

  return {
    target: cwd,
    cwd,
    mode: "project",
    framework,
    score: summary.score,
    categoryScores: summary.categoryScores,
    checks,
    warnings: framework.framework === "unknown" ? ["Framework was not detected."] : [],
    fileSignals: checks.map((check) => String(check.evidence.path))
  };
}

function resolveStaticPath(cwd: string, framework: string, relativePath: string): string {
  switch (framework) {
    case "next":
    case "nuxt":
    case "vite-react":
    case "vite-vue":
    case "astro":
      return join(cwd, "public", relativePath);
    case "sveltekit":
      return join(cwd, "static", relativePath);
    default:
      return join(cwd, relativePath);
  }
}

function localFileCheck(input: {
  id: string;
  title: string;
  category: CheckResult["category"];
  scoreWeight: number;
  expectedPath: string;
}): CheckResult {
  const exists = existsSync(input.expectedPath);

  return {
    id: input.id,
    title: input.title,
    category: input.category,
    status: exists ? "pass" : "warn",
    scoreWeight: input.scoreWeight,
    summary: exists
      ? `${input.title} exists at the expected path.`
      : `${input.title} is missing from the expected path.`,
    evidence: {
      path: input.expectedPath,
      exists
    },
    fixes: exists ? [] : [`Create ${input.expectedPath}.`],
    docs: ["https://isitagentready.com/"]
  };
}
