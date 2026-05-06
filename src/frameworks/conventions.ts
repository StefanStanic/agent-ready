import { join } from "node:path";
import type { FrameworkName } from "../core/types";

export type ProjectFeature =
  | "robots"
  | "sitemap"
  | "llms"
  | "markdown"
  | "mcp"
  | "agent-card";

export function resolveFeatureCandidates(
  cwd: string,
  framework: FrameworkName,
  feature: ProjectFeature
): string[] {
  const staticRoot = resolveStaticRoot(cwd, framework);

  switch (feature) {
    case "robots":
      return [join(staticRoot, "robots.txt")];
    case "sitemap":
      return uniquePaths([
        join(staticRoot, "sitemap.xml"),
        ...nextSitemapCandidates(cwd, framework),
        ...astroSitemapCandidates(cwd, framework),
        ...svelteKitSitemapCandidates(cwd, framework)
      ]);
    case "llms":
      return uniquePaths([
        join(staticRoot, "llms.txt"),
        ...markdownRouteCandidates(cwd, framework)
      ]);
    case "markdown":
      return markdownRouteCandidates(cwd, framework);
    case "mcp":
      return uniquePaths([
        join(staticRoot, ".well-known", "mcp.json"),
        ...wellKnownRouteCandidates(cwd, framework, "mcp.json")
      ]);
    case "agent-card":
      return uniquePaths([
        join(staticRoot, ".well-known", "agent.json"),
        ...wellKnownRouteCandidates(cwd, framework, "agent.json")
      ]);
  }
}

export function resolveStaticRoot(cwd: string, framework: FrameworkName): string {
  switch (framework) {
    case "next":
    case "nuxt":
    case "vite-react":
    case "vite-vue":
    case "astro":
      return join(cwd, "public");
    case "sveltekit":
      return join(cwd, "static");
    case "express":
    case "hono":
    case "unknown":
      return cwd;
  }
}

function markdownRouteCandidates(cwd: string, framework: FrameworkName): string[] {
  switch (framework) {
    case "next":
      return [
        join(cwd, "app", "llms.txt", "route.ts"),
        join(cwd, "src", "app", "llms.txt", "route.ts")
      ];
    case "astro":
      return [join(cwd, "src", "pages", "llms.txt.ts")];
    case "sveltekit":
      return [join(cwd, "src", "routes", "llms.txt", "+server.ts")];
    case "express":
    case "hono":
      return [join(cwd, "agent-ready.markdown.ts")];
    default:
      return [];
  }
}

function wellKnownRouteCandidates(
  cwd: string,
  framework: FrameworkName,
  filename: "mcp.json" | "agent.json"
): string[] {
  switch (framework) {
    case "next":
      return [
        join(cwd, "app", ".well-known", filename, "route.ts"),
        join(cwd, "src", "app", ".well-known", filename, "route.ts")
      ];
    case "astro":
      return [join(cwd, "src", "pages", ".well-known", `${filename}.ts`)];
    case "sveltekit":
      return [join(cwd, "src", "routes", ".well-known", filename, "+server.ts")];
    default:
      return [];
  }
}

function nextSitemapCandidates(cwd: string, framework: FrameworkName): string[] {
  if (framework !== "next") {
    return [];
  }

  return [
    join(cwd, "app", "sitemap.ts"),
    join(cwd, "app", "sitemap.xml", "route.ts"),
    join(cwd, "src", "app", "sitemap.ts"),
    join(cwd, "src", "app", "sitemap.xml", "route.ts")
  ];
}

function astroSitemapCandidates(cwd: string, framework: FrameworkName): string[] {
  if (framework !== "astro") {
    return [];
  }

  return [
    join(cwd, "astro.config.mjs"),
    join(cwd, "astro.config.ts")
  ];
}

function svelteKitSitemapCandidates(cwd: string, framework: FrameworkName): string[] {
  if (framework !== "sveltekit") {
    return [];
  }

  return [join(cwd, "src", "routes", "sitemap.xml", "+server.ts")];
}

function uniquePaths(paths: string[]): string[] {
  return Array.from(new Set(paths));
}
