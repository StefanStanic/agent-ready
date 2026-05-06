import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { FrameworkName, ScaffoldFeature, ScaffoldOperation, ScaffoldPlaceholders, ScaffoldProjectOptions, ScaffoldProjectResult } from "../core/types";
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
  const p = options.placeholders;
  const ph = {
    siteUrl: p?.siteUrl || "https://example.com",
    apiBaseUrl: p?.apiBaseUrl || "https://api.example.com",
    apiTitle: p?.apiTitle || "Example API",
    mcpServerName: p?.mcpServerName || "example-mcp-server",
    agentName: p?.agentName || "example-agent",
    oauthIssuer: p?.oauthIssuer || "https://example.com"
  };
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

    const resolved = applyPlaceholders(file, ph);

    if (existsSync(resolved.path)) {
      const existingContents = readFileSync(resolved.path, "utf8");

      if (existingContents === resolved.contents) {
        operations.push({
          path: resolved.path,
          status: "skip",
          reason: "File already exists and already matches the scaffold."
        });
        continue;
      }

      operations.push({
        existingPreview: preview(existingContents),
        generatedPreview: preview(resolved.contents),
        path: resolved.path,
        status: "conflict",
        reason: "File already exists and differs from the generated scaffold."
      });
      continue;
    }

    operations.push({
      path: resolved.path,
      status: "create",
      reason: "Scaffold file will be created."
    });

    if (!options.dryRun) {
      mkdirSync(dirname(resolved.path), { recursive: true });
      writeFileSync(resolved.path, resolved.contents, "utf8");
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
    case "nuxt":
      return {
        path: join(cwd, "server", "routes", "openapi.json.ts"),
        contents: [
          "const payload = " + payload + ";",
          "",
          "export default defineEventHandler(() => payload);",
          ""
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
    case "vite-react":
    case "vite-vue":
      return vitePluginScaffold(cwd);
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
    case "nuxt":
      return {
        path: join(cwd, "server", "routes", "sitemap.xml.ts"),
        contents: [
          "export default defineEventHandler((event) => {",
          "  setHeader(event, 'Content-Type', 'application/xml; charset=utf-8');",
          "  return `<?xml version=\"1.0\" encoding=\"UTF-8\"?>",
          "<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">",
          "  <url><loc>https://example.com/</loc></url>",
          "</urlset>`;",
          "});",
          ""
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
    case "nuxt":
      return {
        path: join(cwd, "server", "routes", "llms.txt.ts"),
        contents: [
          "export default defineEventHandler((event) => {",
          "  setHeader(event, 'Content-Type', 'text/markdown; charset=utf-8');",
          "  setHeader(event, 'Vary', 'Accept');",
          "  return '# Agent-ready site\\n\\n- Home: https://example.com/';",
          "});",
          ""
        ].join("\n")
      };
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
    case "nuxt":
      return llmsScaffold(cwd, framework);
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
    case "nuxt":
      return {
        path: join(cwd, "server", "routes", ".well-known", `${filename}.ts`),
        contents: [
          "const payload = " + payload + ";",
          "",
          "export default defineEventHandler(() => payload);",
          ""
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
    case "vite-react":
    case "vite-vue":
      return vitePluginScaffold(cwd);
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
    case "nuxt":
      return {
        path: join(cwd, "server", "routes", ".well-known", `${filename}.ts`),
        contents: [
          "const payload = " + payload + ";",
          "",
          "export default defineEventHandler(() => payload);",
          ""
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
    case "vite-react":
    case "vite-vue":
      return vitePluginScaffold(cwd);
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

function vitePluginScaffold(cwd: string): ScaffoldFile {
  return {
    path: join(cwd, "agent-ready.vite.ts"),
    contents: [
      "import type { Plugin } from 'vite';",
      "",
      "const openapiPayload = " + JSON.stringify({
        openapi: "3.1.0",
        info: { title: "Example API", version: "1.0.0" },
        paths: { "/health": { get: { summary: "Health check", responses: { "200": { description: "OK" } } } } }
      }) + ";",
      "",
      "const mcpPayload = " + JSON.stringify({
        name: "example-mcp-server",
        description: "Machine-readable MCP server card.",
        url: "https://example.com",
        version: "0.1.0"
      }) + ";",
      "",
      "const agentPayload = " + JSON.stringify({
        name: "example-agent",
        description: "Agent card placeholder.",
        url: "https://example.com"
      }) + ";",
      "",
      "const oauthServerPayload = " + JSON.stringify({
        issuer: "https://example.com",
        authorization_endpoint: "https://example.com/oauth/authorize",
        token_endpoint: "https://example.com/oauth/token",
        jwks_uri: "https://example.com/.well-known/jwks.json"
      }) + ";",
      "",
      "const oauthResourcePayload = " + JSON.stringify({
        resource: "https://api.example.com",
        authorization_servers: ["https://example.com"],
        scopes_supported: ["read"]
      }) + ";",
      "",
      "const routes: Record<string, unknown> = {",
      "  '/openapi.json': openapiPayload,",
      "  '/.well-known/mcp.json': mcpPayload,",
      "  '/.well-known/agent.json': agentPayload,",
      "  '/.well-known/oauth-authorization-server': oauthServerPayload,",
      "  '/.well-known/oauth-protected-resource': oauthResourcePayload",
      "};",
      "",
      "export function agentReadyVitePlugin(): Plugin {",
      "  return {",
      "    name: 'agent-ready',",
      "    configureServer(server) {",
      "      for (const [path, payload] of Object.entries(routes)) {",
      "        server.middlewares.use(path, (_req, res) => {",
      "          res.setHeader('Content-Type', 'application/json');",
      "          res.end(JSON.stringify(payload, null, 2));",
      "        });",
      "      }",
      "    }",
      "  };",
      "}",
      ""
    ].join("\n")
  };
}

function applyPlaceholders(
  file: ScaffoldFile,
  ph: { siteUrl: string; apiBaseUrl: string; apiTitle: string; mcpServerName: string; agentName: string; oauthIssuer: string }
): ScaffoldFile {
  let contents = file.contents
    .replaceAll("https://api.example.com", ph.apiBaseUrl)
    .replaceAll("https://example.com/oauth", `${ph.oauthIssuer}/oauth`)
    .replaceAll("https://example.com", ph.siteUrl)
    .replaceAll("Example API", ph.apiTitle)
    .replaceAll("example-mcp-server", ph.mcpServerName)
    .replaceAll("example-agent", ph.agentName);

  return { path: file.path, contents };
}

function preview(input: string): string {
  return input.split("\n").slice(0, 6).join("\n");
}
