import type { CheckResult } from "../../core/types";

export async function checkX402(baseUrl: URL): Promise<CheckResult> {
  return {
    id: "x402",
    category: "commerce",
    title: "x402 Payment Protocol",
    status: "not_applicable",
    scoreWeight: 4,
    summary: "The site does not advertise x402 payment protocol support.",
    evidence: {
      url: baseUrl.toString()
    },
    fixes: [
      "Support x402 payment protocol if the site sells API access or agent-mediated purchases.",
      "Publish x402 metadata at /.well-known/x402 when the protocol spec is stable."
    ],
    docs: ["https://www.x402.org/"]
  };
}
