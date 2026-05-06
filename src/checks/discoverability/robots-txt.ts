import type { CheckResult } from "../../core/types";
import { fetchText } from "../../utils/http";
import { parseRobotsTxt } from "../../utils/robots";

export async function checkRobotsTxt(baseUrl: URL): Promise<CheckResult> {
  const url = new URL("/robots.txt", baseUrl);

  try {
    const response = await fetchText(url.toString());
    const parsed = parseRobotsTxt(response.body);
    const hasSitemap = parsed.sitemapUrls.length > 0;
    const hasUserAgent = parsed.groups.some((group) => group.userAgents.length > 0);
    const hasAiSignals = parsed.contentSignals.length > 0;
    const status =
      response.status !== 200
        ? "fail"
        : parsed.isParseable && hasUserAgent
          ? "pass"
          : parsed.isParseable
            ? "warn"
            : "fail";

    return {
      id: "robots-txt",
      category: "discoverability",
      title: "robots.txt",
      status,
      scoreWeight: 5,
      summary:
        response.status !== 200
          ? "robots.txt is missing or inaccessible."
          : status === "pass"
            ? "robots.txt is present and parseable."
            : "robots.txt exists but does not expose strong crawler directives.",
      evidence: {
        url: response.url,
        status: response.status,
        contentType: response.headers.get("content-type"),
        hasSitemap,
        hasAiSignals,
        groupCount: parsed.groups.length,
        sitemapUrls: parsed.sitemapUrls,
        contentSignals: parsed.contentSignals,
        bodyPreview: response.body.slice(0, 200)
      },
      fixes: [
        "Publish /robots.txt.",
        "Add User-agent directives and a Sitemap line."
      ],
      docs: ["https://isitagentready.com/"]
    };
  } catch (error) {
    return {
      id: "robots-txt",
      category: "discoverability",
      title: "robots.txt",
      status: "error",
      scoreWeight: 5,
      summary: "robots.txt could not be fetched.",
      evidence: {
        url: url.toString(),
        error: error instanceof Error ? error.message : String(error)
      },
      fixes: ["Verify the site is reachable and serves /robots.txt."],
      docs: ["https://isitagentready.com/"]
    };
  }
}
