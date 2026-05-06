import { describe, expect, it } from "vitest";
import { parseSitemapXml } from "./sitemap";

describe("parseSitemapXml", () => {
  it("parses urlset sitemaps", () => {
    const parsed = parseSitemapXml([
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      "  <url><loc>https://example.com/</loc></url>",
      "</urlset>"
    ].join("\n"));

    expect(parsed.isParseable).toBe(true);
    expect(parsed.type).toBe("urlset");
    expect(parsed.urls).toEqual(["https://example.com/"]);
  });

  it("parses sitemap indexes", () => {
    const parsed = parseSitemapXml([
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      "  <sitemap><loc>https://example.com/sitemap-pages.xml</loc></sitemap>",
      "</sitemapindex>"
    ].join("\n"));

    expect(parsed.isParseable).toBe(true);
    expect(parsed.type).toBe("sitemapindex");
    expect(parsed.sitemapUrls).toEqual(["https://example.com/sitemap-pages.xml"]);
  });
});
