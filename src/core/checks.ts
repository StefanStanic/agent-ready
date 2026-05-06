import type { CheckResult } from "./types";

const CATEGORY_WEIGHTS: Record<string, number> = {
  discoverability: 20,
  "content-accessibility": 15,
  "bot-access-control": 20,
  discovery: 30,
  commerce: 15
};

export function summarizeScores(checks: CheckResult[]): {
  score: number;
  categoryScores: Record<string, number>;
} {
  const weightedByCategory = new Map<string, { earned: number; total: number }>();

  for (const check of checks) {
    const bucket = weightedByCategory.get(check.category) ?? { earned: 0, total: 0 };
    bucket.total += check.scoreWeight;
    bucket.earned += scoreForStatus(check.status) * check.scoreWeight;
    weightedByCategory.set(check.category, bucket);
  }

  const categoryScores: Record<string, number> = {};
  let total = 0;

  for (const [category, value] of weightedByCategory) {
    const normalized = value.total === 0 ? 0 : Math.round((value.earned / value.total) * 100);
    categoryScores[category] = normalized;
    total += Math.round((normalized / 100) * (CATEGORY_WEIGHTS[category] ?? 0));
  }

  return {
    score: total,
    categoryScores
  };
}

function scoreForStatus(status: CheckResult["status"]): number {
  switch (status) {
    case "pass":
      return 1;
    case "warn":
      return 0.6;
    case "not_applicable":
      return 1;
    case "fail":
    case "error":
      return 0;
  }
}
