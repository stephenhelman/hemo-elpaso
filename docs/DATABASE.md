# Database and migrations

One rule: **production is only ever changed by a Vercel Production deploy.** You work on a Neon dev branch;
previews never migrate; production migrates itself when `main` deploys.

## The two connection strings

| Variable | What it is | Used for |
| --- | --- | --- |
| `DATABASE_URL` | **pooled** Neon string (host contains `-pooler`) | the running app (queries) |
| `DIRECT_URL` | **direct** Neon string (same, without `-pooler`) | `prisma migrate` only |

`prisma/schema.prisma` declares both (`url` and `directUrl`). Neon's pooler can't run migrations, so a missing or
pooled `DIRECT_URL` makes migrate fail. Get both from Neon → Connect (toggle "Connection pooling" on/off).

## Environments

| Where | Database | Migrations |
| --- | --- | --- |
| Your machine (`.env.local`) | Neon **dev branch** | you run them: `npm run db:migrate` |
| Vercel **Preview** | Neon **dev branch** | **never** run |
| Vercel **Production** (`main`) | production Neon | **automatic** on every Production build |

Vercel environment variables (Settings → Environment Variables; tick only the environment shown):

| Variable | Production | Preview |
| --- | --- | --- |
| `DATABASE_URL` | production, pooled | dev branch, pooled |
| `DIRECT_URL` | production, direct | dev branch, direct |

Leave "Development" unticked. Everything else in `docs/overhaul/CUTOVER.md` (environment list) is unchanged.

## Build command

`vercel.json` sets `buildCommand` to `node scripts/vercel-build.mjs`. If the Vercel dashboard has its own Build
Command override (Settings → Build & Development → Build Command), **turn the override off**: a dashboard value wins over `vercel.json`.

| `VERCEL_ENV` | Steps |
| --- | --- |
| `production` | `prisma migrate deploy` → `prisma generate` → `next build` |
| `preview`, `development`, unset (local) | `prisma generate` → `next build` (no migration) |

- A failing `migrate deploy` **fails the build**, so the previous deployment stays live.
- The build log says which path ran: look for `[vercel-build] PATH: ...`.
- Production refuses to start if `DATABASE_URL` / `DIRECT_URL` are missing, if `DIRECT_URL` is pooled, or if either
  doesn't contain the production endpoint (`scripts/db-endpoints.json`).
- A non-production build refuses to run if either string points at the **production** endpoint (a preview must never
  use production data). Override on purpose with `ALLOW_PREVIEW_PROD_DB=yes`.
- If the production database ever moves, update `scripts/db-endpoints.json` (used by the build script, `db-guard` and `db:deploy`).

## Day-to-day workflow

1. Work against the dev branch (`.env.local` has the dev `DATABASE_URL` + `DIRECT_URL`). Check with `npm run db:whoami`: it must say `[not production]`.
2. Change `prisma/schema.prisma`, then `npm run db:migrate -- --name what_changed` (`prisma migrate dev`). Commit the new folder in `prisma/migrations/`.
3. **Migrations are additive only** (Overhaul rule 1): no drops or renames. A new required column needs a default.
4. Open a PR / push the branch: Vercel builds a **Preview**. It uses the dev branch database and does **not** migrate.
   The dev database already has your migration from step 2.
5. Merge to `main`. Vercel's Production build runs `prisma migrate deploy` against production, then builds.
   If a migration fails, the build fails and production is untouched.

Because production migrates *before* the new code is built, write migrations so the **old** code keeps working with the
new schema (additive changes do). That also makes "Promote previous deployment" a safe rollback.

## Guards

`npm run db:migrate`, `db:push`, `db:reset`, `seed` and `db:seed-templates` run `scripts/db-guard.ts` first and refuse
if `DATABASE_URL` **or** `DIRECT_URL` points at production (`prisma migrate` uses `DIRECT_URL`).

## Manual fallback: `npm run db:deploy`

Only if the Vercel path is unavailable. It does **not** read `.env.local`.

1. Create `.env.production.local` (git-ignored) containing the production `DATABASE_URL` and `DIRECT_URL`.
2. `npm run db:deploy`. It checks both strings point at the production endpoint, shows `prisma migrate status`,
   and asks you to **type the production endpoint** (`ep-…`) before it runs `prisma migrate deploy`.
3. Delete `.env.production.local` afterwards if you don't want the production string on disk.

## Testing the build script locally

```
npm run build:vercel                                   # VERCEL_ENV unset: skips migrations, generate + build
VERCEL_BUILD_DRY_RUN=1 VERCEL_ENV=production npm run build:vercel   # prints the production plan, runs nothing
```
Never run it with `VERCEL_ENV=production` for real against a database you care about.
