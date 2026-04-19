# PopPulse Frontend

PopPulse is a demo-ready location intelligence dashboard for Sydney pop-up retail decisions. This frontend is intentionally wired to local mock data so the UI stays stable while the analytics pipeline matures.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- MapLibre GL JS

## Setup

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`.

## Data contract

The UI reads zones from `src/data/zones.json` through `src/lib/getZones.ts`.

When the real pipeline is ready, replace the mock file with cleaned zone-level data in the exact same `Zone` schema and the app logic will continue to work without structural changes.

## Main surfaces

- `/` main dashboard
- `/api/shortlist` shortlist API for the current scoring logic

## Current planning dimensions

- Business type
- Event type
- Format type
- Format scale
- Time slot
- Minimum score threshold

## Notes

- No database, auth, or external business APIs are used.
- The scoring and explanation logic is shared between the page and API route.
- The map is a client component to avoid SSR and hydration issues with MapLibre.
- The current palette is an inferred deck-inspired theme, not a pixel-matched extraction from the PDF.
- Foursquare-style business context is still mocked through tags in `zones.json` until a real dataset is available.
