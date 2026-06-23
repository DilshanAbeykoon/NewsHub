# CLAUDE.md

Project guide for Claude Code. Read this fully before making changes. Keep it
up to date — when an architectural decision changes, edit this file in the same
PR.

---

## 1. What this project is

An **AI news & research aggregator**. It pulls from many free sources (research
papers, industry blogs, community discussion) into one clean, fast, scannable
feed. Think *curated dashboard*, not generic news site.

**Goals, in priority order:**
1. Attractive, highly readable UI — scanning the feed should feel effortless.
2. Broad coverage of AI developments: research, industry, tools, discussion.
3. Fast and cheap — stays entirely within free tiers.

---

## 2. Hard constraints — do not violate

- **No paid APIs.** Only free, keyless (or free-tier) sources. If a feature
  seems to need a paid service, stop and flag it instead of adding it.
- **Hosts on Vercel Hobby (free) tier.** Everything must run inside one Next.js
  deployment. No separate backend server.
- **Vercel Hobby cron runs once per day, max.** Any cron expression more
  frequent than daily *fails at deploy time*. Do not add sub-daily crons. Near
  real-time freshness comes from on-demand revalidation (see Architecture), not
  from frequent cron.
- **Non-commercial.** Hobby tier is personal/portfolio use only. Don't add
  monetization without first moving the plan to Vercel Pro.

---

## 3. Tech stack (locked)

| Concern        | Choice                                                  |
|----------------|---------------------------------------------------------|
| Framework      | Next.js (App Router) + TypeScript                       |
| Styling        | Tailwind CSS                                            |
| Feed parsing   | `rss-parser` (handles both RSS and Atom — covers arXiv) |
| Caching layer  | Next.js Data Cache (`unstable_cache` + `revalidate`)    |
| Scheduling     | Vercel Cron (one daily warm-up job)                     |
| Runtime        | Node.js runtime for API routes (NOT Edge — rss-parser needs Node APIs) |
| Persistence    | **None for MVP.** Supabase is the planned upgrade only. |

Don't introduce new dependencies without a clear reason. Prefer the standard
library and the stack above.

---

## 4. Architecture — "backend inside the frontend"

```
Browser ──> /api/feed ──> cached aggregator ──> [arXiv, Hacker News, RSS blogs]
                              ^
            daily Vercel cron warms this cache (/api/cron)
```

Key rules:

- **The browser only ever calls `/api/feed`.** It never fetches a source feed
  directly. The server does all outbound fetching. This is what avoids CORS and
  protects the sources.
- **Freshness = revalidation, not polling.** Wrap the aggregator in
  `unstable_cache` with `revalidate: 1800` (30 min). A request after the window
  triggers a background refresh (stale-while-revalidate). This is the
  "on-demand refresh."
- **Cron is only a warm-up.** `/api/cron` runs once daily to keep the cache from
  being cold first thing in the morning. It must be secured with `CRON_SECRET`
  (compare the `Authorization: Bearer <secret>` header; return 401 otherwise).
- **Cache must survive cold starts.** Use the Next Data Cache, not module-level
  in-memory variables — serverless invocations don't share memory reliably.

---

## 5. Project structure

```
ai-news-hub/
├─ app/
│  ├─ page.tsx            # the feed UI (server component where possible)
│  ├─ layout.tsx
│  ├─ globals.css
│  └─ api/
│     ├─ feed/route.ts    # serves cached, normalized JSON
│     └─ cron/route.ts    # daily warm-up, CRON_SECRET-protected
├─ lib/
│  ├─ types.ts            # the single normalized Article shape
│  ├─ sources.ts          # editable list of feeds + categories
│  └─ fetcher.ts          # fetch + parse + normalize + dedup (cached here)
├─ components/
│  ├─ FeedCard.tsx
│  ├─ FilterBar.tsx
│  └─ Header.tsx
├─ vercel.json            # the daily cron schedule
└─ .env.example           # CRON_SECRET
```

Keep all source-specific parsing inside `lib/fetcher.ts`. Components stay
presentational; they receive `Article[]` and render — no fetching in components.

---

## 6. Data model

Every source normalizes into ONE shape. Add fields here, never per-source shapes.

```ts
type Category = "research" | "industry" | "tools" | "discussion";

interface Article {
  id: string;          // stable hash of canonical url (used for dedup + keys)
  title: string;
  url: string;
  source: string;      // e.g. "arXiv", "Hacker News", "Hugging Face"
  category: Category;
  publishedAt: string; // ISO 8601
  summary?: string;    // short, plain-text, trimmed of HTML
  score?: number;      // HN points / citation signal, when available
}
```

Dedup by `id` (canonicalize the URL first: strip tracking params, trailing
slash, lowercase host). Sort newest-first by `publishedAt`.

---

## 7. Data sources (free, keyless)

