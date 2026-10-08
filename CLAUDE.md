# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A construction-site cash book / expense tracker for small contractors ("Flux Finance" in the UI, manifest and `package.json`; "caixa-da-obra" in the README and Vercel URL; `site-ledger` is the repo/component name). Users log income and expenses per project, attach receipt photos, run reports, and issue simple invoices. Next.js 16 (App Router, React 19, Tailwind 4) on Postgres, deployed on Vercel.

A separate native mobile app (not in this repo) is a client of the `/pricing` flow, and Clerk's billing `PricingTable` (Stripe checkout) is how customers subscribe.

## Commands

```bash
npm run dev            # next dev (localhost:3000)
npm run build          # next build
npm run db:migrate     # applies pending Drizzle migrations (drizzle/) to $DATABASE_URL
npx drizzle-kit generate   # after editing lib/schema.ts, writes a new migration file under drizzle/
npm run user:create -- <email>   # provision a customer from the CLI

npx tsc --noEmit                              # type-check (no lint script or ESLint config exists)
node --test components/*.test.ts              # all tests
node --test components/invoices.test.ts       # single test file
```

Tests use the built-in `node:test` runner on Node's native TypeScript support (no Jest/Vitest), so test files and the modules they import must use explicit `.ts` extensions in relative imports (`./invoices.ts`). Only the pure modules in `components/` are tested; API routes and the UI have no tests.

`scripts/*.ts` run through `tsx` and load `.env.local` themselves with `loadEnvConfig`. They construct their own standalone `pg.Pool`/Drizzle `db` instance rather than importing `lib/db.ts`'s shared `pool` or `lib/drizzle.ts`'s shared `db`, since they run outside Next's module graph. `drizzle.config.ts` (used by `drizzle-kit generate`, not by the app itself) does the same.

## Environment (`.env.local`, git-ignored)

| Var | Used by |
|---|---|
| `DATABASE_URL` | `lib/db.ts`, scripts (throws if missing) |
| `AUTH_SECRET` | signs/verifies the customer session JWT (`lib/auth.ts`) |
| `ADMIN_EMAILS` | comma-separated allow-list for `/admin` and the in-app admin entry (`lib/admin-auth.ts`; read once at module load) |
| Clerk keys, `NEXT_PUBLIC_CLERK_SIGN_IN_URL`, `..._FORCE_REDIRECT_URL` | `/admin` and `/pricing` only; the sign-in URL vars point at `/admin/sign-in` and `/admin`, which is why `app/pricing/layout.tsx` overrides them |

## Authentication: two independent systems, gated by `proxy.ts`

Next 16 renamed middleware to `proxy.ts`. It runs on the Node runtime and is the single gate for every route except its matcher exclusions (`_next/static`, `_next/image`, `favicon.ico`, `manifest.webmanifest`, `icons/`).

**Customer app (`/`, `/api/*`)** — home-grown and password-less:
1. `POST /api/auth/login` takes an email, looks it up in `users`, rejects unknown (401) or inactive (403) accounts, and sets a 30-day HS256 JWT (`jose`) in the httpOnly `session` cookie. Accounts are created out-of-band (admin panel or CLI), never by self-signup.
2. `proxy.ts` verifies the cookie **and** re-queries `users.is_active` on every request, so deactivation takes effect immediately (cookie cleared, redirect to `/login?inactive=1`; `/api/*` gets JSON 401). Only `/login` and `/api/auth/*` are public.
3. Route handlers and server components still call `getSessionUser()` (`lib/session.ts`) themselves and return 401 — don't rely on the proxy alone.

**`/admin` and `/pricing`** — Clerk. `proxy.ts` lazy-imports `clerkMiddleware` only for these prefixes, and each subtree has its own scoped `<ClerkProvider>` (`app/admin/layout.tsx`, `app/pricing/layout.tsx`). The customer app must never import Clerk. `clerkMiddleware` must run for `/pricing` even though it's public, or server-side `auth()`/`currentUser()` throws. `/admin/(protected)/layout.tsx` additionally requires the Clerk primary email to be in `ADMIN_EMAILS`, else renders `NotAuthorized`.

## Data model (`lib/schema.ts`)

