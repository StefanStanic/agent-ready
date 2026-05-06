import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { loadAgentReadyConfig } from "./config";

const tempDirs: string[] = [];

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();

    if (dir) {
      rmSync(dir, { recursive: true, force: true });
    }
  }
});

describe("loadAgentReadyConfig", () => {
  it("loads JSON config", async () => {
    const cwd = createTempDir();
    writeFileSync(
      join(cwd, "agent-ready.config.json"),
      JSON.stringify(
        {
          defaults: {
            output: "json"
          },
          scan: {
            minScore: 70
          }
        },
        null,
        2
      ),
      "utf8"
    );

    const config = await loadAgentReadyConfig(cwd);

    expect(config.defaults?.output).toBe("json");
    expect(config.scan?.minScore).toBe(70);
  });

  it("loads module config", async () => {
    const cwd = createTempDir();
    writeFileSync(
      join(cwd, "agent-ready.config.mjs"),
      [
        "export default {",
        "  doctor: {",
        "    failOnStatuses: ['warn', 'fail']",
        "  }",
        "};"
      ].join("\n"),
      "utf8"
    );

    const config = await loadAgentReadyConfig(cwd);

    expect(config.doctor?.failOnStatuses).toEqual(["warn", "fail"]);
  });
});

function createTempDir(): string {
  const cwd = mkdtempSync(join(tmpdir(), "agent-ready-"));
  tempDirs.push(cwd);
  return cwd;
}
