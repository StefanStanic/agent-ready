import type { CheckResult } from "../../core/types";
import { fetchText } from "../../utils/http";
import { parseLinkHeader } from "../../utils/link-header";

const USEFUL_RELS = new Set([
  "alternate",
  "service-desc",
  "describedby",
  "api-catalog",
  "authorization_server",
  "oauth-protected-resource"
]);

export async function checkLinkHeaders(baseUrl: URL): Promise<CheckResult> {
  try {
    const response = await fetchText(baseUrl.toString());
    const rawHeader = response.headers.get("link") ?? "";
    const links = parseLinkHeader(rawHeader);
    const usefulLinks = links.filter((link) => link.rels.some((rel) => USEFUL_RELS.has(rel)));
    const markdownAlternates = usefulLinks.filter(
      (link) => link.rels.includes("alternate") && link.attributes.type === "text/markdown"
    );

    return {
      id: "link-headers",
      category: "discoverability",
      title: "Link Headers",
      status: usefulLinks.length > 0 ? "pass" : rawHeader ? "warn" : "fail",
      scoreWeight: 5,
      summary:
        usefulLinks.length > 0
          ? "Useful Link headers were discovered on the homepage."
          : rawHeader
            ? "Link headers exist, but they do not expose strong discovery signals."
            : "No Link headers were found on the homepage.",
      evidence: {
        url: response.url,
        status: response.status,
        linkHeader: rawHeader,
        linkCount: links.length,
        markdownAlternateCount: markdownAlternates.length,
        usefulLinks: usefulLinks.map((link) => ({
          url: link.url,
          rels: link.rels,
          type: link.attributes.type ?? null
        }))
      },
      fixes: [
        "Add Link headers for machine-discovery endpoints where appropriate.",
        "Use rel values such as alternate or service-desc when they describe real machine-readable resources."
      ],
      docs: ["https://isitagentready.com/"]
    };
  } catch (error) {
    return {
      id: "link-headers",
      category: "discoverability",
      title: "Link Headers",
      status: "error",
      scoreWeight: 5,
      summary: "The Link header check could not be completed.",
      evidence: {
        url: baseUrl.toString(),
        error: error instanceof Error ? error.message : String(error)
      },
      fixes: ["Verify the site is reachable."],
      docs: ["https://isitagentready.com/"]
    };
  }
}
