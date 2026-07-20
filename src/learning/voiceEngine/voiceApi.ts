import { supabase } from '../../lib/supabase';
import type { VoiceAnalysisRow, VoiceScoreRow } from './types';

export async function saveVoiceAnalysis(row: VoiceAnalysisRow): Promise<void> {
  try {
    await supabase.from('voice_analysis').upsert(row, { onConflict: 'candidate_id,simulation_id' });
  } catch { /* offline-tolerant */ }
}

export async function saveVoiceScores(row: VoiceScoreRow): Promise<void> {
  try {
    await supabase.from('voice_scores').upsert(row, { onConflict: 'candidate_id,simulation_id' });
  } catch { /* offline-tolerant */ }
}

export async function fetchVoiceProcessedIds(candidateId: string): Promise<Set<string>> {
  try {
    const { data } = await supabase.from('voice_analysis').select('simulation_id').eq('candidate_id', candidateId);
    return new Set(((data as { simulation_id: string }[]) ?? []).map((r) => r.simulation_id));
  } catch { return new Set(); }
}
