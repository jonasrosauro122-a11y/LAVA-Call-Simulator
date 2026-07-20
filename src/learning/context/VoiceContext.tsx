import {
  createContext, useContext, useMemo, useEffect, useRef, useCallback, type ReactNode,
} from 'react';
import { useAssessment } from '../../context/AssessmentContext';
import { useLearning } from './LearningContext';
import { extractVoiceInput } from '../voiceEngine/extract';
import { analyzeVoice } from '../voiceEngine/voiceMetricsEngine';
import { voiceRegistry } from '../voiceEngine/voiceEngine';
import { buildVoiceTrends, type VoiceTrends } from '../voiceEngine/voiceHistoryEngine';
import * as vapi from '../voiceEngine/voiceApi';
import type { VoiceAnalysis } from '../voiceEngine/types';

interface VoiceContextValue {
  ready: boolean;
  hasData: boolean;
  analyses: VoiceAnalysis[]; // newest first
  getAnalysis: (id: string) => VoiceAnalysis | undefined;
  trends: VoiceTrends;
  overallVoiceScore: number;
}

const VoiceCtx = createContext<VoiceContextValue | null>(null);

export function VoiceProvider({ children }: { children: ReactNode }) {
  const { candidate, moduleScores } = useAssessment();
  const learning = useLearning();
  const candidateId = candidate?.id ?? null;

  const analyses = useMemo<VoiceAnalysis[]>(() => {
    const providerId = voiceRegistry.getDefaultId() ?? 'mock-whisper';
    return [...moduleScores]
      .map((ms) => analyzeVoice(extractVoiceInput(ms), {
        mode: 'offline', provider: providerId, moduleName: ms.module_name, createdAt: ms.created_at,
      }))
      .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
  }, [moduleScores]);

  const hasData = analyses.length > 0;
  const trends = useMemo(() => buildVoiceTrends(analyses), [analyses]);
  const overallVoiceScore = trends.overallVoiceScore;

  const getAnalysis = useCallback((id: string) => analyses.find((a) => a.simulationId === id), [analyses]);

  // Persist best-effort (UI uses in-memory analyses regardless).
  const persistedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!candidateId) return;
    let active = true;
    (async () => {
      const processed = persistedRef.current.size ? persistedRef.current : await vapi.fetchVoiceProcessedIds(candidateId);
      if (!active) return;
      persistedRef.current = processed;
      for (const a of analyses) {
        if (processed.has(a.simulationId)) continue;
        processed.add(a.simulationId);
        void vapi.saveVoiceAnalysis({
          candidate_id: candidateId, simulation_id: a.simulationId, provider: a.provider, mode: a.mode,
          overall_voice_score: a.overallVoiceScore, duration_seconds: a.durationSeconds,
        });
        void vapi.saveVoiceScores({
          candidate_id: candidateId, simulation_id: a.simulationId,
          scores: {
            confidence: a.confidence.confidence, pronunciation: a.pronunciation.overall, fluency: a.speech.fluency,
            listening: a.speech.listeningRatio, professionalism: a.toneEnergy.professional,
            fillersPerMin: a.fillers.perMinute, wpm: a.speech.wpm, voiceScore: a.overallVoiceScore,
          },
        });
      }
    })();
    return () => { active = false; };
  }, [analyses, candidateId]);

  const value: VoiceContextValue = {
    ready: learning.ready, hasData, analyses, getAnalysis, trends, overallVoiceScore,
  };
  return <VoiceCtx.Provider value={value}>{children}</VoiceCtx.Provider>;
}

export function useVoice() {
  const ctx = useContext(VoiceCtx);
  if (!ctx) throw new Error('useVoice must be used within VoiceProvider');
  return ctx;
}
