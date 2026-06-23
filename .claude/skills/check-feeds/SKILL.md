---
name: check-feeds
description: Verify every feed source in lib/sources.ts is live and returns valid data. Use before trusting the source list, before a deploy, when the feed looks empty or stale, or when the user asks to check or audit the sources. Fetches each source, reports which are healthy vs dead or changed, and proposes fixes.
---

# Check feed health

Audits every source in `lib/sources.ts`. See CLAUDE.md Section 7 — feed URLs
drift over time and were never verified at scaffold time, so this keeps the
source list trustworthy.

## Steps
1. Read all sources from `lib/sources.ts`.
2. For each source, fetch its URL with a short timeout. Determine:
   - **Healthy** — returns valid XML/JSON with parseable items that map to the
     Article shape.
   - **Empty** — reachable but no items (possible URL change or wrong endpoint).
   - **Dead** — 404, timeout, redirect to an unrelated page, or unparseable.
3. Do the checks concurrently where reasonable; don't let one slow feed stall
   the whole audit.

## Output
A compact table: source name, category, status, and item count. For anything
not healthy, add a one-line suggested fix (e.g. "RSS path moved — try
/blog/rss.xml", "consider dropping", "switch to Atom endpoint"). Do **not** edit
`sources.ts` automatically unless the user asks — this command reports; fixing
is a separate, explicit step.
