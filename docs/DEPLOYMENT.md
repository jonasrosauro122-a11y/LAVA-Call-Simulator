# Deployment Guide

## Prerequisites
- Node 18+ and npm
- A Supabase project (URL + anon key)
- Optional provider keys (AI, voice, billing) — the app runs without them in fallback mode

## Environment variables (Vite — prefix `VITE_`)
Required: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_ENVIRONMENT` (development|staging|production|preview|local).
Optional: `VITE_OPENAI_API_KEY`, `VITE_ANTHROPIC_API_KEY`, `VITE_GEMINI_API_KEY`, `VITE_AZURE_OPENAI_API_KEY`,
`VITE_DEEPGRAM_API_KEY`, `VITE_ELEVENLABS_API_KEY`, `VITE_STRIPE_SECRET_KEY`, `VITE_PADDLE_API_KEY`,
`VITE_LEMONSQUEEZY_API_KEY`, `VITE_CHARGEBEE_API_KEY`.
Any unset key → the relevant adapter runs in documented fallback mode (never crashes).

## Database
Apply migrations in `supabase/migrations/` in timestamp order. All are additive; none are destructive.

## Build & serve
`npm install` → `npm run build` → serve `dist/` from any static host/CDN.

## Security headers (host/CDN)
Apply the headers from `security.ts` `RECOMMENDED_HEADERS` (CSP, HSTS, X-Frame-Options,
X-Content-Type-Options, Referrer-Policy, Permissions-Policy: microphone=(self)).

## Post-deploy
Open `/admin/launch` and run one-click verification. Green/amber = ready (amber = fallback
modes to configure); red = blocking. Check `/admin/health` for live metrics.
