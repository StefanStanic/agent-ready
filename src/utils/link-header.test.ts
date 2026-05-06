import { describe, expect, it } from "vitest";
import { parseLinkHeader } from "./link-header";

describe("parseLinkHeader", () => {
  it("parses multiple link entries with rel values", () => {
    const value =
      '<https://example.com/llms.txt>; rel="alternate"; type="text/markdown", ' +
      '<https://example.com/openapi.json>; rel="service-desc"';

    const parsed = parseLinkHeader(value);

    expect(parsed).toHaveLength(2);
    expect(parsed[0]?.rels).toEqual(["alternate"]);
    expect(parsed[0]?.attributes.type).toBe("text/markdown");
    expect(parsed[1]?.rels).toEqual(["service-desc"]);
  });
});
