import { supabase } from '../../lib/supabase';
import type { TrainerNote } from '../types';

export async function fetchTrainerNotes(trainerId: string): Promise<TrainerNote[]> {
  try {
    const { data } = await supabase.from('trainer_notes').select('*').eq('trainer_id', trainerId).order('created_at', { ascending: false });
    return ((data as unknown as { id: string; learner_id: string; trainer_id: string; text: string; created_at: string }[]) ?? [])
      .map((r) => ({ id: r.id, learnerId: r.learner_id, trainerId: r.trainer_id, text: r.text, createdAt: r.created_at }));
  } catch { return []; }
}

export async function saveTrainerNote(note: TrainerNote): Promise<void> {
  try {
    await supabase.from('trainer_notes').insert({
      learner_id: note.learnerId, trainer_id: note.trainerId, text: note.text, created_at: note.createdAt,
    });
  } catch { /* offline-tolerant */ }
}
