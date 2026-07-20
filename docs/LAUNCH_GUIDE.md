# Launch Guide

1. Configure environment variables and apply migrations (see DEPLOYMENT.md).
2. Deploy `dist/` and apply security headers.
3. Visit `/admin/launch` → **Run verification**. Target: 0 fail. Amber items are optional
   fallbacks (demo auth, mock AI/voice, manual billing) that you enable by adding keys.
4. Create your first workspace via `/onboarding` (creates an isolated tenant + defaults).
5. Confirm `/admin/health` shows providers operational and no errors.
6. Announce launch. Monitor `/admin/health` and the audit log at `/admin/platform`.
