import type { CheckResult } from "../../core/types";
import { fetchText } from "../../utils/http";
import { parseRobotsTxt } from "../../utils/robots";
import { parseSitemapXml } from "../../utils/sitemap";

const CANDIDATE_PATHS = ["/sitemap.xml", "/sitemap_index.xml"];

export async function checkSitemap(baseUrl: URL): Promise<CheckResult> {
  const candidates = await collectSitemapCandidates(baseUrl);

  for (const path of candidates) {
    const url = new URL(path, baseUrl);

    try {
      const response = await fetchText(url.toString());
      const parsed = parseSitemapXml(response.body);

      if (response.status === 200 && parsed.isParseable) {
        return {
          id: "sitemap",
          category: "discoverability",
          title: "Sitemap",
          status: "pass",
          scoreWeight: 5,
          summary: "A sitemap was discovered and looks parseable.",
          evidence: {
            url: response.url,
            status: response.status,
            contentType: response.headers.get("content-type"),
            sitemapType: parsed.type,
            urlCount: parsed.urls.length,
            nestedSitemapCount: parsed.sitemapUrls.length,
            bodyPreview: response.body.slice(0, 200)
          },
          fixes: [],
          docs: ["https://isitagentready.com/"]
        };
      }
    } catch {
      continue;
    }
  }

  return {
    id: "sitemap",
    category: "discoverability",
    title: "Sitemap",
    status: "fail",
    scoreWeight: 5,
    summary: "No sitemap was discovered at common locations.",
    evidence: {
      checkedPaths: candidates
    },
    fixes: [
      "Publish /sitemap.xml.",
      "Reference the sitemap from robots.txt."
    ],
    docs: ["https://isitagentready.com/"]
  };
}

async function collectSitemapCandidates(baseUrl: URL): Promise<string[]> {
  const candidates = new Set(CANDIDATE_PATHS);

  try {
    const robotsUrl = new URL("/robots.txt", baseUrl);
    const response = await fetchText(robotsUrl.toString());

    if (response.status === 200) {
      const parsed = parseRobotsTxt(response.body);

      for (const sitemapUrl of parsed.sitemapUrls) {
        try {
          const resolved = new URL(sitemapUrl, baseUrl);
          candidates.add(resolved.pathname + resolved.search);
        } catch {
          continue;
        }
      }
    }
  } catch {
    return Array.from(candidates);
  }

  return Array.from(candidates);
}
