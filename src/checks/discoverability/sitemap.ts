import type { CheckResult } from "../../core/types";
import { fetchText } from "../../utils/http";

const CANDIDATE_PATHS = ["/sitemap.xml", "/sitemap_index.xml"];

export async function checkSitemap(baseUrl: URL): Promise<CheckResult> {
  for (const path of CANDIDATE_PATHS) {
    const url = new URL(path, baseUrl);

    try {
      const response = await fetchText(url.toString());

      if (response.status === 200 && response.body.includes("<urlset")) {
        return {
          id: "sitemap",
          category: "discoverability",
          title: "Sitemap",
          status: "pass",
          scoreWeight: 5,
          summary: "A sitemap was discovered and looks parseable.",
          evidence: {
            url: url.toString(),
            status: response.status,
            contentType: response.headers.get("content-type"),
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
      checkedPaths: CANDIDATE_PATHS
    },
    fixes: [
      "Publish /sitemap.xml.",
      "Reference the sitemap from robots.txt."
    ],
    docs: ["https://isitagentready.com/"]
  };
}
