# HOEP Web Application — Claude Agent Guide

## What This Is

A full-stack web application for **Hemophilia Outreach of El Paso (HOEP)**, a nonprofit serving the bleeding disorder community in El Paso, TX. Built by Stephen Helman (Operation Profit LLC).

The app is a patient portal, event management system, board administration platform, and live event experience — all in one. It is bilingual (English/Spanish) throughout.

## Quick Navigation

| Need to...                                       | Read...                                 |
| ------------------------------------------------ | --------------------------------------- |
| Understand the tech stack                        | `.claude/stack.md`                      |
| Work on an API route                             | `.claude/conventions.md`                |
| Add a bilingual feature                          | `.claude/conventions.md#bilingual`      |
| Use a lib utility (R2, email, Pusher)            | `.claude/utilities.md`                  |
| Change the DB schema                             | `.claude/conventions.md#schema-changes` |
| Fix a known bug                                  | `.claude/todo.md#fixes`                 |
| Build a planned feature                          | `.claude/todo.md#features`              |
| Understand why something was built a certain way | `.claude/architecture.md`               |
| Avoid breaking something                         | `.claude/gotchas.md`                    |

## Codebase Location

Source lives at `src/`. All paths in these docs are relative to `src/`.

## Key People

- **Stephen** — owner, developer, product decision maker
- **HOEP board** — President, VP, Secretary, Treasurer (assigned via BoardRole model)
- **Patients** — registered members of the bleeding disorder community

## Current Status

Live in production. Registration (Register for Information, public RSVP) is live. Privacy Policy, Terms and Children's Policy are published at `/privacy`, `/terms`, `/children` (text in `src/content/legal/`, requests handled per `docs/legal/RUNBOOK.md`). Active development continues.
See `.claude/todo.md` for all known issues and planned features.

## Overhaul rules

The app is being narrowed to a lean core (see `docs/overhaul/RESTORE.md`). Snapshot: git tag `full-app-2026-11`, branch `archive/full-app`.

1. Never drop or rename database tables or columns. Migrations are additive only. Cut features leave their tables dormant.
2. Each removed feature is done on its own branch named `cut/<feature>` and merged to main with `--no-ff` so it can be undone with `git revert -m 1`.
3. Run `npx tsc --noEmit` and `npm run build` before every merge. Note: `next.config.mjs` sets `ignoreBuildErrors`, so the build does NOT catch type errors — compare tsc against `docs/overhaul/tsc-baseline.txt`.
4. Stated diagnosis is protected health information: never put it in emails, URLs, QR payloads, logs, or client-side code that unauthenticated users can access.
5. Auth0 login is for board members only. `/admin/*` and `/api/admin/*` are gated by `src/middleware.ts`; keep route-level `requirePermission()` checks as well.
6. Claude Code never commits, merges, or pushes. It may create and switch branches, edit files, and run tsc/build/tests. When work is done, it provides one or more commit messages, each with the exact file paths it covers and the git add / git commit commands, plus the merge command (git checkout main && git merge --no-ff <branch>). Stephen runs them.
