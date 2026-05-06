import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { scanProject } from "./scan-project";

const tempDirs: string[] = [];

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();

    if (dir) {
      rmSync(dir, { recursive: true, force: true });
    }
  }
});

describe("scanProject", () => {
  it("checks Next.js framework-native paths", async () => {
    const cwd = createTempDir();
    writePackageJson(cwd, { dependencies: { next: "^15.0.0", react: "^19.0.0" } });
    writeFile(cwd, "app/openapi.json/route.ts", "export function GET() { return Response.json({}); }\n");
    writeFile(cwd, "public/robots.txt", "User-agent: *\nAllow: /\n");
    writeFile(cwd, "app/llms.txt/route.ts", "export function GET() { return new Response('ok'); }\n");
    writeFile(cwd, "app/.well-known/mcp.json/route.ts", "export function GET() { return Response.json({}); }\n");
    writeFile(cwd, "app/.well-known/oauth-authorization-server/route.ts", "export function GET() { return Response.json({}); }\n");

    const result = await scanProject({ cwd });

    expect(result.framework.framework).toBe("next");
    expect(findCheck(result, "api-catalog")?.status).toBe("pass");
    expect(findCheck(result, "robots-txt")?.status).toBe("pass");
    expect(findCheck(result, "llms-txt")?.status).toBe("pass");
    expect(findCheck(result, "markdown-route")?.status).toBe("pass");
    expect(findCheck(result, "mcp-server-card")?.status).toBe("pass");
    expect(findCheck(result, "oauth-discovery")?.status).toBe("pass");
  });

  it("checks SvelteKit static and route conventions", async () => {
    const cwd = createTempDir();
    writePackageJson(cwd, { dependencies: { "@sveltejs/kit": "^2.0.0" } });
    writeFile(cwd, "static/robots.txt", "User-agent: *\nAllow: /\n");
    writeFile(cwd, "src/routes/llms.txt/+server.ts", "export function GET() {}\n");

    const result = await scanProject({ cwd });

    expect(result.framework.framework).toBe("sveltekit");
    expect(findCheck(result, "robots-txt")?.status).toBe("pass");
    expect(findCheck(result, "markdown-route")?.status).toBe("pass");
  });
});

function findCheck(
  result: Awaited<ReturnType<typeof scanProject>>,
  id: string
) {
  return result.checks.find((check) => check.id === id);
}

function createTempDir(): string {
  const cwd = mkdtempSync(join(tmpdir(), "agent-ready-"));
  tempDirs.push(cwd);
  return cwd;
}

function writePackageJson(cwd: string, packageJson: Record<string, unknown>): void {
  writeFileSync(join(cwd, "package.json"), JSON.stringify(packageJson, null, 2), "utf8");
}

function writeFile(cwd: string, relativePath: string, contents: string): void {
  const path = join(cwd, relativePath);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, contents, "utf8");
}
