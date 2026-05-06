import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { detectFramework } from "./detect";

const tempDirs: string[] = [];

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();

    if (dir) {
      rmSync(dir, { recursive: true, force: true });
    }
  }
});

describe("detectFramework", () => {
  it("detects Next.js from package.json dependencies", () => {
    const cwd = createTempProject({
      dependencies: {
        next: "^15.0.0",
        react: "^19.0.0"
      }
    });

    const result = detectFramework({ cwd });

    expect(result.framework).toBe("next");
    expect(result.confidence).toBeGreaterThan(0);
  });

  it("returns unknown when no package.json is present", () => {
    const cwd = createEmptyTempDir();

    const result = detectFramework({ cwd });

    expect(result.framework).toBe("unknown");
    expect(result.confidence).toBe(0);
  });
});

function createTempProject(packageJson: Record<string, unknown>): string {
  const cwd = createEmptyTempDir();
  writeFileSync(join(cwd, "package.json"), JSON.stringify(packageJson, null, 2), "utf8");
  return cwd;
}

function createEmptyTempDir(): string {
  const cwd = mkdtempSync(join(tmpdir(), "agent-ready-"));
  tempDirs.push(cwd);
  return cwd;
}
