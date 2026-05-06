import { cpSync, existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { detectFramework, scaffoldProject, scanProject } from "../index";
import type { FrameworkName, ScaffoldFeature } from "../core/types";

const tempDirs: string[] = [];

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir) {
      rmSync(dir, { recursive: true, force: true });
    }
  }
});

type ExampleCase = {
  framework: FrameworkName;
  dirname: string;
  expectedFiles: string[];
  expectedScoreThreshold: number;
};

const cases: ExampleCase[] = [
  {
    framework: "next",
    dirname: "next",
    expectedFiles: [
      "app/openapi.json/route.ts",
      "app/sitemap.ts",
      "app/llms.txt/route.ts",
      "app/.well-known/mcp.json/route.ts",
      "app/.well-known/agent.json/route.ts",
      "app/.well-known/oauth-authorization-server/route.ts",
      "app/.well-known/oauth-protected-resource/route.ts",
      "public/robots.txt"
    ],
    expectedScoreThreshold: 40
  },
  {
    framework: "nuxt",
    dirname: "nuxt",
    expectedFiles: [
      "server/routes/openapi.json.ts",
      "server/routes/sitemap.xml.ts",
      "server/routes/llms.txt.ts",
      "server/routes/.well-known/mcp.json.ts",
      "server/routes/.well-known/agent.json.ts",
      "server/routes/.well-known/oauth-authorization-server.ts",
      "server/routes/.well-known/oauth-protected-resource.ts",
      "public/robots.txt"
    ],
    expectedScoreThreshold: 40
  },
  {
    framework: "astro",
    dirname: "astro",
    expectedFiles: [
      "src/pages/openapi.json.ts",
      "src/pages/llms.txt.ts",
      "src/pages/.well-known/mcp.json.ts",
      "src/pages/.well-known/agent.json.ts",
      "src/pages/.well-known/oauth-authorization-server.ts",
      "src/pages/.well-known/oauth-protected-resource.ts",
      "public/sitemap.xml",
      "public/robots.txt"
    ],
    expectedScoreThreshold: 40
  },
  {
    framework: "sveltekit",
    dirname: "sveltekit",
    expectedFiles: [
      "src/routes/openapi.json/+server.ts",
      "src/routes/sitemap.xml/+server.ts",
      "src/routes/llms.txt/+server.ts",
      "src/routes/.well-known/mcp.json/+server.ts",
      "src/routes/.well-known/agent.json/+server.ts",
      "src/routes/.well-known/oauth-authorization-server/+server.ts",
      "src/routes/.well-known/oauth-protected-resource/+server.ts",
      "static/robots.txt"
    ],
    expectedScoreThreshold: 40
  },
  {
    framework: "vite-react",
    dirname: "vite-react",
    expectedFiles: [
      "agent-ready.vite.ts",
      "public/robots.txt",
      "public/sitemap.xml",
      "public/llms.txt"
    ],
    expectedScoreThreshold: 30
  },
  {
    framework: "vite-vue",
    dirname: "vite-vue",
    expectedFiles: [
      "agent-ready.vite.ts",
      "public/robots.txt",
      "public/sitemap.xml",
      "public/llms.txt"
    ],
    expectedScoreThreshold: 30
  },
  {
    framework: "express",
    dirname: "express",
    expectedFiles: [
      "openapi.json",
      "robots.txt",
      "sitemap.xml",
      "llms.txt",
      "agent-ready.markdown.ts",
      ".well-known/mcp.json",
      ".well-known/agent.json",
      ".well-known/oauth-authorization-server",
      ".well-known/oauth-protected-resource"
    ],
    expectedScoreThreshold: 50
  },
  {
    framework: "hono",
    dirname: "hono",
    expectedFiles: [
      "openapi.json",
      "robots.txt",
      "sitemap.xml",
      "llms.txt",
      "agent-ready.markdown.ts",
      ".well-known/mcp.json",
      ".well-known/agent.json",
      ".well-known/oauth-authorization-server",
      ".well-known/oauth-protected-resource"
    ],
    expectedScoreThreshold: 50
  }
];

describe("examples", () => {
  for (const { framework, dirname, expectedFiles, expectedScoreThreshold } of cases) {
    it(`detects, scaffolds, and scans a ${framework} example`, async () => {
      const exampleDir = join(import.meta.dirname, "..", "..", "examples", dirname);
      const cwd = copyToTemp(exampleDir);

      const detected = detectFramework({ cwd });
      expect(detected.framework).toBe(framework);
      expect(detected.confidence).toBeGreaterThan(0);

      const scaffold = await scaffoldProject({ cwd, features: fullFeatureSet() });
      const createdPaths = scaffold.operations
        .filter((op) => op.status === "create")
        .map((op) => op.path);

      for (const expectedFile of expectedFiles) {
        const fullPath = join(cwd, expectedFile);
        expect(
          createdPaths.some((p) => p === fullPath) || existsSync(fullPath),
          `Expected file ${expectedFile} to be created in ${framework} example`
        ).toBe(true);
      }

      const result = await scanProject({ cwd });
      expect(result.framework.framework).toBe(framework);
      expect(result.score).toBeGreaterThanOrEqual(expectedScoreThreshold);
    });
  }

  it("detects unknown when no package.json exists", () => {
    const cwd = mkdtempSync(join(tmpdir(), "agent-ready-unknown-"));
    tempDirs.push(cwd);

    const detected = detectFramework({ cwd });
    expect(detected.framework).toBe("unknown");
    expect(detected.confidence).toBe(0);
  });
});

function fullFeatureSet() {
  return [
    "api-catalog",
    "robots",
    "sitemap",
    "llms",
    "markdown",
    "mcp",
    "agent-card",
    "oauth-discovery",
    "oauth-protected-resource"
  ] as ScaffoldFeature[];
}

function copyToTemp(src: string): string {
  const dest = mkdtempSync(join(tmpdir(), "agent-ready-example-"));
  tempDirs.push(dest);
  cpSync(src, dest, { recursive: true });
  return dest;
}
