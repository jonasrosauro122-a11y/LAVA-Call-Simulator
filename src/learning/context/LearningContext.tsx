import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import { useAssessment } from '../../context/AssessmentContext';
import * as api from '../lib/learningApi';
import { levelInfo, xpFor, type LevelInfo } from '../lib/xpEngine';
import { computePathProgress, type ProgressInput } from '../lib/progressEngine';
import { pathScore, isEligibleForCertificate } from '../lib/certification';
import type {
  LearnerProfile, PathEnrollment, LessonProgressRow, QuizAttemptRow,
  SimulationResultRow, XpEventRow, CertificateRow, LearningPath, PathProgress, Quiz, XpReason,
} from '../types/learning';

interface LearningContextValue {
  ready: boolean;
  profile: LearnerProfile | null;
  level: LevelInfo;
  enrollments: PathEnrollment[];
  certificates: CertificateRow[];
  xpEvents: XpEventRow[];
  todayXp: number;
  weekXp: number;
  progressInput: ProgressInput;
  isEnrolled: (pathId: string) => boolean;
  getPathProgress: (path: LearningPath) => PathProgress;
  enrollPath: (pathId: string) => Promise<void>;
  completeLesson: (pathId: string, moduleId: string, lessonId: string) => Promise<void>;
  submitQuiz: (pathId: string, moduleId: string, quiz: Quiz, answers: number[]) => Promise<{ score: number; passed: boolean }>;
  recordSimulation: (pathId: string, moduleId: string, score: number, minScore: number) => Promise<void>;
  issueCertificate: (path: LearningPath) => Promise<CertificateRow | null>;
  awardXp: (reason: XpReason, amountOverride?: number) => Promise<void>;
}

const LearningContext = createContext<LearningContextValue | null>(null);

function startOfToday(): number {
  const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime();
}
function startOfWeek(): number {
  const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - d.getDay()); return d.getTime();
}

