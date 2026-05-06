import { afterEach, describe, expect, it, vi } from "vitest";
import { checkLinkHeaders } from "./link-headers";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("checkLinkHeaders", () => {
  it("passes when useful machine-discovery links are present", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response("", {
        status: 200,
        headers: {
          link:
            '<https://example.com/llms.txt>; rel="alternate"; type="text/markdown", ' +
            '<https://example.com/openapi.json>; rel="service-desc"',
          "content-type": "text/html"
        }
      })
    );

    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(Response.prototype, "url", "get").mockReturnValue("https://example.com/");

    const result = await checkLinkHeaders(new URL("https://example.com"));

    expect(result.status).toBe("pass");
    expect(result.evidence.markdownAlternateCount).toBe(1);
  });

  it("warns when link headers exist but are not useful for discovery", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response("", {
        status: 200,
        headers: {
          link: '<https://example.com/assets/app.css>; rel="preload"',
          "content-type": "text/html"
        }
      })
    );

    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(Response.prototype, "url", "get").mockReturnValue("https://example.com/");

    const result = await checkLinkHeaders(new URL("https://example.com"));

    expect(result.status).toBe("warn");
  });
});
