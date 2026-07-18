import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GraduationCap, ArrowRight, Award, PlayCircle, MessageSquareText } from 'lucide-react';
import { XpBar } from './XpBar';
import { RankBadge } from './RankBadge';
import { Button } from '../../components/ui/Button';
import { pathIcon } from './icons';
import { useLearning } from '../context/LearningContext';
import { useGamification } from '../context/GamificationContext';
import { useAssessment } from '../../context/AssessmentContext';
import { getPath } from '../content/paths';

// Additive section rendered inside the existing assessment DashboardPage.
// It never alters the surrounding layout — it is a single self-contained block.
export function LearningSummary() {
  const navigate = useNavigate();
  const { moduleScores } = useAssessment();
  const { profile, level, certificates, enrollments, getPathProgress } = useLearning();
  const { rank } = useGamification();

  const activePathId = profile?.active_path ?? enrollments[0]?.path_id ?? null;
  const currentPath = activePathId ? getPath(activePathId) : null;
  const currentProgress = currentPath ? getPathProgress(currentPath) : null;
  const idx = currentProgress ? currentProgress.modules.findIndex((m) => !m.complete) : -1;
  const currentModule = currentPath ? currentPath.modules[idx >= 0 ? idx : 0] : null;
  const Icon = currentPath ? pathIcon(currentPath.icon) : GraduationCap;

  const latestFeedback = moduleScores.flatMap((m) => m.details?.improvements ?? [])[0];

  const resume = () => {
    if (currentPath && currentModule) navigate(`/learning/module/${currentModule.id}`);
    else navigate('/learning/paths');
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-elevated p-6 relative overflow-hidden"
    >
      <div className="absolute -top-16 -right-16 w-48 h-48 bg-lava-700/5 rounded-full blur-3xl" />
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-bold text-ink-800 dark:text-ink-100 flex items-center gap-2">
            <GraduationCap size={20} className="text-lava-600" /> Your Learning Journey
          </h2>
          <button onClick={() => navigate('/learning')} className="btn-ghost text-sm">
            Open Learning <ArrowRight size={15} />
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {/* Level + XP */}
          <div className="md:col-span-1">
            <XpBar level={level} />
            <div className="flex items-center gap-3 mt-4 text-sm flex-wrap">
              <RankBadge rank={rank} size="sm" />
              <span className="flex items-center gap-1.5 text-ink-500 dark:text-ink-400">
                <Award size={15} className="text-lava-600" /> {certificates.length} certificate{certificates.length === 1 ? '' : 's'}
              </span>
            </div>
          </div>

          {/* Current path / module */}
          <div className="md:col-span-2 rounded-xl bg-ink-50 dark:bg-ink-800/50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-xl gradient-lava flex items-center justify-center text-white shrink-0">
                <Icon size={20} />
              </div>
              <div className="min-w-0">
                {currentPath ? (
                  <>
                    <p className="text-xs text-lava-700 dark:text-lava-400 font-semibold">{currentProgress?.progressPct ?? 0}% · {currentPath.title}</p>
                    <p className="font-semibold text-ink-800 dark:text-ink-100 text-sm truncate">Up next: {currentModule?.title}</p>
                    {latestFeedback && (
                      <p className="text-xs text-ink-500 dark:text-ink-400 truncate flex items-center gap-1 mt-0.5">
                        <MessageSquareText size={11} /> {latestFeedback}
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <p className="font-semibold text-ink-800 dark:text-ink-100 text-sm">Start a learning path</p>
                    <p className="text-xs text-ink-500 dark:text-ink-400">Structured courses toward certification.</p>
                  </>
                )}
              </div>
            </div>
            <Button size="sm" onClick={resume} className="shrink-0">
              <PlayCircle size={16} /> {currentPath ? 'Resume' : 'Explore'}
            </Button>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
