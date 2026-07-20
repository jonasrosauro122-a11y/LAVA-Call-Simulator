import {
  createContext, useContext, useState, useMemo, useCallback, useEffect, type ReactNode,
} from 'react';
import { useAssessment } from '../../context/AssessmentContext';
import { useLearning } from '../../learning/context/LearningContext';
import { useGamification } from '../../learning/context/GamificationContext';
import { useAnalysis } from '../../learning/context/AnalysisContext';
import { useVoice } from '../../learning/context/VoiceContext';
import { getPath } from '../../learning/content/paths';
import type {
  Role, Permission, LearnerSummary, Cohort, Assignment, AppNotification, TrainerFeedback, TrainerNote,
} from '../types';
import { can as canFn } from '../roles/permissionEngine';
import { buildDemoRoster, assignCohortMembers, buildCurrentUserLearner } from '../data/roster';
import { buildDemoAssignments } from '../engines/assignmentEngine';
import { buildDemoNotifications, createNotification } from '../engines/notificationEngine';
import * as api from '../data/enterpriseApi';

interface CompanyOverview {
  totalLearners: number;
  activeLearners: number;
  trainingCompletion: number;
  avgCommunication: number;
  avgVoice: number;
  certificatesIssued: number;
  departments: number;
  atRisk: number;
}

interface ManagementContextValue {
  role: Role;
  setRole: (r: Role) => void;
  can: (p: Permission) => boolean;
  roster: LearnerSummary[];
  getLearner: (id: string) => LearnerSummary | undefined;
  cohorts: Cohort[];
  assignments: Assignment[];
  addAssignment: (a: Assignment) => void;
  notifications: AppNotification[];
  markRead: (id: string) => void;
  markAllRead: () => void;
  acknowledge: (id: string) => void;
  feedbackByLearner: (id: string) => TrainerFeedback[];
  addFeedback: (f: TrainerFeedback) => void;
  notesByLearner: (id: string) => TrainerNote[];
  addNote: (learnerId: string, text: string) => void;
  company: CompanyOverview;
  trainerId: string;
}

const Ctx = createContext<ManagementContextValue | null>(null);
const ROLE_KEY = 'lava_role';

