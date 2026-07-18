import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Activity, Clock, MessageSquareText, Radar as RadarIcon, ListChecks, Sparkles } from 'lucide-react';
import { LearningHeader } from '../components/LearningHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ProgressRing } from '../../components/ui/ProgressRing';
import { SkillRadar } from '../analysis/components/SkillRadar';
import { SkillBar, TimelineView, CoachReport, RecommendationList } from '../analysis/components/AnalysisComponents';
import { useAnalysis } from '../context/AnalysisContext';
import { buildTimeline } from '../analysis/timelineEngine';
import { generateAICoach } from '../analysis/coachEngine';
import { recommend } from '../analysis/recommendationEngine';
import { METRICS, type RadarAxis } from '../analysis/types';

export function SimulationAnalysisPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getAnalysis } = useAnalysis();
  const a = id ? getAnalysis(id) : undefined;

  if (!a) {
    return (
      <div className="min-h-screen bg-ink-100 dark:bg-ink-950">
        <LearningHeader back={{ label: 'Analytics', to: '/learning/analytics' }} />
        <main className="max-w-3xl mx-auto px-6 py-16 text-center">
          <p className="text-ink-500 dark:text-ink-400">That simulation analysis could not be found.</p>
          <Button className="mt-4" onClick={() => navigate('/learning/analytics')}>Go to Analytics</Button>
        </main>
      </div>
    );
  }

  const timeline = buildTimeline(a);
  const coach = generateAICoach(a);
  const recs = recommend(a.scores);
  const radar: RadarAxis[] = [
    { skill: 'Communication', score: a.scores['Clarity'] },
    { skill: 'Grammar', score: a.scores['Grammar'] },
    { skill: 'Confidence', score: a.scores['Speaking Confidence'] },
    { skill: 'Listening', score: a.scores['Listening Skills'] },
    { skill: 'Critical Thinking', score: a.scores['Critical Thinking'] },
    { skill: 'Professionalism', score: a.scores['Professionalism'] },
    { skill: 'Empathy', score: a.scores['Empathy'] },
    { skill: 'Sales', score: a.scores['Sales Skills'] },
    { skill: 'Customer Service', score: a.scores['Customer Focus'] },
  ];

  return (
    <div className="min-h-screen bg-ink-100 dark:bg-ink-950">
      <LearningHeader back={{ label: 'Analytics', to: '/learning/analytics' }} />
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card-elevated p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-lava-700 dark:text-lava-400 mb-1">
              <Activity size={18} /><span className="text-sm font-semibold uppercase tracking-wide">Simulation Analysis</span>
            </div>
            <h1 className="font-display text-2xl font-bold text-ink-800 dark:text-ink-100">{a.moduleName}</h1>
            <p className="text-sm text-ink-500 dark:text-ink-400 mt-1 max-w-xl">{a.scenario}</p>
            <div className="flex flex-wrap gap-4 mt-3 text-sm text-ink-500 dark:text-ink-400">
              <span className="flex items-center gap-1.5"><Clock size={14} /> {Math.round(a.durationSeconds)}s</span>
              <span>{new Date(a.timestamp).toLocaleString()}</span>
              {a.pathTitle && <span>{a.pathTitle}</span>}
            </div>
          </div>
          <div className="flex items-center gap-5">
            <ProgressRing value={a.overallScore} size={104} label={`${a.overallScore}`} sublabel="Overall" />
            <ProgressRing value={a.communicationScore} size={104} label={`${a.communicationScore}`} sublabel="Comms" color="#2563eb" />
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Timeline */}
          <Card className="p-6">
            <h2 className="font-display text-lg font-bold text-ink-800 dark:text-ink-100 mb-4 flex items-center gap-2">
              <ListChecks size={20} className="text-lava-600" /> Conversation Timeline
            </h2>
            <TimelineView segments={timeline} />
          </Card>

          {/* Radar */}
          <Card className="p-6">
            <h2 className="font-display text-lg font-bold text-ink-800 dark:text-ink-100 mb-2 flex items-center gap-2">
              <RadarIcon size={20} className="text-lava-600" /> Skill Radar
            </h2>
            <SkillRadar axes={radar} />
          </Card>
        </div>

        {/* Full metric breakdown */}
        <Card className="p-6">
          <h2 className="font-display text-lg font-bold text-ink-800 dark:text-ink-100 mb-4">Communication Metrics</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-3">
            {METRICS.map((m) => <SkillBar key={m} label={m} score={a.scores[m]} />)}
          </div>
        </Card>

        {/* AI coach */}
        <Card className="p-6">
          <h2 className="font-display text-lg font-bold text-ink-800 dark:text-ink-100 mb-4 flex items-center gap-2">
            <MessageSquareText size={20} className="text-lava-600" /> AI Coach
          </h2>
          <CoachReport report={coach} onNavigate={navigate} />
        </Card>

        {/* Recommendations */}
        <Card className="p-6">
          <h2 className="font-display text-lg font-bold text-ink-800 dark:text-ink-100 mb-4 flex items-center gap-2">
            <Sparkles size={20} className="text-lava-600" /> Recommended Next Steps
          </h2>
          <RecommendationList items={recs} onNavigate={navigate} />
        </Card>
      </main>
    </div>
  );
}
