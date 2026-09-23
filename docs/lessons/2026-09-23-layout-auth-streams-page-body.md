# A redirect in a Next.js layout does not stop the page from rendering; gate data, not layouts

`src/app/admin/(protected)/layout.tsx` called `redirect("/admin/login")` when the
admin cookie was missing. Next renders layout and page in parallel, so the response
was a 307 whose body still carried the guest table's server-component payload:
`curl -s /admin` without a cookie returned 28 KB containing every guest's email and
measurements. Browsers discard a 307 body; curl and scrapers do not. Found by the
panel review (security engineer and wedding planner independently), confirmed by
the orchestrator.

Fix that held: `requireAdmin()` in `src/lib/adminAuth.ts`, called inside
`getAllGuests()` and `getAllPlans()` (so no page can list guests without it) and as
the first line of every admin page. Verified: 307 with a 0-byte body; the e2e suite
asserts the unauthenticated `/admin` body contains no guest email.

Why it matters: any future admin page or query that returns personal data must
call `requireAdmin()` itself. The layout check is defence in depth only.
