import type { CheckResult } from "../../core/types";
import { fetchText } from "../../utils/http";
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

      if (isOauthMetadata(parsed)) {
        return {
          id: "oauth-discovery",
          category: "discovery",
          title: "OAuth Discovery",
          status: "pass",
          scoreWeight: 5,
          summary: "OAuth authorization server metadata was discovered.",
          evidence: {
            url: url.toString(),
            issuer: parsed.issuer,
            authorizationEndpoint: parsed.authorization_endpoint,
            tokenEndpoint: parsed.token_endpoint
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

type OauthMetadata = {
  issuer: string;
  authorization_endpoint?: string;
  token_endpoint?: string;
};

function isOauthMetadata(input: unknown): input is OauthMetadata {
  if (!input || typeof input !== "object") {
    return false;
  }

  const value = input as Record<string, unknown>;
  return typeof value.issuer === "string";
}
