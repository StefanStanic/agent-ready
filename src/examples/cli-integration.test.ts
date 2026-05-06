import { execSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import type { FrameworkName } from "../core/types";

const tempDirs: string[] = [];

const CLI = join(import.meta.dirname, "..", "..", "dist", "cli.js");

function strip(input: string): string {
  return input.replace(/\x1b\[\d+m/g, "");
}

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir) {
      rmSync(dir, { recursive: true, force: true });
    }
  }
});

type CliCase = {
  framework: FrameworkName;
  dirname: string;
  expectedInitFiles: string[];
};

const cases: CliCase[] = [
  {
    framework: "next",
    dirname: "next",
    expectedInitFiles: [
      "app/llms.txt/route.ts",
      "app/sitemap.ts",
      "app/.well-known/mcp.json/route.ts",
      "app/.well-known/agent.json/route.ts",
      "public/robots.txt"
    ]
  },
  {
    framework: "nuxt",
    dirname: "nuxt",
    expectedInitFiles: [
      "server/routes/sitemap.xml.ts",
      "server/routes/llms.txt.ts",
      "server/routes/.well-known/mcp.json.ts",
      "server/routes/.well-known/agent.json.ts",
      "public/robots.txt"
    ]
  },
  {
    framework: "astro",
    dirname: "astro",
    expectedInitFiles: [
      "public/sitemap.xml",
      "src/pages/llms.txt.ts",
      "src/pages/.well-known/mcp.json.ts",
      "src/pages/.well-known/agent.json.ts",
      "public/robots.txt"
    ]
  },
  {
    framework: "sveltekit",
    dirname: "sveltekit",
    expectedInitFiles: [
      "src/routes/sitemap.xml/+server.ts",
      "src/routes/llms.txt/+server.ts",
      "src/routes/.well-known/mcp.json/+server.ts",
      "src/routes/.well-known/agent.json/+server.ts",
      "static/robots.txt"
    ]
  },
  {
    framework: "vite-react",
    dirname: "vite-react",
    expectedInitFiles: [
      "public/robots.txt",
      "public/sitemap.xml",
      "public/llms.txt",
      "agent-ready.vite.ts"
    ]
  },
  {
    framework: "vite-vue",
    dirname: "vite-vue",
    expectedInitFiles: [
      "public/robots.txt",
      "public/sitemap.xml",
      "public/llms.txt",
      "agent-ready.vite.ts"
    ]
  },
  {
    framework: "express",
    dirname: "express",
    expectedInitFiles: [
      "openapi.json",
      "robots.txt",
      "sitemap.xml",
      "llms.txt",
      ".well-known/mcp.json",
      ".well-known/agent.json",
      ".well-known/oauth-authorization-server",
      ".well-known/oauth-protected-resource"
    ]
  },
  {
    framework: "hono",
    dirname: "hono",
    expectedInitFiles: [
      "openapi.json",
      "robots.txt",
      "sitemap.xml",
      "llms.txt",
      ".well-known/mcp.json",
      ".well-known/agent.json",
      ".well-known/oauth-authorization-server",
      ".well-known/oauth-protected-resource"
    ]
  }
];

