import type { CheckResult } from "../../core/types";

export async function checkMpp(baseUrl: URL): Promise<CheckResult> {
  return {
    id: "mpp",
    category: "commerce",
    title: "MPP (Merchant Payment Protocol)",
    status: "not_applicable",
    scoreWeight: 4,
    summary: "The site does not advertise MPP merchant payment protocol support.",
    evidence: {
      url: baseUrl.toString()
    },
    fixes: [
      "Support MPP if the site acts as a merchant or payment processor for agent-mediated transactions.",
      "Publish MPP metadata once the protocol specification is finalised."
    ],
    docs: ["https://mpp.dev"]
  };
}
