import {
  createContext, useContext, useMemo, useEffect, useRef, useCallback, type ReactNode,
} from 'react';
import { useAssessment } from '../../context/AssessmentContext';
import { useLearning } from './LearningContext';
import { analyzeSimulation, rankMetrics } from '../analysis/metricsEngine';
import { generateAICoach } from '../analysis/coachEngine';
import { recommend } from '../analysis/recommendationEngine';
import { computeDifficulty } from '../analysis/difficultyEngine';
import * as aapi from '../analysis/analysisApi';
import { LEARNING_PATHS, getPath } from '../content/paths';
import { METRICS, type SimulationAnalysis, type CommunicationScores, type Metric, type RadarAxis, type TrendPoint, type DifficultyState, type Recommendation } from '../analysis/types';

interface AnalysisContextValue {
  ready: boolean;
  hasData: boolean;
  analyses: SimulationAnalysis[]; // newest first
  getAnalysis: (id: string) => SimulationAnalysis | undefined;
  aggregateScores: CommunicationScores;
  overallScore: number;
  radar: RadarAxis[];
  trends: TrendPoint[];
  strengths: { metric: Metric; score: number }[];
  weaknesses: { metric: Metric; score: number }[];
  difficulty: DifficultyState;
  recommendations: Recommendation[];
  learningVelocity: number;
  completionRate: number;
}

const AnalysisContext = createContext<AnalysisContextValue | null>(null);

const zeroScores = (): CommunicationScores => {
  const s = {} as CommunicationScores;
  for (const m of METRICS) s[m] = 0;
  return s;
};

const PENDING_KEY = 'lava_pending_sim';

