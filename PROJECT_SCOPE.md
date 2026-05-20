# PROJECT_SCOPE

Last updated: 2026-05-20 (Phase 20 complete — all phases done)

## Product Goal

Low-cost MVP PWA that recommends Seoul public places reachable within 30 minutes by public transit.
Dual purpose: working portfolio piece + real deployable service at $0/month.

## Completed Scope (Phase 1–20)

| Phase | Summary |
|---|---|
| 1 | Project setup — Next.js 16, Tailwind, shadcn/ui, TypeScript strict |
| 2 | Mock data + scoring model (6 dimensions, rule-based) |
| 3 | PlaceCard UI, FilterBar (category / crowd / time / free-only) |
| 4 | PWA baseline — manifest, service worker, offline page |
| 5 | Seoul Open API adapters (culture events + culture spaces) |
| 6 | DB caching layer — RecommendationSnapshot + ExternalCache (Prisma + Neon) |
| 7 | Search filter, open-now filter, URL query param sync |
| 8 | Bookmarks and recent views (localStorage + dedicated pages) |
| 9 | SEO — OG image, share button, sitemap.ts, JSON-LD |
| 10 | Production hardening — rate limiting middleware, error boundary, CI build gate |
| 11 | Map view — Leaflet + OpenStreetMap, marker clustering, bounds auto-fit |
| 12 | Testing suite — Vitest unit, RTL component, Playwright E2E, CI integration |
| 13 | Anonymous place rating — PlaceFeedback model, sessionId dedup, optimistic UI |
| 14 | PWA Web Push — VAPID, WebPushSubscription model, Vercel Cron daily trigger |
| 15 | i18n — next-intl v4, ko/en, cookie-based locale, LanguageToggle component |
| 16 | Score breakdown UI — ScoreBadge on PlaceCard, reason pills, ko/en labels |
| 17 | Stale cache fallback (Seoul API 장애 시 만료 스냅샷 반환) + defensive hardening |
| 18 | Skeleton loading states + accessibility (aria-live, aria-busy, skip-to-content) |
| 19 | Static pages (About/Privacy) + PWA polish (manifest shortcuts, maskable icon, categories) |
| 20 | Launch hardening — validateEnv(), /api/health, RUNBOOK.md |
| 21 | Observability — structured JSON logs on recommendation flow, /api/diagnostics endpoint |
| 22 | Data freshness transparency — snapshotAt in API response, relative time in stale banner + cache indicator |
| 23 | Engagement polish — bookmark count badge in BottomTabBar, ShareButton/BookmarkButton/Bookmarks page i18n |
| 24 | Performance/accessibility hardening — ignoreBuildErrors 제거, static page cache headers, PlaceCard full i18n |
| 25 | Release readiness — dead import cleanup, MapViewInner i18n, offline/about/privacy i18n 완성, MD 전체 최신화 |

## Deferred / Not In Scope

- Playwright Windows exit-hang (로컬 한정, CI 통과 확인됨)
- Authentication / user accounts
- Admin dashboard
- Vector DB / AI-powered recommendations
- Chatbot integration
- Data export

## Key Constraints

- **Cost**: Vercel Hobby (free) + Neon Free tier — no paid services
- **Secrets**: All API keys via env vars only — never in code or commits
- **External API calls**: Server-side only (Route Handlers) — no client-side secret exposure
- **Scope**: No feature beyond the requested phase — no enterprise patterns, no premature abstraction
- **MVP**: Small, verifiable units — working over perfect

## Security Rules (must remain in effect)

- All API keys in `.env.local` or deployment env vars only
- Never hardcode API keys, tokens, passwords in code, markdown, or commit messages
- External API calls only from server-side Route Handlers
- Never pass secret keys to browser / client components
- `NEXT_PUBLIC_` prefix only for values safe to expose publicly
