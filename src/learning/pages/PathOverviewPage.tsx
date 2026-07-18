import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Layers, Zap, Target, Sparkles, ArrowRight, ListChecks } from 'lucide-react';
import { LearningHeader } from '../components/LearningHeader';
import { ModuleListItem } from '../components/ModuleListItem';
import { CertificateCard } from '../components/CertificateCard';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ProgressRing } from '../../components/ui/ProgressRing';
import { pathIcon } from '../components/icons';
import { useLearning } from '../context/LearningContext';
import { useAssessment } from '../../context/AssessmentContext';
import { getPath } from '../content/paths';
import { xpFor } from '../lib/xpEngine';

export function PathOverviewPage() {
  const { pathId } = useParams();
  const navigate = useNavigate();
  const { candidate } = useAssessment();
  const { getPathProgress, isEnrolled, enrollPath, certificates } = useLearning();

  const path = pathId ? getPath(pathId) : undefined;
  if (!path) {
    return (
      <div className="min-h-screen bg-ink-100 dark:bg-ink-950">
        <LearningHeader back={{ label: 'Back to Paths', to: '/learning/paths' }} />
        <main className="max-w-3xl mx-auto px-6 py-16 text-center">
          <p className="text-ink-500 dark:text-ink-400">That learning path could not be found.</p>
          <Button className="mt-4" onClick={() => navigate('/learning/paths')}>Browse paths</Button>
        </main>
      </div>
    );
  }

  const progress = getPathProgress(path);
  const enrolled = isEnrolled(path.id);
  const Icon = pathIcon(path.icon);
  const totalXp = path.modules.reduce((s, m) => s + m.xpReward, 0) + xpFor('path_complete');
  const cert = certificates.find((c) => c.path_id === path.id);

  const nextModuleIndex = Math.max(
    0,
    progress.modules.findIndex((m) => m.status === 'in_progress' || m.status === 'available'),
  );

  const handleStart = async () => {
    await enrollPath(path.id);
    const target = path.modules[nextModuleIndex] ?? path.modules[0];
    navigate(`/learning/module/${target.id}`);
  };

  const objectives = path.modules.flatMap((m) => m.objectives);

  return (
    <div className="min-h-screen bg-ink-100 dark:bg-ink-950">
      <LearningHeader back={{ label: 'Back to Paths', to: '/learning/paths' }} />
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card-elevated p-6 md:p-8 relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-lava-700/5 rounded-full blur-3xl" />
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl gradient-lava flex items-center justify-center text-white shrink-0">
                <Icon size={26} />
              </div>
              <div>
                <span className="badge bg-lava-50 dark:bg-lava-950/40 text-lava-700 dark:text-lava-400">{path.level}</span>
                <h1 className="font-display text-3xl font-bold text-ink-800 dark:text-ink-100 mt-2">{path.title}</h1>
                <p className="text-ink-500 dark:text-ink-400 mt-1 max-w-xl">{path.tagline}</p>
                <div className="flex flex-wrap gap-4 mt-3 text-sm text-ink-500 dark:text-ink-400">
                  <span className="flex items-center gap-1.5"><Clock size={14} /> {path.estimatedHours}h to complete</span>
                  <span className="flex items-center gap-1.5"><Layers size={14} /> {path.modules.length} modules</span>
                  <span className="flex items-center gap-1.5"><Zap size={14} /> {totalXp} XP</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-center gap-3">
              <ProgressRing value={progress.progressPct} size={110} label={`${progress.progressPct}%`} sublabel="Complete" />
              <Button onClick={handleStart} size="lg">
                {enrolled ? (progress.complete ? 'Review Path' : 'Continue Learning') : 'Start Learning'} <ArrowRight size={18} />
              </Button>
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: overview + modules */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <h2 className="font-display text-lg font-bold text-ink-800 dark:text-ink-100 mb-2">Overview</h2>
              <p className="text-sm text-ink-600 dark:text-ink-300 leading-relaxed">{path.description}</p>
            </Card>

            <div>
              <h2 className="section-title mb-4 flex items-center gap-2"><Layers size={20} className="text-lava-600" /> Modules</h2>
              <div className="space-y-3">
                {path.modules.map((m, i) => (
                  <ModuleListItem
                    key={m.id}
                    module={m}
                    progress={progress.modules[i]}
                    order={i + 1}
                    index={i}
                    onOpen={() => navigate(`/learning/module/${m.id}`)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Right: objectives, skills, certificate */}
          <div className="space-y-6">
            <Card className="p-5">
              <h3 className="font-display font-bold text-ink-800 dark:text-ink-100 mb-3 flex items-center gap-2">
                <Target size={18} className="text-lava-600" /> Learning objectives
              </h3>
              <ul className="space-y-2">
                {objectives.slice(0, 8).map((o, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-ink-600 dark:text-ink-300">
                    <ListChecks size={15} className="text-lava-500 mt-0.5 shrink-0" /> {o}
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="p-5">
              <h3 className="font-display font-bold text-ink-800 dark:text-ink-100 mb-3 flex items-center gap-2">
                <Sparkles size={18} className="text-lava-600" /> Skills you'll learn
              </h3>
              <div className="flex flex-wrap gap-2">
                {path.skills.map((s) => (
                  <span key={s} className="badge bg-ink-50 dark:bg-ink-800/60 text-ink-600 dark:text-ink-300">{s}</span>
                ))}
              </div>
            </Card>

            <CertificateCard
              pathTitle={path.title}
              candidateName={candidate ? `${candidate.first_name} ${candidate.last_name}` : undefined}
              score={cert?.score}
              issuedAt={cert?.issued_at}
              earned={!!cert}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
