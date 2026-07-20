import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mic, TrendingUp, Gauge, MessageSquare, Activity, ArrowRight, Star, Target } from 'lucide-react';
import { LearningHeader } from '../components/LearningHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ProgressRing } from '../../components/ui/ProgressRing';
import { TrendChart } from '../analysis/components/TrendChart';
import { StatTile } from '../voiceEngine/components/VoiceComponents';
import { useVoice } from '../context/VoiceContext';

const SKILL_TRENDS = [
  { key: 'Confidence', color: '#7c3aed' },
  { key: 'Pronunciation', color: '#2563eb' },
  { key: 'Listening', color: '#0ea5e9' },
  { key: 'Professionalism', color: '#16a34a' },
  { key: 'Voice Score', color: '#8B0000' },
];

export function VoiceAnalyticsPage() {
  const navigate = useNavigate();
  const { analyses, trends, overallVoiceScore, hasData } = useVoice();

  return (
    <div className="min-h-screen bg-ink-100 dark:bg-ink-950">
      <LearningHeader back={{ label: 'Back to Learning', to: '/learning' }} />
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card-elevated p-6 md:p-8 flex flex-col lg:flex-row lg:items-center gap-6">
          <div className="flex items-center gap-5">
            <ProgressRing value={overallVoiceScore} size={120} strokeWidth={10} label={`${overallVoiceScore}`} sublabel="Voice Score" />
            <div>
              <div className="flex items-center gap-2 text-lava-700 dark:text-lava-400 mb-1">
                <Mic size={18} /><span className="text-sm font-semibold uppercase tracking-wide">Voice Intelligence</span>
              </div>
              <h1 className="section-title text-2xl">Speaking performance</h1>
              <p className="text-sm text-ink-500 dark:text-ink-400 mt-1">
                {hasData ? `Across ${analyses.length} analyzed session${analyses.length === 1 ? '' : 's'}.` : 'Complete a simulation to build your voice profile.'}
              </p>
            </div>
          </div>
          {hasData && (
            <div className="grid grid-cols-2 gap-3 flex-1 max-w-xs lg:ml-auto">
              <StatTile icon={Star} label="Strongest" value={trends.bestMetric} />
              <StatTile icon={Target} label="Focus on" value={trends.focusMetric} />
            </div>
          )}
        </motion.div>

        {!hasData ? (
          <Card className="p-10 text-center">
            <Mic size={26} className="mx-auto text-ink-300 mb-2" />
            <p className="text-sm text-ink-500 dark:text-ink-400 mb-4">No voice sessions analyzed yet.</p>
            <Button onClick={() => navigate('/learning/paths')}>Start a path <ArrowRight size={15} /></Button>
          </Card>
        ) : (
          <>
            {/* Skill trends */}
            <Card className="p-6">
              <h2 className="font-display text-lg font-bold text-ink-800 dark:text-ink-100 mb-2 flex items-center gap-2"><TrendingUp size={20} className="text-lava-600" /> Confidence · Pronunciation · Listening · Professionalism</h2>
              {trends.points.length >= 2 ? <TrendChart data={trends.points} metrics={SKILL_TRENDS} />
                : <div className="h-[280px] flex items-center justify-center text-sm text-ink-500 dark:text-ink-400">Complete two or more sessions to see trends.</div>}
            </Card>

            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h2 className="font-display text-lg font-bold text-ink-800 dark:text-ink-100 mb-2 flex items-center gap-2"><Gauge size={20} className="text-lava-600" /> Speaking Speed</h2>
                {trends.points.length >= 2 ? <TrendChart data={trends.points} metrics={[{ key: 'Speaking Speed', color: '#8B0000' }]} height={240} yDomain={[0, 220]} />
                  : <div className="h-[240px] flex items-center justify-center text-sm text-ink-500 dark:text-ink-400">Not enough data yet.</div>}
              </Card>
              <Card className="p-6">
                <h2 className="font-display text-lg font-bold text-ink-800 dark:text-ink-100 mb-2 flex items-center gap-2"><MessageSquare size={20} className="text-lava-600" /> Filler & Silence Trend</h2>
                {trends.points.length >= 2 ? <TrendChart data={trends.points} metrics={[{ key: 'Fillers/min', color: '#db2777' }, { key: 'Dead Air', color: '#f59e0b' }]} height={240} yDomain={[0, 20]} />
                  : <div className="h-[240px] flex items-center justify-center text-sm text-ink-500 dark:text-ink-400">Not enough data yet.</div>}
              </Card>
            </div>

            {/* Session history */}
            <Card className="p-6">
              <h2 className="font-display text-lg font-bold text-ink-800 dark:text-ink-100 mb-4 flex items-center gap-2"><Activity size={20} className="text-lava-600" /> Voice Sessions</h2>
              <div className="space-y-2">
                {analyses.map((a) => (
                  <button key={a.simulationId} onClick={() => navigate(`/learning/voice/${a.simulationId}`)}
                    className="w-full text-left flex items-center gap-3 p-3 rounded-xl bg-ink-50 dark:bg-ink-800/40 hover:shadow-soft transition-all">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-ink-800 dark:text-ink-100 truncate">{a.moduleName}</p>
                      <p className="text-xs text-ink-500 dark:text-ink-400">{new Date(a.createdAt).toLocaleDateString()} · {a.speech.wpm} WPM · {a.fillers.perMinute} fillers/min</p>
                    </div>
                    <span className="font-display font-bold text-ink-800 dark:text-ink-100">{a.overallVoiceScore}</span>
                    <ArrowRight size={15} className="text-ink-400" />
                  </button>
                ))}
              </div>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
