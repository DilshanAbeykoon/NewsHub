---
name: predeploy
description: Pre-deploy gate for the AI news aggregator. Use before any Vercel deploy, or when the user says "ready to deploy", "ship it", or "is this safe to push". Runs build, lint, and a security review in sequence and blocks on any failure.
---

# Pre-deploy gate

Run this before pushing to Vercel. Stops at the first failure — do not proceed
past a failing step.

## Steps, in order
1. **Build** — run `npm run build`. Must complete with no errors. Type errors
   count as failures.
2. **Lint** — run `npm run lint`. Resolve real issues; don't blanket-disable
   rules to pass.
3. **Security review** — run `/security-review`, paying particular attention to:
   - `app/api/cron/route.ts` — confirm it requires the `CRON_SECRET` and returns
     401 when the `Authorization: Bearer <secret>` header is missing or wrong
     (CLAUDE.md §4).
   - All outbound fetches — timeouts present, errors caught, a failing source
     skipped not fatal (CLAUDE.md §7).
   - No secrets committed; `.env` is gitignored; only `.env.example` is tracked.
4. **Cron sanity** — confirm `vercel.json` has no sub-daily cron expression
   (Hobby tier rejects them at deploy — CLAUDE.md §2).

## Output
A pass/fail line per step. If everything passes, state it's safe to deploy and
give the deploy command. If anything fails, stop, show the failure, and fix it
before re-running — do not report success.
