# ClothesandSize — project conventions

Wedding wardrobe planner for Shanai & Rhea (March 2027, Rajasthan). Guests submit
measurements and per-event outfit choices; the couple reviews and exports them. The
site never places orders with any store.

## Spec and evidence
- `docs/BUILD_PROMPT.md` is the spec. Change requirements there first.
- `docs/SOURCES.md` is the evidence trail. Any price, address, size row or policy
  shown in the UI must have a row there, or render with a visible "confirm" marker.
  Never invent a measurement table.
- `docs/lessons/` holds one lesson per file, one-line summary at the top. Update an
  existing note rather than duplicating; delete notes that prove wrong.

## Stack
- Next.js 16 App Router, TypeScript, Tailwind 4, Drizzle ORM, zod 4.
- Database: Neon Postgres over HTTP when `DATABASE_URL` is set; PGlite (file-backed
  under `.data/`) otherwise. `src/db/client.ts` is the only place that decides.
- Migrations: `drizzle-kit generate` → committed under `drizzle/`. Applied by
  `npm run db:setup` (migrate + idempotent seed); it no-ops when no DB is reachable.
- Events, stores and looks are data (seeded from `src/data/`), never hard-coded copy.

## Commands
- `npm run dev` — local, zero external services.
- `npm run lint`, `npm run typecheck`, `npm run test` (vitest), `npm run e2e`
  (Playwright, uses the pre-installed Chromium), `npm run build`.

## Git
- Work directly on `main`. No pull requests, no feature branches (owner's decision,
  2026-09-22). Commit with a clear message and push `main`.

## Rules
- Server Components by default; client components only where interaction needs it.
- Prices in INR only.
- Commit tests only for the size engine and the e2e path.
- Deployment is by the couple, following README "Deploy" steps; never deploy or
  create cloud resources from a session.
