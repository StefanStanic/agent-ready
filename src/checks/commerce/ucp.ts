import type { CheckResult } from "../../core/types";

export async function checkUcp(baseUrl: URL): Promise<CheckResult> {
  return {
    id: "ucp",
    category: "commerce",
    title: "UCP (Universal Commerce Protocol)",
    status: "not_applicable",
    scoreWeight: 4,
    summary: "The site does not advertise UCP universal commerce protocol support.",
    evidence: {
      url: baseUrl.toString()
    },
    fixes: [
      "Support UCP if the site enables agent-mediated purchases or commerce interactions.",
      "Publish UCP metadata once the protocol specification is stable."
    ],
    docs: ["https://ucp.dev/"]
  };
}
