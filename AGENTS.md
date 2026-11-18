<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Boola Market

Foundation app for a Yale student marketplace. Read `README.md` before adding a feature.

- Routes in `src/app` stay thin. Put feature code in `src/features/<name>`.
- Local data is `data/store.json`, seeded from `src/lib/db/seed.ts`. The Postgres shape is `db/migrations/001_init.sql`.
- Do not wrap store reads in `use cache` unless mutations also invalidate that cache. Pages read inside `<Suspense>` because `cacheComponents` is on.
- Auth accepts only `@yale.edu`. Mock magic links are the default. Do not weaken that check.
- Plug-in map: auctions, messages, reviews, orders, delivery, move-out, assistant. Each folder has an `index.ts` describing the entry file.
