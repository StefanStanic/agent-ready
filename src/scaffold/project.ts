import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { detectFramework } from "../frameworks/detect";
import type {
  FrameworkName,
  ScaffoldFeature,
  ScaffoldOperation,
  ScaffoldProjectOptions,
  ScaffoldProjectResult
} from "../core/types";

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
  const features = options.features ?? ["robots", "sitemap", "llms", "mcp"];
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
      operations.push({
        path: file.path,
        status: "skip",
        reason: "File already exists."
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
    operations
  };
}

function scaffoldFileForFeature(
  cwd: string,
  framework: FrameworkName,
  feature: ScaffoldFeature
): { path: string; contents: string } | null {
  switch (feature) {
    case "robots":
      return {
        path: staticPath(cwd, framework, "robots.txt"),
        contents: [
          "User-agent: *",
          "Allow: /",
          "",
          "Sitemap: https://example.com/sitemap.xml"
        ].join("\n")
      };
    case "sitemap":
      return {
        path: staticPath(cwd, framework, "sitemap.xml"),
        contents: [
          '<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
          "  <url>",
          "    <loc>https://example.com/</loc>",
          "  </url>",
          "</urlset>"
        ].join("\n")
      };
    case "llms":
      return {
        path: staticPath(cwd, framework, "llms.txt"),
        contents: ["# Agent-ready site", "", "- Home: https://example.com/"].join("\n")
      };
    case "mcp":
      return {
        path: staticPath(cwd, framework, ".well-known/mcp.json"),
        contents: JSON.stringify(
          {
            name: "example-mcp-server",
            description: "Machine-readable MCP server card.",
            url: "https://example.com",
            version: "0.1.0"
          },
          null,
          2
        )
      };
    case "agent-card":
      return {
        path: staticPath(cwd, framework, ".well-known/agent.json"),
        contents: JSON.stringify(
          {
            name: "example-agent",
            description: "Agent card placeholder."
          },
          null,
          2
        )
      };
    case "markdown":
      return markdownScaffold(cwd, framework);
    default:
      return null;
  }
}

function staticPath(cwd: string, framework: FrameworkName, relativePath: string): string {
  switch (framework) {
    case "next":
    case "nuxt":
    case "vite-react":
    case "vite-vue":
    case "astro":
      return join(cwd, "public", relativePath);
    case "sveltekit":
      return join(cwd, "static", relativePath);
    case "express":
    case "hono":
    case "unknown":
      return join(cwd, relativePath);
  }
}

function markdownScaffold(
  cwd: string,
  framework: FrameworkName
): { path: string; contents: string } | null {
  switch (framework) {
    case "next":
      return {
        path: join(cwd, "app", "llms.txt", "route.ts"),
        contents: [
          "export function GET() {",
          "  return new Response('# Agent-ready markdown output\\n', {",
          "    headers: {",
          "      'Content-Type': 'text/markdown; charset=utf-8',",
          "      'Vary': 'Accept'",
          "    }",
          "  });",
          "}"
        ].join("\n")
      };
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
          "    res.send('# Agent-ready markdown output\\n');",
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
          "    return c.body('# Agent-ready markdown output\\n');",
          "  });",
          "}"
        ].join("\n")
      };
    default:
      return {
        path: staticPath(cwd, framework, "llms.txt"),
        contents: "# Agent-ready markdown output\n"
      };
  }
}
