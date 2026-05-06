import type { CheckResult } from "../../core/types";
import { fetchText } from "../../utils/http";

export async function checkMcpServerCard(baseUrl: URL): Promise<CheckResult> {
  const url = new URL("/.well-known/mcp.json", baseUrl);

  try {
    const response = await fetchText(url.toString());
    const body = response.body.trim();
    const isJson = (response.headers.get("content-type") ?? "").includes("json");
    let parsed = false;

    try {
      JSON.parse(body);
      parsed = true;
    } catch {
      parsed = false;
    }

    const pass = response.status === 200 && parsed;

    return {
      id: "mcp-server-card",
      category: "discovery",
      title: "MCP Server Card",
      status: pass ? "pass" : "fail",
      scoreWeight: 8,
      summary: pass
        ? "An MCP server card was discovered."
        : "No valid MCP server card was found.",
      evidence: {
        url: url.toString(),
        status: response.status,
        contentType: response.headers.get("content-type"),
        isJson,
        parsed,
        bodyPreview: body.slice(0, 200)
      },
      fixes: ["Publish /.well-known/mcp.json with valid JSON metadata."],
      docs: ["https://isitagentready.com/"]
    };
  } catch (error) {
    return {
      id: "mcp-server-card",
      category: "discovery",
      title: "MCP Server Card",
      status: "error",
      scoreWeight: 8,
      summary: "The MCP server card check could not be completed.",
      evidence: {
        url: url.toString(),
        error: error instanceof Error ? error.message : String(error)
      },
      fixes: ["Verify the site is reachable and serves /.well-known/mcp.json."],
      docs: ["https://isitagentready.com/"]
    };
  }
}
