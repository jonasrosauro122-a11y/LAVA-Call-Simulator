import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { initPlatform } from '../bootstrap';
import { eventBus } from '../eventBus';
import { jobQueue } from '../jobQueue';
import { auditService } from '../auditService';
import { featureFlags } from '../featureFlagService';
import { config } from '../configurationService';
import { plugins } from '../pluginRegistry';
import { scheduler } from '../scheduler';
import { webhooks } from '../webhookService';
import { integrations } from '../integrationService';
import { branding } from '../brandingService';

interface PlatformContextValue {
  version: number; // increments on any platform change to drive re-render
  refresh: () => void;
  eventBus: typeof eventBus;
  jobQueue: typeof jobQueue;
  auditService: typeof auditService;
  featureFlags: typeof featureFlags;
  config: typeof config;
  plugins: typeof plugins;
  scheduler: typeof scheduler;
  webhooks: typeof webhooks;
  integrations: typeof integrations;
  branding: typeof branding;
}

const Ctx = createContext<PlatformContextValue | null>(null);

export function PlatformProvider({ children }: { children: ReactNode }) {
  const initialized = useRef(false);
  const [version, setVersion] = useState(0);
  const refresh = () => setVersion((v) => v + 1);

  if (!initialized.current) { initPlatform(); initialized.current = true; }

  useEffect(() => {
    jobQueue.start();
    const unsub = eventBus.subscribeAny(() => setVersion((v) => v + 1), { priority: -1000 });
    const unsubCfg = config.subscribe(() => setVersion((v) => v + 1));
    const unsubBrand = branding.subscribe(() => setVersion((v) => v + 1));
    return () => { unsub(); unsubCfg(); unsubBrand(); jobQueue.stop(); };
  }, []);

  const value: PlatformContextValue = {
    version, refresh, eventBus, jobQueue, auditService, featureFlags, config, plugins, scheduler, webhooks, integrations, branding,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePlatform() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('usePlatform must be used within PlatformProvider');
  return ctx;
}
