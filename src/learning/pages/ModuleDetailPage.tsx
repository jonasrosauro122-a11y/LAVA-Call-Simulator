import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BookOpen, HelpCircle, Dumbbell, Mic2, CheckCircle2, Circle, Target, Clock, ArrowRight, Lock, Wand2,
} from 'lucide-react';
import { LearningHeader } from '../components/LearningHeader';
import { LessonPanel } from '../components/LessonPanel';
import { QuizPanel } from '../components/QuizPanel';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useLearning } from '../context/LearningContext';
import { findModule } from '../content/paths';

export function ModuleDetailPage() {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const { getPathProgress, progressInput, completeLesson, submitQuiz } = useLearning();

  const found = moduleId ? findModule(moduleId) : undefined;
  if (!found) {
    return (
      <div className="min-h-screen bg-ink-100 dark:bg-ink-950">
        <LearningHeader back={{ label: 'Back to Learning', to: '/learning' }} />
        <main className="max-w-3xl mx-auto px-6 py-16 text-center">
          <p className="text-ink-500 dark:text-ink-400">That module could not be found.</p>
          <Button className="mt-4" onClick={() => navigate('/learning/paths')}>Browse paths</Button>
        </main>
      </div>
    );
  }

  const { path, moduleIndex } = found;
  const module = path.modules[moduleIndex];
  const mp = getPathProgress(path).modules[moduleIndex];

  const lessonsAllDone = module.lessons.every((l) => progressInput.completedLessonIds.has(l.id));
  const quizBest = progressInput.quizScores[module.quiz.id];
  const sim = module.simulation;

  return (
    <div className="min-h-screen bg-ink-100 dark:bg-ink-950">
      <LearningHeader back={{ label: path.title, to: `/learning/path/${path.id}` }} />
      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card-elevated p-6">
          <div className="flex items-center gap-2 text-xs text-ink-500 dark:text-ink-400 mb-1">
            <span className="font-mono">Module {moduleIndex + 1}</span>
            <span>·</span>
            <span className="flex items-center gap-1"><Clock size={11} /> {module.estimatedMinutes} min</span>
            {mp.complete && <span className="badge bg-green-50 dark:bg-green-900/20 text-green-600 ml-2"><CheckCircle2 size={12} /> Complete</span>}
          </div>
          <h1 className="font-display text-2xl font-bold text-ink-800 dark:text-ink-100">{module.title}</h1>
          <div className="mt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-lava-700 dark:text-lava-400 flex items-center gap-1.5 mb-1">
              <Target size={13} /> Objectives
            </p>
            <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-1">
              {module.objectives.map((o, i) => (
                <li key={i} className="text-sm text-ink-600 dark:text-ink-300 flex items-start gap-2">
                  <span className="text-lava-500 mt-1">•</span> {o}
                </li>
              ))}
            </ul>
          </div>
        </motion.div>

        {mp.status === 'locked' && (
          <Card className="p-6 flex items-center gap-3">
            <Lock size={20} className="text-ink-400" />
            <p className="text-sm text-ink-500 dark:text-ink-400">Finish the previous module to unlock this one. You can still review its contents below.</p>
          </Card>
        )}

        {/* Lessons */}
        <section>
          <h2 className="section-title mb-3 flex items-center gap-2"><BookOpen size={20} className="text-lava-600" /> Lessons</h2>
          <div className="space-y-3">
            {module.lessons.map((l, i) => (
              <LessonPanel
                key={l.id}
                lesson={l}
                order={i + 1}
                done={progressInput.completedLessonIds.has(l.id)}
                onComplete={() => completeLesson(path.id, module.id, l.id)}
              />
            ))}
          </div>
        </section>

        {/* Practice */}
        {module.practice.length > 0 && (
          <section>
            <h2 className="section-title mb-3 flex items-center gap-2"><Dumbbell size={20} className="text-lava-600" /> Practice activities</h2>
            <div className="space-y-3">
              {module.practice.map((p) => (
                <Card key={p.id} className="p-4">
                  <h4 className="font-semibold text-ink-800 dark:text-ink-100 text-sm">{p.title}</h4>
                  <p className="text-xs text-ink-500 dark:text-ink-400 mt-0.5">{p.instructions}</p>
                  {p.prompt && <p className="mt-2 text-sm text-ink-700 dark:text-ink-200 italic bg-ink-50 dark:bg-ink-800/50 rounded-lg p-3">"{p.prompt}"</p>}
                  {p.terms && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {p.terms.map((t) => (
                        <span key={t.term} className="badge bg-ink-50 dark:bg-ink-800/60 text-ink-600 dark:text-ink-300">{t.term}</span>
                      ))}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Quiz */}
        <section>
          <h2 className="section-title mb-3 flex items-center gap-2"><HelpCircle size={20} className="text-lava-600" /> Knowledge check</h2>
          <QuizPanel
            quiz={module.quiz}
            locked={!lessonsAllDone}
            bestScore={quizBest}
            onSubmit={(answers) => submitQuiz(path.id, module.id, module.quiz, answers)}
          />
        </section>

        {/* Simulation requirement */}
        <section>
          <h2 className="section-title mb-3 flex items-center gap-2"><Mic2 size={20} className="text-lava-600" /> AI simulation</h2>
          <Card className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h4 className="font-semibold text-ink-800 dark:text-ink-100">{sim.moduleName}</h4>
              <p className="text-sm text-ink-500 dark:text-ink-400 mt-0.5">{sim.description}</p>
              <p className="text-xs text-ink-500 dark:text-ink-400 mt-2">
                Required score: <span className="font-semibold text-ink-700 dark:text-ink-200">{sim.minScore}/100</span>
                {mp.simulationScore != null && <> · Your best: <span className={mp.simulationPassed ? 'text-green-600 font-semibold' : 'font-semibold'}>{Math.round(mp.simulationScore)}</span></>}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 shrink-0">
              <Button variant="secondary" onClick={() => navigate(`/learning/scenario/${path.id}/${module.id}`)}>
                <Wand2 size={16} /> Preview AI scenario
              </Button>
              <Button onClick={() => {
                try {
                  localStorage.setItem('lava_pending_sim', JSON.stringify({
                    pathId: path.id, moduleId: module.id, moduleNumber: sim.moduleNumber, minScore: sim.minScore, ts: Date.now(),
                  }));
                } catch { /* ignore */ }
                navigate(`/module/${sim.moduleNumber}`);
              }}>
                Launch simulator <ArrowRight size={16} />
              </Button>
            </div>
          </Card>
        </section>

        {/* Completion checklist */}
        <section>
          <h2 className="section-title mb-3 flex items-center gap-2"><CheckCircle2 size={20} className="text-lava-600" /> Completion checklist</h2>
          <Card className="p-5 space-y-3">
            {[
              { label: `Complete all ${module.lessons.length} lessons`, done: lessonsAllDone },
              { label: `Pass the knowledge check (${module.quiz.passingScore}%)`, done: mp.quizPassed },
              { label: `Score ${sim.minScore}+ on the ${sim.moduleName} simulation`, done: mp.simulationPassed },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                {item.done ? <CheckCircle2 size={18} className="text-green-600 shrink-0" /> : <Circle size={18} className="text-ink-300 shrink-0" />}
                <span className={`text-sm ${item.done ? 'text-ink-700 dark:text-ink-200' : 'text-ink-500 dark:text-ink-400'}`}>{item.label}</span>
              </div>
            ))}
            <div className={`mt-2 rounded-xl p-3 text-sm font-medium ${
              mp.complete ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'bg-ink-50 dark:bg-ink-800/50 text-ink-500 dark:text-ink-400'
            }`}>
              {mp.complete ? 'Module complete — the next module is unlocked.' : 'Finish all three steps to complete this module.'}
            </div>
          </Card>
        </section>
      </main>
    </div>
  );
}
