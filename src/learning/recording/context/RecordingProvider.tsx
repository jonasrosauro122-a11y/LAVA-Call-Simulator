import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Pause, Play, Square, X, Upload, CheckCircle2 } from 'lucide-react';
import { useAssessment } from '../../../context/AssessmentContext';
import { tenantResolver } from '../../../tenant/tenantResolver';
import { RecordingEngine } from '../recordingEngine';
import { uploadRecording } from '../voiceRecordingApi';
import type { RecordingStatus, UploadProgress } from '../types';
import type { TenantContext } from '../../../tenant/types';

// Modules that are AI conversations/simulations and should be recorded.
const SIM_MODULES = new Set([4, 5, 7]);
const MODULE_RE = /^\/module\/(\d+)/;

interface RecordingContextValue {
  ctx: TenantContext;
  learnerId: string;
  learnerName: string;
  lastSimulationId: string | null;
}
const Ctx = createContext<RecordingContextValue | null>(null);

export function useRecordingContext() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useRecordingContext must be used within RecordingProvider');
  return c;
}

export function RecordingProvider({ children }: { children: ReactNode }) {
  const { candidate } = useAssessment();
  const learnerId = candidate?.id ?? 'me';
  const learnerName = [candidate?.first_name, candidate?.last_name].filter(Boolean).join(' ') || 'You';
  const ctx = tenantResolver.current();
  const [lastSimulationId, setLast] = useState<string | null>(null);

  return (
    <Ctx.Provider value={{ ctx, learnerId, learnerName, lastSimulationId }}>
      {children}
      <SimulationRecorderHost learnerId={learnerId} ctx={ctx} onUploaded={setLast} />
    </Ctx.Provider>
  );
}

// Always mounted inside the router. Starts recording when the learner enters a simulation
// module route and stops + uploads when they leave it — so no simulator code is modified.
function SimulationRecorderHost({ learnerId, ctx, onUploaded }: { learnerId: string; ctx: TenantContext; onUploaded: (id: string) => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const engineRef = useRef<RecordingEngine | null>(null);
  const simIdRef = useRef<string | null>(null);
  const moduleRef = useRef<string | null>(null);
  const [status, setStatus] = useState<RecordingStatus>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const activeModule = () => { const m = MODULE_RE.exec(location.pathname); return m ? parseInt(m[1], 10) : null; };

  const startFor = useCallback(async (moduleNum: number) => {
    if (engineRef.current) return;
    const simulationId = `sim-m${moduleNum}-${Date.now().toString(36)}`;
    simIdRef.current = simulationId; moduleRef.current = `module-${moduleNum}`;
    const engine = new RecordingEngine(simulationId);
    engineRef.current = engine;
    engine.onStatus(setStatus);
    const res = await engine.start();
    if (!res.ok) { setPermissionError(res.reason ?? 'Microphone unavailable'); engineRef.current = null; }
  }, []);

  const stopAndUpload = useCallback(async () => {
    const engine = engineRef.current; const simulationId = simIdRef.current;
    if (!engine || !simulationId) return;
    const result = await engine.stop();
    engineRef.current = null;
    if (!result || result.durationSeconds < 1) { simIdRef.current = null; setStatus('idle'); return; }
    setStatus('uploading');
    const rec = await uploadRecording(ctx, {
      learnerId, simulationId, moduleId: moduleRef.current ?? undefined, provider: 'browser-mediarecorder',
      blob: result.blob, mimeType: result.mimeType, durationSeconds: result.durationSeconds, waveform: result.waveform,
    }, setProgress);
    setStatus('uploaded'); setSavedId(rec.simulationId); onUploaded(rec.simulationId);
  }, [ctx, learnerId, onUploaded]);

  // React to route changes: enter sim route → start; leave while recording → stop+upload.
  useEffect(() => {
    const mod = activeModule();
    const onSimRoute = mod !== null && SIM_MODULES.has(mod);
    if (onSimRoute && !engineRef.current && status !== 'uploading') { setSavedId(null); setPermissionError(null); void startFor(mod!); }
    else if (!onSimRoute && engineRef.current) { void stopAndUpload(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Elapsed timer while recording.
  useEffect(() => {
    if (status !== 'recording') return;
    const t = setInterval(() => setElapsed(engineRef.current?.durationSeconds() ?? 0), 500);
    return () => clearInterval(t);
  }, [status]);

  const cancel = () => { engineRef.current?.cancel(); engineRef.current = null; simIdRef.current = null; setStatus('idle'); };
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  const recording = status === 'recording' || status === 'paused' || status === 'requesting';
  const uploading = status === 'uploading';

  return (
    <AnimatePresence>
      {(recording || uploading || savedId || permissionError) && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-4 right-4 z-50 w-72 rounded-xl shadow-lg border border-ink-100 dark:border-ink-800 bg-white dark:bg-ink-900 p-4">
          {permissionError && !recording && !uploading && !savedId && (
            <div className="text-sm">
              <p className="font-medium text-ink-800 dark:text-ink-100 flex items-center gap-2"><Mic size={15} className="text-lava-600" /> Recording off</p>
              <p className="text-xs text-ink-500 dark:text-ink-400 mt-1">{permissionError}</p>
              <button className="btn-secondary text-xs mt-2" onClick={() => { const m = activeModule(); if (m) void startFor(m); }}>Enable microphone</button>
            </div>
          )}
          {recording && (
            <div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-medium text-ink-800 dark:text-ink-100">
                  <span className="w-2.5 h-2.5 rounded-full bg-lava-600 animate-pulse" /> Recording {status === 'paused' && '(paused)'}
                </span>
                <span className="text-sm tabular-nums text-ink-500">{fmt(elapsed)}</span>
              </div>
              <div className="flex items-center gap-2 mt-3">
                {status === 'paused'
                  ? <button className="btn-ghost text-xs" onClick={() => engineRef.current?.resume()}><Play size={14} /> Resume</button>
                  : <button className="btn-ghost text-xs" onClick={() => engineRef.current?.pause()}><Pause size={14} /> Pause</button>}
                <button className="btn-primary text-xs" onClick={() => void stopAndUpload()}><Square size={13} /> Finish</button>
                <button className="btn-ghost text-xs ml-auto text-ink-400" onClick={cancel} aria-label="Discard"><X size={14} /></button>
              </div>
            </div>
          )}
          {uploading && (
            <div className="text-sm">
              <p className="font-medium text-ink-800 dark:text-ink-100 flex items-center gap-2"><Upload size={15} className="text-lava-600" /> Uploading recording…</p>
              <div className="h-2 rounded-full bg-ink-100 dark:bg-ink-800 overflow-hidden mt-2">
                <div className="h-full bg-lava-600 transition-all" style={{ width: `${progress?.pct ?? 10}%` }} />
              </div>
            </div>
          )}
          {savedId && !uploading && (
            <div className="text-sm">
              <p className="font-medium text-ink-800 dark:text-ink-100 flex items-center gap-2"><CheckCircle2 size={15} className="text-green-600" /> Recording saved</p>
              <div className="flex gap-2 mt-2">
                <button className="btn-primary text-xs" onClick={() => navigate(`/learning/recording/${savedId}`)}>Review</button>
                <button className="btn-ghost text-xs" onClick={() => setSavedId(null)}>Dismiss</button>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
