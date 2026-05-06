import { checkAiBotRules } from "../checks/bot-access-control/ai-bot-rules";
import { checkContentSignals } from "../checks/bot-access-control/content-signals";
import { checkWebBotAuth } from "../checks/bot-access-control/web-bot-auth";
import { checkMarkdownNegotiation } from "../checks/content/markdown-negotiation";
import { checkA2aAgentCard } from "../checks/discovery/a2a-agent-card";
import { checkAgentSkills } from "../checks/discovery/agent-skills";
import { checkApiCatalog } from "../checks/discovery/api-catalog";
import { checkMcpServerCard } from "../checks/discovery/mcp-server-card";
import { checkOauthDiscovery } from "../checks/discovery/oauth-discovery";
import { checkOauthProtectedResource } from "../checks/discovery/oauth-protected-resource";
import { checkWebMcp } from "../checks/discovery/webmcp";
import { checkLinkHeaders } from "../checks/discoverability/link-headers";
import { checkRobotsTxt } from "../checks/discoverability/robots-txt";
import { checkSitemap } from "../checks/discoverability/sitemap";
import { checkAcp } from "../checks/commerce/acp";
import { checkMpp } from "../checks/commerce/mpp";
import { checkUcp } from "../checks/commerce/ucp";
import { checkX402 } from "../checks/commerce/x402";
import { summarizeScores } from "./checks";
import { RESULT_SCHEMA_VERSION } from "./schema";
import type { ScanResult, ScanSiteOptions } from "./types";

export async function scanSite(options: ScanSiteOptions): Promise<ScanResult> {
  const baseUrl = new URL(options.url);
  const checks = await Promise.all([
    checkRobotsTxt(baseUrl),
    checkSitemap(baseUrl),
    checkLinkHeaders(baseUrl),
    checkMarkdownNegotiation(baseUrl),
    checkAiBotRules(baseUrl),
    checkContentSignals(baseUrl),
    checkWebBotAuth(baseUrl),
    checkApiCatalog(baseUrl),
    checkMcpServerCard(baseUrl),
    checkA2aAgentCard(baseUrl),
    checkAgentSkills(baseUrl),
    checkWebMcp(baseUrl),
    checkOauthDiscovery(baseUrl),
    checkOauthProtectedResource(baseUrl),
    checkX402(baseUrl),
    checkMpp(baseUrl),
    checkUcp(baseUrl),
    checkAcp(baseUrl)
  ]);
  const summary = summarizeScores(checks);

  return {
    schemaVersion: RESULT_SCHEMA_VERSION,
    target: baseUrl.toString(),
    mode: "site",
    score: summary.score,
    categoryScores: summary.categoryScores,
    checks,
    warnings: []
  };
}
