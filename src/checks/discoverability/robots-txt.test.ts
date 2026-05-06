import { afterEach, describe, expect, it, vi } from "vitest";
import { checkRobotsTxt } from "./robots-txt";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("checkRobotsTxt", () => {
  it("passes when robots.txt contains parseable crawler directives", async () => {
    mockFetchOnce({
      body: [
        "User-agent: *",
        "Allow: /",
        "Sitemap: https://example.com/sitemap.xml",
        "Content-Signal: ai-input"
      ].join("\n"),
      contentType: "text/plain",
      url: "https://example.com/robots.txt"
    });

    const result = await checkRobotsTxt(new URL("https://example.com"));

    expect(result.status).toBe("pass");
    expect(result.evidence.hasSitemap).toBe(true);
    expect(result.evidence.hasAiSignals).toBe(true);
  });

  it("warns when robots.txt exists but lacks user-agent groups", async () => {
    mockFetchOnce({
      body: "Sitemap: https://example.com/sitemap.xml",
      contentType: "text/plain",
      url: "https://example.com/robots.txt"
    });

    const result = await checkRobotsTxt(new URL("https://example.com"));

    expect(result.status).toBe("warn");
  });
});

function mockFetchOnce(input: {
  body: string;
  contentType: string;
  status?: number;
  url: string;
}): void {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      new Response(input.body, {
        status: input.status ?? 200,
        headers: {
          "content-type": input.contentType
        }
      })
    )
  );
  vi.spyOn(Response.prototype, "url", "get").mockReturnValue(input.url);
}
