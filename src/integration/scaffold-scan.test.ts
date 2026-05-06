import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { scanProject } from "../core/scan-project";
import { scaffoldProject } from "../scaffold/project";
import type { FrameworkName } from "../core/types";

const tempDirs: string[] = [];

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();

    if (dir) {
      rmSync(dir, { recursive: true, force: true });
    }
  }
});

describe("scaffoldProject + scanProject", () => {
  it("scaffolds and validates a Next.js project", async () => {
    const cwd = createProject("next", {
      dependencies: {
        next: "^15.0.0",
        react: "^19.0.0"
      }
    });

    await scaffoldProject({
      cwd,
      framework: "next",
      features: [
        "api-catalog",
        "robots",
        "sitemap",
        "llms",
        "mcp",
        "agent-card",
        "oauth-discovery",
        "oauth-protected-resource"
      ]
    });

    const result = await scanProject({ cwd });

    expect(result.framework.framework).toBe("next");
    expect(nonPassingChecks(result.checks)).toEqual([]);
  });

  it("scaffolds and validates an Astro project", async () => {
    const cwd = createProject("astro", {
      dependencies: {
        astro: "^5.0.0"
      }
    });

    await scaffoldProject({
      cwd,
      framework: "astro",
      features: [
        "api-catalog",
        "robots",
        "sitemap",
        "llms",
        "mcp",
        "agent-card",
        "oauth-discovery",
        "oauth-protected-resource"
      ]
    });

    const result = await scanProject({ cwd });

    expect(result.framework.framework).toBe("astro");
    expect(nonPassingChecks(result.checks)).toEqual([]);
  });

  it("scaffolds and validates an Express project", async () => {
    const cwd = createProject("express", {
      dependencies: {
        express: "^5.0.0"
      }
    });

    await scaffoldProject({
      cwd,
      framework: "express",
      features: [
        "api-catalog",
        "robots",
        "sitemap",
        "markdown",
        "mcp",
        "oauth-discovery",
        "oauth-protected-resource"
      ]
    });

    const result = await scanProject({ cwd });

    expect(result.framework.framework).toBe("express");
    expect(findCheckStatus(result, "robots-txt")).toBe("pass");
    expect(findCheckStatus(result, "api-catalog")).toBe("pass");
    expect(findCheckStatus(result, "markdown-route")).toBe("pass");
    expect(findCheckStatus(result, "mcp-server-card")).toBe("pass");
    expect(findCheckStatus(result, "oauth-discovery")).toBe("pass");
    expect(findCheckStatus(result, "oauth-protected-resource")).toBe("pass");
  });
});

function findCheckStatus(
  result: Awaited<ReturnType<typeof scanProject>>,
  id: string
): string | undefined {
  return result.checks.find((check) => check.id === id)?.status;
}

function nonPassingChecks(checks: Awaited<ReturnType<typeof scanProject>>["checks"]): string[] {
  return checks
    .filter((check) => check.status !== "pass")
    .map((check) => check.id)
    .sort();
}

function createProject(framework: FrameworkName, packageJson: Record<string, unknown>): string {
  const cwd = mkdtempSync(join(tmpdir(), `agent-ready-${framework}-`));
  tempDirs.push(cwd);
  writeFileSync(join(cwd, "package.json"), JSON.stringify(packageJson, null, 2), "utf8");
  return cwd;
}