export function ManagementProvider({ children }: { children: ReactNode }) {
  const { candidate, moduleScores } = useAssessment();
  const learning = useLearning();
  const gam = useGamification();
  const analysis = useAnalysis();
  const voice = useVoice();

  const trainerId = 'me';
  const [role, setRoleState] = useState<Role>(() => {
    try { return (localStorage.getItem(ROLE_KEY) as Role) || 'trainer'; } catch { return 'trainer'; }
  });
  const setRole = useCallback((r: Role) => {
    setRoleState(r);
    try { localStorage.setItem(ROLE_KEY, r); } catch { /* ignore */ }
  }, []);

  // Build the current user's LearnerSummary from real data, then blend with demo peers.
  const roster = useMemo<LearnerSummary[]>(() => {
    const demo = buildDemoRoster();
    const avgScore = moduleScores.length ? Math.round(moduleScores.reduce((s, m) => s + m.score, 0) / moduleScores.length) : 0;
    const firstEnrollment = learning.enrollments[0];
    const activePathTitle = firstEnrollment ? (getPath(firstEnrollment.path_id)?.title ?? 'General English') : 'General English';
    const me = buildCurrentUserLearner({
      id: candidate?.id ?? 'me',
      name: [candidate?.first_name, candidate?.last_name].filter(Boolean).join(' ') || 'You',
      avgScore,
      communicationScore: analysis.overallScore,
      voiceScore: voice.overallVoiceScore,
      confidence: Math.round(analysis.aggregateScores?.['Speaking Confidence'] ?? analysis.overallScore),
      progressPct: Math.round(analysis.completionRate),
      simulations: analysis.analyses.length,
      enrolledPaths: learning.enrollments.length,
      activePathTitle,
      xp: learning.level.totalXp,
      level: learning.level.level,
      streak: gam.streak.current,
      certificates: learning.certificates.length,
      achievements: gam.unlockedCount,
    });
    return [me, ...demo];
  }, [candidate, moduleScores, learning.enrollments, learning.level, learning.certificates, gam.streak, gam.unlockedCount, analysis, voice]);

  const cohorts = useMemo(() => assignCohortMembers(roster), [roster]);
  const [extraAssignments, setExtra] = useState<Assignment[]>([]);
  const assignments = useMemo(() => [...extraAssignments, ...buildDemoAssignments(roster, cohorts)], [extraAssignments, roster, cohorts]);

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  useEffect(() => {
    setNotifications((prev) => (prev.length ? prev : buildDemoNotifications(roster, buildDemoAssignments(roster, cohorts))));
  }, [roster, cohorts]);

  const [feedback, setFeedback] = useState<TrainerFeedback[]>([]);
  const [notes, setNotes] = useState<TrainerNote[]>([]);
  useEffect(() => {
    let active = true;
    (async () => { const n = await api.fetchTrainerNotes(trainerId); if (active && n.length) setNotes(n); })();
    return () => { active = false; };
  }, []);

  const getLearner = useCallback((id: string) => roster.find((l) => l.id === id), [roster]);
  const addAssignment = useCallback((a: Assignment) => {
    setExtra((prev) => [a, ...prev]);
    setNotifications((prev) => [createNotification('assignment', 'New assignment created', `"${a.title}" was assigned.`), ...prev]);
  }, []);
  const markRead = useCallback((id: string) => setNotifications((p) => p.map((n) => (n.id === id ? { ...n, read: true } : n))), []);
  const markAllRead = useCallback(() => setNotifications((p) => p.map((n) => ({ ...n, read: true }))), []);
  const acknowledge = useCallback((id: string) => setNotifications((p) => p.map((n) => (n.id === id ? { ...n, acknowledged: true, read: true } : n))), []);
  const feedbackByLearner = useCallback((id: string) => feedback.filter((f) => f.learnerId === id), [feedback]);
  const addFeedback = useCallback((f: TrainerFeedback) => {
    setFeedback((prev) => [f, ...prev]);
    setNotifications((prev) => [createNotification('feedback', 'New trainer feedback', f.comment.slice(0, 60), f.learnerId), ...prev]);
  }, []);
  const notesByLearner = useCallback((id: string) => notes.filter((n) => n.learnerId === id), [notes]);
  const addNote = useCallback((learnerId: string, text: string) => {
    const note: TrainerNote = { id: `note-${Date.now().toString(36)}`, learnerId, trainerId, text, createdAt: new Date().toISOString() };
    setNotes((prev) => [note, ...prev]);
    void api.saveTrainerNote(note);
  }, []);

  const company = useMemo<CompanyOverview>(() => {
    const active = roster.filter((l) => l.lastActiveDaysAgo <= 7);
    const round = (n: number) => Math.round(n);
    return {
      totalLearners: roster.length,
      activeLearners: active.length,
      trainingCompletion: round(roster.reduce((s, l) => s + l.progressPct, 0) / (roster.length || 1)),
      avgCommunication: round(roster.reduce((s, l) => s + l.communicationScore, 0) / (roster.length || 1)),
      avgVoice: round(roster.reduce((s, l) => s + l.voiceScore, 0) / (roster.length || 1)),
      certificatesIssued: roster.reduce((s, l) => s + l.certificates, 0),
      departments: new Set(roster.map((l) => l.department)).size,
      atRisk: roster.filter((l) => l.atRisk).length,
    };
  }, [roster]);

  const value: ManagementContextValue = {
    role, setRole, can: (p) => canFn(role, p),
    roster, getLearner, cohorts, assignments, addAssignment,
    notifications, markRead, markAllRead, acknowledge,
    feedbackByLearner, addFeedback, notesByLearner, addNote,
    company, trainerId,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useManagement() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useManagement must be used within ManagementProvider');
  return ctx;
}