export function LearningProvider({ children }: { children: ReactNode }) {
  const { candidate } = useAssessment();
  const candidateId = candidate?.id ?? null;

  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<LearnerProfile | null>(null);
  const [enrollments, setEnrollments] = useState<PathEnrollment[]>([]);
  const [lessonRows, setLessonRows] = useState<LessonProgressRow[]>([]);
  const [quizRows, setQuizRows] = useState<QuizAttemptRow[]>([]);
  const [simRows, setSimRows] = useState<SimulationResultRow[]>([]);
  const [xpEvents, setXpEvents] = useState<XpEventRow[]>([]);
  const [certificates, setCertificates] = useState<CertificateRow[]>([]);

  useEffect(() => {
    let active = true;
    if (!candidateId) { setReady(false); return; }
    setReady(false);
    (async () => {
      const [p, en, lp, qa, sr, xe, ce] = await Promise.all([
        api.fetchProfile(candidateId),
        api.fetchEnrollments(candidateId),
        api.fetchLessonProgress(candidateId),
        api.fetchQuizAttempts(candidateId),
        api.fetchSimulationResults(candidateId),
        api.fetchXpEvents(candidateId),
        api.fetchCertificates(candidateId),
      ]);
      if (!active) return;
      setProfile(p); setEnrollments(en); setLessonRows(lp);
      setQuizRows(qa); setSimRows(sr); setXpEvents(xe); setCertificates(ce);
      setReady(true);
    })();
    return () => { active = false; };
  }, [candidateId]);

  // Derived progress input.
  const progressInput = useMemo<ProgressInput>(() => {
    const completedLessonIds = new Set(lessonRows.map((r) => r.lesson_id));
    const quizScores: Record<string, number> = {};
    for (const r of quizRows) quizScores[r.quiz_id] = Math.max(quizScores[r.quiz_id] ?? 0, r.score);
    const simScores: Record<string, number> = {};
    for (const r of simRows) simScores[r.module_id] = Math.max(simScores[r.module_id] ?? 0, r.score);
    return { completedLessonIds, quizScores, simScores };
  }, [lessonRows, quizRows, simRows]);

  const level = useMemo(() => levelInfo(profile?.xp ?? 0), [profile?.xp]);

  const todayXp = useMemo(() => {
    const t = startOfToday();
    return xpEvents.filter((e) => e.created_at && new Date(e.created_at).getTime() >= t).reduce((a, e) => a + e.amount, 0);
  }, [xpEvents]);
  const weekXp = useMemo(() => {
    const t = startOfWeek();
    return xpEvents.filter((e) => e.created_at && new Date(e.created_at).getTime() >= t).reduce((a, e) => a + e.amount, 0);
  }, [xpEvents]);

  const awardXp = useCallback(async (reason: XpReason, amountOverride?: number) => {
    if (!candidateId) return;
    const amount = amountOverride ?? xpFor(reason);
    if (amount <= 0) return;
    const event: XpEventRow = { candidate_id: candidateId, amount, reason, created_at: new Date().toISOString() };
    setXpEvents((prev) => [event, ...prev]);
    setProfile((prev) => {
      const base = prev ?? api.defaultProfile(candidateId);
      const nextXp = base.xp + amount;
      const updated: LearnerProfile = { ...base, xp: nextXp, level: levelInfo(nextXp).level, last_active: new Date().toISOString() };
      void api.saveProfile(updated);
      return updated;
    });
    void api.addXpEvent(event);
  }, [candidateId]);

  const isEnrolled = useCallback((pathId: string) => enrollments.some((e) => e.path_id === pathId), [enrollments]);

  const getPathProgress = useCallback((path: LearningPath) => computePathProgress(path, progressInput), [progressInput]);

  const enrollPath = useCallback(async (pathId: string) => {
    if (!candidateId || isEnrolled(pathId)) return;
    const row: PathEnrollment = { candidate_id: candidateId, path_id: pathId, status: 'in_progress', progress_pct: 0, enrolled_at: new Date().toISOString() };
    setEnrollments((prev) => [...prev, row]);
    setProfile((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, active_path: pathId };
      void api.saveProfile(updated);
      return updated;
    });
    await api.upsertEnrollment(row);
  }, [candidateId, isEnrolled]);

  const completeLesson = useCallback(async (pathId: string, moduleId: string, lessonId: string) => {
    if (!candidateId) return;
    if (lessonRows.some((r) => r.lesson_id === lessonId)) return; // already done
    const row: LessonProgressRow = { candidate_id: candidateId, path_id: pathId, module_id: moduleId, lesson_id: lessonId, status: 'completed', completed_at: new Date().toISOString() };
    setLessonRows((prev) => [...prev, row]);
    await api.addLessonProgress(row);
    await awardXp('lesson_complete');
  }, [candidateId, lessonRows, awardXp]);

  const submitQuiz = useCallback(async (pathId: string, moduleId: string, quiz: Quiz, answers: number[]) => {
    const correct = quiz.questions.reduce((n, ques, i) => n + (answers[i] === ques.correctIndex ? 1 : 0), 0);
    const score = Math.round((correct / Math.max(quiz.questions.length, 1)) * 100);
    const passed = score >= quiz.passingScore;
    if (!candidateId) return { score, passed };
    const alreadyPassed = (progressInput.quizScores[quiz.id] ?? -1) >= quiz.passingScore;
    const row: QuizAttemptRow = { candidate_id: candidateId, quiz_id: quiz.id, path_id: pathId, module_id: moduleId, score, passed, answers, created_at: new Date().toISOString() };
    setQuizRows((prev) => [...prev, row]);
    await api.addQuizAttempt(row);
    if (passed && !alreadyPassed) {
      await awardXp('quiz_pass');
      if (score === 100) await awardXp('quiz_perfect');
    }
    return { score, passed };
  }, [candidateId, progressInput, awardXp]);

  const recordSimulation = useCallback(async (pathId: string, moduleId: string, score: number, minScore: number) => {
    if (!candidateId) return;
    const passed = score >= minScore;
    const wasPassed = (progressInput.simScores[moduleId] ?? -1) >= minScore;
    const row: SimulationResultRow = { candidate_id: candidateId, path_id: pathId, module_id: moduleId, score, passed, created_at: new Date().toISOString() };
    setSimRows((prev) => [...prev, row]);
    await api.addSimulationResult(row);
    if (passed && !wasPassed) await awardXp('simulation_pass');
  }, [candidateId, progressInput, awardXp]);

  const issueCertificate = useCallback(async (path: LearningPath): Promise<CertificateRow | null> => {
    if (!candidateId) return null;
    if (!isEligibleForCertificate(path, progressInput)) return null;
    if (certificates.some((c) => c.path_id === path.id)) return certificates.find((c) => c.path_id === path.id) ?? null;
    const row: CertificateRow = { candidate_id: candidateId, path_id: path.id, score: pathScore(path, progressInput), issued_at: new Date().toISOString() };
    setCertificates((prev) => [...prev, row]);
    await api.addCertificate(row);
    await awardXp('path_complete');
    return row;
  }, [candidateId, progressInput, certificates, awardXp]);

  const value: LearningContextValue = {
    ready, profile, level, enrollments, certificates, xpEvents, todayXp, weekXp, progressInput,
    isEnrolled, getPathProgress, enrollPath, completeLesson, submitQuiz, recordSimulation, issueCertificate,
    awardXp,
  };

  return <LearningContext.Provider value={value}>{children}</LearningContext.Provider>;
}

export function useLearning() {
  const ctx = useContext(LearningContext);
  if (!ctx) throw new Error('useLearning must be used within LearningProvider');
  return ctx;
}
