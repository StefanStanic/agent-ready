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
  },
  "web-bot-auth": {
    id: "web-bot-auth",
    category: "bot-access-control",
    title: "Web Bot Auth",
    scoreWeight: 7,
    summary: "Checks for signed HTTP Message Signatures directory metadata over HTTPS.",
    fixes: [
      "Publish /.well-known/http-message-signatures-directory with the expected content type.",
      "Sign the response and expose a valid keys array."
    ],
    docs: ["https://developers.cloudflare.com/bots/reference/bot-verification/web-bot-auth/"]
  },
  "agent-skills": {
    id: "agent-skills",
    category: "discovery",
    title: "Agent Skills",
    scoreWeight: 5,
    summary: "Checks machine-readable content for explicit agent skill references.",
    fixes: [
      "Publish llms.txt with an explicit Skills section.",
      "Document agent capabilities in machine-readable content."
    ],
    docs: ["https://isitagentready.com/"]
  },
  webmcp: {
    id: "webmcp",
    category: "discovery",
    title: "WebMCP",
    scoreWeight: 5,
    summary: "Checks HTML responses for explicit WebMCP capability markers.",
    fixes: [
      "Expose explicit WebMCP capability markers if supported.",
      "Document WebMCP support in linked machine-readable content."
    ],
    docs: ["https://isitagentready.com/"]
  }
};

export function explainCheck(id: string): Omit<CheckResult, "status" | "evidence"> | null {
  return CHECK_EXPLANATIONS[id] ?? null;
}
