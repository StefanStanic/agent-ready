import type { CheckResult } from "../../core/types";
import { validateA2aAgentCardDocument } from "../../utils/discovery-documents";
import { fetchText } from "../../utils/http";
import { tryParseJson } from "../../utils/json";

export async function checkA2aAgentCard(baseUrl: URL): Promise<CheckResult> {
  const url = new URL("/.well-known/agent.json", baseUrl);

  try {
    const response = await fetchText(url.toString());
    const parsed = tryParseJson(response.body);
    const validation = validateA2aAgentCardDocument(parsed);
    const pass = response.status === 200 && validation.data !== null;

    return {
      id: "a2a-agent-card",
      category: "discovery",
      title: "A2A Agent Card",
      status: pass ? "pass" : "fail",
      scoreWeight: 6,
      summary: pass
        ? "An A2A agent card was discovered."
        : "No valid A2A agent card was found.",
      evidence: {
        url: response.url,
        status: response.status,
        contentType: response.headers.get("content-type"),
        parsed: parsed !== null,
        name: validation.data?.name ?? null,
        description: validation.data?.description ?? null,
        cardUrl: validation.data?.url ?? null,
        validationErrors: validation.errors
      },
      fixes: ["Publish /.well-known/agent.json with valid JSON metadata."],
      docs: ["https://isitagentready.com/"]
    };
  } catch (error) {
    return {
      id: "a2a-agent-card",
      category: "discovery",
      title: "A2A Agent Card",
      status: "error",
      scoreWeight: 6,
      summary: "The A2A agent card check could not be completed.",
      evidence: {
        url: url.toString(),
        error: error instanceof Error ? error.message : String(error)
      },
      fixes: ["Verify the site is reachable and serves /.well-known/agent.json."],
      docs: ["https://isitagentready.com/"]
    };
  }
}
