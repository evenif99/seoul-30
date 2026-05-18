# HANDOFF

Last updated: 2026-05-18 (Phase 11 complete)

## Project Summary

Seoul 30 — PWA recommending Seoul public facilities and cultural venues reachable within 30 minutes by public transit. Full UI runs on mock data with no API keys. Deployed on Vercel Hobby at $0/month.

- **Repo**: https://github.com/evenif99/seoul-30.git (branch: master)
- **Deployed**: https://seoul-30.vercel.app (Vercel, auto-deploy on push)
- **DB**: Neon PostgreSQL (Singapore region, Free tier)

## Current State

Phase 11 of 15 complete. All core features implemented and deployed.

The app runs fully with `USE_MOCK_DATA=true` (default). No API keys required to develop locally.

## Local Dev Setup

```bash
git clone https://github.com/evenif99/seoul-30.git
cd seoul-30
npm install
cp .env.example .env.local
# Leave USE_MOCK_DATA=true — no API keys needed
npx prisma db push      # only needed if using real DB
npm run dev             # http://localhost:3000
```

## Feature Flags

Set in `.env.local`:

```bash
USE_MOCK_DATA=true                  # false → use Seoul Open API
ENABLE_CULTURE_EVENTS_API=false     # true → fetch culturalEventInfo
ENABLE_REALTIME_CITY_DATA=false     # true → fetch citydata_ppltn (congestion)
```

## Key Files to Know Before Touching

| File | Purpose |
|---|---|
| `lib/scoring.ts` | Pure scoring function — unit test before modifying |
| `lib/mock/places.ts` | 12 mock places with lat/lng — used in sitemap + bookmarks + map |
| `app/api/places/route.ts` | Main API route — cache-first pattern, flag-gated |
| `lib/config/env.ts` | Server-only env — add new server vars here |
| `lib/config/feature-flags.ts` | All feature flag reads — central |
| `middleware.ts` | Rate limiting on /api/* — in-memory, per edge instance |
| `prisma/schema.prisma` | DB schema — run `prisma db push` after changes |

## What Codex Should NOT Do

- Do not hardcode API keys or secrets anywhere
- Do not call external APIs from client components
- Do not add features outside the requested scope
- Do not modify `components/ui/` unless there is a specific UI requirement
- Do not skip `prisma generate` before `next build` (already wired in package.json)
- Do not add `NEXT_PUBLIC_` prefix to server-only values

## Next Tasks (Phase 12)

1. Install Vitest + React Testing Library + Playwright
2. Write unit tests for `lib/scoring.ts` (all 6 scoring dimensions)
3. Write component tests for `PlaceCard`, `FilterBar`, `BookmarkButton`
4. Write Playwright E2E for: home → place detail, filter apply → result change
5. Add `vitest run` and `playwright test` steps to `.github/workflows/ci.yml`

See `TASKS.md` for full phase roadmap.
