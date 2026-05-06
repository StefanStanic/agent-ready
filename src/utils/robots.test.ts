import { describe, expect, it } from "vitest";
import { parseRobotsTxt } from "./robots";

describe("parseRobotsTxt", () => {
  it("parses groups, sitemap URLs, and content signals", () => {
    const parsed = parseRobotsTxt([
      "User-agent: *",
      "Allow: /",
      "Disallow: /private",
      "Sitemap: https://example.com/sitemap.xml",
      "Content-Signal: ai-input, search"
    ].join("\n"));

    expect(parsed.isParseable).toBe(true);
    expect(parsed.groups).toHaveLength(1);
    expect(parsed.groups[0]?.userAgents).toEqual(["*"]);
    expect(parsed.groups[0]?.allow).toEqual(["/"]);
    expect(parsed.groups[0]?.disallow).toEqual(["/private"]);
    expect(parsed.sitemapUrls).toEqual(["https://example.com/sitemap.xml"]);
    expect(parsed.contentSignals).toEqual(["ai-input", "search"]);
  });
});
