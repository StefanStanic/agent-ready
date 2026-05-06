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
  },
  "link-headers": {
    id: "link-headers",
    category: "discoverability",
    title: "Link Headers",
    scoreWeight: 5,
    summary: "Checks the homepage Link header for machine-discovery signals.",
    fixes: [
      "Add meaningful Link headers for machine-readable resources.",
      "Use rel values that describe discovery endpoints."
    ],
    docs: ["https://isitagentready.com/"]
  },
  "ai-bot-rules": {
    id: "ai-bot-rules",
    category: "bot-access-control",
    title: "AI Bot Rules",
    scoreWeight: 6,
    summary: "Checks robots.txt for explicit AI crawler directives.",
    fixes: [
      "Add crawler-specific robots.txt groups for major AI bots.",
      "Document whether training, indexing, or access is allowed."
    ],
    docs: ["https://isitagentready.com/"]
  },
  "content-signals": {
    id: "content-signals",
    category: "bot-access-control",
    title: "Content Signals",
    scoreWeight: 7,
    summary: "Checks for Content-Signal directives in robots.txt or response headers.",
    fixes: [
      "Publish Content-Signal directives in robots.txt.",
      "Use supported keys like search, ai-input, and ai-train."
    ],
    docs: ["https://isitagentready.com/"]
  },
  "a2a-agent-card": {
    id: "a2a-agent-card",
    category: "discovery",
    title: "A2A Agent Card",
    scoreWeight: 6,
    summary: "Checks whether /.well-known/agent.json exists and is valid JSON.",
    fixes: ["Publish a valid A2A agent card at /.well-known/agent.json."],
    docs: ["https://isitagentready.com/"]
  },
  "api-catalog": {
    id: "api-catalog",
    category: "discovery",
    title: "API Catalog",
    scoreWeight: 8,
    summary: "Checks for an OpenAPI or Swagger document at common discovery paths.",
    fixes: ["Publish an OpenAPI or Swagger document for machine-readable API discovery."],
    docs: ["https://isitagentready.com/"]
  }
};

export function explainCheck(id: string): Omit<CheckResult, "status" | "evidence"> | null {
  return CHECK_EXPLANATIONS[id] ?? null;
}
