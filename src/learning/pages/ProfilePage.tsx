import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Flame, Award, Trophy, Target, Zap, ArrowRight } from 'lucide-react';
import { LearningHeader } from '../components/LearningHeader';
import { Avatar } from '../components/Avatar';
import { RankBadge } from '../components/RankBadge';
import { XpBar } from '../components/XpBar';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { pathIcon } from '../components/icons';
import { useLearning } from '../context/LearningContext';
import { useGamification } from '../context/GamificationContext';
import { useAssessment } from '../../context/AssessmentContext';
import { getPath } from '../content/paths';

export function ProfilePage() {
  const navigate = useNavigate();
  const { candidate } = useAssessment();
  const { level, certificates, enrollments, getPathProgress } = useLearning();
  const { rank, streak, unlockedCount, stats } = useGamification();

  const name = candidate ? `${candidate.first_name} ${candidate.last_name}` : 'Learner';

  const enrolledPaths = enrollments
    .map((e) => { const p = getPath(e.path_id); return p ? { path: p, progress: getPathProgress(p) } : null; })
    .filter((x): x is NonNullable<typeof x> => x != null);

  const favorite = [...enrolledPaths].sort((a, b) => b.progress.progressPct - a.progress.progressPct)[0];
  const overallCompletion = enrolledPaths.length
    ? Math.round(enrolledPaths.reduce((s, p) => s + p.progress.progressPct, 0) / enrolledPaths.length)
    : 0;

  return (
    <div className="min-h-screen bg-ink-100 dark:bg-ink-950">
      <LearningHeader back={{ label: 'Back to Learning', to: '/learning' }} />
      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Identity */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card-elevated p-6 md:p-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            <Avatar name={name} size={84} highlight />
            <div className="flex-1 text-center sm:text-left w-full">
              <h1 className="font-display text-2xl font-bold text-ink-800 dark:text-ink-100">{name}</h1>
              <div className="flex items-center justify-center sm:justify-start gap-2 mt-1">
                <RankBadge rank={rank} size="sm" />
                <span className="text-ink-300">·</span>
                <span className="text-sm text-ink-500 dark:text-ink-400">Level {level.level}</span>
              </div>
              <div className="mt-4 max-w-md mx-auto sm:mx-0"><XpBar level={level} /></div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            <div className="rounded-xl bg-ink-50 dark:bg-ink-800/50 p-4 text-center">
              <Zap size={18} className="mx-auto text-lava-600 mb-1" />
              <p className="font-display text-xl font-bold text-ink-800 dark:text-ink-100">{stats.xp.toLocaleString()}</p>
              <p className="text-xs text-ink-500 dark:text-ink-400">Total XP</p>
            </div>
            <div className="rounded-xl bg-ink-50 dark:bg-ink-800/50 p-4 text-center">
              <Flame size={18} className="mx-auto text-lava-600 mb-1" />
              <p className="font-display text-xl font-bold text-ink-800 dark:text-ink-100">{streak.current}</p>
              <p className="text-xs text-ink-500 dark:text-ink-400">Day streak</p>
            </div>
            <div className="rounded-xl bg-ink-50 dark:bg-ink-800/50 p-4 text-center">
              <Trophy size={18} className="mx-auto text-lava-600 mb-1" />
              <p className="font-display text-xl font-bold text-ink-800 dark:text-ink-100">{unlockedCount}</p>
              <p className="text-xs text-ink-500 dark:text-ink-400">Achievements</p>
            </div>
            <div className="rounded-xl bg-ink-50 dark:bg-ink-800/50 p-4 text-center">
              <Award size={18} className="mx-auto text-lava-600 mb-1" />
              <p className="font-display text-xl font-bold text-ink-800 dark:text-ink-100">{certificates.length}</p>
              <p className="text-xs text-ink-500 dark:text-ink-400">Certificates</p>
            </div>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card className="p-5">
            <p className="text-xs text-ink-500 dark:text-ink-400 mb-1">Favorite Role</p>
            <p className="font-display font-bold text-ink-800 dark:text-ink-100">{favorite?.path.title ?? 'Not set yet'}</p>
          </Card>
          <Card className="p-5">
            <p className="text-xs text-ink-500 dark:text-ink-400 mb-1">Career Goal</p>
            <p className="font-display font-bold text-ink-800 dark:text-ink-100">{favorite?.path.title ?? 'Choose a path'}</p>
          </Card>
          <Card className="p-5">
            <p className="text-xs text-ink-500 dark:text-ink-400 mb-1">Overall Completion</p>
            <p className="font-display font-bold text-ink-800 dark:text-ink-100 flex items-center gap-2"><Target size={16} className="text-lava-600" /> {overallCompletion}%</p>
          </Card>
        </div>

        {/* Learning paths */}
        <section>
          <h2 className="section-title mb-4">Your Learning Paths</h2>
          {enrolledPaths.length === 0 ? (
            <Card className="p-6 flex items-center justify-between gap-4">
              <p className="text-sm text-ink-500 dark:text-ink-400">You haven't started a path yet.</p>
              <Button onClick={() => navigate('/learning/paths')}>Browse Paths <ArrowRight size={16} /></Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {enrolledPaths.map(({ path, progress }) => {
                const Icon = pathIcon(path.icon);
                return (
                  <Card key={path.id} className="p-4 flex items-center gap-4 cursor-pointer hover:shadow-elevated"
                    onClick={() => navigate(`/learning/path/${path.id}`)}>
                    <div className="w-11 h-11 rounded-xl gradient-lava flex items-center justify-center text-white shrink-0"><Icon size={20} /></div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-ink-800 dark:text-ink-100 text-sm">{path.title}</p>
                      <div className="h-1.5 rounded-full bg-ink-100 dark:bg-ink-800 overflow-hidden mt-1.5">
                        <div className="h-full rounded-full gradient-lava" style={{ width: `${progress.progressPct}%` }} />
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-ink-700 dark:text-ink-200 shrink-0">{progress.progressPct}%</span>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
