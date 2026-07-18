import { motion } from 'framer-motion';
import {
  Clock, ThumbsUp, Target, BookOpen, Sparkles, Mic2, Lightbulb, ArrowRight, GraduationCap,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import type { TimelineSegment, AICoachReport, Recommendation, DifficultyState } from '../types';
import { DIFFICULTY_LEVELS } from '../difficultyEngine';

function scoreColor(score: number): string {
  return score >= 80 ? '#16a34a' : score >= 60 ? '#f59e0b' : '#b71c1c';
}

// ---- Skill bar ----
export function SkillBar({ label, score }: { label: string; score: number }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-ink-600 dark:text-ink-300">{label}</span>
        <span className="text-sm font-semibold text-ink-800 dark:text-ink-100">{score}</span>
      </div>
      <div className="h-2 rounded-full bg-ink-100 dark:bg-ink-800 overflow-hidden">
        <motion.div className="h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${score}%` }}
          transition={{ duration: 0.7, ease: 'easeOut' }} style={{ background: scoreColor(score) }} />
      </div>
    </div>
  );
}

// ---- Timeline ----
export function TimelineView({ segments }: { segments: TimelineSegment[] }) {
  return (
    <div className="relative pl-6">
      <div className="absolute left-2 top-1 bottom-1 w-px bg-ink-200 dark:bg-ink-700" />
      <div className="space-y-5">
        {segments.map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }} className="relative">
            <span className="absolute -left-[18px] top-1 w-3 h-3 rounded-full gradient-lava ring-4 ring-white dark:ring-ink-900" />
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-ink-400 flex items-center gap-1"><Clock size={11} /> {s.time}</span>
              <span className="font-semibold text-sm text-ink-800 dark:text-ink-100">{s.phase}</span>
              <span className="badge ml-auto" style={{ color: scoreColor(s.score) }}>{s.score}</span>
            </div>
            <p className="text-xs text-ink-500 dark:text-ink-400 mt-0.5">{s.note}</p>
            <p className="text-sm text-ink-600 dark:text-ink-300 mt-1">{s.feedback}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ---- AI coach report ----
function CoachSection({ icon: Icon, title, items }: { icon: typeof Target; title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div>
      <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-lava-700 dark:text-lava-400 mb-1.5">
        <Icon size={13} /> {title}
      </h4>
      <ul className="space-y-1">
        {items.map((it, i) => (
          <li key={i} className="text-sm text-ink-600 dark:text-ink-300 flex items-start gap-2">
            <span className="text-lava-500 mt-1">•</span> {it}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function CoachReport({ report, onNavigate }: { report: AICoachReport; onNavigate: (to: string) => void }) {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <CoachSection icon={ThumbsUp} title="Strengths" items={report.strengths} />
      <CoachSection icon={Target} title="Areas to Improve" items={report.improvements} />
      <CoachSection icon={BookOpen} title="Grammar Suggestions" items={report.grammarSuggestions} />
      <CoachSection icon={Sparkles} title="Vocabulary Suggestions" items={report.vocabularySuggestions} />
      <CoachSection icon={Lightbulb} title="Confidence Tips" items={report.confidenceTips} />
      <CoachSection icon={Mic2} title="Recommended Practice" items={report.recommendedPractice} />
      {report.nextLesson && (
        <Card className="p-4 md:col-span-1">
          <p className="text-xs text-ink-500 dark:text-ink-400 mb-1">Next lesson</p>
          <p className="font-semibold text-ink-800 dark:text-ink-100 text-sm mb-2">{report.nextLesson.title}</p>
          <Button size="sm" onClick={() => onNavigate(`/learning/module/${report.nextLesson!.moduleId}`)}>
            <GraduationCap size={15} /> Start lesson
          </Button>
        </Card>
      )}
      {report.recommendedSimulation && (
        <Card className="p-4 md:col-span-1">
          <p className="text-xs text-ink-500 dark:text-ink-400 mb-1">Recommended simulation</p>
          <p className="font-semibold text-ink-800 dark:text-ink-100 text-sm">{report.recommendedSimulation.name}</p>
          <p className="text-xs text-ink-500 dark:text-ink-400 mb-2">{report.recommendedSimulation.reason}</p>
          <Button size="sm" variant="secondary" onClick={() => onNavigate(`/module/${report.recommendedSimulation!.moduleNumber}`)}>
            <Mic2 size={15} /> Practice now
          </Button>
        </Card>
      )}
    </div>
  );
}

// ---- Recommendations ----
const KIND_LABEL: Record<Recommendation['kind'], string> = { lesson: 'Lesson', module: 'Module', simulation: 'Simulation', path: 'Path' };

export function RecommendationList({ items, onNavigate }: { items: Recommendation[]; onNavigate: (to: string) => void }) {
  if (!items.length) {
    return <p className="text-sm text-ink-500 dark:text-ink-400">Complete a simulation to get personalized recommendations.</p>;
  }
  return (
    <div className="space-y-3">
      {items.map((r, i) => (
        <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
          className="card p-4 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="badge bg-lava-50 dark:bg-lava-950/40 text-lava-700 dark:text-lava-400">{KIND_LABEL[r.kind]}</span>
              <p className="font-semibold text-sm text-ink-800 dark:text-ink-100 truncate">{r.title}</p>
            </div>
            <p className="text-xs text-ink-500 dark:text-ink-400 mt-0.5">
              {r.reason}{r.weakSkill ? ` · improves ${r.weakSkill}` : ''}
            </p>
          </div>
          <Button size="sm" variant="secondary" onClick={() => onNavigate(r.to)}>Open <ArrowRight size={14} /></Button>
        </motion.div>
      ))}
    </div>
  );
}

// ---- Difficulty badge ----
export function DifficultyBadge({ difficulty }: { difficulty: DifficultyState }) {
  return (
    <Card className="p-5">
      <p className="text-xs text-ink-500 dark:text-ink-400 mb-1">Adaptive Difficulty</p>
      <p className="font-display text-2xl font-bold text-gradient-lava">{difficulty.level}</p>
      <div className="flex gap-1.5 mt-3">
        {DIFFICULTY_LEVELS.map((_, i) => (
          <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= difficulty.index ? 'gradient-lava' : 'bg-ink-100 dark:bg-ink-800'}`} />
        ))}
      </div>
      <p className="text-xs text-ink-500 dark:text-ink-400 mt-3">{difficulty.rationale}</p>
      {difficulty.nextLevel && (
        <p className="text-xs text-lava-700 dark:text-lava-400 mt-1">Next: {difficulty.nextLevel}</p>
      )}
    </Card>
  );
}
