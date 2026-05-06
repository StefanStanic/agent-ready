import type { CheckResult } from "../../core/types";
import { fetchText } from "../../utils/http";
import { tryParseJson } from "../../utils/json";
import { validateWebBotAuthDirectory } from "../../utils/web-bot-auth";

export async function checkWebBotAuth(baseUrl: URL): Promise<CheckResult> {
  const url = new URL("/.well-known/http-message-signatures-directory", baseUrl);

  try {
    const response = await fetchText(url.toString());
    const parsed = tryParseJson(response.body);
    const validation = validateWebBotAuthDirectory(parsed);
    const hasSignature = response.headers.has("signature");
    const hasSignatureInput = response.headers.has("signature-input");
    const isHttps = response.url.startsWith("https://");
    const contentType = response.headers.get("content-type") ?? "";
    const hasExpectedContentType = contentType.includes(
      "application/http-message-signatures-directory+json"
    );
    const pass =
      response.status === 200 &&
      validation.data !== null &&
      hasSignature &&
      hasSignatureInput &&
      isHttps &&
      hasExpectedContentType;

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
        url: response.url,
        status: response.status,
        contentType,
        isHttps,
        hasExpectedContentType,
        parsed: parsed !== null,
        hasSignature,
        hasSignatureInput,
        keyCount: validation.keyCount,
        validationErrors: validation.errors
      },
      fixes: [
        "Publish /.well-known/http-message-signatures-directory over HTTPS.",
        "Serve application/http-message-signatures-directory+json and include a valid keys array.",
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
