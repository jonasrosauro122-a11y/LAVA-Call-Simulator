# Troubleshooting Guide

**App loads but AI/voice feels generic** — no provider key set; adapters use deterministic
fallback. Add `VITE_OPENAI_API_KEY` / `VITE_DEEPGRAM_API_KEY` etc. Verify at `/admin/launch`.

**"Access restricted" in a console** — current role lacks the permission. Switch role in the
console header (demo) or assign the role in production.

**Microphone not working** — browser permission denied or non-HTTPS origin. Grant mic access;
serve over HTTPS. `audioCapture.requestPermission()` reports the reason.

**Data not persisting across reloads** — Supabase not configured; the app runs offline-tolerant
with local/in-memory stores. Set Supabase env vars.

**Checklist shows amber** — expected in demo mode (auth/AI/voice/billing fallbacks). Amber is
launch-ready; configure keys to turn items green. Red = blocking.

**Offline banner shown** — network lost; changes are kept locally and reconcile on reconnect.
