import { supabase } from '../../lib/supabase';
import type {
  SimulationAnalysisRow, CommunicationScoreRow, AiFeedbackRow, DifficultyHistoryRow,
} from './types';

// All best-effort: the app tolerates a missing database, so failures are swallowed.

export async function saveSimulationAnalysis(row: SimulationAnalysisRow): Promise<void> {
  try {
    await supabase.from('simulation_analysis').upsert(row, { onConflict: 'candidate_id,simulation_id' });
  } catch { /* offline-tolerant */ }
}

export async function saveCommunicationScores(row: CommunicationScoreRow): Promise<void> {
  try {
    await supabase.from('communication_scores').upsert(row, { onConflict: 'candidate_id,simulation_id' });
  } catch { /* offline-tolerant */ }
}

export async function saveAiFeedback(row: AiFeedbackRow): Promise<void> {
  try {
    await supabase.from('ai_feedback').upsert(row, { onConflict: 'candidate_id,simulation_id' });
  } catch { /* offline-tolerant */ }
}

export async function fetchProcessedIds(candidateId: string): Promise<Set<string>> {
  try {
    const { data } = await supabase.from('simulation_analysis').select('simulation_id').eq('candidate_id', candidateId);
    return new Set(((data as { simulation_id: string }[]) ?? []).map((r) => r.simulation_id));
  } catch { return new Set(); }
}

export async function addDifficultyHistory(row: DifficultyHistoryRow): Promise<void> {
  try {
    await supabase.from('difficulty_history').insert({ ...row, created_at: new Date().toISOString() });
  } catch { /* offline-tolerant */ }
}
