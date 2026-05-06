import type { CheckResult } from "../../core/types";
import { fetchText } from "../../utils/http";

export async function checkRobotsTxt(baseUrl: URL): Promise<CheckResult> {
  const url = new URL("/robots.txt", baseUrl);

  try {
    const response = await fetchText(url.toString());
    const hasSitemap = /^sitemap:/im.test(response.body);
    const hasUserAgent = /^user-agent:/im.test(response.body);

    return {
      id: "robots-txt",
      category: "discoverability",
      title: "robots.txt",
      status: response.status === 200 && hasUserAgent ? "pass" : "fail",
      scoreWeight: 5,
      summary:
        response.status === 200
          ? "robots.txt was fetched successfully."
          : "robots.txt is missing or inaccessible.",
      evidence: {
        url: url.toString(),
        status: response.status,
        contentType: response.headers.get("content-type"),
        hasSitemap,
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
