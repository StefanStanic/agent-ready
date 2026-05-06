import { describe, expect, it } from "vitest";
import {
  validateA2aAgentCardDocument,
  validateMcpServerCardDocument,
  validateOauthDiscoveryDocument,
  validateOauthProtectedResourceDocument,
  validateOpenApiDocument
} from "./discovery-documents";

describe("discovery document validators", () => {
  it("validates an OpenAPI document", () => {
    const result = validateOpenApiDocument({
      openapi: "3.1.0",
      info: {
        title: "Example API",
        version: "1.0.0"
      },
      paths: {
        "/ping": {}
      }
    });

    expect(result.data).not.toBeNull();
    expect(result.errors).toEqual([]);
  });

  it("validates OAuth discovery metadata", () => {
    const result = validateOauthDiscoveryDocument({
      issuer: "https://example.com",
      authorization_endpoint: "https://example.com/oauth/authorize",
      token_endpoint: "https://example.com/oauth/token"
    });

    expect(result.data?.issuer).toBe("https://example.com");
  });

  it("validates OAuth protected resource metadata", () => {
    const result = validateOauthProtectedResourceDocument({
      resource: "https://api.example.com",
      authorization_servers: ["https://example.com"]
    });

    expect(result.data?.resource).toBe("https://api.example.com");
  });

  it("validates MCP server cards", () => {
    const result = validateMcpServerCardDocument({
      name: "example-mcp-server",
      url: "https://example.com"
    });

    expect(result.data?.name).toBe("example-mcp-server");
  });

  it("validates A2A agent cards", () => {
    const result = validateA2aAgentCardDocument({
      name: "example-agent",
      description: "Agent card"
    });

    expect(result.data?.name).toBe("example-agent");
  });
});
