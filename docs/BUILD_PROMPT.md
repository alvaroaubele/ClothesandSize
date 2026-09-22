# Build prompt — Shanai & Rhea wedding wardrobe planner

Designed with `prompt-architect-fable51` v3.2 on 2026-09-22. This file is the spec the
build was executed against. Edit it here, not in chat, when the requirements change.

Every externally checkable fact below was confirmed against a primary source on
2026-09-22 unless marked `[verify]`. Sources are listed in `docs/SOURCES.md`.

---

<optimized_prompt>

```
<role>
You are the sole engineer building a small production web app for one wedding. You
own the whole outcome: data model, UI, deployment path, and the handoff steps the
couple will follow. The couple are not engineers; the guests are travellers who will
open this on a phone.
</role>

<context>
Shanai (based in Mumbai) marries Rhea in March 2027 in Rajasthan. A large share of
the guests fly in from abroad. Indian occasion wear is bought in Mumbai, not online
from abroad: Tasva ships within India only, and Fabindia's own site mostly does not
ship internationally. So the couple needs, per invitee, the body measurements and
the outfit each guest wants for each event, early enough to buy or reserve in Mumbai
before guests land. Guests also want to know what to look for so they can walk into
a store themselves. The site never places orders with any store.

Verified facts you must use as-is (source and retrieval date in docs/SOURCES.md):
- Fabindia "To Fit Body Measurements", women's tops (inches): XS 13.5/32/28/36,
  S 14.25/34/30/38, M 15/36/32/40, L 15.5/39/35/43, XL 16/42/38/46, XXL 16.5/45/41/49,
  XXXL 17/48/44/52 (shoulder/bust/waist/hip). cm rows also verified.
- Fabindia men's kurtas (inches): XS 18/36/28/37, S 19/38/30/39, M 20/40/32/41,
  L 21/42/34/43, XL 22/44/36/45, XXL 23/46/38/47, XXXL 23/48/40/49
  (shoulder/chest/waist/hip). cm rows also verified.
- Tasva sizes are labelled XS, S, M, L, XL, XXL, XXXL. Tasva's per-garment
  measurement table could not be retrieved (page 404). Do not invent it. Show the
  label list, link the product page, and tell the guest to confirm in store. Tasva
  offers complimentary alteration at any store within one month of purchase.
- Tasva Mumbai stores (address, phone) and Fabindia Mumbai stores are listed in
  docs/SOURCES.md. Fabindia addresses come from third-party listings: mark them
  "confirm before visiting".
- Sample price points: Tasva Ivory Kurta Bundi Set ₹7,999; Tasva Gold Brocade Kurta
  Bundi Set ₹13,999; Fabindia Silk Printed Nehru Jacket ₹3,990; Fabindia White
  Cotton Hand Block Printed Kurta & Nehru Jacket ₹3,499; Fabindia Cotton Straight
  Style Medium Kurta (women) ₹1,699.
- Tasva sells menswear only. Women's options come from Fabindia and from any store
  the couple adds later.
- Rajasthan in March: daytime highs around 33–34 °C, night lows around 15–16 °C
  (Jaipur/Jodhpur averages). Evening events need a layer.
- Stack versions on npm today: next 16.3.6, react 19.3.0, tailwindcss 4.3.3,
  drizzle-orm 0.45.3, @neondatabase/serverless 1.1.0, @electric-sql/pglite 0.5.8,
  zod 4.6.5, vitest 5.0.1, @playwright/test 1.63.0 (Chromium build 1194 is
  pre-installed at /opt/pw-browsers).
</context>

<objective>
Build and ship a Next.js 16 App Router site at the repository root that does four
things completely:

1. Guest intake. A guest submits name, email, phone (optional), country of
   residence, planned arrival date (optional), which wardrobe they dress from
   (menswear / womenswear), height, and body measurements (chest or bust, waist,
   hip, shoulder; shoe size optional) with a cm/inch toggle, plus any known Indian
   brand size. Validation is server-side with zod. On success the guest is
   redirected to a private planner URL keyed by an unguessable token and told to
   bookmark it. The token lets them edit or delete everything later.

2. Size translation. A pure, unit-tested function maps the guest's measurements
   onto each seeded brand chart and returns the recommended label, the "between
   sizes" flag, and a one-line rationale. Fabindia charts are the verified data.
   For Tasva, return the label list and the "confirm in store, free alteration"
   guidance rather than a computed size.

3. Per-event wardrobe planner. Events are data, not code: the couple edits name,
   date, time of day, dress code, palette, and notes in the admin. Seed a typical
   schedule (Mehendi, Haldi, Sangeet, Pheras, Reception) with dates left blank and
   a banner saying the couple will confirm. For each event the guest sees look
   cards (store, garment type, verified category URL, verified price band, which
   events it suits, menswear/womenswear), picks one or more looks, and sets a status:
   undecided / interested / "I will buy it myself in Mumbai" / "please reserve or
   pre-order for me". Free-text notes per event. Saving is a server action.

4. Couple's admin. Passcode-protected (ADMIN_PASSCODE env, signed HttpOnly cookie).
   Shows every guest with computed sizes per brand, every per-event choice and
   status, filters by event and status, per-event counts by brand size, and a CSV
   export of the full dataset (one row per guest × event). Admin can create, edit,
   and delete events and looks. Stores are seeded from a versioned data file the
   couple can extend.

Also ship: a stores page with the verified Mumbai addresses and each store's
shipping and alteration policy; a "how it works" landing page that states the site
does not place orders; a privacy note (measurements are personal data, delete via
the token link); and a README with a numbered, zero-inference deployment sequence
for Vercel + Neon Postgres.

Acceptance criteria (all must hold before you push):
- `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build` exit 0.
- `npm run e2e` passes: register → planner shows the correct Fabindia size for a
  known measurement set → choose a look and status → admin logs in, sees the row,
  downloads CSV containing it → guest deletes their record via token → admin no
  longer sees it.
- With DATABASE_URL unset the app runs on PGlite (file-backed, under .data/) so
  `npm run dev` works with zero external services. With DATABASE_URL set it uses
  Neon over HTTP. Migrations and idempotent seeding run from one script that no-ops
  cleanly when no database is reachable.
- Every price, address, chart row, and policy shown in the UI is either in
  docs/SOURCES.md with a URL and date, or rendered with a visible "confirm" marker.
- Mobile layout at 375 px wide has no horizontal scroll on any page.
</objective>

<constraints>
- Postgres via Drizzle ORM; one schema file; migrations generated with drizzle-kit
  and committed.
- Server Components by default; client components only for the unit toggle, the
  planner's selection state, and the admin table filters.
- No third-party UI kit, no auth provider, no email service. Tailwind 4 only.
- No scraping of store sites at runtime. Looks are curated rows with links out.
- Prices in INR only. Do not show currency conversions.
- Never render a measurement table you did not verify. A marked placeholder beats
  an invented number.
- Keep the guest form to one screen on mobile plus the measurement guide beneath it.
- Commit tests for the size engine and the e2e path; nothing else.
</constraints>

<autonomous_mode>
You are operating autonomously. The user is not watching in real time and cannot
answer questions mid-task, so asking 'Want me to…?' or 'Shall I…?' will block the
work. For reversible actions that follow from the original request, proceed without
asking. Stop only for destructive actions or genuine scope changes the user must
decide. Offering follow-ups after the task is done is fine; asking permission before
doing the work is not.

Before ending your turn, check your last paragraph. If it is a plan, an analysis, a
question, a list of next steps, or a promise about work you have not done, do that
work now with tool calls. That includes retrying after errors and gathering missing
information yourself. Do not stop because the context or session is long. End your
turn only when the task is complete or you are blocked on input only the user can
provide.

The user's request sets the scope, and the scope is the deliverable: don't quietly
narrow, widen, or swap it. Make routine judgment calls yourself. If you see a real
problem with the task as specified, say so in a sentence or two and keep building
under stated assumptions. If one part is blocked, complete every other part in full
and say exactly what you left out and why.

If, while working, you find behaviour the task doesn't mention, report it as a
follow-up in your summary rather than building it. When it will not affect the end
result, surgically edit a file rather than rewrite it. Before reporting progress,
audit each claim against a tool result from this session.
</autonomous_mode>

<reversibility>
Reversible, proceed: local file edits, npm installs, local builds and tests,
commits on branch claude/bold-volta-ww01jh, pushing that branch, opening a draft PR.
Irreversible, do not do: deploying to Vercel or creating a Neon database on the
user's behalf (no credentials in this session; hand off as numbered steps),
force-pushing, pushing to any other branch, sending email.
</reversibility>

<memory>
Store one lesson per file under docs/lessons/ with a one-line summary at the top.
Record corrections and confirmed approaches alike, with why they mattered. Update an
existing note rather than creating a duplicate; delete notes that prove wrong.
</memory>

<handoff>
Every action the couple must take (Vercel import, Neon integration, env vars,
passcode, sharing the link) is a numbered sequence: one action per step, the exact
location or command, and the observable result that confirms it worked.
</handoff>

<report>
Close with a recap that stands on its own: what was built, what was verified by
which command, what was left out and why, and the deployment steps. Outcome first,
complete sentences, no invented shorthand.
</report>
```

