export type CheckStatus =
  | "pass"
  | "warn"
  | "fail"
  | "not_applicable"
  | "error";

export type CheckCategory =
  | "discoverability"
  | "content-accessibility"
  | "bot-access-control"
  | "discovery"
  | "commerce";

export type CategoryScoreMap = Record<string, number>;

export type CheckResult = {
  id: string;
  category: CheckCategory;
  title: string;
  status: CheckStatus;
  scoreWeight: number;
  summary: string;
  evidence: Record<string, unknown>;
  fixes: string[];
  docs: string[];
};

export type CheckDefinition = {
  id: string;
  title: string;
  category: CheckCategory;
  scoreWeight: number;
};

export type ScanSiteOptions = {
  url: string;
  timeoutMs?: number;
};

export type ScanResult = {
  target: string;
  mode: "site" | "project";
  score: number;
  categoryScores: CategoryScoreMap;
  checks: CheckResult[];
  warnings: string[];
};

export type FrameworkName =
  | "next"
  | "nuxt"
  | "astro"
  | "vite-react"
  | "vite-vue"
  | "sveltekit"
  | "express"
  | "hono"
  | "unknown";

export type FrameworkDetection = {
  framework: FrameworkName;
  confidence: number;
  reasons: string[];
};

export type ScanProjectOptions = {
  cwd?: string;
};

export type ScanProjectResult = ScanResult & {
  cwd: string;
  framework: FrameworkDetection;
  fileSignals: string[];
};

export type ScaffoldFeature =
  | "robots"
  | "sitemap"
  | "llms"
  | "markdown"
  | "mcp"
  | "agent-card";

export type ScaffoldOperation = {
  path: string;
  status: "create" | "skip";
  reason: string;
};

export type ScaffoldProjectOptions = {
  cwd?: string;
  framework?: FrameworkName;
  preset?: "content-site" | "application";
  features?: ScaffoldFeature[];
  dryRun?: boolean;
};

export type ScaffoldProjectResult = {
  cwd: string;
  framework: FrameworkDetection;
  operations: ScaffoldOperation[];
};
