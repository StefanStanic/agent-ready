# agent-ready

`agent-ready` is a TypeScript-first CLI and library for scanning agent-readiness signals and scaffolding framework-specific machine-readable endpoints.

## Commands

```bash
npx agent-ready scan https://example.com
npx agent-ready init --framework next
npx agent-ready add mcp
npx agent-ready doctor
```

## TypeScript usage

```ts
import { scanSite, scaffoldProject } from "agent-ready";

const report = await scanSite({ url: "https://example.com" });

await scaffoldProject({
  cwd: process.cwd(),
  framework: "next",
  features: ["robots", "llms", "mcp"]
});
```

## Development

```bash
npm install
npm run check
npm run test
npm run build
```
