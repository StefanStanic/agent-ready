import { afterEach, describe, expect, it, vi } from "vitest";
import { checkA2aAgentCard } from "./a2a-agent-card";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("checkA2aAgentCard", () => {
  it("passes with validated A2A agent card fields", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        response(
          JSON.stringify({
            name: "example-agent",
            description: "Agent card",
            url: "https://example.com"
          }),
          "https://example.com/.well-known/agent.json"
        )
      )
    );

    const result = await checkA2aAgentCard(new URL("https://example.com"));

    expect(result.status).toBe("pass");
    expect(result.evidence.name).toBe("example-agent");
    expect(result.evidence.description).toBe("Agent card");
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
