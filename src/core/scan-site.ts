import { checkMarkdownNegotiation } from "../checks/content/markdown-negotiation";
import { checkMcpServerCard } from "../checks/discovery/mcp-server-card";
import { checkRobotsTxt } from "../checks/discoverability/robots-txt";
import { checkSitemap } from "../checks/discoverability/sitemap";
import { summarizeScores } from "./checks";
import type { ScanResult, ScanSiteOptions } from "./types";

export async function scanSite(options: ScanSiteOptions): Promise<ScanResult> {
  const baseUrl = new URL(options.url);
  const checks = await Promise.all([
    checkRobotsTxt(baseUrl),
    checkSitemap(baseUrl),
    checkMarkdownNegotiation(baseUrl),
    checkMcpServerCard(baseUrl)
  ]);
  const summary = summarizeScores(checks);

  return {
    target: baseUrl.toString(),
    mode: "site",
    score: summary.score,
    categoryScores: summary.categoryScores,
    checks,
    warnings: []
  };
}
