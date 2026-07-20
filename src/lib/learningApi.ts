import { supabase } from '../../lib/supabase';
import type {
  LearnerProfile, PathEnrollment, LessonProgressRow, QuizAttemptRow,
  XpEventRow, CertificateRow, SimulationResultRow,
} from '../types/learning';

// All calls are best-effort: the app already tolerates a missing/placeholder
// database, so failures resolve to null/[] instead of throwing.

const DEFAULT_DAILY_GOAL = 60;
const DEFAULT_WEEKLY_GOAL = 300;

export function defaultProfile(candidateId: string): LearnerProfile {
  return {
    candidate_id: candidateId,
    xp: 0,
    level: 1,
    streak_days: 0,
    last_active: null,
    daily_goal_xp: DEFAULT_DAILY_GOAL,
    weekly_goal_xp: DEFAULT_WEEKLY_GOAL,
    active_path: null,
  };
}

export async function fetchProfile(candidateId: string): Promise<LearnerProfile> {
  try {
    const { data } = await supabase
      .from('learner_profiles').select('*').eq('candidate_id', candidateId).maybeSingle();
    if (data) return data as LearnerProfile;
    const created = defaultProfile(candidateId);
    await supabase.from('learner_profiles').insert(created);
    return created;
  } catch {
    return defaultProfile(candidateId);
  }
}

export async function saveProfile(profile: LearnerProfile): Promise<void> {
  try {
    await supabase
      .from('learner_profiles')
      .upsert({ ...profile, updated_at: new Date().toISOString() }, { onConflict: 'candidate_id' });
  } catch { /* offline-tolerant */ }
}

export async function fetchEnrollments(candidateId: string): Promise<PathEnrollment[]> {
  try {
    const { data } = await supabase.from('path_enrollments').select('*').eq('candidate_id', candidateId);
    return (data as PathEnrollment[]) ?? [];
  } catch { return []; }
}

export async function upsertEnrollment(row: PathEnrollment): Promise<void> {
  try {
    await supabase.from('path_enrollments').upsert(row, { onConflict: 'candidate_id,path_id' });
  } catch { /* offline-tolerant */ }
}

export async function fetchLessonProgress(candidateId: string): Promise<LessonProgressRow[]> {
  try {
    const { data } = await supabase.from('lesson_progress').select('*').eq('candidate_id', candidateId);
    return (data as LessonProgressRow[]) ?? [];
  } catch { return []; }
}

export async function addLessonProgress(row: LessonProgressRow): Promise<void> {
  try {
    await supabase.from('lesson_progress').upsert(row, { onConflict: 'candidate_id,lesson_id' });
  } catch { /* offline-tolerant */ }
}

export async function fetchQuizAttempts(candidateId: string): Promise<QuizAttemptRow[]> {
  try {
    const { data } = await supabase.from('quiz_attempts').select('*').eq('candidate_id', candidateId);
    return (data as QuizAttemptRow[]) ?? [];
  } catch { return []; }
}

export async function addQuizAttempt(row: QuizAttemptRow): Promise<void> {
  try {
    await supabase.from('quiz_attempts').insert(row);
  } catch { /* offline-tolerant */ }
}

export async function fetchSimulationResults(candidateId: string): Promise<SimulationResultRow[]> {
  try {
    const { data } = await supabase.from('module_simulations').select('*').eq('candidate_id', candidateId);
    return (data as SimulationResultRow[]) ?? [];
  } catch { return []; }
}

export async function addSimulationResult(row: SimulationResultRow): Promise<void> {
  try {
    await supabase.from('module_simulations').insert(row);
  } catch { /* offline-tolerant */ }
}

export async function fetchXpEvents(candidateId: string): Promise<XpEventRow[]> {
  try {
    const { data } = await supabase
      .from('xp_events').select('*').eq('candidate_id', candidateId)
      .order('created_at', { ascending: false }).limit(200);
    return (data as XpEventRow[]) ?? [];
  } catch { return []; }
}

export async function addXpEvent(row: XpEventRow): Promise<void> {
  try {
    await supabase.from('xp_events').insert(row);
  } catch { /* offline-tolerant */ }
}

export async function fetchCertificates(candidateId: string): Promise<CertificateRow[]> {
  try {
    const { data } = await supabase.from('certificates').select('*').eq('candidate_id', candidateId);
    return (data as CertificateRow[]) ?? [];
  } catch { return []; }
}

export async function addCertificate(row: CertificateRow): Promise<void> {
  try {
    await supabase.from('certificates').upsert(row, { onConflict: 'candidate_id,path_id' });
  } catch { /* offline-tolerant */ }
}
