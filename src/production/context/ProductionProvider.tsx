import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { metrics } from '../observability';
import { authService, type Session } from '../auth';
import { csrf } from '../security';
import { aiRegistry } from '../../learning/ai';
import { voiceRegistry } from '../../learning/voiceEngine';
import { REAL_AI_PROVIDERS } from '../../learning/ai/providers/realProviders';
import { REAL_VOICE_PROVIDERS } from '../../learning/voiceEngine/providers/realVoiceProviders';

interface ProductionContextValue {
  session: Session | null;
  online: boolean;
  refreshSession: () => void;
  signOut: () => void;
}

const Ctx = createContext<ProductionContextValue | null>(null);

// Idempotently register real provider adapters alongside the existing mocks. They are
// registered but NOT made default, so current routing/behavior is unchanged; they activate
// only when their API keys are present.
let bootstrapped = false;
function bootstrapProviders(): void {
  if (bootstrapped) return;
  bootstrapped = true;
  metrics.bindToEventBus();
  csrf.issue();
  for (const p of REAL_AI_PROVIDERS) { if (!aiRegistry.get(p.metadata.id)) aiRegistry.register(p, { enable: p.isAvailable() }); }
  for (const p of REAL_VOICE_PROVIDERS) { if (!voiceRegistry.all().some((v) => v.metadata.id === p.metadata.id)) voiceRegistry.register(p, { enable: p.isAvailable() }); }
}

export function ProductionProvider({ children }: { children: ReactNode }) {
  const init = useRef(false);
  if (!init.current) { bootstrapProviders(); init.current = true; }

  const [session, setSession] = useState<Session | null>(() => authService.currentSession());
  const [online, setOnline] = useState<boolean>(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  const refreshSession = () => setSession(authService.currentSession());
  const signOut = () => { authService.signOut(); setSession(null); };

  return <Ctx.Provider value={{ session, online, refreshSession, signOut }}>{children}</Ctx.Provider>;
}

export function useProduction() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useProduction must be used within ProductionProvider');
  return ctx;
}
