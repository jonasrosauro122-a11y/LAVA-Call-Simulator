// Shared snapshot of a learner's gamification-relevant stats.
export interface GamStats {
  xp: number;
  lessons: number;
  quizzesPassed: number;
  perfectQuizzes: number;
  sims: number;
  perfectSims: number;
  modules: number;
  paths: number;
  certificatePathIds: string[];
  currentStreak: number;
  longestStreak: number;
  xpToday: number;
}

export type AchievementCategory = 'milestone' | 'streak' | 'mastery' | 'skill';

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  icon: string; // lucide icon name
  xpReward: number;
  category: AchievementCategory;
  target: number;
  value: (s: GamStats) => number;
}

export interface AchievementView {
  def: AchievementDef;
  current: number;
  target: number;
  unlocked: boolean;
  progressPct: number;
}

const has = (s: GamStats, pathId: string) => (s.certificatePathIds.includes(pathId) ? 1 : 0);

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first_lesson', title: 'First Steps', description: 'Complete your first lesson', icon: 'BookOpen', xpReward: 20, category: 'milestone', target: 1, value: (s) => s.lessons },
  { id: 'first_quiz', title: 'Quiz Rookie', description: 'Pass your first quiz', icon: 'HelpCircle', xpReward: 25, category: 'milestone', target: 1, value: (s) => s.quizzesPassed },
  { id: 'first_sim', title: 'On the Line', description: 'Complete your first simulation', icon: 'Mic2', xpReward: 30, category: 'milestone', target: 1, value: (s) => s.sims },
  { id: 'first_certificate', title: 'Certified', description: 'Earn your first certificate', icon: 'Award', xpReward: 100, category: 'milestone', target: 1, value: (s) => s.paths },
  { id: 'streak_7', title: '7-Day Streak', description: 'Practice 7 days in a row', icon: 'Flame', xpReward: 70, category: 'streak', target: 7, value: (s) => s.longestStreak },
  { id: 'streak_30', title: '30-Day Streak', description: 'Practice 30 days in a row', icon: 'Flame', xpReward: 300, category: 'streak', target: 30, value: (s) => s.longestStreak },
  { id: 'xp_1000', title: 'Rising Star', description: 'Earn 1,000 total XP', icon: 'Star', xpReward: 50, category: 'milestone', target: 1000, value: (s) => s.xp },
  { id: 'xp_5000', title: 'XP Machine', description: 'Earn 5,000 total XP', icon: 'Zap', xpReward: 150, category: 'milestone', target: 5000, value: (s) => s.xp },
  { id: 'perfect_quiz', title: 'Perfect Quiz', description: 'Score 100% on a quiz', icon: 'CheckCircle2', xpReward: 40, category: 'skill', target: 1, value: (s) => s.perfectQuizzes },
  { id: 'perfect_sim', title: 'Flawless Call', description: 'Score 95+ on a simulation', icon: 'Sparkles', xpReward: 60, category: 'skill', target: 1, value: (s) => s.perfectSims },
  { id: 'fast_learner', title: 'Fast Learner', description: 'Earn 200 XP in a single day', icon: 'Rocket', xpReward: 50, category: 'skill', target: 200, value: (s) => s.xpToday },
  { id: 'critical_thinker', title: 'Critical Thinker', description: 'Pass 5 quizzes', icon: 'Brain', xpReward: 60, category: 'skill', target: 5, value: (s) => s.quizzesPassed },
  { id: 'insurance_expert', title: 'Insurance Expert', description: 'Complete the Insurance CSR path', icon: 'ShieldCheck', xpReward: 120, category: 'mastery', target: 1, value: (s) => has(s, 'insurance-csr') },
  { id: 'cold_calling_master', title: 'Cold Calling Master', description: 'Complete the Cold Calling path', icon: 'PhoneOutgoing', xpReward: 120, category: 'mastery', target: 1, value: (s) => has(s, 'cold-calling') },
  { id: 'medical_va_specialist', title: 'Medical VA Specialist', description: 'Complete the Medical VA path', icon: 'Stethoscope', xpReward: 120, category: 'mastery', target: 1, value: (s) => has(s, 'medical-va') },
  { id: 'exec_assistant_expert', title: 'Executive Assistant Expert', description: 'Complete the Executive Assistant path', icon: 'Briefcase', xpReward: 120, category: 'mastery', target: 1, value: (s) => has(s, 'executive-assistant') },
  { id: 'receptionist_professional', title: 'Receptionist Professional', description: 'Complete the Receptionist path', icon: 'Bell', xpReward: 120, category: 'mastery', target: 1, value: (s) => has(s, 'receptionist') },
];

export function evaluateAchievements(stats: GamStats, unlockedIds: Set<string>): AchievementView[] {
  return ACHIEVEMENTS.map((def) => {
    const current = Math.min(def.value(stats), def.target);
    const unlocked = unlockedIds.has(def.id) || current >= def.target;
    return { def, current, target: def.target, unlocked, progressPct: Math.round((current / def.target) * 100) };
  });
}

// Achievements that are satisfied by stats but not yet persisted as unlocked.
export function newlyUnlocked(stats: GamStats, unlockedIds: Set<string>): AchievementDef[] {
  return ACHIEVEMENTS.filter((def) => !unlockedIds.has(def.id) && def.value(stats) >= def.target);
}
