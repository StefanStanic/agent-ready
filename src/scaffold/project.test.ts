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
      features: ["mcp", "agent-card", "sitemap"]
    });

    expect(readFileSync(join(cwd, "app", ".well-known", "mcp.json", "route.ts"), "utf8")).toContain(
      "return Response.json(payload);"
    );
    expect(readFileSync(join(cwd, "app", ".well-known", "agent.json", "route.ts"), "utf8")).toContain(
      "example-agent"
    );
    expect(readFileSync(join(cwd, "app", "sitemap.ts"), "utf8")).toContain(
      "MetadataRoute.Sitemap"
    );
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
});

function createTempDir(): string {
  const cwd = mkdtempSync(join(tmpdir(), "agent-ready-"));
  tempDirs.push(cwd);
  return cwd;
}
