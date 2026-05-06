import type { CheckResult } from "../../core/types";
import { fetchText } from "../../utils/http";

const SUPPORTED_KEYS = ["search", "ai-input", "ai-train"];

export async function checkContentSignals(baseUrl: URL): Promise<CheckResult> {
  const robotsUrl = new URL("/robots.txt", baseUrl);

  try {
    const [robotsResponse, homeResponse] = await Promise.all([
      fetchText(robotsUrl.toString()),
      fetchText(baseUrl.toString())
    ]);
    const robotsSignals = extractContentSignals(robotsResponse.body);
    const headerSignal = homeResponse.headers.get("content-signal");
    const hasSignals = robotsSignals.length > 0 || Boolean(headerSignal);

    return {
      id: "content-signals",
      category: "bot-access-control",
      title: "Content Signals",
      status: hasSignals ? "pass" : "warn",
      scoreWeight: 7,
      summary: hasSignals
        ? "Content Signals were discovered."
        : "No explicit Content Signals were found.",
      evidence: {
        robotsUrl: robotsUrl.toString(),
        robotsStatus: robotsResponse.status,
        robotsSignals,
        headerSignal,
        supportedKeys: SUPPORTED_KEYS
      },
      fixes: [
        "Add Content-Signal directives in robots.txt when you want explicit AI content policy.",
        "Use supported keys such as search, ai-input, and ai-train."
      ],
      docs: ["https://isitagentready.com/"]
    };
  } catch (error) {
    return {
      id: "content-signals",
      category: "bot-access-control",
      title: "Content Signals",
      status: "error",
      scoreWeight: 7,
      summary: "The Content Signals check could not be completed.",
      evidence: {
        url: baseUrl.toString(),
        error: error instanceof Error ? error.message : String(error)
      },
      fixes: ["Verify the site is reachable."],
      docs: ["https://isitagentready.com/"]
    };
  }
}

export function extractContentSignals(input: string): string[] {
  const matches = input.match(/^content-signal:\s*(.+)$/gim) ?? [];

  return matches
    .flatMap((line) => line.split(":").slice(1).join(":").split(","))
    .map((value) => value.trim().toLowerCase())
    .map((value) => value.split("=")[0] ?? value)
    .filter((value) => SUPPORTED_KEYS.includes(value));
}
