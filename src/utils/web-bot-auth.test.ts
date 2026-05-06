import { describe, expect, it } from "vitest";
import { validateWebBotAuthDirectory } from "./web-bot-auth";

describe("validateWebBotAuthDirectory", () => {
  it("validates a signed directory shape with keys", () => {
    const result = validateWebBotAuthDirectory({
      keys: [
        {
          kid: "main",
          kty: "OKP",
          crv: "Ed25519",
          x: "abc"
        }
      ]
    });

    expect(result.data).not.toBeNull();
    expect(result.keyCount).toBe(1);
    expect(result.errors).toEqual([]);
  });
});
