import type { CheckResult } from "./types";

export function summarizeScores(checks: CheckResult[]): {
  score: number;
  categoryScores: Record<string, number>;
} {
  const applicable = checks.filter((c) => c.status !== "not_applicable");
  const total = applicable.length;
  const earned = applicable.reduce((sum, c) => sum + scoreForStatus(c.status), 0);
  const overallScore = total === 0 ? 0 : Math.round((earned / total) * 100);

  const categoryScores: Record<string, number> = {};
  const categoryBuckets = new Map<string, { earned: number; total: number }>();

  for (const check of applicable) {
    const bucket = categoryBuckets.get(check.category) ?? { earned: 0, total: 0 };
    bucket.total += 1;
    bucket.earned += scoreForStatus(check.status);
    categoryBuckets.set(check.category, bucket);
  }

  for (const [category, value] of categoryBuckets) {
    categoryScores[category] = value.total === 0 ? 0 : Math.round((value.earned / value.total) * 100);
  }

  return {
    score: overallScore,
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
