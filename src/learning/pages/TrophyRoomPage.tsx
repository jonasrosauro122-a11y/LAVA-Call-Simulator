import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Award, Star, Medal, BookOpen, HelpCircle, Mic2, Layers } from 'lucide-react';
import { LearningHeader } from '../components/LearningHeader';
import { AchievementBadge } from '../components/AchievementBadge';
import { RankBadge } from '../components/RankBadge';
import { CertificateCard } from '../components/CertificateCard';
import { Card } from '../../components/ui/Card';
import { useGamification } from '../context/GamificationContext';
import { useLearning } from '../context/LearningContext';
import { useAssessment } from '../../context/AssessmentContext';
import { getPath } from '../content/paths';

function StatTile({ icon: Icon, label, value }: { icon: typeof Star; label: string; value: number | string }) {
  return (
    <div className="rounded-xl bg-ink-50 dark:bg-ink-800/50 p-4 text-center">
      <Icon size={18} className="mx-auto text-lava-600 mb-1" />
      <p className="font-display text-xl font-bold text-ink-800 dark:text-ink-100">{value}</p>
      <p className="text-xs text-ink-500 dark:text-ink-400">{label}</p>
    </div>
  );
}

export function TrophyRoomPage() {
  const navigate = useNavigate();
  const { candidate } = useAssessment();
  const { certificates } = useLearning();
  const { achievements, unlockedCount, rank, stats, myLeaderboardRank } = useGamification();

  const special = achievements.filter((a) => a.def.category === 'mastery' && a.unlocked);

  return (
    <div className="min-h-screen bg-ink-100 dark:bg-ink-950">
      <LearningHeader back={{ label: 'Back to Learning', to: '/learning' }} />
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card-elevated p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-lava-700 dark:text-lava-400 mb-1">
              <Trophy size={18} /><span className="text-sm font-semibold uppercase tracking-wide">Trophy Room</span>
            </div>
            <h1 className="section-title text-3xl">{unlockedCount} of {achievements.length} unlocked</h1>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <RankBadge rank={rank} size="lg" showName={false} />
              <p className="text-xs text-ink-500 dark:text-ink-400 mt-1">{rank.name}</p>
            </div>
            <div className="text-center">
              <p className="font-display text-2xl font-bold text-ink-800 dark:text-ink-100">#{myLeaderboardRank('all')}</p>
              <button onClick={() => navigate('/learning/leaderboard')} className="text-xs text-lava-700 dark:text-lava-400 hover:underline">All-time rank</button>
            </div>
          </div>
        </motion.div>

        {/* Career milestones */}
        <section>
          <h2 className="section-title mb-4 flex items-center gap-2"><Medal size={20} className="text-lava-600" /> Career Milestones</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <StatTile icon={BookOpen} label="Lessons" value={stats.lessons} />
            <StatTile icon={HelpCircle} label="Quizzes" value={stats.quizzesPassed} />
            <StatTile icon={Mic2} label="Simulations" value={stats.sims} />
            <StatTile icon={Layers} label="Modules" value={stats.modules} />
            <StatTile icon={Award} label="Certificates" value={stats.paths} />
          </div>
        </section>

        {/* Special awards */}
        {special.length > 0 && (
          <section>
            <h2 className="section-title mb-4 flex items-center gap-2"><Star size={20} className="text-lava-600" /> Special Awards</h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
              {special.map((a, i) => <AchievementBadge key={a.def.id} view={a} index={i} />)}
            </div>
          </section>
        )}

        {/* Achievements */}
        <section>
          <h2 className="section-title mb-4 flex items-center gap-2"><Trophy size={20} className="text-lava-600" /> Achievements</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {achievements.map((a, i) => <AchievementBadge key={a.def.id} view={a} index={i} />)}
          </div>
        </section>

        {/* Certificates */}
        <section>
          <h2 className="section-title mb-4 flex items-center gap-2"><Award size={20} className="text-lava-600" /> Certificates</h2>
          {certificates.length === 0 ? (
            <Card className="p-6 text-center">
              <Award size={24} className="mx-auto text-ink-300 mb-2" />
              <p className="text-sm text-ink-500 dark:text-ink-400">Complete a learning path to earn your first certificate.</p>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {certificates.map((c) => {
                const p = getPath(c.path_id);
                return (
                  <CertificateCard key={c.path_id} pathTitle={p?.title ?? c.path_id}
                    candidateName={candidate ? `${candidate.first_name} ${candidate.last_name}` : undefined}
                    score={c.score} issuedAt={c.issued_at} earned />
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
