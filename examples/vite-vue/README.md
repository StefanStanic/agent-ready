# Example: Vite + Vue

Minimal Vite + Vue project demonstrating agent-ready integration.

## Quick start

```bash
npm install
npx agent-ready init
npx agent-ready doctor
```

## Commands

| Command | Description |
| -- | -- |
| `npx agent-ready init` | Scaffold agent-ready endpoints |
| `npx agent-ready doctor` | Scan local project |
| `npx agent-ready explain <check>` | Show check documentation |
| `npx agent-ready add <feature>` | Add a single feature |
| `npx agent-ready scan <url>` | Scan a live site |

## What gets created

- `agent-ready.vite.ts`
- `public/robots.txt`
- `public/sitemap.xml`
- `public/llms.txt`

## Configuration

Edit `agent-ready.config.json` to customize behavior. All keys:

| Key | Type | Values | Description |
| --- | --- | --- | --- |
| `defaults.output` | string | `human`, `json`, `markdown` | Default output format |
| `defaults.minScore` | number | `0`–`100` | Minimum score for passing |
| `defaults.failOnStatuses` | string[] | `pass`, `warn`, `fail`, `not_applicable`, `error` | Statuses that cause failure |
| `init.framework` | string | `next`, `nuxt`, `astro`, `sveltekit`, `vite-react`, `vite-vue`, `express`, `hono` | Force framework detection |
| `init.preset` | string | `content-site`, `application` | Feature preset |
| `init.features` | string[] | `api-catalog`, `robots`, `sitemap`, `llms`, `markdown`, `mcp`, `agent-card`, `oauth-discovery`, `oauth-protected-resource` | Explicit feature list |
| `init.dryRun` | boolean | `true`, `false` | Preview without writing |
| `init.output` | string | `human`, `json`, `markdown` | Scaffold output format |
