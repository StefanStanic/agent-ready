import type { CheckResult } from "../../core/types";
import { fetchText } from "../../utils/http";

const KNOWN_AI_CRAWLERS = [
  "GPTBot",
  "ChatGPT-User",
  "ClaudeBot",
  "CCBot",
  "Google-Extended",
  "PerplexityBot",
  "Amazonbot",
  "Bytespider"
];

export async function checkAiBotRules(baseUrl: URL): Promise<CheckResult> {
  const url = new URL("/robots.txt", baseUrl);

  try {
    const response = await fetchText(url.toString());
    const body = response.body;
    const matchedAgents = KNOWN_AI_CRAWLERS.filter((crawler) =>
      new RegExp(`^user-agent:\\s*${escapeRegExp(crawler)}\\s*$`, "im").test(body)
    );
    const hasWildcardGroup = /^user-agent:\s*\*\s*$/im.test(body);

    return {
      id: "ai-bot-rules",
      category: "bot-access-control",
      title: "AI Bot Rules",
      status:
        response.status !== 200
          ? "fail"
          : matchedAgents.length > 0
            ? "pass"
            : hasWildcardGroup
              ? "warn"
              : "warn",
      scoreWeight: 6,
      summary:
        response.status !== 200
          ? "robots.txt is not available, so AI crawler directives cannot be verified."
          : matchedAgents.length > 0
            ? "Explicit AI crawler directives were found in robots.txt."
            : "robots.txt exists, but explicit AI crawler directives were not found.",
      evidence: {
        url: url.toString(),
        status: response.status,
        matchedAgents,
        hasWildcardGroup
      },
      fixes: [
        "Add explicit robots.txt directives for the AI crawlers you want to allow or disallow.",
        "Keep a wildcard group as a fallback, but use crawler-specific groups when policy matters."
      ],
      docs: ["https://isitagentready.com/"]
    };
  } catch (error) {
    return {
      id: "ai-bot-rules",
      category: "bot-access-control",
      title: "AI Bot Rules",
      status: "error",
      scoreWeight: 6,
      summary: "The AI bot rules check could not be completed.",
      evidence: {
        url: url.toString(),
        error: error instanceof Error ? error.message : String(error)
      },
      fixes: ["Verify the site is reachable and serves /robots.txt."],
      docs: ["https://isitagentready.com/"]
    };
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
