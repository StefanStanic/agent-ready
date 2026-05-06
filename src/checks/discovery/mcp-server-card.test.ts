import { afterEach, describe, expect, it, vi } from "vitest";
import { checkMcpServerCard } from "./mcp-server-card";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("checkMcpServerCard", () => {
  it("passes with validated MCP server card fields", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        response(
          JSON.stringify({
            name: "example-mcp-server",
            url: "https://example.com",
            version: "1.0.0"
          }),
          "https://example.com/.well-known/mcp.json"
        )
      )
    );

    const result = await checkMcpServerCard(new URL("https://example.com"));

    expect(result.status).toBe("pass");
    expect(result.evidence.name).toBe("example-mcp-server");
    expect(result.evidence.version).toBe("1.0.0");
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
