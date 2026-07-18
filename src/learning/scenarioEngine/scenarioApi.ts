import { supabase } from '../../lib/supabase';
import type { ScenarioInstanceRow, SimulationSessionRow } from './types';

export async function saveScenarioInstance(row: ScenarioInstanceRow): Promise<void> {
  try {
    await supabase.from('scenario_instances').upsert(row, { onConflict: 'candidate_id,scenario_id' });
  } catch { /* offline-tolerant */ }
}

export async function fetchScenarioInstances(candidateId: string): Promise<ScenarioInstanceRow[]> {
  try {
    const { data } = await supabase
      .from('scenario_instances').select('*').eq('candidate_id', candidateId)
      .order('created_at', { ascending: false }).limit(100);
    return (data as ScenarioInstanceRow[]) ?? [];
  } catch { return []; }
}

export async function saveSimulationSession(row: SimulationSessionRow): Promise<void> {
  try {
    await supabase.from('simulation_sessions').insert(row);
  } catch { /* offline-tolerant */ }
}
