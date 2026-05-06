import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { FrameworkName, ScaffoldFeature, ScaffoldOperation, ScaffoldProjectOptions, ScaffoldProjectResult } from "../core/types";
import { RESULT_SCHEMA_VERSION } from "../core/schema";
import { detectFramework } from "../frameworks/detect";
import { resolveStaticRoot } from "../frameworks/conventions";

type ScaffoldFile = {
  path: string;
  contents: string;
};

export async function scaffoldProject(
  options: ScaffoldProjectOptions = {}
): Promise<ScaffoldProjectResult> {
  const cwd = options.cwd ?? process.cwd();
  const detected = detectFramework({ cwd });
  const frameworkName = options.framework && options.framework !== "unknown"
    ? options.framework
    : detected.framework;
  const framework = {
    framework: frameworkName,
    confidence: options.framework ? 1 : detected.confidence,
    reasons: options.framework ? [`Framework forced to ${options.framework}.`] : detected.reasons
  };
  const preset = options.preset ?? defaultPresetForFramework(framework.framework);
  const features = options.features ?? featuresForPreset(preset);
  const operations: ScaffoldOperation[] = [];

  for (const feature of features) {
    const file = scaffoldFileForFeature(cwd, framework.framework, feature);

    if (!file) {
      operations.push({
        path: feature,
        status: "skip",
        reason: `Feature ${feature} is not supported for framework ${framework.framework}.`
      });
      continue;
    }

    if (existsSync(file.path)) {
      const existingContents = readFileSync(file.path, "utf8");

      if (existingContents === file.contents) {
        operations.push({
          path: file.path,
          status: "skip",
          reason: "File already exists and already matches the scaffold."
        });
        continue;
      }

      operations.push({
        existingPreview: preview(existingContents),
        generatedPreview: preview(file.contents),
        path: file.path,
        status: "conflict",
        reason: "File already exists and differs from the generated scaffold."
      });
      continue;
    }

    operations.push({
      path: file.path,
      status: "create",
      reason: "Scaffold file will be created."
    });

    if (!options.dryRun) {
      mkdirSync(dirname(file.path), { recursive: true });
      writeFileSync(file.path, file.contents, "utf8");
    }
  }

  return {
    cwd,
    framework,
    operations,
    schemaVersion: RESULT_SCHEMA_VERSION
  };
}

function defaultPresetForFramework(framework: FrameworkName): "content-site" | "application" {
  switch (framework) {
    case "express":
    case "hono":
      return "application";
    default:
      return "content-site";
  }
}

function featuresForPreset(
  preset: "content-site" | "application"
): ScaffoldFeature[] {
  switch (preset) {
    case "application":
      return [
        "api-catalog",
        "robots",
        "sitemap",
        "llms",
        "mcp",
        "agent-card",
        "oauth-discovery",
        "oauth-protected-resource"
      ];
    case "content-site":
      return ["robots", "sitemap", "llms", "mcp", "agent-card"];
  }
}

function scaffoldFileForFeature(
  cwd: string,
  framework: FrameworkName,
  feature: ScaffoldFeature
): ScaffoldFile | null {
  switch (feature) {
    case "api-catalog":
      return apiCatalogScaffold(cwd, framework);
    case "robots":
      return {
        path: join(resolveStaticRoot(cwd, framework), "robots.txt"),
        contents: [
          "User-agent: *",
          "Allow: /",
          "",
          "Content-Signal: search, ai-input",
          "",
          "Sitemap: https://example.com/sitemap.xml"
        ].join("\n")
      };
    case "sitemap":
      return sitemapScaffold(cwd, framework);
    case "llms":
      return llmsScaffold(cwd, framework);
    case "markdown":
      return markdownScaffold(cwd, framework);
    case "mcp":
      return wellKnownScaffold(cwd, framework, "mcp");
    case "agent-card":
      return wellKnownScaffold(cwd, framework, "agent-card");
    case "oauth-discovery":
      return oauthDiscoveryScaffold(cwd, framework);
    case "oauth-protected-resource":
      return oauthProtectedResourceScaffold(cwd, framework);
    default:
      return null;
  }
}