describe("cli integration", () => {
  for (const { framework, dirname, expectedInitFiles } of cases) {
    describe(framework, () => {
      it("init scaffolds all default features", () => {
        const cwd = copyExampleToTemp(dirname);
        runCli(["init", "--framework", framework], cwd);

        for (const file of expectedInitFiles) {
          expect(
            existsSync(join(cwd, file)),
            `Expected ${file} to exist after init in ${framework}`
          ).toBe(true);
        }
      });

      it("doctor outputs human-readable report", () => {
        const cwd = copyExampleToTemp(dirname);
        runCli(["init", "--framework", framework], cwd);

        const output = strip(runCli(["doctor"], cwd));
        expect(output).toContain("/100");
        expect(output).toContain("Discoverability");
      });

      it("doctor --json outputs valid JSON", () => {
        const cwd = copyExampleToTemp(dirname);
        runCli(["init", "--framework", framework], cwd);

        const output = runCli(["doctor", "--json"], cwd);
        const parsed = JSON.parse(output);
        expect(parsed.schemaVersion).toBeDefined();
        expect(parsed.target).toBeDefined();
        expect(parsed.mode).toBe("project");
        expect(parsed.score).toBeGreaterThan(0);
        expect(parsed.checks).toBeInstanceOf(Array);
        expect(parsed.checks.length).toBeGreaterThan(0);
        expect(parsed.framework).toBeDefined();
        expect(parsed.framework.framework).toBe(framework);
      });

      it("doctor --format markdown outputs markdown", () => {
        const cwd = copyExampleToTemp(dirname);
        runCli(["init", "--framework", framework], cwd);

        const output = runCli(["doctor", "--format", "markdown"], cwd);
        expect(output).toContain("# Agent Readiness Report");
        expect(output).toContain("## Category Scores");
        expect(output).toContain("## Checks");
        expect(output).toContain("| Field | Value |");
        expect(output).toContain("| Mode | project |");
        expect(output).toMatch(/\*\*\d+\/100\*\*/);
      });

      it("doctor --report-file writes file", () => {
        const cwd = copyExampleToTemp(dirname);
        runCli(["init", "--framework", framework], cwd);

        const reportPath = join(cwd, "report.txt");
        runCli(["doctor", "--report-file", reportPath], cwd);

        const fileContent = strip(readFileSync(reportPath, "utf8"));
        expect(fileContent).toContain("/100");
      });

      it("explain outputs check documentation as JSON", () => {
        const cwd = copyExampleToTemp(dirname);

        const output = runCli(["explain", "robots-txt"], cwd);
        const parsed = JSON.parse(output);
        expect(parsed.id).toBe("robots-txt");
        expect(parsed.category).toBe("discoverability");
        expect(parsed.fixes).toBeInstanceOf(Array);
      });

      it("add --dry-run shows what would be created", () => {
        const cwd = copyExampleToTemp(dirname);

        const output = strip(runCli(["add", "llms", "--dry-run", "--framework", framework], cwd));
        expect(output).toContain("+");
      });
    });
  }

  it("init --cwd targets a specific directory", () => {
    const cwd = copyExampleToTemp("express");
    const subDir = join(cwd, "sub");

    runCli(["init", "--framework", "express", "--cwd", subDir], cwd);

    expect(existsSync(join(subDir, "robots.txt"))).toBe(true);
  });

  it("init --features overrides default features", () => {
    const cwd = copyExampleToTemp("next");

    runCli(["init", "--framework", "next", "--features", "robots,sitemap"], cwd);

    expect(existsSync(join(cwd, "public", "robots.txt"))).toBe(true);
    expect(existsSync(join(cwd, "app", "sitemap.ts"))).toBe(true);
    expect(existsSync(join(cwd, "app", "openapi.json/route.ts"))).toBe(false);
  });

  it("init --preset application scaffolds all application features", () => {
    const cwd = copyExampleToTemp("express");

    runCli(["init", "--framework", "express", "--preset", "application"], cwd);

    expect(existsSync(join(cwd, "openapi.json"))).toBe(true);
    expect(existsSync(join(cwd, ".well-known/mcp.json"))).toBe(true);
    expect(existsSync(join(cwd, ".well-known/oauth-authorization-server"))).toBe(true);
  });

  it("init --dry-run previews without writing files", () => {
    const cwd = copyExampleToTemp("astro");

    runCli(["init", "--framework", "astro", "--dry-run"], cwd);

    expect(existsSync(join(cwd, "src/pages/openapi.json.ts"))).toBe(false);
    expect(existsSync(join(cwd, "public/robots.txt"))).toBe(false);
  });

  it("doctor --min-score fails with exit code when score is below threshold", () => {
    const cwd = copyExampleToTemp("hono");
    runCli(["init", "--framework", "hono"], cwd);

    const output = runCli(["doctor", "--json"], cwd);
    const result = JSON.parse(output);
    const score = result.score;

    expect(() => runCli(["doctor", "--min-score", String(score + 1)], cwd)).toThrow();
  });

  it("doctor --fail-on-status passes when no checks have the specified status", () => {
    const cwd = copyExampleToTemp("hono");
    runCli(["init", "--framework", "hono"], cwd);

    const output = strip(runCli(["doctor", "--fail-on-status", "error"], cwd));
    expect(output).toContain("/100");
  });
});

function runCli(args: string[], cwd: string): string {
  return execSync(`node ${CLI} ${args.join(" ")}`, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });
}

function copyExampleToTemp(dirname: string): string {
  const src = join(import.meta.dirname, "..", "..", "examples", dirname);
  const dest = mkdtempSync(join(tmpdir(), `agent-ready-cli-${dirname}-`));
  tempDirs.push(dest);
  cpSync(src, dest, { recursive: true });
  return dest;
}
