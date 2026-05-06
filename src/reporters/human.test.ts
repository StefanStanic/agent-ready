import { describe, expect, it } from "vitest";
import { renderScanResult } from "./human";

function strip(input: string): string {
  return input.replace(/\x1b\[\d+m/g, "");
}

describe("renderScanResult", () => {
  it("renders colored scan output with score bar, categories, and checks", () => {
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

    const plain = strip(output);

    expect(plain).toContain("https://example.com");
    expect(plain).toContain("42/100");
    expect(plain).toContain("robots.txt");
    expect(plain).toContain("robots.txt is missing.");
    expect(plain).toContain("Publish /robots.txt.");
    expect(plain).toContain("50/100");
  });
});
