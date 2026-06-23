# AI Signal Desk

Curated AI news aggregator: research papers, industry posts, tools, and community discussion — one clean, scannable feed.

## Running locally

```bash
# 1. Install dependencies
npm install

# 2. Create your env file
cp .env.example .env.local
# Edit .env.local and set CRON_SECRET to any string

# 3. Start the dev server
npm run dev
# Open http://localhost:3000
```

## Deploying to Vercel

1. Push this repo to GitHub.
2. Import the repo in Vercel → **New Project**.
3. Add one environment variable: `CRON_SECRET` — a long random string. Generate one with:
   ```bash
   openssl rand -hex 32
   ```
4. Optionally set `NEXT_PUBLIC_BASE_URL` to your deployment URL (e.g. `https://ai-signal-desk.vercel.app`).
5. Deploy. Vercel reads `vercel.json` and schedules the daily warm-up cron automatically.

> **Hobby tier note:** The cron runs once per day (6 AM UTC). Fresh articles between runs arrive via stale-while-revalidate (30-min window) when users visit the feed.

## Project structure

```
app/
  page.tsx              # Server component — fetches & renders the feed
  layout.tsx            # Font wiring, metadata
  globals.css           # Design tokens (palette, surfaces, focus ring)
  api/
    feed/route.ts       # GET /api/feed — cached, normalized article JSON
    cron/route.ts       # GET /api/cron — daily cache warm-up (auth required)
components/
  Header.tsx            # Sticky header + dark/light toggle
  FilterBar.tsx         # Category pills + search input
  FeedCard.tsx          # Single article card with category color stripe
  FeedClient.tsx        # Client wrapper — filtering state + grid layout
lib/
  types.ts              # Article and Category types
  sources.ts            # Feed source list (add/remove sources here)
  fetcher.ts            # Fetch, parse, normalize, dedup, cache
vercel.json             # Daily cron schedule
.env.example            # Required env vars
```

## Adding a source

Edit `lib/sources.ts` — add one entry with `name`, `url`, `category`, and `format`. If the format is new (not `rss`, `atom`, or `hn-algolia`), add a parser branch in `lib/fetcher.ts`. Run `/check-feeds` to verify the new URL is live.

## Design tokens

| Token               | Light                  | Dark                   |
|---------------------|------------------------|------------------------|
| Background          | `hsl(0 0% 98%)`        | `hsl(222 47% 7%)`      |
| Card surface        | `hsl(0 0% 100%)`       | `hsl(222 47% 10%)`     |
| Research accent     | Indigo `#6366f1`       | same                   |
| Industry accent     | Emerald `#10b981`      | same                   |
| Tools accent        | Amber `#f59e0b`        | same                   |
| Discussion accent   | Rose `#f43f5e`         | same                   |

Fonts: **Inter** (body) + **Geist Mono** (meta labels / monospace UI).
