import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useAssessment } from '../../context/AssessmentContext';
import { composeScenario } from '../scenarioEngine/scenarioComposer';
import * as sapi from '../scenarioEngine/scenarioApi';
import type { ComposeInput, GeneratedScenario, ScenarioInstanceRow } from '../scenarioEngine/types';

interface ScenarioContextValue {
  ready: boolean;
  current: GeneratedScenario | null;
  history: ScenarioInstanceRow[];
  generate: (input: ComposeInput) => GeneratedScenario;
  regenerate: () => GeneratedScenario | null;
}

const ScenarioCtx = createContext<ScenarioContextValue | null>(null);

export function ScenarioProvider({ children }: { children: ReactNode }) {
  const { candidate } = useAssessment();
  const candidateId = candidate?.id ?? null;
  const [current, setCurrent] = useState<GeneratedScenario | null>(null);
  const [lastInput, setLastInput] = useState<ComposeInput | null>(null);
  const [history, setHistory] = useState<ScenarioInstanceRow[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    if (!candidateId) { setReady(false); return; }
    (async () => {
      const rows = await sapi.fetchScenarioInstances(candidateId);
      if (!active) return;
      setHistory(rows);
      setReady(true);
    })();
    return () => { active = false; };
  }, [candidateId]);

  const persist = useCallback((s: GeneratedScenario) => {
    if (!candidateId) return;
    const row: ScenarioInstanceRow = {
      candidate_id: candidateId, scenario_id: s.id, role: s.role, path_id: s.pathId ?? null,
      personality: s.personality.name, emotion: s.emotion, goals: s.goals.map((g) => g.title),
      difficulty: s.difficulty, scenario_type: s.scenarioType.label, created_at: s.createdAt,
    };
    setHistory((prev) => [row, ...prev.filter((r) => r.scenario_id !== s.id)]);
    void sapi.saveScenarioInstance(row);
  }, [candidateId]);

  const generate = useCallback((input: ComposeInput) => {
    const s = composeScenario(input);
    setCurrent(s);
    setLastInput(input);
    persist(s);
    return s;
  }, [persist]);

  const regenerate = useCallback(() => {
    if (!lastInput) return null;
    return generate({ ...lastInput, seed: undefined });
  }, [lastInput, generate]);

  const value: ScenarioContextValue = { ready, current, history, generate, regenerate };
  return <ScenarioCtx.Provider value={value}>{children}</ScenarioCtx.Provider>;
}

export function useScenario() {
  const ctx = useContext(ScenarioCtx);
  if (!ctx) throw new Error('useScenario must be used within ScenarioProvider');
  return ctx;
}
