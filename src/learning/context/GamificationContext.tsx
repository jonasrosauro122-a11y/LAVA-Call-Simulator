import {
  createContext, useContext, useState, useEffect, useRef, useCallback, useMemo, type ReactNode,
} from 'react';
import { useAssessment } from '../../context/AssessmentContext';
import { useLearning } from './LearningContext';
import * as gapi from '../lib/gamificationApi';
import { getRank, type Rank } from '../lib/rankEngine';
import {
  evaluateAchievements, newlyUnlocked, ACHIEVEMENTS, type GamStats, type AchievementView,
} from '../lib/achievements';
import {
  buildDailyChallenges, buildWeeklyGoals, evaluateChallenges, type ChallengeView, type PeriodCounts,
} from '../lib/challenges';
import { applyActivity, effectiveCurrent, todayKey } from '../lib/streak';
import { buildLeaderboard, myRank, type LeaderScope, type LeaderEntry, type MeStats } from '../lib/leaderboard';
import { LEARNING_PATHS, getPath } from '../content/paths';
import type { StreakRow, ChallengeClaimRow, XpReason } from '../types/learning';

export interface XpToast { id: string; amount: number; label: string; }

interface GamificationContextValue {
  ready: boolean;
  stats: GamStats;
  rank: Rank;
  streak: { current: number; longest: number; lastActive: string | null };
  achievements: AchievementView[];
  unlockedCount: number;
  dailyChallenges: ChallengeView[];
  weeklyGoals: ChallengeView[];
  leaderboard: (scope: LeaderScope) => LeaderEntry[];
  myLeaderboardRank: (scope: LeaderScope) => number;
  meStats: MeStats;
  xpToasts: XpToast[];
  levelUp: { from: number; to: number } | null;
  dismissLevelUp: () => void;
}

const GamificationContext = createContext<GamificationContextValue | null>(null);

const REASON_LABEL: Record<XpReason, string> = {
  lesson_complete: 'Lesson complete', quiz_pass: 'Quiz passed', quiz_perfect: 'Perfect quiz',
  simulation_pass: 'Simulation passed', module_complete: 'Module complete', path_complete: 'Path complete',
  daily_streak: 'Streak bonus', achievement: 'Achievement', daily_challenge: 'Daily challenge', weekly_goal: 'Weekly goal',
};

function startOfToday() { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); }
function startOfWeek() { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - d.getDay()); return d.getTime(); }
function startOfMonth() { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(1); return d.getTime(); }

