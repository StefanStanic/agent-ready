import type { CheckResult } from "../../core/types";

export async function checkAcp(baseUrl: URL): Promise<CheckResult> {
  return {
    id: "acp",
    category: "commerce",
    title: "ACP (Agentic Commerce Protocol)",
    status: "not_applicable",
    scoreWeight: 3,
    summary: "The site does not advertise ACP agentic commerce protocol support.",
    evidence: {
      url: baseUrl.toString()
    },
    fixes: [
      "Support ACP if the site enables agent-to-agent commerce transactions.",
      "Publish ACP metadata once the protocol specification is stable."
    ],
    docs: ["https://agenticcommerce.dev"]
  };
}
