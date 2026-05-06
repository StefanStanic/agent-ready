import type { CheckResult } from "../../core/types";
import { fetchText } from "../../utils/http";
import { validateOauthProtectedResourceDocument } from "../../utils/discovery-documents";
import { tryParseJson } from "../../utils/json";

export async function checkOauthProtectedResource(baseUrl: URL): Promise<CheckResult> {
  const url = new URL("/.well-known/oauth-protected-resource", baseUrl);

  try {
    const response = await fetchText(url.toString());

    if (response.status !== 200) {
      return {
        id: "oauth-protected-resource",
        category: "discovery",
        title: "OAuth Protected Resource",
        status: "not_applicable",
        scoreWeight: 5,
        summary: "No OAuth protected resource metadata was found.",
        evidence: {
          url: url.toString(),
          status: response.status
        },
        fixes: [
          "Publish /.well-known/oauth-protected-resource if this site exposes OAuth-protected APIs."
        ],
        docs: ["https://isitagentready.com/"]
      };
    }

    const parsed = tryParseJson(response.body);
    const validation = validateOauthProtectedResourceDocument(parsed);
    const pass = validation.data !== null;

    return {
      id: "oauth-protected-resource",
      category: "discovery",
      title: "OAuth Protected Resource",
      status: pass ? "pass" : "fail",
      scoreWeight: 5,
      summary: pass
        ? "OAuth protected resource metadata was discovered."
        : "The OAuth protected resource document is not valid.",
      evidence: {
        url: response.url,
        status: response.status,
        contentType: response.headers.get("content-type"),
        parsed: parsed !== null,
        resource: validation.data?.resource ?? null,
        authorizationServers: validation.data?.authorization_servers ?? [],
        scopesSupported: validation.data?.scopes_supported ?? [],
        validationErrors: validation.errors
      },
      fixes: ["Publish valid JSON at /.well-known/oauth-protected-resource."],
      docs: ["https://isitagentready.com/"]
    };
  } catch (error) {
    return {
      id: "oauth-protected-resource",
      category: "discovery",
      title: "OAuth Protected Resource",
      status: "error",
      scoreWeight: 5,
      summary: "The OAuth protected resource check could not be completed.",
      evidence: {
        url: url.toString(),
        error: error instanceof Error ? error.message : String(error)
      },
      fixes: ["Verify the site is reachable."],
      docs: ["https://isitagentready.com/"]
    };
  }
}
