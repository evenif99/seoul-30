# Seoul 30

Seoul 30 is a mobile-first web app / PWA that helps users discover public places, cultural events, and everyday city options they can reach within 30 minutes in Seoul.

Instead of trying to replace maps or transit apps, this project focuses on decision support: helping users quickly decide where to go based on time, congestion, accessibility, and public data.

===

## Why this project exists

This project was built as a real-world portfolio service with two goals:

1. Build a deployable, low-cost product using real public datasets.
2. Explore how Seoul public data can be transformed into a practical recommendation experience for everyday users.

The product is designed around real usage, not just a demo. The focus is on maintainability, deployment simplicity, and clear product value.

===

## MVP scope

Current MVP goals:

- Region-based or current-location-based recommendations
- Public place / event recommendation cards
- Basic filters such as category, free/paid, congestion, and time
- Detail pages for places and events
- Local bookmarks and recent views
- PWA-ready mobile-first experience
- Server-side public API integration with caching and fallback handling

Out of scope for the initial MVP:

- Authentication and user accounts
- Admin dashboard
- Payment features
- Advanced push notification flows
- AI chatbot or RAG-based recommendations
- Large-scale microservice architecture

=

## Tech stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS
- PostgreSQL
- Prisma
- Vercel
- Neon
- Progressive Web App (PWA) setup

==

## Public data sources

This project is designed to use open public datasets, primarily from:

- Seoul Open Data Plaza
- Korea Public Data Portal

Planned datasets include Seoul real-time city data and public cultural event data.

Some APIs may require manual application approval and issued service keys before live integration becomes available.
Until then, parts of the app may run on mock adapters or normalized fallback data.

==

## Security and secrets

API keys and service keys are never hardcoded in the repository.

All secrets must be provided through local or deployment environment variables, such as:

- `SEOUL_OPEN_API_KEY`
- `PUBLIC_DATA_SERVICE_KEY`
- `DATABASE_URL`

External public API requests are handled on the server side only.
Secret values must never be exposed to the browser, committed to Git, or included in documentation examples.

==

## Project principles

This project follows a few deliberate engineering constraints:

- Keep the MVP small and shippable
- Prefer one maintainable web codebase over early multi-platform complexity
- Use server-side integration for public APIs
- Store normalized summaries and cache data, not full raw payloads
- Build graceful fallbacks before full live integration
- Prioritize clear architecture over unnecessary abstraction

==

## Getting started

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd <your-project-name>
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env.local` file based on `.env.example`.

Example variables:

```env
SEOUL_OPEN_API_KEY=
PUBLIC_DATA_SERVICE_KEY=
DATABASE_URL=
```

### 4. Run the development server

```bash
npm run dev
```

### 5. Open the app

Visit `http://localhost:3000`

==

## Architecture notes

The app is being built as a mobile-first Next.js web app with PWA support.

High-level structure:

- `app/` – routes, pages, and route handlers
- `components/` – reusable UI components
- `lib/` – API adapters, normalization logic, config, and utilities
- `prisma/` – database schema and migrations
- `public/` – static assets and PWA-related files

Public API integration is designed behind server-side adapters so the UI remains stable even when external API structures change.

==

## Current status

This project is currently under active MVP development.

Planned development flow:

- UI direction and responsive layout
- Mock-based recommendation flow
- Server-side public API integration
- Normalization and cache layer
- Bookmark/history features
- PWA polish and deployment readiness

==

## Roadmap

Short-term:
- Finalize responsive home and exploration screens
- Add normalized recommendation API route
- Connect approved public datasets
- Add bookmark and recent-view flows

Mid-term:
- Improve scoring logic for recommendations
- Add better fallback handling for partial API failures
- Expand supported Seoul public place categories

Later:
- Optional AI-generated recommendation explanations
- Optional advanced notification or personalization features

==

This repository is maintained as both a portfolio project and a real service prototype, with an emphasis on practical architecture, low-cost operation, and incremental delivery.
