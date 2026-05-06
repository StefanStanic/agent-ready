import { afterEach, describe, expect, it, vi } from "vitest";
import { checkOauthProtectedResource } from "./oauth-protected-resource";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("checkOauthProtectedResource", () => {
  it("passes with validated protected resource metadata", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        response(
          JSON.stringify({
            resource: "https://api.example.com",
            authorization_servers: ["https://example.com"],
            scopes_supported: ["read"]
          }),
          "https://example.com/.well-known/oauth-protected-resource"
        )
      )
    );

    const result = await checkOauthProtectedResource(new URL("https://example.com"));

    expect(result.status).toBe("pass");
    expect(result.evidence.resource).toBe("https://api.example.com");
    expect(result.evidence.authorizationServers).toEqual(["https://example.com"]);
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
