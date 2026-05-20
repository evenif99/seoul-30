# Seoul 30

Seoul 30 is a low-cost MVP PWA that recommends Seoul public places reachable within 30 minutes.
It is built as a deployable portfolio app with mock-first behavior and optional real public API integration.

## Tech Stack
- Next.js 16 App Router
- React 19 + TypeScript strict
- Tailwind CSS + shadcn/ui
- Prisma + Neon PostgreSQL
- Leaflet + OpenStreetMap
- Vercel Hobby deployment

## Phase Status
- Phase 1-11 complete:
  - setup, core logic, UI, PWA, real API adapters, cache, map view, production hardening
- Phase 12 complete:
  - Vitest unit tests for `lib/scoring.ts`
  - React Testing Library component tests for `PlaceCard`, `FilterBar`, `BookmarkButton`
  - Playwright E2E golden paths:
    - home -> place detail
    - search filter -> results update
  - CI expanded to run unit/component tests + E2E before build
- Phase 13 complete:
  - Anonymous place rating (👍 / 👎) — no login required
  - `PlaceFeedback` DB model (Prisma + Neon), sessionId from `localStorage`
  - `GET /api/places/[id]/feedback` — aggregate counts
  - `POST /api/places/[id]/feedback` — upsert with toggle support
  - `FeedbackPanel` component on place detail page with optimistic UI

## Local Run
```bash
git clone https://github.com/evenif99/seoul-30.git
cd seoul-30
npm install
cp .env.example .env.local
npm run dev
```

## Test Commands
```bash
npm run test
npm run test:e2e
npx tsc --noEmit
npm run build
```

## Environment Variables
```bash
DATABASE_URL=
SEOUL_OPEN_API_KEY=
NEXT_PUBLIC_BASE_URL=https://your-app.vercel.app
USE_MOCK_DATA=true
ENABLE_REALTIME_CITY_DATA=false
ENABLE_CULTURE_EVENTS_API=false
```

Rules:
- Keep secrets only in env files or deployment env vars.
- Never expose server-only keys to client code.

## Current Known Notes
- Next.js warns that `middleware.ts` naming is deprecated and should move to `proxy`.
- In this local Windows environment, Playwright tests pass but process exit can sometimes hang after completion.

## License
MIT
