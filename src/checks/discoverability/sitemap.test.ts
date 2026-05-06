import { afterEach, describe, expect, it, vi } from "vitest";
import { checkSitemap } from "./sitemap";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("checkSitemap", () => {
  it("discovers a sitemap from robots.txt", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        response(
          "User-agent: *\nSitemap: https://example.com/custom-sitemap.xml\n",
          "https://example.com/robots.txt"
        )
      )
      .mockResolvedValueOnce(
        response(
          [
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
            "  <url><loc>https://example.com/</loc></url>",
            "</urlset>"
          ].join("\n"),
          "https://example.com/custom-sitemap.xml",
          "application/xml"
        )
      );

    vi.stubGlobal("fetch", fetchMock);

    const result = await checkSitemap(new URL("https://example.com"));

    expect(result.status).toBe("pass");
    expect(result.evidence.url).toBe("https://example.com/custom-sitemap.xml");
    expect(result.evidence.urlCount).toBe(1);
  });

  it("fails when no parseable sitemap can be found", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response("User-agent: *\n", "https://example.com/robots.txt"))
      .mockResolvedValue(response("not xml", "https://example.com/sitemap.xml", "text/plain", 404));

    vi.stubGlobal("fetch", fetchMock);

    const result = await checkSitemap(new URL("https://example.com"));

    expect(result.status).toBe("fail");
    expect(result.evidence.checkedPaths).toContain("/sitemap.xml");
  });
});

function response(
  body: string,
  url: string,
  contentType = "text/plain",
  status = 200
): Response {
  const result = new Response(body, {
    status,
    headers: {
      "content-type": contentType
    }
  });

  vi.spyOn(result, "url", "get").mockReturnValue(url);
  return result;
}
