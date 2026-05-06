import type { CheckResult } from "../../core/types";
import { fetchText } from "../../utils/http";
import { validateOpenApiDocument } from "../../utils/discovery-documents";
import { tryParseJson } from "../../utils/json";

const CANDIDATE_PATHS = [
  "/openapi.json",
  "/openapi.yaml",
  "/openapi.yml",
  "/swagger.json",
  "/api/openapi.json",
  "/.well-known/openapi.json"
];

export async function checkApiCatalog(baseUrl: URL): Promise<CheckResult> {
  for (const path of CANDIDATE_PATHS) {
    const url = new URL(path, baseUrl);

    try {
      const response = await fetchText(url.toString());

      if (response.status !== 200) {
        continue;
      }

      const parsedJson = tryParseJson(response.body);
      const looksLikeYaml =
        /^openapi:\s*["']?\d/im.test(response.body) || /^swagger:\s*["']?\d/im.test(response.body);
      const jsonValidation = validateOpenApiDocument(parsedJson);

      if (jsonValidation.data || looksLikeYaml) {
        const pathCount =
          jsonValidation.data?.paths && typeof jsonValidation.data.paths === "object"
            ? Object.keys(jsonValidation.data.paths).length
            : null;

        return {
          id: "api-catalog",
          category: "discovery",
          title: "API Catalog",
          status: "pass",
          scoreWeight: 8,
          summary: "A machine-readable API description was discovered.",
          evidence: {
            url: response.url,
            status: response.status,
            contentType: response.headers.get("content-type"),
            format: jsonValidation.data ? "json" : "yaml",
            apiTitle: jsonValidation.data?.info?.title ?? null,
            apiVersion: jsonValidation.data?.info?.version ?? null,
            pathCount,
            validationErrors: jsonValidation.errors
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
    id: "api-catalog",
    category: "discovery",
    title: "API Catalog",
    status: "warn",
    scoreWeight: 8,
    summary: "No machine-readable API description was found at common locations.",
    evidence: {
      checkedPaths: CANDIDATE_PATHS
    },
    fixes: [
      "Publish an OpenAPI document such as /openapi.json or /swagger.json.",
      "Link to the API description from headers or documentation when available."
    ],
    docs: ["https://isitagentready.com/"]
  };
}
