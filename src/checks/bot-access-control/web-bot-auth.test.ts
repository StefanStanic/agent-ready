import { afterEach, describe, expect, it, vi } from "vitest";
import { checkWebBotAuth } from "./web-bot-auth";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("checkWebBotAuth", () => {
  it("passes with signed directory metadata and valid keys", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        response(
          JSON.stringify({
            keys: [
              {
                kid: "main",
                kty: "OKP",
                crv: "Ed25519",
                x: "abc"
              }
            ]
          }),
          "https://example.com/.well-known/http-message-signatures-directory",
          "application/http-message-signatures-directory+json",
          {
            signature: "sig",
            "signature-input": "sig1=()"
          }
        )
      )
    );

    const result = await checkWebBotAuth(new URL("https://example.com"));

    expect(result.status).toBe("pass");
    expect(result.evidence.keyCount).toBe(1);
    expect(result.evidence.hasExpectedContentType).toBe(true);
  });
});

function response(
  body: string,
  url: string,
  contentType: string,
  extraHeaders: Record<string, string>,
  status = 200
): Response {
  const result = new Response(body, {
    status,
    headers: {
      "content-type": contentType,
      ...extraHeaders
    }
  });

  vi.spyOn(result, "url", "get").mockReturnValue(url);
  return result;
}
