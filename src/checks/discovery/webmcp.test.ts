import { afterEach, describe, expect, it, vi } from "vitest";
import { checkWebMcp } from "./webmcp";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("checkWebMcp", () => {
  it("passes when HTML contains WebMCP markers", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        response(
          "<html><script>window.__webmcp__ = true;</script><div data-webmcp></div></html>",
          "https://example.com/",
          "text/html"
        )
      )
    );

    const result = await checkWebMcp(new URL("https://example.com"));

    expect(result.status).toBe("pass");
    expect(result.evidence.matches).toContain("window.__webmcp__");
  });
});

function response(body: string, url: string, contentType: string, status = 200): Response {
  const result = new Response(body, {
    status,
    headers: {
      "content-type": contentType
    }
  });

  vi.spyOn(result, "url", "get").mockReturnValue(url);
  return result;
}
