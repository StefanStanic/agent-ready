import { existsSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { join } from "node:path";
import type { AgentReadyConfig } from "./types";

const CONFIG_FILENAMES = [
  "agent-ready.config.json",
  "agent-ready.config.mjs",
  "agent-ready.config.cjs"
];

export async function loadAgentReadyConfig(cwd: string): Promise<AgentReadyConfig> {
  for (const filename of CONFIG_FILENAMES) {
    const path = join(cwd, filename);

    if (!existsSync(path)) {
      continue;
    }

    if (filename.endsWith(".json")) {
      return JSON.parse(readFileSync(path, "utf8")) as AgentReadyConfig;
    }

    const loaded = await import(pathToFileURL(path).href);
    return normalizeModuleConfig(loaded) as AgentReadyConfig;
  }

  return {};
}

function normalizeModuleConfig(input: Record<string, unknown>): unknown {
  if ("default" in input && input.default !== undefined) {
    return input.default;
  }

  return input;
}
