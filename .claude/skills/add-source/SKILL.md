---
name: add-source
description: Add a new feed source to the AI news aggregator. Use when the user wants to add an RSS, Atom, or JSON feed to the project, or says something like "add this source" or "include feed X". Adds an entry to lib/sources.ts, wires a parser branch in lib/fetcher.ts only if the format is new, and verifies the feed returns valid normalized Articles before finishing.
---

# Add a feed source

Use this when adding a new source to the AI news aggregator. Follow CLAUDE.md
Sections 6 (data model) and 7 (sources).

## Inputs needed
- **Feed URL** (RSS, Atom, or JSON endpoint).
- **Category**: one of `research | industry | tools | discussion`.
- **Display name** (e.g. "Hugging Face"). If not given, infer from the domain
  and confirm.

If any are missing, ask once, concisely.

## Steps
1. **Verify the feed is live first.** Fetch the URL. Confirm it returns valid
   XML or JSON and contains items with at least a title, link, and date. If it's
   dead, redirects, or 404s, stop and report — do not add a broken source.
2. **Check the format.** If it's RSS or Atom, `rss-parser` already handles it —
   no parser changes needed. Only add a new parser branch in `lib/fetcher.ts`
   if the source returns a shape the existing code can't normalize (e.g. a
   bespoke JSON API).
3. **Add the entry** to `lib/sources.ts` — ideally a single declarative line:
   name, url, category, and (if needed) which parser branch handles it.
4. **Map to the Article shape** (CLAUDE.md §6). Ensure `publishedAt` is ISO 8601,
   `summary` is plain text with HTML stripped and trimmed, and `id` is the hash
   of the canonicalized URL. Populate `score` only if the source exposes one.
5. **Confirm graceful failure.** The new source must be wrapped so a fetch
   timeout or parse error logs and skips — never crashes the whole feed.
6. **Verify end to end.** Run the fetcher (or hit `/api/feed`) and confirm the
   new source's articles appear, correctly normalized. Report a sample item.

## Output
State the source added, its category, whether a new parser branch was needed,
and one normalized sample Article. If you had to skip it, say why.
