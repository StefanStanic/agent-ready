import type { CheckResult } from "../../core/types";
import { fetchText } from "../../utils/http";

export async function checkMarkdownNegotiation(baseUrl: URL): Promise<CheckResult> {
  try {
    const response = await fetchText(baseUrl.toString(), {
      headers: {
        Accept: "text/markdown"
      }
    });

    const contentType = response.headers.get("content-type") ?? "";
    const isMarkdown = contentType.startsWith("text/markdown");

    return {
      id: "markdown-negotiation",
      category: "content-accessibility",
      title: "Markdown Negotiation",
      status: isMarkdown ? "pass" : "warn",
      scoreWeight: 8,
      summary: isMarkdown
        ? "The site returns markdown when requested."
        : "The site did not return markdown for Accept: text/markdown.",
      evidence: {
        url: baseUrl.toString(),
        status: response.status,
        contentType,
        vary: response.headers.get("vary"),
        bodyPreview: response.body.slice(0, 200)
      },
      fixes: [
        "Add markdown content negotiation or a markdown endpoint.",
        "Set Content-Type to text/markdown."
      ],
      docs: ["https://developers.cloudflare.com/fundamentals/reference/markdown-for-agents/"]
    };
  } catch (error) {
    return {
      id: "markdown-negotiation",
      category: "content-accessibility",
      title: "Markdown Negotiation",
      status: "error",
      scoreWeight: 8,
      summary: "The markdown negotiation check could not be completed.",
      evidence: {
        url: baseUrl.toString(),
        error: error instanceof Error ? error.message : String(error)
      },
      fixes: ["Verify the site is reachable."],
      docs: ["https://developers.cloudflare.com/fundamentals/reference/markdown-for-agents/"]
    };
  }
}
