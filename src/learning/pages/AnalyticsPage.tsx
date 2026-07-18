import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BarChart3, Radar as RadarIcon, TrendingUp, Activity, Award, Trophy, Flame, Zap, Target, Gauge, ArrowRight,
} from 'lucide-react';
import { LearningHeader } from '../components/LearningHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ProgressRing } from '../../components/ui/ProgressRing';
import { RankBadge } from '../components/RankBadge';
import { SkillRadar } from '../analysis/components/SkillRadar';
import { TrendChart } from '../analysis/components/TrendChart';
import { SkillBar, DifficultyBadge, RecommendationList } from '../analysis/components/AnalysisComponents';
import { useAnalysis } from '../context/AnalysisContext';
import { useLearning } from '../context/LearningContext';
import { useGamification } from '../context/GamificationContext';
import { METRICS } from '../analysis/types';

const TREND_METRICS = [
  { key: 'Overall', color: '#8B0000' },
  { key: 'Confidence', color: '#7c3aed' },
  { key: 'Grammar', color: '#2563eb' },
  { key: 'Empathy', color: '#f59e0b' },
];

function Tile({ icon: Icon, label, value }: { icon: typeof Zap; label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-ink-50 dark:bg-ink-800/50 p-4 text-center">
      <Icon size={18} className="mx-auto text-lava-600 mb-1" />
      <p className="font-display text-xl font-bold text-ink-800 dark:text-ink-100">{value}</p>
      <p className="text-xs text-ink-500 dark:text-ink-400">{label}</p>
    </div>
  );
}

export function AnalyticsPage() {
  const navigate = useNavigate();
  const { certificates } = useLearning();
  const { rank, streak, unlockedCount, stats } = useGamification();
  const {
    overallScore, aggregateScores, radar, trends, strengths, weaknesses,
    difficulty, recommendations, learningVelocity, completionRate, analyses, hasData,
  } = useAnalysis();

  return (
    <div className="min-h-screen bg-ink-100 dark:bg-ink-950">
      <LearningHeader back={{ label: 'Back to Learning', to: '/learning' }} />
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card-elevated p-6 md:p-8">
          <div className="flex items-center gap-2 text-lava-700 dark:text-lava-400 mb-3">
            <BarChart3 size={18} /><span className="text-sm font-semibold uppercase tracking-wide">Communication Analytics</span>
          </div>
          <div className="flex flex-col lg:flex-row lg:items-center gap-6">
            <div className="flex items-center gap-5">
              <ProgressRing value={overallScore} size={128} strokeWidth={10} label={`${overallScore}`} sublabel="Overall Comms" />
              <div>
                <div className="flex items-center gap-2 mb-2"><RankBadge rank={rank} size="md" /></div>
                <p className="text-sm text-ink-500 dark:text-ink-400 max-w-xs">
                  {hasData ? `Across ${analyses.length} analyzed simulation${analyses.length === 1 ? '' : 's'}.` : 'Run a simulation to unlock your communication intelligence.'}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 flex-1">
              <Tile icon={Zap} label="XP" value={stats.xp.toLocaleString()} />
              <Tile icon={Award} label="Certificates" value={certificates.length} />
              <Tile icon={Trophy} label="Achievements" value={unlockedCount} />
              <Tile icon={Flame} label="Streak" value={streak.current} />
              <Tile icon={Activity} label="Sims / wk" value={learningVelocity} />
              <Tile icon={Target} label="Completion" value={`${completionRate}%`} />
            </div>
          </div>
        </motion.div>

        {/* Difficulty + strengths + weaknesses */}
        <div className="grid md:grid-cols-3 gap-6">
          <DifficultyBadge difficulty={difficulty} />
          <Card className="p-5">
            <h3 className="font-display font-bold text-ink-800 dark:text-ink-100 mb-3 flex items-center gap-2"><TrendingUp size={18} className="text-green-600" /> Top Strengths</h3>
            <div className="space-y-3">{strengths.map((s) => <SkillBar key={s.metric} label={s.metric} score={s.score} />)}</div>
          </Card>
          <Card className="p-5">
            <h3 className="font-display font-bold text-ink-800 dark:text-ink-100 mb-3 flex items-center gap-2"><Gauge size={18} className="text-lava-600" /> Weakest Skills</h3>
            <div className="space-y-3">{weaknesses.map((s) => <SkillBar key={s.metric} label={s.metric} score={s.score} />)}</div>
          </Card>
        </div>

        {/* Radar + Trends */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h2 className="font-display text-lg font-bold text-ink-800 dark:text-ink-100 mb-2 flex items-center gap-2"><RadarIcon size={20} className="text-lava-600" /> Skill Radar</h2>
            <SkillRadar axes={radar} />
          </Card>
          <Card className="p-6">
            <h2 className="font-display text-lg font-bold text-ink-800 dark:text-ink-100 mb-2 flex items-center gap-2"><TrendingUp size={20} className="text-lava-600" /> Performance Trends</h2>
            {trends.length >= 2 ? (
              <TrendChart data={trends} metrics={TREND_METRICS} />
            ) : (
              <div className="h-[300px] flex items-center justify-center text-center">
                <p className="text-sm text-ink-500 dark:text-ink-400">Complete at least two simulations to see trends over time.</p>
              </div>
            )}
          </Card>
        </div>

        {/* Full skill breakdown */}
        <Card className="p-6">
          <h2 className="font-display text-lg font-bold text-ink-800 dark:text-ink-100 mb-4">Skill Breakdown</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-3">
            {METRICS.map((m) => <SkillBar key={m} label={m} score={aggregateScores[m]} />)}
          </div>
        </Card>

        {/* Recommendations + history */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h2 className="font-display text-lg font-bold text-ink-800 dark:text-ink-100 mb-4">Personalized Recommendations</h2>
            <RecommendationList items={recommendations} onNavigate={navigate} />
          </Card>
          <Card className="p-6">
            <h2 className="font-display text-lg font-bold text-ink-800 dark:text-ink-100 mb-4 flex items-center gap-2"><Activity size={20} className="text-lava-600" /> Simulation History</h2>
            {analyses.length === 0 ? (
              <div className="text-center py-8">
                <Activity size={24} className="mx-auto text-ink-300 mb-2" />
                <p className="text-sm text-ink-500 dark:text-ink-400 mb-3">No simulations analyzed yet.</p>
                <Button size="sm" onClick={() => navigate('/learning/paths')}>Start a path <ArrowRight size={15} /></Button>
              </div>
            ) : (
              <div className="space-y-2">
                {analyses.slice(0, 8).map((a) => (
                  <button key={a.id} onClick={() => navigate(`/learning/simulation/${a.id}`)}
                    className="w-full text-left flex items-center gap-3 p-3 rounded-xl bg-ink-50 dark:bg-ink-800/40 hover:shadow-soft transition-all">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-ink-800 dark:text-ink-100 truncate">{a.moduleName}</p>
                      <p className="text-xs text-ink-500 dark:text-ink-400">{new Date(a.timestamp).toLocaleDateString()}</p>
                    </div>
                    <span className="font-display font-bold text-ink-800 dark:text-ink-100">{a.communicationScore}</span>
                    <ArrowRight size={15} className="text-ink-400" />
                  </button>
                ))}
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}