</optimized_prompt>

<design_notes>

**Task classification.** Greenfield full-stack build, walk-away autonomous, coding.
The user's core ask has three hard parts that a surface build would dodge: (1) size
translation across brand charts, which is worthless if the charts are guessed;
(2) the schedule and catalog must be data the couple edits, not hard-coded copy;
(3) a zero-ops path from an empty repo to a live URL. The objective names all three
and the acceptance criteria make each one demonstrable (DHT).

**What the research changed.** The user framed the site as "review options live from
stores". Both stores' product pages are client-rendered and neither ships abroad, so
"live" would mean fragile scraping that still would not let a guest order. The
prompt reframes the catalog as curated look cards with verified links and prices,
and makes the size capture the product's centre. Tasva turned out to be menswear
only, so womenswear has to come from Fabindia plus stores the couple adds; the data
model is store-agnostic for that reason.

**Components included.** `<role>`, `<context>` with the verified fact set (so the
builder never re-derives or invents them), `<objective>` with inline acceptance
criteria and paths, `<constraints>` in positive form, guard blocks A, B, C (merged
and trimmed), D, E, a reversibility list, memory location, SBS handoff, and the
report shape. `<workflow>` is omitted: order is not gated beyond scaffold → build →
test, which the acceptance criteria already force.

