# Seoul 30

Seoul 30 is a low-cost MVP PWA that recommends Seoul public places reachable within 30 minutes by public transit.
Built as a deployable portfolio app with mock-first behavior and optional real public API integration.

## Tech Stack

- Next.js 16 App Router + React 19 + TypeScript strict
- Tailwind CSS + shadcn/ui
- Prisma + Neon PostgreSQL (Singapore region)
- Leaflet + OpenStreetMap (no API key required)
- Vitest + React Testing Library + Playwright
- Vercel Hobby deployment ($0/month)

## Phase Status

- **Phase 1** — Project setup, Next.js scaffold, Tailwind, shadcn/ui
- **Phase 2** — Mock data, scoring model (access / relevance / cost / congestion / timefit / freshness)
- **Phase 3** — PlaceCard UI, FilterBar (category / crowd / time / free-only)
- **Phase 4** — PWA baseline (manifest, service worker, offline page)
- **Phase 5** — Seoul Open API adapters (culture events, culture spaces)
- **Phase 6** — DB caching layer (RecommendationSnapshot, ExternalCache via Prisma + Neon)
- **Phase 7** — Search filter, open-now filter, URL query param sync
- **Phase 8** — Bookmarks and recent views (localStorage + dedicated pages)
- **Phase 9** — SEO (OG image, share button, sitemap, JSON-LD)
- **Phase 10** — Production hardening (rate limiting middleware, error boundary, CI build checks)
- **Phase 11** — Map view (Leaflet + OpenStreetMap, marker clustering, bounds controller)
- **Phase 12** — Testing suite (Vitest unit + RTL component + Playwright E2E, CI integration)
- **Phase 13** — Anonymous place rating (👍 / 👎, PlaceFeedback DB model, optimistic UI)
- **Phase 14** — PWA Web Push notifications (VAPID, WebPushSubscription DB model, Vercel Cron)
- **Phase 15** — i18n with next-intl v4 (ko/en, cookie-based locale, LanguageToggle)
- **Phase 16** — Score explanation breakdown UI (ScoreBadge on PlaceCard, ko/en labels)
- **Phase 17** — Stale cache fallback when Seoul Open API fails + defensive hardening (feedback/push try-catch, CRON_SECRET auth, use-push error state)
- **Phase 18** — Skeleton loading states + accessibility (aria-live, aria-busy, skip-to-content link)
- **Phase 19** — Static pages (About/Privacy) + PWA installability polish (manifest, shortcuts, maskable icon)

## Local Run

```bash
git clone https://github.com/evenif99/seoul-30.git
cd seoul-30
npm install
cp .env.example .env.local
# fill in .env.local values (see Environment Variables below)
npm run dev
```

## Test Commands

```bash
npm run test          # Vitest unit + component tests
npm run test:e2e      # Playwright E2E
npx tsc --noEmit      # type check
npm run build         # production build
```

## Environment Variables

```bash
# Database
DATABASE_URL=

# Seoul Open API (server-side only)
SEOUL_OPEN_API_KEY=

# Canonical URL for OG / sitemap
NEXT_PUBLIC_BASE_URL=https://your-app.vercel.app

# Feature flags
USE_MOCK_DATA=true
ENABLE_REALTIME_CITY_DATA=false
ENABLE_CULTURE_EVENTS_API=false

# Phase 14 — Web Push (VAPID)
# Generate keys: npx web-push generate-vapid-keys
VAPID_EMAIL=admin@example.com
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
NEXT_PUBLIC_VAPID_PUBLIC_KEY=   # same as VAPID_PUBLIC_KEY
CRON_SECRET=                    # arbitrary secret string
```

Security rules:
- All API keys in `.env.local` or deployment env vars only — never in code
- Server-side external API calls only (Route Handlers)
- `NEXT_PUBLIC_` prefix only for values safe to expose to the browser

## Known Notes

- Next.js warns `middleware.ts` naming is deprecated (migration to `proxy` deferred).
- On Windows, Playwright process exit can hang after tests pass — tests themselves pass correctly.

## License

MIT