Postgres via [Drizzle ORM](https://orm.drizzle.team) (`drizzle-orm/node-postgres`) over one shared `pg` Pool. `lib/db.ts` exports that `Pool` (cached on `global` outside production to survive HMR, unchanged); `lib/schema.ts` is the **canonical schema** (tables, checks, indexes, composite keys/FKs) — there is no separate SQL schema file; `lib/drizzle.ts` exports the `db` query-builder instance (same HMR-caching pattern as `lib/db.ts`'s `pool`). Almost every route builds queries with `db.select/insert/update/delete`; the one holdout is the `categories.position` prepend subquery (`app/api/categories/route.ts`), which uses Drizzle's `sql` template tag for a `COALESCE(MIN(...)) - 1` expression that doesn't map to the query builder.

**Migrations:** edit `lib/schema.ts`, run `npx drizzle-kit generate` to produce a new file under `drizzle/`, commit it, then `npm run db:migrate` (now a thin wrapper around `drizzle-orm/node-postgres/migrator`'s `migrate()`, see `scripts/migrate.ts`) applies whatever hasn't run yet. `drizzle/0000_enable_pgcrypto.sql` and `drizzle/0001_baseline_schema.sql` are the baseline — they reproduce the schema that used to be hand-written in the now-deleted `db/schema.sql`. Production's migration-tracking table (`drizzle.__drizzle_migrations`) was seeded by hand (see `docs/superpowers/plans/2026-10-04-drizzle-orm-integration.md`, Task 3) to mark both as already-applied there rather than re-run.

- **Tenant tables** (`profiles`, `projects`, `categories`, `transactions`, `invoices`, `invoice_transactions`) all key on `user_id` with composite primary keys `(user_id, id)` (`(user_id, type, id)` for categories). Ids are **client-generated text** (`${Date.now()}-${random}`). Every query must filter by `user_id`; the composite key is what makes ids unique per tenant.
- `users`: `email` (unique, stored lowercased), `is_active`, `is_premium_user`. `profiles` is 1:1 (`company_name`, `company_logo` as data URL, `selected_project`).
- `projects.status` is `'active' | 'ended'`. The UI's "Geral" view is the pseudo-project id `'general'` (`GENERAL` in `components/site-ledger/types.ts`); transactions with no project have `project_id NULL`. There is **no FK** from `transactions.project_id` (or `invoices.project_id`) to projects, so `DELETE /api/projects/:id` nulls the references by hand inside a transaction.
- `transactions` stores `category`, `category_label`, `category_tag` as copies (no FK to `categories`), and an optional `photo` (JPEG data URL, ≤ 2,000,000 chars). `amount` is `NUMERIC(12,2)` — `pg` returns it as a **string**, so routes convert with `Number()` on the way out.
- `categories.position` has no default. New categories are prepended by inserting `MIN(position) - 1` for that user+type; `/api/state` returns them `ORDER BY position ASC`.
- Invoices: `invoices` + `invoice_transactions` join. Unique indexes on `(user_id, number)` and `(user_id, transaction_id)` are the real guard against double-billing and duplicate numbers under concurrent submits. Deleting a transaction cascades into `invoice_transactions` but does not change `invoices.total`.
- `lib/provision-user.ts` creates user + profile + seeded default categories (`lib/default-categories.ts`, Portuguese labels, 3-letter tags) in one transaction; shared by `scripts/create-user.ts` and the admin "Cadastrar cliente" server action.

## HTTP API (`app/api`)

All customer routes follow the same shape: `getSessionUser()` → 401 `{error}`; body parsed with a route-local `zod` schema (`schema.safeParse(await request.json().catch(() => null))`) → 400 on failure, using the same static error string the route always returned (not zod's field-level messages, to keep the response contract stable); every Drizzle query scoped by `user_id` (`eq(table.userId, user.id)`); respond `{ ok: true }`. Dynamic-route `params` is a `Promise` (awaited). The `/api/invoices` POST handler runs its checks and writes inside `db.transaction(async (tx) => {...})`; because Drizzle only rolls back a transaction when the callback throws (not on an early `return`), its two business-rule failures (unknown transaction id, already-invoiced id) are thrown as local error classes and mapped to their HTTP status after the `db.transaction(...)` call, not inside it.

| Route | Methods | Notes |
|---|---|---|
| `/api/state` | GET | one call loads everything: transactions, projects, categories grouped by type, profile fields, `invoicedTransactionIds` |
| `/api/transactions` | POST | insert; `photo` stored only if premium |
| `/api/transactions/:id` | PUT, DELETE | PUT returns 404 when the row doesn't exist; `photo` column updated only if premium |
| `/api/projects`, `/api/projects/:id` | POST; PUT (status), DELETE | |
| `/api/categories`, `/api/categories/:type/:id` | POST; DELETE | |
| `/api/profile` | PUT | builds the `SET` clause from whichever of `companyName`, `companyLogo`, `selectedProject` are present |
| `/api/invoices`, `/api/invoices/:id` | GET (list / detail), POST | **premium-only** (403). POST runs in a DB transaction: verifies all ids are the user's *income* transactions, not already invoiced (409), numbers it `max(number)+1`, inserts links; a `23505` unique violation is mapped to 409 |
| `/api/auth/login`, `/api/auth/logout` | POST | login errors are pt-PT strings; other routes' errors are English |

## Premium gating

`users.is_premium_user` gates receipt photos (silently dropped on non-premium writes) and the whole invoices feature. Enforce it server-side with `isUserPremium()` (`lib/premium.ts`, one query per call). `app/page.tsx` passes `isPremiumUser` / `isAdmin` props to the UI purely for presentation.

The flag is written only by `toggleUserPremiumAction` (admin user-detail page, `toggle-premium-button.tsx`). Nothing in this repo listens for Clerk/Stripe subscription events, so a completed checkout does not by itself flip the flag.

## Admin panel (`app/admin`)

Server components + server actions (`'use server'`), Clerk-authenticated: `/admin/users` (list), `/admin/users/[id]` (toggle active, toggle premium), `/admin/create-user` (`useActionState` form → `createUserAction` → `provisionUser`; its help text reminds the admin to also add the same email as a user in Clerk, which is a manual step). Actions call `revalidatePath`. Server-action `allowedOrigins` (and `allowedDevOrigins`) are hardcoded in `next.config.js` — add new dev hosts/tunnels there.

## Pricing / native-app handoff (`app/pricing`)

The native app opens `/pricing?app_redirect=<url>` in a system browser (separate session from the app's own Clerk session). Flow: `/pricing/handoff` exchanges a `__clerk_ticket` via `signIn.create({strategy:'ticket'})`, then redirects to `/pricing` → `PricingTable` (Stripe checkout) → fixed `/pricing/success`. Because the success URL can't carry query params through checkout, `CaptureAppRedirect` stashes `app_redirect` in `localStorage` (`flux_app_redirect`) and `/pricing/success` reads it back and redirects to the app. `/pricing/page.tsx` still has a `TEMP diagnostic` that resolves `currentUser()` without using the result.

## Front end

`app/page.tsx` is a thin async server component: resolves session → `isAdminEmail`, `isUserPremium` → renders `components/site-ledger` (folder, resolved via its `index.tsx`). `app/login/page.tsx` is the only other customer page.

`components/site-ledger/` holds the whole customer UI, split by responsibility (originally one ~3,200-line `site-ledger.tsx`; kept as one client-side feature since it's all one tightly-coupled screen, just no longer one file):

- `index.tsx` — the `'use client'` composition root. Owns `view` (`home` / `reports` / `invoices`) and `now`, wires the hooks below together, and renders the matching view plus whichever sheet/modal is open. Prop-drills everything down; no context.
- `hooks/` — one hook per domain, each owning its own `useState`/handlers:
  - `useLedgerData` — server-synced state (transactions, projects, categories, profile, invoices, `invoicedTransactionIds`), the mount-effect load, all CRUD calls, and derived values (`balance`, `thisMonthTotals`, `scopedTransactions`, `grouped`, `selectedProjectName`)
  - `useTransactionSheet` — the add/edit sheet (keypad, category/type, photo attach, save/delete), plus the list's long-press-to-delete and row-click-to-edit, and the photo lightbox
  - `useInvoiceFlow` — invoice sheet/history state, candidate/selection derivations, generate + print-window handlers
  - `useReports` — month navigation, export menu, `reportData`, `exportReportPdf`
  - `useProjectManagement` — add-project modal + manage-projects section
  - `useCategoryManagement` — manage-categories section
  - `useProfile` — profile modal, logo resize, logout (owns its own `useRouter()`)
- `components/` — presentational only, no data fetching: `Header`, `BalanceCard`, `ProjectSelector` (owns its drag-scroll), `TransactionRow`/`TransactionList`, `HomeView`, `ExportMenuButton`, `CategoryBarList`, `ReportsView`, `InvoiceCandidateList`/`InvoiceHistoryList`/`InvoiceSelectionBar`, `InvoicesView`, `TransactionSheet`, `InvoiceSheet`, `AddProjectModal`, `ProfileModal`, `ManageProjectsSection`/`ManageCategoriesSection`/`ManageModal`, `PhotoLightbox`, `GlobalStyles`
- `types.ts` — shared types (`Transaction`, `Project`, `InvoiceSummary`/`InvoiceDetail`, `SavedCategories`, `GENERAL`)
- `utils.ts` — `api`, `formatMoney`, `todayKey`, `dayLabel`, `escapeHtml`
- `print-templates.ts` — `buildPrintableReportHtml`, `buildPrintableInvoiceHtml` (pure HTML-string builders)

Key patterns:

- **Load once**: `useLedgerData`'s mount effect calls `GET /api/state`, then `GET /api/invoices` in a separate try/catch so a failure there (non-premium 403, un-migrated table) doesn't blank the app.
- **Optimistic, fire-and-forget writes**: every mutation in `useLedgerData` (`createTransaction`, `updateTransaction`, `deleteProject`, …) updates local state first, then calls the `api()` helper, and on failure only `console.error`s — there is **no rollback or user-visible error** except for invoices and exports. `updateTransaction` special-cases a 404 by re-POSTing the row, to recover from a create that failed silently.
- **Scoping**: `scopedTransactions` / `scopedForStats` (`useLedgerData`) filter by `selectedProject` (`'general'` = all); balance, monthly totals, reports and invoice candidates derive from them via `useMemo`.
- **Popup-safe printing**: reports (`useReports`) and invoices (`useInvoiceFlow`) build HTML strings via `print-templates.ts` (values run through `escapeHtml`), turn them into a Blob URL, and open with `window.open(..., PRINT_WINDOW_FEATURES)`; the user prints to PDF from that window. The window must be opened **synchronously in the click handler**, before any `await` (see `useInvoiceFlow`'s `handleGenerateInvoice`/`openInvoicePrintWindowById`), then navigated once data arrives; close it on failure. Popup-blocked errors surface via `invoiceError` / `exportError` outside the sheet.
- Every overlay (transaction/invoice sheet, add-project/profile/manage modals, photo lightbox) is rendered by `index.tsx` as an `absolute inset-0` sibling in the same order as before, so their z-index stacking (20/30/40) still depends on that DOM order — don't hoist one of these into a child component's own JSX subtree, it'll change what it can stack above.
- Styling mixes Tailwind classes with inline styles using CSS variables (`--bg-card`, `--line`, `--text-dim`, …) defined in `components/site-ledger/components/GlobalStyles.tsx` (rendered once by `index.tsx`), not in `app/globals.css`, which only has the Tailwind import and base resets.

Pure logic lives in tested siblings, and new non-trivial logic should go there rather than into the feature folder above: `reporting.ts` (period math + `buildReportData` aggregation), `invoices.ts` (`nextInvoiceNumber`, `sumTransactionAmounts`), `receipt-photo.ts` (canvas resize to ≤1600px JPEG q0.8 + size limit shared with the API routes), `export-options.ts` (menu labels), `print-window.ts` (window features).

## Conventions

- Tabs for indentation, single quotes; `@/*` maps to the repo root. `app/page.tsx` is an exception using 2-space indent.
- User-facing copy is Portuguese (pt-PT); currency is euro. Money is formatted with `formatMoney` (`en-IE` locale, 2 decimals) prefixed with `€`; dates with `pt-PT`.
- Money values cross the API as JS numbers (converted from `NUMERIC` strings); sums of decimals are not rounded, so watch float drift when adding totals.

## Known quirks

- **"Relatório semanal" always exports the current week** (Monday–Sunday, computed from `new Date()` at click time via `getExportPeriod`), independent of the month shown on the reports screen. The on-screen totals are month-based; only the export has week/month/year modes.
- `public/service-worker.js` (cache-first with network refresh) exists, but nothing in `app/` or `components/` registers it, and `proxy.ts`'s matcher doesn't exclude it, so unauthenticated requests to it redirect to `/login`. `app/manifest.ts` supplies the PWA manifest (icon path `icons/logo.png`).
- Login is email-only: knowing a registered email is enough to sign in.