function apiCatalogScaffold(cwd: string, framework: FrameworkName): ScaffoldFile {
  const payload = JSON.stringify(
    {
      openapi: "3.1.0",
      info: {
        title: "Example API",
        version: "1.0.0"
      },
      paths: {
        "/health": {
          get: {
            summary: "Health check",
            responses: {
              "200": {
                description: "OK"
              }
            }
          }
        }
      }
    },
    null,
    2
  );

  switch (framework) {
    case "next":
      return {
        path: join(cwd, "app", "openapi.json", "route.ts"),
        contents: [
          "const payload = " + payload + ";",
          "",
          "export function GET() {",
          "  return Response.json(payload);",
          "}"
        ].join("\n")
      };
    case "astro":
      return {
        path: join(cwd, "src", "pages", "openapi.json.ts"),
        contents: [
          "const payload = " + payload + ";",
          "",
          "export function GET() {",
          "  return Response.json(payload);",
          "}"
        ].join("\n")
      };
    case "sveltekit":
      return {
        path: join(cwd, "src", "routes", "openapi.json", "+server.ts"),
        contents: [
          "const payload = " + payload + ";",
          "",
          "export function GET() {",
          "  return Response.json(payload);",
          "}"
        ].join("\n")
      };
    default:
      return {
        path: join(cwd, "openapi.json"),
        contents: payload
      };
  }
}

function sitemapScaffold(cwd: string, framework: FrameworkName): ScaffoldFile {
  switch (framework) {
    case "next":
      return {
        path: join(cwd, "app", "sitemap.ts"),
        contents: [
          "import type { MetadataRoute } from 'next';",
          "",
          "export default function sitemap(): MetadataRoute.Sitemap {",
          "  return [",
          "    {",
          "      url: 'https://example.com/',",
          "      changeFrequency: 'weekly',",
          "      priority: 1",
          "    }",
          "  ];",
          "}"
        ].join("\n")
      };
    case "astro":
      return {
        path: join(cwd, "public", "sitemap.xml"),
        contents: staticSitemapXml()
      };
    case "sveltekit":
      return {
        path: join(cwd, "src", "routes", "sitemap.xml", "+server.ts"),
        contents: [
          "export function GET() {",
          "  return new Response(",
          "    `<?xml version=\"1.0\" encoding=\"UTF-8\"?>",
          "<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">",
          "  <url><loc>https://example.com/</loc></url>",
          "</urlset>`,",
          "    {",
          "      headers: { 'Content-Type': 'application/xml; charset=utf-8' }",
          "    }",
          "  );",
          "}"
        ].join("\n")
      };
    default:
      return {
        path: join(resolveStaticRoot(cwd, framework), "sitemap.xml"),
        contents: staticSitemapXml()
      };
  }
}

function llmsScaffold(cwd: string, framework: FrameworkName): ScaffoldFile {
  switch (framework) {
    case "next":
      return markdownScaffold(cwd, framework)!;
    case "astro":
      return {
        path: join(cwd, "src", "pages", "llms.txt.ts"),
        contents: [
          "export function GET() {",
          "  return new Response('# Agent-ready site\\n\\n- Home: https://example.com/\\n', {",
          "    headers: {",
          "      'Content-Type': 'text/markdown; charset=utf-8',",
          "      'Vary': 'Accept'",
          "    }",
          "  });",
          "}"
        ].join("\n")
      };
    case "sveltekit":
      return {
        path: join(cwd, "src", "routes", "llms.txt", "+server.ts"),
        contents: [
          "export function GET() {",
          "  return new Response('# Agent-ready site\\n\\n- Home: https://example.com/\\n', {",
          "    headers: {",
          "      'Content-Type': 'text/markdown; charset=utf-8',",
          "      'Vary': 'Accept'",
          "    }",
          "  });",
          "}"
        ].join("\n")
      };
    default:
      return {
        path: join(resolveStaticRoot(cwd, framework), "llms.txt"),
        contents: ["# Agent-ready site", "", "- Home: https://example.com/"].join("\n")
      };
  }
}

function markdownScaffold(cwd: string, framework: FrameworkName): ScaffoldFile | null {
  switch (framework) {
    case "next":
      return {
        path: join(cwd, "app", "llms.txt", "route.ts"),
        contents: [
          "export function GET() {",
          "  return new Response('# Agent-ready site\\n\\n- Home: https://example.com/\\n', {",
          "    headers: {",
          "      'Content-Type': 'text/markdown; charset=utf-8',",
          "      'Vary': 'Accept'",
          "    }",
          "  });",
          "}"
        ].join("\n")
      };
    case "astro":
      return llmsScaffold(cwd, framework);
    case "sveltekit":
      return llmsScaffold(cwd, framework);
    case "express":
      return {
        path: join(cwd, "agent-ready.markdown.ts"),
        contents: [
          "import type { Express } from 'express';",
          "",
          "export function registerAgentReadyMarkdown(app: Express) {",
          "  app.get('/llms.txt', (_req, res) => {",
          "    res.type('text/markdown');",
          "    res.set('Vary', 'Accept');",
          "    res.send('# Agent-ready site\\n\\n- Home: https://example.com/\\n');",
          "  });",
          "}"
        ].join("\n")
      };
    case "hono":
      return {
        path: join(cwd, "agent-ready.markdown.ts"),
        contents: [
          "import type { Hono } from 'hono';",
          "",
          "export function registerAgentReadyMarkdown(app: Hono) {",
          "  app.get('/llms.txt', (c) => {",
          "    c.header('Content-Type', 'text/markdown; charset=utf-8');",
          "    c.header('Vary', 'Accept');",
          "    return c.body('# Agent-ready site\\n\\n- Home: https://example.com/\\n');",
          "  });",
          "}"
        ].join("\n")
      };
    default:
      return {
        path: join(resolveStaticRoot(cwd, framework), "llms.txt"),
        contents: "# Agent-ready site\n\n- Home: https://example.com/\n"
      };
  }
}

