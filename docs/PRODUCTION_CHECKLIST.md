# Production Checklist

Run automatically at `/admin/launch`. Manual reference:

- [ ] Supabase URL + anon key set; migrations applied (additive only)
- [ ] `VITE_ENVIRONMENT=production`
- [ ] Auth backend attached (Supabase/SSO) — replaces local/demo provider
- [ ] Tenant isolation: RLS policies enabled (`tenant_id = current_setting('app.tenant_id')`)
- [ ] At least one real AI provider key set (else deterministic fallback)
- [ ] At least one real voice provider key set (else shared analysis fallback)
- [ ] Billing provider configured (else manual invoicing)
- [ ] Background jobs + scheduler running; webhook transport attached
- [ ] Plugins, feature flags, branding, configuration verified
- [ ] All known routes resolve (checklist compares against `KNOWN_ROUTES`)
- [ ] Security headers applied at host/CDN; HTTPS enforced
- [ ] `/admin/health` shows 0 blocking errors