Defined in `lib/sources.ts`. Current set:

- **arXiv API** — categories `cs.AI`, `cs.LG`, `cs.CL`, newest first.
  Atom XML → parse with `rss-parser`. → category `research`.
- **Hacker News (Algolia Search API)** — keyless JSON, query for AI / LLM /
  machine learning, `tags=story`. Carries `points` → `score`. → `discussion`.
- **RSS blogs** — industry sources (OpenAI, Google DeepMind, Hugging Face, MIT
  Tech Review AI, etc.). → `industry` or `tools`.

> ⚠️ **Feed URLs need live verification.** They were not reachable from the
> environment where this project was scaffolded, and blog RSS endpoints change
> over time. Before trusting a source, hit its URL and confirm it returns valid
> XML/JSON. A dead source must fail gracefully (log + skip), never crash the
> whole feed. See the `/check-feeds` command below.

Adding a source should be a one-line entry in `sources.ts` plus, only if its
format is new, a parser branch in `fetcher.ts`.

**Current product decisions (defaults — change here if revisited):**
- Feed is **balanced** across research / industry / discussion (not
  research-weighted).
- **No database** in the MVP; Supabase is a later add-on for history + trending.

---

## 8. Design direction

Avoid the generic AI-generated look (cream + serif + terracotta; near-black +
acid accent; broadsheet hairlines). Direction for this project:

- **"Editorial signal desk"** — clean, high-readability, strong type hierarchy.
- **Signature element: color-coded source categories.** Each category has its
  own hue so the feed is scannable by *type* at a glance. This is where the
  visual identity lives — keep everything else quiet around it.
- Light + dark themes. Generous whitespace. Readability comes from typography
  and spacing discipline, not decoration.
- Quality floor: responsive to mobile, visible keyboard focus, respects
  `prefers-reduced-motion`.

Lock the exact palette and font pairing in `globals.css` / Tailwind config and
note the choices here once set.

---

## 9. Commands

```bash
npm run dev      # local dev server
npm run build    # production build — must pass before any deploy
npm run lint     # eslint
npm run start    # run the production build locally
```

Always run `npm run build` and `npm run lint` before declaring work done.

---

## 10. Conventions & guardrails

- TypeScript strict. No `any` unless justified in a comment.
- API routes: `export const runtime = "nodejs"`. Never Edge (rss-parser).
- Every outbound fetch: timeout + try/catch; a failing source is skipped, not
  fatal.
- Empty/error states are real UI, not afterthoughts: tell the user what
  happened and what to do (see the design skill's writing guidance).
- Secrets only via env vars (`CRON_SECRET`). Never commit `.env`.
- Don't add analytics, tracking, or third-party scripts without asking.

---

## 11. Claude Code playbook for this repo

### Useful built-in commands
- `/init` — only if regenerating project context; this file already exists, so
  prefer editing it over regenerating.
- `/security-review` — run before every deploy, especially on `api/cron`
  (auth check) and any outbound fetch handling.
- `/code-review` — run on diffs before merging.
- `/plugin` — browse/install plugins and marketplaces.

### MCP servers worth connecting
Configure project-scoped servers in `.mcp.json` (each needs approval on first
use). Check current install details via `/plugin` or the Claude Code docs —
exact package names/URLs change.
- **Vercel MCP** — inspect deployments, env vars, build logs, and cron status
  directly. High value here since hosting + cron limits drive the architecture.
- **Supabase MCP** — connect *when* the persistence upgrade begins (schema,
  queries). Not needed for the MVP.
- **Playwright / browser MCP** — drive the running app to verify the feed UI,
  dark mode, and responsive layout. Pairs well with the design goals.
- **context7 (or equivalent docs MCP)** — pull up-to-date Next.js / Vercel /
  rss-parser docs instead of relying on possibly-stale memory.
- **GitHub MCP** — PRs, issues, and CI status if the repo lives on GitHub.

### Custom commands worth adding (`.claude/skills/<name>/SKILL.md`)
Custom slash commands now live as skills; `.claude/commands/*.md` still works,
but skills are preferred and take precedence on name clash.
- **`/add-source`** — given a feed URL + category, add an entry to
  `sources.ts`, wire a parser branch if the format is new, and verify it
  returns valid data.
- **`/check-feeds`** — fetch every source in `sources.ts`, report which return
  valid XML/JSON vs. dead/changed, so the source list stays trustworthy.
- **`/predeploy`** — run `npm run build`, `npm run lint`, and `/security-review`
  in sequence; block on any failure.

### Workflow notes
- For multi-file features (e.g. adding a whole new source category end to end),
  consider a subagent to keep the main context clean.
- Treat this file as the source of truth. If you make a decision that
  contradicts it, update Section 2–8 in the same change rather than letting the
  code and the doc drift.
