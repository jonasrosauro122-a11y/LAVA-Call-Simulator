import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, RefreshCw, Play, Target, Clock, Layers, ListChecks, Zap, ChevronDown, AlertTriangle } from 'lucide-react';
import { LearningHeader } from '../components/LearningHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { PersonaCard, DifficultyPips, MetaTile } from '../scenarioEngine/components/ScenarioComponents';
import { useScenario } from '../context/ScenarioContext';
import { getPath, findModule } from '../content/paths';

export function ScenarioPreviewPage() {
  const { pathId, moduleId } = useParams();
  const navigate = useNavigate();
  const { current, generate, regenerate } = useScenario();
  const [showPrompt, setShowPrompt] = useState(false);

  const path = pathId ? getPath(pathId) : undefined;
  const role = path?.positionId ?? path?.id ?? 'general-english';

  useEffect(() => {
    generate({ role, pathId, moduleId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathId, moduleId]);

  if (!current) {
    return (
      <div className="min-h-screen bg-ink-100 dark:bg-ink-950">
        <LearningHeader back={{ label: 'Back', to: pathId ? `/learning/path/${pathId}` : '/learning' }} />
        <main className="max-w-3xl mx-auto px-6 py-16 text-center">
          <p className="text-ink-500 dark:text-ink-400">Generating scenario…</p>
        </main>
      </div>
    );
  }

  const primaryGoal = current.goals.find((g) => g.priority === 'primary') ?? current.goals[0];

  const startSimulation = () => {
    const fm = moduleId ? findModule(moduleId) : undefined;
    const sim = fm ? fm.path.modules[fm.moduleIndex].simulation : { moduleNumber: 4, minScore: 60 };
    try {
      localStorage.setItem('lava_pending_sim', JSON.stringify({
        pathId: pathId ?? current.pathId, moduleId: moduleId ?? current.moduleId,
        moduleNumber: sim.moduleNumber, minScore: sim.minScore, ts: Date.now(),
      }));
    } catch { /* ignore */ }
    navigate(`/module/${sim.moduleNumber}`);
  };

  return (
    <div className="min-h-screen bg-ink-100 dark:bg-ink-950">
      <LearningHeader back={{ label: path ? path.title : 'Back', to: pathId ? `/learning/path/${pathId}` : '/learning' }} />
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card-elevated p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-lava-700 dark:text-lava-400 mb-1">
              <Sparkles size={18} /><span className="text-sm font-semibold uppercase tracking-wide">Scenario Preview</span>
            </div>
            <h1 className="font-display text-2xl font-bold text-ink-800 dark:text-ink-100">{current.scenarioType.label}</h1>
            <p className="text-sm text-ink-500 dark:text-ink-400 mt-1 capitalize">{current.role.replace(/-/g, ' ')} · dynamically generated</p>
            <div className="mt-3"><DifficultyPips difficulty={current.difficulty} /></div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => regenerate()}><RefreshCw size={16} /> Regenerate</Button>
            <Button onClick={startSimulation}><Play size={16} /> Start Simulation</Button>
          </div>
        </motion.div>

        {/* Meta grid (Feature 10) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetaTile icon={Target} label="Primary Goal" value={primaryGoal?.title ?? '—'} />
          <MetaTile icon={Layers} label="Scenario Type" value={current.scenarioType.label} />
          <MetaTile icon={Clock} label="Est. Duration" value={`${current.estimatedMinutes} min`} />
          <MetaTile icon={Zap} label="Difficulty" value={current.difficulty} />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Personality */}
          <PersonaCard personality={current.personality} emotion={current.emotion} />

          {/* Skills + objectives */}
          <div className="space-y-6">
            <Card className="p-5">
              <h3 className="font-display font-bold text-ink-800 dark:text-ink-100 mb-3 flex items-center gap-2"><ListChecks size={18} className="text-lava-600" /> Expected Skills</h3>
              <div className="flex flex-wrap gap-2">
                {current.expectedSkills.map((s) => <span key={s} className="badge bg-ink-50 dark:bg-ink-800/60 text-ink-600 dark:text-ink-300">{s}</span>)}
              </div>
            </Card>
            <Card className="p-5">
              <h3 className="font-display font-bold text-ink-800 dark:text-ink-100 mb-3 flex items-center gap-2"><Target size={18} className="text-lava-600" /> Learning Objectives</h3>
              <ul className="space-y-2">
                {current.learningObjectives.map((o, i) => (
                  <li key={i} className="text-sm text-ink-600 dark:text-ink-300 flex items-start gap-2"><span className="text-lava-500 mt-1">•</span> {o}</li>
                ))}
              </ul>
            </Card>
          </div>
        </div>

        {/* Opening line + potential events */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="p-5">
            <h3 className="font-display font-bold text-ink-800 dark:text-ink-100 mb-2">Opening Line</h3>
            <p className="text-sm text-ink-700 dark:text-ink-200 italic bg-ink-50 dark:bg-ink-800/50 rounded-lg p-3">"{current.openingLine}"</p>
          </Card>
          <Card className="p-5">
            <h3 className="font-display font-bold text-ink-800 dark:text-ink-100 mb-3 flex items-center gap-2"><AlertTriangle size={18} className="text-lava-600" /> Possible Curveballs</h3>
            <div className="space-y-2">
              {current.events.map((e) => (
                <div key={e.id} className="text-sm">
                  <span className="font-medium text-ink-700 dark:text-ink-200">{e.title}</span>
                  <span className="text-ink-500 dark:text-ink-400"> — {e.description}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* AI briefing (LLM-ready prompt) */}
        <Card className="p-5">
          <button onClick={() => setShowPrompt((v) => !v)} className="w-full flex items-center justify-between">
            <h3 className="font-display font-bold text-ink-800 dark:text-ink-100 flex items-center gap-2"><Sparkles size={18} className="text-lava-600" /> AI Briefing (LLM-ready prompt)</h3>
            <ChevronDown size={18} className={`text-ink-400 transition-transform ${showPrompt ? 'rotate-180' : ''}`} />
          </button>
          {showPrompt && (
            <pre className="mt-3 text-xs text-ink-600 dark:text-ink-300 whitespace-pre-wrap bg-ink-50 dark:bg-ink-800/50 rounded-lg p-4 font-mono leading-relaxed">{current.systemPrompt}</pre>
          )}
        </Card>
      </main>
    </div>
  );
}