export function GamificationProvider({ children }: { children: ReactNode }) {
  const { candidate } = useAssessment();
  const learning = useLearning();
  const { level, xpEvents, progressInput, certificates, awardXp, todayXp, weekXp } = learning;
  const candidateId = candidate?.id ?? null;

  const [gamReady, setGamReady] = useState(false);
  const [streakRow, setStreakRow] = useState<StreakRow>(() => gapi.defaultStreak(''));
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set());
  const [claims, setClaims] = useState<ChallengeClaimRow[]>([]);
  const [xpToasts, setXpToasts] = useState<XpToast[]>([]);
  const [levelUp, setLevelUp] = useState<{ from: number; to: number } | null>(null);

  const initialized = useRef(false);
  const processedXp = useRef(0);
  const levelRef = useRef(1);
  const inFlight = useRef<Set<string>>(new Set());

  const claimSet = useMemo(() => new Set(claims.map((c) => c.challenge_id)), [claims]);

  // ---- Load persisted gamification state ----
  useEffect(() => {
    let active = true;
    initialized.current = false;
    setGamReady(false);
    if (!candidateId) return;
    (async () => {
      const [s, unlocked, cl] = await Promise.all([
        gapi.fetchStreak(candidateId),
        gapi.fetchUnlockedAchievements(candidateId),
        gapi.fetchClaims(candidateId),
      ]);
      if (!active) return;
      setStreakRow(s);
      setUnlockedIds(new Set(unlocked.map((u) => u.achievement_id)));
      setClaims(cl);
      setGamReady(true);
    })();
    return () => { active = false; };
  }, [candidateId]);

  // ---- Baseline once both providers are ready (silences historical events) ----
  useEffect(() => {
    if (initialized.current) return;
    if (!gamReady || !learning.ready) return;
    processedXp.current = xpEvents.length;
    levelRef.current = level.level;
    initialized.current = true;
  }, [gamReady, learning.ready, xpEvents.length, level.level]);

  const pushToast = useCallback((amount: number, label: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setXpToasts((prev) => [...prev, { id, amount, label }]);
    setTimeout(() => setXpToasts((prev) => prev.filter((t) => t.id !== id)), 2600);
  }, []);

  // ---- Turn newly-earned XP events into toasts + keep the streak alive ----
  useEffect(() => {
    if (!initialized.current) return;
    if (xpEvents.length <= processedXp.current) return;
    const fresh = xpEvents.slice(0, xpEvents.length - processedXp.current);
    processedXp.current = xpEvents.length;
    fresh.forEach((e) => pushToast(e.amount, REASON_LABEL[e.reason as XpReason] ?? 'XP earned'));

    // Any fresh activity bumps the streak (once per day).
    setStreakRow((prev) => {
      if (prev.last_active === todayKey()) return prev;
      const upd = applyActivity(prev, todayKey());
      const next: StreakRow = { candidate_id: prev.candidate_id || (candidateId ?? ''), current_streak: upd.current_streak, longest_streak: upd.longest_streak, last_active: upd.last_active };
      void gapi.saveStreak(next);
      if (upd.increased && upd.current_streak > 1) pushToast(0, `🔥 ${upd.current_streak}-day streak!`);
      return next;
    });
  }, [xpEvents, pushToast, candidateId]);

  // ---- Level-up detection ----
  useEffect(() => {
    if (!initialized.current) return;
    if (level.level > levelRef.current) {
      setLevelUp({ from: levelRef.current, to: level.level });
      levelRef.current = level.level;
    }
  }, [level.level]);

  // ---- Derived stats ----
  const completedModuleIds = useMemo(() => {
    const ids: string[] = [];
    for (const p of LEARNING_PATHS) {
      const pp = learning.getPathProgress(p);
      pp.modules.forEach((m) => { if (m.complete) ids.push(m.moduleId); });
    }
    return ids;
  }, [learning]);

  const stats = useMemo<GamStats>(() => {
    const countReason = (r: XpReason) => xpEvents.filter((e) => e.reason === r).length;
    const perfectSims = Object.values(progressInput.simScores).filter((v) => v >= 95).length;
    return {
      xp: level.totalXp,
      lessons: progressInput.completedLessonIds.size,
      quizzesPassed: countReason('quiz_pass'),
      perfectQuizzes: countReason('quiz_perfect'),
      sims: countReason('simulation_pass'),
      perfectSims,
      modules: completedModuleIds.length,
      paths: certificates.length,
      certificatePathIds: certificates.map((c) => c.path_id),
      currentStreak: effectiveCurrent(streakRow),
      longestStreak: streakRow.longest_streak,
      xpToday: todayXp,
    };
  }, [xpEvents, progressInput, level.totalXp, completedModuleIds, certificates, streakRow, todayXp]);

  const rank = useMemo(() => getRank(stats.xp), [stats.xp]);

  // ---- Period counts for challenges/goals ----
  const dayCounts = useMemo<PeriodCounts>(() => {
    const since = startOfToday();
    const within = (e: { created_at?: string }) => e.created_at && new Date(e.created_at).getTime() >= since;
    const cr = (r: XpReason) => xpEvents.filter((e) => e.reason === r && within(e)).length;
    return { lessons: cr('lesson_complete'), quizzes: cr('quiz_pass'), sims: cr('simulation_pass'), xp: todayXp, modules: cr('module_complete') };
  }, [xpEvents, todayXp]);

  const weekCounts = useMemo<PeriodCounts>(() => {
    const since = startOfWeek();
    const within = (t?: string) => t && new Date(t).getTime() >= since;
    const cr = (r: XpReason) => xpEvents.filter((e) => e.reason === r && within(e.created_at)).length;
    const modulesWeek = claims.filter((c) => c.challenge_id.startsWith('module-') && within(c.claimed_at)).length;
    return { lessons: cr('lesson_complete'), quizzes: cr('quiz_pass'), sims: cr('simulation_pass'), xp: weekXp, modules: modulesWeek };
  }, [xpEvents, weekXp, claims]);

  const dailyChallenges = useMemo(() => evaluateChallenges(buildDailyChallenges(), dayCounts, claimSet), [dayCounts, claimSet]);
  const weeklyGoals = useMemo(() => evaluateChallenges(buildWeeklyGoals(), weekCounts, claimSet), [weekCounts, claimSet]);
  const achievements = useMemo(() => evaluateAchievements(stats, unlockedIds), [stats, unlockedIds]);

  // ---- Monotonic award helper (persists a claim so it never repeats) ----
  const awardOnce = useCallback(async (claimId: string, reason: XpReason, amount: number, toastLabel?: string) => {
    if (!candidateId) return;
    if (claimSet.has(claimId) || inFlight.current.has(claimId)) return;
    inFlight.current.add(claimId);
    setClaims((prev) => [...prev, { candidate_id: candidateId, challenge_id: claimId, claimed_at: new Date().toISOString() }]);
    await gapi.addClaim(candidateId, claimId);
    await awardXp(reason, amount);
    if (toastLabel) pushToast(0, toastLabel);
    inFlight.current.delete(claimId);
  }, [candidateId, claimSet, awardXp, pushToast]);

  // ---- Award module completions + issue certificates on path completion ----
  useEffect(() => {
    if (!initialized.current || !candidateId) return;
    completedModuleIds.forEach((id) => { void awardOnce(`module-${id}`, 'module_complete', 50); });
    for (const p of LEARNING_PATHS) {
      if (learning.getPathProgress(p).complete && !certificates.some((c) => c.path_id === p.id)) {
        const path = getPath(p.id);
        if (path) void learning.issueCertificate(path);
      }
    }
  }, [completedModuleIds, certificates, candidateId, awardOnce, learning]);

  // ---- Unlock achievements ----
  useEffect(() => {
    if (!initialized.current || !candidateId) return;
    const fresh = newlyUnlocked(stats, unlockedIds);
    fresh.forEach((def) => {
      if (inFlight.current.has(`ach-${def.id}`)) return;
      inFlight.current.add(`ach-${def.id}`);
      setUnlockedIds((prev) => new Set(prev).add(def.id));
      void gapi.unlockAchievement(candidateId, def.id);
      void awardXp('achievement', def.xpReward);
      pushToast(0, `🏆 ${def.title}`);
      inFlight.current.delete(`ach-${def.id}`);
    });
  }, [stats, unlockedIds, candidateId, awardXp, pushToast]);

  // ---- Auto-claim completed challenges/goals ----
  useEffect(() => {
    if (!initialized.current || !candidateId) return;
    [...dailyChallenges].forEach((cv) => {
      if (cv.complete && !cv.claimed) void awardOnce(cv.challenge.id, 'daily_challenge', cv.challenge.reward, `Daily challenge: ${cv.challenge.title}`);
    });
    [...weeklyGoals].forEach((cv) => {
      if (cv.complete && !cv.claimed) void awardOnce(cv.challenge.id, 'weekly_goal', cv.challenge.reward, `Weekly goal: ${cv.challenge.title}`);
    });
  }, [dailyChallenges, weeklyGoals, candidateId, awardOnce]);

  const meStats = useMemo<MeStats>(() => {
    const monthSince = startOfMonth();
    const monthly = xpEvents.filter((e) => e.created_at && new Date(e.created_at).getTime() >= monthSince).reduce((a, e) => a + e.amount, 0);
    return {
      name: candidate ? `${candidate.first_name} ${candidate.last_name}` : 'You',
      weekly: weekXp, monthly, all: stats.xp,
      certificates: stats.paths, streak: stats.currentStreak, sims: stats.sims,
    };
  }, [candidate, weekXp, xpEvents, stats]);

  const leaderboard = useCallback((scope: LeaderScope) => buildLeaderboard(scope, meStats), [meStats]);
  const myLeaderboardRank = useCallback((scope: LeaderScope) => myRank(scope, meStats), [meStats]);

  const value: GamificationContextValue = {
    ready: gamReady,
    stats,
    rank,
    streak: { current: effectiveCurrent(streakRow), longest: streakRow.longest_streak, lastActive: streakRow.last_active },
    achievements,
    unlockedCount: achievements.filter((a) => a.unlocked).length,
    dailyChallenges,
    weeklyGoals,
    leaderboard,
    myLeaderboardRank,
    meStats,
    xpToasts,
    levelUp,
    dismissLevelUp: () => setLevelUp(null),
  };

  return <GamificationContext.Provider value={value}>{children}</GamificationContext.Provider>;
}

export function useGamification() {
  const ctx = useContext(GamificationContext);
  if (!ctx) throw new Error('useGamification must be used within GamificationProvider');
  return ctx;
}

export { ACHIEVEMENTS };
