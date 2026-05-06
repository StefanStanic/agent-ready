import { describe, expect, it } from "vitest";
import { extractContentSignals } from "./content-signals";

describe("extractContentSignals", () => {
  it("extracts supported content signal directives from robots.txt content", () => {
    const input = [
      "User-agent: *",
      "Content-Signal: ai-input, ai-train",
      "Content-Signal: search"
    ].join("\n");

    expect(extractContentSignals(input)).toEqual(["ai-input", "ai-train", "search"]);
  });
});
