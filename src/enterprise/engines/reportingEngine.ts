import type { ReportModel, ReportType, ExportFormat, LearnerSummary, Cohort, Assignment } from '../types';
import { computeCohortStats } from './cohortEngine';
import { computeAssignmentProgress } from './assignmentEngine';

const now = () => new Date().toISOString();

// Reporting Engine — turns platform data into tabular report models.
export function buildReport(type: ReportType, roster: LearnerSummary[], cohorts: Cohort[], assignments: Assignment[]): ReportModel {
  switch (type) {
    case 'team_progress':
      return {
        id: `rpt-${type}`, type, title: 'Team Progress', generatedAt: now(),
        columns: ['Learner', 'Department', 'Progress %', 'Avg Score', 'Voice Score'],
        rows: roster.map((l) => [l.name, l.department, l.progressPct, l.avgScore, l.voiceScore]),
        summary: [
          { label: 'Learners', value: roster.length },
          { label: 'Avg progress', value: `${Math.round(roster.reduce((s, l) => s + l.progressPct, 0) / (roster.length || 1))}%` },
        ],
      };
    case 'voice_improvement':
      return {
        id: `rpt-${type}`, type, title: 'Voice Improvement', generatedAt: now(),
        columns: ['Learner', 'Voice Score', 'Confidence', 'Trend'],
        rows: roster.map((l) => [l.name, l.voiceScore, l.confidence, `${l.trend > 0 ? '+' : ''}${l.trend}`]),
        summary: [{ label: 'Avg voice score', value: Math.round(roster.reduce((s, l) => s + l.voiceScore, 0) / (roster.length || 1)) }],
      };
    case 'certification_status':
      return {
        id: `rpt-${type}`, type, title: 'Certification Status', generatedAt: now(),
        columns: ['Learner', 'Certificates', 'Progress %'],
        rows: roster.map((l) => [l.name, l.certificates, l.progressPct]),
        summary: [{ label: 'Total certificates', value: roster.reduce((s, l) => s + l.certificates, 0) }],
      };
    case 'leaderboard':
      return {
        id: `rpt-${type}`, type, title: 'Leaderboard', generatedAt: now(),
        columns: ['Rank', 'Learner', 'XP', 'Level', 'Avg Score'],
        rows: [...roster].sort((a, b) => b.xp - a.xp).map((l, i) => [i + 1, l.name, l.xp, l.level, l.avgScore]),
        summary: [{ label: 'Learners ranked', value: roster.length }],
      };
    case 'attendance':
      return {
        id: `rpt-${type}`, type, title: 'Attendance', generatedAt: now(),
        columns: ['Learner', 'Attendance %', 'Last Active (days)'],
        rows: roster.map((l) => [l.name, l.attendancePct, l.lastActiveDaysAgo]),
        summary: [{ label: 'Avg attendance', value: `${Math.round(roster.reduce((s, l) => s + l.attendancePct, 0) / (roster.length || 1))}%` }],
      };
    case 'simulation_results':
      return {
        id: `rpt-${type}`, type, title: 'Simulation Results', generatedAt: now(),
        columns: ['Learner', 'Simulations', 'Communication', 'Avg Score'],
        rows: roster.map((l) => [l.name, l.simulations, l.communicationScore, l.avgScore]),
        summary: [{ label: 'Total simulations', value: roster.reduce((s, l) => s + l.simulations, 0) }],
      };
    case 'learning_completion': {
      const stats = cohorts.map((c) => computeCohortStats(c, roster));
      return {
        id: `rpt-${type}`, type, title: 'Learning Completion', generatedAt: now(),
        columns: ['Cohort', 'Learners', 'Completion %', 'At Risk'],
        rows: stats.map((s) => [s.cohort.name, s.learners, s.completionRate, s.atRisk]),
        summary: [{ label: 'Cohorts', value: cohorts.length }],
      };
    }
    case 'individual_progress':
    default: {
      const withProg = assignments.map((a) => computeAssignmentProgress(a, roster));
      return {
        id: `rpt-individual_progress`, type: 'individual_progress', title: 'Assignment Progress', generatedAt: now(),
        columns: ['Assignment', 'Type', 'Completion %', 'Completed', 'Total'],
        rows: withProg.map((w) => [w.assignment.title, w.assignment.type, w.completionRate, w.completed, w.total]),
        summary: [{ label: 'Assignments', value: assignments.length }],
      };
    }
  }
}

function toCSV(report: ReportModel): string {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const header = report.columns.map(esc).join(',');
  const body = report.rows.map((r) => r.map(esc).join(',')).join('\n');
  return `${header}\n${body}`;
}

export interface ExportResult {
  filename: string;
  mime: string;
  content: string;
  ready: boolean;
  note?: string;
}

// Export architecture. CSV is implemented today; PDF/Excel are declared here with a
// consistent result contract so the UI can offer them and a future adapter fills them in.
export function exportReport(report: ReportModel, format: ExportFormat): ExportResult {
  const base = report.type;
  if (format === 'csv') {
    return { filename: `${base}.csv`, mime: 'text/csv', content: toCSV(report), ready: true };
  }
  return {
    filename: `${base}.${format === 'excel' ? 'xlsx' : 'pdf'}`,
    mime: format === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'application/pdf',
    content: '', ready: false, note: `${format.toUpperCase()} export is architected and will be enabled by a future export adapter.`,
  };
}
