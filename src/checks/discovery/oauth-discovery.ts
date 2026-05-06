import type { CheckResult } from "../../core/types";
import { fetchText } from "../../utils/http";
import { validateOauthDiscoveryDocument } from "../../utils/discovery-documents";
import { tryParseJson } from "../../utils/json";

const CANDIDATE_PATHS = [
  "/.well-known/oauth-authorization-server",
  "/.well-known/openid-configuration"
];

export async function checkOauthDiscovery(baseUrl: URL): Promise<CheckResult> {
  for (const path of CANDIDATE_PATHS) {
    const url = new URL(path, baseUrl);

    try {
      const response = await fetchText(url.toString());

      if (response.status !== 200) {
        continue;
      }

      const parsed = tryParseJson(response.body);
      const validation = validateOauthDiscoveryDocument(parsed);

      if (validation.data) {
        return {
          id: "oauth-discovery",
          category: "discovery",
          title: "OAuth Discovery",
          status: "pass",
          scoreWeight: 5,
          summary: "OAuth authorization server metadata was discovered.",
          evidence: {
            url: response.url,
            issuer: validation.data.issuer,
            authorizationEndpoint: validation.data.authorization_endpoint ?? null,
            tokenEndpoint: validation.data.token_endpoint ?? null,
            jwksUri: validation.data.jwks_uri ?? null,
            scopesSupported: validation.data.scopes_supported ?? []
          },
          fixes: [],
          docs: ["https://isitagentready.com/"]
        };
      }
    } catch {
      continue;
    }
  }

  return {
    id: "oauth-discovery",
    category: "discovery",
    title: "OAuth Discovery",
    status: "not_applicable",
    scoreWeight: 5,
    summary: "No OAuth discovery metadata was found.",
    evidence: {
      checkedPaths: CANDIDATE_PATHS
    },
    fixes: [
      "Publish OAuth authorization server metadata if this site exposes authenticated APIs.",
      "Use /.well-known/oauth-authorization-server or /.well-known/openid-configuration."
    ],
    docs: ["https://isitagentready.com/"]
  };
}
