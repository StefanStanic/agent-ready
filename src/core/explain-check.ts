import type { CheckResult } from "./types";

const CHECK_EXPLANATIONS: Record<string, Omit<CheckResult, "status" | "evidence">> = {
  "robots-txt": {
    id: "robots-txt",
    category: "discoverability",
    title: "robots.txt",
    scoreWeight: 5,
    summary: "Checks whether /robots.txt exists and contains meaningful crawler directives.",
    fixes: [
      "Publish /robots.txt with crawler rules and a Sitemap directive.",
      "Add explicit AI crawler guidance if you want machine-readable bot policy."
    ],
    docs: ["https://isitagentready.com/"]
  },
  sitemap: {
    id: "sitemap",
    category: "discoverability",
    title: "Sitemap",
    scoreWeight: 5,
    summary: "Checks whether a sitemap is discoverable and parseable.",
    fixes: [
      "Publish a sitemap.xml file or sitemap index.",
      "Reference the sitemap from robots.txt."
    ],
    docs: ["https://isitagentready.com/"]
  },
  "markdown-negotiation": {
    id: "markdown-negotiation",
    category: "content-accessibility",
    title: "Markdown Negotiation",
    scoreWeight: 8,
    summary: "Checks whether the site can return markdown when requested with Accept: text/markdown.",
    fixes: [
      "Add an endpoint or content negotiation path that returns markdown.",
      "Set Content-Type to text/markdown and include Vary: Accept."
    ],
    docs: ["https://developers.cloudflare.com/fundamentals/reference/markdown-for-agents/"]
  },
  "mcp-server-card": {
    id: "mcp-server-card",
    category: "discovery",
    title: "MCP Server Card",
    scoreWeight: 8,
    summary: "Checks whether /.well-known/mcp.json exists and is valid JSON.",
    fixes: [
      "Publish /.well-known/mcp.json with server metadata.",
      "Ensure the JSON contains useful machine discovery fields."
    ],
    docs: ["https://isitagentready.com/"]
  }
};

export function explainCheck(id: string): Omit<CheckResult, "status" | "evidence"> | null {
  return CHECK_EXPLANATIONS[id] ?? null;
}
