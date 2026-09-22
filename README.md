# Shanai & Rhea — Wedding Wardrobe Planner

A small site for the wedding in Rajasthan, March 2027. Guests enter their body
measurements once, see their size at Mumbai stores, and pick a look for each event.
The couple sees everyone's sizes and picks in a passcode-protected admin and exports a
CSV. The site never places orders with any store.

Why it exists: Tasva ships within India only and Fabindia's own site mostly does not
ship abroad, so guests flying in cannot simply order online. The couple reserves or buys
in Mumbai from this data, or guests walk into the right store with a clear list.

## What is in it

- `/` — how it works, the events with dress codes, the stores.
- `/register` — guest form (cm or inches), server-side validation.
- `/me/<token>` — private planner: computed sizes per brand, look cards per event,
  status per event, notes, edit and delete.
- `/stores` — verified Mumbai addresses, shipping and alteration policies, the brand
  size charts with their sources.
- `/admin` — guests table, filters, per-event summaries, CSV export, event and look
  editing. Protected by `ADMIN_PASSCODE`.

Evidence for every price, address, chart row and policy: `docs/SOURCES.md`.
The spec the build was executed against: `docs/BUILD_PROMPT.md`.

## Run locally (no accounts needed)

1. Install Node.js 22 or newer.
2. In a terminal, run `npm install` in this folder. Expected: it ends with
   "added N packages".
3. Run `npm run dev`. Expected: "Ready" and a URL such as http://localhost:3000.
4. Open that URL. Expected: the home page with five events listed.
5. Open http://localhost:3000/admin and enter the passcode `shanai-rhea` (the local
   default). Expected: the empty guests table.

The local database is PGlite, stored under `.data/`. Delete that folder to reset.

## Checks

```
npm run lint        # eslint
npm run typecheck   # tsc
npm run test        # vitest: size engine
npm run build       # migrate + seed, then next build
npm run e2e         # playwright, needs `npm run build` first
```

## Deploy to Vercel with Neon Postgres (the couple does this once)

Prerequisites: this repository on GitHub, a free Vercel account, a free Neon account.
The Neon free plan and the Vercel Hobby plan are enough for a few hundred guests.

1. Open https://vercel.com/new and sign in with GitHub. Expected: a list of your
   repositories.
2. Click **Import** next to `ClothesandSize`. Expected: the "Configure Project" page
   with Framework Preset showing "Next.js".
3. Leave Build Command and Output Directory at their defaults. The `build` script
   already runs the database migration and seed before `next build`.
4. Expand **Environment Variables**. Add `ADMIN_PASSCODE` with a passcode of your
   choosing (at least 12 characters; you will type it at /admin). Add `ADMIN_SECRET`
   with any long random string. Expected: two rows listed.
5. Click **Deploy**. Expected: the first build **fails** with
   `db-setup failed` or a database connection error. That is expected; the database
   does not exist yet.
6. In the Vercel project, open the **Storage** tab and click **Create Database** →
   **Neon** (Postgres). Accept the defaults and click **Create**, then **Connect** to
   this project for all environments. Expected: `DATABASE_URL` now appears under
   Settings → Environment Variables.
7. Open the **Deployments** tab, open the failed deployment's menu (⋯) and click
   **Redeploy**. Expected: the build log shows
   `db-setup: Neon database migrated and seeded.` and the deployment turns green.
8. Click **Visit**. Expected: the home page with five events.
9. Go to `/admin` on that URL and enter your `ADMIN_PASSCODE`. Expected: the empty
   guests table.
10. Optional: Settings → Domains → add your own domain, then share
    `https://<your-domain>/register` with guests.

Redeploys never overwrite events, stores or looks you edited in the admin: seeding
only inserts rows that are missing.

### Change the events, dates and looks

- Events (names, dates, dress codes): `/admin/events`.
- Looks (option cards, links, prices): `/admin/looks`.
- Stores (addresses, policies): edit `src/data/seed.ts`, then `git push`. New
  stores are inserted on the next deploy; existing ones are left as they are.

### Add a brand size chart

Only add a chart copied from the brand's own site, with both its inch and cm tables
(`src/lib/sizeCharts.ts`), and add the source URL to `docs/SOURCES.md`. Then point
the store at it with `sizeChartMen` / `sizeChartWomen` in `src/data/seed.ts`.
See `docs/lessons/` for why both unit tables are required.

## Stack

Next.js 16 (App Router, Server Actions), TypeScript, Tailwind 4, Drizzle ORM,
zod 4. Postgres on Neon in production; PGlite locally. Vitest and Playwright.
