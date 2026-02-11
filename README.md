# Ribh Salla-First Growth OS

Next.js fullstack implementation of a Salla-first product that merges:
- Ribh one-click activation
- K automatic marketing patterns
- Attintave AI personalization patterns

## What is included

- Bilingual UI (Arabic-first + English fallback) with RTL/LTR switching
- Public marketing pages:
  - `/`
  - `/product`
  - `/solutions`
  - `/pricing`
  - `/about`
- App modules:
  - `/app/launch`
  - `/app/journeys`
  - `/app/ai-studio`
  - `/app/analytics`
  - `/app/compliance`
- API routes:
  - `GET /api/salla/install`
  - `GET /api/salla/oauth/callback`
  - `POST /api/salla/webhooks`
  - `POST /api/sync/run`
  - `POST /api/launch/run`
  - `GET /api/journeys`
  - `POST /api/journeys/:id/toggle`
  - `POST /api/ai/generate`
  - `GET /api/analytics/overview`
  - `POST /api/compliance/validate`
  - `GET /api/billing/status`

## Quick start

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Environment

Required for live Salla OAuth/token exchange:
- `SALLA_CLIENT_ID`
- `SALLA_CLIENT_SECRET`
- `SALLA_REDIRECT_URI`
- `SALLA_TOKEN_URL`
- `SALLA_WEBHOOK_SECRET`

Optional live channel send path adapters:
- `EMAIL_PROVIDER_URL`, `EMAIL_PROVIDER_KEY`
- `SMS_PROVIDER_URL`, `SMS_PROVIDER_KEY`
- `WHATSAPP_PROVIDER_URL`, `WHATSAPP_PROVIDER_KEY`

If provider env vars are missing, the system uses simulated send status but keeps the same API path.

## Testing

```bash
npm run test
npm run test:e2e
```

## Notes

- Data is persisted in in-memory store (`src/lib/store/memory.ts`) for v1/demo mode.
- Salla is implemented as first-class connector in this release.
- Shopify can be added as next connector under the same adapter architecture.
