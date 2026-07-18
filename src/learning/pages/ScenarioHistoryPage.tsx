import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { History, Cpu, ArrowRight, User } from 'lucide-react';
import { LearningHeader } from '../components/LearningHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EmotionChip } from '../scenarioEngine/components/ScenarioComponents';
import { useScenario } from '../context/ScenarioContext';
import type { Emotion } from '../scenarioEngine/types';

export function ScenarioHistoryPage() {
  const navigate = useNavigate();
  const { history } = useScenario();

  return (
    <div className="min-h-screen bg-ink-100 dark:bg-ink-950">
      <LearningHeader back={{ label: 'Back to Learning', to: '/learning' }} />
      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-lava-700 dark:text-lava-400 mb-1">
              <History size={18} /><span className="text-sm font-semibold uppercase tracking-wide">Scenario History</span>
            </div>
            <h1 className="section-title text-3xl">Generated scenarios</h1>
          </div>
          <Button variant="secondary" onClick={() => navigate('/learning/ai-settings')}><Cpu size={16} /> AI Settings</Button>
        </motion.div>

        {history.length === 0 ? (
          <Card className="p-8 text-center">
            <History size={24} className="mx-auto text-ink-300 mb-2" />
            <p className="text-sm text-ink-500 dark:text-ink-400 mb-3">No scenarios generated yet. Preview one from any module.</p>
            <Button size="sm" onClick={() => navigate('/learning/paths')}>Browse paths <ArrowRight size={15} /></Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {history.map((h, i) => (
              <motion.div key={h.scenario_id + i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <Card className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl gradient-lava flex items-center justify-center text-white shrink-0"><User size={18} /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm text-ink-800 dark:text-ink-100">{h.scenario_type}</p>
                      <EmotionChip emotion={h.emotion as Emotion} />
                      <span className="badge bg-ink-50 dark:bg-ink-800/60 text-ink-500">{h.difficulty}</span>
                    </div>
                    <p className="text-xs text-ink-500 dark:text-ink-400 mt-0.5 capitalize">
                      {h.personality} · {h.role.replace(/-/g, ' ')} · {h.goals.join(', ')}
                    </p>
                  </div>
                  <span className="text-xs text-ink-400 shrink-0">{h.created_at ? new Date(h.created_at).toLocaleDateString() : ''}</span>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
