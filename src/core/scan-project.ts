import { existsSync, readFileSync } from "node:fs";
import { summarizeScores } from "./checks";
import type { CheckResult, ScanProjectOptions, ScanProjectResult } from "./types";
import { detectFramework } from "../frameworks/detect";
import { resolveFeatureCandidates, type ProjectFeature } from "../frameworks/conventions";
import { RESULT_SCHEMA_VERSION } from "./schema";
import { tryParseJson } from "../utils/json";
import { parseRobotsTxt } from "../utils/robots";
import { parseSitemapXml } from "../utils/sitemap";

export async function scanProject(options: ScanProjectOptions = {}): Promise<ScanProjectResult> {
  const cwd = options.cwd ?? process.cwd();
  const framework = detectFramework({ cwd });
  const checks: CheckResult[] = [
    projectFeatureCheck(cwd, framework.framework, {
      id: "api-catalog",
      feature: "api-catalog",
      title: "API Catalog",
      category: "discovery",
      scoreWeight: 8
    }),
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
    }),
    projectFeatureCheck(cwd, framework.framework, {
      id: "oauth-discovery",
      feature: "oauth-discovery",
      title: "OAuth Discovery",
      category: "discovery",
      scoreWeight: 5
    }),
    projectFeatureCheck(cwd, framework.framework, {
      id: "oauth-protected-resource",
      feature: "oauth-protected-resource",
      title: "OAuth Protected Resource",
      category: "discovery",
      scoreWeight: 5
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
    status: exists ? validateContents(matchedPath, input.feature) : "warn",
    scoreWeight: input.scoreWeight,
    summary: exists
      ? contentSummary(matchedPath, input.feature, input.title)
      : `${input.title} is missing from the expected framework paths.`,
    evidence: {
      candidates,
      matchedPath: matchedPath ?? null,
      exists,
      ...contentEvidence(matchedPath, input.feature)
    },
    fixes: exists
      ? contentFixes(matchedPath, input.feature)
      : [`Create ${input.title} in one of the expected framework paths.`],
    docs: ["https://isitagentready.com/"]
  };
}

function validateContents(filePath: string | undefined, feature: ProjectFeature): CheckResult["status"] {
  if (!filePath) {
    return "warn";
  }

  try {
    const raw = readFileSync(filePath, "utf8");

    switch (feature) {
      case "robots":
        return parseRobotsTxt(raw).isParseable ? "pass" : "warn";
      case "sitemap": {
        if (!filePath.endsWith(".xml")) {
          return "pass";
        }
        return parseSitemapXml(raw).urls.length > 0 || parseSitemapXml(raw).sitemapUrls.length > 0 ? "pass" : "warn";
      }
      case "api-catalog":
      case "mcp":
      case "agent-card":
      case "oauth-discovery":
      case "oauth-protected-resource": {
        if (!filePath.endsWith(".json")) {
          return "pass";
        }
        return tryParseJson(raw) !== null ? "pass" : "warn";
      }
      case "llms":
      case "markdown":
        return raw.trim().length > 0 ? "pass" : "warn";
      default:
        return "pass";
    }
  } catch {
    return "warn";
  }
}

function contentSummary(filePath: string | undefined, feature: ProjectFeature, title: string): string {
  if (!filePath) {
    return `${title} is missing from the expected framework paths.`;
  }

  try {
    const raw = readFileSync(filePath, "utf8");

    switch (feature) {
      case "robots": {
        const parsed = parseRobotsTxt(raw);
        return parsed.isParseable
          ? `${title} exists and is parseable (${parsed.groups.length} groups, ${parsed.sitemapUrls.length} sitemaps).`
          : `${title} exists but is not parseable.`;
      }
      case "sitemap": {
        if (!filePath.endsWith(".xml")) {
          return `${title} exists at a framework-appropriate path.`;
        }
        const parsed = parseSitemapXml(raw);
        return parsed.urls.length > 0 || parsed.sitemapUrls.length > 0
          ? `${title} exists and is parseable (${parsed.urls.length} URLs, ${parsed.sitemapUrls.length} nested).`
          : `${title} exists but appears empty or unparseable.`;
      }
      case "api-catalog":
      case "mcp":
      case "agent-card":
      case "oauth-discovery":
      case "oauth-protected-resource": {
        if (!filePath.endsWith(".json")) {
          return `${title} exists at a framework-appropriate path.`;
        }
        return tryParseJson(raw) !== null
          ? `${title} exists and contains valid JSON.`
          : `${title} exists but contains invalid JSON.`;
      }
      case "llms":
      case "markdown":
        return raw.trim().length > 0
          ? `${title} exists and contains content.`
          : `${title} exists but is empty.`;
      default:
        return `${title} exists at a framework-appropriate path.`;
    }
  } catch {
    return `${title} exists at a framework-appropriate path.`;
  }
}

function contentEvidence(filePath: string | undefined, feature: ProjectFeature): Record<string, unknown> {
  if (!filePath) {
    return {};
  }

  try {
    const raw = readFileSync(filePath, "utf8");

    switch (feature) {
      case "robots":
        return { contentLength: raw.length, preview: raw.slice(0, 200) };
      case "sitemap":
        return { contentLength: raw.length, preview: raw.slice(0, 200) };
      case "api-catalog":
      case "mcp":
      case "agent-card":
      case "oauth-discovery":
      case "oauth-protected-resource": {
        if (!filePath.endsWith(".json")) {
          return { contentLength: raw.length };
        }
        return { contentLength: raw.length, validJson: tryParseJson(raw) !== null };
      }
      case "llms":
      case "markdown":
        return { contentLength: raw.length, preview: raw.slice(0, 200) };
      default:
        return {};
    }
  } catch {
    return {};
  }
}

function contentFixes(filePath: string | undefined, feature: ProjectFeature): string[] {
  if (!filePath) {
    return [];
  }

  try {
    const raw = readFileSync(filePath, "utf8");

    switch (feature) {
      case "robots": {
        const parsed = parseRobotsTxt(raw);
        return parsed.isParseable ? [] : ["Ensure robots.txt contains valid crawler directives."];
      }
      case "sitemap": {
        const parsed = parseSitemapXml(raw);
        return parsed.urls.length > 0 || parsed.sitemapUrls.length > 0
          ? []
          : ["Ensure the sitemap contains at least one URL or nested sitemap reference."];
      }
      case "api-catalog":
      case "mcp":
      case "agent-card":
      case "oauth-discovery":
      case "oauth-protected-resource": {
        if (!filePath.endsWith(".json")) {
          return [];
        }
        return tryParseJson(raw) !== null ? [] : ["Fix the JSON syntax in this file."];
      }
      case "llms":
      case "markdown":
        return raw.trim().length > 0 ? [] : ["Add content to this file."];
      default:
        return [];
    }
  } catch {
    return [];
  }
}
