// Internationalization readiness (Phase 9). Not a full i18n runtime — a typed indirection
// so every user-facing string can be routed through t() later without touching call sites.
// Today it returns the key's default text; swapping in a catalog per locale is additive.

let locale = 'en';
const catalog: Record<string, Record<string, string>> = { en: {} };

export function setLocale(l: string): void { locale = l; }
export function getLocale(): string { return locale; }

export function t(key: string, fallback: string, vars?: Record<string, string | number>): string {
  let str = catalog[locale]?.[key] ?? fallback;
  if (vars) for (const [k, v] of Object.entries(vars)) str = str.replace(`{${k}}`, String(v));
  return str;
}

export function registerMessages(l: string, messages: Record<string, string>): void {
  catalog[l] = { ...(catalog[l] ?? {}), ...messages };
}
