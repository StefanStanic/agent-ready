import type { CheckResult } from "../../core/types";
import { fetchText } from "../../utils/http";

const SKILL_PATTERNS = [
  /^#{1,3}\s*skills\b/im,
  /^\s*skills\s*:/im,
  /\bagent skills\b/im,
  /\bskill\b/im,
  /\bmcp\b/im
];

export async function checkAgentSkills(baseUrl: URL): Promise<CheckResult> {
  const llmsUrl = new URL("/llms.txt", baseUrl);

  try {
    const [llmsResponse, homeResponse] = await Promise.all([
      fetchText(llmsUrl.toString()),
      fetchText(baseUrl.toString())
    ]);

    const llmsMatches = collectMatches(llmsResponse.body);
    const htmlMatches = collectMatches(homeResponse.body);
    const pass = llmsResponse.status === 200 && llmsMatches.length > 0;
    const warn = llmsResponse.status === 200 || htmlMatches.length > 0;

    return {
      id: "agent-skills",
      category: "discovery",
      title: "Agent Skills",
      status: pass ? "pass" : warn ? "warn" : "fail",
      scoreWeight: 5,
      summary: pass
        ? "Potential agent skill references were discovered."
        : warn
          ? "Machine-readable content exists, but explicit skill references were weak or absent."
          : "No agent skill references were discovered.",
      evidence: {
        llmsUrl: llmsResponse.url,
        llmsStatus: llmsResponse.status,
        llmsMatches,
        homepageUrl: homeResponse.url,
        htmlMatches,
        llmsPreview: llmsResponse.body.slice(0, 200)
      },
      fixes: [
        "Publish llms.txt with an explicit Skills section or agent capability references.",
        "Link agent skill docs or installation references from machine-readable content."
      ],
      docs: ["https://isitagentready.com/"]
    };
  } catch (error) {
    return {
      id: "agent-skills",
      category: "discovery",
      title: "Agent Skills",
      status: "error",
      scoreWeight: 5,
      summary: "The Agent Skills check could not be completed.",
      evidence: {
        url: baseUrl.toString(),
        error: error instanceof Error ? error.message : String(error)
      },
      fixes: ["Verify the site is reachable."],
      docs: ["https://isitagentready.com/"]
    };
  }
}

function collectMatches(input: string): string[] {
  return SKILL_PATTERNS.flatMap((pattern) => {
    const match = input.match(pattern);
    return match?.[0] ? [match[0].trim()] : [];
  });
}