function wellKnownScaffold(
  cwd: string,
  framework: FrameworkName,
  feature: "mcp" | "agent-card"
): ScaffoldFile {
  const payload =
    feature === "mcp"
      ? JSON.stringify(
          {
            name: "example-mcp-server",
            description: "Machine-readable MCP server card.",
            url: "https://example.com",
            version: "0.1.0"
          },
          null,
          2
        )
      : JSON.stringify(
          {
            name: "example-agent",
            description: "Agent card placeholder.",
            url: "https://example.com"
          },
          null,
          2
        );

  const filename = feature === "mcp" ? "mcp.json" : "agent.json";

  switch (framework) {
    case "next":
      return {
        path: join(cwd, "app", ".well-known", filename, "route.ts"),
        contents: [
          "const payload = " + payload + ";",
          "",
          "export function GET() {",
          "  return Response.json(payload);",
          "}"
        ].join("\n")
      };
    case "astro":
      return {
        path: join(cwd, "src", "pages", ".well-known", `${filename}.ts`),
        contents: [
          "const payload = " + payload + ";",
          "",
          "export function GET() {",
          "  return Response.json(payload);",
          "}"
        ].join("\n")
      };
    case "sveltekit":
      return {
        path: join(cwd, "src", "routes", ".well-known", filename, "+server.ts"),
        contents: [
          "const payload = " + payload + ";",
          "",
          "export function GET() {",
          "  return Response.json(payload);",
          "}"
        ].join("\n")
      };
    default:
      return {
        path: join(resolveStaticRoot(cwd, framework), ".well-known", filename),
        contents: payload
      };
  }
}

function oauthDiscoveryScaffold(cwd: string, framework: FrameworkName): ScaffoldFile {
  const payload = JSON.stringify(
    {
      issuer: "https://example.com",
      authorization_endpoint: "https://example.com/oauth/authorize",
      token_endpoint: "https://example.com/oauth/token",
      jwks_uri: "https://example.com/.well-known/jwks.json"
    },
    null,
    2
  );

  return wellKnownJsonScaffold(cwd, framework, "oauth-authorization-server", payload);
}

function oauthProtectedResourceScaffold(cwd: string, framework: FrameworkName): ScaffoldFile {
  const payload = JSON.stringify(
    {
      resource: "https://api.example.com",
      authorization_servers: ["https://example.com"],
      scopes_supported: ["read"]
    },
    null,
    2
  );

  return wellKnownJsonScaffold(cwd, framework, "oauth-protected-resource", payload);
}

function wellKnownJsonScaffold(
  cwd: string,
  framework: FrameworkName,
  filename: "oauth-authorization-server" | "oauth-protected-resource",
  payload: string
): ScaffoldFile {
  switch (framework) {
    case "next":
      return {
        path: join(cwd, "app", ".well-known", filename, "route.ts"),
        contents: [
          "const payload = " + payload + ";",
          "",
          "export function GET() {",
          "  return Response.json(payload);",
          "}"
        ].join("\n")
      };
    case "astro":
      return {
        path: join(cwd, "src", "pages", ".well-known", `${filename}.ts`),
        contents: [
          "const payload = " + payload + ";",
          "",
          "export function GET() {",
          "  return Response.json(payload);",
          "}"
        ].join("\n")
      };
    case "sveltekit":
      return {
        path: join(cwd, "src", "routes", ".well-known", filename, "+server.ts"),
        contents: [
          "const payload = " + payload + ";",
          "",
          "export function GET() {",
          "  return Response.json(payload);",
          "}"
        ].join("\n")
      };
    default:
      return {
        path: join(resolveStaticRoot(cwd, framework), ".well-known", filename),
        contents: payload
      };
  }
}

function staticSitemapXml(): string {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    "  <url>",
    "    <loc>https://example.com/</loc>",
    "  </url>",
    "</urlset>"
  ].join("\n");
}

function preview(input: string): string {
  return input.split("\n").slice(0, 6).join("\n");
}
