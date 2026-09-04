# Loopi — The sovereign analyst

Loopi scores Web3 campaigns (bounties, grants, quests) by expected ROI so creators and farmers can find the highest-return, lowest-effort opportunities without manual scouting.

The system continuously scrapes popular campaign sources, deduplicates and scores them (0–100) using four signals: expected reward per entry (EV), effort, timing (competition density vs time remaining), and founder trust.

### Stack
- **Language(s):** TypeScript (primary), CSS, small JS
- **Framework / runtime:** Next.js 14 (App Router) + React 18
- **Notable libraries / services:** Supabase (DB), Google GenAI (Gemini) for effort classification, Tailwind CSS, Playwright (tests), @privy-io/react-auth (wallet/auth), @farcaster/mini-app-solana (integrations)

## How it's organized

Top-level layout (important entries):

```
app/                Next.js App Router pages and layout (UI entry points)
  (dashboard)/      App-area groups (admin/dashboard routes)
  api/              API routes (cron endpoints, webhooks)
  page.tsx          Public homepage UI
components/         Reusable React components (TopBar, Sidebar, ConnectButton, cards)
lib/                Server-side logic: aggregator, classifier, scrapers, supabase helpers
public/             Static assets (images, icons)
run-aggregator.ts   CLI helper to invoke the aggregator (used for manual runs/backfill)
script.ts           miscellaneous scripts
package.json        dependencies and npm scripts
README.md           (this file)

```

How it fits together:
- The aggregator (lib/aggregator.ts) fetches campaigns from Superteam Earn, Galxe, WizzHQ, Questn, Dework and scrapers, deduplicates by source_url and inserts new records into Supabase.
- Each new campaign is auto-classified for effort by the classifier (lib/classifier.ts) which calls Google GenAI (Gemini) and then dimension scores (reward EV, timing, founder trust) are computed before a final 0–100 score is stored.
- The Next.js app (app/ + components/) surfaces the scored feed, admin UI, and user-facing pages. Supabase is used for persistence and user/session handling.

## How to run it

1. Create a .env file (or fill .env.example) with at least the following variables:

- NEXT_PUBLIC_SUPABASE_URL (Supabase project URL)
- SUPABASE_SERVICE_ROLE_KEY (Supabase service role key used by server code)
- GEMINI_API_KEY (API key used by Google GenAI / Gemini)
- SUPERTEAM_API_URL (optional — override the Superteam REST endpoint)

2. Install dependencies and run locally:

```bash
# using pnpm (recommended)
pm install
pnpm dev

# or with npm/yarn
npm install
npm run dev
```

3. Build & start for production:

```bash
pnpm build
pnpm start
```

4. Running the aggregator manually (for testing/backfill):

- The aggregator is exposed in lib/run-aggregator.ts and is normally triggered by a Vercel cron (every 6 hours). To run locally you can execute the helper script or call the exported function in a small runner. Example (when using ts-node):

```bash
# install ts-node if needed
pnpm add -D ts-node
pnpm ts-node run-aggregator.ts
```

Notes:
- The project expects to run the aggregator on a serverless schedule (vercel.json crons). See lib/aggregator.ts for details and environment overrides (SUPERTEAM_API_URL).
- The classifier uses GEMINI_API_KEY — set it to a valid Google GenAI key.

## Relevant files to review quickly
- lib/aggregator.ts — fetch, dedupe, score, insert campaigns
- lib/classifier.ts — Gemini-based effort classifier and batch reclassifier
- lib/scrapers.ts, lib/sources.ts — site-specific scraping/parsers
- lib/schema.sql — DB schema used by Supabase
- app/page.tsx + components/* — frontend UI and feed

## Try asking
- "Can you add a short troubleshooting section for Supabase auth failures and which keys are required?"
- "Please add a vercel.json example that configures the 6-hour cron for /api/cron/aggregate."
- "Should we add a CONTRIBUTING.md and a script to run the classifier in batch for backfills?"

---

If you'd like, I can commit this README update now (I can also include a vercel.json cron example or expand the environment variable documentation).