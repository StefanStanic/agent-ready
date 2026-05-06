import { prompt } from "../utils/prompt";
import { scanProject } from "../core/scan-project";
import { renderScanResult } from "../reporters/human";
import type { ScaffoldPlaceholders } from "../core/types";

export async function interactiveWizard(
  cwd: string
): Promise<ScaffoldPlaceholders> {
  const scan = await scanProject({ cwd });

  console.log(renderScanResult(scan));
  console.log("");

  const missing = scan.checks.filter(
    (c) => c.status === "warn" || c.status === "fail"
  );
  const missingTitles = missing.map((c) => c.title);
  const missingIds = new Set(missing.map((c) => c.id));

  if (missingTitles.length > 0) {
    console.log(`Missing: ${missingTitles.join(", ")}`);
    console.log("");
  }

  console.log("Fill in your details (Enter = accept default):");
  console.log("");

  const siteUrl = await prompt("Site URL", "https://example.com");

  const apiBaseUrl =
    missingIds.has("api-catalog") || missingIds.has("oauth-protected-resource")
      ? await prompt("API base URL", "https://api.example.com")
      : undefined;

  const apiTitle = missingIds.has("api-catalog")
    ? await prompt("API title", "Example API")
    : undefined;

  const mcpServerName = missingIds.has("mcp-server-card")
    ? await prompt("MCP server name", "example-mcp-server")
    : undefined;

  const agentName = missingIds.has("a2a-agent-card")
    ? await prompt("Agent name", "example-agent")
    : undefined;

  const oauthIssuer =
    missingIds.has("oauth-discovery") || missingIds.has("oauth-protected-resource")
      ? await prompt("OAuth issuer URL", "https://example.com")
      : undefined;

  console.log("");
  return { siteUrl, apiBaseUrl, apiTitle, mcpServerName, agentName, oauthIssuer };
}
