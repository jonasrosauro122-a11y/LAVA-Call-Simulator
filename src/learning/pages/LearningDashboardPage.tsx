import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight, Sparkles, Compass, Award, MessageSquareText, Activity, Target, PlayCircle,
  Zap, CalendarClock,
} from 'lucide-react';
import { LearningHeader } from '../components/LearningHeader';
import { XpBar } from '../components/XpBar';
import { GoalRing } from '../components/GoalRing';
import { CertificateCard } from '../components/CertificateCard';
import { RankBadge } from '../components/RankBadge';
import { StreakCard } from '../components/StreakCard';
import { ChallengeList } from '../components/ChallengeList';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ScoreBadge } from '../../components/ui/ScoreBadge';
import { pathIcon } from '../components/icons';
import { useLearning } from '../context/LearningContext';
import { useGamification } from '../context/GamificationContext';
import { useAssessment } from '../../context/AssessmentContext';
import { getPath } from '../content/paths';
import { levelTitle } from '../lib/xpEngine';

export function LearningDashboardPage() {
  const navigate = useNavigate();
  const { candidate, moduleScores } = useAssessment();
  const { profile, level, todayXp, weekXp, certificates, enrollments, getPathProgress } = useLearning();
  const { rank, streak, dailyChallenges, weeklyGoals } = useGamification();

  const activePathId = profile?.active_path ?? enrollments[0]?.path_id ?? null;
  const currentPath = activePathId ? getPath(activePathId) : null;
  const currentProgress = currentPath ? getPathProgress(currentPath) : null;
  const currentModuleIndex = currentProgress ? currentProgress.modules.findIndex((m) => !m.complete) : -1;
  const currentModule = currentPath ? currentPath.modules[currentModuleIndex >= 0 ? currentModuleIndex : 0] : null;
  const CurrentIcon = currentPath ? pathIcon(currentPath.icon) : Compass;

  const recentSims = [...moduleScores]
    .sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))
    .slice(0, 4);
  const feedback = Array.from(
    new Set(moduleScores.flatMap((m) => m.details?.improvements ?? [])),
  ).slice(0, 4);

  const resume = () => {
    if (currentPath && currentModule) navigate(`/learning/module/${currentModule.id}`);
    else navigate('/learning/paths');
  };

  return (
    <div className="min-h-screen bg-ink-100 dark:bg-ink-950">
      <LearningHeader />
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card-elevated p-6 md:p-8 relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-lava-700/5 rounded-full blur-3xl" />
          <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex-1">
              <p className="text-sm text-ink-500 dark:text-ink-400 mb-1">Welcome back,</p>
              <h1 className="font-display text-3xl font-bold text-ink-800 dark:text-ink-100">
                {candidate ? candidate.first_name : 'Learner'}
              </h1>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="badge bg-lava-50 dark:bg-lava-950/40 text-lava-700 dark:text-lava-400">
                  <Sparkles size={12} /> {levelTitle(level.level)}
                </span>
                <RankBadge rank={rank} size="sm" />
              </div>
              <div className="mt-5 max-w-md"><XpBar level={level} /></div>
              <Button className="mt-5" onClick={resume}>
                {currentPath ? 'Continue Learning' : 'Start Learning'} <ArrowRight size={18} />
              </Button>
            </div>
            <div className="flex items-center gap-6 justify-center">
              <GoalRing earned={todayXp} goal={profile?.daily_goal_xp ?? 60} label="Daily Goal" />
              <GoalRing earned={weekXp} goal={profile?.weekly_goal_xp ?? 300} label="Weekly Goal" />
            </div>
          </div>
        </motion.div>

        {/* Current path / resume */}
        {currentPath && currentProgress && currentModule ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="card-elevated p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-l-4 border-lava-700">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl gradient-lava flex items-center justify-center text-white shrink-0">
                <CurrentIcon size={22} />
              </div>
              <div>
                <p className="text-xs text-lava-700 dark:text-lava-400 font-semibold uppercase tracking-wide">Current Path · {currentProgress.progressPct}% complete</p>
                <h3 className="font-display text-lg font-bold text-ink-800 dark:text-ink-100">{currentPath.title}</h3>
                <p className="text-sm text-ink-500 dark:text-ink-400">Up next: {currentModule.title}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => navigate(`/learning/path/${currentPath.id}`)}>View Path</Button>
              <Button onClick={resume}><PlayCircle size={18} /> Resume</Button>
            </div>
          </motion.div>
        ) : (
          <Card className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl gradient-lava flex items-center justify-center text-white shrink-0"><Compass size={22} /></div>
              <div>
                <h3 className="font-display text-lg font-bold text-ink-800 dark:text-ink-100">Pick a learning path to begin</h3>
                <p className="text-sm text-ink-500 dark:text-ink-400">Nine role-specific courses, from fundamentals to certification.</p>
              </div>
            </div>
            <Button onClick={() => navigate('/learning/paths')}>Browse Paths <ArrowRight size={18} /></Button>
          </Card>
        )}

        {/* Streak · Daily Challenges · Weekly Goals */}
        <div className="grid md:grid-cols-3 gap-6">
          <StreakCard current={streak.current} longest={streak.longest} />
          <ChallengeList title="Daily Challenges" icon={Zap} items={dailyChallenges} emptyLabel="New challenges arrive daily." />
          <ChallengeList title="Weekly Goals" icon={CalendarClock} items={weeklyGoals} emptyLabel="Weekly goals refresh every week." />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent simulations */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-5">
              <h3 className="font-display font-bold text-ink-800 dark:text-ink-100 mb-4 flex items-center gap-2">
                <Activity size={18} className="text-lava-600" /> Recent Simulations
              </h3>
              {recentSims.length === 0 ? (
                <div className="text-center py-6">
                  <Activity size={24} className="mx-auto text-ink-300 mb-2" />
                  <p className="text-sm text-ink-500 dark:text-ink-400">No simulations yet. Launch one from any module to see your results here.</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3">
                  {recentSims.map((s) => (
                    <button key={s.id} onClick={() => navigate(`/learning/simulation/${s.id}`)} className="text-left rounded-xl transition-all hover:shadow-soft focus:outline-none focus:ring-2 focus:ring-lava-500/40">
                      <ScoreBadge score={Math.round(s.score)} label={s.module_name} />
                    </button>
                  ))}
                </div>
              )}
            </Card>

            <Card className="p-5">
              <h3 className="font-display font-bold text-ink-800 dark:text-ink-100 mb-4 flex items-center gap-2">
                <MessageSquareText size={18} className="text-lava-600" /> AI Feedback Summary
              </h3>
              {feedback.length === 0 ? (
                <p className="text-sm text-ink-500 dark:text-ink-400">Complete a simulation to receive personalized AI coaching tips.</p>
              ) : (
                <ul className="space-y-2">
                  {feedback.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-ink-600 dark:text-ink-300">
                      <Target size={15} className="text-lava-500 mt-0.5 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          {/* Certificates */}
          <div className="space-y-6">
            <Card className="p-5">
              <h3 className="font-display font-bold text-ink-800 dark:text-ink-100 mb-4 flex items-center gap-2">
                <Award size={18} className="text-lava-600" /> Certificates
              </h3>
              {certificates.length === 0 ? (
                <div className="text-center py-6">
                  <Award size={24} className="mx-auto text-ink-300 mb-2" />
                  <p className="text-sm text-ink-500 dark:text-ink-400">Complete a path to earn your first certificate.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {certificates.map((c) => {
                    const p = getPath(c.path_id);
                    return (
                      <CertificateCard
                        key={c.path_id}
                        pathTitle={p?.title ?? c.path_id}
                        candidateName={candidate ? `${candidate.first_name} ${candidate.last_name}` : undefined}
                        score={c.score}
                        issuedAt={c.issued_at}
                        earned
                      />
                    );
                  })}
                </div>
              )}
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
