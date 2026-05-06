# agent-ready

[![npm version](https://img.shields.io/npm/v/@stefkec/agent-ready)](https://www.npmjs.com/package/@stefkec/agent-ready)
[![npm downloads](https://img.shields.io/npm/dm/@stefkec/agent-ready)](https://www.npmjs.com/package/@stefkec/agent-ready)
[![CI](https://github.com/StefanStanic/agent-ready/actions/workflows/ci.yml/badge.svg)](https://github.com/StefanStanic/agent-ready/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/StefanStanic/agent-ready/branch/main/graph/badge.svg)](https://codecov.io/gh/StefanStanic/agent-ready)
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
# Scan a live site
agent-ready scan <url>

# Scan a local project
agent-ready doctor [cwd]

# Scaffold agent-ready endpoints (auto-detects framework)
agent-ready init [--interactive] [--framework <name>] [--preset <name>] [--features <list>]

# Add a single feature
agent-ready add <feature> [--interactive]

# Show check documentation
agent-ready explain <check>

# List available options
agent-ready --list-features
agent-ready --list-frameworks
agent-ready --list-checks
```

### Options

| Flag | Description |
|------|-------------|
| `--format human\|json\|markdown` | Output format (default: human) |
| `--json` | Shorthand for `--format json` |
| `--interactive` | Scan first, then prompt for your real site details before scaffolding |
| `--min-score <n>` | Fail with exit code 1 if score is below `n` |
| `--fail-on-status <list>` | Fail if any check matches the given statuses (comma-separated) |
| `--report-file <path>` | Write output to a file in addition to stdout |
| `--cwd <path>` | Target a specific directory |
| `--dry-run` | Preview scaffold without writing files |
| `--preset content-site\|application` | Feature preset for init |
| `--features <list>` | Explicit feature list (overrides preset) |

### Examples

Scan a live site:

```bash
agent-ready scan https://anyvan.com
```

Interactive scaffold — scans first, asks for your details:

```bash
agent-ready init --interactive
```

Scan a live site and fail CI on low score:

```bash
agent-ready scan https://example.com --min-score 80 --fail-on-status fail
```

Write a JSON or Markdown report artifact:

```bash
agent-ready doctor --format json --report-file ./reports/agent-ready.json
agent-ready doctor --format markdown --report-file ./reports/agent-ready.md
```

Inspect a local project:

```bash
agent-ready doctor
```

Scaffold an application-style project:

```bash
agent-ready init --framework express --preset application
```

Add only an MCP server card:

```bash
agent-ready add mcp
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

All 8 frameworks have native scaffold support with framework-appropriate route handlers, static files, or dev server plugins.

## Checks (18 total)

| Category | Checks |
|----------|--------|
| Discoverability | robots.txt, Sitemap, Link Headers |
| Content Accessibility | Markdown Negotiation |
| Bot Access Control | AI Bot Rules, Content Signals, Web Bot Auth |
| Discovery | API Catalog, MCP Server Card, A2A Agent Card, Agent Skills, WebMCP, OAuth Discovery, OAuth Protected Resource |
| Commerce | x402, MPP, UCP, ACP |

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
