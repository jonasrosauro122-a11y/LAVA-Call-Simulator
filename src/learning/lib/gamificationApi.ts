import { supabase } from '../../lib/supabase';
import type { StreakRow, AchievementProgressRow, ChallengeClaimRow, RankHistoryRow } from '../types/learning';

export function defaultStreak(candidateId: string): StreakRow {
  return { candidate_id: candidateId, current_streak: 0, longest_streak: 0, last_active: null };
}

export async function fetchStreak(candidateId: string): Promise<StreakRow> {
  try {
    const { data } = await supabase.from('daily_streaks').select('*').eq('candidate_id', candidateId).maybeSingle();
    if (data) return data as StreakRow;
    const created = defaultStreak(candidateId);
    await supabase.from('daily_streaks').insert(created);
    return created;
  } catch {
    return defaultStreak(candidateId);
  }
}

export async function saveStreak(row: StreakRow): Promise<void> {
  try {
    await supabase.from('daily_streaks').upsert({ ...row, updated_at: new Date().toISOString() }, { onConflict: 'candidate_id' });
  } catch { /* offline-tolerant */ }
}

export async function fetchUnlockedAchievements(candidateId: string): Promise<AchievementProgressRow[]> {
  try {
    const { data } = await supabase.from('achievement_progress').select('*').eq('candidate_id', candidateId);
    return (data as AchievementProgressRow[]) ?? [];
  } catch { return []; }
}

export async function unlockAchievement(candidateId: string, achievementId: string): Promise<void> {
  try {
    await supabase.from('achievement_progress').upsert(
      { candidate_id: candidateId, achievement_id: achievementId, unlocked_at: new Date().toISOString() },
      { onConflict: 'candidate_id,achievement_id' },
    );
  } catch { /* offline-tolerant */ }
}

export async function fetchClaims(candidateId: string): Promise<ChallengeClaimRow[]> {
  try {
    const { data } = await supabase.from('challenge_progress').select('*').eq('candidate_id', candidateId);
    return (data as ChallengeClaimRow[]) ?? [];
  } catch { return []; }
}

export async function addClaim(candidateId: string, challengeId: string): Promise<void> {
  try {
    await supabase.from('challenge_progress').upsert(
      { candidate_id: candidateId, challenge_id: challengeId, claimed_at: new Date().toISOString() },
      { onConflict: 'candidate_id,challenge_id' },
    );
  } catch { /* offline-tolerant */ }
}

export async function addRankHistory(row: RankHistoryRow): Promise<void> {
  try {
    await supabase.from('rank_history').insert({ ...row, reached_at: new Date().toISOString() });
  } catch { /* offline-tolerant */ }
}
