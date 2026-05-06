import type { ScanFailureOptions, ScanFailureResult, ScanResult } from "./types";

export function evaluateScanFailure(
  result: ScanResult,
  options: ScanFailureOptions
): ScanFailureResult {
  const reasons: string[] = [];

  if (typeof options.minScore === "number" && result.score < options.minScore) {
    reasons.push(`Score ${result.score} is below required minimum ${options.minScore}.`);
  }

  const failOnStatuses = options.failOnStatuses ?? [];

  if (failOnStatuses.length > 0) {
    const matchingChecks = result.checks.filter((check) => failOnStatuses.includes(check.status));

    if (matchingChecks.length > 0) {
      reasons.push(
        `Found checks with statuses ${failOnStatuses.join(", ")}: ${matchingChecks
          .map((check) => check.id)
          .join(", ")}.`
      );
    }
  }

  return {
    failed: reasons.length > 0,
    reasons
  };
}
