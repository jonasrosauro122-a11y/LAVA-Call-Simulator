import { useNavigate } from 'react-router-dom';
import { Moon, Sun, LayoutDashboard, BookOpen, ArrowLeft, Trophy, BarChart3, User, Activity, Wand2 } from 'lucide-react';
import { Logo } from '../../components/ui/Logo';
import { useTheme } from '../../context/ThemeContext';

interface LearningHeaderProps {
  back?: { label: string; to: string };
}

// Sticky top bar matching the existing app header (glass + Logo + ghost buttons).
export function LearningHeader({ back }: LearningHeaderProps) {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-20 glass border-b border-ink-200/60 dark:border-ink-800/60">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {back ? (
            <button onClick={() => navigate(back.to)} className="btn-ghost text-sm">
              <ArrowLeft size={16} /> {back.label}
            </button>
          ) : (
            <Logo size="sm" />
          )}
        </div>
        <div className="flex items-center gap-1 sm:gap-2 flex-wrap justify-end">
          <button onClick={() => navigate('/learning')} className="btn-ghost text-sm" aria-label="Learning dashboard">
            <LayoutDashboard size={16} /> <span className="hidden md:inline">Learning</span>
          </button>
          <button onClick={() => navigate('/learning/paths')} className="btn-ghost text-sm" aria-label="Learning paths">
            <BookOpen size={16} /> <span className="hidden md:inline">Paths</span>
          </button>
          <button onClick={() => navigate('/learning/analytics')} className="btn-ghost text-sm" aria-label="Analytics">
            <Activity size={16} /> <span className="hidden md:inline">Analytics</span>
          </button>
          <button onClick={() => navigate('/learning/scenarios')} className="btn-ghost text-sm" aria-label="Scenarios">
            <Wand2 size={16} /> <span className="hidden md:inline">Scenarios</span>
          </button>
          <button onClick={() => navigate('/learning/trophies')} className="btn-ghost text-sm" aria-label="Trophy room">
            <Trophy size={16} /> <span className="hidden md:inline">Trophies</span>
          </button>
          <button onClick={() => navigate('/learning/leaderboard')} className="btn-ghost text-sm" aria-label="Leaderboard">
            <BarChart3 size={16} /> <span className="hidden md:inline">Leaderboard</span>
          </button>
          <button onClick={() => navigate('/learning/profile')} className="btn-ghost text-sm" aria-label="Profile">
            <User size={16} /> <span className="hidden md:inline">Profile</span>
          </button>
          <button onClick={() => navigate('/dashboard')} className="btn-ghost text-sm hidden sm:inline-flex">Assessment</button>
          <button onClick={toggleTheme} className="btn-ghost" aria-label="Toggle theme">
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>
        </div>
      </div>
    </header>
  );
}
