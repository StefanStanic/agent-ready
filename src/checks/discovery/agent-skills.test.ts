import { afterEach, describe, expect, it, vi } from "vitest";
import { checkAgentSkills } from "./agent-skills";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("checkAgentSkills", () => {
  it("passes when llms.txt contains a skills section", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn()
        .mockResolvedValueOnce(
          response("# Agent-ready\n\n## Skills\n- Search\n", "https://example.com/llms.txt", "text/markdown")
        )
        .mockResolvedValueOnce(response("<html></html>", "https://example.com/", "text/html"))
    );

    const result = await checkAgentSkills(new URL("https://example.com"));

    expect(result.status).toBe("pass");
    expect(result.evidence.llmsMatches).toContain("## Skills");
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
