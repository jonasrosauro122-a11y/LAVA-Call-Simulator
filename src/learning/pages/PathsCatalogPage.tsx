import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Compass } from 'lucide-react';
import { LearningHeader } from '../components/LearningHeader';
import { PathCard } from '../components/PathCard';
import { useLearning } from '../context/LearningContext';
import { LEARNING_PATHS } from '../content/paths';

export function PathsCatalogPage() {
  const navigate = useNavigate();
  const { getPathProgress, isEnrolled, enrollPath } = useLearning();

  const handleStart = async (pathId: string) => {
    await enrollPath(pathId);
    navigate(`/learning/path/${pathId}`);
  };

  return (
    <div className="min-h-screen bg-ink-100 dark:bg-ink-950">
      <LearningHeader back={{ label: 'Back to Learning', to: '/learning' }} />
      <main className="max-w-7xl mx-auto px-6 py-8">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-2 text-lava-700 dark:text-lava-400 mb-2">
            <Compass size={18} />
            <span className="text-sm font-semibold uppercase tracking-wide">Learning Paths</span>
          </div>
          <h1 className="section-title text-3xl">Choose your path</h1>
          <p className="text-ink-500 dark:text-ink-400 mt-1 max-w-2xl">
            Structured, role-specific courses that take you from fundamentals to a certified, interview-ready communicator.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {LEARNING_PATHS.map((path, i) => (
            <PathCard
              key={path.id}
              path={path}
              progress={getPathProgress(path)}
              enrolled={isEnrolled(path.id)}
              index={i}
              onOpen={() => navigate(`/learning/path/${path.id}`)}
              onStart={() => handleStart(path.id)}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
