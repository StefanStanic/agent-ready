import type { CheckResult } from "../../core/types";
import { fetchText } from "../../utils/http";

const WEBMCP_PATTERNS = [
  /webmcp/gi,
  /data-webmcp/gi,
  /window\.__webmcp__/gi,
  /mcp-browser|browser-rendering|remote-mcp/gi
];

export async function checkWebMcp(baseUrl: URL): Promise<CheckResult> {
  try {
    const response = await fetchText(baseUrl.toString());
    const matches = collectMatches(response.body);
    const contentType = response.headers.get("content-type") ?? "";
    const isHtml = contentType.includes("text/html");

    return {
      id: "webmcp",
      category: "discovery",
      title: "WebMCP",
      status: matches.length > 0 ? "pass" : isHtml ? "warn" : "not_applicable",
      scoreWeight: 5,
      summary:
        matches.length > 0
          ? "Potential WebMCP signals were discovered in the page response."
          : isHtml
            ? "No explicit WebMCP signals were discovered in the page response."
            : "The target does not appear to be an HTML page where WebMCP would apply.",
      evidence: {
        url: response.url,
        status: response.status,
        contentType,
        matches,
        bodyPreview: response.body.slice(0, 200)
      },
      fixes: [
        "Expose explicit WebMCP capability markers if the site supports browser-mediated MCP access.",
        "Document WebMCP support in HTML, docs, or linked machine-readable content."
      ],
      docs: ["https://isitagentready.com/"]
    };
  } catch (error) {
    return {
      id: "webmcp",
      category: "discovery",
      title: "WebMCP",
      status: "error",
      scoreWeight: 5,
      summary: "The WebMCP check could not be completed.",
      evidence: {
        url: baseUrl.toString(),
        error: error instanceof Error ? error.message : String(error)
      },
      fixes: ["Verify the site is reachable."],
      docs: ["https://isitagentready.com/"]
    };
  }
}

function collectMatches(input: string): string[] {
  const found = new Set<string>();

  for (const pattern of WEBMCP_PATTERNS) {
    const matches = input.match(pattern) ?? [];

    for (const match of matches) {
      found.add(match);
    }
  }

  return Array.from(found);
}
