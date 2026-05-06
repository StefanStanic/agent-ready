import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { FrameworkDetection, FrameworkName } from "../core/types";

type Detector = {
  framework: FrameworkName;
  dependencies: string[];
  files?: string[];
};

const DETECTORS: Detector[] = [
  { framework: "next", dependencies: ["next"], files: ["next.config.js", "next.config.mjs"] },
  { framework: "nuxt", dependencies: ["nuxt"] },
  { framework: "astro", dependencies: ["astro"], files: ["astro.config.mjs", "astro.config.ts"] },
  { framework: "sveltekit", dependencies: ["@sveltejs/kit"] },
  { framework: "vite-react", dependencies: ["react", "vite"] },
  { framework: "vite-vue", dependencies: ["vue", "vite"] },
  { framework: "express", dependencies: ["express"] },
  { framework: "hono", dependencies: ["hono"] }
];

export function detectFramework(options: { cwd?: string } = {}): FrameworkDetection {
  const cwd = options.cwd ?? process.cwd();
  const packageJsonPath = join(cwd, "package.json");

  if (!existsSync(packageJsonPath)) {
    return {
      framework: "unknown",
      confidence: 0,
      reasons: ["No package.json found."]
    };
  }

  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };
  const dependencyNames = new Set([
    ...Object.keys(packageJson.dependencies ?? {}),
    ...Object.keys(packageJson.devDependencies ?? {})
  ]);

  let bestMatch: FrameworkDetection = {
    framework: "unknown",
    confidence: 0,
    reasons: ["No supported framework matched."]
  };

  for (const detector of DETECTORS) {
    let score = 0;
    const reasons: string[] = [];

    for (const dependency of detector.dependencies) {
      if (dependencyNames.has(dependency)) {
        score += 0.4;
        reasons.push(`Detected dependency ${dependency}.`);
      }
    }

    for (const file of detector.files ?? []) {
      if (existsSync(join(cwd, file))) {
        score += 0.2;
        reasons.push(`Detected config file ${file}.`);
      }
    }

    if (score > bestMatch.confidence) {
      bestMatch = {
        framework: detector.framework,
        confidence: Math.min(1, Number(score.toFixed(2))),
        reasons
      };
    }
  }

  return bestMatch;
}
