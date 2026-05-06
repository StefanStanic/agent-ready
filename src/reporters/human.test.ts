import { describe, expect, it } from "vitest";
import { renderScanResult } from "./human";

describe("renderScanResult", () => {
  it("includes schema version and suggested fixes for non-pass checks", () => {
    const output = renderScanResult({
      schemaVersion: "1.0.0",
      target: "https://example.com",
      mode: "site",
      score: 42,
      categoryScores: {
        discoverability: 50
      },
      checks: [
        {
          id: "robots-txt",
          category: "discoverability",
          title: "robots.txt",
          status: "warn",
          scoreWeight: 5,
          summary: "robots.txt is missing.",
          evidence: {},
          fixes: ["Publish /robots.txt."],
          docs: []
        }
      ],
      warnings: []
    });

    expect(output).toContain("Schema Version: 1.0.0");
    expect(output).toContain("Suggested fixes:");
    expect(output).toContain("Publish /robots.txt.");
  });
});
