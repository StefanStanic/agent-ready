import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { scaffoldProject } from "./project";

const tempDirs: string[] = [];

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();

    if (dir) {
      rmSync(dir, { recursive: true, force: true });
    }
  }
});

describe("scaffoldProject", () => {
  it("creates TypeScript markdown scaffolding for Express", async () => {
    const cwd = createTempDir();

    const result = await scaffoldProject({
      cwd,
      framework: "express",
      features: ["markdown"]
    });

    const filePath = join(cwd, "agent-ready.markdown.ts");
    const contents = readFileSync(filePath, "utf8");

    expect(result.operations).toHaveLength(1);
    expect(result.operations[0]?.status).toBe("create");
    expect(contents).toContain("import type { Express } from 'express';");
    expect(contents).toContain("export function registerAgentReadyMarkdown(app: Express)");
  });

  it("supports dry runs without writing files", async () => {
    const cwd = createTempDir();

    const result = await scaffoldProject({
      cwd,
      framework: "next",
      features: ["markdown"],
      dryRun: true
    });

    expect(result.operations[0]?.status).toBe("create");
    expect(result.operations[0]?.path).toBe(join(cwd, "app", "llms.txt", "route.ts"));
  });

  it("creates framework-native well-known routes for Next.js", async () => {
    const cwd = createTempDir();

    await scaffoldProject({
      cwd,
      framework: "next",
      features: ["api-catalog", "mcp", "agent-card", "oauth-discovery", "oauth-protected-resource", "sitemap"]
    });

    expect(readFileSync(join(cwd, "app", "openapi.json", "route.ts"), "utf8")).toContain(
      "Example API"
    );
    expect(readFileSync(join(cwd, "app", ".well-known", "mcp.json", "route.ts"), "utf8")).toContain(
      "return Response.json(payload);"
    );
    expect(readFileSync(join(cwd, "app", ".well-known", "agent.json", "route.ts"), "utf8")).toContain(
      "example-agent"
    );
    expect(readFileSync(join(cwd, "app", "sitemap.ts"), "utf8")).toContain(
      "MetadataRoute.Sitemap"
    );
    expect(
      readFileSync(join(cwd, "app", ".well-known", "oauth-authorization-server", "route.ts"), "utf8")
    ).toContain("authorization_endpoint");
    expect(
      readFileSync(join(cwd, "app", ".well-known", "oauth-protected-resource", "route.ts"), "utf8")
    ).toContain("authorization_servers");
  });

  it("creates Astro markdown and well-known pages", async () => {
    const cwd = createTempDir();

    await scaffoldProject({
      cwd,
      framework: "astro",
      features: ["llms", "mcp"]
    });

    expect(readFileSync(join(cwd, "src", "pages", "llms.txt.ts"), "utf8")).toContain(
      "Content-Type': 'text/markdown; charset=utf-8'"
    );
    expect(readFileSync(join(cwd, "src", "pages", ".well-known", "mcp.json.ts"), "utf8")).toContain(
      "example-mcp-server"
    );
  });

  it("reports conflicts when an existing file differs from the scaffold", async () => {
    const cwd = createTempDir();
    const existingPath = join(cwd, "public", "robots.txt");

    mkdirSync(join(cwd, "public"), { recursive: true });
    writeFileSync(existingPath, "User-agent: *\nDisallow: /\n", "utf8");

    const result = await scaffoldProject({
      cwd,
      framework: "astro",
      features: ["robots"]
    });

    expect(result.operations[0]?.status).toBe("conflict");
    expect(result.operations[0]?.existingPreview).toContain("Disallow: /");
    expect(result.operations[0]?.generatedPreview).toContain("Content-Signal:");
  });

  it("uses the application preset when requested", async () => {
    const cwd = createTempDir();

    const result = await scaffoldProject({
      cwd,
      framework: "next",
      preset: "application"
    });

    const createdPaths = result.operations
      .filter((operation) => operation.status === "create")
      .map((operation) => operation.path);

    expect(createdPaths).toContain(join(cwd, "app", "openapi.json", "route.ts"));
    expect(createdPaths).toContain(
      join(cwd, "app", ".well-known", "oauth-authorization-server", "route.ts")
    );
  });

  it("creates Nuxt Nitro server routes for agent-ready endpoints", async () => {
    const cwd = createTempDir();

    await scaffoldProject({
      cwd,
      framework: "nuxt",
      features: [
        "api-catalog",
        "sitemap",
        "llms",
        "mcp",
        "agent-card",
        "oauth-discovery",
        "oauth-protected-resource"
      ]
    });

    expect(readFileSync(join(cwd, "server", "routes", "openapi.json.ts"), "utf8")).toContain(
      "defineEventHandler"
    );
    expect(readFileSync(join(cwd, "server", "routes", "openapi.json.ts"), "utf8")).toContain("Example API");
    expect(readFileSync(join(cwd, "server", "routes", "sitemap.xml.ts"), "utf8")).toContain(
      "defineEventHandler"
    );
    expect(readFileSync(join(cwd, "server", "routes", "llms.txt.ts"), "utf8")).toContain(
      "text/markdown"
    );
    expect(readFileSync(join(cwd, "server", "routes", ".well-known", "mcp.json.ts"), "utf8")).toContain(
      "example-mcp-server"
    );
    expect(
      readFileSync(join(cwd, "server", "routes", ".well-known", "agent.json.ts"), "utf8")
    ).toContain("example-agent");
    expect(
      readFileSync(
        join(cwd, "server", "routes", ".well-known", "oauth-authorization-server.ts"),
        "utf8"
      )
    ).toContain("authorization_endpoint");
    expect(
      readFileSync(
        join(cwd, "server", "routes", ".well-known", "oauth-protected-resource.ts"),
        "utf8"
      )
    ).toContain("authorization_servers");
  });

  it("creates Vite plugin scaffold for vite-react with all routes", async () => {
    const cwd = createTempDir();

    await scaffoldProject({
      cwd,
      framework: "vite-react",
      features: [
        "api-catalog",
        "mcp",
        "agent-card",
        "oauth-discovery",
        "oauth-protected-resource"
      ]
    });

    const pluginPath = join(cwd, "agent-ready.vite.ts");
    expect(readFileSync(pluginPath, "utf8")).toContain("agentReadyVitePlugin");
    expect(readFileSync(pluginPath, "utf8")).toContain("example-mcp-server");
    expect(readFileSync(pluginPath, "utf8")).toContain("authorization_endpoint");
    expect(readFileSync(pluginPath, "utf8")).toContain("configureServer");
  });

  it("creates Vite plugin scaffold for vite-vue with all routes", async () => {
    const cwd = createTempDir();

    await scaffoldProject({
      cwd,
      framework: "vite-vue",
      features: ["api-catalog"]
    });

    const pluginPath = join(cwd, "agent-ready.vite.ts");
    expect(readFileSync(pluginPath, "utf8")).toContain("agentReadyVitePlugin");
    expect(readFileSync(pluginPath, "utf8")).toContain("configureServer");
    expect(readFileSync(pluginPath, "utf8")).toContain("openapiPayload");
  });
});

function createTempDir(): string {
  const cwd = mkdtempSync(join(tmpdir(), "agent-ready-"));
  tempDirs.push(cwd);
  return cwd;
}
