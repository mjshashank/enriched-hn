# Enriched HN

A browser extension that enhances Hacker News with AI-powered metadata. See topics, content types, and tags for every story at a glance.

## Features

- **Topic Classification** - Automatically categorizes stories (AI/ML, Programming, Security, etc.)
- **Content Type Detection** - Identifies article types (Tutorial, News, Discussion, etc.)
- **Smart Tags** - Extracts relevant keywords and technologies
- **Filtering** - Filter stories by topic, type, or technical depth
- **Privacy-First** - Only public story IDs are sent to the API, no personal data

## Architecture

```
┌─────────────────┐
│ Hacker News     │
│ (Public API)    │
└────────┬────────┘
         │
         v
┌─────────────────────────────┐
│ Cloudflare Worker (Cron)    │
│ - Scheduled: Fetch top HN   │
│ - Queue: Enrich stories     │
│ - AI: Google Gemini         │
└────────┬────────────────────┘
         │
         v
┌──────────────────────────────┐
│ Cloudflare KV Store          │
│ (Enriched story cache)       │
└────────┬─────────────────────┘
         │
         v
┌──────────────────────────────┐
│ Cloudflare Worker (API)      │
│ - REST endpoints             │
│ - Cache control headers      │
└────────┬─────────────────────┘
         │
         v
┌─────────────────┐
│ Browser         │
│ Extension       │
└─────────────────┘
```

## Self-Hosting

This project requires you to deploy your own backend infrastructure.

### Prerequisites

- Node.js 18+
- pnpm
- Cloudflare account
- Google AI API key (for Gemini)

### 1. Clone and Install

```bash
git clone https://github.com/your-username/enriched-hn.git
cd enriched-hn
pnpm install
```

### 2. Deploy Backend

#### Create Cloudflare Resources

```bash
# Copy example configs
cp packages/api/wrangler.example.jsonc packages/api/wrangler.jsonc
cp packages/cron/wrangler.example.jsonc packages/cron/wrangler.jsonc

# Create KV namespace
npx wrangler kv:namespace create HN_ENRICHED_DATA
```

Copy the `id` from the output and update both `wrangler.jsonc` files, replacing `YOUR_KV_NAMESPACE_ID`.

#### Set Secrets

```bash
# Set your Google AI API key
npx wrangler secret put GOOGLE_GENERATIVE_AI_API_KEY -c packages/cron/wrangler.jsonc
```

#### Deploy Workers

```bash
pnpm deploy
```

This deploys both the API and cron workers to Cloudflare.

### 3. Build Extension

The extension uses an environment variable to set the API endpoint at build time:

```bash
# Build with your API endpoint
cd extension
VITE_API_ENDPOINT=https://your-api.workers.dev npm run build
```

Or load it unpacked for development:
- Go to `chrome://extensions`
- Enable "Developer mode"
- Click "Load unpacked"
- Select the `extension/dist` folder

### 4. GitHub Actions (CI/CD)

A workflow is included at `.github/workflows/build-extension.yml` that:
- Builds on every push to main
- Creates releases when you push a tag (e.g., `git tag v1.0.0 && git push --tags`)

**Setup:** Add your API endpoint as a repository secret named `API_ENDPOINT`.

## Development

### Local Development

```bash
# Run API and cron workers locally
pnpm dev

# Run extension in dev mode (separate terminal)
pnpm dev:extension

# Trigger cron job manually
pnpm trigger:cron
```

### Project Structure

```
enriched-hn/
├── packages/
│   ├── shared/     # Shared types, schemas, constants
│   ├── api/        # REST API (Cloudflare Worker)
│   └── cron/       # Scheduled enrichment (Cloudflare Worker)
├── extension/      # Chrome browser extension
└── web/            # Web dashboard (Next.js)
```

### Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Run all workers locally |
| `pnpm dev:api` | Run API worker only |
| `pnpm dev:cron` | Run cron worker only |
| `pnpm dev:extension` | Run extension in dev mode |
| `pnpm build:extension` | Build extension for production |
| `pnpm deploy` | Deploy workers to Cloudflare |
| `pnpm test` | Run tests |
| `pnpm typecheck` | Type check all packages |

## Privacy

The extension only sends public Hacker News story IDs to the API. No personal data is collected or transmitted. See [extension/PRIVACY.md](extension/PRIVACY.md) for details.

## License

MIT
