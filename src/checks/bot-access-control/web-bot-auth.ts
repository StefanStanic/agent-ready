import type { CheckResult } from "../../core/types";
import { fetchText } from "../../utils/http";
import { tryParseJson } from "../../utils/json";

export async function checkWebBotAuth(baseUrl: URL): Promise<CheckResult> {
  const url = new URL("/.well-known/http-message-signatures-directory", baseUrl);

  try {
    const response = await fetchText(url.toString());
    const parsed = tryParseJson(response.body);
    const hasSignature = response.headers.has("signature");
    const hasSignatureInput = response.headers.has("signature-input");
    const isHttps = url.protocol === "https:";
    const pass = response.status === 200 && parsed !== null && hasSignature && hasSignatureInput && isHttps;

    return {
      id: "web-bot-auth",
      category: "bot-access-control",
      title: "Web Bot Auth",
      status: pass ? "pass" : response.status === 404 ? "warn" : "fail",
      scoreWeight: 7,
      summary: pass
        ? "Web Bot Auth directory metadata was discovered."
        : "Web Bot Auth could not be fully verified.",
      evidence: {
        url: url.toString(),
        status: response.status,
        contentType: response.headers.get("content-type"),
        isHttps,
        parsed: parsed !== null,
        hasSignature,
        hasSignatureInput
      },
      fixes: [
        "Publish /.well-known/http-message-signatures-directory over HTTPS.",
        "Sign the directory response and include Signature and Signature-Input headers."
      ],
      docs: ["https://developers.cloudflare.com/bots/reference/bot-verification/web-bot-auth/"]
    };
  } catch (error) {
    return {
      id: "web-bot-auth",
      category: "bot-access-control",
      title: "Web Bot Auth",
      status: "error",
      scoreWeight: 7,
      summary: "The Web Bot Auth check could not be completed.",
      evidence: {
        url: url.toString(),
        error: error instanceof Error ? error.message : String(error)
      },
      fixes: ["Verify the site is reachable."],
      docs: ["https://developers.cloudflare.com/bots/reference/bot-verification/web-bot-auth/"]
    };
  }
}
