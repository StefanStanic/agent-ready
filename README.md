# agent-ready

[![npm version](https://img.shields.io/npm/v/@stefkec/agent-ready)](https://www.npmjs.com/package/@stefkec/agent-ready)
[![npm downloads](https://img.shields.io/npm/dm/@stefkec/agent-ready)](https://www.npmjs.com/package/@stefkec/agent-ready)
[![CI](https://github.com/StefanStanic/agent-ready/actions/workflows/ci.yml/badge.svg)](https://github.com/StefanStanic/agent-ready/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/@stefkec/agent-ready)](LICENSE)
[![node](https://img.shields.io/node/v/@stefkec/agent-ready)](https://nodejs.org)

`agent-ready` is a TypeScript-first CLI and library for scanning agent-readiness signals and scaffolding framework-specific machine-readable endpoints.

## What it does

- Scans live sites against an agent-readiness surface modeled on `isitagentready.com`
- Inspects local projects with framework-aware path and route conventions
- Scaffolds agent-facing files and endpoints for supported JavaScript/TypeScript frameworks
- Supports CI-friendly exit behavior with score and status thresholds

## Install

```bash
npm install @stefkec/agent-ready
```

Or run it directly:

```bash
npx @stefkec/agent-ready scan https://example.com
```

## CLI

```bash
agent-ready scan <url> [--json] [--report-file <path>] [--min-score <n>] [--fail-on-status <list>]
agent-ready doctor [cwd] [--cwd <path>] [--json] [--report-file <path>] [--min-score <n>] [--fail-on-status <list>]
agent-ready init [--cwd <path>] [--framework <name>] [--preset <name>] [--features <list>] [--dry-run] [--json] [--report-file <path>]
agent-ready add <feature> [--cwd <path>] [--json] [--report-file <path>]
agent-ready explain <check>
```

### Examples

Scan a live site:

```bash
npx agent-ready scan https://example.com
```

Scan a live site and fail CI on warnings or failures:

```bash
npx agent-ready scan https://example.com --min-score 80 --fail-on-status warn,fail
```

Write a JSON report artifact:

```bash
npx agent-ready doctor --json --report-file ./reports/agent-ready.json
```

Inspect a local project:

```bash
npx agent-ready doctor
```

Scaffold a Next.js project:

```bash
npx agent-ready init --framework next
```

Scaffold an application-style project:

```bash
npx agent-ready init --framework express --preset application
```

Scaffold an exact feature set:

```bash
npx agent-ready init --framework next --features robots,llms,mcp
```

Scaffold into another directory:

```bash
npx agent-ready init --cwd ./apps/web --framework next --preset content-site
```

Add only an MCP server card scaffold:

```bash
npx agent-ready add mcp
```

## Config file

Supported config files:

- `agent-ready.config.json`
- `agent-ready.config.mjs`
- `agent-ready.config.cjs`

Example:

```json
{
  "defaults": {
    "output": "human"
  },
  "scan": {
    "minScore": 80,
    "failOnStatuses": ["warn", "fail"]
  },
  "doctor": {
    "minScore": 75,
    "failOnStatuses": ["fail", "error"]
  },
  "init": {
    "framework": "next",
    "preset": "content-site",
    "features": ["api-catalog", "robots", "sitemap", "llms", "mcp"]
  }
}
```

Config is optional. CLI flags still take precedence.

## Presets

- `content-site`
  Intended for marketing sites, docs sites, and content-heavy apps.
- `application`
  Intended for API-capable apps and authenticated products.

Default behavior:

- `next`, `astro`, `sveltekit`, `nuxt`, `vite-react`, and `vite-vue` default to `content-site`
- `express` and `hono` default to `application`

## Supported scaffold features

- `api-catalog`
- `robots`
- `sitemap`
- `llms`
- `markdown`
- `mcp`
- `agent-card`
- `oauth-discovery`
- `oauth-protected-resource`

## Supported frameworks

- `next`
- `astro`
- `sveltekit`
- `express`
- `hono`
- `nuxt`
- `vite-react`
- `vite-vue`

Framework support is uneven right now. `next`, `astro`, `sveltekit`, `express`, and `hono` have the strongest scaffold behavior.

## TypeScript usage

```ts
import { scanSite, scaffoldProject, scanProject } from "agent-ready";

const report = await scanSite({ url: "https://example.com" });

const local = await scanProject({ cwd: process.cwd() });

await scaffoldProject({
  cwd: process.cwd(),
  framework: "next",
  features: ["api-catalog", "robots", "llms", "mcp"]
});
```

## CI example

```bash
npx agent-ready doctor --min-score 80 --fail-on-status fail,error
```

```bash
npx agent-ready scan https://example.com --min-score 85 --fail-on-status warn,fail,error
```

## Development

```bash
npm install
npm run check
npm run test
npm run build
```
