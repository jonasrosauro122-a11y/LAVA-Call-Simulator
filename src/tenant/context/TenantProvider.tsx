import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { eventBus } from '../../platform/eventBus';
import { tenantEngine } from '../tenantEngine';
import { tenantResolver } from '../tenantResolver';
import type { Tenant, TenantContext as TCtx } from '../types';

interface TenantProviderValue {
  version: number;
  ctx: TCtx;                 // current tenant context
  tenants: Tenant[];
  currentTenantId: string;
  setCurrentTenant: (id: string) => void;
  contextFor: (id: string) => TCtx;
  refresh: () => void;
}

const Ctx = createContext<TenantProviderValue | null>(null);

// Tenant event names that should trigger a re-render of tenant-aware UI.
const TENANT_EVENT_PREFIX = 'Tenant';

export function TenantProvider({ children }: { children: ReactNode }) {
  const [version, setVersion] = useState(0);
  const [currentTenantId, setCurrentId] = useState<string>(() => tenantResolver.currentId());
  const refresh = () => setVersion((v) => v + 1);

  useEffect(() => {
    const unsub = eventBus.subscribeAny((e) => {
      if (e.type.startsWith(TENANT_EVENT_PREFIX) || e.type === 'SubscriptionChanged' || e.type === 'BrandingUpdated' || e.type === 'FeatureFlagsChanged' || e.type === 'AIProviderChanged' || e.type === 'VoiceProviderChanged') {
        setVersion((v) => v + 1);
      }
    }, { priority: -500 });
    return () => unsub();
  }, []);

  const setCurrentTenant = (id: string) => { tenantResolver.setCurrent(id); setCurrentId(id); refresh(); };

  const value: TenantProviderValue = {
    version,
    ctx: tenantEngine.contextFor(currentTenantId),
    tenants: tenantEngine.list(),
    currentTenantId,
    setCurrentTenant,
    contextFor: (id) => tenantEngine.contextFor(id),
    refresh,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTenant() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useTenant must be used within TenantProvider');
  return ctx;
}