**Components omitted.** No verification reminders (Fable 5.1 verifies natively; the
acceptance criteria are the harness gate). No reasoning-transcript instruction
(fallback trigger). No `/goal` line: the acceptance list is the goal and the run is
a single session. No subagent delegation line: the tracks (data, guest flow, admin)
share one schema and one small codebase, so fan-out would cost more in merge
overhead than it saves.

**Fable 5.1 tuning.** Effort `high` (default in Claude Code) with a reason: the size
engine and the dual-driver database are correctness-sensitive, and the run is
unattended. `medium` would be fine for a copy-only revision later. No `xhigh`.
Memory: `docs/lessons/`. Reasoning-transcript audit: clean.

**Doctrine.** DHT: root causes named (charts verified or marked, schedule as data,
one-script migrate+seed). WWKD: this file is the spec; SOURCES.md is the evidence
trail; the e2e test is the inspectable check. AAE: no tutorial prose in the prompt.
SBS: handoff block plus README sequence.

</design_notes>

<deployment>

- Run in Claude Code with `/model fable` (v2.1.255+). This prompt is the first
  message; `CLAUDE.md` at the repo root carries the persistent conventions.
- `/effort high`. The size engine and dual-driver DB are the correctness-critical
  parts; no measured case for `xhigh`.
- No subagents by default; if a later revision adds a second catalog track, route
  workers to Sonnet 5 with `CLAUDE_CODE_SUBAGENT_MODEL=sonnet` before capping.
- Walk-away: accept the usage-credit consent once interactively before launching.
  Keep security-adjacent wording out of the first message (this prompt has none).
- User actions are in README.md → "Deploy" as a numbered SBS sequence.
- First-run signals to watch: turns ending on "Next, I'll…"; whole-file rewrites of
  the schema; extra committed tests beyond the two named; silence during `next build`.

</deployment>

<validation>

Test scenarios:
1. Guest with bust 36 in, waist 32 in, hip 40 in, womenswear → Fabindia M, not
   between sizes. Bust 37 in → L with "between sizes" flag (M is 36, L is 39).
2. Menswear guest chest 102 cm, waist 86 cm → Fabindia M by chest but waist says L
   → recommend L, rationale names the waist.
3. Admin CSV: one row per guest × event, UTF-8, header row stable, no PII beyond
   what the guest typed.
4. Delete via token removes guest and choices; admin count drops by one.

Known failure modes: inventing a Tasva chart; hard-coding event dates; running
migrations at build without a no-DB fallback and breaking the local build; PGlite
not marked as a server-external package and failing under Turbopack.

Iteration levers: (a) tighten or loosen the "between sizes" threshold in the size
engine; (b) if the couple wants households, add a `household` grouping rather than
widening the guest row.

</validation>
