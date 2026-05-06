import { describe, expect, it } from "vitest";
import { evaluateScanFailure } from "./evaluate";

describe("evaluateScanFailure", () => {
  it("fails when the score is below the minimum", () => {
    const result = evaluateScanFailure(
      {
        schemaVersion: "1.0.0",
        target: "https://example.com",
        mode: "site",
        score: 42,
        categoryScores: {},
        checks: [],
        warnings: []
      },
      {
        minScore: 50
      }
    );

    expect(result.failed).toBe(true);
    expect(result.reasons[0]).toContain("below required minimum");
  });

  it("fails when selected statuses are present", () => {
    const result = evaluateScanFailure(
      {
        schemaVersion: "1.0.0",
        target: "https://example.com",
        mode: "site",
        score: 100,
        categoryScores: {},
        checks: [
          {
            id: "robots-txt",
            category: "discoverability",
            title: "robots.txt",
            status: "warn",
            scoreWeight: 5,
            summary: "",
            evidence: {},
            fixes: [],
            docs: []
          }
        ],
        warnings: []
      },
      {
        failOnStatuses: ["warn", "fail"]
      }
    );

    expect(result.failed).toBe(true);
    expect(result.reasons[0]).toContain("robots-txt");
  });
});
