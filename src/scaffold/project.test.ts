import { mkdtempSync, readFileSync, rmSync } from "node:fs";
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
});

function createTempDir(): string {
  const cwd = mkdtempSync(join(tmpdir(), "agent-ready-"));
  tempDirs.push(cwd);
  return cwd;
}
