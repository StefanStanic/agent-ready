import { afterEach, describe, expect, it, vi } from "vitest";
import { checkOauthDiscovery } from "./oauth-discovery";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("checkOauthDiscovery", () => {
  it("passes with validated issuer and endpoints", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        response(
          JSON.stringify({
            issuer: "https://example.com",
            authorization_endpoint: "https://example.com/oauth/authorize",
            token_endpoint: "https://example.com/oauth/token",
            scopes_supported: ["read", "write"]
          }),
          "https://example.com/.well-known/oauth-authorization-server"
        )
      )
    );

    const result = await checkOauthDiscovery(new URL("https://example.com"));

    expect(result.status).toBe("pass");
    expect(result.evidence.issuer).toBe("https://example.com");
    expect(result.evidence.scopesSupported).toEqual(["read", "write"]);
  });
});

function response(body: string, url: string, status = 200): Response {
  const result = new Response(body, {
    status,
    headers: {
      "content-type": "application/json"
    }
  });

  vi.spyOn(result, "url", "get").mockReturnValue(url);
  return result;
}
