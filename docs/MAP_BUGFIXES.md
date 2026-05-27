# Map Bugfix Notes

## 2026-05-27 - Naver map loading and tile rendering

### Symptoms

- Local web: the map container, grid, controls, and markers rendered, but Naver base-map tiles appeared as broken images.
- Production web: after clicking the location-based recommendation button and switching to the map tab, the page stayed on the map loading message indefinitely.

### Root Causes

1. `MapView` only moved to `ready=true` from the `next/script` `onLoad` callback. When the Naver Maps SDK had already been loaded by a previous map render or client navigation, Next.js could deduplicate the script and not fire `onLoad` again for the newly mounted map tab. The component then stayed in the loading state.
2. Map initialization errors inside `useEffect` were not caught by the React error boundary, because error boundaries do not catch asynchronous/effect errors.
3. Naver map rendering can require runtime image/connect assets beyond the SDK URL itself. A too-narrow CSP or a missing NCP Web service URL registration can make SDK initialization partially succeed while tile images fail.
4. Local NCP registration must include the exact browser URL, including the trailing slash: `http://localhost:3001/`. Production must also include `https://seoul-30-webapp.vercel.app/`.

### Fix

- `components/seoul30/MapView.tsx`
  - Added a stable `id="naver-maps-sdk"` to the SDK script.
  - Added `onReady` so remounted maps recover when Next.js reuses an already-loaded script.
  - Added a mount-time `window.naver?.maps` check and a 12 second timeout fallback.
  - Passed `onMapError` into `MapViewInner` so effect-time map initialization failures can switch to the existing fallback UI.
- `components/seoul30/MapViewInner.tsx`
  - Wrapped imperative map construction in `try/catch`.
  - Triggered a Naver `resize` event immediately after mount so tab transitions and freshly sized containers repaint tiles.
  - Cleared markers and timers during cleanup.
- `next.config.mjs`
  - Expanded Naver Maps CSP asset coverage for Naver/NCP runtime image and connect hosts.
- `tests/components/MapView.test.tsx`
  - Added a regression test for the "SDK already loaded before MapView remount" case.

### Verification

```bash
npx tsc --noEmit
npm run test -- tests/components/MapView.test.tsx tests/unit/security-headers.test.ts
npm run build
```

### If local tiles still break

Check NAVER Cloud Platform first:

- NAVER Cloud Platform > Maps > Application > Web service URL
- Must include `http://localhost:3001/` exactly for local dev
- Must include `https://seoul-30-webapp.vercel.app/` exactly for production
- Use `ncpKeyId`, not `ncpClientId`, in the script URL
