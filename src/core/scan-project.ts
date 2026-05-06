import { existsSync } from "node:fs";
import { summarizeScores } from "./checks";
import type { CheckResult, ScanProjectOptions, ScanProjectResult } from "./types";
import { detectFramework } from "../frameworks/detect";
import { resolveFeatureCandidates, type ProjectFeature } from "../frameworks/conventions";
import { RESULT_SCHEMA_VERSION } from "./schema";

export async function scanProject(options: ScanProjectOptions = {}): Promise<ScanProjectResult> {
  const cwd = options.cwd ?? process.cwd();
  const framework = detectFramework({ cwd });
  const checks: CheckResult[] = [
    projectFeatureCheck(cwd, framework.framework, {
      id: "robots-txt",
      feature: "robots",
      title: "robots.txt",
      category: "discoverability",
      scoreWeight: 5
    }),
    projectFeatureCheck(cwd, framework.framework, {
      id: "sitemap",
      feature: "sitemap",
      title: "Sitemap",
      category: "discoverability",
      scoreWeight: 5
    }),
    projectFeatureCheck(cwd, framework.framework, {
      id: "llms-txt",
      feature: "llms",
      title: "llms.txt",
      category: "content-accessibility",
      scoreWeight: 5
    }),
    projectFeatureCheck(cwd, framework.framework, {
      id: "markdown-route",
      feature: "markdown",
      title: "Markdown Route Support",
      category: "content-accessibility",
      scoreWeight: 5,
      emptyCandidatesStatus: "not_applicable"
    }),
    projectFeatureCheck(cwd, framework.framework, {
      id: "mcp-server-card",
      feature: "mcp",
      title: "MCP Server Card",
      category: "discovery",
      scoreWeight: 8
    }),
    projectFeatureCheck(cwd, framework.framework, {
      id: "a2a-agent-card",
      feature: "agent-card",
      title: "A2A Agent Card",
      category: "discovery",
      scoreWeight: 6
    })
  ];
  const summary = summarizeScores(checks);

  return {
    schemaVersion: RESULT_SCHEMA_VERSION,
    target: cwd,
    cwd,
    mode: "project",
    framework,
    score: summary.score,
    categoryScores: summary.categoryScores,
    checks,
    warnings: framework.framework === "unknown" ? ["Framework was not detected."] : [],
    fileSignals: checks.flatMap((check) => {
      const candidates = check.evidence.candidates;
      return Array.isArray(candidates) ? candidates.map(String) : [];
    })
  };
}

function projectFeatureCheck(
  cwd: string,
  framework: ScanProjectResult["framework"]["framework"],
  input: {
  id: string;
  feature: ProjectFeature;
  title: string;
  category: CheckResult["category"];
  scoreWeight: number;
  emptyCandidatesStatus?: CheckResult["status"];
}): CheckResult {
  const candidates = resolveFeatureCandidates(cwd, framework, input.feature);
  const matchedPath = candidates.find((candidate) => existsSync(candidate));
  const exists = Boolean(matchedPath);

  if (candidates.length === 0) {
    return {
      id: input.id,
      title: input.title,
      category: input.category,
      status: input.emptyCandidatesStatus ?? "warn",
      scoreWeight: input.scoreWeight,
      summary: `${input.title} is not mapped for framework ${framework}.`,
      evidence: {
        candidates: [],
        matchedPath: null,
        exists: false
      },
      fixes: [`Add ${input.title} support rules for framework ${framework}.`],
      docs: ["https://isitagentready.com/"]
    };
  }

  return {
    id: input.id,
    title: input.title,
    category: input.category,
    status: exists ? "pass" : "warn",
    scoreWeight: input.scoreWeight,
    summary: exists
      ? `${input.title} exists at a framework-appropriate path.`
      : `${input.title} is missing from the expected framework paths.`,
    evidence: {
      candidates,
      matchedPath: matchedPath ?? null,
      exists
    },
    fixes: exists ? [] : [`Create ${input.title} in one of the expected framework paths.`],
    docs: ["https://isitagentready.com/"]
  };
}
