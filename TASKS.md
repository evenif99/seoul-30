# TASKS

Last updated: 2026-05-20 (Phase 12 complete)

## Completed In This Task
- Installed test stack:
  - `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`
  - `@playwright/test`, `jsdom`, `@vitejs/plugin-react`
- Added test configs:
  - `vitest.config.ts`
  - `playwright.config.ts`
  - `tests/setup.tsx`
- Added test suites:
  - `tests/unit/scoring.test.ts` (6 dimensions + total)
  - `tests/components/PlaceCard.test.tsx`
  - `tests/components/FilterBar.test.tsx`
  - `tests/components/BookmarkButton.test.tsx`
  - `tests/e2e/home.spec.ts` (2 golden paths)
- Added test scripts in `package.json`:
  - `test`, `test:unit`, `test:e2e`
- Updated CI workflow to run Vitest and Playwright before build.
- Added stable test hooks (`data-testid`) in `FilterBar` and `BookmarkButton`.
- Added test artifact ignores in `.gitignore`.

## Next Recommended Tasks
- Phase 13: add anonymous rating data model and feedback route.
- Add one API route integration test for `/api/places` scoring order and `isMock`.
- Investigate local Playwright process shutdown issue on Windows to remove timeout noise.

## Blocked Items
- None for implementation.
- Local-only issue: Playwright command can hang on process exit even when tests pass.

## Intentional TODOs
- Middleware -> proxy migration not included in Phase 12 scope.
- No changes to product features outside testing suite.
