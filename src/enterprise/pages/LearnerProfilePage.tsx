import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Flame, Award, Trophy, Star, Zap, Mic, Activity, GraduationCap, StickyNote, MessageSquarePlus, CheckCircle2, Circle, Disc3,
} from 'lucide-react';
import { ManagementHeader, PermissionGate, StatCard, InitialsAvatar, RiskBadge, ProgressBar } from '../components/ManagementComponents';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ProgressRing } from '../../components/ui/ProgressRing';
import { SkillRadar } from '../../learning/analysis/components/SkillRadar';
import { RecordingLibrary } from '../../learning/recording/components/RecordingLibrary';
import { useManagement } from '../context/ManagementContext';
import type { RadarAxis } from '../../learning/analysis/types';
import type { TrainerFeedback } from '../types';

export function LearnerProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getLearner, notesByLearner, addNote, feedbackByLearner, addFeedback, trainerId, can, role } = useManagement();
  const learner = id ? getLearner(id) : undefined;

  const [noteText, setNoteText] = useState('');
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState(4);
  const [action, setAction] = useState('');

  const axes = useMemo<RadarAxis[]>(() => learner ? [
    { skill: 'Communication', score: learner.communicationScore },
    { skill: 'Voice', score: learner.voiceScore },
    { skill: 'Confidence', score: learner.confidence },
    { skill: 'Consistency', score: Math.min(100, learner.streak * 3 + 40) },
    { skill: 'Progress', score: learner.progressPct },
    { skill: 'Avg Score', score: learner.avgScore },
  ] : [], [learner]);

  if (!learner) {
    return (
      <PermissionGate permission="view_learners">
        <div className="min-h-screen bg-ink-100 dark:bg-ink-950">
          <ManagementHeader />
          <main className="max-w-3xl mx-auto px-6 py-20 text-center">
            <p className="text-ink-500 dark:text-ink-400">Learner not found.</p>
            <Button className="mt-4" onClick={() => navigate('/trainer/learners')}>Back to learners</Button>
          </main>
        </div>
      </PermissionGate>
    );
  }

  const notes = notesByLearner(learner.id);
  const feedbacks = feedbackByLearner(learner.id);
  const strengths = [...axes].sort((a, b) => b.score - a.score).slice(0, 2);
  const weaknesses = [...axes].sort((a, b) => a.score - b.score).slice(0, 2);

  const submitFeedback = () => {
    if (!comment.trim()) return;
    const f: TrainerFeedback = {
      id: `fb-${Date.now().toString(36)}`, learnerId: learner.id, trainerId,
      comment: comment.trim(), rating,
      recommendations: weaknesses.map((w) => `Focus on ${w.skill.toLowerCase()}`),
      actionItems: action.trim() ? [{ text: action.trim(), done: false }] : [],
      acknowledgedByLearner: false, createdAt: new Date().toISOString(),
    };
    addFeedback(f);
    setComment(''); setAction('');
  };

  return (
    <PermissionGate permission="view_learners">
      <div className="min-h-screen bg-ink-100 dark:bg-ink-950">
        <ManagementHeader />
        <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card-elevated p-6 flex flex-col md:flex-row md:items-center gap-5">
            <InitialsAvatar name={learner.name} size={64} />
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="font-display text-2xl font-bold text-ink-800 dark:text-ink-100">{learner.name}{learner.isCurrentUser ? ' (you)' : ''}</h1>
                <RiskBadge atRisk={learner.atRisk} />
              </div>
              <p className="text-sm text-ink-500 dark:text-ink-400">{learner.email} · {learner.department} · Active {learner.activePathTitle}</p>
            </div>
            <ProgressRing value={learner.avgScore} size={96} label={`${learner.avgScore}`} sublabel="Avg score" />
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            <StatCard icon={Zap} label="XP" value={learner.xp.toLocaleString()} accent="#7c3aed" />
            <StatCard icon={Star} label="Level" value={learner.level} accent="#2563eb" />
            <StatCard icon={Flame} label="Streak" value={`${learner.streak}d`} accent="#db2777" />
            <StatCard icon={Award} label="Certificates" value={learner.certificates} accent="#16a34a" />
            <StatCard icon={Trophy} label="Achievements" value={learner.achievements} accent="#f59e0b" />
            <StatCard icon={Activity} label="Simulations" value={learner.simulations} accent="#0ea5e9" />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Skill radar */}
            <Card className="p-6">
              <h2 className="font-display text-lg font-bold text-ink-800 dark:text-ink-100 mb-2">Skill Radar</h2>
              <SkillRadar axes={axes} />
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-ink-400 mb-1">Strengths</p>
                  {strengths.map((s) => <p key={s.skill} className="text-sm text-green-600">{s.skill} · {s.score}</p>)}
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-ink-400 mb-1">Focus areas</p>
                  {weaknesses.map((w) => <p key={w.skill} className="text-sm text-lava-600">{w.skill} · {w.score}</p>)}
                </div>
              </div>
            </Card>

            {/* Voice + progress */}
            <div className="space-y-6">
              <Card className="p-6">
                <h2 className="font-display text-lg font-bold text-ink-800 dark:text-ink-100 mb-3 flex items-center gap-2"><Mic size={18} className="text-lava-600" /> Voice Analytics</h2>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div><p className="font-display text-xl font-bold text-ink-800 dark:text-ink-100">{learner.voiceScore}</p><p className="text-xs text-ink-500">Voice</p></div>
                  <div><p className="font-display text-xl font-bold text-ink-800 dark:text-ink-100">{learner.confidence}</p><p className="text-xs text-ink-500">Confidence</p></div>
                  <div><p className="font-display text-xl font-bold text-ink-800 dark:text-ink-100">{learner.communicationScore}</p><p className="text-xs text-ink-500">Comms</p></div>
                </div>
                {learner.isCurrentUser && (
                  <Button variant="ghost" size="sm" className="mt-3" onClick={() => navigate('/learning/voice')}>Open voice analytics</Button>
                )}
              </Card>
              <Card className="p-6">
                <h2 className="font-display text-lg font-bold text-ink-800 dark:text-ink-100 mb-3 flex items-center gap-2"><GraduationCap size={18} className="text-lava-600" /> Learning</h2>
                <p className="text-sm text-ink-500 dark:text-ink-400 mb-2">{learner.enrolledPaths} paths · current: {learner.activePathTitle}</p>
                <ProgressBar value={learner.progressPct} />
                <p className="text-xs text-ink-400 mt-1">{learner.progressPct}% complete · {learner.attendancePct}% attendance</p>
              </Card>
            </div>
          </div>

          {/* Trainer feedback (Feature 7) */}
          {can('give_feedback') && (
            <Card className="p-6">
              <h2 className="font-display text-lg font-bold text-ink-800 dark:text-ink-100 mb-4 flex items-center gap-2"><MessageSquarePlus size={18} className="text-lava-600" /> Trainer Feedback</h2>
              <div className="grid md:grid-cols-2 gap-3">
                <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Coaching comment…" rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 text-sm text-ink-700 dark:text-ink-200" />
                <div className="space-y-2">
                  <input value={action} onChange={(e) => setAction(e.target.value)} placeholder="Action item (optional)…"
                    className="w-full px-3 py-2 rounded-lg border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 text-sm text-ink-700 dark:text-ink-200" />
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-ink-500">Rating:</span>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button key={n} onClick={() => setRating(n)} aria-label={`${n} stars`}>
                        <Star size={18} className={n <= rating ? 'text-amber-500 fill-amber-500' : 'text-ink-300'} />
                      </button>
                    ))}
                    <Button size="sm" className="ml-auto" onClick={submitFeedback}>Send</Button>
                  </div>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                {feedbacks.map((f) => (
                  <div key={f.id} className="card p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">{[1, 2, 3, 4, 5].map((n) => <Star key={n} size={13} className={n <= f.rating ? 'text-amber-500 fill-amber-500' : 'text-ink-300'} />)}</div>
                      <span className={`badge ${f.acknowledgedByLearner ? 'bg-green-50 dark:bg-green-900/20 text-green-600' : 'bg-ink-100 dark:bg-ink-800 text-ink-500'}`}>
                        {f.acknowledgedByLearner ? <><CheckCircle2 size={12} /> Acknowledged</> : <><Circle size={12} /> Awaiting learner</>}
                      </span>
                    </div>
                    <p className="text-sm text-ink-700 dark:text-ink-200 mt-2">{f.comment}</p>
                    {f.actionItems.map((ai, i) => <p key={i} className="text-xs text-ink-500 mt-1">☐ {ai.text}</p>)}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Recording library (voice recordings for this learner) */}
          <Card className="p-6">
            <h2 className="font-display text-lg font-bold text-ink-800 dark:text-ink-100 mb-4 flex items-center gap-2"><Disc3 size={18} className="text-lava-600" /> Recording Library</h2>
            <RecordingLibrary learnerId={learner.id} viewerRole={role} viewerLearnerId="me" canDelete={can('manage_learners')} />
          </Card>

          {/* Trainer notes */}
          <Card className="p-6">
            <h2 className="font-display text-lg font-bold text-ink-800 dark:text-ink-100 mb-4 flex items-center gap-2"><StickyNote size={18} className="text-lava-600" /> Trainer Notes</h2>
            <div className="flex gap-2">
              <input value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Add a private note…"
                className="flex-1 px-3 py-2 rounded-lg border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 text-sm text-ink-700 dark:text-ink-200" />
              <Button size="sm" onClick={() => { if (noteText.trim()) { addNote(learner.id, noteText.trim()); setNoteText(''); } }}>Add</Button>
            </div>
            <div className="mt-3 space-y-2">
              {notes.length === 0 && <p className="text-sm text-ink-400">No notes yet.</p>}
              {notes.map((n) => (
                <div key={n.id} className="text-sm text-ink-700 dark:text-ink-200 bg-ink-50 dark:bg-ink-800/50 rounded-lg p-3">
                  {n.text}<span className="block text-xs text-ink-400 mt-1">{new Date(n.createdAt).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </Card>
        </main>
      </div>
    </PermissionGate>
  );
}
