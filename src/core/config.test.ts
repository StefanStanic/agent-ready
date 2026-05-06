import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { loadAgentReadyConfig } from "./config";
import { AgentReadyConfigError, validateAgentReadyConfig } from "./config-validation";

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
          init: {
            preset: "application"
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
    expect(config.init?.preset).toBe("application");
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

  it("rejects invalid config with a user-facing error", async () => {
    const cwd = createTempDir();
    writeFileSync(
      join(cwd, "agent-ready.config.json"),
      JSON.stringify(
        {
          scan: {
            minScore: "high"
          },
          init: {
            features: ["robots", "nope"]
          }
        },
        null,
        2
      ),
      "utf8"
    );

    await expect(loadAgentReadyConfig(cwd)).rejects.toBeInstanceOf(AgentReadyConfigError);
  });

  it("returns detailed validation issues", () => {
    const validation = validateAgentReadyConfig({
      defaults: {
        output: "xml"
      },
      init: {
        preset: "bad"
      }
    });

    expect(validation.valid).toBe(false);
    expect(validation.errors).toContain("defaults.output must be one of: human, json.");
    expect(validation.errors).toContain("init.preset must be one of: content-site, application.");
  });
});

function createTempDir(): string {
  const cwd = mkdtempSync(join(tmpdir(), "agent-ready-"));
  tempDirs.push(cwd);
  return cwd;
}