export function AnalysisProvider({ children }: { children: ReactNode }) {
  const { candidate, moduleScores } = useAssessment();
  const learning = useLearning();
  const candidateId = candidate?.id ?? null;

  const activePathId = learning.profile?.active_path ?? learning.enrollments[0]?.path_id ?? null;

  const analyses = useMemo<SimulationAnalysis[]>(() => {
    const pathTitle = activePathId ? getPath(activePathId)?.title : undefined;
    return [...moduleScores]
      .map((ms) => analyzeSimulation(ms, { pathId: activePathId ?? undefined, pathTitle }))
      .sort((a, b) => (b.timestamp ?? '').localeCompare(a.timestamp ?? ''));
  }, [moduleScores, activePathId]);

  const hasData = analyses.length > 0;

  const aggregateScores = useMemo<CommunicationScores>(() => {
    if (!analyses.length) return zeroScores();
    const acc = zeroScores();
    for (const a of analyses) for (const m of METRICS) acc[m] += a.scores[m];
    for (const m of METRICS) acc[m] = Math.round(acc[m] / analyses.length);
    return acc;
  }, [analyses]);

  const overallScore = useMemo(() => {
    if (!analyses.length) return 0;
    return Math.round(analyses.reduce((s, a) => s + a.communicationScore, 0) / analyses.length);
  }, [analyses]);

  const ranked = useMemo(() => rankMetrics(aggregateScores), [aggregateScores]);
  const weaknesses = useMemo(() => ranked.slice(0, 3), [ranked]);
  const strengths = useMemo(() => [...ranked].reverse().slice(0, 3), [ranked]);

  const radar = useMemo<RadarAxis[]>(() => ([
    { skill: 'Communication', score: aggregateScores['Clarity'] },
    { skill: 'Grammar', score: aggregateScores['Grammar'] },
    { skill: 'Confidence', score: aggregateScores['Speaking Confidence'] },
    { skill: 'Listening', score: aggregateScores['Listening Skills'] },
    { skill: 'Critical Thinking', score: aggregateScores['Critical Thinking'] },
    { skill: 'Professionalism', score: aggregateScores['Professionalism'] },
    { skill: 'Empathy', score: aggregateScores['Empathy'] },
    { skill: 'Sales', score: aggregateScores['Sales Skills'] },
    { skill: 'Customer Service', score: aggregateScores['Customer Focus'] },
  ]), [aggregateScores]);

  const trends = useMemo<TrendPoint[]>(() => {
    const chrono = [...analyses].reverse(); // oldest -> newest
    return chrono.map((a, i) => ({
      date: a.timestamp,
      label: `#${i + 1}`,
      Overall: a.communicationScore,
      Grammar: a.scores['Grammar'],
      Confidence: a.scores['Speaking Confidence'],
      Vocabulary: a.scores['Vocabulary'],
      'Critical Thinking': a.scores['Critical Thinking'],
      Professionalism: a.scores['Professionalism'],
      Empathy: a.scores['Empathy'],
      'Sales Skills': a.scores['Sales Skills'],
    }));
  }, [analyses]);

  const modulesCompleted = useMemo(() => {
    let n = 0;
    for (const p of LEARNING_PATHS) n += learning.getPathProgress(p).completedModules;
    return n;
  }, [learning]);

  const difficulty = useMemo(() => {
    const quizVals = Object.values(learning.progressInput.quizScores);
    const avgQuiz = quizVals.length ? quizVals.reduce((a, b) => a + b, 0) / quizVals.length : 0;
    const avgSim = analyses.length ? analyses.reduce((s, a) => s + a.overallScore, 0) / analyses.length : 0;
    const slope = trends.length >= 2 ? ((trends[trends.length - 1].Overall as number) - (trends[0].Overall as number)) / trends.length : 0;
    return computeDifficulty({ avgQuiz, avgSim, modulesCompleted, trendSlope: slope });
  }, [learning.progressInput, analyses, trends, modulesCompleted]);

  const recommendations = useMemo(() => recommend(aggregateScores), [aggregateScores]);

  const learningVelocity = useMemo(() => {
    const weekAgo = Date.now() - 7 * 86400000;
    return analyses.filter((a) => a.timestamp && new Date(a.timestamp).getTime() >= weekAgo).length;
  }, [analyses]);

  const completionRate = useMemo(() => {
    const enrolled = learning.enrollments.map((e) => getPath(e.path_id)).filter(Boolean);
    if (!enrolled.length) return 0;
    const sum = enrolled.reduce((s, p) => s + learning.getPathProgress(p!).progressPct, 0);
    return Math.round(sum / enrolled.length);
  }, [learning]);

  // ---- Persist analyses best-effort (does not affect UI, which uses in-memory data) ----
  const persistedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!candidateId) return;
    let active = true;
    (async () => {
      const processed = persistedRef.current.size ? persistedRef.current : await aapi.fetchProcessedIds(candidateId);
      if (!active) return;
      persistedRef.current = processed;
      for (const a of analyses) {
        if (processed.has(a.simulationId)) continue;
        processed.add(a.simulationId);
        void aapi.saveSimulationAnalysis({
          candidate_id: candidateId, simulation_id: a.simulationId, path_id: a.pathId ?? null,
          module_name: a.moduleName, scenario: a.scenario, duration_seconds: a.durationSeconds,
          overall_score: a.overallScore, communication_score: a.communicationScore,
        });
        void aapi.saveCommunicationScores({ candidate_id: candidateId, simulation_id: a.simulationId, scores: a.scores });
        void aapi.saveAiFeedback({ candidate_id: candidateId, simulation_id: a.simulationId, report: generateAICoach(a) });
      }
    })();
    return () => { active = false; };
  }, [analyses, candidateId]);

  // ---- Link a simulation launched from a learning module back into the learning layer ----
  // The simulator is untouched; ModuleDetailPage drops a pending marker before launching,
  // and we reconcile it here when the resulting module_score appears.
  const linkedRef = useRef(false);
  useEffect(() => {
    if (!candidateId || linkedRef.current) return;
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(PENDING_KEY) : null;
    if (!raw) return;
    try {
      const pending = JSON.parse(raw) as { pathId: string; moduleId: string; moduleNumber: number; minScore: number; ts: number };
      const match = moduleScores
        .filter((m) => m.module_number === pending.moduleNumber && new Date(m.created_at).getTime() >= pending.ts - 2000)
        .sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))[0];
      if (match) {
        linkedRef.current = true;
        void learning.recordSimulation(pending.pathId, pending.moduleId, match.score, pending.minScore);
        localStorage.removeItem(PENDING_KEY);
      }
    } catch { localStorage.removeItem(PENDING_KEY); }
  }, [moduleScores, candidateId, learning]);

  const getAnalysis = useCallback((id: string) => analyses.find((a) => a.id === id), [analyses]);

  const value: AnalysisContextValue = {
    ready: learning.ready, hasData, analyses, getAnalysis, aggregateScores, overallScore,
    radar, trends, strengths, weaknesses, difficulty, recommendations, learningVelocity, completionRate,
  };

  return <AnalysisContext.Provider value={value}>{children}</AnalysisContext.Provider>;
}

export function useAnalysis() {
  const ctx = useContext(AnalysisContext);
  if (!ctx) throw new Error('useAnalysis must be used within AnalysisProvider');
  return ctx;
}
