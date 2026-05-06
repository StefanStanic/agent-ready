import { afterEach, describe, expect, it, vi } from "vitest";
import { checkApiCatalog } from "./api-catalog";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("checkApiCatalog", () => {
  it("passes with validated OpenAPI metadata and path counts", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        response(
          JSON.stringify({
            openapi: "3.1.0",
            info: {
              title: "Example API",
              version: "1.0.0"
            },
            paths: {
              "/ping": {}
            }
          }),
          "https://example.com/openapi.json",
          "application/json"
        )
      );

    vi.stubGlobal("fetch", fetchMock);

    const result = await checkApiCatalog(new URL("https://example.com"));

    expect(result.status).toBe("pass");
    expect(result.evidence.apiTitle).toBe("Example API");
    expect(result.evidence.pathCount).toBe(1);
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
