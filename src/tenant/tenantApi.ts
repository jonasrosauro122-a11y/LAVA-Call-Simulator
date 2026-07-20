import { supabase } from '../lib/supabase';
import type { Tenant } from './types';

// Best-effort persistence; the app runs fully from the in-memory engine when offline.
export async function persistTenant(t: Tenant): Promise<void> {
  try {
    await supabase.from('tenants').upsert({
      id: t.id.startsWith('tnt-') || t.id === 'default' ? undefined : t.id,
      name: t.name, slug: t.slug, status: t.status, plan: t.plan, deleted: t.deleted,
    });
  } catch { /* offline-tolerant */ }
}
